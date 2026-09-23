import type { Request, Response } from "express";
import { Prisma, type Currency, type ServiceType, type ShipmentStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { createAuditLog } from "../services/audit.service.js";
import { clientIp } from "../utils/generators.js";
import { str } from "../utils/str.js";
import { COMMISSION_RATE, EUR_TO_MGA, getTransitaire, listTransitaires } from "../services/transitaire.service.js";

const paginate = (page: string | undefined = "1", pageSize: string | undefined = "10") => {
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const size = Math.min(100, Math.max(1, Number.parseInt(pageSize, 10) || 10));
  return { skip: (pageNum - 1) * size, take: size, page: pageNum, pageSize: size };
};

/** Filtre les colis appartenant au transporteur du transitaire connecté. */
function carrierWhere(req: Request): Prisma.ShipmentWhereInput {
  const carrierId = req.user?.carrierId ?? null;
  return { carrierId };
}

const listShipments = asyncHandler(async (req: Request, res: Response) => {
  const { skip, take, page, pageSize } = paginate(str(req.query.page), str(req.query.pageSize));
  const where: Prisma.ShipmentWhereInput = {
    ...carrierWhere(req),
    ...(req.query.status ? { status: str(req.query.status) as ShipmentStatus } : {}),
    ...(req.query.q
      ? { trackingNumber: { contains: (str(req.query.q)).toUpperCase() } }
      : {}),
  };

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    }),
    prisma.shipment.count({ where }),
  ]);

  res.json({ success: true, shipments, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

const getShipment = asyncHandler(async (req: Request, res: Response) => {
  const shipment = await prisma.shipment.findFirst({
    where: { id: str(req.params.id), ...carrierWhere(req) },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
      payments: true,
      documents: true,
    },
  });
  if (!shipment) throw new ApiError(404, "Colis introuvable ou non assigné à votre transporteur", "NOT_FOUND");
  res.json({ success: true, shipment });
});

const updateShipmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, comment, location } = req.body;
  const existing = await prisma.shipment.findFirst({
    where: { id: str(req.params.id), ...carrierWhere(req) },
  });
  if (!existing) throw new ApiError(404, "Colis introuvable ou non assigné à votre transporteur", "NOT_FOUND");

  const updated = await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.update({
      where: { id: existing.id },
      data: {
        status,
        ...(status === "DELIVERED" ? { actualDeliveryDate: new Date() } : {}),
      },
      include: {
        statusHistory: { orderBy: { createdAt: "asc" } },
        items: true,
      },
    });

    await tx.shipmentStatusHistory.create({
      data: {
        shipmentId: existing.id,
        status,
        comment: comment ?? null,
        location: location ?? null,
        changedBy: req.user!.id,
      },
    });

    return shipment;
  });

  await createAuditLog({
    userId: req.user!.id,
    action: "TRANSITAIRE.SHIPMENT_STATUS",
    entityType: "Shipment",
    entityId: existing.id,
    oldValues: { status: existing.status },
    newValues: { status },
    ipAddress: clientIp(req),
  });

  res.json({ success: true, message: "Statut mis à jour", shipment: updated });
});

const IN_TRANSIT_STATUSES: ShipmentStatus[] = ["RECEIVED", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY"];
const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const number = (v: unknown) => Number(v ?? 0);
const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;
/** Convertit un montant en ariary selon sa devise (EUR → Ar, MGA inchangé). */
const valueAr = (currency: string, amount: number) => (currency === "EUR" ? amount * EUR_TO_MGA : amount);

/** CRM transitaire : tableau de bord riche (KPIs, volumes, répartition, clients, activités). */
const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const where = carrierWhere(req);

  const [shipments, recent, activities, payments] = await Promise.all([
    prisma.shipment.findMany({
      where,
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        serviceType: true,
        currency: true,
        estimatedPrice: true,
        totalWeight: true,
        createdAt: true,
        actualDeliveryDate: true,
        originCity: true,
        destinationCity: true,
        destinationCountry: true,
        userId: true,
        user: { select: { name: true, email: true, phone: true, city: true } },
      },
    }),
    prisma.shipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        currency: true,
        estimatedPrice: true,
        originCity: true,
        destinationCity: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.shipmentStatusHistory.findMany({
      where: { shipment: { carrierId: req.user?.carrierId ?? null } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        comment: true,
        location: true,
        createdAt: true,
        shipment: { select: { trackingNumber: true } },
      },
    }),
    prisma.payment.findMany({
      where: { shipment: { carrierId: req.user?.carrierId ?? null } },
      select: { status: true, amount: true, currency: true },
    }),
  ]);

  // ---- KPI
  const countByStatus = new Map<ShipmentStatus, number>();
  let totalValueAr = 0;
  let totalWeight = 0;
  let newThisMonth = 0;
  const clientIds = new Set<string>();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const deliveredDates: number[] = [];

  for (const s of shipments) {
    countByStatus.set(s.status, (countByStatus.get(s.status) ?? 0) + 1);
    totalValueAr += valueAr(s.currency, number(s.estimatedPrice));
    totalWeight += number(s.totalWeight);
    if (s.createdAt >= monthStart) newThisMonth += 1;
    clientIds.add(s.userId);
    if (s.status === "DELIVERED" && s.actualDeliveryDate) {
      deliveredDates.push((s.actualDeliveryDate.getTime() - s.createdAt.getTime()) / 86400000);
    }
  }
  const deliveredCount = countByStatus.get("DELIVERED") ?? 0;
  const inTransit = IN_TRANSIT_STATUSES.reduce((sum, st) => sum + (countByStatus.get(st) ?? 0), 0);
  const commissionAr = Math.round(totalValueAr * COMMISSION_RATE);
  const avgDeliveryDays = deliveredDates.length ? round1(deliveredDates.reduce((a, b) => a + b, 0) / deliveredDates.length) : null;

  // ---- Volume mensuel (12 derniers mois)
  const monthBuckets: Array<{ key: string; label: string; total: number; delivered: number; revenueAr: number }> = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS_FR[d.getMonth()], total: 0, delivered: 0, revenueAr: 0 });
  }
  const monthIndex = new Map(monthBuckets.map((m, i) => [m.key, i]));
  for (const s of shipments) {
    const idx = monthIndex.get(`${s.createdAt.getFullYear()}-${s.createdAt.getMonth()}`);
    if (idx === undefined) continue;
    monthBuckets[idx].total += 1;
    monthBuckets[idx].revenueAr += valueAr(s.currency, number(s.estimatedPrice));
    if (s.status === "DELIVERED") monthBuckets[idx].delivered += 1;
  }

  // ---- Répartition par service / destination
  const serviceMap = new Map<string, { count: number; revenueAr: number }>();
  const cityMap = new Map<string, { count: number; revenueAr: number }>();
  for (const s of shipments) {
    const revenue = valueAr(s.currency, number(s.estimatedPrice));
    const sv = serviceMap.get(s.serviceType) ?? { count: 0, revenueAr: 0 };
    sv.count += 1;
    sv.revenueAr += revenue;
    serviceMap.set(s.serviceType, sv);

    const cityKey = `${s.destinationCity}, ${s.destinationCountry}`;
    const c = cityMap.get(cityKey) ?? { count: 0, revenueAr: 0 };
    c.count += 1;
    c.revenueAr += revenue;
    cityMap.set(cityKey, c);
  }
  const byService = [...serviceMap.entries()].map(([serviceType, v]) => ({ serviceType, count: v.count, revenueAr: round2(v.revenueAr) }));
  const byCity = [...cityMap.entries()]
    .map(([city, v]) => ({ city, count: v.count, revenueAr: round2(v.revenueAr) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ---- Top clients
  const clientAgg = new Map<string, { count: number; delivered: number; revenueAr: number; lastTrip: Date }>();
  for (const s of shipments) {
    const agg = clientAgg.get(s.userId) ?? { count: 0, delivered: 0, revenueAr: 0, lastTrip: s.createdAt };
    agg.count += 1;
    agg.revenueAr += valueAr(s.currency, number(s.estimatedPrice));
    if (s.status === "DELIVERED") agg.delivered += 1;
    if (s.createdAt > agg.lastTrip) agg.lastTrip = s.createdAt;
    clientAgg.set(s.userId, agg);
  }
  const topClients = [...clientAgg.entries()]
    .map(([userId, agg]) => ({ id: userId, count: agg.count, delivered: agg.delivered, revenueAr: round2(agg.revenueAr), lastTrip: agg.lastTrip }))
    .sort((a, b) => b.revenueAr - a.revenueAr)
    .slice(0, 6);
  for (const client of topClients) {
    const u = shipments.find((s) => s.userId === client.id)?.user;
    Object.assign(client, { name: u?.name ?? "Client", email: u?.email ?? null, phone: u?.phone ?? null, city: u?.city ?? null });
  }

  // ---- Colis à traiter
  const pendingShipments = shipments
    .filter((s) => s.status === "PENDING" || s.status === "RECEIVED")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .slice(0, 6);

  const byStatus = [...countByStatus.entries()].map(([status, count]) => ({
    status,
    _count: { _all: count },
    _sum: {
      estimatedPrice: round2(shipments.filter((s) => s.status === status).reduce((sum, s) => sum + number(s.estimatedPrice), 0)),
    },
  }));

  const paidPayments = payments.filter((p) => p.status === "PAID");
  const paidAr = paidPayments.reduce((sum, p) => sum + valueAr(p.currency, number(p.amount)), 0);

  res.json({
    success: true,
    stats: {
      total: shipments.length,
      delivered: deliveredCount,
      byStatus,
      eurToMga: EUR_TO_MGA,
      commissionRate: COMMISSION_RATE,
      commissionRateLabel: `${Math.round(COMMISSION_RATE * 100)} %`,
      kpis: {
        pending: countByStatus.get("PENDING") ?? 0,
        inTransit,
        delivered: deliveredCount,
        cancelled: countByStatus.get("CANCELLED") ?? 0,
        clients: clientIds.size,
        newThisMonth,
        totalValueAr: round2(totalValueAr),
        totalValueEur: round2(totalValueAr / EUR_TO_MGA),
        commissionAr,
        netAr: round2(totalValueAr - commissionAr),
        paidAr: round2(paidAr),
        avgWeightKg: shipments.length ? round1(totalWeight / shipments.length) : 0,
        avgDeliveryDays,
      },
      volumeByMonth: monthBuckets,
      byService,
      byCity,
      topClients,
      activities,
      pendingShipments,
      recent,
    },
  });
});

const getClients = asyncHandler(async (req: Request, res: Response) => {
  const { skip, take, page, pageSize } = paginate(str(req.query.page), str(req.query.pageSize));
  const q = str(req.query.q).trim().toLowerCase();

  const shipments = await prisma.shipment.findMany({
    where: carrierWhere(req),
    select: { userId: true, estimatedPrice: true, currency: true, status: true, createdAt: true },
  });

  const clientAgg = new Map<string, { count: number; delivered: number; revenueAr: number; lastTrip: Date }>();
  for (const s of shipments) {
    const agg = clientAgg.get(s.userId) ?? { count: 0, delivered: 0, revenueAr: 0, lastTrip: s.createdAt };
    agg.count += 1;
    agg.revenueAr += valueAr(s.currency, number(s.estimatedPrice));
    if (s.status === "DELIVERED") agg.delivered += 1;
    if (s.createdAt > agg.lastTrip) agg.lastTrip = s.createdAt;
    clientAgg.set(s.userId, agg);
  }

  const ids = [...clientAgg.keys()];
  const users = ids.length
    ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true, phone: true, city: true, country: true, createdAt: true } })
    : [];

  const clientByUser = new Map(users.map((u) => [u.id, u]));
  const clients = ids
    .map((id) => {
      const u = clientByUser.get(id);
      const agg = clientAgg.get(id)!;
      return {
        id,
        name: u?.name ?? "Client",
        email: u?.email ?? null,
        phone: u?.phone ?? null,
        city: u?.city ?? null,
        country: u?.country ?? null,
        memberSince: u?.createdAt ?? null,
        shipments: agg.count,
        delivered: agg.delivered,
        revenueAr: round2(agg.revenueAr),
        lastTrip: agg.lastTrip,
      };
    })
    .filter((c) => !q || c.name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q) || (c.phone ?? "").toLowerCase().includes(q))
    .sort((a, b) => b.revenueAr - a.revenueAr);

  const total = clients.length;
  const pageClients = clients.slice(skip, skip + take);

  res.json({ success: true, clients: pageClients, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

const getPayments = asyncHandler(async (req: Request, res: Response) => {
  const { skip, take, page, pageSize } = paginate(str(req.query.page), str(req.query.pageSize));
  const where: Prisma.PaymentWhereInput = { shipment: { carrierId: req.user?.carrierId ?? null } };

  const [payments, total, all] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { shipment: { select: { trackingNumber: true } } },
    }),
    prisma.payment.count({ where }),
    prisma.payment.findMany({ where, select: { status: true, amount: true, currency: true } }),
  ]);

  const paid = all.filter((p) => p.status === "PAID");
  const pendingPayments = all.filter((p) => p.status === "PENDING");
  const failed = all.filter((p) => p.status === "FAILED");
  const refunded = all.filter((p) => p.status === "REFUNDED");
  const sumAr = (arr: typeof all) => arr.reduce((sum, p) => sum + valueAr(p.currency, number(p.amount)), 0);

  res.json({
    success: true,
    summary: {
      paidCount: paid.length,
      pendingCount: pendingPayments.length,
      failedCount: failed.length,
      refundedCount: refunded.length,
      totalCount: all.length,
      totalAr: round2(sumAr(all)),
      paidAr: round2(sumAr(paid)),
      pendingAr: round2(sumAr(pendingPayments)),
    },
    payments: payments.map((p) => ({
      id: p.id,
      paymentReference: p.paymentReference,
      provider: p.provider,
      method: p.method,
      amount: number(p.amount),
      currency: p.currency,
      status: p.status,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
      trackingNumber: p.shipment.trackingNumber,
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

const exportShipments = asyncHandler(async (req: Request, res: Response) => {
  const where: Prisma.ShipmentWhereInput = {
    ...carrierWhere(req),
    ...(req.query.status ? { status: str(req.query.status) as ShipmentStatus } : {}),
  };
  const shipments = await prisma.shipment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });

  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["Référence", "Statut", "Client", "Email", "Téléphone", "Origine", "Destination", "Service", "Poids (kg)", "Valeur déclarée", "Devise", "Prix estimé", "Créé le", "Livré le", "Commentaire"];
  const rows = shipments.map((s) => [
    s.trackingNumber,
    s.status,
    s.user?.name ?? "",
    s.user?.email ?? "",
    s.user?.phone ?? "",
    `${s.originCity}, ${s.originCountry}`,
    `${s.destinationCity}, ${s.destinationCountry}`,
    s.serviceType,
    s.totalWeight,
    s.declaredValue,
    s.currency,
    s.estimatedPrice,
    s.createdAt.toISOString(),
    s.actualDeliveryDate ? s.actualDeliveryDate.toISOString() : "",
    s.notes ?? "",
  ]);

  const csv = [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="madacolis-colis-${req.user?.carrierId ?? "madacolis"}-${stamp}.csv"`);
  res.status(200).send(`\uFEFF${csv}`);
});

const getStats = getDashboard;

const getTeam = asyncHandler(async (req: Request, res: Response) => {
  const carrierId = req.user?.carrierId ?? null;
  const [users, grouped] = await Promise.all([
    prisma.user.findMany({
      where: { carrierId },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.shipment.groupBy({ by: ["userId"], where: { carrierId }, _count: { _all: true } }),
  ]);
  const countByUser = new Map(grouped.map((g) => [g.userId, g._count._all]));
  res.json({
    success: true,
    team: users.map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, isActive: u.isActive, createdAt: u.createdAt, shipments: countByUser.get(u.id) ?? 0 })),
  });
});

const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { skip, take, page, pageSize } = paginate(str(req.query.page), str(req.query.pageSize));
  const where: Prisma.DocumentWhereInput = { shipment: { carrierId: req.user?.carrierId ?? null } };
  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { shipment: { select: { trackingNumber: true } } },
    }),
    prisma.document.count({ where }),
  ]);
  res.json({
    success: true,
    documents: documents.map((d) => ({
      id: d.id,
      type: d.type,
      status: d.status,
      originalName: d.originalName,
      mimeType: d.mimeType,
      createdAt: d.createdAt,
      trackingNumber: d.shipment.trackingNumber,
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  PENDING: "En attente",
  RECEIVED: "Reçu",
  IN_TRANSIT: "En transit",
  IN_CUSTOMS: "En douane",
  OUT_FOR_DELIVERY: "En cours de livraison",
  DELIVERED: "Livré",
  CANCELLED: "Annulé",
};

const createShipment = asyncHandler(async (req: Request, res: Response) => {
  const b = req.body ?? {};
  const rawPhone = String(b.clientPhone ?? "").trim().replace(/\s+/g, "");
  const digits = rawPhone.replace(/\D/g, "");
  const client = digits
    ? await prisma.user.findFirst({
        where: { role: "CUSTOMER", phone: { contains: digits.slice(-9) } },
        select: { id: true, name: true },
      })
    : null;
  if (!client) throw new ApiError(404, "Aucun client trouvé avec ce numéro de téléphone.");
  const totalWeight = Number(b.totalWeight);
  if (!Number.isFinite(totalWeight) || totalWeight <= 0) throw new ApiError(400, "Le poids total est obligatoire.");

  const trackingNumber = `MC${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const shipment = await prisma.shipment.create({
    data: {
      userId: client.id,
      trackingNumber,
      originCountry: str(b.originCountry) || "France",
      originCity: str(b.originCity) || "Paris",
      destinationCountry: str(b.destinationCountry) || "Madagascar",
      destinationCity: str(b.destinationCity) || "Antananarivo",
      serviceType: (b.serviceType as ServiceType) ?? "STANDARD",
      totalWeight: new Prisma.Decimal(totalWeight),
      totalVolume: b.totalVolume ? new Prisma.Decimal(b.totalVolume) : undefined,
      declaredValue: new Prisma.Decimal(Number(b.declaredValue) || 0),
      currency: (b.currency as Currency) ?? "EUR",
      estimatedPrice: new Prisma.Decimal(Number(b.estimatedPrice) || 0),
      estimatedDeliveryDate: b.estimatedDeliveryDate ? new Date(b.estimatedDeliveryDate) : undefined,
      senderName: b.senderName ? str(b.senderName) : undefined,
      senderPhone: b.senderPhone ? str(b.senderPhone) : undefined,
      senderAddress: b.senderAddress ? str(b.senderAddress) : undefined,
      recipientName: b.recipientName ? str(b.recipientName) : undefined,
      recipientPhone: b.recipientPhone ? str(b.recipientPhone) : undefined,
      recipientAddress: b.recipientAddress ? str(b.recipientAddress) : undefined,
      requiredDocuments: Array.isArray(b.requiredDocuments) ? b.requiredDocuments : [],
      notes: b.notes ? str(b.notes) : undefined,
      carrierId: req.user?.carrierId ?? null,
      status: "PENDING",
      statusHistory: { create: { status: "PENDING", comment: "Colis créé via l'espace transitaire", changedBy: req.user?.id } },
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      statusHistory: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  const body = { trackingNumber, destinationCity: shipment.destinationCity, totalWeight: shipment.totalWeight.toNumber() };
  await createAuditLog({
    userId: req.user?.id ?? null,
    action: "CREATE",
    entityType: "Shipment",
    entityId: shipment.id,
    newValues: body,
    ipAddress: clientIp(req),
  });
  res.status(201).json({ success: true, message: `Colis ${trackingNumber} créé pour ${client.name}.`, shipment });
});

const getActivity = asyncHandler(async (req: Request, res: Response) => {
  const carrierId = req.user?.carrierId ?? null;
  const shipmentIds = (await prisma.shipment.findMany({ where: { carrierId }, select: { id: true } })).map((s) => s.id);
  const where: Prisma.AuditLogWhereInput = shipmentIds.length
    ? { entityType: "Shipment", entityId: { in: shipmentIds } }
    : { id: { in: [] } };
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, role: true } } },
  });
  res.json({ success: true, logs });
});

const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const carrierId = req.user?.carrierId ?? null;
  const shipmentIds = (await prisma.shipment.findMany({ where: { carrierId }, select: { id: true } })).map((s) => s.id);
  if (!shipmentIds.length) return res.json({ success: true, notifications: [] });

  const [history, payments] = await Promise.all([
    prisma.shipmentStatusHistory.findMany({
      where: { shipmentId: { in: shipmentIds } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { shipment: { select: { trackingNumber: true } } },
    }),
    prisma.payment.findMany({
      where: { shipmentId: { in: shipmentIds }, status: "PAID" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { shipment: { select: { trackingNumber: true } }, user: { select: { name: true } } },
    }),
  ]);

  const notifications = [
    ...history.map((h) => ({
      id: `h-${h.id}`,
      kind: "STATUS",
      message: `${h.shipment.trackingNumber} → ${STATUS_LABEL[h.status] ?? h.status}`,
      detail: h.location ? `Localisation : ${h.location}` : h.comment,
      createdAt: h.createdAt,
    })),
    ...payments.map((p) => ({
      id: `p-${p.id}`,
      kind: "PAYMENT",
      message: `Paiement reçu pour ${p.shipment.trackingNumber}`,
      detail: `${Number(p.amount).toLocaleString("fr-FR")} ${p.currency} · ${p.user.name}`,
      createdAt: p.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 30);

  res.json({ success: true, notifications });
});

const getRates = asyncHandler(async (req: Request, res: Response) => {
  const carrier = getTransitaire(req.user?.carrierId ?? undefined);
  const publicList = listTransitaires();
  res.json({
    success: true,
    rates: {
      carrier: publicList.find((t) => t.id === carrier.id) ?? publicList[0],
      commissionRate: COMMISSION_RATE,
      commissionRateLabel: `${Math.round(COMMISSION_RATE * 100)} %`,
      eurToMga: EUR_TO_MGA,
    },
  });
});

export { listShipments, getShipment, updateShipmentStatus, getStats, getClients, getPayments, exportShipments, getTeam, getDocuments, getRates, createShipment, getActivity, getNotifications };
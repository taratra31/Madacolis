import type { Request, Response } from "express";
import type { Currency, DocumentStatus, Prisma, ShipmentStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { createAuditLog } from "../services/audit.service.js";
import { clientIp } from "../utils/generators.js";
import { str } from "../utils/str.js";
import { COMMISSION_RATE, EUR_TO_MGA } from "../services/transitaire.service.js";
import { computeQuote } from "../services/pricing.service.js";
import { generateClientTrackingNumber, deliveryDateFor } from "../services/shipment.service.js";

const paginate = (page: string | undefined = "1", pageSize: string | undefined = "10") => {
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const size = Math.min(100, Math.max(1, Number.parseInt(pageSize, 10) || 10));
  return { skip: (pageNum - 1) * size, take: size, page: pageNum, pageSize: size };
};

const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [userCount, addressCount, shipmentCount, paymentCount, pricingRuleCount, documentCount, revenue, pendingShipments, inTransitShipments, deliveredShipments, totalPaid, recentShipments, recentAudits] =
    await Promise.all([
      prisma.user.count(),
      prisma.address.count(),
      prisma.shipment.count(),
      prisma.payment.count(),
      prisma.pricingRule.count(),
      prisma.document.count(),
      prisma.shipment.aggregate({ _sum: { estimatedPrice: true } }),
      prisma.shipment.count({ where: { status: "PENDING" } }),
      prisma.shipment.count({ where: { status: "IN_TRANSIT" } }),
      prisma.shipment.count({ where: { status: "DELIVERED" } }),
      prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.shipment.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } } } }),
    ]);

  const shipmentsByStatus = await prisma.shipment.groupBy({ by: ["status"], _count: { _all: true } });
  const paymentsByStatus = await prisma.payment.groupBy({ by: ["status"], _count: { _all: true } });
  const shipmentsByService = await prisma.shipment.groupBy({ by: ["serviceType"], _count: { _all: true } });

  // Tendance création de colis des 30 derniers jours
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - 29);
  const dailyRaw: Array<{ day: string; count: bigint }> = await prisma.$queryRaw`
    SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') AS day, COUNT(*)::bigint AS count
    FROM "Shipment"
    WHERE "createdAt" >= ${since}
    GROUP BY day
    ORDER BY day ASC
  `;
  const trend30d = dailyRaw.map((row) => ({ day: row.day, count: Number(row.count) }));

  // Top 5 routes
  const topRoutes = await prisma.shipment.groupBy({
    by: ["originCountry", "originCity", "destinationCountry", "destinationCity"],
    _count: { _all: true },
  });
  const topRoutesSorted = topRoutes.sort((a, b) => b._count._all - a._count._all).slice(0, 5);

  // Revenus par fournisseur (paiements PAID)
  const revenueByProvider = await prisma.payment.groupBy({
    by: ["provider"],
    where: { status: "PAID" },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  res.json({
    success: true,
    stats: {
      users: userCount,
      addresses: addressCount,
      shipments: shipmentCount,
      payments: paymentCount,
      pricingRules: pricingRuleCount,
      documents: documentCount,
      revenueEstimated: revenue._sum.estimatedPrice,
      revenuePaid: totalPaid._sum.amount,
    },
    flows: {
      pending: pendingShipments,
      inTransit: inTransitShipments,
      delivered: deliveredShipments,
    },
    shipmentsByStatus,
    paymentsByStatus,
    shipmentsByService,
    revenueByProvider: revenueByProvider.map((r) => ({ provider: r.provider, amount: r._sum.amount })),
    trend30d,
    topRoutes: topRoutesSorted.map((r) => ({
      originCountry: r.originCountry,
      originCity: r.originCity,
      destinationCountry: r.destinationCountry,
      destinationCity: r.destinationCity,
      count: r._count._all,
    })),
    recentShipments,
    recentAudits,
  });
});

const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { skip, take, page, pageSize } = paginate(str(req.query.page), str(req.query.pageSize));
  const where: Prisma.UserWhereInput = {
    ...(req.query.role ? { role: str(req.query.role) as Prisma.UserWhereInput["role"] } : {}),
    ...(req.query.q
      ? {
          OR: [
            { name: { contains: str(req.query.q), mode: "insensitive" } },
            { email: { contains: str(req.query.q), mode: "insensitive" } },
            { phone: { contains: str(req.query.q) } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        country: true,
        city: true,
        isActive: true,
        createdAt: true,
        _count: { select: { shipments: true, addresses: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ success: true, users, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { role, isActive, carrierId } = req.body;
  const existing = await prisma.user.findUnique({ where: { id: str(req.params.id) } });
  if (!existing) throw new ApiError(404, "Utilisateur introuvable", "NOT_FOUND");

  if (existing.role === "ADMIN" && str(req.params.id) !== req.user!.id && role && role !== "ADMIN") {
    throw new ApiError(400, "Impossible de rétrograder un autre administrateur", "BAD_REQUEST");
  }

  const user = await prisma.user.update({
    where: { id: existing.id },
    data: { role, isActive, ...(carrierId !== undefined ? { carrierId: carrierId || null } : {}) },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, carrierId: true },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: "ADMIN.USER_UPDATE",
    entityType: "User",
    entityId: existing.id,
    oldValues: { role: existing.role, isActive: existing.isActive },
    newValues: { role: user.role, isActive: user.isActive },
    ipAddress: clientIp(req),
  });

  res.json({ success: true, message: "Utilisateur mis à jour", user });
});

const listShipments = asyncHandler(async (req: Request, res: Response) => {
  const { skip, take, page, pageSize } = paginate(str(req.query.page), str(req.query.pageSize));
  const where: Prisma.ShipmentWhereInput = {
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
      include: { user: { select: { name: true, email: true, phone: true } } },
    }),
    prisma.shipment.count({ where }),
  ]);

  res.json({ success: true, shipments, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

const updateShipmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, comment, location } = req.body;
  const existing = await prisma.shipment.findUnique({ where: { id: str(req.params.id) } });
  if (!existing) throw new ApiError(404, "Colis introuvable", "NOT_FOUND");

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
    action: "ADMIN.SHIPMENT_STATUS",
    entityType: "Shipment",
    entityId: existing.id,
    oldValues: { status: existing.status },
    newValues: { status },
    ipAddress: clientIp(req),
  });

  res.json({ success: true, message: "Statut mis à jour", shipment: updated });
});

const assignShipmentCarrier = asyncHandler(async (req: Request, res: Response) => {
  const carrierId = req.body.carrierId as string | null;
  const existing = await prisma.shipment.findUnique({ where: { id: str(req.params.id) } });
  if (!existing) throw new ApiError(404, "Colis introuvable", "NOT_FOUND");

  const updated = await prisma.shipment.update({ where: { id: existing.id }, data: { carrierId } });
  await createAuditLog({
    userId: req.user!.id,
    action: "ADMIN.SHIPMENT_CARRIER",
    entityType: "Shipment",
    entityId: existing.id,
    oldValues: { carrierId: existing.carrierId },
    newValues: { carrierId },
    ipAddress: clientIp(req),
  });

  res.json({ success: true, message: "Transporteur assigné", shipment: updated });
});

const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const { skip, take, page, pageSize } = paginate(str(req.query.page), str(req.query.pageSize));
  const where: Prisma.PaymentWhereInput = req.query.status
    ? { status: str(req.query.status) as Prisma.PaymentWhereInput["status"] }
    : {};

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        shipment: { select: { trackingNumber: true, destinationCity: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  res.json({ success: true, payments, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

/** Confirme manuellement un paiement PENDING (réception MVola/OM/espèces réelle). */
const confirmPayment = asyncHandler(async (req: Request, res: Response) => {
  const paymentId = str(req.params.id);
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new ApiError(404, "Paiement introuvable", "NOT_FOUND");
  if (payment.status !== "PENDING") throw new ApiError(409, "Ce paiement n'est plus en attente", "PAYMENT_NOT_PENDING");

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      transactionId: payment.transactionId ?? `manual-${payment.paymentReference}`,
      paidAt: new Date(),
      metadata: { manualConfirm: true },
    },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: "PAYMENT.CONFIRMED",
    entityType: "Payment",
    entityId: payment.id,
    newValues: { paymentReference: payment.paymentReference, status: "PAID", manual: true },
    ipAddress: clientIp(req),
  });

  res.json({ success: true, message: "Paiement confirmé", payment: { ...updated, amount: Number(updated.amount) } });
});

const listPricingRules = asyncHandler(async (_req: Request, res: Response) => {
  const rules = await prisma.pricingRule.findMany({ orderBy: [{ originCountry: "asc" }, { serviceType: "asc" }] });
  res.json({ success: true, rules });
});

const createPricingRule = asyncHandler(async (req: Request, res: Response) => {
  const rule = await prisma.pricingRule.create({ data: req.body });
  await createAuditLog({
    userId: req.user!.id,
    action: "ADMIN.PRICING_CREATE",
    entityType: "PricingRule",
    entityId: rule.id,
    newValues: { name: rule.name, basePrice: rule.basePrice.toString() },
    ipAddress: clientIp(req),
  });
  res.status(201).json({ success: true, message: "Règle tarifaire créée", rule });
});

const updatePricingRule = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.pricingRule.findUnique({ where: { id: str(req.params.id) } });
  if (!existing) throw new ApiError(404, "Règle tarifaire introuvable", "NOT_FOUND");

  const rule = await prisma.pricingRule.update({ where: { id: existing.id }, data: req.body });
  await createAuditLog({
    userId: req.user!.id,
    action: "ADMIN.PRICING_UPDATE",
    entityType: "PricingRule",
    entityId: existing.id,
    oldValues: { basePrice: existing.basePrice.toString() },
    newValues: { basePrice: rule.basePrice.toString() },
    ipAddress: clientIp(req),
  });
  res.json({ success: true, message: "Règle tarifaire mise à jour", rule });
});

const deletePricingRule = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.pricingRule.findUnique({ where: { id: str(req.params.id) } });
  if (!existing) throw new ApiError(404, "Règle tarifaire introuvable", "NOT_FOUND");

  await prisma.pricingRule.delete({ where: { id: existing.id } });
  await createAuditLog({
    userId: req.user!.id,
    action: "ADMIN.PRICING_DELETE",
    entityType: "PricingRule",
    entityId: existing.id,
    oldValues: { name: existing.name },
    ipAddress: clientIp(req),
  });
  res.json({ success: true, message: "Règle tarifaire supprimée" });
});

const listAudits = asyncHandler(async (req: Request, res: Response) => {
  const { skip, take, page, pageSize } = paginate(str(req.query.page), str(req.query.pageSize));
  const where: Prisma.AuditLogWhereInput = req.query.action
    ? { action: { contains: req.query.action as string, mode: "insensitive" } }
    : {};

  const [audits, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ success: true, audits, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.user.findUnique({ where: { id: str(req.params.id) } });
  if (!existing) throw new ApiError(404, "Utilisateur introuvable", "NOT_FOUND");

  if (existing.id === req.user!.id) {
    throw new ApiError(400, "Impossible de supprimer votre propre compte", "BAD_REQUEST");
  }

  if (existing.role === "ADMIN") {
    const otherActiveAdmin = await prisma.user.count({
      where: { role: "ADMIN", isActive: true, id: { not: existing.id } },
    });
    if (otherActiveAdmin === 0) {
      throw new ApiError(400, "Impossible de supprimer le dernier administrateur actif", "BAD_REQUEST");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.shipmentStatusHistory.deleteMany({ where: { shipment: { userId: existing.id } } });
    await tx.shipmentItem.deleteMany({ where: { shipment: { userId: existing.id } } });
    await tx.payment.deleteMany({ where: { userId: existing.id } });
    await tx.shipment.deleteMany({ where: { userId: existing.id } });
    await tx.address.deleteMany({ where: { userId: existing.id } });
    await tx.user.delete({ where: { id: existing.id } });
  });

  await createAuditLog({
    userId: req.user!.id,
    action: "ADMIN.USER_DELETE",
    entityType: "User",
    entityId: existing.id,
    oldValues: { email: existing.email, phone: existing.phone, role: existing.role },
    ipAddress: clientIp(req),
  });

  res.json({ success: true, message: "Utilisateur supprimé" });
});

const createShipment = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;
  const client = await prisma.user.findUnique({ where: { id: str(body.userId) } });
  if (!client || client.role !== "CUSTOMER") throw new ApiError(404, "Client introuvable", "NOT_FOUND");
  if (req.body.carrierId) {
    const carrier = await prisma.user.findFirst({ where: { role: "TRANSITAIRE", carrierId: str(req.body.carrierId) } });
    if (!carrier) throw new ApiError(404, "Transporteur introuvable", "CARRIER_NOT_FOUND");
  }

  const totalWeight = body.items.reduce((acc: number, it: { weight: number; quantity: number }) => acc + it.weight * it.quantity, 0);
  const totalVolumeM3 = body.items.reduce((acc: number, it: { length?: number; width?: number; height?: number; quantity: number }) => {
    if (!it.length || !it.width || !it.height) return acc;
    return acc + ((it.length * it.width * it.height) / 1_000_000) * it.quantity;
  }, 0);

  const quote = await computeQuote({
    originCountry: body.origin.country,
    originCity: body.origin.city,
    destinationCountry: body.destination.country,
    destinationCity: body.destination.city,
    serviceType: body.serviceType,
    weightKg: totalWeight,
    lengthCm: body.items[0]?.length,
    widthCm: body.items[0]?.width,
    heightCm: body.items[0]?.height,
    totalVolumeM3,
  });
  const totalValue = body.items.reduce((acc: number, it: { declaredValue: number }) => acc + (it.declaredValue ?? 0), 0);
  const trackingNumber = await generateClientTrackingNumber();

  const senderName = body.sender?.name || client.name;
  const senderPhone = body.sender?.phone || client.phone;
  const shipment = await prisma.$transaction(async (tx) => {
    const created = await tx.shipment.create({
      data: {
        userId: client.id,
        trackingNumber,
        originCountry: body.origin.country,
        originCity: body.origin.city,
        destinationCountry: body.destination.country,
        destinationCity: body.destination.city,
        serviceType: body.serviceType,
        totalWeight,
        totalVolume: quote.usingVolumetric ? quote.billingWeight : undefined,
        declaredValue: totalValue,
        currency: quote.currency as Currency,
        estimatedPrice: quote.price,
        estimatedDeliveryDate: deliveryDateFor(body.serviceType),
        senderName,
        senderPhone,
        senderAddress: body.sender?.address ?? null,
        recipientName: body.recipient?.name ?? null,
        recipientPhone: body.recipient?.phone ?? null,
        recipientAddress: body.recipient?.address ?? null,
        requiredDocuments: body.requiredDocuments ?? [],
        carrierId: body.carrierId ?? null,
        notes: body.notes ?? null,
        items: {
          create: body.items.map((it: { name: string; quantity: number; weight: number; declaredValue?: number; length?: number; width?: number; height?: number }) => ({
            description: it.name,
            quantity: it.quantity,
            weight: it.weight,
            length: it.length ?? null,
            width: it.width ?? null,
            height: it.height ?? null,
            declaredValue: it.declaredValue ?? 0,
            isFragile: false,
          })),
        },
      },
      include: { user: { select: { name: true } } },
    });

    await tx.shipmentStatusHistory.create({
      data: { shipmentId: created.id, status: "PENDING", comment: "Colis créé par l'administration", changedBy: req.user!.id },
    });
    return created;
  });

  await createAuditLog({
    userId: req.user!.id,
    action: "ADMIN.SHIPMENT_CREATE",
    entityType: "Shipment",
    entityId: shipment.id,
    newValues: { trackingNumber, serviceType: body.serviceType, carrierId: body.carrierId ?? null },
    ipAddress: clientIp(req),
  });

  res.status(201).json({ success: true, message: "Colis créé", shipment: { ...shipment, totalWeight: Number(shipment.totalWeight), declaredValue: Number(shipment.declaredValue), estimatedPrice: Number(shipment.estimatedPrice) } });
});

const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const valueAr = (currency: string, amount: number) => (currency === "EUR" ? amount * EUR_TO_MGA : amount);

const listCommissions = asyncHandler(async (_req: Request, res: Response) => {
  const carriers = await prisma.user.findMany({ where: { role: "TRANSITAIRE" }, select: { carrierId: true, name: true, email: true } });
  const ids = carriers.map((c) => c.carrierId).filter((c): c is string => Boolean(c));

  const shipments = await prisma.shipment.findMany({
    where: { carrierId: { in: ids } },
    select: { carrierId: true, finalPrice: true, estimatedPrice: true, currency: true, status: true, createdAt: true },
  });

  // Agrégats par transporteur (réels, avec conversion EUR → Ar)
  const byCarrier = new Map<string, { shipments: number; delivered: number; revenue: number; commission: number }>();
  for (const s of shipments) {
    const mon = valueAr(s.currency, Number(s.finalPrice ?? s.estimatedPrice ?? 0));
    const entry = byCarrier.get(s.carrierId ?? "") ?? { shipments: 0, delivered: 0, revenue: 0, commission: 0 };
    entry.shipments += 1;
    if (s.status === "DELIVERED") entry.delivered += 1;
    entry.revenue += mon;
    entry.commission += mon * COMMISSION_RATE;
    byCarrier.set(s.carrierId ?? "", entry);
  }
  const perCarrier = [...byCarrier.entries()]
    .map(([carrierId, e]) => ({
      carrierId,
      name: carriers.find((c) => c.carrierId === carrierId)?.name ?? "—",
      shipments: e.shipments,
      delivered: e.delivered,
      revenue: Math.round(e.revenue),
      commission: Math.round(e.commission),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Série mensuelle (6 derniers mois)
  const last6 = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { month: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`, revenueAr: 0, commissionAr: 0 };
  });
  for (const s of shipments) {
    const ageMonths = (Date.now() - s.createdAt.getTime()) / (30 * 24 * 3600 * 1000);
    const mi = 5 - Math.round(ageMonths);
    if (mi >= 0 && mi < 6) {
      const mon = valueAr(s.currency, Number(s.finalPrice ?? s.estimatedPrice ?? 0));
      last6[mi].revenueAr += mon;
      last6[mi].commissionAr += mon * COMMISSION_RATE;
    }
  }
  last6.forEach((m) => { m.revenueAr = Math.round(m.revenueAr); m.commissionAr = Math.round(m.commissionAr); });

  res.json({
    success: true,
    totalRevenue: Math.round(perCarrier.reduce((a, c) => a + c.revenue, 0)),
    totalCommission: Math.round(perCarrier.reduce((a, c) => a + c.commission, 0)),
    deliveredShipments: perCarrier.reduce((a, c) => a + c.delivered, 0),
    rate: COMMISSION_RATE,
    perCarrier,
    monthly: last6,
  });
});

const listTreasury = asyncHandler(async (_req: Request, res: Response) => {
  const since = new Date(Date.now() - 6 * 30 * 24 * 3600 * 1000);
  const [payments, unpaid] = await Promise.all([
    prisma.payment.findMany({ where: { createdAt: { gte: since } }, select: { amount: true, currency: true, status: true, provider: true, createdAt: true } }),
    prisma.shipment.findMany({ where: { status: { in: ["PENDING", "RECEIVED", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY"] } }, select: { estimatedPrice: true, currency: true } }),
  ]);

  const totalPaidAr = payments.filter((p) => p.status === "PAID").reduce((a, p) => a + valueAr(p.currency, Number(p.amount)), 0);
  const mvolaAr = payments.filter((p) => p.status === "PAID" && p.provider === "MVOLA").reduce((a, p) => a + valueAr(p.currency, Number(p.amount)), 0);
  const outstandingAr = unpaid.reduce((a, s) => a + valueAr(s.currency, Number(s.estimatedPrice)), 0);

  const last6 = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { month: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`, encaisséAr: 0, attenduAr: 0 };
  });
  for (const p of payments) {
    const mi = 5 - Math.round((Date.now() - p.createdAt.getTime()) / (30 * 24 * 3600 * 1000));
    if (mi >= 0 && mi < 6) last6[mi].encaisséAr += p.status === "PAID" ? valueAr(p.currency, Number(p.amount)) : 0;
  }

  res.json({
    success: true,
    encaisséTotalAr: Math.round(totalPaidAr),
    encaisséMMvolaAr: Math.round(mvolaAr),
    attenduAr: Math.round(outstandingAr),
    colisEnCours: unpaid.length,
    parFournisseur: [{ name: "MVola", amount: Math.round(mvolaAr) }, { name: "Autres", amount: Math.round(totalPaidAr - mvolaAr) }],
    mensuel: last6.map((m) => ({ ...m, encaisséAr: Math.round(m.encaisséAr) })),
  });
});

const listNotifications = asyncHandler(async (_req: Request, res: Response) => {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [shipments, payments, users, audits] = await Promise.all([
    prisma.shipment.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 20, select: { trackingNumber: true, status: true, createdAt: true, carrierId: true } }),
    prisma.payment.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 20, select: { amount: true, currency: true, status: true, provider: true, createdAt: true, shipment: { select: { trackingNumber: true } } } }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 20, select: { name: true, role: true, createdAt: true } }),
    prisma.auditLog.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, action: true, ipAddress: true, createdAt: true } }),
  ]);

  type N = { id: string; type: "SHIPMENT" | "PAYMENT" | "USER" | "SYSTEM"; title: string; detail: string; time: string; icon: string };
  const notifs: N[] = [
    ...shipments.map((s) => ({
      id: `sh-${s.trackingNumber}`,
      type: "SHIPMENT" as const,
      title: `Nouveau colis ${s.trackingNumber}`,
      detail: `Statut ${s.status}${s.carrierId ? ` · transporteur ${s.carrierId}` : ""}`,
      time: s.createdAt.toISOString(),
      icon: "package",
    })),
    ...payments.map((p) => ({
      id: `pm-${p.createdAt.getTime()}-${p.shipment?.trackingNumber ?? ""}`,
      type: "PAYMENT" as const,
      title: `Paiement ${p.shipment ? `pour ${p.shipment.trackingNumber}` : "reçu"}`,
      detail: `${p.provider} · ${Number(p.amount).toLocaleString("fr-FR")} ${p.currency} · ${p.status}`,
      time: p.createdAt.toISOString(),
      icon: "wallet",
    })),
    ...users.map((u) => ({
      id: `us-${u.createdAt.getTime()}-${u.name}`,
      type: "USER" as const,
      title: `Nouveau compte : ${u.name}`,
      detail: `Inscription en tant que ${u.role}`,
      time: u.createdAt.toISOString(),
      icon: "user",
    })),
    ...audits.map((a) => ({
      id: `au-${a.id}`,
      type: "SYSTEM" as const,
      title: `Action système : ${a.action}`,
      detail: `IP ${a.ipAddress ?? "inconnue"}`,
      time: a.createdAt.toISOString(),
      icon: "shield",
    })),
  ]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 60);

  const unread = notifs.filter((n) => n.type === "PAYMENT" || n.type === "USER").length;
  res.json({ success: true, unread, notifications: notifs });
});

const listTransitaires = asyncHandler(async (req: Request, res: Response) => {
  const { skip, take, page, pageSize } = paginate(str(req.query.page), str(req.query.pageSize));
  const where: Prisma.UserWhereInput = { role: "TRANSITAIRE" };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        carrierId: true,
        isActive: true,
        createdAt: true,
        _count: { select: { shipments: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const carrierIds = users.map((u) => u.carrierId).filter((c): c is string => Boolean(c));
  const [statusAgg, revenueAgg] = carrierIds.length
    ? await Promise.all([
        prisma.shipment.groupBy({ by: ["carrierId", "status"], where: { carrierId: { in: carrierIds } }, _count: { _all: true } }),
        prisma.shipment.groupBy({ by: ["carrierId"], where: { carrierId: { in: carrierIds } }, _sum: { finalPrice: true } }),
      ])
    : [[], []];

  const byStatus = new Map<string | null, { total: number; pending: number; delivered: number }>();
  for (const g of statusAgg) {
    const entry = byStatus.get(g.carrierId) ?? { total: 0, pending: 0, delivered: 0 };
    entry.total += g._count._all;
    if (g.status === "PENDING" || g.status === "RECEIVED") entry.pending += g._count._all;
    if (g.status === "DELIVERED") entry.delivered += g._count._all;
    byStatus.set(g.carrierId, entry);
  }
  const byRevenue = new Map(revenueAgg.map((r) => [r.carrierId, Number(r._sum.finalPrice ?? 0)]));

  res.json({
    success: true,
    transitaires: users.map((u) => {
      const stats = byStatus.get(u.carrierId ?? "") ?? { total: 0, pending: 0, delivered: 0 };
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        carrierId: u.carrierId,
        isActive: u.isActive,
        createdAt: u.createdAt,
        shipments: stats.total,
        pending: stats.pending,
        delivered: stats.delivered,
        revenueAr: byRevenue.get(u.carrierId ?? "") ?? 0,
      };
    }),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

const listDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { skip, take, page, pageSize } = paginate(str(req.query.page), str(req.query.pageSize));
  const where: Prisma.DocumentWhereInput = req.query.status ? { status: str(req.query.status) as DocumentStatus } : {};
  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { shipment: { select: { trackingNumber: true } }, user: { select: { name: true } } },
    }),
    prisma.document.count({ where }),
  ]);
  res.json({ success: true, documents, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

const sheetRow = (cells: (string | number)[]) => cells.join(";").replace(/\r?\n/g, " ");

const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const kind = str(req.query.kind) || "colis";
  const send = (filename: string, header: string[], rows: (string | number)[][]) => {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(`\uFEFF${[header, ...rows].map(sheetRow).join("\r\n")}`);
  };

  if (kind === "utilisateurs") {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" }, take: 5000, include: { _count: { select: { shipments: true, addresses: true } } } });
    return send(
      "madacolis-utilisateurs.csv",
      ["Nom", "Email", "T\u00e9l\u00e9phone", "R\u00f4le", "Statut", "Colis", "Adresses", "Cr\u00e9\u00e9 le"],
      users.map((u) => [u.name, u.email ?? "", u.phone, u.role, u.isActive ? "Actif" : "Inactif", u._count.shipments, u._count.addresses, u.createdAt.toISOString()]),
    );
  }

  if (kind === "paiements") {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: { shipment: { select: { trackingNumber: true } }, user: { select: { name: true } } },
    });
    return send(
      "madacolis-paiements.csv",
      ["N\u00b0 suivi", "Client", "Montant", "Devise", "Statut", "Provider", "M\u00e9thode", "Date"],
      payments.map((p) => [p.shipment?.trackingNumber ?? "", p.user.name, String(p.amount), p.currency, p.status, p.provider, p.method, p.createdAt.toISOString()]),
    );
  }

  if (kind === "documents") {
    const documents = await prisma.document.findMany({ orderBy: { createdAt: "desc" }, take: 5000, include: { shipment: { select: { trackingNumber: true } } } });
    return send(
      "madacolis-documents.csv",
      ["Fichier", "Type", "Statut", "N\u00b0 suivi", "MIME", "Date"],
      documents.map((d) => [d.originalName, d.type, d.status, d.shipment?.trackingNumber ?? "", "", d.mimeType, d.createdAt.toISOString()]),
    );
  }

  const shipments = await prisma.shipment.findMany({
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { user: { select: { name: true, email: true, phone: true } } },
  });
  const ar = (amount: number, currency: string | null) => (currency === "EUR" ? amount * EUR_TO_MGA : amount);
  return send(
    "madacolis-colis-admin.csv",
    ["Tracking", "Statut", "Service", "Origine", "Destination", "Client", "Poids (kg)", "Prix (Ar)", "Commission (Ar)", "Devise", "Cr\u00e9\u00e9 le"],
    shipments.map((s) => [
      s.trackingNumber,
      s.status,
      s.serviceType,
      `${s.originCity} (${s.originCountry})`,
      `${s.destinationCity} (${s.destinationCountry})`,
      s.user.name,
      String(Number(s.totalWeight)),
      String(Math.round(ar(Number(s.estimatedPrice), s.currency))),
      String(Math.round(ar(Number(s.estimatedPrice), s.currency) * COMMISSION_RATE)),
      s.currency,
      s.createdAt.toISOString(),
    ]),
  );
});

export {
  dashboard,
  listUsers,
  updateUser,
  deleteUser,
  listShipments,
  updateShipmentStatus,
  assignShipmentCarrier,
  listPayments,
  confirmPayment,
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  listAudits,
  listTransitaires,
  listDocuments,
  exportCsv,
  createShipment,
  listCommissions,
  listTreasury,
  listNotifications,
};
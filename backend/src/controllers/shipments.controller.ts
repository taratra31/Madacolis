import type { Request, Response } from "express";
import type { Prisma, Shipment } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { clientIp } from "../utils/generators.js";
import { createAuditLog } from "../services/audit.service.js";
import { computeQuote } from "../services/pricing.service.js";
import { generateClientTrackingNumber, deliveryDateFor } from "../services/shipment.service.js";
import { shipmentQrDataUrl } from "../utils/qr.js";

const shipmentInclude = {
  items: true,
  statusHistory: { orderBy: { createdAt: "desc" as const } },
  payments: { orderBy: { createdAt: "desc" as const } },
  documents: true,
  originAddress: true,
  destinationAddress: true,
} as const satisfies Prisma.ShipmentInclude;

type ShipmentWithRelations = Prisma.ShipmentGetPayload<{ include: typeof shipmentInclude }>;

function serializeShipment(s: ShipmentWithRelations) {
  return {
    ...s,
    totalWeight: Number(s.totalWeight),
    totalVolume: s.totalVolume === null ? null : Number(s.totalVolume),
    declaredValue: Number(s.declaredValue),
    estimatedPrice: Number(s.estimatedPrice),
    finalPrice: s.finalPrice === null ? null : Number(s.finalPrice),
    items: s.items.map((i) => ({
      ...i,
      weight: Number(i.weight),
      length: i.length === null ? null : Number(i.length),
      width: i.width === null ? null : Number(i.width),
      height: i.height === null ? null : Number(i.height),
      declaredValue: Number(i.declaredValue),
    })),
    timeline: s.statusHistory,
    payments: s.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
  };
}

export const quoteShipment = asyncHandler(async (req: Request, res: Response) => {
  const quote = await computeQuote(req.body);
  res.json({ success: true, quote });
});

export async function findOrCreateAddress(params: {
  userId: string;
  label: string;
  country: string;
  city: string;
  addressLine: string;
  phone: string;
}): Promise<string | undefined> {
  const existing = await prisma.address.findFirst({
    where: {
      userId: params.userId,
      country: { equals: params.country, mode: "insensitive" },
      city: { equals: params.city, mode: "insensitive" },
      ...(params.addressLine ? { addressLine: { equals: params.addressLine, mode: "insensitive" } } : {}),
      phone: params.phone,
    },
  });
  if (existing) return existing.id;

  const created = await prisma.address.create({
    data: {
      userId: params.userId,
      label: params.label,
      country: params.country,
      city: params.city,
      addressLine: params.addressLine || params.city,
      phone: params.phone,
    },
  });
  return created.id;
}

export const createShipment = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body;
  const userId = req.user!.id;

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
  const totalValue = body.items.reduce((acc: number, it: { declaredValue: number }) => acc + it.declaredValue, 0);
  const trackingNumber = await generateClientTrackingNumber();
  const estimatedDeliveryDate = deliveryDateFor(body.serviceType);

  const originAddressId = await findOrCreateAddress({
    userId,
    label: `Expéditeur — ${body.sender.name}`,
    country: body.origin.country,
    city: body.origin.city,
    addressLine: body.sender.address ?? "",
    phone: body.sender.phone,
  });
  const destinationAddressId = await findOrCreateAddress({
    userId,
    label: `Destinataire — ${body.recipient.name}`,
    country: body.destination.country,
    city: body.destination.city,
    addressLine: body.recipient.address ?? "",
    phone: body.recipient.phone,
  });

  const shipment = await prisma.shipment.create({
    data: {
      userId,
      trackingNumber,
      originCountry: body.origin.country,
      originCity: body.origin.city,
      destinationCountry: body.destination.country,
      destinationCity: body.destination.city,
      originAddressId,
      destinationAddressId,
      serviceType: body.serviceType,
      totalWeight,
      totalVolume: quote.usingVolumetric ? quote.billingWeight : undefined,
      declaredValue: totalValue,
      currency: quote.currency as Shipment["currency"],
      estimatedPrice: quote.price,
      estimatedDeliveryDate,
      senderName: body.sender.name,
      senderPhone: body.sender.phone,
      senderAddress: body.sender.address,
      recipientName: body.recipient.name,
      recipientPhone: body.recipient.phone,
      recipientAddress: body.recipient.address,
      requiredDocuments: body.requiredDocuments,
      notes: body.notes,
      items: {
        create: body.items.map((it: { description: string; quantity: number; weight: number; length?: number; width?: number; height?: number; declaredValue: number; isFragile?: boolean }) => ({
          description: it.description,
          quantity: it.quantity,
          weight: it.weight,
          length: it.length,
          width: it.width,
          height: it.height,
          declaredValue: it.declaredValue,
          isFragile: it.isFragile ?? false,
        })),
      },
      statusHistory: {
        create: [{ status: "PENDING", comment: "Colis créé sur le portail", location: body.origin.city, changedBy: userId }],
      },
    },
    include: shipmentInclude,
  });

  await createAuditLog({
    userId,
    action: "SHIPMENT.CREATED",
    entityType: "Shipment",
    entityId: shipment.id,
    newValues: { trackingNumber, estimatedPrice: quote.price, serviceType: body.serviceType },
    ipAddress: clientIp(req),
  });

  res.status(201).json({ success: true, message: "Colis créé", shipment: serializeShipment(shipment) });
});

export const listShipments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const q = req.validatedQuery as { page?: number; limit?: number; status?: Shipment["status"]; search?: string };
  const page = Number(q.page) || 1;
  const limit = Number(q.limit) || 10;

  const where: Prisma.ShipmentWhereInput = {
    userId,
    ...(q.status ? { status: q.status } : {}),
    ...(q.search ? { trackingNumber: { contains: q.search, mode: "insensitive" } } : {}),
  };

  const [total, shipments] = await Promise.all([
    prisma.shipment.count({ where }),
    prisma.shipment.findMany({
      where,
      include: shipmentInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  res.json({ success: true, shipments: shipments.map((s) => serializeShipment(s)), total, page, limit });
});

export const getShipment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const shipment = await prisma.shipment.findFirst({ where: { id: String(req.params.id), userId }, include: shipmentInclude });
  if (!shipment) throw new ApiError(404, "Colis introuvable", "NOT_FOUND");
  const qrDataUrl = await shipmentQrDataUrl(shipment.trackingNumber);
  res.json({ success: true, shipment: { ...serializeShipment(shipment), qrDataUrl } });
});

export const getShipmentTracking = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const shipment = await prisma.shipment.findFirst({
    where: { id: String(req.params.id), userId },
    select: {
      id: true,
      trackingNumber: true,
      status: true,
      estimatedDeliveryDate: true,
      actualDeliveryDate: true,
      originCity: true,
      destinationCity: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!shipment) throw new ApiError(404, "Colis introuvable", "NOT_FOUND");
  const qrDataUrl = await shipmentQrDataUrl(shipment.trackingNumber);
  res.json({ success: true, tracking: { ...shipment, qrDataUrl } });
});

export const cancelShipment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { reason } = req.body;

  const shipment = await prisma.shipment.findFirst({ where: { id: String(req.params.id), userId }, select: { id: true, trackingNumber: true, status: true } });
  if (!shipment) throw new ApiError(404, "Colis introuvable", "NOT_FOUND");

  if (shipment.status !== "PENDING") {
    throw new ApiError(400, `Annulation impossible : statut actuel « ${shipment.status} »`, "CANCEL_NOT_ALLOWED");
  }

  const updated = await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      status: "CANCELLED",
      statusHistory: { create: [{ status: "CANCELLED", comment: reason ?? "Annulé par le client", location: null, changedBy: userId }] },
    },
    select: { id: true, trackingNumber: true, status: true },
  });

  await createAuditLog({
    userId,
    action: "SHIPMENT.CANCELLED",
    entityType: "Shipment",
    entityId: shipment.id,
    newValues: { trackingNumber: shipment.trackingNumber, reason },
    ipAddress: clientIp(req),
  });

  res.json({ success: true, message: "Colis annulé", shipment: updated });
});
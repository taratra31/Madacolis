import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { clientIp, generatePaymentReference } from "../utils/generators.js";
import { createAuditLog } from "../services/audit.service.js";

export const listMyPayments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const payments = await prisma.payment.findMany({
    where: { userId },
    include: { shipment: { select: { trackingNumber: true, destinationCity: true, originCity: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    payments: payments.map((p) => ({ ...p, amount: Number(p.amount) })),
  });
});

/** Initie un paiement (statut PENDING) pour un colis appartenant à l'utilisateur. */
export const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { shipmentId, provider, method } = req.body;

  const shipment = await prisma.shipment.findFirst({
    where: { id: shipmentId, userId },
    select: { id: true, trackingNumber: true, estimatedPrice: true, finalPrice: true, currency: true, status: true },
  });
  if (!shipment) throw new ApiError(404, "Colis introuvable", "NOT_FOUND");
  if (shipment.status === "CANCELLED") throw new ApiError(400, "Ce colis est annulé", "SHIPMENT_CANCELLED");

  const existingPaid = await prisma.payment.findFirst({ where: { shipmentId, status: "PAID" } });
  if (existingPaid) throw new ApiError(409, "Ce colis est déjà payé", "SHIPMENT_ALREADY_PAID");

  const amount = Number(shipment.finalPrice ?? shipment.estimatedPrice);

  const payment = await prisma.payment.create({
    data: {
      shipmentId: shipment.id,
      userId,
      paymentReference: generatePaymentReference(),
      provider,
      method,
      amount,
      currency: shipment.currency,
      status: "PENDING",
    },
  });

  await createAuditLog({
    userId,
    action: "PAYMENT.INITIATED",
    entityType: "Payment",
    entityId: payment.id,
    newValues: { trackingNumber: shipment.trackingNumber, provider, amount },
    ipAddress: clientIp(req),
  });

  res.status(201).json({
    success: true,
    message: "Paiement initié",
    payment: { ...payment, amount: Number(payment.amount) },
  });
});
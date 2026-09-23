import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { shipmentQrDataUrl } from "../utils/qr.js";

/** Tracking public : aucune donnée personnelle renvoyée. */
export const trackShipment = asyncHandler(async (req: Request, res: Response) => {
  const trackingNumber = req.params.trackingNumber as string;

  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber },
    select: {
      trackingNumber: true,
      status: true,
      serviceType: true,
      originCountry: true,
      originCity: true,
      destinationCountry: true,
      destinationCity: true,
      estimatedDeliveryDate: true,
      actualDeliveryDate: true,
      createdAt: true,
      estimatedPrice: true,
      currency: true,
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: { status: true, comment: true, location: true, createdAt: true },
      },
    },
  });

  if (!shipment) {
    throw new ApiError(404, "Colis introuvable. Vérifiez le numéro de tracking.", "TRACKING_NOT_FOUND");
  }

  const qrDataUrl = await shipmentQrDataUrl(shipment.trackingNumber);
  res.json({
    success: true,
    tracking: {
      ...shipment,
      estimatedPrice: Number(shipment.estimatedPrice),
      qrDataUrl,
    },
  });
});
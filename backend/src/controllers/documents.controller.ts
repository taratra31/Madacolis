import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listMyDocuments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const documents = await prisma.document.findMany({
    where: { userId },
    include: { shipment: { select: { trackingNumber: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    documents: documents.map((d) => ({
      id: d.id,
      type: d.type,
      originalName: d.originalName,
      mimeType: d.mimeType,
      status: d.status,
      createdAt: d.createdAt,
      trackingNumber: d.shipment.trackingNumber,
    })),
  });
});
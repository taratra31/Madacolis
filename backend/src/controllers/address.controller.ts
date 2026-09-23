import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { createAuditLog } from "../services/audit.service.js";
import { str } from "../utils/str.js";

const userIdOf = (req: Request): string => req.user!.id;

export const listAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await prisma.address.findMany({
    where: { userId: userIdOf(req) },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  res.json({ success: true, addresses });
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = userIdOf(req);
  const data = req.body;

  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({ data: { ...data, userId } });

  await createAuditLog({
    userId,
    action: "ADDRESS.CREATE",
    entityType: "Address",
    entityId: address.id,
    newValues: { label: address.label, city: address.city },
  });

  res.status(201).json({ success: true, message: "Adresse créée", address });
});

export const getAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await prisma.address.findFirst({
    where: { id: str(req.params.id), userId: userIdOf(req) },
  });
  if (!address) throw new ApiError(404, "Adresse introuvable", "NOT_FOUND");
  res.json({ success: true, address });
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = userIdOf(req);
  const existing = await prisma.address.findFirst({ where: { id: str(req.params.id), userId } });
  if (!existing) throw new ApiError(404, "Adresse introuvable", "NOT_FOUND");

  if (req.body.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  const address = await prisma.address.update({ where: { id: existing.id }, data: req.body });

  await createAuditLog({
    userId,
    action: "ADDRESS.UPDATE",
    entityType: "Address",
    entityId: address.id,
    oldValues: { city: existing.city },
    newValues: { city: address.city },
  });

  res.json({ success: true, message: "Adresse mise à jour", address });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.address.findFirst({
    where: { id: str(req.params.id), userId: userIdOf(req) },
  });
  if (!existing) throw new ApiError(404, "Adresse introuvable", "NOT_FOUND");

  await prisma.address.delete({ where: { id: existing.id } });

  await createAuditLog({
    userId: userIdOf(req),
    action: "ADDRESS.DELETE",
    entityType: "Address",
    entityId: existing.id,
    oldValues: { city: existing.city },
  });

  res.json({ success: true, message: "Adresse supprimée" });
});
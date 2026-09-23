import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { signToken } from "../utils/jwt.js";
import { clientIp } from "../utils/generators.js";
import { createAuditLog } from "../services/audit.service.js";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  country: true,
  city: true,
  address: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

async function ensureUnique(phone: string, email?: string): Promise<void> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email } as Prisma.UserWhereInput] : [])] },
  });
  if (existing) {
    const conflict = existing.phone === phone ? "téléphone" : "email";
    throw new ApiError(409, `Un compte existe déjà avec ce ${conflict}`, "CONFLICT");
  }
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password, country, city, address } = req.body;

  await ensureUnique(phone, email ? (email as string) : undefined);

  const passwordHash = await bcrypt.hash(password as string, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email: email || null,
      phone,
      passwordHash,
      country,
      city,
      address,
    },
    select: safeUserSelect,
  });

  await createAuditLog({
    action: "AUTH.REGISTER",
    entityType: "User",
    entityId: user.id,
    newValues: { name: user.name, email: user.email },
    ipAddress: clientIp(req),
  });

  const token = signToken({ id: user.id, role: user.role });
  res.status(201).json({ success: true, message: "Compte créé", token, user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { phone: identifier }],
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "Identifiants invalides", "INVALID_CREDENTIALS");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Compte désactivé, contactez l'administrateur", "ACCOUNT_DISABLED");
  }

  await createAuditLog({
    userId: user.id,
    action: "AUTH.LOGIN",
    entityType: "User",
    entityId: user.id,
    ipAddress: clientIp(req),
  });

  const token = signToken({ id: user.id, role: user.role });

  const { passwordHash: _ph, ...safe } = user;
  res.json({ success: true, message: "Connexion réussie", token, user: safe });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await createAuditLog({
      userId: req.user.id,
      action: "AUTH.LOGOUT",
      entityType: "User",
      entityId: req.user.id,
      ipAddress: clientIp(req),
    });
  }
  res.json({ success: true, message: "Déconnexion réussie" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: safeUserSelect });
  if (!user) throw new ApiError(404, "Utilisateur introuvable", "NOT_FOUND");
  res.json({ success: true, user });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const current = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!current) throw new ApiError(404, "Utilisateur introuvable", "NOT_FOUND");

  if ((data.email && data.email !== current.email) || (data.phone && data.phone !== current.phone)) {
    await ensureUnique(data.phone ?? current.phone, data.email);
  }

  const user = await prisma.user.update({
    where: { id: current.id },
    data,
    select: safeUserSelect,
  });

  await createAuditLog({
    userId: current.id,
    action: "AUTH.PROFILE_UPDATE",
    entityType: "User",
    entityId: current.id,
    oldValues: { phone: current.phone, email: current.email },
    newValues: { phone: user.phone, email: user.email },
    ipAddress: clientIp(req),
  });

  res.json({ success: true, message: "Profil mis à jour", user });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new ApiError(404, "Utilisateur introuvable", "NOT_FOUND");

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new ApiError(401, "Mot de passe actuel incorrect", "INVALID_PASSWORD");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await createAuditLog({
    userId: user.id,
    action: "AUTH.PASSWORD_CHANGE",
    entityType: "User",
    entityId: user.id,
    ipAddress: clientIp(req),
  });

  res.json({ success: true, message: "Mot de passe modifié" });
});
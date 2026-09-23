import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentification requise", "UNAUTHORIZED");
    }

    const payload = verifyToken(header.slice(7));

    const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, email: true, role: true, isActive: true, carrierId: true } });
    if (!user || !user.isActive) {
      throw new ApiError(401, "Compte inactif ou introuvable", "UNAUTHORIZED");
    }

    req.user = { id: user.id, email: user.email, role: user.role, carrierId: user.carrierId };
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
      return;
    }
    next(new ApiError(401, "Token invalide ou expiré", "INVALID_TOKEN"));
  }
}
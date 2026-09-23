import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError.js";

/** Restreint une route à certains rôles (à utiliser APRÈS authenticate). */
export function authorize(...roles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new ApiError(401, "Authentification requise", "UNAUTHORIZED"));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, "Accès refusé : permissions insuffisantes", "FORBIDDEN"));
      return;
    }
    next();
  };
}
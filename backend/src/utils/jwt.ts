import jwt from "jsonwebtoken";
import { appConfig } from "../config/index.js";

export type JwtPayload = {
  id: string;
  role: string;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, appConfig.jwtSecret, {
    expiresIn: appConfig.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, appConfig.jwtSecret) as jwt.JwtPayload;
  return { id: decoded.id, role: decoded.role as string };
}
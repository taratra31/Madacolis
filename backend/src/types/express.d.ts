import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
        role: Role;
        carrierId: string | null;
      };
      /** Données de query validées par le middleware `validate` (req.query non assignable en Express 5). */
      validatedQuery?: unknown;
    }
  }
}

export {};
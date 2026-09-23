import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type Source = "body" | "query" | "params";

/** Valide la source avec un schéma Zod et remplace req.<source> par les données validées. */
export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation échouée",
        code: "VALIDATION_ERROR",
        errors: result.error.flatten(),
      });
      return;
    }
    if (source === "query") {
      // req.query n'est pas assignable (getter seule) en Express 5
      req.validatedQuery = result.data;
    } else {
      (req as unknown as Record<string, unknown>)[source] = result.data;
    }
    next();
  };
}
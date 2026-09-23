import type { NextFunction, Request, RequestHandler, Response } from "express";

type RateLimitOptions = {
  windowMs?: number;
  max?: number;
  message?: string;
};

const store = new Map<string, { count: number; resetAt: number }>();

/** Rate limiting en mémoire (dev). Pour la production, utiliser Redis. */
export function rateLimit(options: RateLimitOptions = {}): RequestHandler {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 100;
  const message = options.message ?? "Trop de requêtes, réessayez plus tard.";

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip ?? "unknown"}:${req.path}`;
    const now = Date.now();
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      res.setHeader("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      return res.status(429).json({
        success: false,
        message,
        code: "RATE_LIMITED",
      });
    }

    current.count += 1;
    return next();
  };
}
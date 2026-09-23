import crypto from "node:crypto";

/**
 * Génère un numéro de tracking unique pour un colis.
 * Format : MC-AAAA-MM-JJ-XXXXXXXX
 */
export function generateTrackingNumber(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `MC-${yyyy}-${mm}-${dd}-${suffix}`;
}

/**
 * Génère une référence de paiement unique.
 * Format : PAY-XXXXXXXX
 */
export function generatePaymentReference(): string {
  return `PAY-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
}

export function clientIp(req: { ip?: string }): string | null {
  return req.ip?.replace("::ffff:", "") ?? null;
}
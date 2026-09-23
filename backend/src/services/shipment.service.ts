import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Génère un numéro de tracking client au format MD-FR-YYYY-SEQNUM.
 * Exemple : MD-FR-2026-000001
 */
export async function generateClientTrackingNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MD-FR-${year}-`;
  const count = await prisma.shipment.count({ where: { trackingNumber: { startsWith: prefix } } });

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const seq = String(count + 1 + attempt).padStart(6, "0");
    const trackingNumber = `${prefix}${seq}`;
    const existing = await prisma.shipment.findUnique({ where: { trackingNumber } });
    if (!existing) return trackingNumber;
  }
  throw new ApiError(500, "Impossible de générer un numéro de tracking unique", "TRACKING_GENERATION_FAILED");
}

/** Délai de livraison estimé en fonction du type de service. */
export function deliveryDateFor(serviceType: string): Date {
  const days = { ECONOMY: 14, STANDARD: 9, EXPRESS: 5 }[serviceType] ?? 9;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/** Export/import déterministe historique ré-utilisable (semaines). */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
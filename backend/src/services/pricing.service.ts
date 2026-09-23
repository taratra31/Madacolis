import type { ServiceType } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { getDistanceKm } from "./distance.service.js";

export type ShippingMethod = "AIR" | "SEA";

export const DELIVERY_DAYS: Record<ServiceType, number> = {
  ECONOMY: 14,
  STANDARD: 9,
  EXPRESS: 5,
};

export interface ShippingMethodConfig {
  label: string;
  /** Multiplicateur du poids (prix/kg). */
  weightMult: number;
  /** Multiplicateur de la distance (prix/km). */
  distanceMult: number;
  /** Multiplicateur du tarif de base. */
  baseMult: number;
  /** Jours supplémentaires par rapport au délai du service. */
  extraDays: number;
  minDays: number;
  maxDays: number;
}

/** Modes de transport (transitaire) : avion rapide/cher, bateau lent/économique. */
export const SHIPPING_METHODS: Record<ShippingMethod, ShippingMethodConfig> = {
  AIR: { label: "Avion", weightMult: 1, distanceMult: 1, baseMult: 1, extraDays: 0, minDays: 0, maxDays: 0 },
  SEA: {
    label: "Bateau",
    weightMult: 0.55,
    distanceMult: 0.5,
    baseMult: 0.8,
    extraDays: 28,
    minDays: 28,
    maxDays: 42,
  },
};

export interface QuoteInput {
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  serviceType: ServiceType;
  /** Mode de transport : avion (défaut) ou bateau. */
  shippingMethod?: ShippingMethod;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  /** Volume total des articles en m³ (pour dimensionner le poids volumétrique global). */
  totalVolumeM3?: number;
  declaredValue?: number;
  /** Colis fragile ou précieux (téléphone, écran, verre...) : léger supplément. */
  fragile?: boolean;
}

export interface QuoteResult {
  price: number;
  currency: string;
  serviceType: ServiceType;
  shippingMethod: ShippingMethod;
  estimatedDeliveryDays: number;
  estimatedDeliveryDate: string;
  distanceKm: number;
  billingWeight: number;
  usingVolumetric: boolean;
  /** Prix public par kg (déjà pondéré par bateau/avion). */
  pricePerKg: number;
  isFragile: boolean;
  breakdown: {
    basePrice: number;
    weightCharge: number;
    distanceCharge: number;
    fragileSurcharge: number;
    total: number;
    minimumPrice: number;
    minimumApplied: boolean;
  };
}

/** Poids volumétrique (règle internationale 1:5000, en kg pour des cm). */
export function volumetricWeight(lengthCm: number, widthCm: number, heightCm: number): number {
  return (lengthCm * widthCm * heightCm) / 5000;
}

export async function computeQuote(input: QuoteInput): Promise<QuoteResult> {
  const rule = await prisma.pricingRule.findFirst({
    where: {
      originCountry: { equals: input.originCountry, mode: "insensitive" },
      destinationCountry: { equals: input.destinationCountry, mode: "insensitive" },
      serviceType: input.serviceType,
      isActive: true,
    },
  });

  if (!rule) {
    throw new ApiError(404, `Aucune règle tarifaire active pour "${input.originCountry} → ${input.destinationCountry}" (${input.serviceType})`, "PRICING_NOT_FOUND");
  }

  const distanceKm = await getDistanceKm(input.originCountry, input.originCity, input.destinationCountry, input.destinationCity);

  let weight = input.weightKg;
  let usingVolumetric = false;

  const volumetricFromTotal = input.totalVolumeM3 ? (input.totalVolumeM3 / 1) * 1000 : 0;
  if (volumetricFromTotal > weight) {
    weight = Math.round(volumetricFromTotal * 1000) / 1000;
    usingVolumetric = true;
  } else if (input.lengthCm && input.widthCm && input.heightCm) {
    const vol = volumetricWeight(input.lengthCm, input.widthCm, input.heightCm);
    if (vol > weight) {
      weight = vol;
      usingVolumetric = true;
    }
  }

  const method = SHIPPING_METHODS[input.shippingMethod ?? "AIR"];

  const basePrice = Number(rule.basePrice) * method.baseMult;
  const weightCharge = weight * Number(rule.pricePerKg) * method.weightMult;
  const distanceCharge = rule.pricePerKm ? distanceKm * Number(rule.pricePerKm) * method.distanceMult : 0;
  const pricePerKg = Math.round(Number(rule.pricePerKg) * method.weightMult * 100) / 100;
  let total = basePrice + weightCharge + distanceCharge;

  // Surcharge légère (+15 % des frais poids+distance) pour les colis fragiles / précieux.
  const fragile = Boolean(input.fragile);
  const fragileSurcharge = fragile ? Math.round((weightCharge + distanceCharge) * 0.15 * 100) / 100 : 0;
  total += fragileSurcharge;

  const minimumPrice = Number(rule.minimumPrice);
  const minimumApplied = total < minimumPrice;
  if (minimumApplied) total = minimumPrice;

  const price = Math.round(total * 100) / 100;
  const deliveryInDays = DELIVERY_DAYS[input.serviceType] + method.extraDays;
  const estimatedDeliveryDate = new Date(Date.now() + deliveryInDays * 24 * 60 * 60 * 1000);

  return {
    price,
    currency: rule.currency,
    serviceType: input.serviceType,
    shippingMethod: input.shippingMethod ?? "AIR",
    estimatedDeliveryDays: deliveryInDays,
    estimatedDeliveryDate: estimatedDeliveryDate.toISOString(),
    distanceKm,
    billingWeight: Math.round(weight * 1000) / 1000,
    usingVolumetric,
    pricePerKg,
    isFragile: fragile,
    breakdown: {
      basePrice: Math.round(basePrice * 100) / 100,
      weightCharge: Math.round(weightCharge * 100) / 100,
      distanceCharge: Math.round(distanceCharge * 100) / 100,
      fragileSurcharge,
      total: Math.round((basePrice + weightCharge + distanceCharge + fragileSurcharge) * 100) / 100,
      minimumPrice,
      minimumApplied,
    },
  };
}

/** Catalogue des services actifs pour l'affichage public. */
export async function listServices() {
  const rules = await prisma.pricingRule.findMany({
    where: { isActive: true },
    orderBy: [{ originCountry: "asc" }, { destinationCountry: "asc" }, { serviceType: "asc" }],
  });
  return rules.map((r) => ({
    originCountry: r.originCountry,
    destinationCountry: r.destinationCountry,
    serviceType: r.serviceType,
    basePrice: Number(r.basePrice),
    pricePerKg: Number(r.pricePerKg),
    minimumPrice: Number(r.minimumPrice),
    currency: r.currency,
  }));
}
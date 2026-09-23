import { getDistanceKm } from "./distance.service.js";
import type { ShippingMethod } from "./pricing.service.js";

/** Taux de change public utilisé par MadaColis (1 EUR ≈ 5 000 Ar). */
export const EUR_TO_MGA = 5000;

/** Densité moyenne retenue pour convertir poids → volume maritime (1 m³ ≈ 300 kg). */
export const SEA_DENSITY_KG_PER_M3 = 300;

/**
 * Commission MadaColis sur le devis transitaire (38 % → 20 %).
 * Tarif ramené le 18/02/2026 : le transitaire facture le client final au taux publié
 * et reverse 20 % de commission à MadaColis sur le sous-total transport.
 */
export const COMMISSION_RATE = 0.2;

export interface Transitaire {
  id: string;
  name: string;
  shortName: string;
  description: string;
  /** Tarif avion publié : Ariary par kilo facturable. */
  airPerKgAr: number;
  /** Tarif bateau publié : Ariary par mètre cube facturé. */
  seaPerM3Ar: number;
  /** Frais de dossier / manutention fixes (Ariary). */
  baseHandlingAr: number;
  /** Délai avion (jours). */
  airDays: number;
  /** Délai bateau (jours). */
  seaDays: number;
}

/** Transporteurs (transitaires) sélectionnables côté client — site pro. */
export const TRANSITAIRES: Transitaire[] = [
  {
    id: "madacolis",
    name: "MadaColis Express (agence)",
    shortName: "MadaColis",
    description: "Notre réseau de regroupement France → Madagascar : suivi, empotage et livraison partout dans l'île.",
    airPerKgAr: 75000,
    seaPerM3Ar: 250000,
    baseHandlingAr: 20000,
    airDays: 7,
    seaDays: 35,
  },
  {
    id: "dhl",
    name: "DHL Express",
    shortName: "DHL",
    description: "Livraison express porte-à-porte rapide et traçabilité totale.",
    airPerKgAr: 99000,
    seaPerM3Ar: 300000,
    baseHandlingAr: 40000,
    airDays: 3,
    seaDays: 30,
  },
  {
    id: "fedex",
    name: "FedEx",
    shortName: "FedEx",
    description: "Courrier express et colis urgent fiabilisés.",
    airPerKgAr: 92000,
    seaPerM3Ar: 275000,
    baseHandlingAr: 35000,
    airDays: 4,
    seaDays: 32,
  },
  {
    id: "agl",
    name: "AGL / Bolloré Madagascar",
    shortName: "AGL",
    description: "Fret maritime économique et dégroupage LCL pour volumes moyens.",
    airPerKgAr: 75000,
    seaPerM3Ar: 220000,
    baseHandlingAr: 25000,
    airDays: 10,
    seaDays: 45,
  },
  {
    id: "cmacgm",
    name: "CMA CGM",
    shortName: "CMA CGM",
    description: "Conteneurisation LCL/FCL et fret aérien complémentaire.",
    airPerKgAr: 85000,
    seaPerM3Ar: 245000,
    baseHandlingAr: 28000,
    airDays: 8,
    seaDays: 48,
  },
];

export function getTransitaire(id?: string): Transitaire {
  return TRANSITAIRES.find((t) => t.id === id) ?? TRANSITAIRES[0];
}

export function listTransitaires() {
  return TRANSITAIRES.map((t) => ({
    id: t.id,
    name: t.name,
    shortName: t.shortName,
    description: t.description,
    baseHandlingAr: t.baseHandlingAr,
    airPerKgAr: t.airPerKgAr,
    airPerKgEur: Math.round((t.airPerKgAr / EUR_TO_MGA) * 100) / 100,
    seaPerM3Ar: t.seaPerM3Ar,
    seaPerM3Eur: Math.round((t.seaPerM3Ar / EUR_TO_MGA) * 100) / 100,
    airDays: t.airDays,
    seaDays: t.seaDays,
  }));
}

export interface TransitaireQuoteInput {
  transitaireId?: string;
  shippingMethod?: ShippingMethod;
  /** Poids réel total (kg). */
  weightKg: number;
  /** Poids volumétrique avion (kg, règle 1:5000). */
  volumetricKg: number;
  /** Volume physique total (m³). */
  volumeM3: number;
  destinationCountry: string;
  destinationCity: string;
  fragile?: boolean;
}

export interface TransitaireQuoteResult {
  price: number;
  priceAr: number;
  currency: "EUR";
  transitaireId: string;
  transitaireName: string;
  shippingMethod: ShippingMethod;
  estimatedDeliveryDays: number;
  estimatedDeliveryDate: string;
  distanceKm: number;
  /** Poids facturable selon le mode (air : kg ; bateau : poids réel). */
  billingWeight: number;
  /** Volume facturable (m³) — bateau. */
  billingM3: number;
  usingVolumetric: boolean;
  /** Prix public avion par kg (EUR). */
  pricePerKg: number;
  /** Prix public bateau par m³ (EUR). */
  pricePerM3: number;
  ratePerKgAr: number;
  ratePerM3Ar: number;
  isFragile: boolean;
  breakdown: {
    baseHandlingAr: number;
    transportAr: number;
    fragileSurchargeAr: number;
    /** Commission MadaColis sur le devis (20 % du sous-total transport). */
    commissionAr: number;
    totalAr: number;
    totalEur: number;
    minimumPrice: number;
    minimumApplied: boolean;
  };
}

/**
 * Devis par transporteur (transitaire) :
 *   — AVION : facturé au kilo facturable (max poids réel / poids volumétrique 1:5000) ;
 *   — BATEAU : facturé au mètre cube (max volume physique / poids ramené en m³).
 * + surcharge légère (+15 % du transport) pour téléphones et colis fragiles.
 */
export async function computeTransitaireQuote(input: TransitaireQuoteInput): Promise<TransitaireQuoteResult> {
  const transitaire = getTransitaire(input.transitaireId);
  const method = input.shippingMethod ?? "AIR";
  const distanceKm = await getDistanceKm("France", "Paris", input.destinationCountry, input.destinationCity);

  const fragile = Boolean(input.fragile);

  let billingWeight = 0;
  let billingM3 = 0;
  let usingVolumetric = false;

  if (method === "AIR") {
    const chargeableKg = Math.max(input.weightKg, input.volumetricKg);
    billingWeight = Math.round(chargeableKg * 1000) / 1000;
    billingM3 = 0;
    usingVolumetric = chargeableKg > input.weightKg;
  } else {
    const volumeM3Pondere = Math.max(input.volumeM3, input.weightKg / SEA_DENSITY_KG_PER_M3);
    billingM3 = Math.round(volumeM3Pondere * 1000) / 1000;
    billingWeight = Math.round(input.weightKg * 1000) / 1000;
    usingVolumetric = volumeM3Pondere > input.volumeM3;
  }

  const baseHandlingAr = transitaire.baseHandlingAr;
  const transportAr = method === "AIR" ? billingWeight * transitaire.airPerKgAr : billingM3 * transitaire.seaPerM3Ar;
  const fragileSurchargeAr = fragile ? Math.round(transportAr * 0.15) : 0;
  /** Commission MadaColis (20 %) appliquée au sous-total devis (hors majoration). */
  const commissionAr = Math.round((baseHandlingAr + transportAr + fragileSurchargeAr) * COMMISSION_RATE);

  const totalAr = baseHandlingAr + transportAr + fragileSurchargeAr + commissionAr;
  const price = Math.round((totalAr / EUR_TO_MGA) * 100) / 100;

  const deliveryInDays = method === "AIR" ? transitaire.airDays : transitaire.seaDays;
  const estimatedDeliveryDate = new Date(Date.now() + deliveryInDays * 24 * 60 * 60 * 1000);

  return {
    price,
    priceAr: totalAr,
    currency: "EUR",
    transitaireId: transitaire.id,
    transitaireName: transitaire.name,
    shippingMethod: method,
    estimatedDeliveryDays: deliveryInDays,
    estimatedDeliveryDate: estimatedDeliveryDate.toISOString(),
    distanceKm,
    billingWeight,
    billingM3,
    usingVolumetric,
    pricePerKg: Math.round((transitaire.airPerKgAr / EUR_TO_MGA) * 100) / 100,
    pricePerM3: Math.round((transitaire.seaPerM3Ar / EUR_TO_MGA) * 100) / 100,
    ratePerKgAr: transitaire.airPerKgAr,
    ratePerM3Ar: transitaire.seaPerM3Ar,
    isFragile: fragile,
    breakdown: {
      baseHandlingAr,
      transportAr: Math.round(transportAr),
      fragileSurchargeAr,
      commissionAr,
      totalAr,
      totalEur: price,
      minimumPrice: 0,
      minimumApplied: false,
    },
  };
}
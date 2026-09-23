import { ApiError } from "../utils/ApiError.js";
import { analyzeProductUrl, type AnalyzedProduct } from "./product-analysis.service.js";
import type { ShippingMethod } from "./pricing.service.js";
import { computeTransitaireQuote, type TransitaireQuoteResult } from "./transitaire.service.js";

export interface ProductQuoteInput {
  link?: string;
  title?: string;
  quantity: number;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  declaredValueEUR?: number;
  isAutomated?: boolean;
  shippingMethod?: ShippingMethod;
  /** Transporteur (transitaire) choisi. */
  transitaireId?: string;
  /** Colis fragile/précieux (détecté automatiquement si imprécis). */
  fragile?: boolean;
}

const FRAGILE_KEYWORDS = /téléphone|telephone|smartphone|iphone|android|samsung|huawei|xiaomi|oneplus|\becrans?\b|\bécran\b|ecran|glass|verre|tablette|ipad|cristal|vase|montre connectée|montre connectee|drone/i;

function detectFragile(input: ProductQuoteInput): boolean {
  if (input.fragile != null) return input.fragile;
  const text = `${input.title ?? ""} ${input.link ?? ""}`;
  return FRAGILE_KEYWORDS.test(text);
}

export interface ProductQuoteResult {
  product: AnalyzedProduct;
  quantity: number;
  weightKg: number;
  payloadTotal: number;
  volumetricWeightKg: number;
  billingWeightKg: number;
  quote: TransitaireQuoteResult;
}

/**
 * Frais colis automatique pour un produit (site pro) :
 *   — si dimensions/poids fournis (produit du catalogue MadaColis), calcul direct ;
 *   — sinon on analyse le lien Amazon/Alibaba pour les infos produit ;
 *   — devis par transporteur : 75 000 Ar/kg avion, 250 000 Ar/m³ bateau (MadaColis),
 *     avec déduction des charges par classe transporteur.
 */
export async function quoteProduct(
  input: ProductQuoteInput,
  destinationCountry: string,
  destinationCity: string,
  _serviceType: "STANDARD" | "EXPRESS" | "ECONOMY",
  shippingMethod?: ShippingMethod,
): Promise<ProductQuoteResult> {
  if (input.quantity < 1) throw new ApiError(400, "Quantité invalide", "INVALID_QUANTITY");
  if (input.weightKg <= 0) throw new ApiError(400, "Le poids du produit est requis", "INVALID_WEIGHT");

  let product: AnalyzedProduct;
  if (input.link) {
    product = await analyzeProductUrl(input.link);
    if (input.title?.trim()) product = { ...product, title: input.title.trim() };
  } else {
    product = {
      marketplace: "UNKNOWN",
      url: input.isAutomated ? `https://madacolis.mg/catalogue/${encodeURIComponent(input.title ?? "produit")}` : "",
      productId: input.title ?? "produit",
      title: input.title ?? "Produit MadaColis",
      imageUrl: null,
      priceEUR: input.declaredValueEUR ?? null,
    };
  }

  const payloadTotal = input.weightKg * input.quantity;
  const volumetricPerUnit = input.lengthCm && input.widthCm && input.heightCm ? (input.lengthCm * input.widthCm * input.heightCm) / 5000 : 0;
  const volumetricWeightKg = Math.round(volumetricPerUnit * input.quantity * 1000) / 1000;
  const billingWeightKg = Math.max(payloadTotal, volumetricWeightKg);
  const volumeM3 = input.lengthCm && input.widthCm && input.heightCm ? (input.lengthCm * input.widthCm * input.heightCm * input.quantity) / 1_000_000 : 0;

  const quote = await computeTransitaireQuote({
    transitaireId: input.transitaireId,
    shippingMethod,
    weightKg: payloadTotal,
    volumetricKg: volumetricWeightKg,
    volumeM3: Math.round(volumeM3 * 1000) / 1000,
    destinationCountry,
    destinationCity,
    fragile: detectFragile(input),
  });

  return {
    product,
    quantity: input.quantity,
    weightKg: input.weightKg,
    payloadTotal: Math.round(payloadTotal * 1000) / 1000,
    volumetricWeightKg,
    billingWeightKg,
    quote,
  };
}
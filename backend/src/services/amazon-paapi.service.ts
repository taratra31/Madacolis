import { createHash, createHmac } from "crypto";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Amazon Product Advertising API 5.0 (PA-API) — recherche et fiche produit RÉELLES.
 * Nécessite : un compte Amazon Associates + des clés AWS (voir README).
 * L'authentification utilise AWS Signature Version 4 (service "ProductAdvertisingAPI").
 */

export interface AmazonProduct {
  asin: string;
  title: string;
  imageUrl: string | null;
  priceEUR: number | null;
  url: string;
  features: string[];
  /** Catégorie fille (ex : « Pièces & Accessoires auto »). */
  category?: string;
  /** Chemin hiérarchique (ex : « Auto & Moto > Pièces & Accessoires auto »). */
  categoryPath?: string;
  /** Poids réel du produit (kg) — quand fourni par la source. */
  weightKg?: number;
  /** Dimensions réelles (cm) — quand fournies par la source. */
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

const AMAZON_MARKETPLACE = "www.amazon.fr";

const RESOURCES = [
  "Images.Primary.Large",
  "ItemInfo.Title",
  "ItemInfo.Features",
  "Offers.Listings.Price",
];

function sha256(data: string | Buffer): Buffer {
  return createHash("sha256").update(data).digest();
}

function hmac(key: Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

export interface SignV4Params {
  accessKey: string;
  secretKey: string;
  host: string;
  region: string;
  service: string;
  method: string;
  path: string;
  query?: string;
  headers: Record<string, string>;
  amzDate: string;
  payload: string;
}

/** Signature AWS SigV4 — renvoie l'en-tête Authorization complet. */
export function signV4(params: SignV4Params): string {
  const { accessKey, secretKey, region, service, method, path, query = "", headers, amzDate, payload } = params;

  const signedHeaders = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort()
    .join(";");
  const canonicalHeaders = Object.entries(headers)
    .map(([key, value]) => `${key.toLowerCase()}:${value}\n`)
    .sort(([a], [b]) => a.localeCompare(b))
    .join("");

  const canonicalRequest = [method, path, query, canonicalHeaders, signedHeaders, sha256(payload).toString("hex")].join("\n");

  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest).toString("hex")].join("\n");

  const kDate = hmac(Buffer.from(`AWS4${secretKey}`, "utf8"), dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  return `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

export function isAmazonPaapiConfigured(): boolean {
  return Boolean(env.AMAZON_ACCESS_KEY && env.AMAZON_SECRET_KEY && env.AMAZON_PARTNER_TAG);
}

function ensureConfigured(): void {
  if (!isAmazonPaapiConfigured()) {
    throw new ApiError(
      400,
      "Amazon PA-API non configuré. Renseignez AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY et AMAZON_PARTNER_TAG dans backend/.env (compte Associés + clés AWS).",
      "PAAPI_NOT_CONFIGURED",
    );
  }
}

function signedFetch(path: string, body: Record<string, unknown>): Promise<unknown> {
  ensureConfigured();
  const host = env.AMAZON_HOST;
  const region = env.AMAZON_REGION;
  const service = "ProductAdvertisingAPI";
  const accessKey = env.AMAZON_ACCESS_KEY as string;
  const secretKey = env.AMAZON_SECRET_KEY as string;

  const payload = JSON.stringify({ ...body, Marketplace: AMAZON_MARKETPLACE });

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");

  const headers: Record<string, string> = {
    host,
    "x-amz-date": amzDate,
    "content-type": "application/json",
  };

  const authorization = signV4({
    accessKey,
    secretKey,
    host,
    region,
    service,
    method: "POST",
    path,
    headers,
    amzDate,
    payload,
  });

  return fetch(`https://${host}${path}`, {
    method: "POST",
    headers: { ...headers, authorization },
    body: payload,
  }).then(async (response) => {
    const text = await response.text();
    if (!response.ok) {
      throw new ApiError(502, `Erreur Amazon PA-API (${response.status}) : ${text.slice(0, 300)}`, "PAAPI_ERROR");
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError(502, "Réponse Amazon PA-API illisible", "PAAPI_ERROR");
    }
  });
}

interface RawAmazonItem {
  ASIN?: string;
  DetailPageURL?: string;
  ItemInfo?: {
    Title?: { DisplayValue?: string };
    Features?: { DisplayValues?: string[] };
  };
  Images?: {
    Primary?: { Large?: { URL?: string } };
  };
  Offers?: {
    Listings?: Array<{ Price?: { Amount?: number; Currency?: string } }>;
  };
}

function normalizeItem(item: RawAmazonItem): AmazonProduct {
  const price = item.Offers?.Listings?.[0]?.Price?.Amount ?? null;
  return {
    asin: item.ASIN ?? "",
    title: item.ItemInfo?.Title?.DisplayValue ?? item.ASIN ?? "",
    imageUrl: item.Images?.Primary?.Large?.URL ?? null,
    priceEUR: price,
    url: item.DetailPageURL ?? (item.ASIN ? `https://www.amazon.fr/dp/${item.ASIN}` : ""),
    features: item.ItemInfo?.Features?.DisplayValues ?? [],
  };
}

/** Recherche réelle de produits sur Amazon.fr via PA-API. */
export async function searchAmazonProducts(keywords: string, limit = 20): Promise<AmazonProduct[]> {
  const data = (await signedFetch("/paapi5/searchitems", {
    Keywords: keywords,
    ItemCount: Math.min(Math.max(limit, 1), 50),
    SearchIndex: "All",
    Resources: RESOURCES,
    PartnerTag: env.AMAZON_PARTNER_TAG,
    PartnerType: "Associates",
  })) as { SearchResult?: { Items?: RawAmazonItem[] } };

  const errors = (data as { Errors?: Array<{ Message?: string }> }).Errors;
  if (errors?.length) {
    throw new ApiError(502, `Amazon PA-API : ${errors[0].Message ?? "erreur inconnue"}`, "PAAPI_ERROR");
  }

  return (data.SearchResult?.Items ?? []).filter((item) => item.ASIN).map(normalizeItem);
}

/** Fiche produit réelle par ASIN (ou null si introuvable). */
export async function getAmazonProduct(asin: string): Promise<AmazonProduct | null> {
  const data = (await signedFetch("/paapi5/getitems", {
    ItemIds: [asin],
    Resources: RESOURCES,
    PartnerTag: env.AMAZON_PARTNER_TAG,
    PartnerType: "Associates",
  })) as { ItemsResult?: { Items?: RawAmazonItem[] } };

  const errors = (data as { Errors?: Array<{ Message?: string }> }).Errors;
  if (errors?.length) {
    throw new ApiError(502, `Amazon PA-API : ${errors[0].Message ?? "erreur inconnue"}`, "PAAPI_ERROR");
  }

  const item = data.ItemsResult?.Items?.find((i) => i.ASIN);
  return item ? normalizeItem(item) : null;
}
import { ApiError } from "../utils/ApiError.js";
import { getAmazonProduct, isAmazonPaapiConfigured } from "./amazon-paapi.service.js";

export interface AnalyzedProduct {
  marketplace: "AMAZON" | "ALIBABA" | "ALIEXPRESS" | "UNKNOWN";
  url: string;
  productId: string;
  title: string;
  imageUrl: string | null;
  priceEUR: number | null;
}

interface OpenGraphResponse {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const OG_RE = /<meta[^>]+property=["']og:(title|image|description)["'][^>]+content=["']([^"']+)["']/gi;

function readOgMeta(html: string): OpenGraphResponse {
  const meta: OpenGraphResponse = {};
  const matches = html.matchAll(OG_RE);
  for (const match of matches) {
    const key = match[1].trim();
    const value = match[2].trim();
    if (key === "og:title" || key === "og:image" || key === "og:description") {
      meta[key.replace("og:", "") as "title" | "image" | "description"] = value;
    }
  }
  if (!meta.title) {
    const m = html.match(/<title>([^<]*)<\/title>/i);
    if (m) meta.title = m[1].trim();
  }
  return meta;
}

function extractTitleFromUrl(url: URL): string {
  const pathTokens = url.pathname.split("/").filter(Boolean);
  if (url.pathname.includes("/product-detail/")) {
    const slug = url.pathname.split("/product-detail/")[1]?.split("/")[0]?.replace(/\.html$/i, "");
    if (slug) return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (url.pathname.includes("/item/")) {
    const m = url.pathname.match(/\/item\/(?:[^/]+-)?(\d{5,20})(?:\.html)?/i);
    if (m) return `Produit n° ${m[1]}`;
  }
  const tokens = pathTokens;
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const token = tokens[i];
    if (token.startsWith("dp/") || token.startsWith("gp/")) continue;
    if (/^[-a-z0-9]{6,}$/i.test(token)) {
      return token
        .replace(/[-_]/g, " ")
        .replace(/\.html$/i, "")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }
  return url.hostname.replace(/^www\./i, "");
}

function extractPriceFromUrl(url: URL, html: string): number | null {
  const pricePatterns = [
    /"priceAmount"[:\s]*([0-9]+(?:\.[0-9]+)?)/i,
    /"displayPrice"[:\s]*"([0-9]+(?:\.[0-9]+)?)"/i,
    />[€$]\s*([0-9]+(?:\.[0-9]+)?)</i,
  ];
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const value = Number.parseFloat(match[1]);
      if (Number.isFinite(value) && value > 0) return value;
    }
  }
  const q = url.searchParams.get("price");
  if (q) {
    const value = Number.parseFloat(q);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

function extractProductId(url: URL, host: string): string {
  if (host.includes("amazon")) {
    const dp = url.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
    if (dp) return dp[1];
    const gp = url.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    if (gp) return gp[1];
  }
  if (host.includes("alibaba")) {
    const m = url.pathname.match(/\/(\d{6,15})\.html/i);
    if (m) return m[1];
  }
  if (host.includes("aliexpress")) {
    const m = url.pathname.match(/\/item\/(?:[^/]+-)?(\d{5,20})(?:\.html)?/i);
    if (m) return m[1];
    const q = url.searchParams.get("itemId") ?? url.searchParams.get("_id");
    if (q && /^\d{5,20}$/.test(q)) return q;
  }
  return "";
}

function normalizeImageUrl(value: string | undefined, base: URL): string | null {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
}

function isBogusTitle(title: string | undefined): boolean {
  if (!title || title.trim().length < 6) return true;
  return /captcha|intercept|access denied|product detail|system is busy|page introuvable/i.test(title);
}

/** Analyse un lien produit Amazon / Alibaba (métadonnées Open Graph + regex). */
export async function analyzeProductUrl(rawUrl: string): Promise<AnalyzedProduct> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ApiError(400, "Lien invalide. Collez une URL complète (https://…)", "INVALID_URL");
  }
  const host = url.hostname.toLowerCase();
  const isAmazon = host.includes("amazon");
  const isAlibaba = host.includes("alibaba");
  const isAliexpress = host.includes("aliexpress");
  if (!isAmazon && !isAlibaba && !isAliexpress) {
    throw new ApiError(400, "Lien non reconnu : collez un lien de boutique en ligne pris en charge.", "UNSUPPORTED_MARKETPLACE");
  }

  const productId = extractProductId(url, host);

  // 1) Amazon : PA-API officiel → données RÉELLES (titre, photo, prix) si configuré.
  if (isAmazon && productId && isAmazonPaapiConfigured()) {
    try {
      const paProduct = await getAmazonProduct(productId);
      if (paProduct) {
        return {
          marketplace: "AMAZON",
          url: paProduct.url || rawUrl,
          productId,
          title: paProduct.title,
          imageUrl: paProduct.imageUrl,
          priceEUR: paProduct.priceEUR,
        };
      }
    } catch {
      // PA-API indisponible (clés invalides, réseau…) → repli sur le scraping.
    }
  }

  // 2) Alibaba / repli : métadonnées Open Graph + regex.
  let meta: OpenGraphResponse = {};
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(rawUrl, { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36" } });
    clearTimeout(timer);
    if (response.ok) {
      const html = await response.text();
      meta = readOgMeta(html);
    }
  } catch {
    // Le scraping peut échouer (blocage, réseau…) — on retombe sur les infos de l'URL.
  }

  return {
    marketplace: isAmazon ? "AMAZON" : isAliexpress ? "ALIEXPRESS" : "ALIBABA",
    url: rawUrl,
    productId: productId || rawUrl,
    title: isBogusTitle(meta.title) ? extractTitleFromUrl(url) : meta.title as string,
    imageUrl: normalizeImageUrl(meta.image, url),
    priceEUR: extractPriceFromUrl(url, ""),
  };
}
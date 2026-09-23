import type { AmazonProduct } from "./amazon-paapi.service.js";

/**
 * Catalogue « curated » — fournit de vrais produits (titre, photo, prix) sans clé PA-API.
 * Sources : API publiques gratuites sans inscription (DummyJSON + FakeStoreAPI), mises en cache.
 * Dès que la clé Amazon PA-API est configurée, le routeur bascule sur la recherche Amazon réelle.
 */

interface CuratedEntry {
  product: AmazonProduct;
  category: string;
  /** Date de « publication » (epoch ms) : détermine un ordre stable et récent-d'abord. */
  postedAt?: number;
}

let cache: CuratedEntry[] | null = null;
let cacheAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;
const USD_TO_EUR = 0.92;
const FETCH_TIMEOUT_MS = 15000;
const HOUR_MS = 3_600_000;
/** Dates de publication de référence (fixes, données synthétiques déterministes). */
const DUMMY_BASE_MS = Date.UTC(2025, 9, 1);
const FAKE_BASE_MS = Date.UTC(2025, 10, 1);
const PLATZI_BASE_MS = Date.UTC(2025, 11, 1);
const OFP_BASE_MS = Date.UTC(2025, 0, 1);
const BEST_BASE_MS = Date.UTC(2026, 8, 1);

async function fetchJson(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const POPULAR_CATEGORY_ORDER = [
  "smartphones",
  "laptops",
  "mens-watches",
  "womens-watches",
  "audio",
  "tablets",
  "kitchen",
  "mobile-accessories",
  "beauty",
  "fragrances",
];

/**
 * Synonymes de recherche — appliqués sur la REQUÊTE uniquement (jamais sur les produits).
 * Un terme générique (ex : « smartphone ») accepte des variantes, mais une marque exacte
 * (ex : « iphone ») reste exacte : une recherche « iphone » ne renvoie que des produits
 * dont le titre contient « iphone ».
 */
const SYNONYMS: Record<string, string[]> = {
  smartphone: ["smartphone", "telephone", "phone", "mobile", "iphone", "samsung", "xiaomi", "oneplus", "oppo", "huawei", "google", "pixel", "galaxy", "redmi", "poco"],
  telephone: ["smartphone", "telephone", "phone", "mobile", "iphone", "samsung", "xiaomi", "oneplus", "oppo", "huawei", "google", "pixel", "galaxy"],
  phone: ["smartphone", "telephone", "phone", "mobile", "iphone", "samsung", "xiaomi", "oneplus", "oppo", "huawei", "google", "pixel", "galaxy"],
  mobile: ["smartphone", "telephone", "phone", "mobile", "iphone", "samsung", "xiaomi", "oneplus", "oppo", "huawei", "google", "pixel", "galaxy"],
  montre: ["montre", "watch", "smartwatch", "galaxy watch", "apple watch", "fitness tracker", "rolex", "casio", "swatch"],
  montres: ["montre", "watch", "smartwatch", "galaxy watch", "apple watch", "fitness tracker", "rolex", "casio", "swatch"],
  watch: ["montre", "watch", "smartwatch", "galaxy watch", "apple watch", "fitness tracker", "rolex", "casio", "swatch"],
  ecouteurs: ["ecouteur", "earbud", "earphone", "headphone", "casque", "airpod", "bluetooth"],
  ecouteur: ["ecouteur", "earbud", "earphone", "headphone", "casque", "airpod", "bluetooth"],
  earbuds: ["ecouteur", "earbud", "earphone", "headphone", "casque", "airpod", "bluetooth"],
  casque: ["ecouteur", "earbud", "earphone", "headphone", "casque", "airpod", "bluetooth"],
  bluetooth: ["bluetooth", "earbud", "earphone", "headphone", "speaker"],
  parfum: ["fragrance", "cologne", "eau de parfum", "eau de toilette", "perfume"],
  maquillage: ["maquillage", "makeup", "cosmetic", "mascara", "fond de teint", "palette", "lotion"],
  makeup: ["maquillage", "makeup", "cosmetic", "mascara", "fond de teint", "palette", "lotion"],
  friteuse: ["air fryer", "friteuse", "fryer"],
  fryer: ["air fryer", "friteuse", "fryer"],
  aspirateur: ["aspirateur", "vacuum", "robot vac", "stick vacuum"],
  vacuum: ["aspirateur", "vacuum", "robot vac", "stick vacuum"],
  cafe: ["cafe", "coffee", "espresso", "nespresso", "ristretto", "latte", "capu", "cafetiere"],
  coffee: ["cafe", "coffee", "espresso", "nespresso", "ristretto", "latte", "capu", "cafetiere"],
  ordinateur: ["ordinateur", "laptop", "portable", "ultrabook", "notebook", "chromebook", "macbook", "pc"],
  laptop: ["ordinateur", "laptop", "portable", "ultrabook", "notebook", "chromebook", "macbook", "pc"],
  portable: ["ordinateur", "laptop", "portable", "ultrabook", "notebook", "chromebook", "macbook", "pc"],
  pc: ["ordinateur", "laptop", "portable", "ultrabook", "notebook", "chromebook", "macbook", "pc"],
  tablette: ["tablette", "tablet", "ipad"],
  tablet: ["tablette", "tablet", "ipad"],
  ipad: ["tablette", "tablet", "ipad"],
  sneaker: ["sneaker", "chaussure", "basket", "running", "shoes", "botte", "sandale"],
  chaussure: ["sneaker", "chaussure", "basket", "running", "shoes", "botte", "sandale"],
  shoes: ["sneaker", "chaussure", "basket", "running", "shoes", "botte", "sandale"],
  accessoire: ["accessoire", "accessory", "accessories", "coque", "case"],
  accessories: ["accessoire", "accessory", "accessories", "coque", "case"],
  veste: ["veste", "jacket", "blouson", "parka", "manteau", "coat"],
  manteau: ["veste", "jacket", "blouson", "parka", "manteau", "coat"],
  pull: ["pull", "sweater", "pullover", "cardigan", "pul"],
  pantalon: ["pantalon", "pants", "jeans", "trouser", "jogger"],
  jean: ["jeans"],
  jeans: ["jeans"],
  robe: ["robe", "dress", "dresses", "gown"],
  homme: ["homme", "men", "mens", "man", "men's", "male", "unisex"],
  femme: ["femme", "woman", "women", "womens", "women's", "ladies", "girl"],
  sac: ["sac", "bag", "tote", "handbag", "backpack", "sac a main", "pochette"],
  robot: ["robot", "multicooker", "cooker", "food processor", "extracteur"],
  patissier: ["patissier", "petrisseur", "batteur", "stand mixer", "kitchenaid", "bread maker"],
  petrisseur: ["patissier", "petrisseur", "batteur", "stand mixer", "kitchenaid", "bread maker"],
};

const CATEGORY_TREE: Array<{ parent: string; children: Array<{ name: string; match: RegExp }> }> = [
  {
    parent: "High-tech",
    children: [
      { name: "Téléphones & Smartphones", match: /smartphone|téléphone|telephone|\bphone\b|iphone|samsung|huawei|xiaomi|oneplus|\boppo\b|google pixel|pixel\b/i },
      { name: "Ordinateurs & Tablettes", match: /laptop|ordinateur|portable|macbook|ultrabook|\bpc\b|tablette|ipad|chromebook|notebook/i },
      { name: "Audio & Écouteurs", match: /écouteur|earbud|casque|headphon|enceinte|speaker|airpod|bluetooth|son |audio/i },
      { name: "Accessoires & Pièces téléphone", match: /chargeur|cable|câble|coque|case|magsafe|verre trempé|screen protector|protect/ },
    ],
  },
  {
    parent: "Auto & Moto",
    children: [
      { name: "Voiture", match: /voiture|\bcar\b|chevrolet|fiat|renault|peugeot|citro(?:ën)?|lamborghini|toyota|ford|audi|bmw|hyundai/i },
      { name: "Moto", match: /moto|motorcycle|scooter|kawasaki|yamaha|honda|suzuki|ktm/i },
      { name: "Pièces & Accessoires auto", match: /pièce|pneus?|volant|frein|rétroviseur|pare-?brise|plaquette|disque|phare|batterie auto|huile moteur|balai d?essuie|accessoire auto/i },
    ],
  },
  {
    parent: "Mode",
    children: [
      { name: "Vêtements", match: /vêtement|chemise|t-?shirt|blouse|pull|robe|dress|pantalon|short|veste|jean|sweat|tops|top\b|cardigan/i },
      { name: "Chaussures", match: /chaussure|sneaker|basket|running|shoes|botte|sandale|mocassin|null/ },
      { name: "Montres", match: /montre|watch|rolex|iwc|swatch|casio/i },
      { name: "Bijoux", match: /jewellery|jewelry|bijou|collier|necklace|bracelet|chaîne|bague|ring|pendentif/i },
      { name: "Sacs & Accessoires", match: /sac|bag\b|bags|portefeuille|wallet|ceinture|belt|écharpe|chapeau|chapé/i },
      { name: "Lunettes de soleil", match: /lunette|sunglasses/i },
    ],
  },
  {
    parent: "Beauté & Santé",
    children: [
      { name: "Parfums", match: /parfum|fragrance|cologne|eau de parfum|eau de toilette|edt|edp|toilette/i },
      { name: "Cosmétiques & Soin", match: /cosmét|maquillage|mascara|rouge à lèvres|sérum|crème|soin|skin.?care|lotion|beauté|blush|fond de teint|palette|lèvres|vernis/i },
      { name: "Hygiène", match: /hygiène|savon|dentifrice|shampoing|shampoo|gel douche|déodorant/i },
    ],
  },
  {
    parent: "Maison & Électroménager",
    children: [
      { name: "Grands électroménagers", match: /réfrigérateur|frigo|lave-?linge|four\b|plaques|cuisinière|congélateur/i },
      { name: "Petits électroménagers", match: /friteuse|air fryer|robot pâtissier|cuiseur|cafetière|machine à café|aspirateur|mixer|blender|grille-?pain|bouilloire|centrifugeuse/i },
      { name: "Cuisine & Ustensiles", match: /cuisine|cutlery|couteau|poêle|casserole|verre|assiette|tasse|ustensile|gourde|tupperware/i },
      { name: "Décoration & Meubles", match: /décoration|decoration|meuble|chaise|bureau|table|étagère|lampe|cadre|rideau|coussin|lit\b|miroir|vase/i },
    ],
  },
  {
    parent: "Sport & Loisirs",
    children: [
      { name: "Fitness & Musculation", match: /fitness|musculation|haltère|tapis|yoga|treadmill|rameur|corde à sauter/i },
      { name: "Vélo & Outdoor", match: /vélo|bicycle|trottinette|camping|tente|sac de couchage|randonnée/i },
      { name: "Accessoires sport", match: /sport|sports|sneaker|jogging/i },
    ],
  },
  {
    parent: "Épicerie & Alimentation",
    children: [
      { name: "Boissons & Café", match: /café|coffee|espresso|ristretto|capu|thé|tea|jus|juice|boisson|drink|soda|limonade|eau\b|sirop|infusion/i },
      { name: "Petit-déjeuner & Céréales", match: /petit.?déjeuner|breakfast|céréale|cereal|muesli|crêpe|pancake|crakers?|biscuit\b|gaufre/ },
      { name: "Snacks & Confiserie", match: /snack|chocolat|chocol|bonbon|candy|cookie|chips|gâteau|cake|muffin|dessert|confiture|concentre|corne|biscuit|tartine|crème/ },
      { name: "Conserves & Épicerie", match: /conserve|canned|soupe|sauce|huile|vinaigre|vin(?:aigre)?|pâtes|pasta|riz|rice|légume|fruit|miel|honey|jambon|saucisson|purée|fromage|yaourt|yogourt|lait\b|oeuf|œuf/ },
    ],
  },
  {
    parent: "Bébé & Enfant",
    children: [{ name: "Bébé & Puériculture", match: /bébé|baby|enfant|kinder|lait infantile|petit pot|couche|biberon|lange/i }],
  },
];

const RAW_CATEGORY_FALLBACK: Record<string, [string, string]> = {
  smartphones: ["High-tech", "Téléphones & Smartphones"],
  laptops: ["High-tech", "Ordinateurs & Tablettes"],
  tablets: ["High-tech", "Ordinateurs & Tablettes"],
  "mobile-accessories": ["High-tech", "Accessoires & Pièces téléphone"],
  audio: ["High-tech", "Audio & Écouteurs"],
  "mens-watches": ["Mode", "Montres"],
  "womens-watches": ["Mode", "Montres"],
  vehicle: ["Auto & Moto", "Voiture"],
  motorcycle: ["Auto & Moto", "Moto"],
  tops: ["Mode", "Vêtements"],
  "mens-shirts": ["Mode", "Vêtements"],
  "mens-shoes": ["Mode", "Chaussures"],
  "womens-shoes": ["Mode", "Chaussures"],
  snickers: ["Mode", "Chaussures"],
  "womens-bags": ["Mode", "Sacs & Accessoires"],
  "womens-dresses": ["Mode", "Vêtements"],
  "womens-jewellery": ["Mode", "Bijoux"],
  "men-shirts": ["Mode", "Vêtements"],
  beauty: ["Beauté & Santé", "Cosmétiques & Soin"],
  "skin-care": ["Beauté & Santé", "Cosmétiques & Soin"],
  fragrances: ["Beauté & Santé", "Parfums"],
  "home-decoration": ["Maison & Électroménager", "Décoration & Meubles"],
  furniture: ["Maison & Électroménager", "Décoration & Meubles"],
  kitchen: ["Maison & Électroménager", "Petits électroménagers"],
  "kitchen-accessories": ["Maison & Électroménager", "Cuisine & Ustensiles"],
  groceries: ["Épicerie & Alimentation", "Conserves & Épicerie"],
  "épicerie-france": ["Épicerie & Alimentation", "Épicerie variée"],
  "ef-boissons": ["Épicerie & Alimentation", "Boissons & Café"],
  "ef-petit-dejeuner": ["Épicerie & Alimentation", "Petit-déjeuner & Céréales"],
  "ef-snacks": ["Épicerie & Alimentation", "Snacks & Confiserie"],
  "ef-conserves": ["Épicerie & Alimentation", "Conserves & Épicerie"],
};

export interface CategoryNode {
  slug: string;
  name: string;
  productCount: number;
  children: Array<{ slug: string; name: string; count: number }>;
}

/** Devine une sous-catégorie d'épicerie à partir des tags Open Food Facts (en:xxx). */
export function hintFromOFP(tags: string[] | undefined): string {
  const set = new Set((tags ?? []).map((t) => t.toLowerCase()));
  if (["en:soft-drinks", "en:fruit-juices", "en:coffees", "en:teas", "en:waters", "en:beers", "en:wines"].some((t) => set.has(t))) return "ef-boissons";
  if (["en:breakfast-cereals", "en:jams", "en:spreads", "en:honeys", "en:yogurts", "en:breakfast-cereals"].some((t) => set.has(t))) return "ef-petit-dejeuner";
  if (["en:snacks", "en:chocolates", "en:candies", "en:chips", "en:chocolate-products", "en:cookies", "en:cakes", "en:biscuits"].some((t) => set.has(t))) return "ef-snacks";
  if (["en:canned-foods", "en:pasta", "en:rices", "en:cooking-oils", "en:sauces", "en:condiments", "en:vinegars", "en:canned-vegetables", "en:fish", "en:meats"].some((t) => set.has(t))) return "ef-conserves";
  return "épicerie-france";
}

export function classifyCategory(title: string, rawCategory?: string): { parent: string; child: string } {
  const lower = ` ${cleanTitle(title).toLowerCase()} `;
  for (const parentGroup of CATEGORY_TREE) {
    for (const child of parentGroup.children) {
      const m = lower.match(child.match);
      if (m) return { parent: parentGroup.parent, child: child.name };
    }
  }
  const fallback = rawCategory ? RAW_CATEGORY_FALLBACK[rawCategory] : undefined;
  if (fallback) return { parent: fallback[0], child: fallback[1] };
  return { parent: "Autres", child: "Divers" };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  const entries = await getMergedProducts();
  const childCounts = new Map<string, Map<string, number>>();
  const parentTotal = new Map<string, number>();
  for (const e of entries) {
    if (!isDesirable(e)) continue;
    const cl = classifyCategory(e.product.title, e.category);
    if (!childCounts.has(cl.parent)) childCounts.set(cl.parent, new Map());
    childCounts.get(cl.parent)!.set(cl.child, (childCounts.get(cl.parent)!.get(cl.child) ?? 0) + 1);
    parentTotal.set(cl.parent, (parentTotal.get(cl.parent) ?? 0) + 1);
  }
  return Array.from(childCounts.entries())
    .map(([parent, childMap]) => ({
      slug: slugify(parent),
      name: parent,
      productCount: parentTotal.get(parent) ?? 0,
      children: Array.from(childMap.entries())
        .map(([name, count]) => ({ slug: slugify(name), name, count }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.productCount - a.productCount);
}

function cleanTitle(title: string): string {
  let decoded = title;
  try {
    decoded = decodeURIComponent(title);
  } catch {
    decoded = title;
  }
  return decoded.replace(/&.*/, "").trim();
}

function toAmazonUrl(title: string): string {
  return `https://www.amazon.fr/s?k=${encodeURIComponent(cleanTitle(title).slice(0, 80))}`;
}

/** Normalise un texte pour la recherche : minuscules + suppression des accents. */
function normText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeEntry(
  id: string,
  title: string,
  imageUrl: string | null,
  priceUsd: number | null,
  category?: string,
  meta?: { weightKg?: number; lengthCm?: number; widthCm?: number; heightCm?: number },
  postedAt?: number,
): CuratedEntry {
  const clean = cleanTitle(title);
  const cat = classifyCategory(clean, category);
  const product: AmazonProduct = {
    asin: id,
    title: clean,
    imageUrl,
    priceEUR: priceUsd != null ? Math.round(priceUsd * USD_TO_EUR * 100) / 100 : null,
    url: toAmazonUrl(clean),
    features: [],
    category: cat.child,
    categoryPath: `${cat.parent} > ${cat.child}`,
    ...meta,
  };
  const entry: CuratedEntry = { product, category: category ?? "" };
  if (postedAt != null) entry.postedAt = postedAt;
  return entry;
}

const VALID_TITLE = /^[A-Za-zÀ-ÿ0-9 ,\-'()&.:/]+$/;
const cleanTitleForCatalog = (t: string): string =>
  t
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N} ,\-'()&.:/]+/gu, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

async function fetchDummyJson(): Promise<CuratedEntry[]> {
  try {
    const data = (await fetchJson(
      "https://dummyjson.com/products?limit=0&select=id,title,thumbnail,price,category,weight,dimensions",
    )) as {
      products?: Array<{
        id: number;
        title: string;
        thumbnail?: string;
        price?: number;
        category?: string;
        weight?: number;
        dimensions?: { width?: number; height?: number; depth?: number };
      }>;
    } | null;
    if (!data?.products) return [];
    return data.products
      .map((p) => ({ ...p, title: cleanTitleForCatalog(p.title) }))
      .filter((p) => p.title.length >= 3 && VALID_TITLE.test(p.title))
      .map((p) =>
        makeEntry(
          `dummy-${p.id}`,
          p.title,
          p.thumbnail ?? null,
          p.price ?? null,
          p.category,
          {
            weightKg: p.weight ? Math.round((p.weight / 1000) * 1000) / 1000 : undefined,
            lengthCm: p.dimensions?.width,
            widthCm: p.dimensions?.depth,
            heightCm: p.dimensions?.height,
          },
          DUMMY_BASE_MS + Number(p.id) * HOUR_MS,
        ),
      );
  } catch {
    return [];
  }
}

async function fetchFakeStore(): Promise<CuratedEntry[]> {
  try {
    const data = (await fetchJson("https://fakestoreapi.com/products")) as Array<{
      id: number;
      title: string;
      image?: string;
      price?: number;
      category?: string;
    }> | null;
    if (!Array.isArray(data)) return [];
    return data
      .map((p) => ({ ...p, title: cleanTitleForCatalog(p.title) }))
      .filter((p) => VALID_TITLE.test(p.title))
      .map((p) => makeEntry(`fakestore-${p.id}`, p.title, p.image ?? null, p.price ?? null, p.category, undefined, FAKE_BASE_MS + Number(p.id) * HOUR_MS));
  } catch {
    return [];
  }
}

/** API e-commerce gratuite (Platzi) : vêtements, électronique, chaussures, mobilier, divers. */
async function fetchPlatzi(): Promise<CuratedEntry[]> {
  try {
    const data = (await fetchJson("https://api.escuelajs.co/api/v1/products?offset=0&limit=200", 20000)) as Array<{
      id: number;
      title?: string;
      price?: number;
      images?: string[];
      category?: { name?: string };
    }> | null;
    if (!Array.isArray(data)) return [];
    return data
      .map((p) => {
        const title = cleanTitleForCatalog(typeof p.title === "string" ? p.title : "");
        const imageUrl =
          (Array.isArray(p.images) ? p.images.find((i): i is string => typeof i === "string" && i.startsWith("http")) : null) ?? null;
        return { title, imageUrl, price: p.price ?? null, category: p.category?.name ?? "misc" };
      })
      .filter((p) => p.title.length >= 8 && VALID_TITLE.test(p.title))
      .map((p, i) => makeEntry(`platzi-${i}`, p.title, p.imageUrl, p.price, p.category, undefined, PLATZI_BASE_MS + i * HOUR_MS));
  } catch {
    return [];
  }
}

/** Produits « best-sellers » ajoutés à la main pour couvrir les recherches populaires du site
 * (robot pâtissier, montre connectée, air fryer, écouteurs, machine à café, parfum, aspirateur…). */
interface CuratedBestseller {
  title: string;
  priceUsd: number;
  rawCategory: string;
  /** Nom de fichier Wikimedia Commons (électroménager, montre, casque…) servi via Special:FilePath. */
  img: string;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

const CURATED_BESTSELLERS: CuratedBestseller[] = [
  // Robot pâtissier
  { title: "Robot Pâtissier Artisan 4.8L — KitchenAid", priceUsd: 399, rawCategory: "kitchen", img: "File:Red KitchenAid Artisan.jpg", weightKg: 8.1, lengthCm: 40, widthCm: 35, heightCm: 38 },
  { title: "Robot Pâtissier Cuisine Companion — Moulinex", priceUsd: 329, rawCategory: "kitchen", img: "File:Moulinex-PA1A.jpg", weightKg: 7.2, lengthCm: 40, widthCm: 35, heightCm: 36 },
  { title: "Robot Pâtissier Chef XL — Kenwood", priceUsd: 279, rawCategory: "kitchen", img: "File:White KitchenAid mixer (KSM150PSWH).jpg", weightKg: 6.8, lengthCm: 42, widthCm: 30, heightCm: 35 },
  { title: "Robot Pâtissier Batteur 1200W Écran Tactile", priceUsd: 159, rawCategory: "kitchen", img: "File:Mixing batter with kitchen mixer while preparing for baking session.jpg", weightKg: 5.4, lengthCm: 35, widthCm: 26, heightCm: 30 },
  { title: "Robot Pétrisseur Multifonction — Bosch", priceUsd: 189, rawCategory: "kitchen", img: "File:Bosch Küchenmaschine „Neuzeit I“.jpg", weightKg: 5.9, lengthCm: 37, widthCm: 28, heightCm: 32 },
  // Montre connectée
  { title: "Apple Watch SE Montre Connectée 44mm GPS", priceUsd: 249, rawCategory: "mens-watches", img: "File:Apple Watch Series 7; January 2022 (01).jpg", weightKg: 0.1, lengthCm: 5, widthCm: 5, heightCm: 5 },
  { title: "Galaxy Watch 6 Montre Connectée 44mm", priceUsd: 329, rawCategory: "mens-watches", img: "File:SAMSUNG Galaxy Watch (5).jpg", weightKg: 0.1, lengthCm: 5, widthCm: 5, heightCm: 5 },
  { title: "Amazfit GTR 4 Montre Connectée GPS", priceUsd: 199, rawCategory: "mens-watches", img: "File:Huawei Smartwatch Fit 2.jpg", weightKg: 0.1, lengthCm: 5, widthCm: 5, heightCm: 5 },
  { title: "Watch GT 4 Montre Connectée Élégante", priceUsd: 249, rawCategory: "mens-watches", img: "File:Huawei Smartwatch (Band 4).jpg", weightKg: 0.1, lengthCm: 5, widthCm: 5, heightCm: 5 },
  { title: "Watch S2 Montre Connectée 44mm", priceUsd: 129, rawCategory: "mens-watches", img: "File:Apple Watch Sport.jpg", weightKg: 0.1, lengthCm: 5, widthCm: 5, heightCm: 5 },
  // Air fryer
  { title: "Air Fryer XL 5.5L Sans Huile — Philips", priceUsd: 119, rawCategory: "kitchen", img: "File:Air Fryer 2020.jpg", weightKg: 5.2, lengthCm: 36, widthCm: 30, heightCm: 34 },
  { title: "Friteuse Air Fryer 4.7L — Ninja", priceUsd: 149, rawCategory: "kitchen", img: "File:Airfryer Convert.jpg", weightKg: 5.8, lengthCm: 38, widthCm: 32, heightCm: 34 },
  { title: "Air Fryer Digital 6L Écran Tactile — Cosori", priceUsd: 99, rawCategory: "kitchen", img: "File:Tabletop convection oven.jpg", weightKg: 5.5, lengthCm: 38, widthCm: 30, heightCm: 36 },
  { title: "Friteuse Air Fryer ActiFry Original — Tefal", priceUsd: 169, rawCategory: "kitchen", img: "File:Air Fryer 2020.jpg", weightKg: 6.2, lengthCm: 40, widthCm: 32, heightCm: 30 },
  { title: "Friteuse Air Fryer 3.2L — Moulinex", priceUsd: 89, rawCategory: "kitchen", img: "File:Airfryer Convert.jpg", weightKg: 4.4, lengthCm: 32, widthCm: 28, heightCm: 30 },
  // Écouteurs bluetooth
  { title: "AirPods Pro 2 Écouteurs Bluetooth — Apple", priceUsd: 249, rawCategory: "audio", img: "File:AirPods Pro (2nd generation).jpg", weightKg: 0.25, lengthCm: 8, widthCm: 8, heightCm: 5 },
  { title: "Écouteurs Bluetooth Sony WH-1000XM5", priceUsd: 399, rawCategory: "audio", img: "File:Bose QuietComfort 25 Acoustic Noise Cancelling Headphones with Carry Case.jpg", weightKg: 0.4, lengthCm: 22, widthCm: 18, heightCm: 8 },
  { title: "Écouteurs Bluetooth JBL Tune 770NC", priceUsd: 129, rawCategory: "audio", img: "File:Headphones 1.jpg", weightKg: 0.3, lengthCm: 20, widthCm: 17, heightCm: 7 },
  // Machine à café
  { title: "Machine à Café NESPRESSO Essenza Mini", priceUsd: 129, rawCategory: "kitchen", img: "File:Lelit Semiautomatic Espresso Machine with PID and Pressure Gauge.jpg", weightKg: 2.3, lengthCm: 33, widthCm: 12, heightCm: 21 },
  { title: "Machine à Café Delonghi Magnifica S", priceUsd: 399, rawCategory: "kitchen", img: "File:Automatic espresso machine 02.JPG", weightKg: 9.5, lengthCm: 43, widthCm: 24, heightCm: 34 },
  { title: "Machine à Café Senseo HD7871 Wahoo", priceUsd: 99, rawCategory: "kitchen", img: "File:Macchina per il caffè 2.jpg", weightKg: 1.8, lengthCm: 32, widthCm: 22, heightCm: 30 },
  { title: "Machine Expresso Automatique 15 Bars", priceUsd: 189, rawCategory: "kitchen", img: "File:Krups Vivo F880 home espresso maker.jpg", weightKg: 6.5, lengthCm: 36, widthCm: 24, heightCm: 30 },
  { title: "Machine à Café à Filtre — Philips", priceUsd: 49, rawCategory: "kitchen", img: "File:Coffee-Krups-Espressomachine.jpg", weightKg: 1.6, lengthCm: 25, widthCm: 18, heightCm: 32 },
  { title: "Machine à Café Nespresso Vertuo Plus", priceUsd: 149, rawCategory: "kitchen", img: "File:Nespresso Vertuo Pop.jpg", weightKg: 3.9, lengthCm: 30, widthCm: 13, heightCm: 28 },
  // Parfum
  { title: "Eau de Parfum Sauvage 100ml — Dior", priceUsd: 109, rawCategory: "fragrances", img: "File:Eau Sauvage Christian Dior.jpg", weightKg: 0.3, lengthCm: 5, widthCm: 5, heightCm: 15 },
  { title: "L'Eau de Parfum N5 100ml — Chanel", priceUsd: 135, rawCategory: "fragrances", img: "File:Chanel No 5 Paris.jpg", weightKg: 0.3, lengthCm: 5, widthCm: 5, heightCm: 15 },
  { title: "Eau de Parfum La Vie Est Belle 100ml — Lancome", priceUsd: 105, rawCategory: "fragrances", img: "File:Eau Parfum Magie Lancome pic2.JPG", weightKg: 0.3, lengthCm: 5, widthCm: 5, heightCm: 15 },
  { title: "Eau de Toilette Invictus 100ml — Paco Rabanne", priceUsd: 89, rawCategory: "fragrances", img: "File:2023 Woda toaletowa Paco Rabanne 1 Million.jpg", weightKg: 0.3, lengthCm: 5, widthCm: 5, heightCm: 15 },
  { title: "Eau de Parfum Le Male Intense 125ml", priceUsd: 95, rawCategory: "fragrances", img: "File:Gaultier Le Mâle.jpg", weightKg: 0.3, lengthCm: 5, widthCm: 5, heightCm: 15 },
  { title: "Eau de Parfum Flower 50ml — Yves Rocher", priceUsd: 49, rawCategory: "fragrances", img: "File:Miss Dior Chérie bottle.jpg", weightKg: 0.2, lengthCm: 4, widthCm: 4, heightCm: 12 },
  // Aspirateur
  { title: "Aspirateur V8 Sans Fil Pro 2200W", priceUsd: 399, rawCategory: "kitchen", img: "File:Dyson V8 handstick vacuum.jpg", weightKg: 2.6, lengthCm: 25, widthCm: 22, heightCm: 125 },
  { title: "Aspirateur Balai — Rowenta Air Force", priceUsd: 199, rawCategory: "kitchen", img: "File:Aspirapolvere Rowenta.jpg", weightKg: 4.2, lengthCm: 25, widthCm: 24, heightCm: 115 },
  { title: "Aspirateur Traineau — Philips PowerPro", priceUsd: 149, rawCategory: "kitchen", img: "File:Aerus Lux canister vacuums 2018.jpg", weightKg: 5.8, lengthCm: 35, widthCm: 28, heightCm: 30 },
  { title: "Aspirateur Robot DEEBOT — Ecovacs", priceUsd: 329, rawCategory: "kitchen", img: "File:Robot Vacuum 2016 (31606445890).jpg", weightKg: 3.2, lengthCm: 35, widthCm: 35, heightCm: 10 },
  { title: "Aspirateur Balai Sans Fil 8000Pa", priceUsd: 99, rawCategory: "kitchen", img: "File:Aspirapolvere Rowenta.jpg", weightKg: 2.8, lengthCm: 25, widthCm: 22, heightCm: 110 },
  { title: "Aspirateur Eau et Poussiere — Karcher", priceUsd: 189, rawCategory: "kitchen", img: "File:Kärcher-Hochdruckreiniger.jpg", weightKg: 7.4, lengthCm: 34, widthCm: 30, heightCm: 52 },
];

const commonsImg = (file: string): string => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=500`;

function fetchCuratedBestsellers(): CuratedEntry[] {
  return CURATED_BESTSELLERS.map((b, i) =>
    makeEntry(
      `best-${i + 1}`,
      b.title,
      commonsImg(b.img),
      b.priceUsd,
      b.rawCategory,
      {
        weightKg: b.weightKg,
        lengthCm: b.lengthCm,
        widthCm: b.widthCm,
        heightCm: b.heightCm,
      },
      BEST_BASE_MS + (CURATED_BESTSELLERS.length - i) * HOUR_MS,
    ),
  );
}

const OFP_PAGES = 10;
const OFP_PAGE_SIZE = 250;

async function fetchOpenFoodFacts(): Promise<CuratedEntry[]> {
  const results = await Promise.allSettled(Array.from({ length: OFP_PAGES }, (_, i) => fetchOFPPage(i + 1)));

  const all: CuratedEntry[] = [];
  for (const r of results) if (r.status === "fulfilled") all.push(...r.value);
  return all;
}

/** Convertit la quantité réelle d'un produit (ex : « 500 g », « 4 x 250 g », « 1,5 l ») en poids net kg. */
function parseQuantityKg(q?: string): number | undefined {
  if (!q) return undefined;
  const s = q.trim().replace(/,/g, ".");
  const multi = s.match(/^([0-9]+(?:\.[0-9]+)?)\s*x\s*([0-9]+(?:\.[0-9]+)?)\s*(kg|g|t|ml|l|cl)/i);
  if (multi) {
    const count = Number(multi[1]);
    const v = Number(multi[2]);
    const u = multi[3].toLowerCase();
    const perKg = u === "kg" || u === "l" || u === "t" ? (u === "t" ? v * 1000 : v) : u === "cl" ? v / 100 : v / 1000;
    return Math.round(count * perKg * 1000) / 1000;
  }
  const single = s.match(/^([0-9]+(?:\.[0-9]+)?)\s*(kg|g|t|ml|l|cl)/i);
  if (single) {
    const v = Number(single[1]);
    const u = single[2].toLowerCase();
    if (u === "kg" || u === "l") return Math.round(v * 1000) / 1000;
    if (u === "cl") return Math.round((v / 100) * 1000) / 1000;
    if (u === "t") return Math.round((v * 1000) * 1000) / 1000;
    return Math.round((v / 1000) * 1000) / 1000;
  }
  return undefined;
}

async function fetchOFPPage(page: number): Promise<CuratedEntry[]> {
  const params = new URLSearchParams({
    sort_by: "unique_scans_n",
    page_size: String(OFP_PAGE_SIZE),
    page: String(page),
    json: "true",
    fields: "product_name,brands,image_url,image_small_url,code,quantity,categories_tags,created_t",
  });
  const url = `https://search.openfoodfacts.org/search?${params.toString()}`;
  const res = await fetchJson(url, 20000);
  if (!res) return [];
  const data = res as { hits?: Array<Record<string, unknown>> };
  const entries: CuratedEntry[] = [];
  for (const rawHit of data.hits ?? []) {
    const p = (rawHit.doc ?? rawHit) as {
      code?: string | number;
      product_name?: string;
      brands?: string | string[];
      image_url?: string | null;
      image_small_url?: string | null;
      categories_tags?: string[];
      quantity?: string;
      created_t?: number | null;
    };
    try {
      if (!p.product_name) continue;
      const title = cleanTitle(p.product_name);
      if (title.length < 6 || title.length > 90) continue;
      if (!p.image_small_url && !p.image_url) continue;
      const brands = Array.isArray(p.brands) ? p.brands.join(", ") : p.brands ?? "";
      const image = p.image_small_url ?? p.image_url ?? null;
      const cat = hintFromOFP(p.categories_tags);
      const weightKg = parseQuantityKg(p.quantity);
      const postedAt = typeof p.created_t === "number" && p.created_t > 0 ? p.created_t * 1000 : OFP_BASE_MS + entries.length * HOUR_MS;
      entries.push(
        makeEntry(`off-${String(p.code ?? title)}`, `${title}${brands ? " — " + brands : ""}`, image, null, cat, { weightKg }, postedAt),
      );
    } catch {
      continue;
    }
  }
  return entries;
}

async function getMergedProducts(): Promise<CuratedEntry[]> {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL_MS) return cache;
  const [dummy, fakeStore, platzi, bestsellers, ofp] = await Promise.all([
    fetchDummyJson(),
    fetchFakeStore(),
    fetchPlatzi(),
    Promise.resolve(fetchCuratedBestsellers()),
    fetchOpenFoodFacts(),
  ]);
  const seen = new Set<string>();
  const merged: CuratedEntry[] = [];
  for (const list of [dummy, fakeStore, platzi, bestsellers, ofp]) {
    for (const e of list) {
      if (seen.has(e.product.asin)) continue;
      seen.add(e.product.asin);
      merged.push(e);
    }
  }
  cache = merged;
  cacheAt = now;
  return cache;
}

/**
 * Score précis : chaque mot de la requête doit correspondre au titre du produit
 * (éventuellement élargi par un synonyme générique). Dès qu'un mot ne correspond
 * pas, le produit est exclu — une recherche « iphone » ne renvoie que des iPhones.
 */
/** Tokens dont on interdit la forme littérale (évite les faux positifs, ex : prénom « Jean », aliments « parfum fraise »). */
const NON_LITERAL = new Set(["jean", "parfum"]);

/** Qualité de correspondance d'une variante dans le titre : 10 = mot exact, 8 = préfixe, 0 = absent. */
function titleMatch(titleText: string, variant: string): number {
  if (!variant) return 0;
  const escaped = escapeRegExp(variant);
  if (new RegExp(`(^|[^a-z0-9])${escaped}(?=[^a-z0-9]|$)`, "i").test(titleText)) return 10;
  if (variant.length >= 4 && new RegExp(`(^|[^a-z0-9])${escaped}[a-z0-9]*`, "i").test(titleText)) return 8;
  return 0;
}

function score(query: string, e: CuratedEntry): number {
  const titleText = normText(e.product.title);
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;

  let s = 0;
  for (const token of tokens) {
    const n = normText(token);
    const base = SYNONYMS[n] ? [n, ...SYNONYMS[n]] : [n];
    const variants = NON_LITERAL.has(n) ? (SYNONYMS[n] ?? []) : base;
    let best = 0;
    for (const v of variants) {
      const m = titleMatch(titleText, v);
      if (m > best) best = m;
    }
    if (best === 0) return 0;
    s += best;
  }
  if (titleText.includes(normText(query))) s += 15;
  return s;
}

const JUNK_TITLES = new Set([
  "apple",
  "lemon",
  "blue",
  "silver",
  "black",
  "red",
  "green",
  "white",
  "nike",
  "adidas",
  "cat food",
  "dog food",
  "beef steak",
  "canned",
  "milk",
  "eggs",
  "diet",
]);

function isDesirable(e: CuratedEntry): boolean {
  const t = e.product.title.toLowerCase();
  if (JUNK_TITLES.has(t)) return false;
  if (e.product.priceEUR != null && e.product.priceEUR < 3) return false;
  if (t.length < 8 || t.length > 90) return false;
  return true;
}

/** Sélection « populaires » : un mix varié et équilibré (rouleau tournant par sous-catégorie, électronique d'abord). */
function pickPopular(entries: CuratedEntry[], limit: number): AmazonProduct[] {
  const desirable = entries.filter(isDesirable);
  const groups = new Map<string, CuratedEntry[]>();
  for (const e of desirable) {
    const g = e.category || "divers";
    const list = groups.get(g) ?? [];
    list.push(e);
    groups.set(g, list);
  }
  const ordered = Array.from(groups.values()).sort((a, b) => {
    const ia = POPULAR_CATEGORY_ORDER.indexOf(a[0].category ?? "");
    const ib = POPULAR_CATEGORY_ORDER.indexOf(b[0].category ?? "");
    const va = ia === -1 ? POPULAR_CATEGORY_ORDER.length : ia;
    const vb = ib === -1 ? POPULAR_CATEGORY_ORDER.length : ib;
    return va - vb || b.length - a.length;
  });

  const result: AmazonProduct[] = [];
  const seen = new Set<string>();
  let added = true;
  while (added && result.length < limit) {
    added = false;
    for (const list of ordered) {
      const e = list.find((x) => !seen.has(x.product.asin));
      if (!e) continue;
      seen.add(e.product.asin);
      result.push(e.product);
      added = true;
      if (result.length >= limit) break;
    }
  }
  return result;
}

interface CuratedResult {
  products: AmazonProduct[];
  total: number;
}

/** Recherche dans le catalogue curated. Retourne toujours des résultats si le corpus n'est pas vide. */
export async function searchCuratedAmazon(query: string, limit = 20, skip = 0, category?: string): Promise<CuratedResult> {
  const entries = await getMergedProducts();
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safeSkip = Math.max(skip, 0);

  const catSlug = category?.trim().toLowerCase();
  const filtered = catSlug
    ? entries.filter((e) => {
        const cl = classifyCategory(e.product.title, e.category);
        return catSlug === slugify(cl.parent) || catSlug === slugify(cl.child);
      })
    : entries;

  const q = query.trim();
  if (!q) {
    const byDate = [...filtered].sort((a, b) => (b.postedAt ?? 0) - (a.postedAt ?? 0));
    const popular = pickPopular(byDate, byDate.length);
    return {
      products: popular.slice(safeSkip, safeSkip + safeLimit),
      total: popular.length,
    };
  }

  const scored = filtered
    .map((e) => ({ e, s: score(q, e) }))
    .sort((a, b) => b.s - a.s || a.e.product.title.length - b.e.product.title.length || (b.e.postedAt ?? 0) - (a.e.postedAt ?? 0));
  const matches = scored.filter((x) => x.s > 0).map((x) => x.e);

  if (matches.length === 0) return { products: [], total: 0 };

  return {
    products: matches.slice(safeSkip, safeSkip + safeLimit).map((e) => e.product),
    total: matches.length,
  };
}

/** Fiche produit unique par ID (asin interne type "dummy-123"). */
export async function getCuratedProductById(id: string): Promise<AmazonProduct | null> {
  const entries = await getMergedProducts();
  return entries.find((e) => e.product.asin === id)?.product ?? null;
}
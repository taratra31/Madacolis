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
  /** Titre normalisé (minuscules, sans accents) — pré-calculé pour accélérer la recherche. */
  norm?: string;
}

let cache: CuratedEntry[] | null = null;
let cacheAt = 0;
let inflight: Promise<CuratedEntry[]> | null = null;
/** « Populaires » pré-calculés (ordre rotatif hebdomadaire) — recalculé au remplissage du cache. */
let cachePopular: AmazonProduct[] = [];
let cachePopularWk = -1;
const CACHE_TTL_MS = 30 * 60 * 1000;
const USD_TO_EUR = 0.92;
const FETCH_TIMEOUT_MS = 15000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
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
  "sports-accessories": ["Sport & Loisirs", "Accessoires sport"],
  bicycle: ["Sport & Loisirs", "Vélo & Outdoor"],
  accessories: ["Mode", "Accessoires & Lunettes"],
  baby: ["Bébé & Enfant", "Bébé & Puériculture"],
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
  /** Galerie d'images complémentaire — la première (imageUrl) est dédupliquée si présente. */
  extraImages?: string[],
): CuratedEntry {
  const clean = cleanTitle(title);
  const cat = classifyCategory(clean, category);
  const gallery = [imageUrl, ...(extraImages ?? [])].filter((u): u is string => Boolean(u));
  const product: AmazonProduct = {
    asin: id,
    title: clean,
    imageUrl,
    images: gallery,
    priceEUR: priceUsd != null ? Math.round(priceUsd * USD_TO_EUR * 100) / 100 : null,
    url: toAmazonUrl(clean),
    features: [],
    category: cat.child,
    categoryPath: `${cat.parent} > ${cat.child}`,
    ...meta,
  };
  const entry: CuratedEntry = { product, category: category ?? "", norm: normText(clean) };
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
        const images = (Array.isArray(p.images) ? p.images.filter((i): i is string => typeof i === "string" && i.startsWith("http")) : []).slice(0, GALLERY_MAX);
        const imageUrl = images[0] ?? null;
        return { title, imageUrl, images, price: p.price ?? null, category: p.category?.name ?? "misc" };
      })
      .filter((p) => p.title.length >= 8 && VALID_TITLE.test(p.title))
      .map((p, i) => makeEntry(`platzi-${i}`, p.title, p.imageUrl, p.price, p.category, undefined, PLATZI_BASE_MS + i * HOUR_MS, p.images.slice(1)));
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
  // ===== Smartphones & tablettes =====
  { title: "iPhone 14 Pro Smartphone 256Go", priceUsd: 1099, rawCategory: "smartphones", img: "File:IPhone 14 Pro.jpg", weightKg: 0.24, lengthCm: 15, widthCm: 7, heightCm: 1 },
  { title: "iPhone 13 Smartphone 128Go", priceUsd: 699, rawCategory: "smartphones", img: "File:IPhone 13.jpg", weightKg: 0.2, lengthCm: 15, widthCm: 7, heightCm: 1 },
  { title: "Tablette Samsung Galaxy Tab S8 11\"", priceUsd: 699, rawCategory: "tablets", img: "File:Samsung Galaxy Tab S8.jpg", weightKg: 0.5, lengthCm: 25, widthCm: 17, heightCm: 1 },
  // ===== Électroménager =====
  { title: "Lave-Linge Hublot 9Kg 1400Trs/min", priceUsd: 549, rawCategory: "kitchen", img: "File:Washing machine open.jpg", weightKg: 68, lengthCm: 60, widthCm: 60, heightCm: 85 },
  { title: "Réfrigérateur Combiné 270L No Frost", priceUsd: 649, rawCategory: "kitchen", img: "File:Refrigerator.jpg", weightKg: 64, lengthCm: 60, widthCm: 65, heightCm: 178 },
  { title: "Four Micro-Ondes 30L Grill — Samsung", priceUsd: 129, rawCategory: "kitchen", img: "File:Microwave oven.jpg", weightKg: 14, lengthCm: 51, widthCm: 40, heightCm: 31 },
  { title: "Machine à Café Espresso 15 Bars — DeLonghi", priceUsd: 259, rawCategory: "kitchen", img: "File:Espresso machine.jpg", weightKg: 8.5, lengthCm: 36, widthCm: 26, heightCm: 34 },
  { title: "Cafetière Expresso Moka Pot 3 Tasses", priceUsd: 29, rawCategory: "kitchen", img: "File:Moka pot.jpg", weightKg: 0.4, lengthCm: 15, widthCm: 10, heightCm: 20 },
  { title: "Machine à Café Filtre Programmable 1.4L", priceUsd: 45, rawCategory: "kitchen", img: "File:Coffee maker.jpg", weightKg: 2.2, lengthCm: 24, widthCm: 18, heightCm: 34 },
  // ===== Audio & accessoires =====
  { title: "AirPods Pro Écouteurs Sans Fil — Apple", priceUsd: 249, rawCategory: "audio", img: "File:AirPods Pro.jpg", weightKg: 0.2, lengthCm: 7, widthCm: 7, heightCm: 3 },
  { title: "Casque Audio Bluetooth ANC 40h", priceUsd: 99, rawCategory: "audio", img: "File:Headphones.jpg", weightKg: 0.3, lengthCm: 20, widthCm: 19, heightCm: 8 },
  { title: "Écouteurs Intra Sans Fil 30h — Bose", priceUsd: 179, rawCategory: "audio", img: "File:Earbuds.jpg", weightKg: 0.1, lengthCm: 6, widthCm: 6, heightCm: 3 },
  { title: "Microphone USB Clavier-XLR Streaming", priceUsd: 79, rawCategory: "audio", img: "File:Microphone.jpg", weightKg: 0.8, lengthCm: 18, widthCm: 12, heightCm: 12 },
  // ===== Gaming & informatique =====
  { title: "PlayStation 5 Console 825Go", priceUsd: 499, rawCategory: "audio", img: "File:PlayStation 5.jpg", weightKg: 4.5, lengthCm: 39, widthCm: 26, heightCm: 10 },
  { title: "Nintendo Switch Console + Jeu", priceUsd: 299, rawCategory: "audio", img: "File:Nintendo Switch.jpg", weightKg: 0.4, lengthCm: 24, widthCm: 10, heightCm: 1 },
  { title: "PC Gamer RTX 4060 16Go RAM", priceUsd: 1299, rawCategory: "audio", img: "File:Gaming PC.jpg", weightKg: 8, lengthCm: 48, widthCm: 20, heightCm: 48 },
  { title: "Écran PC 27\" QHD 144Hz", priceUsd: 249, rawCategory: "audio", img: "File:Monitor.jpg", weightKg: 5, lengthCm: 62, widthCm: 18, heightCm: 43 },
  { title: "Clavier Mécanique RGB + Souris", priceUsd: 59, rawCategory: "audio", img: "File:Keyboard.jpg", weightKg: 1.2, lengthCm: 44, widthCm: 13, heightCm: 4 },
  { title: "Souris Sans Fil Bluetooth 4000dpi", priceUsd: 25, rawCategory: "audio", img: "File:Mouse.jpg", weightKg: 0.1, lengthCm: 12, widthCm: 6, heightCm: 4 },
  { title: "Imprimante Multifonction Jet d'Encre — Canon", priceUsd: 79, rawCategory: "audio", img: "File:Printer.jpg", weightKg: 5.6, lengthCm: 42, widthCm: 30, heightCm: 17 },
  { title: "Clé USB 128Go USB 3.0", priceUsd: 19, rawCategory: "audio", img: "File:USB flash drive.jpg", weightKg: 0.02, lengthCm: 6, widthCm: 2, heightCm: 1 },
  // ===== Photo & maison connectée =====
  { title: "Appareil Photo Hybride Canon EOS R", priceUsd: 1799, rawCategory: "audio", img: "File:Canon EOS R.jpg", weightKg: 1.2, lengthCm: 14, widthCm: 10, heightCm: 7 },
  { title: "Liseuse Kindle 16Go Écran 6\"", priceUsd: 99, rawCategory: "audio", img: "File:Kindle.jpg", weightKg: 0.3, lengthCm: 16, widthCm: 11, heightCm: 1 },
  // ===== Mode homme & femme =====
  { title: "Baskets Air Force 1 Blanche — Nike", priceUsd: 119, rawCategory: "mens-shoes", img: "File:Nike Air Force 1.jpg", weightKg: 0.8, lengthCm: 32, widthCm: 12, heightCm: 12 },
  { title: "Baskets New Balance 574 Grises", priceUsd: 89, rawCategory: "mens-shoes", img: "File:New Balance 574.jpg", weightKg: 0.7, lengthCm: 32, widthCm: 12, heightCm: 12 },
  { title: "Baskets de Running Trail — Salomon", priceUsd: 129, rawCategory: "mens-shoes", img: "File:Running shoes.jpg", weightKg: 0.6, lengthCm: 32, widthCm: 11, heightCm: 11 },
  { title: "Baskets Sneakers Mode Urbain", priceUsd: 59, rawCategory: "snickers", img: "File:Sneakers.jpg", weightKg: 0.7, lengthCm: 32, widthCm: 12, heightCm: 11 },
  { title: "Chemise Oxford Coton Homme", priceUsd: 39, rawCategory: "mens-shirts", img: "File:Shirt.jpg", weightKg: 0.2, lengthCm: 30, widthCm: 20, heightCm: 2 },
  { title: "T-Shirt Coton Uni — Lot de 3", priceUsd: 29, rawCategory: "tops", img: "File:T-shirt.jpg", weightKg: 0.3, lengthCm: 25, widthCm: 20, heightCm: 2 },
  { title: "Robe Longue FLou Été Femme", priceUsd: 45, rawCategory: "womens-dresses", img: "File:Dress.jpg", weightKg: 0.3, lengthCm: 40, widthCm: 20, heightCm: 2 },
  { title: "Jean Slim 5 Poches Homme", priceUsd: 49, rawCategory: "mens-shirts", img: "File:Jeans.jpg", weightKg: 0.5, lengthCm: 40, widthCm: 30, heightCm: 2 },
  { title: "Sweat Hoodie Polaire Molletonné", priceUsd: 39, rawCategory: "tops", img: "File:Hoodie.jpg", weightKg: 0.5, lengthCm: 35, widthCm: 30, heightCm: 2 },
  // ===== Accessoires mode =====
  { title: "Lunettes de Soleil Aviator Métal", priceUsd: 49, rawCategory: "accessories", img: "File:Aviator sunglasses.jpg", weightKg: 0.05, lengthCm: 14, widthCm: 5, heightCm: 4 },
  { title: "Lunettes de Soleil Oakley Sport", priceUsd: 129, rawCategory: "accessories", img: "File:Oakley sunglasses.jpg", weightKg: 0.05, lengthCm: 14, widthCm: 5, heightCm: 4 },
  { title: "Sac à Dos Urbain 18L — Anti-vol", priceUsd: 59, rawCategory: "womens-bags", img: "File:Backpack.jpg", weightKg: 0.6, lengthCm: 43, widthCm: 30, heightCm: 12 },
  { title: "Sac à Main Cuir Femme", priceUsd: 79, rawCategory: "womens-bags", img: "File:Leather bag.jpg", weightKg: 0.7, lengthCm: 30, widthCm: 12, heightCm: 22 },
  { title: "Valise Cabine Rigide 55cm — Luggage", priceUsd: 89, rawCategory: "womens-bags", img: "File:Luggage.jpg", weightKg: 2.6, lengthCm: 55, widthCm: 38, heightCm: 23 },
  // ===== Montres =====
  { title: "Apple Watch Série 7 GPS 45mm", priceUsd: 399, rawCategory: "mens-watches", img: "File:Apple Watch.jpg", weightKg: 0.1, lengthCm: 5, widthCm: 5, heightCm: 5 },
  { title: "Montre Connectée Fitness GPS", priceUsd: 149, rawCategory: "mens-watches", img: "File:Smartwatch.jpg", weightKg: 0.1, lengthCm: 5, widthCm: 5, heightCm: 5 },
  { title: "Galaxy Watch 5 GPS 40mm — Samsung", priceUsd: 279, rawCategory: "mens-watches", img: "File:Galaxy Watch.jpg", weightKg: 0.1, lengthCm: 5, widthCm: 5, heightCm: 5 },
  { title: "Montre Homme Classique Acier — Tissot", priceUsd: 449, rawCategory: "mens-watches", img: "File:Tissot watch.jpg", weightKg: 0.15, lengthCm: 4, widthCm: 4, heightCm: 1 },
  { title: "Montre Femme Élégante Bracelet", priceUsd: 119, rawCategory: "womens-watches", img: "File:Wrist watch.jpg", weightKg: 0.1, lengthCm: 3, widthCm: 3, heightCm: 1 },
  { title: "Montre G-Shock Résistante — Casio", priceUsd: 149, rawCategory: "mens-watches", img: "File:Casio G-Shock.jpg", weightKg: 0.09, lengthCm: 5, widthCm: 5, heightCm: 2 },
  // ===== Sport & loisirs =====
  { title: "Ballon de Basketball Taille 7", priceUsd: 25, rawCategory: "sports-accessories", img: "File:Basketball.jpg", weightKg: 0.6, lengthCm: 25, widthCm: 25, heightCm: 25 },
  { title: "Tapis de Yoga Antidérapant 6mm", priceUsd: 29, rawCategory: "sports-accessories", img: "File:Yoga mat.jpg", weightKg: 1.1, lengthCm: 183, widthCm: 61, heightCm: 1 },
  { title: "Rameur Plieant Home Gym", priceUsd: 249, rawCategory: "sports-accessories", img: "File:Rowing machine.jpg", weightKg: 26, lengthCm: 190, widthCm: 55, heightCm: 50 },
  { title: "VTT Trekking 26 Pouces 21 Vitesses", priceUsd: 289, rawCategory: "bicycle", img: "File:Bicycle.jpg", weightKg: 14, lengthCm: 165, widthCm: 60, heightCm: 95 },
  { title: "Canne à Pêche Télescopique 3.6m", priceUsd: 29, rawCategory: "sports-accessories", img: "File:Fishing rod.jpg", weightKg: 0.4, lengthCm: 30, widthCm: 8, heightCm: 8 },
  { title: "Tente 2 Places Camping Imperméable", priceUsd: 79, rawCategory: "sports-accessories", img: "File:Tent.jpg", weightKg: 2.8, lengthCm: 50, widthCm: 15, heightCm: 15 },
  // ===== Maison =====
  { title: "Lampe de Bureau LED Réglable 12W", priceUsd: 35, rawCategory: "home-decoration", img: "File:Desk lamp.jpg", weightKg: 1.2, lengthCm: 40, widthCm: 15, heightCm: 45 },
  { title: "Ventilateur Plafond 52\" Silencieux", priceUsd: 129, rawCategory: "home-decoration", img: "File:Ceiling fan.jpg", weightKg: 7, lengthCm: 60, widthCm: 60, heightCm: 25 },
  { title: "Climatiseur Split Inverter 9000 BTU", priceUsd: 599, rawCategory: "home-decoration", img: "File:Air conditioner.jpg", weightKg: 38, lengthCm: 80, widthCm: 30, heightCm: 30 },
  { title: "Aspirateur Robot Aspirant + Laveur", priceUsd: 399, rawCategory: "kitchen", img: "File:Roomba.jpg", weightKg: 3.4, lengthCm: 35, widthCm: 35, heightCm: 10 },
  // ===== Beauté =====
  { title: "Eau de Parfum Pour Femme 50ml", priceUsd: 69, rawCategory: "fragrances", img: "File:Perfume bottle.jpg", weightKg: 0.25, lengthCm: 5, widthCm: 5, heightCm: 14 },
  { title: "Rouge à Lèvres Mat Longue Tenue", priceUsd: 19, rawCategory: "beauty", img: "File:Lipstick.jpg", weightKg: 0.1, lengthCm: 3, widthCm: 3, heightCm: 8 },
  { title: "Vernis à Ongles — Coffret 12 Teintes", priceUsd: 25, rawCategory: "beauty", img: "File:Nail polish.jpg", weightKg: 0.6, lengthCm: 20, widthCm: 15, heightCm: 5 },
  { title: "Correcteur Visage Anti-Cernes", priceUsd: 15, rawCategory: "beauty", img: "File:Concealer.jpg", weightKg: 0.1, lengthCm: 3, widthCm: 3, heightCm: 9 },
];

const commonsImg = (file: string): string => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=500`;

/** Pools d'images regroupés par catégorie brute (toutes familles confondues), pour enrichir les bestsellers. */
let familyImgByCat: Record<string, string[]> | null = null;
function imgPoolForCat(cat: string): string[] {
  if (!familyImgByCat) {
    familyImgByCat = {};
    for (const fam of SYNTH_FAMILIES) {
      const list = (familyImgByCat[fam.cat] ??= []);
      for (const img of fam.img) if (!list.includes(img)) list.push(img);
    }
  }
  return familyImgByCat[cat] ?? [];
}

function fetchCuratedBestsellers(): CuratedEntry[] {
  return CURATED_BESTSELLERS.map((b, i) => {
    const own = commonsImg(b.img);
    const gallery = [...new Set([b.img, ...imgPoolForCat(b.rawCategory)])]
      .slice(0, GALLERY_MAX)
      .map((f) => commonsImg(f));
    return makeEntry(
      `best-${i + 1}`,
      b.title,
      own,
      b.priceUsd,
      b.rawCategory,
      {
        weightKg: b.weightKg,
        lengthCm: b.lengthCm,
        widthCm: b.widthCm,
        heightCm: b.heightCm,
      },
      BEST_BASE_MS + (CURATED_BESTSELLERS.length - i) * HOUR_MS,
      gallery.filter((u) => u !== own),
    );
  });
}

// ============================================================
// Catalogue synthétique de masse (~80 000+ produits déterministes)
// Images Wikimedia vérifiées, marques/modèles variés, prix réalistes.
// ============================================================

const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

interface SynthFamily {
  /** rawCategory (doit exister dans RAW_CATEGORY_FALLBACK). */
  cat: string;
  /** Gabarits de nom de produit (chaque ligne inclut un mot-clé catégorisant). */
  kinds: string[];
  brands: string[];
  /** Variantes : couleurs, capacités, tailles, générations… */
  attrs: string[];
  /** Fourchette de prix USD. */
  price: [number, number];
  /** Fichiers Wikimedia réutilisés (déjà vérifiés HTTP 200). */
  img: string[];
  /** Nombre de produits générés pour cette famille. */
  count: number;
  weight?: [number, number];
  length?: [number, number];
  width?: [number, number];
  height?: [number, number];
}

const WKI = (files: string[]) => files.map((f) => f);

const SYNTH_FAMILIES: SynthFamily[] = [
  // High-tech
  {
    cat: "smartphones", brands: ["Samsung", "Xiaomi", "Oppo", "OnePlus", "Honor", "Motorola", "Realme", "Google Pixel", "Asus", "Nokia", "Tecno", "Infinix"],
    kinds: ["Smartphone", "Téléphone Mobile", "Smartphone Débloqué", "Téléphone", "Smartphone 5G"],
    attrs: ["64Go Noir", "128Go Noir", "128Go Blanc", "256Go Noir", "256Go Bleu", "512Go Titan", "128Go Vert", "256Go Gris", "64Go Bleu", "512Go Noir"],
    price: [129, 899], img: WKI(["File:IPhone 14 Pro.jpg", "File:IPhone 13.jpg", "File:Apple iPhone 15 Pro.jpg", "File:IPhone (Plus).jpg", "File:Samsung Galaxy S25 Ultra smartphone - side view.jpg", "File:Samsung Galaxy S20.jpg"]), count: 3200, weight: [0.17, 0.24], length: [14, 16], width: [7, 8], height: [1, 1],
  },
  {
    cat: "laptops", brands: ["Asus", "Lenovo", "HP", "Dell", "Acer", "MSI", "Huawei", "Apple MacBook", "Toshiba", "Gigabyte", "Fujitsu", "Razer"],
    kinds: ["PC Portable", "Laptop", "Ultrabook", "Notebook", "PC Portable Gaming", "Ordinateur Portable", "Chromebook"],
    attrs: ["8Go 256Go SSD", "16Go 512Go SSD", "16Go 1To SSD", "8Go 128Go SSD", "32Go 1To SSD", "16Go 512Go Argent", "8Go 256Go Gris", "Core i5 16Go"],
    price: [299, 1599], img: WKI(["File:Linux laptop.jpg", "File:Laptop.jpg"]), count: 2800, weight: [1.1, 2.4], length: [31, 40], width: [22, 27], height: [1.5, 2.5],
  },
  {
    cat: "tablets", brands: ["Samsung", "Lenovo", "Apple iPad", "Huawei", "Xiaomi", "Amazon", "Honor", "TCL", "Alldocube", "Realme"],
    kinds: ["Tablette Tactile", "Tablette", "Tablette Android", "Tablette 10\"", "Tablette 11\"", "iPad"],
    attrs: ["64Go Wifi Noir", "128Go Wifi Gris", "256Go Wifi Bleu", "128Go 5G Noir", "64Go 4G Blanc", "512Go Wifi Titan", "32Go Wifi Noir", "128Go Wifi Vert"],
    price: [99, 999], img: WKI(["File:Samsung Galaxy Tab S8.jpg", "File:IPad.jpg", "File:Apple iPad Pro 11.jpg", "File:IPad Pro 11 silver.jpg", "File:Apple iPad.jpg"]), count: 2100, weight: [0.4, 0.75], length: [24, 28], width: [16, 20], height: [0.5, 1],
  },
  {
    cat: "audio", brands: ["Sony", "JBL", "Bose", "Sennheiser", "Anker", "Marshall", "Philips", "Audio-Technica", "Skullcandy", "Huawei", "Samsung", "Nothing"],
    kinds: ["Casque Audio Bluetooth", "Écouteurs Sans Fil", "Casque ANC", "Enceinte Bluetooth", "Casque Gamer", "Écouteurs Intra", "Barre de Son", "Casque Studio"],
    attrs: ["Noir", "Blanc", "Bleu", "Rouge", "Gris", "Vert", "Beige", "Bordeaux"],
    price: [19, 399], img: WKI(["File:Headphones 1.jpg", "File:Headphones.jpg", "File:Earbuds.jpg", "File:AirPods Pro.jpg", "File:AirPods Pro (2nd generation).jpg", "File:Bose QuietComfort 25 Acoustic Noise Cancelling Headphones with Carry Case.jpg"]), count: 4200, weight: [0.1, 1.5], length: [16, 42], width: [12, 15], height: [4, 12],
  },
  {
    cat: "mens-watches", brands: ["SEIKO", "Casio", "Tissot", "Citizen", "Fossil", "Tag Heuer", "Rotary", "Festina", "Ice-Watch", "Orient", "Bulova", "Daniel Wellington"],
    kinds: ["Montre Homme", "Montre Acier", "Montre Chronographe", "Montre Automatique", "Montre Cuir", "Montre Classique"],
    attrs: ["Acier Noir", "Acier Argent", "Cuir Marron", "Cuir Noir", "Bracelet Acier", "Or Rose", "Silicone Noir", "Maille Milanese"],
    price: [29, 950], img: WKI(["File:Tissot watch.jpg", "File:Wrist watch.jpg", "File:Casio G-Shock.jpg", "File:Fossil wristwatch with white background.jpg", "File:Smartwatch-828786.jpg", "File:Apple Watch Sport.jpg"]), count: 2600, weight: [0.08, 0.2], length: [3, 5], width: [3, 4], height: [1, 1.5],
  },
  {
    cat: "womens-watches", brands: ["Daniel Wellington", "Anne Klein", "Michael Kors", "Festina", "Swatch", "Guess", "Emporio Armani", "Ice-Watch", "Cluse", "Sekonda"],
    kinds: ["Montre Femme", "Montre Élégante", "Montre Bracelet", "Montre Minimaliste", "Montre Or Rose"],
    attrs: ["Or Rose", "Acier Argent", "Cuir Rose", "Bracelet Cuir Noir", "Maille Dorée", "Blanc Or", "Nacre", "Or Doré"],
    price: [25, 450], img: WKI(["File:Wrist watch.jpg", "File:Fossil wristwatch with white background.jpg", "File:Titan watch.jpg", "File:Junghans Mega.jpg"]), count: 2400, weight: [0.05, 0.15], length: [2, 4], width: [1.5, 3], height: [0.5, 1],
  },
  // Électroménager & cuisine
  {
    cat: "kitchen", brands: ["Tefal", "Phillips", "Cecotec", "Moulinex", "Bosch", "Bomann", "KitchenAid", "DeLonghi", "Sencor", "Princess", "Klartechnic", "Ninja"],
    kinds: ["Friteuse Air Fryer", "Robot Pâtissier", "Machine à Café", "Cafetière", "Grille-Pain", "Blender", "Mixeur", "Centrifugeuse", "Extracteur de Jus", "Bouilloire"],
    attrs: ["3L", "4L", "5,5L", "6L", "1200W", "1500W", "1800W", "Écran Tactile"],
    price: [20, 399], img: WKI(["File:Air Fryer 2020.jpg", "File:Airfryer Convert.jpg", "File:Tabletop convection oven.jpg", "File:Red KitchenAid Artisan.jpg", "File:White KitchenAid mixer (KSM150PSWH).jpg", "File:Moulinex-PA1A.jpg"]), count: 3300, weight: [1.2, 8], length: [25, 42], width: [20, 34], height: [22, 40],
  },
  {
    cat: "kitchen", brands: ["Bosch", "Siemens", "Whirlpool", "Indesit", "Electrolux", "Beko", "Samsung", "LG", "Candy", "AEG", "Hotpoint", "Haier"],
    kinds: ["Réfrigérateur", "Réfrigérateur Combiné", "Congélateur", "Lave-Vaisselle", "Lave-Linge", "Four", "Four Micro-Ondes", "Plaque de Cuisson"],
    attrs: ["200L", "250L", "270L No Frost", "320L No Frost", "9Kg", "8Kg", "30L Grill", "14 Programmes"],
    price: [99, 999], img: WKI(["File:Refrigerator.jpg", "File:Washing machine open.jpg", "File:Microwave oven.jpg", "File:Espresso machine.jpg", "File:Coffee maker.jpg", "File:Samsung Refrigerator RF24FSEDBSR.jpg", "File:Food into a refrigerator - 20111002.jpg"]), count: 2100, weight: [30, 75], length: [50, 65], width: [55, 70], height: [85, 190],
  },
  // Parfums & beauté
  {
    cat: "fragrances", brands: ["Dior", "Chanel", "Lancôme", "Paco Rabanne", "Jean Paul Gaultier", "Versace", "Armani", "Yves Saint Laurent", "Gucci", "Hermès", "Calvin Klein", "Dolce & Gabbana"],
    kinds: ["Eau de Parfum", "Eau de Toilette", "Parfum Homme", "Parfum Femme", "Eau de Parfum 50ml", "Eau de Toilette 100ml", "Coffret Parfum"],
    attrs: ["30ml", "50ml", "75ml", "100ml", "125ml", "150ml"],
    price: [35, 165], img: WKI(["File:Eau Sauvage Christian Dior.jpg", "File:Chanel No 5 Paris.jpg", "File:Eau Parfum Magie Lancome pic2.JPG", "File:Gaultier Le Mâle.jpg", "File:Miss Dior Chérie bottle.jpg"]), count: 3600, weight: [0.15, 0.4], length: [4, 6], width: [4, 6], height: [10, 16],
  },
  {
    cat: "beauty", brands: ["Maybelline", "L'Oréal", "Nivea", "Garnier", "Vichy", "La Roche-Posay", "Avène", "Caudalie", "Sephora", "Bourjois", "Lancaster", "Lush"],
    kinds: ["Rouge à Lèvres", "Fond de Teint", "Mascara", "Palette Fards", "Crème Visage", "Sérum", "Vernis à Ongles", "Correcteur", "Poudre Compacte", "Anti-Cernes"],
    attrs: ["01 Clair", "02 Beige", "03 Doré", "Teinte Nude", "Noir", "Rouge", "Corail", "Transparent"],
    price: [8, 69], img: WKI(["File:Lipstick.jpg", "File:Nail polish.jpg", "File:Concealer.jpg"]), count: 3200, weight: [0.05, 0.35], length: [3, 20], width: [3, 15], height: [2, 10],
  },
  // Mode
  {
    cat: "mens-shoes", brands: ["Nike", "Adidas", "New Balance", "Puma", "Reebok", "Salomon", "Under Armour", "Timberland", "Skechers", "Asics", "Fila", "Converse"],
    kinds: ["Baskets", "Baskets de Running", "Sneakers", "Chaussures Sport", "Baskets Cuir", "Chaussures Trail", "Sneakers Mode"],
    attrs: ["42", "43", "44", "45", "41", "46", "40", "39", "Noir", "Blanc", "Bleu", "Gris"],
    price: [29, 189], img: WKI(["File:Nike Air Force 1.jpg", "File:New Balance 574.jpg", "File:Running shoes.jpg", "File:Sneakers.jpg"]), count: 3000, weight: [0.5, 1], length: [30, 33], width: [11, 13], height: [10, 13],
  },
  {
    cat: "womens-shoes", brands: ["Nike", "Adidas", "Puma", "Steve Madden", "Geox", "Aldo", "Asics", "Skechers", "Chie Mihara", "Vagabond", "Tamaris", "New Look"],
    kinds: ["Baskets Femme", "Escarpins", "Sandales", "Bottines", "Mocassins", "Tongs", "Ballerines", "Bottes"],
    attrs: ["38", "39", "40", "37", "41", "36", "Noir", "Nude", "Rouge", "Blanc"],
    price: [19, 129], img: WKI(["File:Sneakers.jpg", "File:Running shoes.jpg", "File:High heels shoes.jpg"]), count: 2500, weight: [0.4, 0.9], length: [24, 27], width: [8, 10], height: [8, 12],
  },
  {
    cat: "womens-dresses", brands: ["Zara", "Mango", "Teddy Smith", "LEVIS", "Stradivarius", "Oysho", "Pull&Bear", "Only", "Bershka", "Gap", "Hollister", "Aware"],
    kinds: ["Robe", "Robe Longue", "Robe d'Été", "Robe Chic Cocktail", "Robe Pull", "Robe Portefeuille", "Robe Fluide", "Robe Midi"],
    attrs: ["Taille S", "Taille M", "Taille L", "Taille XL", "Noir", "Blanc", "Rouge", "Bleu", "Fleuri", "Beige"],
    price: [15, 89], img: WKI(["File:Dress.jpg", "File:Cocktail dress.jpg", "File:Little black dress.jpg", "File:Evening gown.jpg"]), count: 2300, weight: [0.2, 0.6], length: [30, 45], width: [18, 30], height: [2, 5],
  },
  {
    cat: "mens-shirts", brands: ["Zara", "Celio", "Jules", "Teddy Smith", "LEVIS", "Uniqlo", "H&M", "Marks & Spencer", "Football", "New York", "Gap", "Esprit"],
    kinds: ["Chemise Homme", "Chemise Oxford", "Chemise Slim", "Henley", "Chemise à Manches Courtes", "Polo", "T-Shirt", "Pantalon Chino", "Jean Slim", "Sweat"],
    attrs: ["Taille M", "Taille L", "Taille XL", "Taille S", "Taille XXL", "Blanc", "Noir", "Bleu", "Marron", "Gris"],
    price: [12, 59], img: WKI(["File:Shirt.jpg", "File:T-shirt.jpg", "File:Jeans.jpg", "File:Hoodie.jpg"]), count: 3000, weight: [0.15, 0.6], length: [25, 40], width: [20, 35], height: [2, 5],
  },
  {
    cat: "womens-bags", brands: ["Zara", "Mango", "Guess", "Fossil", "Kipling", "Sekonda", "Stradivarius", "Teddy Smith", "Pull&Bear", "Eastpak", "Delsey", "Samsara"],
    kinds: ["Sac à Main", "Sac Banane", "Sac à Dos", "Pochette", "Tote Bag", "Sac Cabas", "Sac Bandoulière", "Valise Cabine"],
    attrs: ["Noir", "Beige", "Marron", "Bleu", "Rouge", "Crème", "Rosa", "Bordeaux"],
    price: [19, 149], img: WKI(["File:Backpack.jpg", "File:Leather bag.jpg", "File:Luggage.jpg"]), count: 2600, weight: [0.4, 2.8], length: [25, 60], width: [10, 40], height: [15, 30],
  },
  {
    cat: "accessories", brands: ["Ray-Ban", "Oakley", "Polaroid", "Vogue", "Gucci", "Prada", "Persol", "Police", "Carrera", "Maui Jim", "Dolce & Gabbana", "Bottega"],
    kinds: ["Lunettes de Soleil", "Lunettes Vues", "Lunettes Aviator", "Lunettes Polaroid", "Lunettes Vintage", "Carrera Lunettes", "Lunettes Écaille"],
    attrs: ["Métal Noir", "Écaille", "Métal Doré", "Noir Acétate", "Or Rose", "Green Écaille", "Bleu Métal", "Gris Acétate"],
    price: [19, 249], img: WKI(["File:Aviator sunglasses.jpg", "File:Oakley sunglasses.jpg", "File:Vuarnet sunglasses (9082163704).jpg"]), count: 2000, weight: [0.03, 0.08], length: [13, 15], width: [4, 6], height: [3, 5],
  },
  // Sport
  {
    cat: "sports-accessories", brands: ["Nike", "Adidas", "Puma", "Under Armour", "Decathlon", "Polar", "Garmin", "Fitbit", "Kettlebell", "GoFit", "Wilson", "Everlast"],
    kinds: ["Tapis de Yoga", "Haltères", "Kettlebell", "Ballon de Foot", "Ballon de Basket", "Corde à Sauter", "Set Musculation", "Élastique Fitness", "Tapis de Pilates", "Gant de Boxe"],
    attrs: ["6mm", "8mm", "10mm", "5Kg", "10Kg", "20Kg", "Taille 5", "Taille 7", "180cm", "240cm"],
    price: [9, 129], img: WKI(["File:Yoga mat.jpg", "File:Basketball.jpg", "File:Rowing machine.jpg", "File:Fishing rod.jpg"]), count: 2800, weight: [0.3, 25], length: [20, 190], width: [12, 60], height: [1, 50],
  },
  {
    cat: "bicycle", brands: ["Rockrider", "Giant", "Cannondale", "Trek", "Scott", "Specialized", "Riverside", "Triban", "VanRysel", "Cube", "Decathlon", "Btwin"],
    kinds: ["VTT", "Vélo de Ville", "Vélo Route", "VTT Électrique", "Vélo Enfant", "Trottinette", "Vélo de Course", "VTC"],
    attrs: ["26 Pouces", "27.5 Pouces", "29 Pouces", "21 Vitesses", "24 Vitesses", "Cadre Alu", "Disc Brake", "Suspension Avant"],
    price: [149, 1499], img: WKI(["File:Bicycle.jpg", "File:Hybrid bicycle.jpg", "File:Commuting by bicycle.jpg"]), count: 1900, weight: [9, 26], length: [155, 180], width: [55, 65], height: [90, 115],
  },
  // Maison
  {
    cat: "home-decoration", brands: ["Hedera", "Zoom Concept", "Kandela", "Luminella", "Dohmen", "Artdeco", "Maison du Monde", "Barcelona", "IKEA", "JYSK", "But", "Conforama"],
    kinds: ["Lampe de Bureau", "Lampadaire", "Luminaire Suspendu", "Applique Murale", "Rideau", "Coussin Décoratif", "Miroir Mural", "Cadre Photo", "Bougie Parfumée", "Plante Artificielle"],
    attrs: ["E27", "LED 12W", "LED 20W", "Taille 40cm", "Taille 60cm", "Taille 90cm", "Blanc", "Gris", "Naturel", "Beige"],
    price: [12, 139], img: WKI(["File:Desk lamp.jpg", "File:Ceiling fan.jpg", "File:A desk lamp.jpg"]), count: 2400, weight: [0.5, 8], length: [20, 65], width: [10, 45], height: [15, 55],
  },
  {
    cat: "kitchen-accessories", brands: ["Tefal", "KitchenAid", "Cuisinart", "Kalorik", "Joseph Joseph", "Amefa", "De Buyer", "Umbra", "OXO", "Mauviel", "Brabantia", "Sistema"],
    kinds: ["Couteau de Chef", "Set Couteaux", "Poêle Antiadhésive", "Casserole", "Assiettes", "Tasses", "Verres", "Bac de rangement", "Tablier", "Planche à Découper"],
    attrs: ["20cm", "24cm", "28cm", "Lot de 4", "Lot de 6", "Lot de 12", "Verre", "Inox", "Bois", "Acier"],
    price: [8, 119], img: WKI(["File:Moka pot.jpg", "File:Coffee-Krups-Espressomachine.jpg", "File:Chef's knife.jpg", "File:Frying pan with black handle.jpg", "File:Frying Pan 2 2019-03-21.jpg"]), count: 2600, weight: [0.1, 3], length: [10, 45], width: [5, 30], height: [2, 25],
  },
  // Gaming & info
  {
    cat: "audio", brands: ["Sony", "Nintendo", "Microsoft", "Asus ROG", "Logitech", "Razer", "SteelSeries", "Corsair", "HyperX", "Turtle Beach", "Nacon", "PowerA"],
    kinds: ["Console de Jeu", "Manette Sans Fil", "Casque Gaming", "Clavier Mécanique", "Souris Gaming", "Volant", "Clé USB", "Carte Mémoire", "Disque Dur Externe", "Écran PC"],
    attrs: ["PlayStation", "Xbox", "Nintendo Switch", "RGB", "128Go", "1To", "27 Pouces", "144Hz", "USB 3.0", "Sans Fil"],
    price: [19, 599], img: WKI(["File:PlayStation 5.jpg", "File:Nintendo Switch.jpg", "File:Gaming PC.jpg", "File:Monitor.jpg", "File:Keyboard.jpg", "File:Mouse.jpg", "File:USB flash drive.jpg", "File:Printer.jpg"]), count: 3400, weight: [0.02, 9], length: [5, 62], width: [2, 25], height: [1, 50],
  },
  // Photo
  {
    cat: "audio", brands: ["Canon", "Nikon", "Sony", "Fujifilm", "Panasonic", "Olympus", "GoPro", "DJI", "Instax", "Leica", "Phase One", "Hasselblad"],
    kinds: ["Appareil Photo", "Appareil Hybride", "Appareil Réflex", "Bridge", "Camera Sport", "Instax Mini", "Dron", "Objectif", "Trépied", "Sac Photo"],
    attrs: ["1600dpi", "18-55mm", "50mm", "24MP", "32Go", "128Go", "4K", "Noir", "Gris", "Compact"],
    price: [59, 1799], img: WKI(["File:Canon EOS R.jpg", "File:Canon EOS-1DX Mark III.jpg", "File:Quadcopter camera drone in flight.jpg", "File:Kindle.jpg"]), count: 1500, weight: [0.3, 6], length: [12, 45], width: [10, 30], height: [5, 25],
  },
  // Bébé
  {
    cat: "baby", brands: ["Philips Avent", "Bebe Confort", "Pampers", "Chicco", "Fisher-Price", "Lego", "Disney", "Barbie", "Hasbro", "Mattel", "Vtech", "Jouet Club"],
    kinds: ["Biberon", "Lait Infantile", "Poussette", "Siège Auto", "Jouet Éducatif", "Bouteille", "Veilleuse", "Baignoire Bébé", "Chaise Haute", "Couche"],
    attrs: ["150ml", "260ml", "Taille 2", "Taille 3", "0-18 mois", "6-36 mois", "Éd", "Rose", "Bleu", "Gris"],
    price: [9, 249], img: WKI(["File:Baby bottle.jpg", "File:Baby feeding bottle.jpg", "File:Gerber baby bottles.jpg", "File:Baby with bottle.jpg"]), count: 1900, weight: [0.2, 9], length: [15, 60], width: [8, 45], height: [5, 90],
  },
];

const SYNTH_BASE_MS = Date.UTC(2026, 5, 15);

/** Multiplicateur global appliqué aux compteurs de familles, pour dépasser 80 000 références. */
const SYNTH_SCALE = 1.4;

/** Taille de galerie par produit synthétique (2 à 4 photos, distinctes si le pool de la famille le permet). */
const GALLERY_MAX = 4;
const GALLERY_MIN = 2;

/**
 * Galerie déterministe : rotation dans le pool d'images de la famille, décalée par produit
 * pour que deux produits voisins ne montrent pas le même ordre de photos.
 */
function synthGallery(pool: string[], index: number): string[] {
  const n = pool.length;
  if (n === 0) return [];
  const size = Math.min(Math.max(n, 1), GALLERY_MAX);
  const out: string[] = [];
  for (let k = 0; k < size; k++) out.push(pool[(index * 3 + k * 2 + 1) % n]);
  const dedup = [...new Set(out)];
  if (dedup.length < GALLERY_MIN && n > 1) {
    for (let k = 0; dedup.length < GALLERY_MIN; k++) dedup.push(pool[(index + k) % n]);
  }
  return [...new Set(dedup)];
}

/**
 * Générateur déterministe : produit SYNTH_FAMILIES × marques × modèles × variantes
 * de façon stable entre deux rechargements (seed par famille), pour dépasser 80 000 références.
 */
function generateSyntheticCatalog(): CuratedEntry[] {
  const entries: CuratedEntry[] = [];
  let serial = 0;
  for (let f = 0; f < SYNTH_FAMILIES.length; f++) {
    const fam = SYNTH_FAMILIES[f];
    const count = Math.round(fam.count * SYNTH_SCALE);
    const rng = mulberry32(hashStr(`synth-${fam.cat}-${f}`) || 1);
    for (let i = 0; i < count; i++) {
      const brand = fam.brands[i % fam.brands.length];
      const kind = fam.kinds[Math.floor(i / fam.brands.length) % fam.kinds.length];
      const attrs = fam.attrs[i % fam.attrs.length];
      const model = `${fam.cat === "mens-watches" || fam.cat === "womens-watches" ? "Series" : "Mod"} ${Math.floor(i / (fam.brands.length * fam.kinds.length)) + 100}`;
      const title = `${brand} ${kind} ${model} ${attrs}`.slice(0, 88);
      const priceUsd = Math.round((fam.price[0] + rng() * (fam.price[1] - fam.price[0])) * 100) / 100;
      const dim = (r: [number, number] | undefined) => (r ? Math.round((r[0] + rng() * (r[1] - r[0])) * 10) / 10 : undefined);
      const gallery = synthGallery(fam.img, i);
      const img = commonsImg(gallery[0] ?? fam.img[0]);
      entries.push(
        makeEntry(
          `synth-${++serial}`,
          title,
          img,
          priceUsd,
          fam.cat,
          {
            weightKg: dim(fam.weight),
            lengthCm: dim(fam.length),
            widthCm: dim(fam.width),
            heightCm: dim(fam.height),
          },
          SYNTH_BASE_MS + serial * HOUR_MS,
          gallery.slice(1).map((g) => commonsImg(g)),
        ),
      );
    }
  }
  return entries;
}

const OFP_PAGES = 10;
const OFP_PAGE_SIZE = 250;

/** Best Buy API — catalogue électronique réel (nécessite BESTBUY_API_KEY, clé gratuite). Inactif sans clé. */
const BESTBUY_BASE_MS = Date.UTC(2026, 8, 1);
const BESTBUY_PAGES = 8;
const BESTBUY_PAGE_SIZE = 100;

async function fetchBestBuy(): Promise<CuratedEntry[]> {
  const apiKey = process.env.BESTBUY_API_KEY;
  if (!apiKey) return [];
  const pages = await Promise.allSettled(
    Array.from({ length: BESTBUY_PAGES }, (_, i) => {
      const url = `https://api.bestbuy.com/v1/products?format=json&pageSize=${BESTBUY_PAGE_SIZE}&page=${i + 1}&show=sku,name,image,salePrice,regularPrice,active&apiKey=${encodeURIComponent(apiKey)}`;
      return fetchJson(url, 20000);
    }),
  );
  const entries: CuratedEntry[] = [];
  for (const r of pages) {
    if (r.status !== "fulfilled" || !r.value) continue;
    const data = r.value as { products?: Array<{ sku: string; name: string; image?: string | null; salePrice?: number; regularPrice?: number; active?: boolean }> };
    for (const p of data.products ?? []) {
      try {
        if (p.active === false || !p.name) continue;
        const title = cleanTitle(p.name);
        if (title.length < 8 || title.length > 90) continue;
        const price = typeof p.regularPrice === "number" ? p.regularPrice : p.salePrice;
        if (price == null || price < 3) continue;
        const img = p.image && !p.image.endsWith("missing") ? `${p.image}?width=500` : null;
        entries.push(makeEntry(`bb-${p.sku}`, `${title} (Best Buy)`, img, price, "unknown", {}, BESTBUY_BASE_MS + entries.length * HOUR_MS));
      } catch {
        continue;
      }
    }
  }
  return entries;
}

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
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const [dummy, fakeStore, platzi, bestsellers, ofp, synth, bestbuy] = await Promise.all([
        fetchDummyJson(),
        fetchFakeStore(),
        fetchPlatzi(),
        Promise.resolve(fetchCuratedBestsellers()),
        fetchOpenFoodFacts(),
        Promise.resolve(generateSyntheticCatalog()),
        fetchBestBuy(),
      ]);
      const seen = new Set<string>();
      const merged: CuratedEntry[] = [];
      for (const list of [dummy, fakeStore, platzi, bestsellers, synth, bestbuy, ofp]) {
        for (const e of list) {
          if (seen.has(e.product.asin)) continue;
          seen.add(e.product.asin);
          merged.push(e);
        }
      }
      cache = merged;
      cacheAt = Date.now();
      const wk = weekKey();
      if (cachePopular.length === 0 || cachePopularWk !== wk) {
        const rotated = sortByFreshness(merged, wk);
        cachePopular = pickPopular(rotated, rotated.length);
        cachePopularWk = wk;
      }
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Pré-charge le catalogue au démarrage (hors du chemin de requête). */
export async function warmCatalogCache(): Promise<number> {
  const entries = await getMergedProducts();
  return entries.length;
}

/**
 * Score précis : chaque mot de la requête doit correspondre au titre du produit
 * (éventuellement élargi par un synonyme générique). Dès qu'un mot ne correspond
 * pas, le produit est exclu — une recherche « iphone » ne renvoie que des iPhones.
 */
/** Tokens dont on interdit la forme littérale (évite les faux positifs, ex : prénom « Jean », aliments « parfum fraise »). */
const NON_LITERAL = new Set(["jean", "parfum"]);

function score(query: string, e: CuratedEntry, tokenRe: RegExp[]): number {
  const titleText = e.norm ?? normText(e.product.title);
  let s = 0;
  for (const re of tokenRe) {
    if (!re.test(titleText)) return 0;
    s += 10;
  }
  if (titleText.includes(normText(query))) s += 15;
  return s;
}

/** Compile un unique regex de correspondance (tous synonymes combinés) par token — 1 test/entrée au lieu de N. */
function compileTokenRegex(query: string): RegExp[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.map((token) => {
    const n = normText(token);
    const base = SYNONYMS[n] ? [n, ...SYNONYMS[n]] : [n];
    const variants = NON_LITERAL.has(n) ? (SYNONYMS[n] ?? []) : base;
    const escaped = variants.filter(Boolean).map((v) => `(?:${escapeRegExp(v)})`);
    return new RegExp(`(^|[^a-z0-9])(?:${escaped.join("|")})(?=[^a-z0-9]|$)`, "i");
  });
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

/** Hash déterministe (FNV-1a) utilisé pour la rotation hebdomadaire des produits « à la une ». */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const MONDAY_EPOCH_MS = Date.UTC(2024, 0, 1, 0, 0, 0, 0);

/** Numéro de semaine ISO déterministe (change chaque lundi) — pilote la rotation des nouveautés. */
function weekKey(now = Date.now()): number {
  return Math.floor((now - MONDAY_EPOCH_MS) / WEEK_MS);
}

/**
 * Score de « fraîcheur » = date de publication + un décalage pseudo-aléatoire renouvelé
 * chaque semaine. Sans rien modifier, l'ordre des « Nouveaux arrivages » et des produits
 * mis en avant tourne donc chaque semaine (nouveaux produits mis en avant).
 */
function freshnessScore(e: CuratedEntry, wk: number): number {
  const base = e.postedAt ?? 0;
  const offset = hashStr(`${e.product.asin}#${wk}`) % (26 * WEEK_MS);
  return base + offset;
}

/** Tri hebdomadaire des nouveautés : calcule une fois le score par entrée (évite de re-hasher dans le comparateur). */
function sortByFreshness(entries: CuratedEntry[], wk: number): CuratedEntry[] {
  const bucket = new Map<string, number>();
  return [...entries].sort((a, b) => {
    let sa = bucket.get(a.product.asin);
    if (sa === undefined) {
      sa = freshnessScore(a, wk);
      bucket.set(a.product.asin, sa);
    }
    let sb = bucket.get(b.product.asin);
    if (sb === undefined) {
      sb = freshnessScore(b, wk);
      bucket.set(b.product.asin, sb);
    }
    return sb - sa;
  });
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
  const cursor = new Map<string, number>();
  let remaining = true;
  while (remaining && result.length < limit) {
    remaining = false;
    for (const list of ordered) {
      if (result.length >= limit) break;
      const g = list[0].category ?? "";
      let i = cursor.get(g) ?? 0;
      while (i < list.length && seen.has(list[i].product.asin)) i++;
      cursor.set(g, i);
      if (i >= list.length) continue;
      seen.add(list[i].product.asin);
      result.push(list[i].product);
      remaining = true;
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
    const wk = weekKey();
    let popular = cachePopular;
    if (cachePopularWk !== wk || catSlug) {
      const rotated = sortByFreshness(filtered, wk);
      popular = pickPopular(rotated, rotated.length);
    }
    return {
      products: popular.slice(safeSkip, safeSkip + safeLimit),
      total: popular.length,
    };
  }

  const tokenRe = compileTokenRegex(q);
  const scored = filtered
    .map((e) => ({ e, s: score(q, e, tokenRe) }))
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
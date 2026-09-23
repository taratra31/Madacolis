export interface AmazonProduct {
  asin: string;
  title: string;
  imageUrl: string | null;
  priceEUR: number | null;
  url: string;
  features: string[];
  category: string;
  categoryPath: string | null;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface CategoryChild {
  slug: string;
  name: string;
  count: number;
}

export interface CategoryNode {
  slug: string;
  name: string;
  productCount: number;
  children: CategoryChild[];
}

export interface SearchResponse {
  products: AmazonProduct[];
  total: number;
  source?: "paapi" | "curated";
}

export interface TransitaireQuote {
  transitaireId: string;
  transitaireName: string;
  shippingMethod: "AIR" | "SEA";
  price: number;
  priceAr: number;
  currency: "EUR";
  estimatedDeliveryDays: number;
  estimatedDeliveryDate: string;
  distanceKm: number;
  billingWeight: number;
  billingM3: number;
  usingVolumetric: boolean;
  pricePerKg: number;
  pricePerM3: number;
  ratePerKgAr: number;
  ratePerM3Ar: number;
  isFragile: boolean;
  breakdown: {
    baseHandlingAr: number;
    transportAr: number;
    fragileSurchargeAr: number;
    commissionAr: number;
    totalAr: number;
    totalEur: number;
    minimumPrice: number;
    minimumApplied: boolean;
  };
}

export interface QuoteResult {
  product: {
    marketplace: string;
    url: string | null;
    title: string;
    imageUrl: string | null;
    priceEUR: number | null;
  };
  quantity: number;
  weightKg: number;
  payloadTotal: number;
  volumetricWeightKg: number;
  billingWeightKg: number;
  quote: TransitaireQuote;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  country: string | null;
  city: string | null;
  address: string | null;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface TrackingEvent {
  status: string;
  location: string | null;
  comment: string | null;
  createdAt: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: string;
  serviceType: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  createdAt: string;
  estimatedPrice: number | null;
  currency: string | null;
  qrDataUrl?: string;
  statusHistory: TrackingEvent[];
}

export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  marketplace: string;
  sourceUrl: string | null;
}

// ---- Espace transitaire ----
export interface TransitaireShipmentStatusEvent {
  status: string;
  comment: string | null;
  location: string | null;
  createdAt: string;
}

export interface TransitaireShipment {
  id: string;
  trackingNumber: string;
  status: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  serviceType: string;
  totalWeight: number;
  declaredValue: number;
  estimatedPrice: number;
  currency: string;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  createdAt: string;
  carrierId: string | null;
  user?: { name: string; email: string | null; phone: string };
  statusHistory?: TransitaireShipmentStatusEvent[];
}

export interface TransitaireRatesCarrier {
  id: string;
  name: string;
  shortName: string;
  description: string;
  baseHandlingAr: number;
  airPerKgAr: number;
  airPerKgEur: number;
  seaPerM3Ar: number;
  seaPerM3Eur: number;
  airDays: number;
  seaDays: number;
}

export interface TransitaireRates {
  carrier: TransitaireRatesCarrier;
  commissionRate: number;
  commissionRateLabel: string;
  eurToMga: number;
}
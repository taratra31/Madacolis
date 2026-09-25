export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
}

export interface HomeTariff {
  id: string;
  name: string;
  originCountry: string;
  destinationCountry: string;
  serviceType: "STANDARD" | "EXPRESS" | "ECONOMY";
  basePrice: number;
  pricePerKg: number;
  minimumPrice: number;
  currency: string;
}

export interface HomeStats {
  users: number;
  shipments: number;
  payments: number;
  pending: number;
  inTransit: number;
  delivered: number;
  revenuePaid: number | null;
}

export interface HomeData {
  services: HomeTariff[];
  stats: HomeStats;
  topRoutes: Array<{ originCity: string; destinationCity: string; count: number }>;
  cities: Array<{ city: string; country: string }>;
}

export type ServiceType = "STANDARD" | "EXPRESS" | "ECONOMY";

export interface QuoteResult {
  estimatedPrice: number;
  currency: string;
  breakdown: {
    basePrice: number;
    weightCost: number;
    distanceCost: number;
    total: number;
  };
  serviceType: ServiceType;
  deliveryDays: [number, number];
}

export interface TrackingEvent {
  id: string;
  status: string;
  comment?: string;
  location?: string;
  createdAt: string;
}

export interface TrackingResult {
  trackingNumber: string;
  status: string;
  originCity: string;
  destinationCity: string;
  serviceType: ServiceType;
  estimatedPrice: number;
  currency: string;
  estimatedDeliveryDate?: string;
  items: Array<{ description: string; quantity: number }>;
  history: TrackingEvent[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  priceEUR: number;
  image: string;
  weightKg: number;
  description?: string;
}

export interface Payment {
  id: string;
  paymentReference: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  provider: string;
  method: string;
  amount: number;
  currency: string;
  createdAt: string;
  shipment?: { trackingNumber: string };
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  serviceType: ServiceType;
  originCity: string;
  destinationCity: string;
  estimatedPrice: number;
  currency: string;
  createdAt: string;
}
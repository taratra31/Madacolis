export type Role = "CUSTOMER" | "ADMIN" | "AGENT" | "TRANSITAIRE";
export type ServiceType = "STANDARD" | "EXPRESS" | "ECONOMY";
export type ShippingMethod = "AIR" | "SEA";
export type ShipmentStatus =
  | "PENDING"
  | "RECEIVED"
  | "IN_TRANSIT"
  | "IN_CUSTOMS"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";
export type Currency = "EUR" | "MGA" | "USD";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentProvider = "MVOLA" | "ORANGE_MONEY" | "AIRTEL_MONEY" | "CARD" | "CASH";
export type PaymentMethod = "MOBILE_MONEY" | "CARD" | "CASH";
export type DocumentType = "IDENTITY" | "INVOICE" | "PROOF_OF_ADDRESS" | "CUSTOMS_FORM";
export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: Role;
  country: string | null;
  city: string | null;
  address: string | null;
  /** Transporteur représenté (rôle TRANSITAIRE) — ex: "dhl". */
  carrierId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorShape {
  success: false;
  message: string;
  code: string;
  errors?: unknown;
  path?: string;
}

export interface QuoteBreakdown {
  basePrice: number;
  weightCharge: number;
  distanceCharge: number;
  fragileSurcharge: number;
  /** Suppl. fragile en Ariary (devis transporteur). */
  fragileSurchargeAr?: number;
  total: number;
  minimumPrice: number;
  minimumApplied: boolean;
}

export interface Quote {
  price: number;
  /** Prix total en Ariary (transporteur). */
  priceAr?: number;
  currency: Currency;
  serviceType: ServiceType;
  shippingMethod: ShippingMethod;
  transitaireId?: string;
  transitaireName?: string;
  estimatedDeliveryDays: number;
  estimatedDeliveryDate: string;
  distanceKm: number;
  billingWeight: number;
  /** Volume facturable (m³) — bateau. */
  billingM3?: number;
  usingVolumetric: boolean;
  pricePerKg: number;
  /** Prix public bateau par m³ (EUR). */
  pricePerM3?: number;
  ratePerKgAr?: number;
  ratePerM3Ar?: number;
  isFragile: boolean;
  breakdown: QuoteBreakdown;
}

export interface Transitaire {
  id: string;
  name: string;
  shortName: string;
  description: string;
  baseHandlingAr?: number;
  airPerKgAr: number;
  airPerKgEur: number;
  seaPerM3Ar: number;
  seaPerM3Eur: number;
  airDays: number;
  seaDays: number;
}

export interface AnalyzedProduct {
  marketplace: "AMAZON" | "ALIBABA" | "ALIEXPRESS" | "UNKNOWN";
  url: string;
  productId: string;
  title: string;
  imageUrl: string | null;
  priceEUR: number | null;
}

export interface ProductQuote {
  product: AnalyzedProduct;
  quantity: number;
  weightKg: number;
  payloadTotal: number;
  volumetricWeightKg: number;
  billingWeightKg: number;
  quote: Quote;
}

export interface CatalogProductType {
  id: string;
  name: string;
  brand: string;
  category: string;
  priceEUR: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  image: string;
  badge?: "PROMO" | "BESTSELLER" | "NOUVEAU";
  description: string;
}

export interface AmazonProduct {
  asin: string;
  title: string;
  imageUrl: string | null;
  priceEUR: number | null;
  url: string;
  features: string[];
  category?: string;
  categoryPath?: string;
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

export interface PricingService {
  originCountry: string;
  destinationCountry: string;
  serviceType: ServiceType;
  basePrice: number;
  pricePerKg: number;
  minimumPrice: number;
  currency: Currency;
}

export interface ShipmentItem {
  id: string;
  description: string;
  quantity: number;
  weight: number;
  length: number | null;
  width: number | null;
  height: number | null;
  declaredValue: number;
  isFragile: boolean;
  createdAt: string;
}

export interface ShipmentStatusEvent {
  id: string;
  status: ShipmentStatus;
  comment: string | null;
  location: string | null;
  changedBy: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  shipmentId: string;
  paymentReference: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
  shipment?: { trackingNumber: string; originCity?: string; destinationCity?: string };
}

export interface ShipmentDocument {
  id: string;
  type: DocumentType;
  originalName: string;
  mimeType: string;
  status: DocumentStatus;
  createdAt: string;
  trackingNumber?: string;
}

export interface Shipment {
  id: string;
  userId: string;
  trackingNumber: string;
  qrDataUrl?: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  serviceType: ServiceType;
  status: ShipmentStatus;
  totalWeight: number;
  totalVolume: number | null;
  declaredValue: number;
  currency: Currency;
  estimatedPrice: number;
  finalPrice: number | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  senderName: string | null;
  senderPhone: string | null;
  senderAddress: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  recipientAddress: string | null;
  requiredDocuments: DocumentType[];
  notes: string | null;
  createdAt: string;
  items: ShipmentItem[];
  timeline: ShipmentStatusEvent[];
  payments: Payment[];
  documents: ShipmentDocument[];
}

export interface PublicTrackingEvent {
  status: ShipmentStatus;
  comment: string | null;
  location: string | null;
  createdAt: string;
}

export interface PublicTracking {
  trackingNumber: string;
  qrDataUrl?: string;
  status: ShipmentStatus;
  serviceType: ServiceType;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  createdAt: string;
  estimatedPrice: number;
  currency: Currency;
  statusHistory: PublicTrackingEvent[];
}

export interface ShipmentsResponse {
  shipments: Shipment[];
  total: number;
  page: number;
  limit: number;
}

export interface ShipmentDraftItemInput {
  description: string;
  quantity: number;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  declaredValue: number;
  isFragile: boolean;
}

export interface CreateShipmentRequest {
  origin: { country: string; city: string };
  destination: { country: string; city: string };
  serviceType: ServiceType;
  sender: { name: string; phone: string; address?: string };
  recipient: { name: string; phone: string; address?: string };
  items: ShipmentDraftItemInput[];
  notes?: string;
  requiredDocuments: DocumentType[];
  currency: Currency;
}

// ---------------------------------------------------------------------------
// Espace transitaire
// ---------------------------------------------------------------------------

export interface TransitaireStats {
  total: number;
  delivered: number;
  byStatus: Array<{ status: ShipmentStatus; _count: { _all: number }; _sum: { estimatedPrice: number | null } }>;
  eurToMga: number;
  commissionRate: number;
  commissionRateLabel: string;
  kpis: {
    pending: number;
    inTransit: number;
    delivered: number;
    cancelled: number;
    clients: number;
    newThisMonth: number;
    totalValueAr: number;
    totalValueEur: number;
    commissionAr: number;
    netAr: number;
    paidAr: number;
    avgWeightKg: number;
    avgDeliveryDays: number | null;
  };
  volumeByMonth: Array<{ key: string; label: string; total: number; delivered: number; revenueAr: number }>;
  byService: Array<{ serviceType: ServiceType; count: number; revenueAr: number }>;
  byCity: Array<{ city: string; count: number; revenueAr: number }>;
  topClients: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    count: number;
    delivered: number;
    revenueAr: number;
    lastTrip: string;
  }>;
  activities: Array<{
    id: string;
    status: ShipmentStatus;
    comment: string | null;
    location: string | null;
    createdAt: string;
    shipment: { trackingNumber: string };
  }>;
  pendingShipments: Array<{
    id: string;
    trackingNumber: string;
    status: ShipmentStatus;
    originCity: string;
    destinationCity: string;
    createdAt: string;
  }>;
  recent: Array<{
    id: string;
    trackingNumber: string;
    status: ShipmentStatus;
    currency: Currency;
    estimatedPrice: number;
    originCity: string;
    destinationCity: string;
    createdAt: string;
    user: { name: string | null };
  }>;
}

export interface TransitaireClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  memberSince: string | null;
  shipments: number;
  delivered: number;
  revenueAr: number;
  lastTrip: string;
}

export interface TransitaireClientsResponse {
  clients: TransitaireClient[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface TransitairePayment {
  id: string;
  paymentReference: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  trackingNumber: string;
}

export interface TransitairePaymentsResponse {
  summary: {
    paidCount: number;
    pendingCount: number;
    failedCount: number;
    refundedCount: number;
    totalCount: number;
    totalAr: number;
    paidAr: number;
    pendingAr: number;
  };
  payments: TransitairePayment[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface TransitaireTeamMember {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  shipments: number;
}

export interface TransitaireTeamResponse {
  team: TransitaireTeamMember[];
}

export interface TransitaireDoc {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  originalName: string;
  mimeType: string;
  createdAt: string;
  trackingNumber: string;
}

export interface TransitaireDocumentsResponse {
  documents: TransitaireDoc[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface TransitaireAuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string; role: Role } | null;
}

export interface TransitaireActivityResponse {
  logs: TransitaireAuditLog[];
}

export interface TransitaireNotification {
  id: string;
  kind: "STATUS" | "PAYMENT";
  message: string;
  detail: string | null;
  createdAt: string;
}

export interface TransitaireNotificationsResponse {
  notifications: TransitaireNotification[];
}

export interface CreateTransitaireShipmentPayload {
  clientPhone: string;
  originCountry?: string;
  originCity?: string;
  destinationCountry?: string;
  destinationCity?: string;
  serviceType?: ServiceType;
  totalWeight: number;
  totalVolume?: number;
  declaredValue?: number;
  currency?: Currency;
  estimatedPrice?: number;
  estimatedDeliveryDate?: string;
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  requiredDocuments?: DocumentType[];
  notes?: string;
}
export const SERVICE_TYPES: ServiceType[] = ["STANDARD", "EXPRESS", "ECONOMY"];

export interface TransitaireRates {
  carrier: Transitaire;
  commissionRate: number;
  commissionRateLabel: string;
  eurToMga: number;
}

export interface TransitaireShipmentsResponse {
  shipments: Array<
    Pick<
      Shipment,
      | "id"
      | "trackingNumber"
      | "status"
      | "originCountry"
      | "originCity"
      | "destinationCountry"
      | "destinationCity"
      | "serviceType"
      | "totalWeight"
      | "declaredValue"
      | "estimatedPrice"
      | "currency"
      | "estimatedDeliveryDate"
      | "actualDeliveryDate"
      | "createdAt"
      | "items"
    > & {
      carrierId: string | null;
      user?: { name: string; email: string | null; phone: string };
      statusHistory?: ShipmentStatusEvent[];
    }
  >;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}
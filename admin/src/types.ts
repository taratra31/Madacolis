export type Role = "CUSTOMER" | "ADMIN" | "AGENT" | "TRANSITAIRE";

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
  carrierId?: string | null;
  _count?: { shipments: number; addresses: number };
}

export interface Transitaire {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  carrierId: string;
  isActive: boolean;
  createdAt?: string;
  shipments: number;
  pending: number;
  delivered: number;
  revenueAr: number;
}

export type DocumentType = "IDENTITY" | "INVOICE" | "PROOF_OF_ADDRESS" | "CUSTOMS_FORM";
export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface AdminDocument {
  id: string;
  originalName: string;
  type: DocumentType;
  status: DocumentStatus;
  mimeType: string;
  createdAt: string;
  shipment: { trackingNumber: string } | null;
  user: { name: string };
}

export type ShipmentStatus =
  | "PENDING"
  | "RECEIVED"
  | "IN_TRANSIT"
  | "IN_CUSTOMS"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface Shipment {
  id: string;
  trackingNumber: string;
  status: ShipmentStatus;
  serviceType: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  estimatedDeliveryDate: string | null;
  estimatedPrice: number | null;
  currency: string | null;
  createdAt: string;
  user: { name: string; email: string | null; phone: string | null };
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  method: string;
  transactionId: string | null;
  createdAt: string;
  shipment: { trackingNumber: string; destinationCity: string; destinationCountry: string } | null;
  user: { name: string; email: string | null };
}

export type ServiceType = "STANDARD" | "EXPRESS" | "ECONOMY";
export type Currency = "MGA" | "EUR" | "USD";

export interface PricingRule {
  id: string;
  name: string;
  originCountry: string;
  destinationCountry: string;
  serviceType: ServiceType;
  basePrice: number;
  pricePerKg: number;
  pricePerKm: number | null;
  minimumPrice: number;
  currency: Currency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ip: string | null;
  metadata: unknown;
  createdAt: string;
  user: { name: string } | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type CarrierCommission = {
  carrierId: string;
  name: string;
  shipments: number;
  delivered: number;
  revenue: number;
  commission: number;
};

export interface CommissionsData {
  success: boolean;
  totalRevenue: number;
  totalCommission: number;
  deliveredShipments: number;
  rate: number;
  perCarrier: CarrierCommission[];
  monthly: Array<{ month: string; revenueAr: number; commissionAr: number }>;
}

export interface TreasuryData {
  success: boolean;
  encaisséTotalAr: number;
  encaisséMMvolaAr: number;
  attenduAr: number;
  colisEnCours: number;
  parFournisseur: Array<{ name: string; amount: number }>;
  mensuel: Array<{ month: string; encaisséAr: number; attenduAr: number }>;
}

export type AdminNotificationType = "SHIPMENT" | "PAYMENT" | "USER" | "SYSTEM";

export interface AdminNotificationItem {
  id: string;
  type: AdminNotificationType;
  title: string;
  detail: string;
  time: string;
  icon: string;
}

export interface AdminNotificationsData {
  success: boolean;
  unread: number;
  notifications: AdminNotificationItem[];
}

export interface CreateShipmentPayload {
  userId: string;
  carrierId?: string | null;
  serviceType: "STANDARD" | "EXPRESS" | "ECONOMY";
  origin: { country: string; city: string };
  destination: { country: string; city: string };
  sender?: { name?: string; phone?: string; address?: string };
  recipient?: { name?: string; phone?: string; address?: string };
  requiredDocuments: string[];
  notes?: string;
  items: Array<{ name: string; quantity: number; weight: number; declaredValue: number; length?: number; width?: number; height?: number }>;
}

export interface DashboardData {
  stats: {
    users: number;
    addresses: number;
    shipments: number;
    payments: number;
    pricingRules: number;
    documents: number;
    revenueEstimated: number | null;
    revenuePaid: number | null;
  };
  flows: { pending: number; inTransit: number; delivered: number };
  shipmentsByStatus: Array<{ status: string; _count: { _all: number } }>;
  paymentsByStatus: Array<{ status: string; _count: { _all: number } }>;
  shipmentsByService: Array<{ serviceType: string; _count: { _all: number } }>;
  revenueByProvider: Array<{ provider: string; amount: number | null }>;
  trend30d: Array<{ day: string; count: number }>;
  topRoutes: Array<{
    originCountry: string;
    originCity: string;
    destinationCountry: string;
    destinationCity: string;
    count: number;
  }>;
  recentShipments: Shipment[];
  recentAudits: AuditLog[];
}
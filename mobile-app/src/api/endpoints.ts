import { api } from "./client";
import type {
  AmazonProduct,
  AuthResponse,
  CategoryNode,
  QuoteResult,
  SearchResponse,
  TrackingInfo,
  TransitaireRates,
  TransitaireShipment,
  User,
} from "../types";

// ---- Catalogue & recherche ----
export const fetchProducts = (params: { q?: string; limit?: number; skip?: number; category?: string }, signal?: AbortSignal) =>
  api<SearchResponse>("/pricing/marketplace/products", {
    query: { q: params.q ?? "", limit: params.limit ?? 24, skip: params.skip ?? 0, category: params.category },
    signal,
  });

export const searchMarketplace = (q: string, limit = 20) =>
  api<SearchResponse>("/pricing/marketplace/amazon/search", { query: { q, limit } });

export const fetchCategories = () => api<{ categories: CategoryNode[] }>("/pricing/marketplace/categories");

export const fetchProduct = (id: string) =>
  api<{ product: AmazonProduct }>(`/pricing/marketplace/amazon/product/${encodeURIComponent(id)}`);

export const fetchServices = () =>
  api<{ services: Array<{ type: string; name: string; delayDays: number }> }>("/pricing/services");

// ---- Devis ----
export interface ProductQuotePayload {
  title?: string;
  link?: string;
  quantity: number;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  declaredValueEUR?: number;
  shippingMethod?: "AIR" | "SEA";
  fragile?: boolean;
  destinationCountry: string;
  destinationCity: string;
  serviceType: "STANDARD" | "EXPRESS" | "ECONOMY";
}

export const requestQuote = (payload: ProductQuotePayload) =>
  api<{ success: boolean; quote: QuoteResult }>("/pricing/product-quote", { method: "POST", body: payload });

// ---- Suivi colis ----
export const trackShipment = (trackingNumber: string) =>
  api<{ success: boolean; tracking: TrackingInfo }>(`/tracking/${encodeURIComponent(trackingNumber)}`);

// ---- Compte ----
export const login = (identifier: string, password: string) =>
  api<AuthResponse>("/auth/login", { method: "POST", body: { identifier, password } });

export const register = (payload: { name: string; email?: string; phone: string; password: string; country?: string; city?: string }) =>
  api<AuthResponse>("/auth/register", { method: "POST", body: payload });

export const fetchMe = () => api<{ success: boolean; user: User }>("/auth/me");

export const updateProfile = (payload: { name: string; email?: string; phone: string; country?: string; city?: string; address?: string }) =>
  api<{ success: boolean; message: string; user: User }>("/auth/profile", { method: "PUT", body: payload });

export const changePassword = (payload: { currentPassword: string; newPassword: string }) =>
  api<{ success: boolean; message: string }>("/auth/password", { method: "PUT", body: payload });

// ---- Espace transitaire ----
export const transitaireShipments = (params: { status?: string; q?: string; page?: number; pageSize?: number }, signal?: AbortSignal) =>
  api<{ success: boolean; shipments: TransitaireShipment[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(
    "/transitaire/shipments",
    { query: { status: params.status ?? "", q: params.q ?? "", page: params.page ?? 1, pageSize: params.pageSize ?? 20 }, signal },
  );

export const transitaireUpdateStatus = (id: string, payload: { status: string; comment?: string; location?: string }) =>
  api<{ success: boolean; message: string; shipment: TransitaireShipment }>(`/transitaire/shipments/${id}/status`, {
    method: "PUT",
    body: payload,
  });

export const transitaireRates = (signal?: AbortSignal) =>
  api<{ success: boolean; rates: TransitaireRates }>("/transitaire/rates", { signal });
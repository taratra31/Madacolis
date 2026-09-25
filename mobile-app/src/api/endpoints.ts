import { http } from "./client";
import type {
  HomeData,
  Payment,
  QuoteResult,
  ServiceType,
  Shipment,
  TrackingResult,
  User,
} from "../types";

export const getHomeData = () => http.get<{ success: boolean } & HomeData>("/pricing/home");

interface ApiProduct {
  asin: string;
  title: string;
  imageUrl?: string;
  priceEUR?: number | null;
  category?: string;
  brand?: string;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export const getProducts = (limit = 10, skip = 0) =>
  http.get<{ success: boolean; products: ApiProduct[] }>(`/pricing/marketplace/products?limit=${limit}&skip=${skip}`).then((res) => ({
    ...res,
    products: res.products.map((p) => ({
      id: p.asin,
      name: p.title,
      brand: p.brand ?? "",
      category: p.category ?? "Divers",
      priceEUR: p.priceEUR ?? null,
      image: p.imageUrl ?? "",
      weightKg: p.weightKg ?? 0.5,
      lengthCm: p.lengthCm,
      widthCm: p.widthCm,
      heightCm: p.heightCm,
    })),
  }));

export const quoteShipment = (payload: {
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  serviceType: ServiceType;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  declaredValue?: number;
}) => http.post<{ success: boolean } & QuoteResult>("/pricing/quote", payload);

export const trackShipment = (trackingNumber: string) =>
  http.get<{ success: boolean; shipment: TrackingResult }>(`/tracking/${encodeURIComponent(trackingNumber)}`);

export const login = (identifier: string, password: string) =>
  http.post<{ success: boolean; token: string; user: User }>("/auth/login", { identifier, password });

export const register = (payload: { name: string; email: string; phone: string; password: string }) =>
  http.post<{ success: boolean; token: string; user: User }>("/auth/register", payload);

export const getMe = () => http.get<{ success: boolean; user: User }>("/auth/me");

export const getMyPayments = () => http.get<{ success: boolean; payments: Payment[] }>("/payments");

export const demoPay = (paymentId: string) =>
  http.post<{ success: boolean; payment: Payment }>(`/payments/${paymentId}/demo-confirm`);

export const getMyShipments = () => http.get<{ success: boolean; shipments: Shipment[] }>("/shipments");
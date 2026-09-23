import axios from "axios";
import type {
  AdminDocument,
  AdminNotificationsData,
  AuditLog,
  CommissionsData,
  CreateShipmentPayload,
  DashboardData,
  Pagination,
  Payment,
  PricingRule,
  Shipment,
  ShipmentStatus,
  Transitaire,
  TreasuryData,
  User,
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("admin_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("admin_token");
      if (!location.pathname.startsWith("/login")) location.replace("/login");
    }
    return Promise.reject(err);
  },
);

// ─── Auth ───
export const login = async (identifier: string, password: string) => {
  const { data } = await api.post("/auth/login", { identifier, password });
  return data as { success: boolean; token: string; user: User };
};

// ─── Dashboard ───
export const getDashboard = async () => {
  const { data } = await api.get("/admin/dashboard");
  return data as { success: boolean } & DashboardData;
};

// ─── Users ───
export const getUsers = async (params: { page?: number; pageSize?: number; q?: string; role?: string } = {}) => {
  const { data } = await api.get("/admin/users", { params });
  return data as { success: boolean; users: User[]; pagination: Pagination };
};

export const updateUserStatus = async (id: string, payload: { isActive?: boolean; role?: string }) => {
  const { data } = await api.put(`/admin/users/${id}`, payload);
  return data as { success: boolean; user: User };
};

export const deleteUser = async (id: string) => {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data as { success: boolean; message: string };
};

// ─── Shipments ───
export const getShipments = async (params: { page?: number; pageSize?: number; q?: string; status?: string; serviceType?: string } = {}) => {
  const { data } = await api.get("/admin/shipments", { params });
  return data as { success: boolean; shipments: Shipment[]; pagination: Pagination };
};

export const updateShipmentStatus = async (id: string, status: ShipmentStatus, comment?: string) => {
  const { data } = await api.put(`/admin/shipments/${id}/status`, { status, comment });
  return data as { success: boolean; shipment: Shipment };
};

export const createShipment = async (payload: CreateShipmentPayload) => {
  const { data } = await api.post("/admin/shipments", payload);
  return data as { success: boolean; message: string; shipment: Shipment };
};

// ─── Payments ───
export const getPayments = async (params: { page?: number; pageSize?: number; status?: string; provider?: string } = {}) => {
  const { data } = await api.get("/admin/payments", { params });
  return data as { success: boolean; payments: Payment[]; pagination: Pagination };
};

// ─── Pricing Rules ───
export const getPricingRules = async () => {
  const { data } = await api.get("/admin/pricing-rules");
  return data as { success: boolean; rules: PricingRule[] };
};

export const createPricingRule = async (payload: Partial<PricingRule>) => {
  const { data } = await api.post("/admin/pricing-rules", payload);
  return data as { success: boolean; rule: PricingRule };
};

export const updatePricingRule = async (id: string, payload: Partial<PricingRule>) => {
  const { data } = await api.put(`/admin/pricing-rules/${id}`, payload);
  return data as { success: boolean; rule: PricingRule };
};

export const deletePricingRule = async (id: string) => {
  const { data } = await api.delete(`/admin/pricing-rules/${id}`);
  return data as { success: boolean };
};

// ─── Transitaires ───
export const getTransitaires = async (params: { page?: number; pageSize?: number } = {}) => {
  const { data } = await api.get("/admin/transitaires", { params });
  return data as { success: boolean; transitaires: Transitaire[]; pagination: Pagination };
};

// ─── Documents ───
export const getDocuments = async (params: { page?: number; pageSize?: number; status?: string } = {}) => {
  const { data } = await api.get("/admin/documents", { params });
  return data as { success: boolean; documents: AdminDocument[]; pagination: Pagination };
};

// ─── Commissions & Trésorerie ───
export const getCommissions = async () => {
  const { data } = await api.get("/admin/commissions");
  return data as CommissionsData;
};

export const getTreasury = async () => {
  const { data } = await api.get("/admin/treasury");
  return data as TreasuryData;
};

// ─── Notifications ───
export const getAdminNotifications = async () => {
  const { data } = await api.get("/admin/notifications");
  return data as AdminNotificationsData;
};

// ─── Exports CSV ───
export const exportCsv = async (kind: "colis" | "utilisateurs" | "paiements" | "documents") => {
  const { data } = await api.get(`/admin/export${kind === "colis" ? "" : `?kind=${kind}`}`, { responseType: "blob" });
  const url = window.URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `madacolis-${kind}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// ─── Audits ───
export const getAudits = async (params: { page?: number; pageSize?: number; action?: string } = {}) => {
  const { data } = await api.get("/admin/audits", { params });
  return data as { success: boolean; audits: AuditLog[]; pagination: Pagination };
};

export type { Pagination };
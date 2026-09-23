import { api, http } from "@/services/api";
import type { CreateTransitaireShipmentPayload, ShipmentStatus, TransitaireActivityResponse, TransitaireClientsResponse, TransitaireDocumentsResponse, TransitaireNotificationsResponse, TransitairePaymentsResponse, TransitaireRates, TransitaireShipmentsResponse, TransitaireStats, TransitaireTeamResponse } from "@/types";

export function fetchTransitaireStats(signal?: AbortSignal) {
  return api<{ success: true; stats: TransitaireStats }>("/transitaire/stats", { signal });
}

export function fetchTransitaireShipments(params?: { status?: ShipmentStatus | ""; q?: string; page?: number; pageSize?: number }, signal?: AbortSignal) {
  return api<{ success: true } & TransitaireShipmentsResponse>("/transitaire/shipments", {
    params: {
      status: params?.status || undefined,
      q: params?.q || undefined,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
    },
    signal,
  });
}

export function fetchTransitaireShipment(id: string, signal?: AbortSignal) {
  return api<{ success: true; shipment: TransitaireShipmentsResponse["shipments"][number] }>(`/transitaire/shipments/${id}`, { signal });
}

export function updateTransitaireShipmentStatus(
  id: string,
  body: { status: ShipmentStatus; comment?: string; location?: string },
) {
  return api<{ success: true; message: string; shipment: unknown }>(`/transitaire/shipments/${id}/status`, {
    method: "PUT",
    body,
  });
}

export function fetchTransitaireRates(signal?: AbortSignal) {
  return api<{ success: true; rates: TransitaireRates }>("/transitaire/rates", { signal });
}

export function fetchTransitaireClients(params?: { q?: string; page?: number; pageSize?: number }, signal?: AbortSignal) {
  return api<{ success: true } & TransitaireClientsResponse>("/transitaire/clients", {
    params: {
      q: params?.q || undefined,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 8,
    },
    signal,
  });
}

export function fetchTransitairePayments(params?: { page?: number; pageSize?: number }, signal?: AbortSignal) {
  return api<{ success: true } & TransitairePaymentsResponse>("/transitaire/payments", {
    params: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
    },
    signal,
  });
}

export async function downloadTransitaireCsv(params?: { status?: ShipmentStatus | "" }) {
  const res = await http.get<Blob>("/transitaire/export", {
    responseType: "blob",
    params: { status: params?.status || undefined },
  });
  return res.data;
}

export function fetchTransitaireTeam(signal?: AbortSignal) {
  return api<{ success: true } & TransitaireTeamResponse>("/transitaire/team", { signal });
}

export function fetchTransitaireDocuments(params?: { page?: number; pageSize?: number }, signal?: AbortSignal) {
  return api<{ success: true } & TransitaireDocumentsResponse>("/transitaire/documents", {
    params: {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
    },
    signal,
  });
}

export function createTransitaireShipment(payload: CreateTransitaireShipmentPayload) {
  return api<{ success: true; message: string; shipment: TransitaireShipmentsResponse["shipments"][number] }>("/transitaire/shipments", {
    method: "POST",
    body: payload,
  });
}

export function fetchTransitaireActivity(signal?: AbortSignal) {
  return api<{ success: true } & TransitaireActivityResponse>("/transitaire/audit", { signal });
}

export function fetchTransitaireNotifications(signal?: AbortSignal) {
  return api<{ success: true } & TransitaireNotificationsResponse>("/transitaire/notifications", { signal });
}
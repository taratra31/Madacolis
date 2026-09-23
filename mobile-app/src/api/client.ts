import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../theme";

export const SERVER_URL_KEY = "madacolis.settings.serverUrl";

let baseOverride: string | null = null;

export const getEffectiveBaseUrl = (): string =>
  (baseOverride ?? API_BASE_URL).replace(/\/+$/, "");

export const setServerBaseUrl = (url: string | null) => {
  baseOverride = url?.trim() ? url.trim().replace(/\/+$/, "") : null;
};

export const loadServerBaseUrl = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem(SERVER_URL_KEY).catch(() => null);
  if (stored?.trim()) setServerBaseUrl(stored);
  return getEffectiveBaseUrl();
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

const trimUndefined = (v: Record<string, unknown>): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) {
    if (val != null && val !== "") out[k] = String(val);
  }
  return out;
};

export async function api<T>(
  path: string,
  { method = "GET", query, body, signal }: RequestOptions = {},
): Promise<T> {
  const base = getEffectiveBaseUrl();
  const qs = query ? "?" + new URLSearchParams(trimUndefined(query as Record<string, unknown>)).toString() : "";
  const url = `${base}${path}${qs}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError(0, "Impossible d'accéder au serveur. Vérifiez votre connexion.");
  }

  if (!res.ok) {
    let message = `Erreur serveur (${res.status})`;
    let code: string | undefined;
    try {
      const data = (await res.json()) as { message?: string; error?: string; code?: string };
      message = data.message ?? data.error ?? message;
      code = data.code;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message, code);
  }
  return (await res.json()) as T;
}
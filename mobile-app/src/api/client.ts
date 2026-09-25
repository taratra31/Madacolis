import AsyncStorage from "@react-native-async-storage/async-storage";

export const TOKEN_KEY = "mc_token";
export const USER_KEY = "mc_user";

export const API_BASE_URL: string = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "UNKNOWN_ERROR", status = 0) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(value: string | null) {
  token = value;
}

export function getAuthToken(): string | null {
  return token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function loadStoredToken(): Promise<string | null> {
  token = await AsyncStorage.getItem(TOKEN_KEY);
  return token;
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; code?: string };

  if (!res.ok) {
    if (res.status === 401) {
      setAuthToken(null);
      onUnauthorized?.();
    }
    throw new ApiError(data.message ?? "Erreur réseau", data.code, res.status);
  }
  return data as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
};
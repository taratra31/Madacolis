import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

export const API_BASE_URL: string = import.meta.env.VITE_API_URL || "/api/v1";

export const TOKEN_KEY = "mc_token";

export const AUTH_EVENTS = {
  unauthorized: "mc:unauthorized" as const,
};

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly errors?: unknown;

  constructor(message: string, options: { code: string; status: number; errors?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.errors = options.errors;
  }
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      if (status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.dispatchEvent(new CustomEvent(AUTH_EVENTS.unauthorized));
      }
      const payload = error.response?.data as { message?: string; code?: string; errors?: unknown } | undefined;
      throw new ApiError(payload?.message ?? error.message, {
        code: payload?.code ?? "NETWORK_ERROR",
        status,
        errors: payload?.errors,
      });
    }
    throw new ApiError("Erreur inattendue", { code: "UNKNOWN_ERROR", status: 0 });
  },
);

type RequestOptions = Omit<AxiosRequestConfig, "url" | "method" | "data" | "params"> & {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
};

/** Helper typé : appelle l'API et renvoie le corps de la réponse. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response: AxiosResponse<T> = await http.request({
    url: path,
    method: options.method ?? "GET",
    data: options.body,
    params: options.params,
    signal: options.signal,
  });
  return response.data;
}

export function unauthorizedHandler(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(AUTH_EVENTS.unauthorized, handler);
  return () => window.removeEventListener(AUTH_EVENTS.unauthorized, handler);
}
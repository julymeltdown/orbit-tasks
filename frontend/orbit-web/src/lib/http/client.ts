import { useAuthStore } from "@/stores/authStore";

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  skipAuth?: boolean;
  retryOnUnauthorized?: boolean;
  isFormData?: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "https://tasksapi.infinitefallcult.trade";
let refreshPromise: Promise<boolean> | null = null;

export function getApiBaseUrl(): string {
  return API_BASE;
}

function normalizeError(status: number, payload: unknown): HttpError {
  const fallback = "Request failed";
  if (payload && typeof payload === "object") {
    const candidate = payload as { message?: string; code?: string };
    const message = candidate.message ?? fallback;
    const code = candidate.code ?? `HTTP_${status}`;
    return new HttpError(message, status, code, payload);
  }
  return new HttpError(fallback, status, `HTTP_${status}`, payload);
}

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          useAuthStore.getState().clearSession();
          return false;
        }
        const payload = (await response.json()) as {
          userId: string;
          accessToken: string;
          tokenType: string;
          expiresIn: number;
        };
        useAuthStore.getState().setSession({
          userId: payload.userId,
          accessToken: payload.accessToken,
          tokenType: payload.tokenType,
          expiresIn: payload.expiresIn
        });
        return true;
      })
      .catch(() => {
        useAuthStore.getState().clearSession();
        return false;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    headers,
    body,
    signal,
    skipAuth = false,
    retryOnUnauthorized = true,
    isFormData = false
  } = options;
  const accessToken = useAuthStore.getState().accessToken;
  const requestHeaders: Record<string, string> = {
    ...headers
  };

  if (!isFormData) {
    requestHeaders["Content-Type"] = requestHeaders["Content-Type"] ?? "application/json";
  }
  if (!skipAuth && accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: requestHeaders,
    body:
      body === undefined
        ? undefined
        : isFormData
        ? (body as BodyInit)
        : JSON.stringify(body),
    signal
  });

  if (response.status === 401 && retryOnUnauthorized && !skipAuth) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(path, { ...options, retryOnUnauthorized: false });
    }
  }

  const text = await response.text();
  const payload = text ? safeJsonParse(text) : undefined;

  if (!response.ok) {
    throw normalizeError(response.status, payload);
  }

  return payload as T;
}

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return { message: input };
  }
}

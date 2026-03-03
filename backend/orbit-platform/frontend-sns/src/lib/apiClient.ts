"use client";

import { env } from "@/lib/env";
import { useAuthStore } from "@/store/authStore";
import type { AuthResponse } from "@/lib/types";

const API_BASE = env.apiBaseUrl;

export type ApiError = Error & {
  code?: string;
  status?: number;
  details?: unknown;
};

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
  retryOnUnauthorized?: boolean;
  isFormData?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) {
          useAuthStore.getState().clearSession();
          return false;
        }
        const payload = (await res.json()) as AuthResponse;
        useAuthStore.getState().setSession({
          userId: payload.userId,
          accessToken: payload.accessToken,
          expiresIn: payload.expiresIn,
          linkedProviders: payload.linkedProviders,
        });
        return true;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, retryOnUnauthorized = true, isFormData = false, ...init } = options;
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retryOnUnauthorized && !skipAuth) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(path, { ...options, retryOnUnauthorized: false });
    }
  }

  if (!response.ok) {
    const payload = await response.text();
    let message = payload;
    let code: string | undefined;
    let details: unknown;
    if (payload && response.headers.get("Content-Type")?.includes("application/json")) {
      try {
        const parsed = JSON.parse(payload) as { message?: string; code?: string; details?: unknown };
        if (parsed?.message) {
          message = parsed.message;
        }
        code = parsed?.code;
        details = parsed?.details;
      } catch {
        // Use raw payload when JSON parsing fails.
      }
    }
    const error = new Error(message || `Request failed with ${response.status}`) as ApiError;
    error.code = code;
    error.status = response.status;
    error.details = details;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  request,
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body
        ? options?.isFormData
          ? (body as BodyInit)
          : JSON.stringify(body)
        : undefined,
    }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
};

export { refreshSession };

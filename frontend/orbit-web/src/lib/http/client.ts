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
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

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

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", headers, body, signal } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal
  });

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

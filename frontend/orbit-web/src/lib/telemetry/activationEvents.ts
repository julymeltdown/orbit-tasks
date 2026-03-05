import { request } from "@/lib/http/client";
import type { ActivationEventType } from "@/features/activation/types";

const ACTIVATION_SESSION_KEY = "orbit.activation.session.id";
const ACTIVATION_STARTED_AT_KEY = "orbit.activation.session.startedAt";

function randomSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function simpleHash(value: string) {
  // Lightweight non-cryptographic hash for client telemetry correlation.
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return `u${Math.abs(hash)}`;
}

export function hashActivationUserId(value: string) {
  return simpleHash(value || "anonymous");
}

export function getOrCreateActivationSession() {
  if (typeof window === "undefined") {
    return "server-session";
  }
  const existing = window.localStorage.getItem(ACTIVATION_SESSION_KEY);
  if (existing) {
    return existing;
  }
  const next = randomSessionId();
  window.localStorage.setItem(ACTIVATION_SESSION_KEY, next);
  window.localStorage.setItem(ACTIVATION_STARTED_AT_KEY, String(Date.now()));
  return next;
}

export function getActivationElapsedMs() {
  if (typeof window === "undefined") {
    return 0;
  }
  const startedAt = Number(window.localStorage.getItem(ACTIVATION_STARTED_AT_KEY) ?? Date.now());
  return Math.max(0, Date.now() - startedAt);
}

export async function trackActivationEvent(input: {
  workspaceId: string;
  projectId: string;
  userId: string;
  eventType: ActivationEventType;
  route: string;
  metadata?: Record<string, unknown>;
}) {
  if (!input.workspaceId || !input.projectId || !input.userId) {
    return;
  }
  const sessionId = getOrCreateActivationSession();
  const userIdHash = hashActivationUserId(input.userId);
  const elapsedMs = getActivationElapsedMs();
  try {
    await request("/api/v2/activation/events", {
      method: "POST",
      body: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      userIdHash,
      sessionId,
      eventType: input.eventType,
      route: input.route,
      elapsedMs,
      metadata: input.metadata
      }
    });
  } catch {
    // Telemetry must not block UX.
  }
}

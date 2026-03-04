import { create } from "zustand";

const STORAGE_PREFIX = "orbit.session";
const USER_ID_KEY = `${STORAGE_PREFIX}.userId`;
const ACCESS_TOKEN_KEY = `${STORAGE_PREFIX}.accessToken`;
const TOKEN_TYPE_KEY = `${STORAGE_PREFIX}.tokenType`;
const EXPIRES_IN_KEY = `${STORAGE_PREFIX}.expiresIn`;

export interface SessionPayload {
  userId: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

interface AuthState {
  userId: string | null;
  accessToken: string | null;
  tokenType: string | null;
  expiresIn: number | null;
  hydrated: boolean;
  setSession: (payload: SessionPayload) => void;
  clearSession: () => void;
  hydrate: () => void;
}

function toNumber(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readSessionFromStorage() {
  if (typeof window === "undefined") {
    return {
      userId: null,
      accessToken: null,
      tokenType: null,
      expiresIn: null
    };
  }
  return {
    userId: localStorage.getItem(USER_ID_KEY),
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    tokenType: localStorage.getItem(TOKEN_TYPE_KEY),
    expiresIn: toNumber(localStorage.getItem(EXPIRES_IN_KEY))
  };
}

function writeSessionToStorage(payload: SessionPayload) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(USER_ID_KEY, payload.userId);
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  localStorage.setItem(TOKEN_TYPE_KEY, payload.tokenType);
  localStorage.setItem(EXPIRES_IN_KEY, String(payload.expiresIn));
}

function clearSessionFromStorage() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(TOKEN_TYPE_KEY);
  localStorage.removeItem(EXPIRES_IN_KEY);
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  accessToken: null,
  tokenType: null,
  expiresIn: null,
  hydrated: false,

  setSession: (payload) => {
    writeSessionToStorage(payload);
    set({
      userId: payload.userId,
      accessToken: payload.accessToken,
      tokenType: payload.tokenType,
      expiresIn: payload.expiresIn,
      hydrated: true
    });
  },

  clearSession: () => {
    clearSessionFromStorage();
    set({
      userId: null,
      accessToken: null,
      tokenType: null,
      expiresIn: null,
      hydrated: true
    });
  },

  hydrate: () => {
    const session = readSessionFromStorage();
    set({
      ...session,
      hydrated: true
    });
  }
}));


import { create } from "zustand";
import type { ActivationState } from "@/features/activation/types";

const STORAGE_KEY = "orbit.activation.state";
const DISCLOSURE_KEY = "orbit.activation.disclosure";

interface ActivationStoreState {
  byScope: Record<string, ActivationState>;
  advancedExpandedByScope: Record<string, boolean>;
  setState: (state: ActivationState) => void;
  getStateForScope: (workspaceId: string, projectId: string, userId: string) => ActivationState | null;
  resetScope: (workspaceId: string, projectId: string, userId: string) => void;
  isAdvancedExpanded: (workspaceId: string, projectId: string, userId: string) => boolean;
  setAdvancedExpanded: (workspaceId: string, projectId: string, userId: string, expanded: boolean) => void;
}

function makeScopeKey(workspaceId: string, projectId: string, userId: string) {
  return `${workspaceId}::${projectId}::${userId}`;
}

function readPersisted() {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, ActivationState>;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function writePersisted(value: Record<string, ActivationState>) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function readDisclosurePersisted() {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = window.localStorage.getItem(DISCLOSURE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function writeDisclosurePersisted(value: Record<string, boolean>) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(DISCLOSURE_KEY, JSON.stringify(value));
}

export const useActivationStore = create<ActivationStoreState>((set, get) => ({
  byScope: readPersisted(),
  advancedExpandedByScope: readDisclosurePersisted(),

  setState: (state) => {
    set((current) => {
      const key = makeScopeKey(state.workspaceId, state.projectId, state.userId);
      const byScope = {
        ...current.byScope,
        [key]: state
      };
      writePersisted(byScope);
      return { byScope };
    });
  },

  getStateForScope: (workspaceId, projectId, userId) => {
    const key = makeScopeKey(workspaceId, projectId, userId);
    return get().byScope[key] ?? null;
  },

  resetScope: (workspaceId, projectId, userId) => {
    set((current) => {
      const key = makeScopeKey(workspaceId, projectId, userId);
      const byScope = { ...current.byScope };
      delete byScope[key];
      writePersisted(byScope);
      return { byScope };
    });
  },

  isAdvancedExpanded: (workspaceId, projectId, userId) => {
    const key = makeScopeKey(workspaceId, projectId, userId);
    return Boolean(get().advancedExpandedByScope[key]);
  },

  setAdvancedExpanded: (workspaceId, projectId, userId, expanded) => {
    set((current) => {
      const key = makeScopeKey(workspaceId, projectId, userId);
      const next = { ...current.advancedExpandedByScope, [key]: expanded };
      writeDisclosurePersisted(next);
      return { advancedExpandedByScope: next };
    });
  }
}));

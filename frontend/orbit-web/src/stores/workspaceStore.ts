import { create } from "zustand";
import { HttpError, request } from "@/lib/http/client";
import { useAuthStore } from "@/stores/authStore";

const ACTIVE_WORKSPACE_KEY = "orbit.workspace.active";

export interface WorkspaceClaim {
  workspaceId: string;
  workspaceName: string;
  role: string;
  defaultWorkspace: boolean;
}

interface WorkspaceState {
  claims: WorkspaceClaim[];
  activeWorkspaceId: string | null;
  loading: boolean;
  error: string | null;
  fallbackNotice: string | null;
  loadClaims: () => Promise<void>;
  setActiveWorkspace: (workspaceId: string) => void;
  getActiveWorkspace: () => WorkspaceClaim | null;
}

function readActiveWorkspaceId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
}

function writeActiveWorkspaceId(workspaceId: string) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  claims: [],
  activeWorkspaceId: readActiveWorkspaceId(),
  loading: false,
  error: null,
  fallbackNotice: null,

  loadClaims: async () => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      set({
        loading: false,
        error: "Missing user session",
        claims: [],
        activeWorkspaceId: null,
        fallbackNotice: null
      });
      return;
    }

    set({ loading: true, error: null, fallbackNotice: null });
    const applyFallback = (reason: string) => {
      const fallbackClaim: WorkspaceClaim = {
        workspaceId: userId,
        workspaceName: "My Workspace",
        role: "WORKSPACE_MEMBER",
        defaultWorkspace: true
      };
      writeActiveWorkspaceId(fallbackClaim.workspaceId);
      set({
        claims: [fallbackClaim],
        activeWorkspaceId: fallbackClaim.workspaceId,
        loading: false,
        error: null,
        fallbackNotice: reason
      });
    };

    try {
      const claims = await request<WorkspaceClaim[]>(`/auth/workspace-claims?userId=${encodeURIComponent(userId)}`);
      if (claims.length === 0) {
        applyFallback("No workspace claim found yet. Using default workspace.");
        return;
      }
      const persisted = readActiveWorkspaceId();
      const matched = persisted ? claims.find((claim) => claim.workspaceId === persisted) : null;
      const fallback = claims.find((claim) => claim.defaultWorkspace) ?? claims[0] ?? null;
      const activeWorkspaceId = matched?.workspaceId ?? fallback?.workspaceId ?? null;

      if (activeWorkspaceId) {
        writeActiveWorkspaceId(activeWorkspaceId);
      }

      set({
        claims,
        activeWorkspaceId,
        loading: false,
        error: null,
        fallbackNotice: null
      });
    } catch (e) {
      if (e instanceof HttpError && e.status >= 500) {
        applyFallback("Identity claims service is temporarily unavailable. Showing default workspace.");
        return;
      }
      if (e instanceof Error && /io exception/i.test(e.message)) {
        applyFallback("Identity claims service returned IO exception. Showing default workspace.");
        return;
      }
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Cannot load workspace claims"
      });
    }
  },

  setActiveWorkspace: (workspaceId: string) => {
    writeActiveWorkspaceId(workspaceId);
    set({ activeWorkspaceId: workspaceId });
  },

  getActiveWorkspace: () => {
    const state = get();
    if (!state.activeWorkspaceId) {
      return null;
    }
    return state.claims.find((claim) => claim.workspaceId === state.activeWorkspaceId) ?? null;
  }
}));

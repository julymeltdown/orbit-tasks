import { create } from "zustand";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const PROJECT_MAP_KEY = "orbit.workspace.projects";

interface ProjectState {
  byWorkspace: Record<string, string>;
  setProjectForWorkspace: (workspaceId: string, projectId: string) => void;
  getProjectId: (workspaceId?: string | null) => string;
}

function readProjectMap(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = localStorage.getItem(PROJECT_MAP_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeProjectMap(next: Record<string, string>) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(PROJECT_MAP_KEY, JSON.stringify(next));
}

function generateWorkspaceProjectId(workspaceId: string): string {
  // Deterministic UUID-like value for demo endpoints that require UUID.
  const normalized = workspaceId.replace(/-/g, "").padEnd(32, "0").slice(0, 32);
  return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  byWorkspace: readProjectMap(),

  setProjectForWorkspace: (workspaceId: string, projectId: string) => {
    const next = { ...get().byWorkspace, [workspaceId]: projectId };
    writeProjectMap(next);
    set({ byWorkspace: next });
  },

  getProjectId: (workspaceId?: string | null) => {
    const activeWorkspaceId = workspaceId ?? useWorkspaceStore.getState().activeWorkspaceId;
    if (!activeWorkspaceId) {
      // Stable fallback UUID.
      return "00000000-0000-0000-0000-000000000001";
    }
    const existing = get().byWorkspace[activeWorkspaceId];
    if (existing) {
      return existing;
    }
    const generated = generateWorkspaceProjectId(activeWorkspaceId);
    const next = { ...get().byWorkspace, [activeWorkspaceId]: generated };
    writeProjectMap(next);
    set({ byWorkspace: next });
    return generated;
  }
}));

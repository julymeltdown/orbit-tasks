import { create } from "zustand";
import type { ProjectViewType } from "@/app/navigationModel";

const STORAGE_KEY = "orbit.project-view.context";

export interface ProjectViewFilters {
  [key: string]: string | boolean;
  assignee: string;
  status: string;
  sprintOnly: boolean;
  query: string;
}

export interface ProjectViewContext {
  view: ProjectViewType;
  viewIntent: "execution" | "bulk_edit" | "planning" | "schedule" | "summary";
  filters: ProjectViewFilters;
  selectedWorkItemId: string | null;
  lastDrilldownMetric: string | null;
}

interface ProjectViewState {
  byProject: Record<string, ProjectViewContext>;
  setView: (projectId: string, view: ProjectViewType) => void;
  setIntent: (projectId: string, intent: ProjectViewContext["viewIntent"]) => void;
  setFilter: <K extends keyof ProjectViewFilters>(projectId: string, key: K, value: ProjectViewFilters[K]) => void;
  setSelectedWorkItem: (projectId: string, workItemId: string | null) => void;
  setLastDrilldownMetric: (projectId: string, metric: string | null) => void;
  getContext: (projectId: string) => ProjectViewContext;
  resetProjectContext: (projectId: string) => void;
}

const DEFAULT_CONTEXT: ProjectViewContext = {
  view: "board",
  viewIntent: "execution",
  filters: {
    assignee: "",
    status: "ALL",
    sprintOnly: false,
    query: ""
  },
  selectedWorkItemId: null,
  lastDrilldownMetric: null
};

function resolveIntent(view: ProjectViewType): ProjectViewContext["viewIntent"] {
  switch (view) {
    case "board":
      return "execution";
    case "table":
      return "bulk_edit";
    case "timeline":
      return "planning";
    case "calendar":
      return "schedule";
    case "dashboard":
      return "summary";
    default:
      return "execution";
  }
}

function readPersisted(): Record<string, ProjectViewContext> {
  if (typeof window === "undefined") {
    return {};
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, ProjectViewContext>;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function writePersisted(value: Record<string, ProjectViewContext>) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function withProjectContext(
  state: ProjectViewState,
  projectId: string,
  map: (current: ProjectViewContext) => ProjectViewContext
): Record<string, ProjectViewContext> {
  const current = state.byProject[projectId] ?? DEFAULT_CONTEXT;
  return {
    ...state.byProject,
    [projectId]: map(current)
  };
}

export const useProjectViewStore = create<ProjectViewState>((set, get) => ({
  byProject: readPersisted(),

  setView: (projectId, view) => {
    set((state) => {
      const byProject = withProjectContext(state, projectId, (current) => ({
        ...current,
        view,
        viewIntent: resolveIntent(view)
      }));
      writePersisted(byProject);
      return { byProject };
    });
  },

  setIntent: (projectId, intent) => {
    set((state) => {
      const byProject = withProjectContext(state, projectId, (current) => ({
        ...current,
        viewIntent: intent
      }));
      writePersisted(byProject);
      return { byProject };
    });
  },

  setFilter: (projectId, key, value) => {
    set((state) => {
      const byProject = withProjectContext(state, projectId, (current) => ({
        ...current,
        filters: {
          ...current.filters,
          [key]: value
        }
      }));
      writePersisted(byProject);
      return { byProject };
    });
  },

  setSelectedWorkItem: (projectId, workItemId) => {
    set((state) => {
      const byProject = withProjectContext(state, projectId, (current) => ({
        ...current,
        selectedWorkItemId: workItemId
      }));
      writePersisted(byProject);
      return { byProject };
    });
  },

  setLastDrilldownMetric: (projectId, metric) => {
    set((state) => {
      const byProject = withProjectContext(state, projectId, (current) => ({
        ...current,
        lastDrilldownMetric: metric
      }));
      writePersisted(byProject);
      return { byProject };
    });
  },

  getContext: (projectId) => {
    const state = get();
    return state.byProject[projectId] ?? DEFAULT_CONTEXT;
  },

  resetProjectContext: (projectId) => {
    set((state) => {
      const next = { ...state.byProject };
      delete next[projectId];
      writePersisted(next);
      return { byProject: next };
    });
  }
}));

import type { ActivationActionLink } from "@/features/activation/types";

export type GuidedEmptyStateScope = "BOARD" | "SPRINT" | "INSIGHTS" | "INBOX" | "WORKSPACE_SELECT" | "DASHBOARD";

export interface GuidedEmptyState {
  scope: GuidedEmptyStateScope;
  title: string;
  description: string;
  statusHint?: string;
  primaryAction: ActivationActionLink;
  secondaryActions?: ActivationActionLink[];
  learnMoreLink?: string;
}

const EMPTY_STATE_REGISTRY: Record<GuidedEmptyStateScope, GuidedEmptyState> = {
  BOARD: {
    scope: "BOARD",
    title: "No tasks yet",
    description: "Create your first task to start execution tracking across board, table, timeline, and calendar.",
    statusHint: "First action",
    primaryAction: { label: "Create first task", path: "/app/projects/board?create=1" },
    secondaryActions: [
      { label: "Import tasks", path: "/app/integrations/import" },
      { label: "Open sprint", path: "/app/sprint" }
    ]
  },
  SPRINT: {
    scope: "SPRINT",
    title: "No active sprint",
    description: "Start a sprint to generate day plans, collect DSU, and run delivery coaching.",
    statusHint: "Plan → Freeze → Execute",
    primaryAction: { label: "Create sprint", path: "/app/sprint" },
    secondaryActions: [
      { label: "Back to board", path: "/app/projects/board" }
    ]
  },
  INSIGHTS: {
    scope: "INSIGHTS",
    title: "No evaluation yet",
    description: "Run an evaluation to generate risks, confidence, and draft mitigation actions.",
    statusHint: "AI diagnostics",
    primaryAction: { label: "Run evaluation", path: "/app/insights#run" },
    secondaryActions: [{ label: "Review board", path: "/app/projects/board" }]
  },
  INBOX: {
    scope: "INBOX",
    title: "Inbox is clear",
    description: "No pending notifications or AI questions. You can continue execution or open thread history.",
    statusHint: "Triage complete",
    primaryAction: { label: "Open board", path: "/app/projects/board" },
    secondaryActions: [{ label: "Open sprint", path: "/app/sprint" }]
  },
  WORKSPACE_SELECT: {
    scope: "WORKSPACE_SELECT",
    title: "Select workspace",
    description: "Choose a workspace to restore project context and continue from your last active flow.",
    primaryAction: { label: "Use default workspace", path: "/app/projects/board" }
  },
  DASHBOARD: {
    scope: "DASHBOARD",
    title: "Dashboard needs activity",
    description: "Create or move tasks to populate progress, capacity, blocker, and risk widgets.",
    primaryAction: { label: "Open board", path: "/app/projects/board" }
  }
};

export function getGuidedEmptyState(scope: GuidedEmptyStateScope) {
  return EMPTY_STATE_REGISTRY[scope];
}


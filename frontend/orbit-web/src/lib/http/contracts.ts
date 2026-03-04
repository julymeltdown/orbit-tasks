export type WorkspaceRole = "WORKSPACE_MEMBER" | "WORKSPACE_MANAGER" | "WORKSPACE_ADMIN";

export interface WorkspaceClaimContract {
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
  defaultWorkspace: boolean;
}

export type WorkItemStatusContract = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "ARCHIVED";
export type WorkItemTypeContract = "TASK" | "STORY" | "BUG" | "EPIC" | "IMPROVEMENT";

export interface WorkItemContract {
  workItemId: string;
  projectId: string;
  type: WorkItemTypeContract;
  title: string;
  status: WorkItemStatusContract;
  assignee: string | null;
  startAt: string | null;
  dueAt: string | null;
  priority: string | null;
  createdAt: string;
}

export interface DependencyContract {
  dependencyId: string;
  fromWorkItemId: string;
  toWorkItemId: string;
  type: string;
}

export interface ViewConfigurationContract {
  viewConfigId: string;
  projectId: string;
  ownerScope: "USER" | "TEAM" | "PROJECT_DEFAULT";
  viewType: "BOARD" | "TABLE" | "TIMELINE" | "CALENDAR" | "DASHBOARD";
  filters: Record<string, unknown>;
  sort: Record<string, unknown>;
  groupBy: string | null;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleRiskContract {
  type: string;
  summary: string;
  impact: string;
  recommendedActions: string[];
  evidence: string[];
}

export interface ScheduleEvaluationContract {
  evaluationId: string;
  health: "healthy" | "warning" | "at_risk";
  topRisks: ScheduleRiskContract[];
  questions: string[];
  confidence: number;
  fallback: boolean;
  reason: string;
}


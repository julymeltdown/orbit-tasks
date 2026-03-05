export type WorkItemStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "ARCHIVED";
export type WorkItemType = "TASK" | "STORY" | "BUG" | "EPIC";
export type WorkItemPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface WorkItem {
  workItemId: string;
  projectId: string;
  type: WorkItemType;
  title: string;
  status: WorkItemStatus;
  assignee: string | null;
  startAt: string | null;
  dueAt: string | null;
  priority: WorkItemPriority | null;
  estimateMinutes: number | null;
  actualMinutes: number | null;
  blockedReason: string | null;
  markdownBody: string | null;
  activityCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DependencyEdge {
  dependencyId: string;
  fromWorkItemId: string;
  toWorkItemId: string;
  type: string;
  createdAt?: string;
}

export interface DependencyGraphNode {
  workItemId: string;
  title: string;
  status: WorkItemStatus;
  upstreamCount: number;
  downstreamCount: number;
}

export interface DependencyGraph {
  nodes: DependencyGraphNode[];
  edges: DependencyEdge[];
}

export interface WorkItemActivity {
  activityId: string;
  workItemId: string;
  action: string;
  actorId: string;
  payload: unknown;
  createdAt: string;
}

export interface DSUSuggestion {
  suggestionId: string;
  targetType: string;
  targetId: string;
  proposedChange: Record<string, unknown>;
  confidence: number;
  reason: string;
  approved: boolean;
}

export interface EvaluationRisk {
  type: string;
  summary: string;
  impact: string;
  recommendedActions: string[];
  evidence: string[];
}

export interface EvaluationAction {
  actionId?: string;
  label?: string;
  status?: "draft" | "accepted" | "edited" | "ignored";
  note?: string;
}

export interface Evaluation {
  evaluationId: string;
  health: string;
  topRisks: EvaluationRisk[];
  questions: string[];
  actions: EvaluationAction[];
  confidence: number;
  fallback: boolean;
  reason: string;
}

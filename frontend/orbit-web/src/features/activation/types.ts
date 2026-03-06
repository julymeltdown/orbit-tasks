export type ActivationStage =
  | "NOT_STARTED"
  | "FIRST_ACTION_DONE"
  | "CORE_FLOW_CONTINUED"
  | "COMPLETED";

export type NavigationProfile = "NOVICE" | "ADVANCED";
export type ActivationSessionType = "first_session" | "returning_user" | "recovery_state";

export type ActivationStepCode =
  | "CREATE_TASK"
  | "OPEN_BOARD"
  | "START_SPRINT"
  | "RUN_AI_INSIGHT"
  | "TRIAGE_INBOX";

export type ActivationStepStatus = "LOCKED" | "AVAILABLE" | "DONE" | "SKIPPED";

export interface ActivationActionLink {
  label: string;
  path: string;
  description?: string;
}

export interface ActivationStep {
  stepCode: ActivationStepCode;
  title: string;
  description: string;
  status: ActivationStepStatus;
  primaryAction: ActivationActionLink;
  secondaryActions?: ActivationActionLink[];
}

export interface ActivationState {
  workspaceId: string;
  projectId: string;
  userId: string;
  activationStage: ActivationStage;
  sessionType: ActivationSessionType;
  navigationProfile: NavigationProfile;
  completed: boolean;
  completionReason: string | null;
  primaryAction: ActivationActionLink | null;
  secondaryActions: ActivationActionLink[];
  blockingReason: string | null;
  resumeTarget: {
    title: string;
    path: string;
    reason: string;
  } | null;
  checklist: ActivationStep[];
  updatedAt: string;
}

export type ActivationEventType =
  | "ACTIVATION_VIEW_LOADED"
  | "ACTIVATION_PRIMARY_CTA_CLICKED"
  | "FIRST_TASK_CREATED"
  | "BOARD_FIRST_INTERACTION"
  | "SPRINT_ENTERED"
  | "INSIGHT_EVALUATION_STARTED"
  | "INSIGHT_EVALUATION_COMPLETED"
  | "EMPTY_STATE_ACTION_CLICKED";

export interface ActivationEvent {
  workspaceId: string;
  projectId: string;
  userIdHash: string;
  sessionId: string;
  eventType: ActivationEventType;
  route: string;
  elapsedMs: number;
  metadata?: Record<string, unknown>;
}

export interface ActivationAcceptedResponse {
  status: "accepted";
  traceId?: string | null;
}

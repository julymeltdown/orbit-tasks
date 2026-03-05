import type { Evaluation } from "@/features/workitems/types";

export type AIGuidanceState = "not_run" | "evaluated" | "fallback";

export interface AIGuidanceStatus {
  state: AIGuidanceState;
  stateLabel: string;
  reasonLabel: string;
  summaryLabel: string;
  confidenceLabel: string;
  canApplyAction: boolean;
  isFallback: boolean;
}

const REASON_LABELS: Record<string, string> = {
  llm_success: "Primary model",
  ok: "Primary model",
  deterministic_fallback: "Fallback rules",
  fallback_rules_only: "Fallback rules",
  no_data: "Insufficient signals",
  not_run: "Not evaluated"
};

export function resolveReasonLabel(reason: string | null | undefined) {
  if (!reason) {
    return REASON_LABELS.not_run;
  }
  return REASON_LABELS[reason] ?? reason.replace(/_/g, " ");
}

export function resolveGuidanceStatus(evaluation: Evaluation | null, fallbackSummary: string): AIGuidanceStatus {
  if (!evaluation) {
    return {
      state: "not_run",
      stateLabel: "Not evaluated",
      reasonLabel: resolveReasonLabel("not_run"),
      summaryLabel: fallbackSummary,
      confidenceLabel: "Confidence 0%",
      canApplyAction: false,
      isFallback: false
    };
  }

  const fallback = evaluation.fallback;
  const reasonLabel = resolveReasonLabel(evaluation.reason);
  const confidencePct = Math.round((evaluation.confidence ?? 0) * 100);

  return {
    state: fallback ? "fallback" : "evaluated",
    stateLabel: fallback ? "Fallback Diagnostics" : "Evaluated",
    reasonLabel,
    summaryLabel: evaluation.topRisks[0]?.impact ?? fallbackSummary,
    confidenceLabel: `Confidence ${confidencePct}%`,
    canApplyAction: evaluation.actions.length > 0,
    isFallback: fallback
  };
}

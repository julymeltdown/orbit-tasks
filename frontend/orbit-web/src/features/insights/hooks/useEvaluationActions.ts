import { request } from "@/lib/http/client";

export type EvaluationAction = "accept" | "edit" | "ignore";

interface Payload {
  evaluationId: string;
  action: EvaluationAction;
  note?: string;
  patch?: Record<string, unknown>;
}

interface Result {
  evaluationId: string;
  action: string;
  note: string;
  status: string;
}

export function useEvaluationActions() {
  async function submitAction(payload: Payload): Promise<Result> {
    return request<Result>("/api/insights/schedule-evaluations/actions", {
      method: "POST",
      body: payload
    });
  }

  return { submitAction };
}

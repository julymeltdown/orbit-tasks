import { useState } from "react";
import { request } from "@/lib/http/client";
import { AICoachPanel } from "@/components/insights/AICoachPanel";
import { ScheduleHealthCards } from "@/components/insights/ScheduleHealthCards";
import { useEvaluationActions } from "@/features/insights/hooks/useEvaluationActions";

interface Evaluation {
  evaluationId: string;
  health: string;
  topRisks: Array<{
    type: string;
    summary: string;
    impact: string;
    recommendedActions: string[];
    evidence: string[];
  }>;
  questions: string[];
  confidence: number;
  fallback: boolean;
  reason: string;
}

export function ScheduleInsightsPage() {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { submitAction } = useEvaluationActions();

  async function runEvaluation() {
    setLoading(true);
    setError(null);
    try {
      const next = await request<Evaluation>("/api/insights/schedule-evaluations", {
        method: "POST",
        body: {
          workspaceId: "11111111-1111-1111-1111-111111111111",
          projectId: "22222222-2222-2222-2222-222222222222",
          sprintId: "44444444-4444-4444-4444-444444444444",
          remainingStoryPoints: 21,
          availableCapacitySp: 18,
          blockedCount: 1,
          atRiskCount: 1,
          simulateAiFailure: false
        }
      });
      setEvaluation(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evaluation failed");
    } finally {
      setLoading(false);
    }
  }

  async function acceptTopRisk() {
    if (!evaluation) return;
    try {
      await submitAction({
        evaluationId: evaluation.evaluationId,
        action: "accept",
        note: "Applied mitigation owner assignment"
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to store action");
    }
  }

  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 12", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Schedule Intelligence</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          Deterministic engine + AI structured output with fallback governance.
        </p>
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}
      </article>

      <div style={{ gridColumn: "span 8" }}>
        {evaluation ? (
          <ScheduleHealthCards
            health={evaluation.health}
            confidence={evaluation.confidence}
            topRisks={evaluation.topRisks}
            fallback={evaluation.fallback}
          />
        ) : (
          <div className="orbit-card" style={{ padding: 16 }}>
            No evaluation yet.
          </div>
        )}
      </div>

      <div style={{ gridColumn: "span 4", display: "grid", gap: 10 }}>
        <AICoachPanel
          questions={evaluation?.questions ?? []}
          reason={evaluation?.reason ?? "not_run"}
          onRun={runEvaluation}
          loading={loading}
        />
        {evaluation ? (
          <button className="orbit-button orbit-button--ghost" type="button" onClick={acceptTopRisk}>
            Accept Top Risk Action
          </button>
        ) : null}
      </div>
    </section>
  );
}

import { useState } from "react";
import { request } from "@/lib/http/client";
import { AICoachPanel } from "@/components/insights/AICoachPanel";
import { ScheduleHealthCards } from "@/components/insights/ScheduleHealthCards";
import { useEvaluationActions } from "@/features/insights/hooks/useEvaluationActions";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

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
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(workspaceId));
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingStoryPoints, setRemainingStoryPoints] = useState(21);
  const [availableCapacitySp, setAvailableCapacitySp] = useState(18);
  const [blockedCount, setBlockedCount] = useState(1);
  const [atRiskCount, setAtRiskCount] = useState(1);
  const [simulateAiFailure, setSimulateAiFailure] = useState(false);
  const { submitAction } = useEvaluationActions();

  async function runEvaluation() {
    if (!workspaceId) {
      setError("Select workspace first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await request<Evaluation>("/api/insights/schedule-evaluations", {
        method: "POST",
        body: {
          workspaceId,
          projectId,
          sprintId: "",
          remainingStoryPoints,
          availableCapacitySp,
          blockedCount,
          atRiskCount,
          simulateAiFailure
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
          <input
            className="orbit-input"
            type="number"
            min={0}
            value={remainingStoryPoints}
            onChange={(event) => setRemainingStoryPoints(Number(event.target.value))}
            placeholder="Remaining SP"
          />
          <input
            className="orbit-input"
            type="number"
            min={0}
            value={availableCapacitySp}
            onChange={(event) => setAvailableCapacitySp(Number(event.target.value))}
            placeholder="Capacity SP"
          />
          <input
            className="orbit-input"
            type="number"
            min={0}
            value={blockedCount}
            onChange={(event) => setBlockedCount(Number(event.target.value))}
            placeholder="Blocked"
          />
          <input
            className="orbit-input"
            type="number"
            min={0}
            value={atRiskCount}
            onChange={(event) => setAtRiskCount(Number(event.target.value))}
            placeholder="At Risk"
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8, paddingInline: 4 }}>
            <input type="checkbox" checked={simulateAiFailure} onChange={(event) => setSimulateAiFailure(event.target.checked)} />
            Simulate AI fallback
          </label>
        </div>
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

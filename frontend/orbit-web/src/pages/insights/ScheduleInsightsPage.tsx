import { useState } from "react";
import { useLocation } from "react-router-dom";
import { request } from "@/lib/http/client";
import { AICoachPanel } from "@/components/insights/AICoachPanel";
import { ScheduleHealthCards } from "@/components/insights/ScheduleHealthCards";
import { useEvaluationActions } from "@/features/insights/hooks/useEvaluationActions";
import type { Evaluation } from "@/features/workitems/types";
import { useProjectStore } from "@/stores/projectStore";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export function ScheduleInsightsPage() {
  const location = useLocation();
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(workspaceId));
  const selectedWorkItemId = useProjectViewStore((state) => state.getContext(projectId).selectedWorkItemId);
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
      const next = await request<Evaluation>("/api/v2/insights/evaluations", {
        method: "POST",
        body: {
          workspaceId,
          projectId,
          sprintId: "",
          selectedWorkItemId,
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
    <section className="orbit-insights-layout">
      <section className="orbit-insights-controls">
        <h2 style={{ marginTop: 0 }}>Schedule Intelligence</h2>
        <p style={{ marginTop: 0, color: "var(--orbit-text-subtle)", fontSize: 12 }}>
          Context · {location.pathname} · workspace {workspaceId ?? "not-selected"} · selected {selectedWorkItemId ?? "none"}
        </p>
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
      </section>

      <div className="orbit-insights-health">
        {evaluation ? (
          <ScheduleHealthCards
            health={evaluation.health}
            confidence={evaluation.confidence}
            topRisks={evaluation.topRisks}
            fallback={evaluation.fallback}
          />
        ) : (
          <div className="orbit-insights-empty">
            No evaluation yet.
          </div>
        )}
      </div>

      <div className="orbit-insights-side">
        <AICoachPanel
          questions={evaluation?.questions ?? []}
          actions={evaluation?.actions ?? []}
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

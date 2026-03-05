import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { HttpError, request } from "@/lib/http/client";
import { useEvaluationActions } from "@/features/insights/hooks/useEvaluationActions";
import { deriveInsightSignals } from "@/features/insights/insightSignals";
import { useActiveSprint } from "@/features/agile/hooks/useActiveSprint";
import { useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import type { Evaluation } from "@/features/workitems/types";
import { useProjectStore } from "@/stores/projectStore";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const HEALTH_SCORE_MAP: Record<string, number> = {
  ON_TRACK: 94,
  STABLE: 88,
  AT_RISK: 62,
  OFF_TRACK: 38,
  CRITICAL: 24
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function resolveReasonLabel(reason: string) {
  switch (reason) {
    case "llm_success":
      return "LLM primary response";
    case "deterministic_fallback":
      return "Fallback engine";
    case "no_data":
      return "Insufficient signals";
    case "not_run":
      return "Not evaluated";
    default:
      return reason.replace(/_/g, " ");
  }
}

function deriveHealthScore(evaluation: Evaluation | null, remainingSp: number, capacitySp: number, blocked: number, atRisk: number) {
  if (evaluation) {
    const mapped = HEALTH_SCORE_MAP[evaluation.health.toUpperCase()];
    if (typeof mapped === "number") {
      return mapped;
    }
  }
  const ratioPenalty = capacitySp <= 0 ? 40 : Math.max(0, (remainingSp - capacitySp) * 4);
  const blockedPenalty = blocked * 7;
  const riskPenalty = atRisk * 5;
  return clamp(Math.round(92 - ratioPenalty - blockedPenalty - riskPenalty), 8, 98);
}

export function ScheduleInsightsPage() {
  const claims = useWorkspaceStore((state) => state.claims);
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(workspaceId));
  const selectedWorkItemId = useProjectViewStore((state) => state.getContext(projectId).selectedWorkItemId);
  const { items } = useWorkItems(projectId);
  const { activeSprint } = useActiveSprint(workspaceId, projectId);
  const signals = useMemo(() => deriveInsightSignals(items, activeSprint?.capacitySp), [items, activeSprint?.capacitySp]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingStoryPoints, setRemainingStoryPoints] = useState(0);
  const [availableCapacitySp, setAvailableCapacitySp] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [metricsDirty, setMetricsDirty] = useState(false);
  const [simulateAiFailure, setSimulateAiFailure] = useState(false);
  const [applyingAction, setApplyingAction] = useState(false);
  const { submitAction } = useEvaluationActions();
  const activeWorkspaceName = useMemo(() => {
    return claims.find((claim) => claim.workspaceId === workspaceId)?.workspaceName ?? "Workspace";
  }, [claims, workspaceId]);

  useEffect(() => {
    if (metricsDirty) {
      return;
    }
    setRemainingStoryPoints(signals.remainingStoryPoints);
    setAvailableCapacitySp(signals.availableCapacitySp);
    setBlockedCount(signals.blockedCount);
    setAtRiskCount(signals.atRiskCount);
  }, [metricsDirty, signals]);

  useEffect(() => {
    if (!workspaceId || !projectId) {
      return;
    }
    const controller = new AbortController();
    request<Evaluation>(
      `/api/v2/insights/evaluations/latest?workspaceId=${encodeURIComponent(workspaceId)}&projectId=${encodeURIComponent(projectId)}`,
      { signal: controller.signal }
    )
      .then((response) => {
        setEvaluation(response);
      })
      .catch((nextError) => {
        if (nextError instanceof HttpError && nextError.status === 404) {
          return;
        }
        setError(nextError instanceof Error ? nextError.message : "Failed to load latest evaluation");
      });

    return () => {
      controller.abort();
    };
  }, [projectId, workspaceId]);

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
    setApplyingAction(true);
    try {
      await submitAction({
        evaluationId: evaluation.evaluationId,
        action: "accept",
        note: "Applied mitigation owner assignment"
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to store action");
    } finally {
      setApplyingAction(false);
    }
  }

  const healthScore = useMemo(
    () => deriveHealthScore(evaluation, remainingStoryPoints, availableCapacitySp, blockedCount, atRiskCount),
    [evaluation, remainingStoryPoints, availableCapacitySp, blockedCount, atRiskCount]
  );

  const confidenceScore = Math.round((evaluation?.confidence ?? 0.82) * 100);
  const trendDelta = clamp(Math.round((confidenceScore - 72) / 5), -8, 8);
  const chartColumns = useMemo(
    () =>
      [0.72, 0.84, 0.76, 1, 0.9, 0.63, 0.81].map((base) => clamp(Math.round(base * healthScore), 14, 100)),
    [healthScore]
  );

  const coachSummary = useMemo(() => {
    if (!evaluation) {
      if (remainingStoryPoints === 0) {
        return "활성 작업이 아직 없습니다. 작업을 추가한 뒤 평가를 실행하면 코칭이 생성됩니다.";
      }
      return `현재 입력 기준: 남은 ${remainingStoryPoints}SP, 가용 ${availableCapacitySp}SP, 블로커 ${blockedCount}개, 위험 ${atRiskCount}개`;
    }
    if (evaluation.topRisks.length === 0) {
      return "Current workload trend is stable. Keep blocker count low and monitor capacity drift.";
    }
    return evaluation.topRisks[0].impact;
  }, [atRiskCount, availableCapacitySp, blockedCount, evaluation, remainingStoryPoints]);

  const heroBadgeLabel = useMemo(() => {
    if (!evaluation) {
      return remainingStoryPoints > 0 ? "Live Metrics Ready" : "Awaiting Signals";
    }
    if (evaluation.fallback) {
      return "Fallback Diagnostics";
    }
    return `${evaluation.health.replace(/_/g, " ")} · Live`;
  }, [evaluation, remainingStoryPoints]);

  function resetMetricsFromSignals() {
    setMetricsDirty(false);
    setRemainingStoryPoints(signals.remainingStoryPoints);
    setAvailableCapacitySp(signals.availableCapacitySp);
    setBlockedCount(signals.blockedCount);
    setAtRiskCount(signals.atRiskCount);
  }

  return (
    <section className="orbit-insights-layout">
      <header className="orbit-insights-hero">
        <div className="orbit-insights-hero__title">
          <div className="orbit-insights-hero__badge">
            <span className="material-symbols-outlined">verified</span>
            <span>{heroBadgeLabel}</span>
          </div>
          <h2>Schedule Intelligence</h2>
          <p>
            {activeWorkspaceName} 워크스페이스의 용량·블로커·리스크를 기반으로 일정 상태를 예측하고 대응 전략 Draft를 생성합니다.
          </p>
        </div>
        <div className="orbit-insights-hero__actions">
          <div className="orbit-insights-hero__scope">
            <span className="material-symbols-outlined">target</span>
            <span>{selectedWorkItemId ? "Selected card scope" : "Workspace scope"}</span>
          </div>
          <button className="orbit-button" type="button" onClick={runEvaluation} disabled={loading}>
            <span className="material-symbols-outlined">auto_awesome</span>
            <span>{loading ? "Evaluating..." : "Run Evaluation"}</span>
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={resetMetricsFromSignals}>
            Use live metrics
          </button>
        </div>
      </header>

      <section className="orbit-insights-metrics">
        <label className="orbit-insights-metric">
          <span>Remaining Work</span>
          <strong>Story Points</strong>
          <input
            className="orbit-input"
            type="number"
            min={0}
            value={remainingStoryPoints}
            onChange={(event) => {
              setMetricsDirty(true);
              setRemainingStoryPoints(Number(event.target.value));
            }}
          />
        </label>
        <label className="orbit-insights-metric">
          <span>Available Capacity</span>
          <strong>Story Points</strong>
          <input
            className="orbit-input"
            type="number"
            min={0}
            value={availableCapacitySp}
            onChange={(event) => {
              setMetricsDirty(true);
              setAvailableCapacitySp(Number(event.target.value));
            }}
          />
        </label>
        <label className="orbit-insights-metric">
          <span>Blocked Items</span>
          <strong>Count</strong>
          <input
            className="orbit-input"
            type="number"
            min={0}
            value={blockedCount}
            onChange={(event) => {
              setMetricsDirty(true);
              setBlockedCount(Number(event.target.value));
            }}
          />
        </label>
        <label className="orbit-insights-metric">
          <span>At-Risk Items</span>
          <strong>Count</strong>
          <input
            className="orbit-input"
            type="number"
            min={0}
            value={atRiskCount}
            onChange={(event) => {
              setMetricsDirty(true);
              setAtRiskCount(Number(event.target.value));
            }}
          />
        </label>
        <label className="orbit-insights-toggle">
          <input type="checkbox" checked={simulateAiFailure} onChange={(event) => setSimulateAiFailure(event.target.checked)} />
          <div>
            <strong>Simulate AI fallback</strong>
            <small>LLM unavailable scenario를 강제로 실행해 규칙 기반 응답을 검증합니다.</small>
          </div>
        </label>
      </section>

      {error ? <p className="orbit-insights-error">{error}</p> : null}

      <section className="orbit-insights-main-grid">
        <article className="orbit-insights-health">
          <div className="orbit-insights-health__head">
            <div>
              <p className="orbit-insights-eyebrow">Schedule Health</p>
              <h3>Aggregate sprint reliability</h3>
            </div>
            <div className="orbit-insights-health__score">
              <strong>
                {healthScore}
                <span>%</span>
              </strong>
              <p className={trendDelta >= 0 ? "is-up" : "is-down"}>
                <span className="material-symbols-outlined">{trendDelta >= 0 ? "trending_up" : "trending_down"}</span>
                {trendDelta >= 0 ? `+${trendDelta}` : trendDelta}%
              </p>
            </div>
          </div>

          <div className="orbit-insights-health__bars" aria-hidden>
            {chartColumns.map((height, index) => (
              <span key={`${height}-${index}`} style={{ "--orbit-bar-h": `${height}%` } as CSSProperties} />
            ))}
          </div>

          <div className="orbit-insights-health__axis">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </article>

        <article className="orbit-insights-side">
          <header className="orbit-insights-side__head">
            <div>
              <p className="orbit-insights-eyebrow">AI Coaching</p>
              <h3>Draft Mitigations</h3>
            </div>
            <span className={`orbit-insights-status${evaluation?.fallback ? " is-fallback" : ""}`}>
              {resolveReasonLabel(evaluation?.reason ?? "not_run")}
            </span>
          </header>
          <p className="orbit-insights-side__summary">{coachSummary}</p>
          <div className="orbit-insights-side__meta">
            <span>Confidence {confidenceScore}%</span>
            {evaluation ? (
              evaluation.fallback ? (
                <span>Fallback result</span>
              ) : (
                <span>Primary model</span>
              )
            ) : (
              <span>Awaiting run</span>
            )}
          </div>

          <div className="orbit-insights-side__actions">
            <button className="orbit-button" type="button" onClick={acceptTopRisk} disabled={!evaluation || applyingAction}>
              <span className="material-symbols-outlined">done</span>
              <span>{applyingAction ? "Applying..." : "Apply Top Strategy"}</span>
            </button>
            <button className="orbit-button orbit-button--ghost" type="button" onClick={runEvaluation} disabled={loading}>
              Re-run
            </button>
          </div>

          {evaluation?.actions.length ? (
            <ul className="orbit-insights-list">
              {evaluation.actions.slice(0, 3).map((action, index) => (
                <li key={`${action.label ?? "action"}-${index}`}>
                  <span>{action.label ?? action.note ?? "Suggested action"}</span>
                  <strong>{(action.status ?? "draft").toUpperCase()}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="orbit-insights-empty">No draft actions yet.</p>
          )}

          {evaluation?.questions.length ? (
            <ul className="orbit-insights-questions">
              {evaluation.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          ) : null}
        </article>
      </section>

      <section className="orbit-insights-risks">
        <header className="orbit-insights-risks__head">
          <h3>Risk Breakdown</h3>
        </header>
        <div className="orbit-insights-risks__grid">
          {(evaluation?.topRisks ?? []).length === 0 ? (
            <p className="orbit-insights-empty">
              {remainingStoryPoints > 0
                ? "아직 평가 결과가 없습니다. Run Evaluation으로 리스크 상세와 evidence 링크를 생성하세요."
                : "작업 데이터가 누적되면 리스크 카드가 자동으로 생성됩니다."}
            </p>
          ) : (
            (evaluation?.topRisks ?? []).map((risk) => (
              <article key={`${risk.type}-${risk.summary}`} className={`orbit-insights-risk orbit-insights-risk--${risk.type.toLowerCase()}`}>
                <div className="orbit-insights-risk__title">
                  <h4>{risk.summary}</h4>
                  <span>{risk.type}</span>
                </div>
                <p>{risk.impact}</p>
                <ul>
                  {risk.recommendedActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
                {risk.evidence.length ? (
                  <div className="orbit-insights-risk__evidence">
                    {risk.evidence.map((entry) => (
                      <a
                        key={entry}
                        className="orbit-link-button orbit-link-button--tab"
                        href={`/app/projects/table?evidence=${encodeURIComponent(entry)}`}
                      >
                        {entry}
                      </a>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>

      <footer className="orbit-insights-footer">
        <div>
          <span>Remaining SP</span>
          <strong>{remainingStoryPoints}</strong>
        </div>
        <div>
          <span>Capacity SP</span>
          <strong>{availableCapacitySp}</strong>
        </div>
        <div>
          <span>Blocked</span>
          <strong>{blockedCount}</strong>
        </div>
        <div>
          <span>At Risk</span>
          <strong>{atRiskCount}</strong>
        </div>
      </footer>
    </section>
  );
}

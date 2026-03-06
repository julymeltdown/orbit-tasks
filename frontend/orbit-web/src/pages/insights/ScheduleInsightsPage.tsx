import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { HttpError, request } from "@/lib/http/client";
import { useEvaluationActions } from "@/features/insights/hooks/useEvaluationActions";
import { deriveInsightSignals } from "@/features/insights/insightSignals";
import { useActiveSprint } from "@/features/agile/hooks/useActiveSprint";
import { useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import type { Evaluation } from "@/features/workitems/types";
import { useProjectStore } from "@/stores/projectStore";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useAuthStore } from "@/stores/authStore";
import { EmptyStateCard } from "@/components/common/EmptyStateCard";
import { getGuidedEmptyState } from "@/features/activation/emptyStateRegistry";
import { resolveGuidanceStatus } from "@/features/insights/aiGuidanceStatus";
import { trackActivationEvent } from "@/lib/telemetry/activationEvents";

const HEALTH_SCORE_MAP: Record<string, number> = {
  ON_TRACK: 94,
  STABLE: 88,
  AT_RISK: 62,
  OFF_TRACK: 38,
  CRITICAL: 24,
  HEALTHY: 91,
  WARNING: 68
};

interface MetricsSnapshot {
  remainingStoryPoints: number;
  availableCapacitySp: number;
  blockedCount: number;
  atRiskCount: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toSnapshot(remainingStoryPoints: number, availableCapacitySp: number, blockedCount: number, atRiskCount: number): MetricsSnapshot {
  return {
    remainingStoryPoints,
    availableCapacitySp,
    blockedCount,
    atRiskCount
  };
}

function deriveHealthScore(evaluation: Evaluation | null, metrics: MetricsSnapshot) {
  if (evaluation) {
    const mapped = HEALTH_SCORE_MAP[evaluation.health.toUpperCase()];
    if (typeof mapped === "number") {
      return mapped;
    }
  }
  const ratioPenalty = metrics.availableCapacitySp <= 0 ? 40 : Math.max(0, (metrics.remainingStoryPoints - metrics.availableCapacitySp) * 4);
  const blockedPenalty = metrics.blockedCount * 7;
  const riskPenalty = metrics.atRiskCount * 5;
  return clamp(Math.round(92 - ratioPenalty - blockedPenalty - riskPenalty), 8, 98);
}

export function ScheduleInsightsPage() {
  const navigate = useNavigate();
  const claims = useWorkspaceStore((state) => state.claims);
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const userId = useAuthStore((state) => state.userId) ?? "member@orbit.local";
  const projectId = useProjectStore((state) => state.getProjectId(workspaceId));
  const selectedWorkItemId = useProjectViewStore((state) => state.getContext(projectId).selectedWorkItemId);
  const { items } = useWorkItems(projectId);
  const { activeSprint } = useActiveSprint(workspaceId, projectId);
  const signals = useMemo(() => deriveInsightSignals(items, activeSprint?.capacitySp), [items, activeSprint?.capacitySp]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"live" | "scenario">("live");
  const [scenarioMetrics, setScenarioMetrics] = useState<MetricsSnapshot>(() =>
    toSnapshot(signals.remainingStoryPoints, signals.availableCapacitySp, signals.blockedCount, signals.atRiskCount)
  );
  const [simulateAiFailure, setSimulateAiFailure] = useState(false);
  const [applyingAction, setApplyingAction] = useState(false);
  const { submitAction } = useEvaluationActions();
  const insightsEmptyState = getGuidedEmptyState("INSIGHTS");
  const activeWorkspaceName = useMemo(() => {
    return claims.find((claim) => claim.workspaceId === workspaceId)?.workspaceName ?? "Workspace";
  }, [claims, workspaceId]);

  const liveMetrics = useMemo(
    () =>
      toSnapshot(
        signals.remainingStoryPoints,
        signals.availableCapacitySp,
        signals.blockedCount,
        signals.atRiskCount
      ),
    [signals.atRiskCount, signals.availableCapacitySp, signals.blockedCount, signals.remainingStoryPoints]
  );

  useEffect(() => {
    if (mode === "live") {
      setScenarioMetrics(liveMetrics);
    }
  }, [liveMetrics, mode]);

  const activeMetrics = mode === "live" ? liveMetrics : scenarioMetrics;

  async function emitActivationEvent(
    eventType: "INSIGHT_EVALUATION_STARTED" | "INSIGHT_EVALUATION_COMPLETED" | "EMPTY_STATE_ACTION_CLICKED",
    metadata?: Record<string, unknown>
  ) {
    if (!workspaceId) {
      return;
    }
    await trackActivationEvent({
      workspaceId,
      projectId,
      userId,
      eventType,
      route: "/app/insights",
      metadata
    });
  }

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
    await emitActivationEvent("INSIGHT_EVALUATION_STARTED", {
      selectedWorkItemId: selectedWorkItemId ?? null,
      simulateAiFailure,
      mode
    });
    try {
      const next = await request<Evaluation>("/api/v2/insights/evaluations", {
        method: "POST",
        body: {
          workspaceId,
          projectId,
          sprintId: "",
          selectedWorkItemId,
          prompt: mode === "scenario" ? "scenario simulation" : "live telemetry",
          remainingStoryPoints: activeMetrics.remainingStoryPoints,
          availableCapacitySp: activeMetrics.availableCapacitySp,
          blockedCount: activeMetrics.blockedCount,
          atRiskCount: activeMetrics.atRiskCount,
          simulateAiFailure
        }
      });
      setEvaluation(next);
      await emitActivationEvent("INSIGHT_EVALUATION_COMPLETED", {
        fallback: next.fallback,
        reason: next.reason,
        mode
      });
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

  const healthScore = useMemo(() => deriveHealthScore(evaluation, activeMetrics), [evaluation, activeMetrics]);
  const guidanceStatus = useMemo(
    () =>
      resolveGuidanceStatus(
        evaluation,
        activeMetrics.remainingStoryPoints === 0
          ? "작업을 추가하면 AI 평가가 활성화됩니다."
          : `${mode === "live" ? "실시간 지표" : "시나리오 입력"} 기준: 남은 ${activeMetrics.remainingStoryPoints}SP, 가용 ${activeMetrics.availableCapacitySp}SP, 블로커 ${activeMetrics.blockedCount}개, 위험 ${activeMetrics.atRiskCount}개`
      ),
    [activeMetrics, evaluation, mode]
  );

  const confidenceScore = Math.round((evaluation?.confidence ?? 0.82) * 100);
  const trendDelta = clamp(Math.round((confidenceScore - 72) / 5), -8, 8);
  const chartColumns = useMemo(
    () => [0.72, 0.84, 0.76, 1, 0.9, 0.63, 0.81].map((base) => clamp(Math.round(base * healthScore), 14, 100)),
    [healthScore]
  );

  const coachSummary = useMemo(() => {
    if (!evaluation) {
      if (activeMetrics.remainingStoryPoints === 0) {
        return "활성 작업이 아직 없습니다. 작업을 추가한 뒤 평가를 실행하면 코칭이 생성됩니다.";
      }
      return `${mode === "live" ? "실시간 지표" : "시나리오 입력"} 기준: 남은 ${activeMetrics.remainingStoryPoints}SP, 가용 ${activeMetrics.availableCapacitySp}SP, 블로커 ${activeMetrics.blockedCount}개, 위험 ${activeMetrics.atRiskCount}개`;
    }
    if (evaluation.topRisks.length === 0) {
      return "명확한 위험 신호는 크지 않습니다. 블로커와 용량 변화만 계속 추적하면 됩니다.";
    }
    return evaluation.topRisks[0].impact;
  }, [activeMetrics, evaluation, mode]);

  const heroBadgeLabel = useMemo(() => {
    if (guidanceStatus.state === "not_run") {
      return mode === "live" ? "Live telemetry ready" : "Scenario draft ready";
    }
    if (guidanceStatus.state === "fallback") {
      return "Fallback diagnostics";
    }
    return `${mode === "live" ? "Live" : "Scenario"} · ${evaluation?.health.replace(/_/g, " ") ?? "evaluated"}`;
  }, [evaluation?.health, guidanceStatus.state, mode]);

  function updateScenario<K extends keyof MetricsSnapshot>(key: K, value: number) {
    setScenarioMetrics((current) => ({
      ...current,
      [key]: Math.max(0, value)
    }));
  }

  function resetScenarioFromLive() {
    setScenarioMetrics(liveMetrics);
  }

  const hasSignals = activeMetrics.remainingStoryPoints > 0 || activeMetrics.blockedCount > 0 || activeMetrics.atRiskCount > 0;

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
            {activeWorkspaceName} 워크스페이스의 일정 흐름을 해석합니다. 실시간 상태를 볼지, 가정값을 넣고 시뮬레이션할지 먼저 고르세요.
          </p>
        </div>
        <div className="orbit-insights-hero__actions">
          <div className="orbit-insights-hero__scope">
            <span className="material-symbols-outlined">target</span>
            <span>{selectedWorkItemId ? "Selected card context" : "Workspace scope"}</span>
          </div>
          <button className="orbit-button" type="button" onClick={runEvaluation} disabled={loading}>
            <span className="material-symbols-outlined">auto_awesome</span>
            <span>{loading ? "Evaluating..." : mode === "live" ? "Run Live Evaluation" : "Run Scenario"}</span>
          </button>
        </div>
      </header>

      <section className="orbit-insights-mode-switch" role="tablist" aria-label="Insights mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "live"}
          className={`orbit-link-button orbit-link-button--tab${mode === "live" ? " is-active" : ""}`}
          onClick={() => setMode("live")}
        >
          Live telemetry
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "scenario"}
          className={`orbit-link-button orbit-link-button--tab${mode === "scenario" ? " is-active" : ""}`}
          onClick={() => {
            setMode("scenario");
            resetScenarioFromLive();
          }}
        >
          Scenario simulation
        </button>
      </section>

      <section className="orbit-insights-mode-card">
        <div>
          <p className="orbit-insights-eyebrow">{mode === "live" ? "Live Mode" : "Scenario Mode"}</p>
          <strong>{mode === "live" ? "실제 데이터만 읽습니다" : "가정값을 넣고 결과를 실험합니다"}</strong>
          <p>
            {mode === "live"
              ? "남은 작업, 가용 용량, 블로커, 위험 항목은 현재 work item과 sprint 데이터에서 자동 계산됩니다."
              : "아래 값은 실제 데이터가 아니라 실험용 입력입니다. 팀에 적용되기 전에 대응 전략을 검토할 때 사용합니다."}
          </p>
        </div>
        {mode === "scenario" ? (
          <label className="orbit-insights-toggle">
            <input type="checkbox" checked={simulateAiFailure} onChange={(event) => setSimulateAiFailure(event.target.checked)} />
            <div>
              <strong>Simulate AI fallback</strong>
              <small>LLM unavailable scenario를 강제로 실행해 규칙 기반 응답을 검증합니다.</small>
            </div>
          </label>
        ) : (
          <button className="orbit-button orbit-button--ghost" type="button" onClick={resetScenarioFromLive}>
            live snapshot 동기화
          </button>
        )}
      </section>

      <section className="orbit-insights-metrics">
        <article className="orbit-insights-metric">
          <span>Remaining Work</span>
          <strong>{activeMetrics.remainingStoryPoints} SP</strong>
          {mode === "scenario" ? (
            <input className="orbit-input" type="number" min={0} value={activeMetrics.remainingStoryPoints} onChange={(event) => updateScenario("remainingStoryPoints", Number(event.target.value))} />
          ) : (
            <small>실시간 계산값</small>
          )}
        </article>
        <article className="orbit-insights-metric">
          <span>Available Capacity</span>
          <strong>{activeMetrics.availableCapacitySp} SP</strong>
          {mode === "scenario" ? (
            <input className="orbit-input" type="number" min={0} value={activeMetrics.availableCapacitySp} onChange={(event) => updateScenario("availableCapacitySp", Number(event.target.value))} />
          ) : (
            <small>활성 sprint 기준</small>
          )}
        </article>
        <article className="orbit-insights-metric">
          <span>Blocked Items</span>
          <strong>{activeMetrics.blockedCount}</strong>
          {mode === "scenario" ? (
            <input className="orbit-input" type="number" min={0} value={activeMetrics.blockedCount} onChange={(event) => updateScenario("blockedCount", Number(event.target.value))} />
          ) : (
            <small>블로커가 있는 작업 수</small>
          )}
        </article>
        <article className="orbit-insights-metric">
          <span>At-Risk Items</span>
          <strong>{activeMetrics.atRiskCount}</strong>
          {mode === "scenario" ? (
            <input className="orbit-input" type="number" min={0} value={activeMetrics.atRiskCount} onChange={(event) => updateScenario("atRiskCount", Number(event.target.value))} />
          ) : (
            <small>기한/용량/블로커 기준</small>
          )}
        </article>
      </section>

      {error ? <p className="orbit-insights-error">{error}</p> : null}

      {!evaluation && !hasSignals ? (
        <EmptyStateCard
          title={insightsEmptyState.title}
          description={insightsEmptyState.description}
          statusHint={insightsEmptyState.statusHint}
          actions={[
            {
              label: insightsEmptyState.primaryAction.label,
              onClick: () => {
                emitActivationEvent("EMPTY_STATE_ACTION_CLICKED", { scope: "INSIGHTS", action: "open_board" }).catch(() => undefined);
                navigate(insightsEmptyState.primaryAction.path);
              }
            }
          ]}
          secondaryActions={[
            {
              label: "보드 준비하기",
              variant: "ghost",
              onClick: () => navigate("/app/projects/board")
            }
          ]}
          learnMoreHref="/app/projects/board"
          learnMoreLabel="작업 먼저 만들기"
        />
      ) : null}

      <section className="orbit-insights-main-grid">
        <article className="orbit-insights-health">
          <div className="orbit-insights-health__head">
            <div>
              <p className="orbit-insights-eyebrow">Schedule Health</p>
              <h3>{mode === "live" ? "현재 일정 건강도" : "시나리오 기반 일정 건강도"}</h3>
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
            <span className={`orbit-insights-status${guidanceStatus.isFallback ? " is-fallback" : ""}`}>
              {guidanceStatus.reasonLabel}
            </span>
          </header>
          <p className="orbit-insights-side__summary">{coachSummary}</p>
          <div className="orbit-insights-side__meta">
            <span>{guidanceStatus.confidenceLabel}</span>
            <span>{mode === "live" ? "Live input" : "Scenario input"}</span>
            {evaluation ? <span>{evaluation.fallback ? "Fallback result" : "Primary model"}</span> : <span>Awaiting run</span>}
          </div>

          <div className="orbit-insights-side__actions">
            <button className="orbit-button" type="button" onClick={acceptTopRisk} disabled={!evaluation || applyingAction || !guidanceStatus.canApplyAction}>
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
            <p className="orbit-insights-empty">평가 후 초안 액션이 여기에 표시됩니다.</p>
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
          <span className="orbit-insights-risks__mode">{mode === "live" ? "실시간 기준" : "시나리오 기준"}</span>
        </header>
        <div className="orbit-insights-risks__grid">
          {(evaluation?.topRisks ?? []).length === 0 ? (
            <p className="orbit-insights-empty">
              {hasSignals
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
                      <a key={entry} className="orbit-link-button orbit-link-button--tab" href={`/app/projects/table?evidence=${encodeURIComponent(entry)}`}>
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
          <span>Mode</span>
          <strong>{mode === "live" ? "Live" : "Scenario"}</strong>
        </div>
        <div>
          <span>Remaining SP</span>
          <strong>{activeMetrics.remainingStoryPoints}</strong>
        </div>
        <div>
          <span>Capacity SP</span>
          <strong>{activeMetrics.availableCapacitySp}</strong>
        </div>
        <div>
          <span>Blocked</span>
          <strong>{activeMetrics.blockedCount}</strong>
        </div>
        <div>
          <span>At Risk</span>
          <strong>{activeMetrics.atRiskCount}</strong>
        </div>
      </footer>
    </section>
  );
}

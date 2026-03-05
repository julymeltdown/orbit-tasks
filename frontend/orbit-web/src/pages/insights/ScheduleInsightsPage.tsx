import { useMemo, useState } from "react";
import { request } from "@/lib/http/client";
import { AICoachPanel } from "@/components/insights/AICoachPanel";
import { ScheduleHealthCards } from "@/components/insights/ScheduleHealthCards";
import { useEvaluationActions } from "@/features/insights/hooks/useEvaluationActions";
import type { Evaluation } from "@/features/workitems/types";
import { useProjectStore } from "@/stores/projectStore";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export function ScheduleInsightsPage() {
  const claims = useWorkspaceStore((state) => state.claims);
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
  const activeWorkspaceName = useMemo(() => {
    return claims.find((claim) => claim.workspaceId === workspaceId)?.workspaceName ?? "Workspace";
  }, [claims, workspaceId]);

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
        <p className="orbit-insights-controls__summary">
          {activeWorkspaceName}의 현재 스프린트 상태를 숫자로 입력하면, AI가 일정 리스크와 대응 액션 초안을 생성합니다.
          제안은 즉시 적용되지 않으며, 사용자 확인 후 반영됩니다.
        </p>

        <div className="orbit-insights-metrics">
          <label className="orbit-insights-metric">
            <span>남은 작업량 (SP)</span>
            <input
              className="orbit-input"
              type="number"
              min={0}
              value={remainingStoryPoints}
              onChange={(event) => setRemainingStoryPoints(Number(event.target.value))}
            />
            <small>아직 완료되지 않은 스토리 포인트 합계</small>
          </label>

          <label className="orbit-insights-metric">
            <span>가용 용량 (SP)</span>
            <input
              className="orbit-input"
              type="number"
              min={0}
              value={availableCapacitySp}
              onChange={(event) => setAvailableCapacitySp(Number(event.target.value))}
            />
            <small>현재 스프린트에서 소화 가능한 용량</small>
          </label>

          <label className="orbit-insights-metric">
            <span>블로커 수</span>
            <input
              className="orbit-input"
              type="number"
              min={0}
              value={blockedCount}
              onChange={(event) => setBlockedCount(Number(event.target.value))}
            />
            <small>외부 의존성/승인 등으로 막힌 항목</small>
          </label>

          <label className="orbit-insights-metric">
            <span>위험 항목 수</span>
            <input
              className="orbit-input"
              type="number"
              min={0}
              value={atRiskCount}
              onChange={(event) => setAtRiskCount(Number(event.target.value))}
            />
            <small>지연 가능성이 높은 작업 개수</small>
          </label>
        </div>

        <label className="orbit-insights-toggle">
          <input type="checkbox" checked={simulateAiFailure} onChange={(event) => setSimulateAiFailure(event.target.checked)} />
          <span>AI 폴백 시뮬레이션</span>
          <small>LLM 오류 상황에서 규칙 기반 결과를 테스트할 때 사용</small>
        </label>

        <div className="orbit-insights-controls__actions">
          <button className="orbit-button" type="button" onClick={runEvaluation} disabled={loading}>
            {loading ? "평가 중..." : "AI 일정 평가 실행"}
          </button>
          <p className="orbit-insights-controls__meta">
            {selectedWorkItemId ? "선택 카드 기준 포함됨" : "선택 카드 없음: 프로젝트 전체 기준"}
          </p>
        </div>

        {error ? <p style={{ color: "var(--orbit-danger)", margin: 0 }}>{error}</p> : null}
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
            아직 평가 결과가 없습니다. 상단의 숫자를 확인한 뒤 <strong>AI 일정 평가 실행</strong> 버튼을 눌러 주세요.
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
            최상위 리스크 액션 수락
          </button>
        ) : null}
      </div>
    </section>
  );
}

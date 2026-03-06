import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActivationChecklist } from "@/components/activation/ActivationChecklist";
import { EmptyStateCard } from "@/components/common/EmptyStateCard";
import { getGuidedEmptyState } from "@/features/activation/emptyStateRegistry";
import { useActivation } from "@/features/activation/hooks/useActivation";
import { featureFlags } from "@/lib/config/featureFlags";
import { hashActivationUserId, trackActivationEvent } from "@/lib/telemetry/activationEvents";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import { useAuthStore } from "@/stores/authStore";
import { useActivationStore } from "@/stores/activationStore";
import { ACTION_LABELS, roleLabel } from "@/features/usability";

export function OperationsHubPage() {
  const navigate = useNavigate();
  const claims = useWorkspaceStore((state) => state.claims);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const loadingClaims = useWorkspaceStore((state) => state.loading);
  const loadClaims = useWorkspaceStore((state) => state.loadClaims);
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const userId = useAuthStore((state) => state.userId) ?? "member@orbit.local";
  const activationUserId = hashActivationUserId(userId);
  const activation = useActivation();
  const activationState = useActivationStore((state) =>
    activeWorkspaceId ? state.getStateForScope(activeWorkspaceId, projectId, activationUserId) : null
  );
  const setActivationState = useActivationStore((state) => state.setState);
  const { byStatus, items, loading: loadingItems } = useWorkItems(projectId);
  const [loadingActivation, setLoadingActivation] = useState(false);

  useEffect(() => {
    if (claims.length === 0 && !loadingClaims) {
      loadClaims().catch(() => undefined);
    }
  }, [claims.length, loadingClaims, loadClaims]);

  useEffect(() => {
    if (!featureFlags.activationUiV1 || !activeWorkspaceId || !projectId) {
      return;
    }
    let cancelled = false;
    setLoadingActivation(true);
    activation
      .getState(activeWorkspaceId, projectId, activationUserId)
      .then((response) => {
        if (!cancelled && response) {
          setActivationState(response);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setLoadingActivation(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activation, activationUserId, activeWorkspaceId, projectId, setActivationState]);

  const activeWorkspace = useMemo(() => {
    return claims.find((claim) => claim.workspaceId === activeWorkspaceId) ?? null;
  }, [claims, activeWorkspaceId]);

  const modules = useMemo(() => {
    const activeCount = byStatus.IN_PROGRESS.length;
    const backlogCount = byStatus.TODO.length;
    const reviewCount = byStatus.REVIEW.length;
    const doneCount = byStatus.DONE.length;
    return [
      {
        id: "board",
        title: "보드 실행",
        path: "/app/projects/board",
        primaryLabel: ACTION_LABELS.goToBoard,
        secondaryPath: "/app/projects/table",
        secondaryLabel: "테이블 검토",
        metricLabel: "Backlog",
        metricValue: `${backlogCount}`
      },
      {
        id: "sprint",
        title: "스프린트 루프",
        path: "/app/sprint?mode=planning",
        primaryLabel: ACTION_LABELS.goToSprint,
        secondaryPath: "/app/insights",
        secondaryLabel: ACTION_LABELS.goToInsights,
        metricLabel: "Doing",
        metricValue: `${activeCount}`
      },
      {
        id: "inbox",
        title: "협업 triage",
        path: "/app/inbox",
        primaryLabel: ACTION_LABELS.goToInbox,
        secondaryPath: "/app/projects/dashboard",
        secondaryLabel: "대시보드 보기",
        metricLabel: "Review",
        metricValue: `${reviewCount}`
      },
      {
        id: "done",
        title: "완료된 일",
        path: "/app/projects/dashboard",
        primaryLabel: "요약 보기",
        secondaryPath: "/app/insights",
        secondaryLabel: "평가 보기",
        metricLabel: "Done",
        metricValue: `${doneCount}`
      }
    ];
  }, [byStatus]);

  const dashboardEmptyState = getGuidedEmptyState("DASHBOARD");
  const primaryAction = activationState?.primaryAction ?? { label: ACTION_LABELS.createFirstTask, path: "/app/projects/board?create=1" };
  const secondaryActions = activationState?.secondaryActions ?? [];

  async function emitActivation(eventType: "ACTIVATION_PRIMARY_CTA_CLICKED" | "EMPTY_STATE_ACTION_CLICKED", metadata?: Record<string, unknown>) {
    if (!activeWorkspaceId) {
      return;
    }
    await trackActivationEvent({
      workspaceId: activeWorkspaceId,
      projectId,
      userId,
      eventType,
      route: "/app",
      metadata
    });
  }

  function ensureWorkspaceThenNavigate(path: string) {
    if (!activeWorkspaceId) {
      navigate(`/app/workspace/select?returnTo=${encodeURIComponent(path)}`);
      return;
    }
    navigate(path);
  }

  return (
    <section className="orbit-shell__content-grid orbit-ops-hub">
      <article className="orbit-card orbit-ops-hub__hero" style={{ gridColumn: "span 8" }}>
        <div className="orbit-ops-hub__hero-head">
          <div>
            <p className="orbit-ops-hub__eyebrow">Activation Flow</p>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>처음이라면 한 가지 행동만 먼저 시작하세요</h2>
            <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>
              {activationState?.sessionType === "returning_user"
                ? activationState.resumeTarget?.reason ?? "이전에 진행하던 작업 흐름을 이어갈 수 있습니다."
                : "먼저 작업 범위를 정하고, 첫 작업을 만든 뒤 보드에서 실행 흐름을 시작합니다."}
            </p>
          </div>
          <div className="orbit-ops-hub__workspace">
            <strong>{activeWorkspace?.workspaceName ?? "워크스페이스를 선택하세요"}</strong>
            <span>{roleLabel(activeWorkspace?.role ?? "WORKSPACE_MEMBER")} · {activationState?.sessionType === "returning_user" ? "Resume available" : "First session"}</span>
            <button className="orbit-button orbit-button--ghost" type="button" onClick={() => navigate("/app/workspace/select")}>
              워크스페이스 변경
            </button>
          </div>
        </div>

        <div className="orbit-ops-hub__actions orbit-ops-hub__actions--activation">
          <button
            className="orbit-button"
            type="button"
            onClick={() => {
              emitActivation("ACTIVATION_PRIMARY_CTA_CLICKED", { cta: primaryAction.label }).catch(() => undefined);
              ensureWorkspaceThenNavigate(primaryAction.path);
            }}
          >
            {primaryAction.label}
          </button>
          {(secondaryActions.length > 0 ? secondaryActions : [
            { label: ACTION_LABELS.importTasks, path: "/app/integrations/import" },
            { label: ACTION_LABELS.inviteTeammate, path: "/app/team" }
          ]).slice(0, 2).map((action) => (
            <button
              key={action.path}
              className="orbit-button orbit-button--ghost"
              type="button"
              onClick={() => {
                emitActivation("EMPTY_STATE_ACTION_CLICKED", { action: action.label }).catch(() => undefined);
                ensureWorkspaceThenNavigate(action.path);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </article>

      <div style={{ gridColumn: "span 4" }}>
        {activationState ? (
          <ActivationChecklist checklist={activationState.checklist} />
        ) : (
          <EmptyStateCard
            title="다음 행동을 준비하는 중입니다"
            description="이 워크스페이스와 프로젝트 기준으로 첫 단계 체크리스트를 불러오고 있습니다."
            statusHint={loadingActivation ? "Syncing" : "Ready soon"}
            actions={[{ label: ACTION_LABELS.goToBoard, onClick: () => ensureWorkspaceThenNavigate("/app/projects/board"), variant: "ghost" }]}
          />
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ gridColumn: "span 12" }}>
          <EmptyStateCard
            title={dashboardEmptyState.title}
            description={dashboardEmptyState.description}
            statusHint="첫 작업이 있어야 전체 흐름이 시작됩니다"
            actions={[
              {
                label: dashboardEmptyState.primaryAction.label,
                onClick: () => {
                  emitActivation("EMPTY_STATE_ACTION_CLICKED", { scope: "DASHBOARD", action: "open_board" }).catch(() => undefined);
                  ensureWorkspaceThenNavigate(dashboardEmptyState.primaryAction.path);
                }
              }
            ]}
            secondaryActions={[
              {
                label: ACTION_LABELS.goToSprint,
                onClick: () => ensureWorkspaceThenNavigate("/app/sprint?mode=planning"),
                variant: "ghost"
              }
            ]}
            learnMoreHref="/app/insights"
            learnMoreLabel="AI 준비 상태 보기"
          />
        </div>
      ) : null}

      {items.length > 0 &&
        modules.map((module) => (
          <article key={module.id} className="orbit-card orbit-ops-hub__module" style={{ gridColumn: "span 6" }}>
            <div className="orbit-ops-hub__module-head">
              <h3 style={{ margin: 0 }}>{module.title}</h3>
              <div className="orbit-ops-hub__metric">
                <span>{module.metricLabel}</span>
                <strong>{loadingItems ? "..." : module.metricValue}</strong>
              </div>
            </div>
            <div className="orbit-ops-hub__actions">
              <button className="orbit-button" type="button" onClick={() => ensureWorkspaceThenNavigate(module.path)}>
                {module.primaryLabel}
              </button>
              <button className="orbit-button orbit-button--ghost" type="button" onClick={() => ensureWorkspaceThenNavigate(module.secondaryPath)}>
                {module.secondaryLabel}
              </button>
            </div>
          </article>
        ))}
    </section>
  );
}

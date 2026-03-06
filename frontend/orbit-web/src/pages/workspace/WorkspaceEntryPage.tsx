import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { resolveReturnTo } from "@/lib/routing/restoreIntent";
import { useProjectStore } from "@/stores/projectStore";
import { useAuthStore } from "@/stores/authStore";
import { EmptyStateCard } from "@/components/common/EmptyStateCard";
import { getGuidedEmptyState } from "@/features/activation/emptyStateRegistry";
import { trackActivationEvent } from "@/lib/telemetry/activationEvents";
import { ACTION_LABELS, roleLabel } from "@/features/usability";

export function WorkspaceEntryPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedPath = resolveReturnTo(params.get("returnTo"), "/app/projects/board");
  const claims = useWorkspaceStore((state) => state.claims);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const loading = useWorkspaceStore((state) => state.loading);
  const error = useWorkspaceStore((state) => state.error);
  const fallbackNotice = useWorkspaceStore((state) => state.fallbackNotice);
  const loadClaims = useWorkspaceStore((state) => state.loadClaims);
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace);
  const userId = useAuthStore((state) => state.userId) ?? "member@orbit.local";
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const guided = getGuidedEmptyState("WORKSPACE_SELECT");

  useEffect(() => {
    loadClaims().catch(() => undefined);
  }, [loadClaims]);

  async function emitActivationEvent(workspaceId: string, action: string) {
    await trackActivationEvent({
      workspaceId,
      projectId,
      userId,
      eventType: "EMPTY_STATE_ACTION_CLICKED",
      route: "/app/workspace/select",
      metadata: {
        scope: "WORKSPACE_SELECT",
        action
      }
    });
  }

  function chooseWorkspace(workspaceId: string, nextPath?: string) {
    setActiveWorkspace(workspaceId);
    if (nextPath) {
      navigate(nextPath);
    }
  }

  const recommendedPath = useMemo(() => {
    if (params.get("returnTo")) {
      return requestedPath;
    }
    return "/app/projects/board";
  }, [params, requestedPath]);

  return (
    <section className="orbit-workspace-entry">
      <header className="orbit-workspace-entry__hero">
        <h2 style={{ margin: 0 }}>먼저 워크스페이스 범위를 고르세요</h2>
        <p>
          어느 워크스페이스에서 일할지 먼저 정하면, 그 다음 보드나 스프린트 같은 작업 화면은 추천 경로로 안내합니다.
        </p>

        {loading ? <p className="orbit-text-subtle">워크스페이스 목록을 불러오는 중...</p> : null}
        {error ? (
          <p role="alert" className="orbit-danger">
            {error}
          </p>
        ) : null}
        {fallbackNotice ? (
          <p role="status" className="orbit-text-subtle">
            {fallbackNotice}
          </p>
        ) : null}
      </header>

      {!loading && !error && claims.length === 0 ? (
        <EmptyStateCard
          title={guided.title}
          description={guided.description}
          actions={[
            {
              label: guided.primaryAction.label,
              onClick: () => {
                const nextWorkspaceId = activeWorkspaceId ?? claims[0]?.workspaceId;
                if (nextWorkspaceId) {
                  emitActivationEvent(nextWorkspaceId, "use_default_workspace").catch(() => undefined);
                  chooseWorkspace(nextWorkspaceId, guided.primaryAction.path);
                }
              }
            }
          ]}
        />
      ) : null}

      {!loading && !error && claims.length > 0 ? (
        <div className="orbit-workspace-entry__list">
          {claims.map((claim) => {
            const isActive = activeWorkspaceId === claim.workspaceId;
            return (
              <article key={claim.workspaceId} className="orbit-workspace-entry__claim orbit-animate-card">
                <div>
                  <strong>{claim.workspaceName}</strong>
                  <div className="orbit-workspace-entry__meta">{roleLabel(claim.role)} · {claim.defaultWorkspace ? "기본 워크스페이스" : "선택 가능"}</div>
                </div>
                <div className="orbit-workspace-entry__right">
                  <div className="orbit-workspace-entry__buttons">
                    <button
                      className="orbit-button"
                      type="button"
                      onClick={() => {
                        emitActivationEvent(claim.workspaceId, "select_workspace").catch(() => undefined);
                        chooseWorkspace(claim.workspaceId);
                      }}
                    >
                      {isActive ? "현재 워크스페이스" : ACTION_LABELS.continueWorkspace}
                    </button>
                  </div>
                  {isActive ? (
                    <div className="orbit-workspace-entry__buttons">
                      <button
                        className="orbit-button"
                        type="button"
                        onClick={() => {
                          emitActivationEvent(claim.workspaceId, params.get("returnTo") ? "continue_requested" : "open_board").catch(() => undefined);
                          chooseWorkspace(claim.workspaceId, recommendedPath);
                        }}
                      >
                        {params.get("returnTo") ? ACTION_LABELS.continueRequestedPage : ACTION_LABELS.goToBoard}
                      </button>
                      <button className="orbit-button orbit-button--ghost" type="button" onClick={() => chooseWorkspace(claim.workspaceId, "/app/sprint?mode=planning")}>
                        {ACTION_LABELS.goToSprint}
                      </button>
                      <button className="orbit-button orbit-button--ghost" type="button" onClick={() => chooseWorkspace(claim.workspaceId, "/app/inbox")}>
                        {ACTION_LABELS.goToInbox}
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

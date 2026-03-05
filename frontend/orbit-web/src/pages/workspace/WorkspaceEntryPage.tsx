import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { resolveReturnTo } from "@/lib/routing/restoreIntent";
import { useProjectStore } from "@/stores/projectStore";
import { useAuthStore } from "@/stores/authStore";
import { EmptyStateCard } from "@/components/common/EmptyStateCard";
import { getGuidedEmptyState } from "@/features/activation/emptyStateRegistry";
import { trackActivationEvent } from "@/lib/telemetry/activationEvents";

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

  function useWorkspaceAndNavigate(workspaceId: string, path: string) {
    setActiveWorkspace(workspaceId);
    navigate(path);
  }

  async function emitActivationEvent(action: string) {
    if (!activeWorkspaceId) {
      return;
    }
    await trackActivationEvent({
      workspaceId: activeWorkspaceId,
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

  function openWithCurrentWorkspace(path: string) {
    const targetWorkspaceId = activeWorkspaceId ?? claims[0]?.workspaceId;
    if (!targetWorkspaceId) {
      navigate(path);
      return;
    }
    useWorkspaceAndNavigate(targetWorkspaceId, path);
  }

  return (
    <section className="orbit-workspace-entry">
      <header className="orbit-workspace-entry__hero">
        <h2 style={{ margin: 0 }}>Select a workspace</h2>

        {loading && <p className="orbit-text-subtle">Loading workspace claims...</p>}
        {error && (
          <p role="alert" className="orbit-danger">
            {error}
          </p>
        )}
        {fallbackNotice && (
          <p role="status" className="orbit-text-subtle">
            {fallbackNotice}
          </p>
        )}

        <div className="orbit-workspace-entry__actions">
          <button className="orbit-button orbit-button--ghost" type="button" onClick={() => openWithCurrentWorkspace("/app/projects/board")}>
            Open Kanban
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={() => openWithCurrentWorkspace("/app/projects/timeline")}>
            Open Timeline
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={() => openWithCurrentWorkspace("/app/projects/table")}>
            Open Table
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={() => openWithCurrentWorkspace("/app/sprint")}>
            Open Sprint
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={() => openWithCurrentWorkspace("/app/inbox")}>
            Open Inbox
          </button>
          {params.get("returnTo") ? (
            <button className="orbit-button" type="button" onClick={() => openWithCurrentWorkspace(requestedPath)}>
              Continue Requested Page
            </button>
          ) : null}
        </div>
      </header>

      {!loading && !error && claims.length === 0 ? (
        <EmptyStateCard
          title={guided.title}
          description={guided.description}
          actions={[
            {
              label: guided.primaryAction.label,
              onClick: () => {
                emitActivationEvent("use_default_workspace").catch(() => undefined);
                openWithCurrentWorkspace(guided.primaryAction.path);
              }
            }
          ]}
        />
      ) : null}

      {!loading && !error && claims.length > 0 ? (
        <div className="orbit-workspace-entry__list">
          {claims.map((claim) => (
            <article key={claim.workspaceId} className="orbit-workspace-entry__claim orbit-animate-card">
              <div>
                <strong>{claim.workspaceName}</strong>
                <div className="orbit-workspace-entry__meta">Workspace scope ready</div>
              </div>
              <div className="orbit-workspace-entry__right">
                <div className="orbit-workspace-entry__meta" style={{ fontWeight: 700 }}>
                  {claim.role}
                </div>
                {claim.defaultWorkspace && (
                  <div className="orbit-workspace-entry__meta orbit-accent" style={{ textTransform: "uppercase" }}>
                    Default
                  </div>
                )}
                <div className="orbit-workspace-entry__buttons">
                  <button
                    className={`orbit-button ${activeWorkspaceId === claim.workspaceId ? "orbit-button--ghost" : ""}`}
                    type="button"
                    onClick={() => useWorkspaceAndNavigate(claim.workspaceId, "/app/projects/board")}
                  >
                    {activeWorkspaceId === claim.workspaceId ? "Open Board" : "Use & Open"}
                  </button>
                  <button className="orbit-button orbit-button--ghost" type="button" onClick={() => useWorkspaceAndNavigate(claim.workspaceId, "/app/projects/timeline")}>
                    Timeline
                  </button>
                  <button className="orbit-button orbit-button--ghost" type="button" onClick={() => useWorkspaceAndNavigate(claim.workspaceId, "/app/projects/table")}>
                    Table
                  </button>
                  <button className="orbit-button orbit-button--ghost" type="button" onClick={() => useWorkspaceAndNavigate(claim.workspaceId, "/app/sprint")}>
                    Sprint
                  </button>
                  {activeWorkspaceId === claim.workspaceId ? (
                    <button className="orbit-button orbit-button--ghost" type="button" onClick={() => useWorkspaceAndNavigate(claim.workspaceId, "/app/inbox")}>
                      Open Inbox
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

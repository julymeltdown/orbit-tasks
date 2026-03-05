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

type HubModule = {
  id: string;
  title: string;
  path: string;
  primaryLabel: string;
  secondaryPath: string;
  secondaryLabel: string;
  metricLabel: string;
  metricValue: string;
};

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

  const modules: HubModule[] = useMemo(() => {
    const activeCount = byStatus.IN_PROGRESS.length;
    const backlogCount = byStatus.TODO.length;
    const reviewCount = byStatus.REVIEW.length;
    const doneCount = byStatus.DONE.length;
    const inboxCount = Math.max(0, items.length - doneCount);

    return [
      {
        id: "kanban",
        title: "Board",
        path: "/app/projects/board",
        primaryLabel: "Open Board",
        secondaryPath: "/app/projects/table",
        secondaryLabel: "Open Table",
        metricLabel: "Backlog",
        metricValue: `${backlogCount}`
      },
      {
        id: "sprint",
        title: "Sprint",
        path: "/app/sprint",
        primaryLabel: "Open Sprint",
        secondaryPath: "/app/insights",
        secondaryLabel: "Open Insights",
        metricLabel: "In Progress",
        metricValue: `${activeCount}`
      },
      {
        id: "inbox",
        title: "Inbox",
        path: "/app/inbox",
        primaryLabel: "Open Inbox",
        secondaryPath: "/app/team",
        secondaryLabel: "Open Team",
        metricLabel: "Signals",
        metricValue: `${inboxCount}`
      },
      {
        id: "dashboard",
        title: "Dashboard",
        path: "/app/projects/dashboard",
        primaryLabel: "Open Dashboard",
        secondaryPath: "/app/projects/calendar",
        secondaryLabel: "Open Calendar",
        metricLabel: "Review",
        metricValue: `${reviewCount}`
      }
    ];
  }, [byStatus, items.length]);

  const isFirstSession = useMemo(() => {
    if (!activationState) {
      return true;
    }
    return activationState.activationStage === "NOT_STARTED" || activationState.activationStage === "FIRST_ACTION_DONE";
  }, [activationState]);

  const dashboardEmptyState = getGuidedEmptyState("DASHBOARD");

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
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Set up your first workflow in 60 seconds</h2>
            <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>
              Start with one task, then continue to board, sprint, and AI insights.
            </p>
          </div>
          <div className="orbit-ops-hub__workspace">
            <strong>{activeWorkspace?.workspaceName ?? "No workspace selected"}</strong>
            <span>{activeWorkspace?.role ?? "WORKSPACE_MEMBER"} · Scope ready</span>
            <button className="orbit-button orbit-button--ghost" type="button" onClick={() => navigate("/app/workspace/select")}>
              Change Workspace
            </button>
          </div>
        </div>

        <div className="orbit-ops-hub__actions orbit-ops-hub__actions--activation">
          <button
            className="orbit-button"
            type="button"
            onClick={() => {
              emitActivation("ACTIVATION_PRIMARY_CTA_CLICKED", { cta: "create_first_task" }).catch(() => undefined);
              ensureWorkspaceThenNavigate("/app/projects/board?create=1");
            }}
          >
            Create your first task
          </button>
          <button
            className="orbit-button orbit-button--ghost"
            type="button"
            onClick={() => {
              emitActivation("EMPTY_STATE_ACTION_CLICKED", { scope: "DASHBOARD", action: "import_tasks" }).catch(() => undefined);
              ensureWorkspaceThenNavigate("/app/integrations/import");
            }}
          >
            Import tasks
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={() => ensureWorkspaceThenNavigate("/app/team")}>Invite teammate</button>
        </div>
      </article>

      <div style={{ gridColumn: "span 4" }}>
        {activationState ? (
          <ActivationChecklist checklist={activationState.checklist} />
        ) : (
          <EmptyStateCard
            title="Preparing activation checklist"
            description="Loading your next-step checklist for this workspace and project."
            statusHint={loadingActivation ? "Syncing" : "Ready soon"}
            actions={[{ label: "Open Board", onClick: () => ensureWorkspaceThenNavigate("/app/projects/board"), variant: "ghost" }]}
          />
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ gridColumn: "span 12" }}>
          <EmptyStateCard
            title={dashboardEmptyState.title}
            description={dashboardEmptyState.description}
            actions={[
              {
                label: dashboardEmptyState.primaryAction.label,
                onClick: () => {
                  emitActivation("EMPTY_STATE_ACTION_CLICKED", { scope: "DASHBOARD", action: "open_board" }).catch(() => undefined);
                  ensureWorkspaceThenNavigate(dashboardEmptyState.primaryAction.path);
                }
              }
            ]}
            learnMoreHref="/app/insights"
            learnMoreLabel="How AI readiness works"
          />
        </div>
      ) : null}

      {(!isFirstSession || items.length > 0) &&
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

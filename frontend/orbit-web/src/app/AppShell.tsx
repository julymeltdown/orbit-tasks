import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { FloatingAgentWidget } from "@/components/insights/FloatingAgentWidget";
import { useFocusContainment } from "@/components/common/useFocusContainment";
import { HttpError, request } from "@/lib/http/client";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import type { Evaluation } from "@/features/workitems/types";
import { useEvaluationActions } from "@/features/insights/hooks/useEvaluationActions";
import {
  canAccessNavItem,
  projectViewNavigation,
  resolveScopeLabel,
  scopeNavigation
} from "@/app/navigationModel";

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const claims = useWorkspaceStore((state) => state.claims);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const loadClaims = useWorkspaceStore((state) => state.loadClaims);
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const { byStatus, items } = useWorkItems(projectId);
  const { submitAction } = useEvaluationActions();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useFocusContainment(mobileNavOpen);
  const [latestEvaluation, setLatestEvaluation] = useState<Evaluation | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadClaims().catch(() => undefined);
  }, [loadClaims]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

  const activeWorkspace = useMemo(() => {
    return claims.find((claim) => claim.workspaceId === activeWorkspaceId) ?? null;
  }, [claims, activeWorkspaceId]);

  const activeWorkspaceName = activeWorkspace?.workspaceName ?? "No Workspace";
  const activeRole = activeWorkspace?.role ?? null;
  const scopeLabel = resolveScopeLabel(location.pathname);
  const visibleScopeNav = useMemo(
    () => scopeNavigation.filter((item) => canAccessNavItem(activeRole, item)),
    [activeRole]
  );
  const showProjectViews = location.pathname.startsWith("/app/projects");
  const [query, setQuery] = useState("");
  const totalWorkItems = useMemo(() => items.filter((item) => item.status !== "ARCHIVED").length, [items]);
  const doneWorkItems = byStatus.DONE.length;
  const progressPercent = totalWorkItems > 0 ? Math.round((doneWorkItems / totalWorkItems) * 100) : 0;
  const topRisk = latestEvaluation?.topRisks[0] ?? null;
  const secondaryRisk = latestEvaluation?.topRisks[1] ?? null;

  const heroTitle = useMemo(() => {
    if (location.pathname.startsWith("/app/projects/board")) return "Cinematic Board";
    if (location.pathname.startsWith("/app/projects/timeline")) return "Timeline";
    if (location.pathname.startsWith("/app/projects/table")) return "Table";
    if (location.pathname.startsWith("/app/projects/calendar")) return "Calendar";
    if (location.pathname.startsWith("/app/projects/dashboard")) return "Dashboard";
    if (location.pathname.startsWith("/app/sprint")) return "Sprint Workspace";
    if (location.pathname.startsWith("/app/inbox")) return "Collaboration Inbox";
    return "Studio Pipeline";
  }, [location.pathname]);

  useEffect(() => {
    if (!activeWorkspaceId || !projectId) {
      setLatestEvaluation(null);
      setEvaluationError(null);
      return;
    }
    const controller = new AbortController();
    setEvaluationLoading(true);
    setEvaluationError(null);
    request<Evaluation>(
      `/api/v2/insights/evaluations/latest?workspaceId=${encodeURIComponent(activeWorkspaceId)}&projectId=${encodeURIComponent(projectId)}`,
      { signal: controller.signal }
    )
      .then((response) => {
        setLatestEvaluation(response);
      })
      .catch((error) => {
        if (error instanceof HttpError && error.status === 404) {
          setLatestEvaluation(null);
          return;
        }
        setEvaluationError(error instanceof Error ? error.message : "Failed to load latest evaluation");
      })
      .finally(() => {
        setEvaluationLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [activeWorkspaceId, projectId]);

  async function signOut() {
    try {
      await request<void>("/auth/logout", { method: "POST" });
    } catch {
      // Clear local session even when network logout fails.
    }
    clearSession();
    navigate("/login", { replace: true });
    setMobileNavOpen(false);
  }

  async function applyTopStrategy() {
    if (!latestEvaluation) {
      navigate("/app/insights");
      return;
    }
    setApplying(true);
    try {
      await submitAction({
        evaluationId: latestEvaluation.evaluationId,
        action: "accept",
        note: "Accepted from shell panel"
      });
      navigate("/app/insights");
    } catch {
      navigate("/app/insights");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="orbit-shell">
      <a href="#main-content" className="orbit-skip-link">
        Skip to content
      </a>

      <aside
        className={`orbit-shell__side${mobileNavOpen ? " is-open" : ""}`}
        id="orbit-side-nav"
        aria-label="Global navigation"
        ref={menuRef as any}
      >
        <div className="orbit-shell__brand">
          <div className="orbit-shell__brand-mark">
            <span className="material-symbols-outlined">orbit</span>
          </div>
          <div className="orbit-shell__brand-copy">
            <h2>Orbit</h2>
            <p>{scopeLabel}</p>
          </div>
        </div>

        <nav className="orbit-side-nav" aria-label="Scope navigation">
          {visibleScopeNav.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) => `orbit-side-link${isActive ? " is-active" : ""}`}
            >
              <span className="material-symbols-outlined orbit-side-link__icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {showProjectViews ? (
          <div className="orbit-side-subnav">
            <p className="orbit-side-subnav__title">Project Views</p>
            <div className="orbit-side-subnav__links">
              {projectViewNavigation.map((view) => (
                <NavLink
                  key={view.id}
                  to={view.to}
                  className={({ isActive }) => `orbit-side-link orbit-side-link--sub${isActive ? " is-active" : ""}`}
                >
                  <span className="material-symbols-outlined orbit-side-link__icon">{view.icon}</span>
                  <span>{view.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}

        <section className="orbit-shell__coach">
          <div className="orbit-shell__coach-head">
            <span className="material-symbols-outlined">auto_awesome</span>
            <span>AI Coach</span>
          </div>
          <p>
            {activeWorkspaceName}의 일정 흐름을 분석하고, 지연 가능성이 높은 작업부터 우선순위를 제안합니다.
          </p>
        </section>
      </aside>

      <header className="orbit-shell__top" role="banner">
        <div className="orbit-shell__top-left">
          <h1>{heroTitle}</h1>
          <label className="orbit-shell__search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks, threads, notes..."
              aria-label="Search"
            />
          </label>
        </div>

        <div className="orbit-shell__top-actions">
          <button
            className="orbit-button orbit-button--ghost orbit-mobile-menu-button"
            type="button"
            onClick={() => setMobileNavOpen((value) => !value)}
            aria-expanded={mobileNavOpen}
            aria-controls="orbit-side-nav"
          >
            <span className="material-symbols-outlined">{mobileNavOpen ? "close" : "menu"}</span>
            <span>{mobileNavOpen ? "Close" : "Menu"}</span>
          </button>

          <button className="orbit-button orbit-button--ghost orbit-workspace-pill" type="button" onClick={() => navigate("/app/workspace/select")} title="Select workspace">
            <span className="material-symbols-outlined">workspaces</span>
            <span>{activeWorkspaceName}</span>
          </button>
          <span className="orbit-shell__scope-label">{activeRole ?? "WORKSPACE_MEMBER"}</span>
          <ThemeToggleButton variant="shell" />
          <button className="orbit-button orbit-button--ghost" type="button" onClick={signOut}>
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
          <button className="orbit-button orbit-desktop-only" type="button" onClick={() => navigate("/app/projects/board")}>
            <span className="material-symbols-outlined">add</span>
            <span>New Task</span>
          </button>
        </div>
      </header>

      <main id="main-content" className="orbit-shell__content" role="main" tabIndex={-1}>
        <Outlet />
      </main>

      <aside className="orbit-shell__rail" aria-label="Project health">
        <header className="orbit-shell__rail-head">
          <h3>
            <span className="material-symbols-outlined">analytics</span>
            <span>Project Health</span>
          </h3>
        </header>
        <div className="orbit-shell__rail-body">
          <article className="orbit-shell__rail-widget">
            <div className="orbit-shell__rail-row">
              <span>Overall Progress</span>
              <strong>{progressPercent}%</strong>
            </div>
            <div className="orbit-shell__progress">
              <span style={{ width: `${progressPercent}%` }} />
            </div>
          </article>

          <article className="orbit-shell__rail-widget">
            <p className="orbit-shell__rail-eyebrow">AI Coaching Summary</p>
            {evaluationLoading ? <p>Loading latest evaluation...</p> : null}
            {!evaluationLoading && evaluationError ? <p>{evaluationError}</p> : null}
            {!evaluationLoading && !evaluationError && topRisk ? (
              <>
                <h4>{topRisk.summary}</h4>
                <p>{topRisk.recommendedActions?.[0] ?? topRisk.impact}</p>
                <button className="orbit-link-button orbit-link-button--tab" type="button" onClick={applyTopStrategy} disabled={applying}>
                  {applying ? "Applying..." : "Apply Strategy"}
                </button>
              </>
            ) : null}
            {!evaluationLoading && !evaluationError && !topRisk ? (
              <>
                <h4>No Evaluation Yet</h4>
                <p>Run the AI evaluation first, then latest guidance will appear here.</p>
                <button className="orbit-link-button orbit-link-button--tab" type="button" onClick={() => navigate("/app/insights")}>
                  Open Insights
                </button>
              </>
            ) : null}
          </article>

          <article className="orbit-shell__rail-widget orbit-shell__rail-widget--warn">
            <h4>{secondaryRisk?.summary ?? "No Secondary Risk"}</h4>
            <p>{secondaryRisk?.impact ?? "Additional risk signals will appear after new evaluations run."}</p>
          </article>
        </div>
      </aside>

      <FloatingAgentWidget />
    </div>
  );
}

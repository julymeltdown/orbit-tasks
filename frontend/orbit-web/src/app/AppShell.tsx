import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { FloatingAgentWidget } from "@/components/insights/FloatingAgentWidget";
import { useFocusContainment } from "@/components/common/useFocusContainment";
import { HttpError, request } from "@/lib/http/client";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useActivationStore } from "@/stores/activationStore";
import { useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import type { Evaluation } from "@/features/workitems/types";
import { useEvaluationActions } from "@/features/insights/hooks/useEvaluationActions";
import { useActiveSprint } from "@/features/agile/hooks/useActiveSprint";
import { fetchDsuReminder, type DsuReminder } from "@/features/agile/hooks/useDsuReminder";
import { useActivation } from "@/features/activation/hooks/useActivation";
import { featureFlags } from "@/lib/config/featureFlags";
import { hashActivationUserId, trackActivationEvent } from "@/lib/telemetry/activationEvents";
import { resolveGuidanceStatus } from "@/features/insights/aiGuidanceStatus";
import { deriveInsightSignals } from "@/features/insights/insightSignals";
import {
  canAccessNavItem,
  projectViewNavigation,
  resolveScopeLabel,
  scopeNavigation,
  splitScopeNavigationByTier
} from "@/app/navigationModel";

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const userId = useAuthStore((state) => state.userId) ?? "member@orbit.local";
  const activationUserId = useMemo(() => hashActivationUserId(userId), [userId]);
  const claims = useWorkspaceStore((state) => state.claims);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const loadClaims = useWorkspaceStore((state) => state.loadClaims);
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const { getState: getActivationState } = useActivation();
  const activationState = useActivationStore((state) =>
    activeWorkspaceId ? state.getStateForScope(activeWorkspaceId, projectId, activationUserId) : null
  );
  const setActivationState = useActivationStore((state) => state.setState);
  const advancedExpanded = useActivationStore((state) =>
    state.isAdvancedExpanded(activeWorkspaceId ?? "workspace-missing", projectId, activationUserId)
  );
  const setAdvancedExpanded = useActivationStore((state) => state.setAdvancedExpanded);
  const { byStatus, items } = useWorkItems(projectId);
  const { activeSprint } = useActiveSprint(activeWorkspaceId, projectId);
  const { submitAction } = useEvaluationActions();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useFocusContainment(mobileNavOpen);
  const [latestEvaluation, setLatestEvaluation] = useState<Evaluation | null>(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [dsuReminder, setDsuReminder] = useState<DsuReminder | null>(null);
  const [activationLoading, setActivationLoading] = useState(false);

  useEffect(() => {
    loadClaims().catch(() => undefined);
  }, [loadClaims]);

  useEffect(() => {
    if (!featureFlags.activationUiV1 || !activeWorkspaceId || !projectId || !activationUserId) {
      return;
    }
    let cancelled = false;
    setActivationLoading(true);
    getActivationState(activeWorkspaceId, projectId, activationUserId)
      .then((response) => {
        if (!cancelled && response) {
          setActivationState(response);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setActivationLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activationUserId, activeWorkspaceId, getActivationState, projectId, setActivationState]);

  useEffect(() => {
    if (!featureFlags.activationUiV1 || !activeWorkspaceId || !projectId) {
      return;
    }
    trackActivationEvent({
      workspaceId: activeWorkspaceId,
      projectId,
      userId,
      eventType: "ACTIVATION_VIEW_LOADED",
      route: `${location.pathname}${location.search}`
    }).catch(() => undefined);
  }, [activeWorkspaceId, location.pathname, location.search, projectId, userId]);

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
  const navProfile = activationState?.navigationProfile ?? "NOVICE";
  const splitScopeNav = useMemo(() => splitScopeNavigationByTier(visibleScopeNav), [visibleScopeNav]);
  const visibleCoreNav = splitScopeNav.core;
  const visibleAdvancedNav = splitScopeNav.advanced;
  const advancedNavVisible = navProfile === "ADVANCED" || advancedExpanded;
  const showProjectViews = location.pathname.startsWith("/app/projects");
  const [query, setQuery] = useState("");
  const totalWorkItems = useMemo(() => items.filter((item) => item.status !== "ARCHIVED").length, [items]);
  const doneWorkItems = byStatus.DONE.length;
  const progressPercent = totalWorkItems > 0 ? Math.round((doneWorkItems / totalWorkItems) * 100) : 0;
  const insightSignals = useMemo(() => deriveInsightSignals(items, activeSprint?.capacitySp), [items, activeSprint?.capacitySp]);
  const topRisk = latestEvaluation?.topRisks[0] ?? null;
  const secondaryRisk = latestEvaluation?.topRisks[1] ?? null;
  const guidanceStatus = useMemo(
    () =>
      resolveGuidanceStatus(
        latestEvaluation,
        totalWorkItems > 0
          ? `현재 ${insightSignals.remainingStoryPoints}SP / 블로커 ${insightSignals.blockedCount}개 상태입니다.`
          : "보드에서 작업을 생성하면 AI 평가 카드가 자동으로 활성화됩니다."
      ),
    [insightSignals.blockedCount, insightSignals.remainingStoryPoints, latestEvaluation, totalWorkItems]
  );

  const heroTitle = useMemo(() => {
    if (location.pathname.startsWith("/app/projects/board")) return "Cinematic Board";
    if (location.pathname.startsWith("/app/projects/timeline")) return "Timeline";
    if (location.pathname.startsWith("/app/projects/table")) return "Table";
    if (location.pathname.startsWith("/app/projects/calendar")) return "Calendar";
    if (location.pathname.startsWith("/app/projects/dashboard")) return "Dashboard";
    if (location.pathname.startsWith("/app/sprint")) return "Sprint Workspace";
    if (location.pathname.startsWith("/app/inbox")) return "Collaboration Inbox";
    return activeWorkspaceName ? `${activeWorkspaceName} Workspace` : "Workspace";
  }, [activeWorkspaceName, location.pathname]);

  const sidebarCoachMessage = useMemo(() => {
    if (topRisk) {
      return topRisk.recommendedActions?.[0] ?? topRisk.impact;
    }
    if (insightSignals.remainingStoryPoints === 0) {
      return "작업을 생성하면 AI가 일정 흐름과 리스크를 분석합니다.";
    }
    return `남은 ${insightSignals.remainingStoryPoints}SP, 블로커 ${insightSignals.blockedCount}개를 기준으로 평가를 실행하세요.`;
  }, [insightSignals.blockedCount, insightSignals.remainingStoryPoints, topRisk]);

  const secondaryRiskSummary = useMemo(() => {
    if (secondaryRisk) {
      return secondaryRisk.impact;
    }
    if (insightSignals.atRiskCount > 0) {
      return `현재 위험 신호 ${insightSignals.atRiskCount}개가 감지되었습니다. Insights에서 상세 평가를 실행하세요.`;
    }
    if (insightSignals.remainingStoryPoints === 0) {
      return "추가 작업 데이터가 쌓이면 보조 리스크 신호가 자동으로 표시됩니다.";
    }
    return "보조 리스크는 최신 평가 이후 자동 표시됩니다.";
  }, [insightSignals.atRiskCount, insightSignals.remainingStoryPoints, secondaryRisk]);

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

  useEffect(() => {
    if (!activeWorkspaceId || !projectId || !userId) {
      setDsuReminder(null);
      return;
    }
    const controller = new AbortController();
    fetchDsuReminder(activeWorkspaceId, projectId, userId)
      .then((response) => {
        setDsuReminder(response);
      })
      .catch(() => {
        setDsuReminder(null);
      });
    return () => {
      controller.abort();
    };
  }, [activeWorkspaceId, projectId, userId, location.pathname]);

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
          {visibleCoreNav.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) => `orbit-side-link${isActive ? " is-active" : ""}`}
            >
              <span className="material-symbols-outlined orbit-side-link__icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          {visibleAdvancedNav.length > 0 ? (
            <button
              className="orbit-side-link orbit-side-link--more"
              type="button"
              onClick={() =>
                setAdvancedExpanded(
                  activeWorkspaceId ?? "workspace-missing",
                  projectId,
                  activationUserId,
                  !advancedNavVisible
                )
              }
            >
              <span className="material-symbols-outlined orbit-side-link__icon">
                {advancedNavVisible ? "expand_less" : "expand_more"}
              </span>
              <span>{advancedNavVisible ? "Hide Advanced" : "More"}</span>
            </button>
          ) : null}
        </nav>

        {advancedNavVisible && visibleAdvancedNav.length > 0 ? (
          <nav className="orbit-side-nav orbit-side-nav--advanced" aria-label="Advanced navigation">
            {visibleAdvancedNav.map((item) => (
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
        ) : null}

        {activationLoading ? <p className="orbit-shell__activation-loading">Loading activation...</p> : null}

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
          <p>{sidebarCoachMessage}</p>
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
          {navProfile === "ADVANCED" || dsuReminder?.pending ? (
            <button className="orbit-button orbit-button--ghost orbit-desktop-only" type="button" onClick={() => navigate("/app/sprint#dsu")}>
              <span className="material-symbols-outlined">event_note</span>
              <span>DSU</span>
              {dsuReminder?.pending ? <span className="orbit-notice-badge">!</span> : null}
            </button>
          ) : null}
          {navProfile === "ADVANCED" ? (
            <button className="orbit-button orbit-desktop-only" type="button" onClick={() => navigate("/app/projects/board?create=1")}>
              <span className="material-symbols-outlined">add</span>
              <span>New Task</span>
            </button>
          ) : null}
        </div>
      </header>

      <main id="main-content" className="orbit-shell__content" role="main" tabIndex={-1}>
        {dsuReminder?.pending ? (
          <section className="orbit-dsu-reminder">
            <div>
              <strong>{dsuReminder.title}</strong>
              <p>{dsuReminder.message}</p>
            </div>
            <div className="orbit-dsu-reminder__actions">
              <button className="orbit-button orbit-button--ghost" type="button" onClick={() => navigate("/app/inbox")}>
                Inbox
              </button>
              <button className="orbit-button" type="button" onClick={() => navigate(dsuReminder.actionPath || "/app/sprint")}>
                DSU 입력하기
              </button>
            </div>
          </section>
        ) : null}
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
                <p>{guidanceStatus.summaryLabel}</p>
                <p className="orbit-shell__rail-meta">
                  {guidanceStatus.reasonLabel} · {guidanceStatus.confidenceLabel}
                </p>
                <button className="orbit-link-button orbit-link-button--tab" type="button" onClick={applyTopStrategy} disabled={applying}>
                  {applying ? "Applying..." : "Apply Strategy"}
                </button>
              </>
            ) : null}
            {!evaluationLoading && !evaluationError && !topRisk ? (
              <>
                <h4>{guidanceStatus.state === "not_run" ? "Evaluation Pending" : guidanceStatus.stateLabel}</h4>
                <p>{guidanceStatus.summaryLabel}</p>
                <p className="orbit-shell__rail-meta">
                  {guidanceStatus.reasonLabel} · {guidanceStatus.confidenceLabel}
                </p>
                <button className="orbit-link-button orbit-link-button--tab" type="button" onClick={() => navigate("/app/insights")}>
                  Run Evaluation
                </button>
              </>
            ) : null}
          </article>

          <article className="orbit-shell__rail-widget orbit-shell__rail-widget--warn">
            <h4>{secondaryRisk?.summary ?? "Secondary Signal"}</h4>
            <p>{secondaryRiskSummary}</p>
          </article>
        </div>
      </aside>

      <FloatingAgentWidget />
    </div>
  );
}

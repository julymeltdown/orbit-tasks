import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { FloatingAgentWidget } from "@/components/insights/FloatingAgentWidget";
import { useFocusContainment } from "@/components/common/useFocusContainment";
import { request } from "@/lib/http/client";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useFocusContainment(mobileNavOpen);

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

  return (
    <div className="orbit-shell">
      <a href="#main-content" className="orbit-skip-link">
        Skip to content
      </a>

      <header className="orbit-shell__top" role="banner">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <strong style={{ fontSize: 20, letterSpacing: "-0.03em" }}>ORBIT</strong>
          <span className="orbit-neon-line" />
          <button
            className="orbit-button orbit-button--ghost orbit-workspace-pill"
            type="button"
            onClick={() => navigate("/app/workspace/select")}
            title="Select workspace"
          >
            {activeWorkspaceName}
          </button>
          <span className="orbit-shell__scope-label">{scopeLabel}</span>
        </div>

        <div className="orbit-shell__top-actions">
          <button
            className="orbit-button orbit-button--ghost orbit-mobile-menu-button"
            type="button"
            onClick={() => setMobileNavOpen((value) => !value)}
            aria-expanded={mobileNavOpen}
            aria-controls="orbit-side-nav"
          >
            {mobileNavOpen ? "Close" : "Menu"}
          </button>

          <ThemeToggleButton variant="shell" />
          <button className="orbit-button orbit-button--ghost" type="button" onClick={signOut}>
            Sign Out
          </button>
          <button className="orbit-button orbit-desktop-only" type="button" onClick={() => navigate("/app/projects/board")}>
            New Work Item
          </button>
        </div>
      </header>

      <aside
        className={`orbit-shell__side${mobileNavOpen ? " is-open" : ""}`}
        id="orbit-side-nav"
        aria-label="Global navigation"
        ref={menuRef as any}
      >
        <nav className="orbit-side-nav" aria-label="Scope navigation">
          {visibleScopeNav.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              className={({ isActive }) => `orbit-side-link${isActive ? " is-active" : ""}`}
            >
              {item.label}
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
                  {view.label}
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}
      </aside>

      <main id="main-content" className="orbit-shell__content" role="main" tabIndex={-1}>
        <Outlet />
      </main>

      <FloatingAgentWidget />
    </div>
  );
}

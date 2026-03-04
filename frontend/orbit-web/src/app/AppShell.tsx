import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { FloatingAgentWidget } from "@/components/insights/FloatingAgentWidget";
import { request } from "@/lib/http/client";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

const topNavItems = [
  { to: "/app", label: "Home" },
  { to: "/app/projects/board", label: "Work" },
  { to: "/app/sprint", label: "Sprint" },
  { to: "/app/inbox", label: "Collab" },
  { to: "/app/portfolio", label: "Portfolio" },
  { to: "/app/profile", label: "Settings" }
];

const groupedSecondaryNav = {
  Home: [{ to: "/app/workspace/select", label: "Workspace" }],
  Work: [
    { to: "/app/projects/board", label: "Board" },
    { to: "/app/projects/timeline", label: "Timeline" },
    { to: "/app/projects/table", label: "Table" }
  ],
  Sprint: [
    { to: "/app/sprint", label: "Sprint" },
    { to: "/app/insights", label: "Insights" }
  ],
  Collab: [
    { to: "/app/inbox", label: "Inbox" },
    { to: "/app/team", label: "Teams" }
  ],
  Portfolio: [{ to: "/app/portfolio", label: "Overview" }],
  Settings: [
    { to: "/app/profile", label: "Profile" },
    { to: "/app/admin/compliance", label: "Admin" },
    { to: "/app/integrations/import", label: "Integrations" },
    { to: "/app/workspace/select", label: "Workspace" }
  ]
} as const;

const legacyDirectLinks = [
  { to: "/app", label: "Overview" },
  { to: "/app/projects/board", label: "Work" },
  { to: "/app/sprint", label: "Sprint" },
  { to: "/app/inbox", label: "Collab" },
  { to: "/app/portfolio", label: "Portfolio" },
  { to: "/app/profile", label: "Settings" }
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const claims = useWorkspaceStore((state) => state.claims);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const loadClaims = useWorkspaceStore((state) => state.loadClaims);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    loadClaims().catch(() => undefined);
  }, [loadClaims]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

  const activeWorkspaceName = useMemo(() => {
    return claims.find((claim) => claim.workspaceId === activeWorkspaceId)?.workspaceName ?? "No Workspace";
  }, [claims, activeWorkspaceId]);

  const activeGroup = useMemo(() => {
    const pathname = location.pathname;
    if (pathname.startsWith("/app/projects")) return "Work";
    if (pathname.startsWith("/app/sprint") || pathname.startsWith("/app/insights")) return "Sprint";
    if (pathname.startsWith("/app/inbox") || pathname.startsWith("/app/team")) return "Collab";
    if (pathname.startsWith("/app/portfolio")) return "Portfolio";
    if (
      pathname.startsWith("/app/profile") ||
      pathname.startsWith("/app/admin") ||
      pathname.startsWith("/app/integrations") ||
      pathname.startsWith("/app/workspace")
    ) {
      return "Settings";
    }
    return "Home";
  }, [location.pathname]);

  const secondaryNav = groupedSecondaryNav[activeGroup];

  async function signOut() {
    try {
      await request<void>("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout network failures and clear local session regardless.
    }
    clearSession();
    navigate("/login", { replace: true });
    setMobileNavOpen(false);
  }

  return (
    <div className="orbit-shell">
      <header className="orbit-shell__top">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
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

          <div className="orbit-mobile-actions">
            <ThemeToggleButton variant="shell" />
            <button className="orbit-button orbit-button--ghost" type="button" onClick={signOut}>
              Out
            </button>
          </div>

          <div className="orbit-desktop-actions">
            <ThemeToggleButton variant="shell" />
            <button className="orbit-button orbit-button--ghost" type="button" onClick={signOut}>
              Sign Out
            </button>
            <button className="orbit-button" type="button" onClick={() => navigate("/app/projects/table")}>
              New Work Item
            </button>
          </div>
        </div>
      </header>

      <aside className={`orbit-shell__side${mobileNavOpen ? " is-open" : ""}`}>
        <div className="orbit-mobile-side-actions">
          <ThemeToggleButton variant="shell" />
          <button className="orbit-button orbit-button--ghost" type="button" onClick={signOut}>
            Sign Out
          </button>
        </div>

        <nav id="orbit-side-nav" className="orbit-side-nav" aria-label="Primary navigation">
          {topNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `orbit-side-link${isActive ? " is-active" : ""}`}
              onClick={() => setMobileNavOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="orbit-side-subnav">
          <p className="orbit-side-subnav__title">{activeGroup}</p>
          <div className="orbit-side-subnav__links">
            {secondaryNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `orbit-side-link orbit-side-link--sub${isActive ? " is-active" : ""}`}
                onClick={() => setMobileNavOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </aside>

      <main className="orbit-shell__content">
        <Outlet />
      </main>

      <aside className="orbit-shell__rail">
        <div className="orbit-panel" style={{ padding: 14 }}>
          <p style={{ marginTop: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Orbit Intelligence
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.5, color: "var(--orbit-text-subtle)" }}>
            Real-time schedule health, mention heat, and deep-link activity are streamed here.
          </p>
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {legacyDirectLinks.map((item) => (
              <NavLink key={item.to} to={item.to} className="orbit-link-button" style={{ fontSize: 10, padding: "8px 10px" }}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </aside>
      <FloatingAgentWidget />
    </div>
  );
}

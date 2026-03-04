import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { request } from "@/lib/http/client";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { to: "/app", label: "Overview" },
  { to: "/app/workspace/select", label: "Workspace" },
  { to: "/app/projects/board", label: "Board" },
  { to: "/app/projects/timeline", label: "Timeline" },
  { to: "/app/projects/table", label: "Table" },
  { to: "/app/sprint", label: "Sprint" },
  { to: "/app/insights", label: "Insights" },
  { to: "/app/portfolio", label: "Portfolio" },
  { to: "/app/admin/compliance", label: "Admin" },
  { to: "/app/integrations/import", label: "Integrations" },
  { to: "/app/team", label: "Teams" },
  { to: "/app/profile", label: "Profile" },
  { to: "/app/inbox", label: "Inbox" }
];

export function AppShell() {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);

  async function signOut() {
    try {
      await request<void>("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout network failures and clear local session regardless.
    }
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="orbit-shell">
      <header className="orbit-shell__top">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <strong style={{ fontSize: 20, letterSpacing: "-0.03em" }}>ORBIT</strong>
          <span className="orbit-neon-line" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggleButton variant="shell" />
          <button className="orbit-button orbit-button--ghost" type="button" onClick={signOut}>
            Sign Out
          </button>
          <button className="orbit-button" type="button">
            New Work Item
          </button>
        </div>
      </header>

      <aside className="orbit-shell__side">
        <nav className="orbit-side-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `orbit-side-link${isActive ? " is-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
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
        </div>
      </aside>
    </div>
  );
}

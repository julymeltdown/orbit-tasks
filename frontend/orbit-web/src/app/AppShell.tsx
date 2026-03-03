import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Overview" },
  { to: "/workspace/select", label: "Workspace" },
  { to: "/projects/board", label: "Board" },
  { to: "/projects/timeline", label: "Timeline" },
  { to: "/projects/table", label: "Table" },
  { to: "/sprint", label: "Sprint" },
  { to: "/team", label: "Teams" },
  { to: "/profile", label: "Profile" },
  { to: "/inbox", label: "Inbox" }
];

export function AppShell() {
  return (
    <div className="orbit-shell">
      <header className="orbit-shell__top">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <strong style={{ fontSize: 20, letterSpacing: "-0.03em" }}>ORBIT</strong>
          <span className="orbit-neon-line" />
        </div>
        <button className="orbit-button" type="button">
          New Work Item
        </button>
      </header>

      <aside className="orbit-shell__side">
        <nav style={{ display: "grid", gap: 4, padding: "0 10px" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                textDecoration: "none",
                color: "var(--orbit-text)",
                fontWeight: isActive ? 800 : 600,
                border: "1px solid var(--orbit-border)",
                padding: "12px 10px",
                background: isActive ? "var(--orbit-surface-3)" : "var(--orbit-surface-1)"
              })}
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

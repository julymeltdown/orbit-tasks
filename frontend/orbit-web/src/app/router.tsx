import type { ReactNode } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";

function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem("orbit.session.accessToken"));
}

function RequireAuth({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    const returnTo = window.location.pathname + window.location.search;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
  return <>{children}</>;
}

function LoginPage() {
  return (
    <div style={{ maxWidth: 420, margin: "12vh auto", padding: 24 }} className="orbit-panel">
      <h1 className="orbit-heading-xl">Login</h1>
      <p style={{ color: "var(--orbit-text-subtle)" }}>Sign in to access workspace scope.</p>
    </div>
  );
}

function WorkspaceEntryPage() {
  return (
    <div className="orbit-card" style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>Workspace Entry</h2>
      <p style={{ color: "var(--orbit-text-subtle)" }}>
        Select available workspace after authentication and claim validation.
      </p>
    </div>
  );
}

function OverviewPage() {
  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 8", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Schedule Operations</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          Responsive board/timeline/calendar surfaces are attached in later user story phases.
        </p>
      </article>
      <article className="orbit-card" style={{ gridColumn: "span 4", padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Health</h3>
        <p style={{ fontSize: 40, fontWeight: 900, margin: "6px 0 0" }}>94%</p>
      </article>
    </section>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="orbit-card" style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p style={{ color: "var(--orbit-text-subtle)" }}>Implemented in subsequent story phase.</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: "workspace/select", element: <WorkspaceEntryPage /> },
      { path: "profile", element: <PlaceholderPage title="Profile Settings" /> },
      { path: "inbox", element: <PlaceholderPage title="Notification Inbox" /> }
    ]
  }
]);

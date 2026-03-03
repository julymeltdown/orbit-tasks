import type { ReactNode } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { LoginPage } from "@/pages/auth/LoginPage";
import { BoardPage } from "@/pages/projects/BoardPage";
import { TablePage } from "@/pages/projects/TablePage";
import { TimelinePage } from "@/pages/projects/TimelinePage";
import { ProfileSettingsPage } from "@/pages/profile/ProfileSettingsPage";
import { TeamManagementPage } from "@/pages/team/TeamManagementPage";
import { WorkspaceEntryPage } from "@/pages/workspace/WorkspaceEntryPage";
import { SprintWorkspacePage } from "@/pages/sprint/SprintWorkspacePage";
import { InboxPage } from "@/pages/inbox/InboxPage";
import { DeepLinkResolverPage } from "@/pages/deeplink/DeepLinkResolverPage";
import { ScheduleInsightsPage } from "@/pages/insights/ScheduleInsightsPage";

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
    path: "/dl/:token",
    element: <DeepLinkResolverPage />
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
      { path: "projects/board", element: <BoardPage /> },
      { path: "projects/timeline", element: <TimelinePage /> },
      { path: "projects/table", element: <TablePage /> },
      { path: "sprint", element: <SprintWorkspacePage /> },
      { path: "insights", element: <ScheduleInsightsPage /> },
      { path: "profile", element: <ProfileSettingsPage /> },
      { path: "team", element: <TeamManagementPage /> },
      { path: "inbox", element: <InboxPage /> }
    ]
  }
]);

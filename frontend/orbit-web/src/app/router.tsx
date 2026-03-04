import React, { type ReactNode } from "react";
import { Navigate, createBrowserRouter, useLocation } from "react-router-dom";
import { AppShell } from "./AppShell";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupEmailPage } from "@/pages/auth/SignupEmailPage";
import { SignupPasswordPage } from "@/pages/auth/SignupPasswordPage";
import { VerifyEmailPage } from "@/pages/auth/VerifyEmailPage";
import { ProfileOnboardingPage } from "@/pages/onboarding/ProfileOnboardingPage";
import { LandingPage } from "@/pages/public/LandingPage";
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
import { PortfolioOverviewPage } from "@/pages/portfolio/PortfolioOverviewPage";
import { ComplianceDashboardPage } from "@/pages/admin/ComplianceDashboardPage";
import { ImportWizardPage } from "@/pages/integrations/ImportWizardPage";
import { OperationsHubPage } from "@/pages/overview/OperationsHubPage";
import { fetchProfileCompletion } from "@/lib/auth/profileCompletion";
import { useAuthStore } from "@/stores/authStore";

function SessionLoading() {
  return (
    <div className="orbit-panel" style={{ maxWidth: 560, margin: "18vh auto", padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Loading Session</h2>
      <p style={{ color: "var(--orbit-text-subtle)", marginBottom: 0 }}>
        인증 상태를 확인하는 중입니다.
      </p>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { hydrated, accessToken } = useAuthStore();

  if (!hydrated) {
    return <SessionLoading />;
  }

  if (!accessToken) {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <>{children}</>;
}

function RequireProfileCompletion({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { accessToken } = useAuthStore();
  const [checking, setChecking] = React.useState(true);
  const [complete, setComplete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!accessToken) {
      setChecking(false);
      setComplete(false);
      return;
    }

    setChecking(true);
    setError(null);

    fetchProfileCompletion()
      .then((result) => {
        setComplete(result.complete);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to validate profile");
        setComplete(false);
      })
      .finally(() => {
        setChecking(false);
      });
  }, [accessToken, location.pathname, location.search]);

  if (checking) {
    return <SessionLoading />;
  }

  if (error) {
    return (
      <div className="orbit-panel" style={{ maxWidth: 560, margin: "18vh auto", padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Profile Validation Failed</h2>
        <p style={{ color: "var(--orbit-danger)", marginBottom: 0 }}>{error}</p>
      </div>
    );
  }

  if (!complete) {
    const returnTo = location.pathname + location.search;
    return <Navigate to={`/onboarding/profile?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <>{children}</>;
}

function LegacyRedirect({ to }: { to: string }) {
  return <Navigate replace to={to} />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/auth/login",
    element: <LegacyRedirect to="/login" />
  },
  {
    path: "/signup",
    element: <SignupEmailPage />
  },
  {
    path: "/auth/signup",
    element: <LegacyRedirect to="/signup" />
  },
  {
    path: "/signup/password",
    element: <SignupPasswordPage />
  },
  {
    path: "/auth/signup/password",
    element: <LegacyRedirect to="/signup/password" />
  },
  {
    path: "/verify",
    element: <VerifyEmailPage />
  },
  {
    path: "/auth/verify",
    element: <LegacyRedirect to="/verify" />
  },
  {
    path: "/dl/:token",
    element: <DeepLinkResolverPage />
  },
  {
    path: "/onboarding/profile",
    element: (
      <RequireAuth>
        <ProfileOnboardingPage />
      </RequireAuth>
    )
  },
  {
    path: "/app",
    element: (
      <RequireAuth>
        <RequireProfileCompletion>
          <AppShell />
        </RequireProfileCompletion>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <OperationsHubPage /> },
      { path: "workspace/select", element: <WorkspaceEntryPage /> },
      { path: "projects/board", element: <BoardPage /> },
      { path: "projects/timeline", element: <TimelinePage /> },
      { path: "projects/table", element: <TablePage /> },
      { path: "sprint", element: <SprintWorkspacePage /> },
      { path: "insights", element: <ScheduleInsightsPage /> },
      { path: "portfolio", element: <PortfolioOverviewPage /> },
      { path: "admin/compliance", element: <ComplianceDashboardPage /> },
      { path: "integrations/import", element: <ImportWizardPage /> },
      { path: "profile", element: <ProfileSettingsPage /> },
      { path: "team", element: <TeamManagementPage /> },
      { path: "inbox", element: <InboxPage /> }
    ]
  },
  {
    path: "/workspace/select",
    element: <LegacyRedirect to="/app/workspace/select" />
  },
  {
    path: "/home",
    element: <LegacyRedirect to="/app" />
  },
  {
    path: "/projects/board",
    element: <LegacyRedirect to="/app/projects/board" />
  },
  {
    path: "/projects/timeline",
    element: <LegacyRedirect to="/app/projects/timeline" />
  },
  {
    path: "/projects/table",
    element: <LegacyRedirect to="/app/projects/table" />
  },
  {
    path: "/sprint",
    element: <LegacyRedirect to="/app/sprint" />
  },
  {
    path: "/insights",
    element: <LegacyRedirect to="/app/insights" />
  },
  {
    path: "/portfolio",
    element: <LegacyRedirect to="/app/portfolio" />
  },
  {
    path: "/admin/compliance",
    element: <LegacyRedirect to="/app/admin/compliance" />
  },
  {
    path: "/integrations/import",
    element: <LegacyRedirect to="/app/integrations/import" />
  },
  {
    path: "/team",
    element: <LegacyRedirect to="/app/team" />
  },
  {
    path: "/profile",
    element: <LegacyRedirect to="/app/profile" />
  },
  {
    path: "/inbox",
    element: <LegacyRedirect to="/app/inbox" />
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);

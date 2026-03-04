export type ScopeNavSection = "my-work" | "workspaces" | "portfolio" | "insights" | "integrations" | "admin";

export interface ScopeNavItem {
  id: ScopeNavSection;
  label: string;
  to: string;
  minRole?: "WORKSPACE_MEMBER" | "WORKSPACE_MANAGER" | "WORKSPACE_ADMIN";
}

export type ProjectViewType = "board" | "table" | "timeline" | "calendar" | "dashboard";

export interface ProjectViewItem {
  id: ProjectViewType;
  label: string;
  to: string;
}

const ROLE_WEIGHT: Record<string, number> = {
  WORKSPACE_MEMBER: 1,
  WORKSPACE_MANAGER: 2,
  WORKSPACE_ADMIN: 3
};

export const scopeNavigation: ScopeNavItem[] = [
  { id: "my-work", label: "My Work", to: "/app" },
  { id: "workspaces", label: "Workspaces", to: "/app/workspace/select" },
  { id: "portfolio", label: "Portfolio", to: "/app/portfolio", minRole: "WORKSPACE_MANAGER" },
  { id: "insights", label: "Insights", to: "/app/insights" },
  { id: "integrations", label: "Integrations", to: "/app/integrations/import", minRole: "WORKSPACE_MANAGER" },
  { id: "admin", label: "Admin", to: "/app/admin/compliance", minRole: "WORKSPACE_ADMIN" }
];

export const projectViewNavigation: ProjectViewItem[] = [
  { id: "board", label: "Board", to: "/app/projects/board" },
  { id: "table", label: "Table", to: "/app/projects/table" },
  { id: "timeline", label: "Timeline", to: "/app/projects/timeline" },
  { id: "calendar", label: "Calendar", to: "/app/projects/calendar" },
  { id: "dashboard", label: "Dashboard", to: "/app/projects/dashboard" }
];

export function canAccessNavItem(role: string | null | undefined, item: ScopeNavItem): boolean {
  if (!item.minRole) {
    return true;
  }
  const current = ROLE_WEIGHT[role ?? ""] ?? 0;
  const required = ROLE_WEIGHT[item.minRole] ?? 0;
  return current >= required;
}

export function resolveScopeLabel(pathname: string): string {
  if (pathname.startsWith("/app/projects")) {
    return "Project";
  }
  if (pathname.startsWith("/app/sprint")) {
    return "Sprint";
  }
  if (pathname.startsWith("/app/inbox")) {
    return "Inbox";
  }
  if (pathname.startsWith("/app/portfolio")) {
    return "Portfolio";
  }
  if (pathname.startsWith("/app/admin")) {
    return "Admin";
  }
  if (pathname.startsWith("/app/insights")) {
    return "Insights";
  }
  if (pathname.startsWith("/app/integrations")) {
    return "Integrations";
  }
  if (pathname.startsWith("/app/workspace")) {
    return "Workspace";
  }
  return "My Work";
}


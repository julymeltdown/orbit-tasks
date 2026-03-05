export type ScopeNavSection = "my-work" | "sprint" | "inbox" | "workspaces" | "portfolio" | "insights" | "integrations" | "admin";

export interface ScopeNavItem {
  id: ScopeNavSection;
  label: string;
  to: string;
  icon: string;
  tier?: "core" | "advanced";
  minRole?: "WORKSPACE_MEMBER" | "WORKSPACE_MANAGER" | "WORKSPACE_ADMIN";
}

export type ProjectViewType = "board" | "table" | "timeline" | "calendar" | "dashboard";

export interface ProjectViewItem {
  id: ProjectViewType;
  label: string;
  to: string;
  icon: string;
}

const ROLE_WEIGHT: Record<string, number> = {
  WORKSPACE_MEMBER: 1,
  WORKSPACE_MANAGER: 2,
  WORKSPACE_ADMIN: 3
};

export const scopeNavigation: ScopeNavItem[] = [
  { id: "my-work", label: "Dashboard", to: "/app", icon: "dashboard", tier: "core" },
  { id: "sprint", label: "Sprint", to: "/app/sprint", icon: "event_note", tier: "core" },
  { id: "inbox", label: "Inbox", to: "/app/inbox", icon: "inbox", tier: "core" },
  { id: "workspaces", label: "Workspace", to: "/app/workspace/select", icon: "workspaces", tier: "core" },
  { id: "insights", label: "AI Insights", to: "/app/insights", icon: "psychology", tier: "core" },
  { id: "portfolio", label: "Portfolio", to: "/app/portfolio", icon: "account_tree", tier: "advanced", minRole: "WORKSPACE_MANAGER" },
  { id: "integrations", label: "Integrations", to: "/app/integrations/import", icon: "hub", tier: "advanced", minRole: "WORKSPACE_MANAGER" },
  { id: "admin", label: "Admin", to: "/app/admin/compliance", icon: "admin_panel_settings", tier: "advanced", minRole: "WORKSPACE_ADMIN" }
];

export const projectViewNavigation: ProjectViewItem[] = [
  { id: "board", label: "Project Board", to: "/app/projects/board", icon: "view_kanban" },
  { id: "table", label: "Table", to: "/app/projects/table", icon: "table_view" },
  { id: "timeline", label: "Timeline", to: "/app/projects/timeline", icon: "timeline" },
  { id: "calendar", label: "Calendar", to: "/app/projects/calendar", icon: "calendar_month" },
  { id: "dashboard", label: "Dashboard", to: "/app/projects/dashboard", icon: "space_dashboard" }
];

export function canAccessNavItem(role: string | null | undefined, item: ScopeNavItem): boolean {
  if (!item.minRole) {
    return true;
  }
  const current = ROLE_WEIGHT[role ?? ""] ?? 0;
  const required = ROLE_WEIGHT[item.minRole] ?? 0;
  return current >= required;
}

export function splitScopeNavigationByTier(items: ScopeNavItem[]) {
  const core = items.filter((item) => (item.tier ?? "core") === "core");
  const advanced = items.filter((item) => (item.tier ?? "core") === "advanced");
  return { core, advanced };
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

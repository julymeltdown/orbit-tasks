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
  { id: "my-work", label: "홈", to: "/app", icon: "dashboard", tier: "core" },
  { id: "sprint", label: "스프린트", to: "/app/sprint", icon: "event_note", tier: "core" },
  { id: "inbox", label: "인박스", to: "/app/inbox", icon: "inbox", tier: "core" },
  { id: "workspaces", label: "워크스페이스", to: "/app/workspace/select", icon: "workspaces", tier: "core" },
  { id: "insights", label: "인사이트", to: "/app/insights", icon: "psychology", tier: "core" },
  { id: "portfolio", label: "포트폴리오", to: "/app/portfolio", icon: "account_tree", tier: "advanced", minRole: "WORKSPACE_MANAGER" },
  { id: "integrations", label: "연동", to: "/app/integrations/import", icon: "hub", tier: "advanced", minRole: "WORKSPACE_MANAGER" },
  { id: "admin", label: "관리", to: "/app/admin/compliance", icon: "admin_panel_settings", tier: "advanced", minRole: "WORKSPACE_ADMIN" }
];

export const projectViewNavigation: ProjectViewItem[] = [
  { id: "board", label: "보드", to: "/app/projects/board", icon: "view_kanban" },
  { id: "table", label: "테이블", to: "/app/projects/table", icon: "table_view" },
  { id: "timeline", label: "타임라인", to: "/app/projects/timeline", icon: "timeline" },
  { id: "calendar", label: "캘린더", to: "/app/projects/calendar", icon: "calendar_month" },
  { id: "dashboard", label: "대시보드", to: "/app/projects/dashboard", icon: "space_dashboard" }
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
    return "프로젝트";
  }
  if (pathname.startsWith("/app/sprint")) {
    return "스프린트";
  }
  if (pathname.startsWith("/app/inbox")) {
    return "인박스";
  }
  if (pathname.startsWith("/app/portfolio")) {
    return "포트폴리오";
  }
  if (pathname.startsWith("/app/admin")) {
    return "관리";
  }
  if (pathname.startsWith("/app/insights")) {
    return "인사이트";
  }
  if (pathname.startsWith("/app/integrations")) {
    return "연동";
  }
  if (pathname.startsWith("/app/workspace")) {
    return "워크스페이스";
  }
  return "홈";
}

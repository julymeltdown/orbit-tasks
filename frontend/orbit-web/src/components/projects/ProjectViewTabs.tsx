import { useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { projectViewNavigation, type ProjectViewType } from "@/app/navigationModel";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useViewConfigurations } from "@/features/workitems/hooks/useViewConfigurations";
import { PROJECT_VIEW_LABELS } from "@/features/usability";

function resolveViewFromPath(pathname: string): ProjectViewType {
  if (pathname.includes("/projects/table")) return "table";
  if (pathname.includes("/projects/timeline")) return "timeline";
  if (pathname.includes("/projects/calendar")) return "calendar";
  if (pathname.includes("/projects/dashboard")) return "dashboard";
  return "board";
}

export function ProjectViewTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const setView = useProjectViewStore((state) => state.setView);
  const context = useProjectViewStore((state) => state.getContext(projectId));
  const { saveDefaultConfiguration, saving, error } = useViewConfigurations(projectId);

  const activeView = useMemo(() => resolveViewFromPath(location.pathname), [location.pathname]);
  const intentLabel = useMemo(() => {
    switch (context.viewIntent) {
      case "execution":
        return "실행";
      case "bulk_edit":
        return "정리";
      case "planning":
        return "계획";
      case "schedule":
        return "일정";
      case "summary":
        return "요약";
      default:
        return "작업";
    }
  }, [context.viewIntent]);

  function onOpenView(path: string, view: ProjectViewType) {
    setView(projectId, view);
    navigate(path);
  }

  return (
    <section className="orbit-project-tabs" aria-label="Project views">
      <nav className="orbit-project-tabs__links" role="tablist" aria-label="Project views">
        {projectViewNavigation.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            role="tab"
            aria-selected={activeView === item.id}
            className={({ isActive }) => `orbit-link-button orbit-link-button--tab${isActive ? " is-active" : ""}`}
            onClick={(event) => {
              event.preventDefault();
              onOpenView(item.to, item.id);
            }}
          >
            {PROJECT_VIEW_LABELS[item.id] ?? item.label}
          </NavLink>
        ))}
      </nav>

      <div className="orbit-project-tabs__actions" aria-label="View actions">
        <span className="orbit-project-tabs__intent">{intentLabel} 모드</span>
        <button
          className="orbit-button orbit-button--ghost"
          type="button"
          title="현재 필터를 기본 보기로 저장"
          aria-label="현재 필터를 기본 보기로 저장"
          onClick={() => {
            saveDefaultConfiguration(context.view.toUpperCase(), context.filters).catch(() => undefined);
          }}
          disabled={saving}
        >
          <span className="material-symbols-outlined">{saving ? "hourglass_top" : "save"}</span>
          <span>{saving ? "저장 중..." : "기본 보기 저장"}</span>
        </button>
        {error ? <span className="orbit-project-tabs__error">{error}</span> : null}
      </div>
    </section>
  );
}

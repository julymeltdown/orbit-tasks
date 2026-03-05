import { useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { projectViewNavigation, type ProjectViewType } from "@/app/navigationModel";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useViewConfigurations } from "@/features/workitems/hooks/useViewConfigurations";

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

  function onOpenView(path: string, view: ProjectViewType) {
    setView(projectId, view);
    navigate(path);
  }

  return (
    <article className="orbit-project-tabs" aria-label="Project views">
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
            {item.label}
          </NavLink>
        ))}
      </nav>

      <section className="orbit-project-tabs__actions" aria-label="View actions">
        <button
          className="orbit-button orbit-button--ghost"
          type="button"
          onClick={() => {
            saveDefaultConfiguration(context.view.toUpperCase(), context.filters).catch(() => undefined);
          }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save View"}
        </button>
        {error ? <span className="orbit-project-tabs__error">{error}</span> : null}
      </section>
    </article>
  );
}

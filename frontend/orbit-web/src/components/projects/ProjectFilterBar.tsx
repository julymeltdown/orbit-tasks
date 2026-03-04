import { useMemo } from "react";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";

interface Props {
  title: string;
  subtitle?: string;
}

export function ProjectFilterBar({ title, subtitle }: Props) {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const context = useProjectViewStore((state) => state.getContext(projectId));
  const setFilter = useProjectViewStore((state) => state.setFilter);

  const statusOptions = useMemo(() => ["ALL", "TODO", "IN_PROGRESS", "REVIEW", "DONE", "ARCHIVED"], []);

  return (
    <article className="orbit-card orbit-project-filterbar">
      <div>
        <h2 style={{ marginTop: 0, marginBottom: 4 }}>{title}</h2>
        {subtitle ? <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>{subtitle}</p> : null}
      </div>
      <div className="orbit-project-filterbar__controls">
        <input
          className="orbit-input"
          placeholder="Search task title"
          value={context.filters.query}
          onChange={(event) => setFilter(projectId, "query", event.target.value)}
        />
        <input
          className="orbit-input"
          placeholder="Assignee"
          value={context.filters.assignee}
          onChange={(event) => setFilter(projectId, "assignee", event.target.value)}
        />
        <select
          className="orbit-input"
          value={context.filters.status}
          onChange={(event) => setFilter(projectId, "status", event.target.value)}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <label className="orbit-project-filterbar__checkbox">
          <input
            type="checkbox"
            checked={context.filters.sprintOnly}
            onChange={(event) => setFilter(projectId, "sprintOnly", event.target.checked)}
          />
          Sprint only
        </label>
        <button
          className="orbit-button orbit-button--ghost"
          type="button"
          onClick={() => {
            setFilter(projectId, "query", "");
            setFilter(projectId, "assignee", "");
            setFilter(projectId, "status", "ALL");
            setFilter(projectId, "sprintOnly", false);
          }}
        >
          Reset
        </button>
      </div>
    </article>
  );
}


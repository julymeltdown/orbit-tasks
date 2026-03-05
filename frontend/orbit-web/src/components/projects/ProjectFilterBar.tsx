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

  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: "전체 상태" },
      { value: "TODO", label: "Backlog" },
      { value: "IN_PROGRESS", label: "In Progress" },
      { value: "REVIEW", label: "Review" },
      { value: "DONE", label: "Done" },
      { value: "ARCHIVED", label: "Archived" }
    ],
    []
  );

  return (
    <section className="orbit-project-filterbar" aria-label="Task filters">
      <h2 className="orbit-project-filterbar__title">{title}</h2>
      {subtitle ? <p className="orbit-project-filterbar__subtitle">{subtitle}</p> : null}
      <div className="orbit-project-filterbar__controls">
        <input
          className="orbit-input"
          placeholder="작업 제목 검색"
          value={context.filters.query}
          onChange={(event) => setFilter(projectId, "query", event.target.value)}
        />
        <input
          className="orbit-input"
          placeholder="담당자"
          value={context.filters.assignee}
          onChange={(event) => setFilter(projectId, "assignee", event.target.value)}
        />
        <select
          className="orbit-input"
          value={context.filters.status}
          onChange={(event) => setFilter(projectId, "status", event.target.value)}
        >
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <label className="orbit-project-filterbar__checkbox">
          <input
            type="checkbox"
            checked={context.filters.sprintOnly}
            onChange={(event) => setFilter(projectId, "sprintOnly", event.target.checked)}
          />
          이번 스프린트만
        </label>
        <button
          className="orbit-text-button"
          type="button"
          onClick={() => {
            setFilter(projectId, "query", "");
            setFilter(projectId, "assignee", "");
            setFilter(projectId, "status", "ALL");
            setFilter(projectId, "sprintOnly", false);
          }}
        >
          초기화
        </button>
      </div>
    </section>
  );
}

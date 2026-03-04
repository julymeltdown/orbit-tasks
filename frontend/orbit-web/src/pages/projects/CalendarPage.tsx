import { useEffect, useMemo } from "react";
import { ProjectViewTabs } from "@/components/projects/ProjectViewTabs";
import { ProjectFilterBar } from "@/components/projects/ProjectFilterBar";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useProjectStore } from "@/stores/projectStore";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useWorkItems } from "@/features/workitems/hooks/useWorkItems";

function dateOnly(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export function CalendarPage() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const setView = useProjectViewStore((state) => state.setView);
  const context = useProjectViewStore((state) => state.getContext(projectId));
  const { items, loading, error } = useWorkItems(projectId);

  useEffect(() => {
    setView(projectId, "calendar");
  }, [projectId, setView]);

  const filtered = useMemo(() => {
    const query = context.filters.query.trim().toLowerCase();
    const assignee = context.filters.assignee.trim().toLowerCase();
    const status = context.filters.status;
    return items.filter((item) => {
      if (query && !item.title.toLowerCase().includes(query)) return false;
      if (assignee && !(item.assignee ?? "").toLowerCase().includes(assignee)) return false;
      if (status !== "ALL" && item.status !== status) return false;
      return true;
    });
  }, [items, context.filters.assignee, context.filters.query, context.filters.status]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const key = dateOnly(item.dueAt) || "Unscheduled";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a > b ? 1 : -1));
  }, [filtered]);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <ProjectViewTabs />
      <ProjectFilterBar title="Calendar View" subtitle="Deadlines and unscheduled items from the same work-item dataset." />
      <article className="orbit-card" style={{ padding: 14 }}>
        {loading ? <p>Loading calendar...</p> : null}
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}

        <div style={{ display: "grid", gap: 10 }}>
          {grouped.map(([date, records]) => (
            <section key={date} className="orbit-panel" style={{ padding: 10, display: "grid", gap: 8 }}>
              <strong>{date}</strong>
              <div style={{ display: "grid", gap: 6 }}>
                {records.map((item) => (
                  <div key={item.workItemId} className="orbit-animate-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="orbit-notion-pill">{item.status}</span>
                    <strong>{item.title}</strong>
                    <span style={{ color: "var(--orbit-text-subtle)", fontSize: 12 }}>{item.assignee || "unassigned"}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {grouped.length === 0 ? <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>No items for the current filter.</p> : null}
        </div>
      </article>
    </section>
  );
}

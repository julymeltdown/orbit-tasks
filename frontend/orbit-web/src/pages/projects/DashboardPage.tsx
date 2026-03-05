import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectViewTabs } from "@/components/projects/ProjectViewTabs";
import { ProjectFilterBar } from "@/components/projects/ProjectFilterBar";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useProjectStore } from "@/stores/projectStore";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import { displayWorkItemTitle } from "@/features/workitems/display";

export function DashboardPage() {
  const navigate = useNavigate();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const setView = useProjectViewStore((state) => state.setView);
  const setFilter = useProjectViewStore((state) => state.setFilter);
  const context = useProjectViewStore((state) => state.getContext(projectId));
  const { items, loading, error } = useWorkItems(projectId);

  useEffect(() => {
    setView(projectId, "dashboard");
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

  const summary = useMemo(() => {
    const total = filtered.length;
    const done = filtered.filter((item) => item.status === "DONE").length;
    const blocked = filtered.filter((item) => item.status === "REVIEW").length;
    const overdue = filtered.filter((item) => {
      if (!item.dueAt) return false;
      return new Date(item.dueAt).getTime() < Date.now() && item.status !== "DONE";
    }).length;
    const completion = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, blocked, overdue, completion };
  }, [filtered]);

  function drillTo(filter: "ALL" | "DONE" | "REVIEW") {
    setFilter(projectId, "status", filter);
    navigate("/app/projects/table");
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <ProjectViewTabs />
      <ProjectFilterBar title="Dashboard View" subtitle="Progress, risk, and execution indicators from shared query state." />

      <article className="orbit-card" style={{ padding: 16 }}>
        {loading ? <p>Loading dashboard...</p> : null}
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}
        <div className="orbit-shell__content-grid">
          <div className="orbit-panel" style={{ gridColumn: "span 3", padding: 12 }}>
            <p className="orbit-ops-hub__eyebrow">Completion</p>
            <strong style={{ fontSize: 30 }}>{summary.completion}%</strong>
          </div>
          <button
            className="orbit-panel orbit-animate-card"
            style={{ gridColumn: "span 3", padding: 12, textAlign: "left", border: "1px solid var(--orbit-border)" }}
            type="button"
            onClick={() => drillTo("ALL")}
          >
            <p className="orbit-ops-hub__eyebrow">Total</p>
            <strong style={{ fontSize: 30 }}>{summary.total}</strong>
          </button>
          <button
            className="orbit-panel orbit-animate-card"
            style={{ gridColumn: "span 3", padding: 12, textAlign: "left", border: "1px solid var(--orbit-border)" }}
            type="button"
            onClick={() => {
              setFilter(projectId, "status", "ALL");
              setFilter(projectId, "query", "");
              navigate("/app/projects/table");
            }}
          >
            <p className="orbit-ops-hub__eyebrow">Overdue</p>
            <strong style={{ fontSize: 30 }}>{summary.overdue}</strong>
          </button>
          <button
            className="orbit-panel orbit-animate-card"
            style={{ gridColumn: "span 3", padding: 12, textAlign: "left", border: "1px solid var(--orbit-border)" }}
            type="button"
            onClick={() => drillTo("REVIEW")}
          >
            <p className="orbit-ops-hub__eyebrow">Review Queue</p>
            <strong style={{ fontSize: 30 }}>{summary.blocked}</strong>
          </button>

          <div className="orbit-panel" style={{ gridColumn: "span 12", padding: 12 }}>
            <strong>Recent Items</strong>
            <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
              {filtered.slice(0, 8).map((item) => (
                <div key={item.workItemId} className="orbit-animate-row" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="orbit-notion-pill">{item.status}</span>
                  <span>{displayWorkItemTitle(item.title)}</span>
                  <span style={{ color: "var(--orbit-text-subtle)", fontSize: 12, marginLeft: "auto" }}>
                    {item.dueAt ? new Date(item.dueAt).toLocaleDateString() : "No due"}
                  </span>
                </div>
              ))}
              {filtered.length === 0 ? (
                <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>No records in current dashboard filter.</p>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

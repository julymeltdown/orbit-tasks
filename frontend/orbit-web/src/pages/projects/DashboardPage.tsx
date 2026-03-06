import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectViewTabs } from "@/components/projects/ProjectViewTabs";
import { ProjectFilterBar } from "@/components/projects/ProjectFilterBar";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useProjectStore } from "@/stores/projectStore";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import { displayWorkItemTitle } from "@/features/workitems/display";
import { type DrilldownMetric, isAtRiskItem, isBlockedItem, isOverdueItem, resetFiltersForDrilldown } from "@/features/insights/drilldownContracts";

export function DashboardPage() {
  const navigate = useNavigate();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const setView = useProjectViewStore((state) => state.setView);
  const setFilter = useProjectViewStore((state) => state.setFilter);
  const setLastDrilldownMetric = useProjectViewStore((state) => state.setLastDrilldownMetric);
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
    const review = filtered.filter((item) => item.status === "REVIEW").length;
    const blocked = filtered.filter((item) => isBlockedItem(item)).length;
    const overdue = filtered.filter((item) => isOverdueItem(item)).length;
    const atRisk = filtered.filter((item) => isAtRiskItem(item)).length;
    const completion = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, blocked, overdue, review, atRisk, completion };
  }, [filtered]);

  function drillTo(metric: DrilldownMetric) {
    const reset = resetFiltersForDrilldown();
    setFilter(projectId, "status", reset.status ?? "ALL");
    setFilter(projectId, "query", reset.query ?? "");
    setLastDrilldownMetric(projectId, metric);
    navigate("/app/projects/table");
  }

  return (
    <section className="orbit-dashboard-layout">
      <ProjectViewTabs />
      <ProjectFilterBar title="프로젝트 대시보드" subtitle="숫자의 의미가 명확해야 다음 행동이 정해집니다. 각 카드에서 바로 drilldown 할 수 있습니다." />

      {loading ? <p>Loading dashboard...</p> : null}
      {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}
      <div className="orbit-dashboard-metrics">
        <div className="orbit-dashboard-metric">
          <p className="orbit-ops-hub__eyebrow">Completion</p>
          <strong style={{ fontSize: 30 }}>{summary.completion}%</strong>
        </div>
        <button className="orbit-dashboard-metric orbit-animate-card" type="button" onClick={() => drillTo("all")}>
          <p className="orbit-ops-hub__eyebrow">Total</p>
          <strong style={{ fontSize: 30 }}>{summary.total}</strong>
        </button>
        <button className="orbit-dashboard-metric orbit-animate-card" type="button" onClick={() => drillTo("overdue")}>
          <p className="orbit-ops-hub__eyebrow">Overdue</p>
          <strong style={{ fontSize: 30 }}>{summary.overdue}</strong>
        </button>
        <button className="orbit-dashboard-metric orbit-animate-card" type="button" onClick={() => drillTo("blocked")}>
          <p className="orbit-ops-hub__eyebrow">Blocked</p>
          <strong style={{ fontSize: 30 }}>{summary.blocked}</strong>
        </button>
        <button className="orbit-dashboard-metric orbit-animate-card" type="button" onClick={() => drillTo("review")}>
          <p className="orbit-ops-hub__eyebrow">Review Queue</p>
          <strong style={{ fontSize: 30 }}>{summary.review}</strong>
        </button>
        <button className="orbit-dashboard-metric orbit-animate-card" type="button" onClick={() => drillTo("atRisk")}>
          <p className="orbit-ops-hub__eyebrow">At Risk</p>
          <strong style={{ fontSize: 30 }}>{summary.atRisk}</strong>
        </button>
      </div>

      <section className="orbit-dashboard-recent">
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
      </section>
    </section>
  );
}

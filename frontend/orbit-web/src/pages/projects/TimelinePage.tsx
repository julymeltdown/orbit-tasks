import { useMemo } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { WorkItemStatus, useWorkItems } from "@/features/workitems/hooks/useWorkItems";

const STATUS_STEPS: WorkItemStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE", "ARCHIVED"];

function toDate(value: string | null) {
  return value ? new Date(value) : null;
}

function diffDays(start: Date, end: Date) {
  const ms = Math.max(24 * 60 * 60 * 1000, end.getTime() - start.getTime());
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export function TimelinePage() {
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(workspaceId));
  const { items, loading, error, updateStatus } = useWorkItems(projectId);

  const bounds = useMemo(() => {
    if (items.length === 0) {
      const today = new Date();
      return { min: today, max: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) };
    }

    const starts = items.map((item) => toDate(item.startAt) ?? new Date(item.createdAt));
    const ends = items.map((item) => toDate(item.dueAt) ?? new Date(item.createdAt));
    const min = new Date(Math.min(...starts.map((date) => date.getTime())));
    const max = new Date(Math.max(...ends.map((date) => date.getTime())));
    return { min, max };
  }, [items]);

  const totalDays = Math.max(1, diffDays(bounds.min, bounds.max));

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <article className="orbit-card" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Timeline</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          동일 Work Item 데이터를 타임라인으로 표시합니다. 상태 변경은 보드/테이블과 즉시 동기화됩니다.
        </p>
        {loading ? <p>Loading timeline...</p> : null}
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}
      </article>

      <article className="orbit-card" style={{ padding: 14, overflowX: "auto" }}>
        <div style={{ minWidth: 900, display: "grid", gap: 8 }}>
          {items.map((item) => {
            const start = toDate(item.startAt) ?? new Date(item.createdAt);
            const end = toDate(item.dueAt) ?? new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);
            const left = ((start.getTime() - bounds.min.getTime()) / (bounds.max.getTime() - bounds.min.getTime() || 1)) * 100;
            const width = (diffDays(start, end) / totalDays) * 100;
            return (
              <div key={item.workItemId} className="orbit-panel orbit-animate-card" style={{ padding: 10, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <strong>{item.title}</strong>
                  <select
                    className="orbit-input"
                    value={item.status}
                    style={{ width: 170 }}
                    onChange={(event) => updateStatus(item.workItemId, event.target.value as WorkItemStatus)}
                  >
                    {STATUS_STEPS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
                  {start.toLocaleDateString()} → {end.toLocaleDateString()} · {item.assignee || "unassigned"}
                </div>
                <div style={{ position: "relative", height: 12, border: "1px solid var(--orbit-border)", background: "var(--orbit-surface-1)" }}>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: `${Math.max(0, left)}%`,
                      width: `${Math.max(6, width)}%`,
                      background: "var(--orbit-accent)"
                    }}
                  />
                </div>
              </div>
            );
          })}
          {items.length === 0 ? <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>No items to display yet.</p> : null}
        </div>
      </article>
    </section>
  );
}

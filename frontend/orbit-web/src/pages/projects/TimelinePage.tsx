import { useEffect, useMemo } from "react";
import { ProjectViewTabs } from "@/components/projects/ProjectViewTabs";
import { ProjectFilterBar } from "@/components/projects/ProjectFilterBar";
import { useProjectStore } from "@/stores/projectStore";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { WorkItemStatus, useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import { displayWorkItemTitle } from "@/features/workitems/display";

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
  const viewContext = useProjectViewStore((state) => state.getContext(projectId));
  const setView = useProjectViewStore((state) => state.setView);
  const { items, loading, error, updateStatus, updateItem } = useWorkItems(projectId);

  useEffect(() => {
    setView(projectId, "timeline");
  }, [projectId, setView]);

  const filteredItems = useMemo(() => {
    const query = viewContext.filters.query.trim().toLowerCase();
    const assigneeFilter = viewContext.filters.assignee.trim().toLowerCase();
    return items.filter((item) => {
      if (viewContext.filters.status !== "ALL" && item.status !== viewContext.filters.status) {
        return false;
      }
      if (query && !item.title.toLowerCase().includes(query)) {
        return false;
      }
      if (assigneeFilter && !(item.assignee ?? "").toLowerCase().includes(assigneeFilter)) {
        return false;
      }
      return true;
    });
  }, [items, viewContext.filters.assignee, viewContext.filters.query, viewContext.filters.status]);

  const scheduledItems = useMemo(() => filteredItems.filter((item) => item.startAt || item.dueAt), [filteredItems]);
  const unscheduledItems = useMemo(() => filteredItems.filter((item) => !item.startAt && !item.dueAt), [filteredItems]);

  const bounds = useMemo(() => {
    if (scheduledItems.length === 0) {
      const today = new Date();
      return { min: today, max: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) };
    }

    const starts = scheduledItems.map((item) => toDate(item.startAt) ?? new Date(item.createdAt));
    const ends = scheduledItems.map((item) => toDate(item.dueAt) ?? new Date(item.createdAt));
    const min = new Date(Math.min(...starts.map((date) => date.getTime())));
    const max = new Date(Math.max(...ends.map((date) => date.getTime())));
    return { min, max };
  }, [scheduledItems]);

  const totalDays = Math.max(1, diffDays(bounds.min, bounds.max));

  return (
    <section className="orbit-timeline-layout">
      <ProjectViewTabs />
      <ProjectFilterBar title="일정 타임라인" subtitle="같은 작업 집합을 날짜 계획 관점에서 검토하고 조정합니다." />

      <section className="orbit-board-focus-strip">
        <article className="orbit-board-focus-strip__metric">
          <strong>배치된 작업</strong>
          <span>{scheduledItems.length}개</span>
        </article>
        <article className="orbit-board-focus-strip__metric">
          <strong>미배치 작업</strong>
          <span>{unscheduledItems.length}개</span>
        </article>
        <article className="orbit-board-focus-strip__metric">
          <strong>계획 범위</strong>
          <span>{bounds.min.toLocaleDateString()} ~ {bounds.max.toLocaleDateString()}</span>
        </article>
      </section>

      <section className="orbit-timeline-shell">
        <header className="orbit-timeline-shell__header">
          <div>
            <h2 style={{ margin: 0 }}>날짜와 상태를 함께 보는 계획 화면</h2>
            <p className="orbit-timeline-shell__summary">작업마다 시작일과 기한을 조정하고, 범위를 벗어난 미배치 항목을 바로 확인할 수 있습니다.</p>
          </div>
        </header>

        {loading ? <p>타임라인을 불러오는 중...</p> : null}
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}

        <section className="orbit-timeline-list">
          {scheduledItems.map((item) => {
            const start = toDate(item.startAt) ?? new Date(item.createdAt);
            const end = toDate(item.dueAt) ?? new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);
            const spanStart = bounds.max.getTime() === bounds.min.getTime() ? 0 : ((start.getTime() - bounds.min.getTime()) / (bounds.max.getTime() - bounds.min.getTime())) * 100;
            const spanWidth = (diffDays(start, end) / totalDays) * 100;

            return (
              <article key={item.workItemId} className="orbit-timeline-row orbit-animate-row">
                <div className="orbit-timeline-row__summary">
                  <strong>{displayWorkItemTitle(item.title)}</strong>
                  <div className="orbit-timeline-row__meta">
                    <span>{item.assignee || "담당자 미지정"}</span>
                    <span>{item.startAt ? new Date(item.startAt).toLocaleDateString() : "시작일 없음"}</span>
                    <span>{item.dueAt ? new Date(item.dueAt).toLocaleDateString() : "기한 없음"}</span>
                  </div>
                </div>
                <div className="orbit-timeline-row__track">
                  <div className="orbit-timeline-row__track-line">
                    <div
                      className="orbit-timeline-row__track-span"
                      style={{
                        left: `${Math.max(0, spanStart)}%`,
                        width: `${Math.max(7, spanWidth)}%`
                      }}
                    />
                  </div>
                </div>
                <div className="orbit-timeline-row__controls">
                  <select
                    className="orbit-input"
                    value={item.status}
                    onChange={(event) => updateStatus(item.workItemId, event.target.value as WorkItemStatus)}
                  >
                    {STATUS_STEPS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <input
                    className="orbit-input"
                    type="date"
                    value={item.startAt ? new Date(item.startAt).toISOString().slice(0, 10) : ""}
                    onChange={(event) => updateItem(item.workItemId, { startAt: event.target.value || null }).catch(() => undefined)}
                  />
                  <input
                    className="orbit-input"
                    type="date"
                    value={item.dueAt ? new Date(item.dueAt).toISOString().slice(0, 10) : ""}
                    onChange={(event) => updateItem(item.workItemId, { dueAt: event.target.value || null }).catch(() => undefined)}
                  />
                </div>
              </article>
            );
          })}
          {!loading && scheduledItems.length === 0 ? (
            <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>현재 필터에서는 날짜가 배치된 작업이 없습니다.</p>
          ) : null}
        </section>

        <section className="orbit-timeline-unscheduled">
          <div className="orbit-calendar-unscheduled__head">
            <strong>미배치 작업</strong>
            <span>{unscheduledItems.length}</span>
          </div>
          <div className="orbit-calendar-unscheduled__list">
            {unscheduledItems.map((item) => (
              <div key={item.workItemId} className="orbit-calendar-unscheduled__item">
                <div style={{ display: "grid", gap: 4 }}>
                  <strong>{displayWorkItemTitle(item.title)}</strong>
                  <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{item.assignee || "담당자 미지정"}</span>
                </div>
                <div className="orbit-timeline-row__controls">
                  <input
                    className="orbit-input"
                    type="date"
                    value={item.startAt ? new Date(item.startAt).toISOString().slice(0, 10) : ""}
                    onChange={(event) => updateItem(item.workItemId, { startAt: event.target.value || null }).catch(() => undefined)}
                  />
                  <input
                    className="orbit-input"
                    type="date"
                    value={item.dueAt ? new Date(item.dueAt).toISOString().slice(0, 10) : ""}
                    onChange={(event) => updateItem(item.workItemId, { dueAt: event.target.value || null }).catch(() => undefined)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </section>
  );
}

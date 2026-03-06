import { useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";
import { ProjectViewTabs } from "@/components/projects/ProjectViewTabs";
import { ProjectFilterBar } from "@/components/projects/ProjectFilterBar";
import { displayWorkItemTitle } from "@/features/workitems/display";
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
  const setSelectedWorkItem = useProjectViewStore((state) => state.setSelectedWorkItem);
  const context = useProjectViewStore((state) => state.getContext(projectId));
  const { items, loading, error, updateItem } = useWorkItems(projectId);

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

  const scheduledItems = useMemo(() => filtered.filter((item) => dateOnly(item.dueAt)), [filtered]);
  const unscheduledItems = useMemo(() => filtered.filter((item) => !dateOnly(item.dueAt)), [filtered]);

  const events = useMemo<EventInput[]>(() => {
    return scheduledItems.map((item) => ({
      id: item.workItemId,
      title: displayWorkItemTitle(item.title),
      start: dateOnly(item.dueAt),
      allDay: true,
      classNames: ["orbit-fc-event", `orbit-fc-event--${item.status.toLowerCase()}`],
      extendedProps: {
        assignee: item.assignee ?? "unassigned",
        status: item.status
      }
    }));
  }, [scheduledItems]);

  const selectedItem = useMemo(() => {
    if (!context.selectedWorkItemId) {
      return null;
    }
    return filtered.find((item) => item.workItemId === context.selectedWorkItemId) ?? null;
  }, [context.selectedWorkItemId, filtered]);

  return (
    <section className="orbit-calendar-layout">
      <ProjectViewTabs />
      <ProjectFilterBar title="캘린더" subtitle="기한이 있는 작업은 달력에, 미배치 작업은 아래 리스트에서 바로 날짜를 잡습니다." />

      <section className="orbit-board-focus-strip">
        <article className="orbit-board-focus-strip__metric">
          <strong>달력 배치</strong>
          <span>{scheduledItems.length}개</span>
        </article>
        <article className="orbit-board-focus-strip__metric">
          <strong>미배치</strong>
          <span>{unscheduledItems.length}개</span>
        </article>
        <article className="orbit-board-focus-strip__metric">
          <strong>선택 작업</strong>
          <span>{selectedItem ? displayWorkItemTitle(selectedItem.title) : "없음"}</span>
        </article>
      </section>

      {loading ? <p>캘린더를 불러오는 중...</p> : null}
      {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}

      <section className="orbit-calendar-surface">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          fixedWeekCount={false}
          height="auto"
          dayMaxEventRows={3}
          editable
          events={events}
          eventClick={(arg) => {
            setSelectedWorkItem(projectId, arg.event.id);
          }}
          eventDrop={(arg) => {
            const nextDate = arg.event.start ? arg.event.start.toISOString().slice(0, 10) : null;
            updateItem(arg.event.id, { dueAt: nextDate }).catch(() => {
              arg.revert();
            });
          }}
          dateClick={(arg) => {
            if (selectedItem) {
              updateItem(selectedItem.workItemId, { dueAt: arg.dateStr }).catch(() => undefined);
            }
          }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: ""
          }}
        />
      </section>

      {selectedItem ? (
        <section className="orbit-calendar-selected">
          <div className="orbit-calendar-selected__head">
            <span className="orbit-notion-pill">{selectedItem.status}</span>
            <strong>{displayWorkItemTitle(selectedItem.title)}</strong>
          </div>
          <div className="orbit-calendar-selected__meta">
            <span>{selectedItem.assignee || "담당자 미지정"}</span>
            <span>{selectedItem.type}</span>
            <span>{selectedItem.dueAt ? new Date(selectedItem.dueAt).toLocaleDateString() : "기한 없음"}</span>
          </div>
          <div className="orbit-timeline-row__controls">
            <input
              className="orbit-input"
              type="date"
              value={selectedItem.dueAt ? new Date(selectedItem.dueAt).toISOString().slice(0, 10) : ""}
              onChange={(event) => updateItem(selectedItem.workItemId, { dueAt: event.target.value || null }).catch(() => undefined)}
            />
            <input
              className="orbit-input"
              value={selectedItem.assignee ?? ""}
              placeholder="담당자"
              onChange={(event) => updateItem(selectedItem.workItemId, { assignee: event.target.value || null }).catch(() => undefined)}
            />
          </div>
        </section>
      ) : null}

      <section className="orbit-calendar-unscheduled">
        <div className="orbit-calendar-unscheduled__head">
          <strong>미배치 작업</strong>
          <span>{unscheduledItems.length}</span>
        </div>
        <div className="orbit-calendar-unscheduled__list">
          {unscheduledItems.map((item) => (
            <article key={item.workItemId} className="orbit-calendar-unscheduled__item orbit-animate-row">
              <div style={{ display: "grid", gap: 4 }}>
                <strong>{displayWorkItemTitle(item.title)}</strong>
                <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{item.assignee || "담당자 미지정"}</span>
              </div>
              <div className="orbit-thread-panel__context-actions">
                <button className="orbit-button orbit-button--ghost" type="button" onClick={() => setSelectedWorkItem(projectId, item.workItemId)}>
                  선택
                </button>
                <input
                  className="orbit-input"
                  type="date"
                  value={item.dueAt ? new Date(item.dueAt).toISOString().slice(0, 10) : ""}
                  onChange={(event) => updateItem(item.workItemId, { dueAt: event.target.value || null }).catch(() => undefined)}
                />
              </div>
            </article>
          ))}
          {unscheduledItems.length === 0 ? (
            <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>현재 보이는 작업은 모두 달력에 배치되어 있습니다.</p>
          ) : null}
        </div>
      </section>

      {!loading && !error && filtered.length === 0 ? (
        <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>현재 필터에는 작업이 없습니다.</p>
      ) : null}
    </section>
  );
}

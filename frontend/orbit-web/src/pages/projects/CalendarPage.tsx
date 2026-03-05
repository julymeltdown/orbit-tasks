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

  const events = useMemo<EventInput[]>(() => {
    return filtered.flatMap((item) => {
      const dueDate = dateOnly(item.dueAt);
      if (!dueDate) {
        return [];
      }
      const sanitizedTitle = displayWorkItemTitle(item.title);
      return [
        {
          id: item.workItemId,
          title: sanitizedTitle,
          start: dueDate,
          allDay: true,
          classNames: ["orbit-fc-event", `orbit-fc-event--${item.status.toLowerCase()}`],
          extendedProps: {
            assignee: item.assignee ?? "unassigned",
            status: item.status
          }
        }
      ];
    });
  }, [filtered]);

  const unscheduledItems = useMemo(() => {
    return filtered.filter((item) => !dateOnly(item.dueAt));
  }, [filtered]);

  const selectedItem = useMemo(() => {
    if (!context.selectedWorkItemId) {
      return null;
    }
    return filtered.find((item) => item.workItemId === context.selectedWorkItemId) ?? null;
  }, [context.selectedWorkItemId, filtered]);

  return (
    <section className="orbit-calendar-layout">
      <ProjectViewTabs />
      <ProjectFilterBar title="Calendar View" subtitle="Deadlines and unscheduled items from the same work-item dataset." />
      {loading ? <p>Loading calendar...</p> : null}
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
            <span>{selectedItem.assignee || "unassigned"}</span>
            <span>{selectedItem.dueAt ? new Date(selectedItem.dueAt).toLocaleDateString() : "No due date"}</span>
            <span>{selectedItem.type}</span>
          </div>
        </section>
      ) : null}

      <section className="orbit-calendar-unscheduled">
        <div className="orbit-calendar-unscheduled__head">
          <strong>Unscheduled</strong>
          <span>{unscheduledItems.length}</span>
        </div>
        <div className="orbit-calendar-unscheduled__list">
          {unscheduledItems.map((item) => (
            <button
              key={item.workItemId}
              type="button"
              className="orbit-calendar-unscheduled__item orbit-animate-row"
              onClick={() => setSelectedWorkItem(projectId, item.workItemId)}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <strong>{displayWorkItemTitle(item.title)}</strong>
                <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{item.assignee || "unassigned"}</span>
                <input
                  className="orbit-input"
                  type="date"
                  value={item.dueAt ? new Date(item.dueAt).toISOString().slice(0, 10) : ""}
                  onChange={(event) => updateItem(item.workItemId, { dueAt: event.target.value || null }).catch(() => undefined)}
                />
              </div>
              <span className="orbit-notion-pill">{item.status}</span>
            </button>
          ))}
          {unscheduledItems.length === 0 ? (
            <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>Every visible item is scheduled on the calendar.</p>
          ) : null}
        </div>
      </section>

      {!loading && !error && filtered.length === 0 ? (
        <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>No items for the current filter.</p>
      ) : null}
    </section>
  );
}

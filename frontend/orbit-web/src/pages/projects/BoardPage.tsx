import { type ReactNode, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { WorkItem, WorkItemPriority, WorkItemStatus, WorkItemType, useWorkItems } from "@/features/workitems/hooks/useWorkItems";

const LANE_DEFS: Array<{ status: WorkItemStatus; title: string }> = [
  { status: "TODO", title: "Backlog" },
  { status: "IN_PROGRESS", title: "In Progress" },
  { status: "REVIEW", title: "Review" },
  { status: "DONE", title: "Done" },
  { status: "ARCHIVED", title: "Archived" }
];

function Lane({
  status,
  title,
  count,
  children
}: {
  status: WorkItemStatus;
  title: string;
  count: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `lane-${status}`,
    data: { status, kind: "lane" }
  });

  return (
    <article className="orbit-card orbit-board__lane orbit-animate-card" ref={setNodeRef} data-over={isOver ? "true" : "false"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="orbit-board__title">{title}</h3>
        <span style={{ fontSize: 11, color: "var(--orbit-text-subtle)" }}>{count}</span>
      </div>
      <div className="orbit-board__cards">{children}</div>
    </article>
  );
}

function BoardCard({
  item,
  onArchive
}: {
  item: WorkItem;
  onArchive: (workItemId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `item-${item.workItemId}`,
    data: {
      kind: "card",
      workItemId: item.workItemId,
      status: item.status
    }
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1
      }}
      className="orbit-panel orbit-animate-card"
    >
      <div
        style={{ padding: 12, display: "grid", gap: 8, touchAction: "none", cursor: "grab" }}
        {...listeners}
        {...attributes}
        aria-label={`Drag ${item.title}`}
      >
        <strong>{item.title}</strong>
        <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
          {item.type} · {item.priority ?? "MEDIUM"} · {item.assignee || "unassigned"}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
            Due {item.dueAt ? new Date(item.dueAt).toLocaleDateString() : "-"}
          </span>
          {item.status !== "ARCHIVED" ? (
            <button className="orbit-button orbit-button--ghost" type="button" onClick={() => onArchive(item.workItemId)}>
              Archive
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OverlayCard({ title }: { title: string }) {
  return (
    <div className="orbit-panel" style={{ padding: 12, minWidth: 240, boxShadow: "var(--orbit-shadow-2)" }}>
      <strong>{title}</strong>
    </div>
  );
}

export function BoardPage() {
  const userId = useAuthStore((state) => state.userId) ?? "member@orbit.local";
  const workspace = useWorkspaceStore((state) => state.getActiveWorkspace());
  const projectId = useProjectStore((state) => state.getProjectId(workspace?.workspaceId));

  const { byStatus, items, loading, error, mutation, createItem, updateStatus, addDependency, archiveItem } = useWorkItems(projectId);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<WorkItemType>("TASK");
  const [priority, setPriority] = useState<WorkItemPriority>("MEDIUM");
  const [assignee, setAssignee] = useState(userId);
  const [dueAt, setDueAt] = useState("");
  const [dependencyFrom, setDependencyFrom] = useState("");
  const [dependencyTo, setDependencyTo] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [draggingTitle, setDraggingTitle] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 8 } })
  );

  const itemIndex = useMemo(() => {
    return Object.fromEntries(items.map((item) => [item.workItemId, item]));
  }, [items]);

  async function onCreateWorkItem() {
    if (!title.trim()) {
      setLocalError("Title is required");
      return;
    }
    setLocalError(null);
    try {
      const created = await createItem({
        projectId,
        type,
        title: title.trim(),
        assignee: assignee.trim(),
        dueAt: dueAt || undefined,
        priority
      });
      setTitle("");
      setDependencyFrom(created.workItemId);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Failed to create work item");
    }
  }

  async function onAddDependency() {
    if (!dependencyFrom || !dependencyTo || dependencyFrom === dependencyTo) {
      setLocalError("Select different source and target items");
      return;
    }
    setLocalError(null);
    try {
      await addDependency(dependencyFrom, { toWorkItemId: dependencyTo, type: "FS" });
      setDependencyTo("");
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Failed to create dependency");
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id ?? "");
    const overId = String(event.over?.id ?? "");
    if (!activeId.startsWith("item-")) {
      setDraggingTitle(null);
      return;
    }
    const workItemId = activeId.replace("item-", "");
    const current = itemIndex[workItemId];
    if (!current) {
      setDraggingTitle(null);
      return;
    }

    let nextStatus: WorkItemStatus | null = null;
    if (overId.startsWith("lane-")) {
      nextStatus = overId.replace("lane-", "") as WorkItemStatus;
    }
    if (overId.startsWith("item-")) {
      const targetId = overId.replace("item-", "");
      nextStatus = itemIndex[targetId]?.status ?? null;
    }
    if (!nextStatus || nextStatus === current.status) {
      setDraggingTitle(null);
      return;
    }

    try {
      await updateStatus(workItemId, nextStatus);
    } catch {
      // Error surfaced via hook mutation.
    } finally {
      setDraggingTitle(null);
    }
  }

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <article className="orbit-card" style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Work Board</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          가로 스크롤 보드에서 카드 생성/수정/아카이브 및 드래그 상태 변경을 수행합니다.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          <input className="orbit-input" placeholder="Work item title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <select className="orbit-input" value={type} onChange={(event) => setType(event.target.value as WorkItemType)}>
            <option value="TASK">Task</option>
            <option value="STORY">Story</option>
            <option value="BUG">Bug</option>
            <option value="EPIC">Epic</option>
          </select>
          <select className="orbit-input" value={priority} onChange={(event) => setPriority(event.target.value as WorkItemPriority)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <input className="orbit-input" placeholder="Assignee" value={assignee} onChange={(event) => setAssignee(event.target.value)} />
          <input className="orbit-input" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          <button className="orbit-button" type="button" onClick={onCreateWorkItem}>
            Create
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8, marginTop: 10 }}>
          <select className="orbit-input" value={dependencyFrom} onChange={(event) => setDependencyFrom(event.target.value)}>
            <option value="">Dependency from...</option>
            {items.map((item) => (
              <option key={item.workItemId} value={item.workItemId}>
                {item.title}
              </option>
            ))}
          </select>
          <select className="orbit-input" value={dependencyTo} onChange={(event) => setDependencyTo(event.target.value)}>
            <option value="">Dependency to...</option>
            {items.map((item) => (
              <option key={item.workItemId} value={item.workItemId}>
                {item.title}
              </option>
            ))}
          </select>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={onAddDependency}>
            Add Link
          </button>
        </div>

        {loading ? <p style={{ marginBottom: 0 }}>Loading work items...</p> : null}
        {error ? <p style={{ marginBottom: 0, color: "var(--orbit-danger)" }}>{error}</p> : null}
        {mutation.error ? <p style={{ marginBottom: 0, color: "var(--orbit-danger)" }}>{mutation.error}</p> : null}
        {localError ? <p style={{ marginBottom: 0, color: "var(--orbit-danger)" }}>{localError}</p> : null}
      </article>

      <DndContext
        sensors={sensors}
        onDragStart={(event) => {
          const workItemId = String(event.active.id).replace("item-", "");
          setDraggingTitle(itemIndex[workItemId]?.title ?? null);
        }}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDraggingTitle(null)}
      >
        <section className="orbit-board" aria-label="Kanban board">
          {LANE_DEFS.map((lane) => (
            <Lane key={lane.status} status={lane.status} title={lane.title} count={byStatus[lane.status].length}>
              {byStatus[lane.status].map((item) => (
                <BoardCard key={item.workItemId} item={item} onArchive={archiveItem} />
              ))}
            </Lane>
          ))}
        </section>
        <DragOverlay>{draggingTitle ? <OverlayCard title={draggingTitle} /> : null}</DragOverlay>
      </DndContext>
    </section>
  );
}

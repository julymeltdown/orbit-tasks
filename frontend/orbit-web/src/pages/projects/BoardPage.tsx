import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import { request } from "@/lib/http/client";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useActiveSprint } from "@/features/agile/hooks/useActiveSprint";
import { displayWorkItemTitle } from "@/features/workitems/display";
import { type WorkItem, type WorkItemPriority, type WorkItemStatus, type WorkItemType, useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import { ProjectViewTabs } from "@/components/projects/ProjectViewTabs";
import { ProjectFilterBar } from "@/components/projects/ProjectFilterBar";
import { DependencyInspectorPanel } from "@/components/projects/DependencyInspectorPanel";
import { WorkItemDetailPanel } from "@/components/projects/WorkItemDetailPanel";

const FLOW_LANES: Array<{ status: WorkItemStatus; title: string }> = [
  { status: "TODO", title: "Backlog" },
  { status: "IN_PROGRESS", title: "In Progress" },
  { status: "REVIEW", title: "Review" },
  { status: "DONE", title: "Done" }
];

interface ComposerState {
  title: string;
  type: WorkItemType;
  priority: WorkItemPriority;
  assignee: string;
  dueAt: string;
}

interface BacklogItemView {
  backlogItemId: string;
  workItemId: string;
  rank: number;
  status: string;
}

function makeComposer(assignee: string): ComposerState {
  return {
    title: "",
    type: "TASK",
    priority: "MEDIUM",
    assignee,
    dueAt: ""
  };
}

function summarizeMarkdown(markdown: string): string {
  const text = markdown
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/[#>*_[\]-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) {
    return "";
  }
  return text.length > 88 ? `${text.slice(0, 88)}...` : text;
}

function Lane({
  status,
  title,
  count,
  children,
  composerOpen,
  composer,
  onComposerChange,
  onComposerSubmit,
  onComposerCancel
}: {
  status: WorkItemStatus;
  title: string;
  count: number;
  children: ReactNode;
  composerOpen: boolean;
  composer: ComposerState;
  onComposerChange: (field: keyof ComposerState, value: string) => void;
  onComposerSubmit: (lane: WorkItemStatus) => void;
  onComposerCancel: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `lane-${status}`,
    data: { status, kind: "lane" }
  });

  return (
    <article className="orbit-notion-lane" ref={setNodeRef} data-over={isOver ? "true" : "false"}>
      <header className="orbit-notion-lane__header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3 className="orbit-notion-lane__title">{title}</h3>
          <span className="orbit-notion-lane__count">{count}</span>
        </div>
      </header>

      {composerOpen ? (
        <section className="orbit-panel orbit-notion-composer">
          <input
            className="orbit-input"
            placeholder="Task title..."
            value={composer.title}
            onChange={(event) => onComposerChange("title", event.target.value)}
          />
          <div className="orbit-notion-composer__meta">
            <select className="orbit-input" value={composer.type} onChange={(event) => onComposerChange("type", event.target.value)}>
              <option value="TASK">Task</option>
              <option value="STORY">Story</option>
              <option value="BUG">Bug</option>
              <option value="EPIC">Epic</option>
            </select>
            <select className="orbit-input" value={composer.priority} onChange={(event) => onComposerChange("priority", event.target.value)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <input className="orbit-input" placeholder="Assignee" value={composer.assignee} onChange={(event) => onComposerChange("assignee", event.target.value)} />
            <input className="orbit-input" type="date" value={composer.dueAt} onChange={(event) => onComposerChange("dueAt", event.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="orbit-button orbit-button--ghost" type="button" onClick={onComposerCancel}>
              Cancel
            </button>
            <button className="orbit-button" type="button" onClick={() => onComposerSubmit(status)}>
              Add
            </button>
          </div>
        </section>
      ) : null}

      <div className="orbit-notion-lane__cards">{children}</div>
    </article>
  );
}

function BoardCard({
  item,
  notePreview,
  inSprint,
  onOpen,
  isSelected,
  onMoveByKeyboard
}: {
  item: WorkItem;
  notePreview: string;
  inSprint: boolean;
  onOpen: (workItemId: string) => void;
  isSelected: boolean;
  onMoveByKeyboard: (workItemId: string, direction: "left" | "right") => void;
}) {
  const { attributes, listeners, setNodeRef: setDragNodeRef, transform, isDragging } = useDraggable({
    id: `item-${item.workItemId}`,
    data: {
      kind: "card",
      workItemId: item.workItemId,
      status: item.status
    }
  });
  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: `item-${item.workItemId}`,
    data: {
      kind: "card-target",
      workItemId: item.workItemId,
      status: item.status
    }
  });
  const setNodeRef = (node: HTMLElement | null) => {
    setDragNodeRef(node);
    setDropNodeRef(node);
  };

  return (
    <article
      ref={setNodeRef}
      className="orbit-panel orbit-notion-card orbit-animate-card"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onMoveByKeyboard(item.workItemId, "left");
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          onMoveByKeyboard(item.workItemId, "right");
        }
      }}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.42 : 1,
        borderColor: isOver ? "var(--orbit-accent)" : isSelected ? "var(--orbit-accent)" : undefined
      }}
    >
      <div className="orbit-notion-card__top orbit-notion-card__top--drag" aria-label={`Drag ${item.title}`} {...listeners} {...attributes}>
        <span className="orbit-notion-card__drag" aria-hidden>
          ::
        </span>
        <span className="orbit-notion-pill">{item.priority ?? "MEDIUM"}</span>
        {inSprint ? <span className="orbit-notion-pill">SPRINT</span> : null}
      </div>

      <button className="orbit-notion-card__body" type="button" onClick={() => onOpen(item.workItemId)}>
        <strong>{displayWorkItemTitle(item.title)}</strong>
        <div className="orbit-notion-card__meta">
          <span>{item.type}</span>
          <span>{item.assignee || "unassigned"}</span>
          <span>{item.dueAt ? new Date(item.dueAt).toLocaleDateString() : "No due date"}</span>
        </div>
        {notePreview ? <p className="orbit-notion-card__note">{notePreview}</p> : null}
      </button>
      <div className="orbit-notion-card__hint" aria-hidden>
        Move with keyboard ← →
      </div>
    </article>
  );
}

export function BoardPage() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId) ?? "member@orbit.local";
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const projectView = useProjectViewStore((state) => state.getContext(projectId));
  const setProjectView = useProjectViewStore((state) => state.setView);
  const setProjectFilter = useProjectViewStore((state) => state.setFilter);
  const setSelectedWorkItem = useProjectViewStore((state) => state.setSelectedWorkItem);
  const { activeSprint } = useActiveSprint(activeWorkspaceId, projectId);

  const { items, dependencyGraph, loading, error, mutation, createItem, updateStatus, updateItem, addDependency, loadActivity, archiveItem } = useWorkItems(projectId);

  const [composerLane, setComposerLane] = useState<WorkItemStatus | null>(null);
  const [composer, setComposer] = useState<ComposerState>(() => makeComposer(userId));
  const [showDependencyInspector, setShowDependencyInspector] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [sprintBacklog, setSprintBacklog] = useState<BacklogItemView[]>([]);
  const [sprintLoading, setSprintLoading] = useState(false);
  const [sprintError, setSprintError] = useState<string | null>(null);
  const sprintOnly = projectView.filters.sprintOnly;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 90, tolerance: 6 } })
  );

  const itemIndex = useMemo(() => {
    return Object.fromEntries(items.map((item) => [item.workItemId, item]));
  }, [items]);

  const selectedItem = selectedItemId ? itemIndex[selectedItemId] ?? null : null;
  const sprintBacklogMap = useMemo(() => {
    return new Map(
      sprintBacklog
        .filter((item) => item.status !== "REMOVED")
        .map((item) => [item.workItemId, item] as const)
    );
  }, [sprintBacklog]);
  const sprintDoneCount = useMemo(() => {
    return items.filter((item) => item.status === "DONE" && sprintBacklogMap.has(item.workItemId)).length;
  }, [items, sprintBacklogMap]);

  const filteredItems = useMemo(() => {
    const query = projectView.filters.query.trim().toLowerCase();
    const assignee = projectView.filters.assignee.trim().toLowerCase();
    const status = projectView.filters.status;
    return items.filter((item) => {
      if (query && !item.title.toLowerCase().includes(query)) {
        return false;
      }
      if (assignee && !(item.assignee ?? "").toLowerCase().includes(assignee)) {
        return false;
      }
      if (status !== "ALL" && item.status !== status) {
        return false;
      }
      if (sprintOnly && !sprintBacklogMap.has(item.workItemId)) {
        return false;
      }
      return true;
    });
  }, [items, projectView.filters.assignee, projectView.filters.query, projectView.filters.status, sprintBacklogMap, sprintOnly]);

  const filteredByStatus = useMemo(() => {
    const grouped: Record<WorkItemStatus, WorkItem[]> = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
      ARCHIVED: []
    };
    for (const item of filteredItems) {
      grouped[item.status].push(item);
    }
    return grouped;
  }, [filteredItems]);

  useEffect(() => {
    setProjectView(projectId, "board");
  }, [projectId, setProjectView]);

  useEffect(() => {
    if (selectedItemId && !itemIndex[selectedItemId]) {
      setSelectedItemId(null);
      setDetailOpen(false);
      setSelectedWorkItem(projectId, null);
    }
  }, [itemIndex, projectId, selectedItemId, setSelectedWorkItem]);

  useEffect(() => {
    if (!activeSprint?.sprintId) {
      setSprintBacklog([]);
      setSprintError(null);
      setProjectFilter(projectId, "sprintOnly", false);
      return;
    }
    let cancelled = false;
    setSprintLoading(true);
    setSprintError(null);
    request<BacklogItemView[]>(`/api/v2/sprints/${activeSprint.sprintId}/backlog-items`)
      .then((response) => {
        if (!cancelled) {
          setSprintBacklog(response);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setSprintError(e instanceof Error ? e.message : "Failed to load sprint backlog");
          setSprintBacklog([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSprintLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeSprint?.sprintId, projectId, setProjectFilter]);

  function openComposerFor(lane: WorkItemStatus) {
    setComposerLane(lane);
    setComposer((previous) => ({
      ...previous,
      title: "",
      assignee: previous.assignee || userId
    }));
    setLocalError(null);
  }

  function closeComposer() {
    setComposerLane(null);
    setComposer(makeComposer(userId));
  }

  function onComposerChange(field: keyof ComposerState, value: string) {
    setComposer((previous) => ({ ...previous, [field]: value }));
  }

  async function submitComposer(lane: WorkItemStatus) {
    if (!composer.title.trim()) {
      setLocalError("Title is required");
      return;
    }
    setLocalError(null);

    try {
      const created = await createItem({
        projectId,
        type: composer.type,
        title: composer.title.trim(),
        assignee: composer.assignee.trim() || undefined,
        dueAt: composer.dueAt || undefined,
        priority: composer.priority
      });

      if (lane !== "TODO") {
        await updateStatus(created.workItemId, lane);
      }

      setSelectedItemId(created.workItemId);
      setDetailOpen(true);
      closeComposer();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Failed to create task");
    }
  }

  async function onAddDependency(fromWorkItemId: string, toWorkItemId: string) {
    if (!fromWorkItemId || !toWorkItemId || fromWorkItemId === toWorkItemId) {
      setLocalError("Select two different tasks for dependency");
      return;
    }
    setLocalError(null);
    try {
      await addDependency(fromWorkItemId, { toWorkItemId, type: "FS" });
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Failed to create dependency");
    }
  }

  async function addItemToSprint(workItemId: string) {
    if (!activeSprint?.sprintId) {
      setLocalError("Create or select sprint first");
      return;
    }
    if (sprintBacklogMap.has(workItemId)) {
      return;
    }
    const nextRank = sprintBacklog.length > 0 ? Math.max(...sprintBacklog.map((entry) => entry.rank)) + 1 : 1;
    setSprintLoading(true);
    setLocalError(null);
    try {
      await request(`/api/v2/sprints/${activeSprint.sprintId}/backlog-items`, {
        method: "POST",
        body: {
          workItemId,
          rank: nextRank,
          status: "READY"
        }
      });
      const refreshed = await request<BacklogItemView[]>(`/api/v2/sprints/${activeSprint.sprintId}/backlog-items`);
      setSprintBacklog(refreshed);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Failed to add item to sprint");
    } finally {
      setSprintLoading(false);
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id ?? "");
    const overId = String(event.over?.id ?? "");
    if (!activeId.startsWith("item-")) {
      return;
    }
    const workItemId = activeId.replace("item-", "");
    const current = itemIndex[workItemId];
    if (!current) {
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
      return;
    }
    await updateStatus(workItemId, nextStatus);
  }

  function statusByDirection(current: WorkItemStatus, direction: "left" | "right"): WorkItemStatus {
    const order: WorkItemStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
    const currentIndex = order.indexOf(current);
    if (currentIndex < 0) {
      return current;
    }
    if (direction === "left") {
      return order[Math.max(0, currentIndex - 1)];
    }
    return order[Math.min(order.length - 1, currentIndex + 1)];
  }

  async function moveByKeyboard(workItemId: string, direction: "left" | "right") {
    const current = itemIndex[workItemId];
    if (!current) {
      return;
    }
    const next = statusByDirection(current.status, direction);
    if (next === current.status) {
      return;
    }
    await updateStatus(workItemId, next);
  }

  function openDetails(workItemId: string) {
    setSelectedItemId(workItemId);
    setSelectedWorkItem(projectId, workItemId);
    setDetailOpen(true);
  }

  return (
    <section className="orbit-notion-layout">
      <ProjectViewTabs />
      <ProjectFilterBar
        title="Task Database"
        subtitle="Board view shares the same query context with table, timeline, calendar, and dashboard."
      />
      <section className="orbit-notion-toolbar">
        <div className="orbit-notion-toolbar__head">
          <h2 style={{ margin: 0 }}>Board Operations</h2>
          <div className="orbit-notion-toolbar__actions">
            <button className="orbit-button" type="button" onClick={() => openComposerFor("TODO")}>
              + New Task
            </button>
            <button
              className="orbit-button orbit-button--ghost"
              type="button"
              onClick={() => setShowDependencyInspector((value) => !value)}
              disabled={!selectedItemId}
            >
              {showDependencyInspector ? "Hide Dependencies" : "Dependencies"}
            </button>
            <button
              className="orbit-button orbit-button--ghost"
              type="button"
              onClick={() => setDetailOpen((value) => !value)}
              disabled={!selectedItem}
            >
              {detailOpen ? "Hide Detail" : "Show Detail"}
            </button>
          </div>
        </div>
        {activeSprint ? (
          <div className="orbit-notion-toolbar__meta">
            <span>
              {activeSprint.name} · {activeSprint.startDate} ~ {activeSprint.endDate}
            </span>
            <span>
              Backlog {sprintBacklog.length} · Done {sprintDoneCount}
            </span>
            <button
              className="orbit-button orbit-button--ghost"
              type="button"
              onClick={() => setProjectFilter(projectId, "sprintOnly", !sprintOnly)}
            >
              {sprintOnly ? "All Tasks" : "Sprint Only"}
            </button>
            <button className="orbit-button orbit-button--ghost" type="button" onClick={() => navigate("/app/sprint")}>
              Open Sprint
            </button>
            <button className="orbit-button orbit-button--ghost" type="button" onClick={() => navigate("/app/insights")}>
              Open AI Evaluation
            </button>
          </div>
        ) : (
          <div className="orbit-notion-toolbar__meta">
            <span>No active sprint selected</span>
            <button className="orbit-button orbit-button--ghost" type="button" onClick={() => navigate("/app/sprint")}>
              Create Sprint
            </button>
          </div>
        )}
        {loading ? <p style={{ margin: 0 }}>Loading tasks...</p> : null}
        {error ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{error}</p> : null}
        {mutation.error ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{mutation.error}</p> : null}
        {sprintError ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{sprintError}</p> : null}
        {localError ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{localError}</p> : null}
      </section>

      <div className="orbit-notion-main">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          accessibility={{
            announcements: {
              onDragStart: () => "",
              onDragOver: () => "",
              onDragEnd: () => "",
              onDragCancel: () => ""
            }
          }}
          onDragEnd={onDragEnd}
        >
          <section className="orbit-notion-board" aria-label="Kanban board">
            {FLOW_LANES.map((lane) => (
              <Lane
                key={lane.status}
                status={lane.status}
                title={lane.title}
                count={filteredByStatus[lane.status].length}
                composerOpen={composerLane === lane.status}
                composer={composer}
                onComposerChange={onComposerChange}
                onComposerSubmit={submitComposer}
                onComposerCancel={closeComposer}
              >
                {filteredByStatus[lane.status].map((item) => (
                  <BoardCard
                    key={item.workItemId}
                    item={item}
                    inSprint={sprintBacklogMap.has(item.workItemId)}
                    isSelected={selectedItemId === item.workItemId}
                    notePreview={summarizeMarkdown(item.markdownBody ?? "")}
                    onOpen={openDetails}
                    onMoveByKeyboard={moveByKeyboard}
                  />
                ))}
              </Lane>
            ))}
          </section>
        </DndContext>

        {detailOpen && selectedItem ? (
          <WorkItemDetailPanel
            item={selectedItem}
            sprintLabel={activeSprint?.name ?? null}
            sprintStateLabel={
              activeSprint
                ? `${activeSprint.startDate} ~ ${activeSprint.endDate}`
                : null
            }
            canAddToSprint={!sprintBacklogMap.has(selectedItem.workItemId)}
            sprintLoading={sprintLoading}
            onAddToSprint={() => addItemToSprint(selectedItem.workItemId)}
            onClose={() => setDetailOpen(false)}
            onArchive={() => archiveItem(selectedItem.workItemId)}
            onUpdateStatus={(status) => updateStatus(selectedItem.workItemId, status)}
            onPatch={(patch) => updateItem(selectedItem.workItemId, patch)}
            onLoadActivity={loadActivity}
          />
        ) : null}
      </div>

      <DependencyInspectorPanel
        open={showDependencyInspector}
        selectedWorkItemId={selectedItemId}
        items={items}
        edges={dependencyGraph.edges}
        onClose={() => setShowDependencyInspector(false)}
        onAddDependency={onAddDependency}
      />

      {filteredByStatus.ARCHIVED.length > 0 ? (
        <section className="orbit-notion-archive">
          <h3 style={{ marginTop: 0 }}>Archived</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {filteredByStatus.ARCHIVED.map((item) => (
              <button
                key={item.workItemId}
                type="button"
                onClick={() => {
                  setSelectedItemId(item.workItemId);
                  updateStatus(item.workItemId, "TODO");
                }}
                className="orbit-panel orbit-notion-archive-item"
              >
                <strong>{displayWorkItemTitle(item.title)}</strong>
                <span style={{ color: "var(--orbit-text-subtle)", fontSize: 12 }}>Click to restore to TODO</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

import { type ReactNode, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  DndContext,
  type DragEndEvent,
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
import { useWorkItemNotes } from "@/features/workitems/hooks/useWorkItemNotes";
import { type WorkItem, type WorkItemPriority, type WorkItemStatus, type WorkItemType, useWorkItems } from "@/features/workitems/hooks/useWorkItems";

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
  onOpenComposer,
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
  onOpenComposer: (lane: WorkItemStatus) => void;
  onComposerChange: (field: keyof ComposerState, value: string) => void;
  onComposerSubmit: (lane: WorkItemStatus) => void;
  onComposerCancel: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `lane-${status}`,
    data: { status, kind: "lane" }
  });

  return (
    <article className="orbit-card orbit-notion-lane" ref={setNodeRef} data-over={isOver ? "true" : "false"}>
      <header className="orbit-notion-lane__header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h3 className="orbit-notion-lane__title">{title}</h3>
          <span className="orbit-notion-lane__count">{count}</span>
        </div>
        <button className="orbit-button orbit-button--ghost orbit-notion-lane__new" type="button" onClick={() => onOpenComposer(status)}>
          + New
        </button>
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
  onOpen,
  onArchive
}: {
  item: WorkItem;
  notePreview: string;
  onOpen: (workItemId: string) => void;
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
    <article
      ref={setNodeRef}
      className="orbit-panel orbit-notion-card orbit-animate-card"
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.42 : 1
      }}
    >
      <div className="orbit-notion-card__top">
        <button
          className="orbit-notion-card__drag"
          type="button"
          onClick={(event) => event.stopPropagation()}
          aria-label={`Drag ${item.title}`}
          {...listeners}
          {...attributes}
        >
          ::
        </button>
        <span className="orbit-notion-pill">{item.priority ?? "MEDIUM"}</span>
      </div>

      <button className="orbit-notion-card__body" type="button" onClick={() => onOpen(item.workItemId)}>
        <strong>{item.title}</strong>
        <div className="orbit-notion-card__meta">
          <span>{item.type}</span>
          <span>{item.assignee || "unassigned"}</span>
          <span>{item.dueAt ? new Date(item.dueAt).toLocaleDateString() : "No due date"}</span>
        </div>
        {notePreview ? <p className="orbit-notion-card__note">{notePreview}</p> : null}
      </button>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="orbit-button orbit-button--ghost orbit-notion-card__archive" type="button" onClick={() => onArchive(item.workItemId)}>
          Archive
        </button>
      </div>
    </article>
  );
}

function OverlayCard({ title }: { title: string }) {
  return (
    <div className="orbit-panel orbit-notion-overlay">
      <strong>{title}</strong>
    </div>
  );
}

export function BoardPage() {
  const userId = useAuthStore((state) => state.userId) ?? "member@orbit.local";
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));

  const { byStatus, items, loading, error, mutation, createItem, updateStatus, addDependency, archiveItem } = useWorkItems(projectId);
  const { notes, getNote, setNote } = useWorkItemNotes(activeWorkspaceId, projectId);

  const [composerLane, setComposerLane] = useState<WorkItemStatus | null>(null);
  const [composer, setComposer] = useState<ComposerState>(() => makeComposer(userId));
  const [dependencyFrom, setDependencyFrom] = useState("");
  const [dependencyTo, setDependencyTo] = useState("");
  const [showDependencyTools, setShowDependencyTools] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteMode, setNoteMode] = useState<"edit" | "preview">("edit");
  const [noteDirty, setNoteDirty] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [draggingTitle, setDraggingTitle] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 8 } })
  );

  const itemIndex = useMemo(() => {
    return Object.fromEntries(items.map((item) => [item.workItemId, item]));
  }, [items]);

  const selectedItem = selectedItemId ? itemIndex[selectedItemId] ?? null : null;

  useEffect(() => {
    if (!selectedItemId && items.length > 0) {
      setSelectedItemId(items[0].workItemId);
      return;
    }
    if (selectedItemId && !itemIndex[selectedItemId] && items.length > 0) {
      setSelectedItemId(items[0].workItemId);
      return;
    }
    if (selectedItemId && !itemIndex[selectedItemId] && items.length === 0) {
      setSelectedItemId(null);
    }
  }, [items, itemIndex, selectedItemId]);

  useEffect(() => {
    if (!selectedItemId) {
      setNoteDraft("");
      setNoteDirty(false);
      return;
    }
    setNoteDraft(getNote(selectedItemId));
    setNoteDirty(false);
  }, [selectedItemId, getNote]);

  useEffect(() => {
    if (!selectedItemId || !noteDirty) {
      return;
    }
    const timer = window.setTimeout(() => {
      setNote(selectedItemId, noteDraft);
      setNoteDirty(false);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [selectedItemId, noteDraft, noteDirty, setNote]);

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
      closeComposer();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Failed to create task");
    }
  }

  async function onAddDependency() {
    if (!dependencyFrom || !dependencyTo || dependencyFrom === dependencyTo) {
      setLocalError("Select two different tasks for dependency");
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
    } finally {
      setDraggingTitle(null);
    }
  }

  return (
    <section className="orbit-notion-layout">
      <article className="orbit-card orbit-notion-toolbar">
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 6 }}>Task Database</h2>
          <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>
            Notion-style kanban workflow with click-to-open details and markdown notes.
          </p>
        </div>
        <div className="orbit-notion-toolbar__actions">
          <button className="orbit-button" type="button" onClick={() => openComposerFor("TODO")}>
            + New Task
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={() => setShowDependencyTools((value) => !value)}>
            Dependencies
          </button>
        </div>
        {showDependencyTools ? (
          <div className="orbit-notion-toolbar__dependencies">
            <select className="orbit-input" value={dependencyFrom} onChange={(event) => setDependencyFrom(event.target.value)}>
              <option value="">From task...</option>
              {items.map((item) => (
                <option key={item.workItemId} value={item.workItemId}>
                  {item.title}
                </option>
              ))}
            </select>
            <select className="orbit-input" value={dependencyTo} onChange={(event) => setDependencyTo(event.target.value)}>
              <option value="">To task...</option>
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
        ) : null}
        {loading ? <p style={{ margin: 0 }}>Loading tasks...</p> : null}
        {error ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{error}</p> : null}
        {mutation.error ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{mutation.error}</p> : null}
        {localError ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{localError}</p> : null}
      </article>

      <div className="orbit-notion-main">
        <DndContext
          sensors={sensors}
          onDragStart={(event) => {
            const workItemId = String(event.active.id).replace("item-", "");
            setDraggingTitle(itemIndex[workItemId]?.title ?? null);
          }}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDraggingTitle(null)}
        >
          <section className="orbit-notion-board" aria-label="Kanban board">
            {FLOW_LANES.map((lane) => (
              <Lane
                key={lane.status}
                status={lane.status}
                title={lane.title}
                count={byStatus[lane.status].length}
                composerOpen={composerLane === lane.status}
                composer={composer}
                onOpenComposer={openComposerFor}
                onComposerChange={onComposerChange}
                onComposerSubmit={submitComposer}
                onComposerCancel={closeComposer}
              >
                {byStatus[lane.status].map((item) => (
                  <BoardCard
                    key={item.workItemId}
                    item={item}
                    notePreview={summarizeMarkdown(notes[item.workItemId] ?? "")}
                    onOpen={setSelectedItemId}
                    onArchive={archiveItem}
                  />
                ))}
              </Lane>
            ))}
          </section>
          <DragOverlay>{draggingTitle ? <OverlayCard title={draggingTitle} /> : null}</DragOverlay>
        </DndContext>

        <aside className="orbit-card orbit-notion-detail">
          {selectedItem ? (
            <>
              <header className="orbit-notion-detail__header">
                <p className="orbit-notion-detail__label">Page</p>
                <h3>{selectedItem.title}</h3>
              </header>
              <div className="orbit-notion-detail__meta">
                <span className="orbit-notion-pill">{selectedItem.type}</span>
                <span className="orbit-notion-pill">{selectedItem.priority ?? "MEDIUM"}</span>
                <span className="orbit-notion-pill">{selectedItem.assignee || "unassigned"}</span>
              </div>
              <div className="orbit-notion-detail__actions">
                <select
                  className="orbit-input"
                  value={selectedItem.status}
                  onChange={(event) => updateStatus(selectedItem.workItemId, event.target.value as WorkItemStatus)}
                >
                  <option value="TODO">TODO</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="REVIEW">REVIEW</option>
                  <option value="DONE">DONE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
                <button className="orbit-button orbit-button--ghost" type="button" onClick={() => archiveItem(selectedItem.workItemId)}>
                  Archive
                </button>
              </div>

              <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
                Due date: {selectedItem.dueAt ? new Date(selectedItem.dueAt).toLocaleDateString() : "Not set"}
              </div>

              <section className="orbit-notion-markdown">
                <div className="orbit-notion-markdown__tabs">
                  <button
                    className={`orbit-button orbit-button--ghost${noteMode === "edit" ? " is-active" : ""}`}
                    type="button"
                    onClick={() => setNoteMode("edit")}
                  >
                    Edit
                  </button>
                  <button
                    className={`orbit-button orbit-button--ghost${noteMode === "preview" ? " is-active" : ""}`}
                    type="button"
                    onClick={() => setNoteMode("preview")}
                  >
                    Preview
                  </button>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--orbit-text-subtle)" }}>
                    {noteDirty ? "Saving..." : "Saved"}
                  </span>
                </div>
                {noteMode === "edit" ? (
                  <textarea
                    className="orbit-input orbit-notion-markdown__editor"
                    value={noteDraft}
                    onChange={(event) => {
                      setNoteDraft(event.target.value);
                      setNoteDirty(true);
                    }}
                    placeholder={"# Notes\n- Write with markdown\n- Use checklists\n\n```ts\nconsole.log('hello');\n```"}
                  />
                ) : (
                  <div className="orbit-panel orbit-markdown-preview">
                    {noteDraft.trim().length > 0 ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{noteDraft}</ReactMarkdown>
                    ) : (
                      <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>No markdown notes yet.</p>
                    )}
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="orbit-panel" style={{ padding: 12 }}>
              <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>
                Select a card to open page-style details and markdown editor.
              </p>
            </div>
          )}
        </aside>
      </div>

      {byStatus.ARCHIVED.length > 0 ? (
        <article className="orbit-card" style={{ padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>Archived</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {byStatus.ARCHIVED.map((item) => (
              <button
                key={item.workItemId}
                type="button"
                onClick={() => {
                  setSelectedItemId(item.workItemId);
                  updateStatus(item.workItemId, "TODO");
                }}
                className="orbit-panel orbit-notion-archive-item"
              >
                <strong>{item.title}</strong>
                <span style={{ color: "var(--orbit-text-subtle)", fontSize: 12 }}>Click to restore to TODO</span>
              </button>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  );
}

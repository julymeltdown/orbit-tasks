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
import { useLocation, useNavigate } from "react-router-dom";
import { request } from "@/lib/http/client";
import { useProjectStore } from "@/stores/projectStore";
import { useProjectViewStore } from "@/stores/projectViewStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useAuthStore } from "@/stores/authStore";
import { useActiveSprint } from "@/features/agile/hooks/useActiveSprint";
import { displayWorkItemTitle } from "@/features/workitems/display";
import { type WorkItem, type WorkItemPriority, type WorkItemStatus, type WorkItemType, useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import { ProjectViewTabs } from "@/components/projects/ProjectViewTabs";
import { ProjectFilterBar } from "@/components/projects/ProjectFilterBar";
import { DependencyInspectorPanel } from "@/components/projects/DependencyInspectorPanel";
import { WorkItemDetailPanel } from "@/components/projects/WorkItemDetailPanel";
import { EmptyStateCard } from "@/components/common/EmptyStateCard";
import { getGuidedEmptyState } from "@/features/activation/emptyStateRegistry";
import { trackActivationEvent } from "@/lib/telemetry/activationEvents";

const FLOW_LANES: Array<{ status: WorkItemStatus; title: string }> = [
  { status: "TODO", title: "Backlog" },
  { status: "IN_PROGRESS", title: "In Progress" },
  { status: "REVIEW", title: "Review" },
  { status: "DONE", title: "Done" }
];

interface ComposerState {
  title: string;
  status: WorkItemStatus;
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

function makeComposer(): ComposerState {
  return {
    title: "",
    status: "TODO",
    type: "TASK",
    priority: "MEDIUM",
    assignee: "",
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
  onQuickAdd
}: {
  status: WorkItemStatus;
  title: string;
  count: number;
  children: ReactNode;
  onQuickAdd: (lane: WorkItemStatus) => void;
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
        <button className="orbit-lane-add-button" type="button" onClick={() => onQuickAdd(status)} aria-label={`${title} quick add`}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </header>

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

function CreateTaskPanel({
  open,
  composer,
  showAdvancedFields,
  onComposerChange,
  onToggleAdvancedFields,
  onSubmit,
  onClose
}: {
  open: boolean;
  composer: ComposerState;
  showAdvancedFields: boolean;
  onComposerChange: (field: keyof ComposerState, value: string) => void;
  onToggleAdvancedFields: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <article className="orbit-board-create-panel">
      <header className="orbit-board-create-panel__head">
        <h3 style={{ margin: 0 }}>새 작업 만들기</h3>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onClose}>
          닫기
        </button>
      </header>
      <input
        className="orbit-input"
        placeholder="작업 제목"
        value={composer.title}
        onChange={(event) => onComposerChange("title", event.target.value)}
      />
      <button className="orbit-button orbit-button--ghost" type="button" onClick={onToggleAdvancedFields}>
        {showAdvancedFields ? "상세 입력 닫기" : "상세 입력"}
      </button>
      {showAdvancedFields ? (
        <div className="orbit-board-create-panel__grid">
          <select className="orbit-input" value={composer.status} onChange={(event) => onComposerChange("status", event.target.value)}>
            <option value="TODO">Backlog</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="DONE">Done</option>
          </select>
          <select className="orbit-input" value={composer.type} onChange={(event) => onComposerChange("type", event.target.value)}>
            <option value="TASK">작업</option>
            <option value="STORY">스토리</option>
            <option value="BUG">버그</option>
            <option value="EPIC">에픽</option>
          </select>
          <select className="orbit-input" value={composer.priority} onChange={(event) => onComposerChange("priority", event.target.value)}>
            <option value="LOW">낮음</option>
            <option value="MEDIUM">보통</option>
            <option value="HIGH">높음</option>
            <option value="CRITICAL">치명적</option>
          </select>
          <input className="orbit-input" placeholder="담당자" value={composer.assignee} onChange={(event) => onComposerChange("assignee", event.target.value)} />
          <input className="orbit-input" type="date" value={composer.dueAt} onChange={(event) => onComposerChange("dueAt", event.target.value)} />
        </div>
      ) : null}
      <div className="orbit-board-create-panel__actions">
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onClose}>
          취소
        </button>
        <button className="orbit-button" type="button" onClick={onSubmit}>
          추가
        </button>
      </div>
    </article>
  );
}

export function BoardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const userId = useAuthStore((state) => state.userId) ?? "member@orbit.local";
  const projectId = useProjectStore((state) => state.getProjectId(activeWorkspaceId));
  const projectView = useProjectViewStore((state) => state.getContext(projectId));
  const setProjectView = useProjectViewStore((state) => state.setView);
  const setProjectFilter = useProjectViewStore((state) => state.setFilter);
  const setSelectedWorkItem = useProjectViewStore((state) => state.setSelectedWorkItem);
  const { activeSprint } = useActiveSprint(activeWorkspaceId, projectId);

  const { items, dependencyGraph, loading, error, mutation, createItem, updateStatus, updateItem, addDependency, loadActivity, archiveItem } = useWorkItems(projectId);

  const [composerOpen, setComposerOpen] = useState(false);
  const [composer, setComposer] = useState<ComposerState>(() => makeComposer());
  const [sideMode, setSideMode] = useState<"idle" | "create" | "detail" | "dependency">("idle");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [boardInteractionSent, setBoardInteractionSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [sprintBacklog, setSprintBacklog] = useState<BacklogItemView[]>([]);
  const [sprintLoading, setSprintLoading] = useState(false);
  const [sprintError, setSprintError] = useState<string | null>(null);
  const sprintOnly = projectView.filters.sprintOnly;
  const boardEmptyState = getGuidedEmptyState("BOARD");
  const sprintEmptyState = getGuidedEmptyState("SPRINT");

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
  const blockedCount = useMemo(
    () => filteredItems.filter((item) => item.status !== "DONE" && item.status !== "ARCHIVED" && Boolean(item.blockedReason?.trim())).length,
    [filteredItems]
  );
  const dueSoonCount = useMemo(() => {
    const now = Date.now();
    const threshold = now + 2 * 24 * 60 * 60 * 1000;
    return filteredItems.filter((item) => {
      if (!item.dueAt || item.status === "DONE" || item.status === "ARCHIVED") {
        return false;
      }
      const due = new Date(item.dueAt).getTime();
      return Number.isFinite(due) && due <= threshold;
    }).length;
  }, [filteredItems]);

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
    const params = new URLSearchParams(location.search);
    if (params.get("create") === "1") {
      setComposerOpen(true);
      setShowAdvancedFields(false);
    }
  }, [location.search]);

  useEffect(() => {
    if (selectedItemId && !itemIndex[selectedItemId]) {
      setSelectedItemId(null);
      setSideMode("idle");
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
    setComposerOpen(true);
    setSideMode("create");
    setShowAdvancedFields(false);
    setComposer((previous) => ({
      ...previous,
      title: "",
      status: lane,
      assignee: "",
      dueAt: ""
    }));
    setLocalError(null);
  }

  function closeComposer() {
    setComposerOpen(false);
    setShowAdvancedFields(false);
    setComposer(makeComposer());
    setSideMode(selectedItem ? "detail" : "idle");
  }

  function onComposerChange(field: keyof ComposerState, value: string) {
    setComposer((previous) => ({ ...previous, [field]: value }));
  }

  async function emitActivationEvent(eventType: "FIRST_TASK_CREATED" | "BOARD_FIRST_INTERACTION" | "EMPTY_STATE_ACTION_CLICKED", metadata?: Record<string, unknown>) {
    if (!activeWorkspaceId) {
      return;
    }
    await trackActivationEvent({
      workspaceId: activeWorkspaceId,
      projectId,
      userId,
      eventType,
      route: "/app/projects/board",
      metadata
    });
  }

  async function submitComposer() {
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

      if (composer.status !== "TODO") {
        await updateStatus(created.workItemId, composer.status);
      }

      setSelectedItemId(created.workItemId);
      setSideMode("detail");
      await emitActivationEvent("FIRST_TASK_CREATED", {
        workItemId: created.workItemId,
        status: composer.status
      });
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
    if (!boardInteractionSent) {
      setBoardInteractionSent(true);
      await emitActivationEvent("BOARD_FIRST_INTERACTION", { mode: "drag", workItemId });
    }
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
    if (!boardInteractionSent) {
      setBoardInteractionSent(true);
      await emitActivationEvent("BOARD_FIRST_INTERACTION", { mode: "keyboard", workItemId });
    }
  }

  function openDetails(workItemId: string) {
    setSelectedItemId(workItemId);
    setSelectedWorkItem(projectId, workItemId);
    setSideMode("detail");
    if (!boardInteractionSent) {
      setBoardInteractionSent(true);
      emitActivationEvent("BOARD_FIRST_INTERACTION", { mode: "open_detail", workItemId }).catch(() => undefined);
    }
  }

  return (
    <section className="orbit-notion-layout">
      <ProjectViewTabs />
      <ProjectFilterBar title="작업 보드" />
      <section className="orbit-board-focus-strip">
        <article className="orbit-board-focus-strip__metric">
          <strong>현재 scope</strong>
          <span>{sprintOnly && activeSprint ? `${activeSprint.name}만 보기` : "프로젝트 전체 보기"}</span>
        </article>
        <article className="orbit-board-focus-strip__metric">
          <strong>가시 작업</strong>
          <span>{filteredItems.length}개</span>
        </article>
        <article className="orbit-board-focus-strip__metric">
          <strong>긴급 차단</strong>
          <span>{blockedCount}개</span>
        </article>
        <article className="orbit-board-focus-strip__metric">
          <strong>기한 임박</strong>
          <span>{dueSoonCount}개</span>
        </article>
      </section>
      <section className="orbit-notion-toolbar">
        <div className="orbit-notion-toolbar__head">
          <div className="orbit-notion-toolbar__summary">
            <h2 style={{ margin: 0 }}>오늘 처리할 실행 작업</h2>
            <p style={{ margin: 0 }}>상태 이동은 보드에서, 세부 결정은 오른쪽 컨텍스트 패널에서 처리합니다.</p>
          </div>
          <div className="orbit-notion-toolbar__actions">
            <button className="orbit-button" type="button" onClick={() => openComposerFor("TODO")}>
              + 새 작업
            </button>
            <button className="orbit-button orbit-button--ghost" type="button" onClick={() => navigate("/app/insights")}>
              AI 평가 보기
            </button>
          </div>
        </div>
        {activeSprint ? (
          <div className="orbit-notion-toolbar__meta">
            <span>
              {activeSprint.name} · {activeSprint.startDate} ~ {activeSprint.endDate}
            </span>
            <span>
              백로그 {sprintBacklog.length} · 완료 {sprintDoneCount}
            </span>
            <button
              className="orbit-button orbit-button--ghost"
              type="button"
              onClick={() => setProjectFilter(projectId, "sprintOnly", !sprintOnly)}
            >
              {sprintOnly ? "전체 보기" : "스프린트만"}
            </button>
            <button className="orbit-button orbit-button--ghost" type="button" onClick={() => navigate("/app/sprint")}>
              스프린트 열기
            </button>
          </div>
        ) : null}
        {loading ? <p style={{ margin: 0 }}>Loading tasks...</p> : null}
        {error ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{error}</p> : null}
        {mutation.error ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{mutation.error}</p> : null}
        {sprintError ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{sprintError}</p> : null}
        {localError ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{localError}</p> : null}
      </section>

      {!activeSprint ? (
        <EmptyStateCard
          title={sprintEmptyState.title}
          description={sprintEmptyState.description}
          statusHint={sprintEmptyState.statusHint}
          actions={[
            {
              label: sprintEmptyState.primaryAction.label,
              onClick: () => {
                emitActivationEvent("EMPTY_STATE_ACTION_CLICKED", { scope: "SPRINT", action: "create_sprint" }).catch(() => undefined);
                navigate(sprintEmptyState.primaryAction.path);
              }
            }
          ]}
          secondaryActions={(sprintEmptyState.secondaryActions ?? []).map((action) => ({
            label: action.label,
            variant: "ghost",
            onClick: () => navigate(action.path)
          }))}
        />
      ) : null}

      <div className="orbit-notion-main">
        <section className="orbit-notion-board-wrap">
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
                  onQuickAdd={openComposerFor}
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
          {!loading && filteredItems.length === 0 ? (
            <EmptyStateCard
              title={boardEmptyState.title}
              description={boardEmptyState.description}
              statusHint={boardEmptyState.statusHint}
              actions={[
                {
                  label: boardEmptyState.primaryAction.label,
                  onClick: () => {
                    emitActivationEvent("EMPTY_STATE_ACTION_CLICKED", { scope: "BOARD", action: "create_first_task" }).catch(() => undefined);
                    openComposerFor("TODO");
                  }
                }
              ]}
              secondaryActions={(boardEmptyState.secondaryActions ?? []).map((action) => ({
                label: action.label,
                variant: "ghost",
                onClick: () => {
                  emitActivationEvent("EMPTY_STATE_ACTION_CLICKED", {
                    scope: "BOARD",
                    action: action.label
                  }).catch(() => undefined);
                  navigate(action.path);
                }
              }))}
              learnMoreHref="/app/insights"
              learnMoreLabel="Learn how flow works"
            />
          ) : null}
        </section>

        <aside className="orbit-board-side">
          <CreateTaskPanel
            open={composerOpen && sideMode === "create"}
            composer={composer}
            showAdvancedFields={showAdvancedFields}
            onComposerChange={onComposerChange}
            onToggleAdvancedFields={() => setShowAdvancedFields((value) => !value)}
            onSubmit={submitComposer}
            onClose={closeComposer}
          />

          {sideMode !== "create" && selectedItem ? (
            <>
              <div className="orbit-board-side__toolbar">
                <button
                  className="orbit-button orbit-button--ghost"
                  type="button"
                  onClick={() => setSideMode((current) => (current === "dependency" ? "detail" : "dependency"))}
                >
                  {sideMode === "dependency" ? "상세 보기" : "의존성 보기"}
                </button>
              </div>
              {sideMode === "dependency" ? (
                <DependencyInspectorPanel
                  open
                  selectedWorkItemId={selectedItemId}
                  items={items}
                  edges={dependencyGraph.edges}
                  onClose={() => setSideMode("detail")}
                  onAddDependency={onAddDependency}
                />
              ) : (
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
                  onClose={() => setSideMode("idle")}
                  onArchive={() => archiveItem(selectedItem.workItemId)}
                  onUpdateStatus={(status) => updateStatus(selectedItem.workItemId, status)}
                  onPatch={(patch) => updateItem(selectedItem.workItemId, patch)}
                  onLoadActivity={loadActivity}
                />
              )}
            </>
          ) : sideMode !== "create" ? (
            <article className="orbit-board-side__placeholder">
              <h3 style={{ margin: 0 }}>작업을 선택하거나 새로 만드세요</h3>
              <p style={{ margin: 0 }}>
                왼쪽 보드에서는 상태를 움직이고, 오른쪽에서는 세부 결정과 의존성 점검을 처리합니다.
              </p>
            </article>
          ) : null}
        </aside>
      </div>

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

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { WorkItem, WorkItemActivity, WorkItemPriority, WorkItemStatus } from "@/features/workitems/types";
import { displayWorkItemTitle } from "@/features/workitems/display";

interface PatchInput {
  title?: string;
  assignee?: string | null;
  dueAt?: string | null;
  priority?: WorkItemPriority | null;
  estimateMinutes?: number | null;
  blockedReason?: string | null;
  markdownBody?: string | null;
}

interface Props {
  item: WorkItem;
  sprintLabel: string | null;
  sprintStateLabel: string | null;
  canAddToSprint: boolean;
  sprintLoading: boolean;
  onAddToSprint: () => void;
  onClose: () => void;
  onArchive: () => Promise<unknown> | void;
  onUpdateStatus: (status: WorkItemStatus) => Promise<unknown> | void;
  onPatch: (patch: PatchInput) => Promise<unknown> | void;
  onLoadActivity: (workItemId: string) => Promise<WorkItemActivity[]>;
}

function normalizeDateInput(value: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function toNullableNumber(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed);
}

export function WorkItemDetailPanel({
  item,
  sprintLabel,
  sprintStateLabel,
  canAddToSprint,
  sprintLoading,
  onAddToSprint,
  onClose,
  onArchive,
  onUpdateStatus,
  onPatch,
  onLoadActivity
}: Props) {
  const [title, setTitle] = useState(item.title);
  const [assignee, setAssignee] = useState(item.assignee ?? "");
  const [dueAt, setDueAt] = useState(normalizeDateInput(item.dueAt));
  const [priority, setPriority] = useState<WorkItemPriority>(item.priority ?? "MEDIUM");
  const [estimateMinutes, setEstimateMinutes] = useState(item.estimateMinutes?.toString() ?? "");
  const [blockedReason, setBlockedReason] = useState(item.blockedReason ?? "");
  const [markdownBody, setMarkdownBody] = useState(item.markdownBody ?? "");
  const [noteMode, setNoteMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activities, setActivities] = useState<WorkItemActivity[]>([]);

  useEffect(() => {
    setTitle(item.title);
    setAssignee(item.assignee ?? "");
    setDueAt(normalizeDateInput(item.dueAt));
    setPriority(item.priority ?? "MEDIUM");
    setEstimateMinutes(item.estimateMinutes == null ? "" : String(item.estimateMinutes));
    setBlockedReason(item.blockedReason ?? "");
    setMarkdownBody(item.markdownBody ?? "");
    setSaveError(null);
  }, [item]);

  useEffect(() => {
    let cancelled = false;
    onLoadActivity(item.workItemId)
      .then((next) => {
        if (!cancelled) {
          setActivities(next);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setActivities([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [item.workItemId, onLoadActivity]);

  const dueText = useMemo(() => {
    if (!item.dueAt) {
      return "Not set";
    }
    return new Date(item.dueAt).toLocaleDateString();
  }, [item.dueAt]);

  async function savePatch() {
    setSaving(true);
    setSaveError(null);
    try {
      await onPatch({
        title: title.trim() || item.title,
        assignee: assignee.trim() || null,
        dueAt: dueAt || null,
        priority,
        estimateMinutes: toNullableNumber(estimateMinutes),
        blockedReason: blockedReason.trim() || null,
        markdownBody: markdownBody.trim() || null
      });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="orbit-card orbit-notion-detail">
      <header className="orbit-notion-detail__header">
        <p className="orbit-notion-detail__label">Detail</p>
        <div className="orbit-notion-detail__head-row">
          <h3>{displayWorkItemTitle(item.title)}</h3>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </header>
      <div className="orbit-notion-detail__meta">
        <span className="orbit-notion-pill">{item.type}</span>
        <span className="orbit-notion-pill">{item.priority ?? "MEDIUM"}</span>
        <span className="orbit-notion-pill">{item.assignee || "unassigned"}</span>
      </div>
      <div className="orbit-notion-detail__actions">
        <select
          className="orbit-input"
          value={item.status}
          onChange={(event) => onUpdateStatus(event.target.value as WorkItemStatus)}
        >
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="REVIEW">REVIEW</option>
          <option value="DONE">DONE</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onArchive}>
          Archive
        </button>
      </div>
      <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>Due date: {dueText}</div>
      {sprintLabel ? (
        <div className="orbit-panel orbit-notion-sprint-inline">
          <div>
            <strong style={{ fontSize: 13 }}>{sprintLabel}</strong>
            {sprintStateLabel ? (
              <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{sprintStateLabel}</div>
            ) : null}
          </div>
          {canAddToSprint ? (
            <button className="orbit-button orbit-button--ghost" type="button" onClick={onAddToSprint} disabled={sprintLoading}>
              Add To Sprint
            </button>
          ) : (
            <span className="orbit-notion-pill">In Sprint</span>
          )}
        </div>
      ) : null}

      <section className="orbit-panel" style={{ padding: 10, display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 12 }}>Properties</strong>
        <input className="orbit-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
          <input className="orbit-input" value={assignee} onChange={(event) => setAssignee(event.target.value)} placeholder="Assignee" />
          <input className="orbit-input" type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
          <select className="orbit-input" value={priority} onChange={(event) => setPriority(event.target.value as WorkItemPriority)}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <input
            className="orbit-input"
            type="number"
            min={0}
            value={estimateMinutes}
            onChange={(event) => setEstimateMinutes(event.target.value)}
            placeholder="Estimate (minutes)"
          />
        </div>
        <input
          className="orbit-input"
          value={blockedReason}
          onChange={(event) => setBlockedReason(event.target.value)}
          placeholder="Blocked reason"
        />
      </section>

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
          <button className="orbit-button" type="button" onClick={savePatch} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        {noteMode === "edit" ? (
          <textarea
            className="orbit-input orbit-notion-markdown__editor"
            value={markdownBody}
            onChange={(event) => setMarkdownBody(event.target.value)}
            placeholder={"# Notes\n- Update DoD\n- Track blockers"}
          />
        ) : (
          <div className="orbit-panel orbit-markdown-preview">
            {markdownBody.trim().length > 0 ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownBody}</ReactMarkdown>
            ) : (
              <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>No markdown notes yet.</p>
            )}
          </div>
        )}
      </section>

      <section className="orbit-panel" style={{ padding: 10, display: "grid", gap: 8 }}>
        <strong style={{ fontSize: 12 }}>Activity</strong>
        {activities.slice(0, 10).map((activity) => (
          <div key={activity.activityId} style={{ borderTop: "1px solid var(--orbit-border)", paddingTop: 8, fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <strong>{activity.action}</strong>
              <span style={{ color: "var(--orbit-text-subtle)" }}>
                {new Date(activity.createdAt).toLocaleString()}
              </span>
            </div>
            <div style={{ color: "var(--orbit-text-subtle)" }}>{activity.actorId}</div>
          </div>
        ))}
        {activities.length === 0 ? (
          <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 12 }}>No activity yet.</p>
        ) : null}
      </section>

      {saveError ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{saveError}</p> : null}
    </aside>
  );
}

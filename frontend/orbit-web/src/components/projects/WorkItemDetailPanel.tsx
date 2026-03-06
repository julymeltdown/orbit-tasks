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
      return "기한 없음";
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
      setSaveError(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="orbit-card orbit-notion-detail">
      <header className="orbit-notion-detail__header">
        <p className="orbit-notion-detail__label">작업 상세</p>
        <div className="orbit-notion-detail__head-row">
          <h3>{displayWorkItemTitle(item.title)}</h3>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={onClose}>
            닫기
          </button>
        </div>
        <p className="orbit-notion-detail__summary">현재 상태를 바꾸고, 담당자/기한/노트/차단 사유를 같은 패널에서 정리합니다.</p>
      </header>

      <div className="orbit-notion-detail__meta">
        <span className="orbit-notion-pill">{item.type}</span>
        <span className="orbit-notion-pill">{item.priority ?? "MEDIUM"}</span>
        <span className="orbit-notion-pill">{item.assignee || "unassigned"}</span>
      </div>

      <section className="orbit-detail-section">
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
            보관
          </button>
        </div>
        <div className="orbit-notion-detail__summary-row">
          <span>기한: {dueText}</span>
          {item.blockedReason ? <span>차단: {item.blockedReason}</span> : <span>차단 없음</span>}
        </div>
      </section>

      {sprintLabel ? (
        <section className="orbit-detail-section orbit-notion-sprint-inline">
          <div>
            <strong style={{ fontSize: 13 }}>{sprintLabel}</strong>
            {sprintStateLabel ? <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{sprintStateLabel}</div> : null}
          </div>
          {canAddToSprint ? (
            <button className="orbit-button orbit-button--ghost" type="button" onClick={onAddToSprint} disabled={sprintLoading}>
              스프린트에 추가
            </button>
          ) : (
            <span className="orbit-notion-pill">스프린트 포함</span>
          )}
        </section>
      ) : null}

      <section className="orbit-detail-section orbit-detail-section--form">
        <strong className="orbit-detail-section__title">기본 정보</strong>
        <input className="orbit-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="제목" />
        <div className="orbit-detail-grid">
          <input className="orbit-input" value={assignee} onChange={(event) => setAssignee(event.target.value)} placeholder="담당자" />
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
            placeholder="예상 시간(분)"
          />
        </div>
        <input
          className="orbit-input"
          value={blockedReason}
          onChange={(event) => setBlockedReason(event.target.value)}
          placeholder="차단 사유"
        />
      </section>

      <section className="orbit-detail-section orbit-notion-markdown">
        <div className="orbit-notion-markdown__tabs">
          <button
            className={`orbit-button orbit-button--ghost${noteMode === "edit" ? " is-active" : ""}`}
            type="button"
            onClick={() => setNoteMode("edit")}
          >
            편집
          </button>
          <button
            className={`orbit-button orbit-button--ghost${noteMode === "preview" ? " is-active" : ""}`}
            type="button"
            onClick={() => setNoteMode("preview")}
          >
            미리보기
          </button>
          <button className="orbit-button" type="button" onClick={savePatch} disabled={saving}>
            {saving ? "저장 중..." : "변경 저장"}
          </button>
        </div>
        {noteMode === "edit" ? (
          <textarea
            className="orbit-input orbit-notion-markdown__editor"
            value={markdownBody}
            onChange={(event) => setMarkdownBody(event.target.value)}
            placeholder={"# 작업 메모\n- 완료 조건\n- 확인할 이슈\n- 관련 링크"}
          />
        ) : (
          <div className="orbit-markdown-preview">
            {markdownBody.trim().length > 0 ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownBody}</ReactMarkdown>
            ) : (
              <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>아직 메모가 없습니다.</p>
            )}
          </div>
        )}
      </section>

      <section className="orbit-detail-section">
        <strong className="orbit-detail-section__title">최근 활동</strong>
        {activities.slice(0, 10).map((activity) => (
          <div key={activity.activityId} className="orbit-detail-activity">
            <div className="orbit-detail-activity__head">
              <strong>{activity.action}</strong>
              <span>{new Date(activity.createdAt).toLocaleString()}</span>
            </div>
            <div>{activity.actorId}</div>
          </div>
        ))}
        {activities.length === 0 ? <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 12 }}>기록된 활동이 없습니다.</p> : null}
      </section>

      {saveError ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{saveError}</p> : null}
    </aside>
  );
}

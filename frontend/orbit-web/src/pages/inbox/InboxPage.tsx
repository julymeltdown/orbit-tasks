import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { request } from "@/lib/http/client";
import { ThreadPanel } from "@/components/collaboration/ThreadPanel";
import { InboxFilterBar } from "@/components/collaboration/InboxFilterBar";
import { useAuthStore } from "@/stores/authStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useProjectStore } from "@/stores/projectStore";
import { EmptyStateCard } from "@/components/common/EmptyStateCard";
import { getGuidedEmptyState } from "@/features/activation/emptyStateRegistry";
import { trackActivationEvent } from "@/lib/telemetry/activationEvents";
import {
  type InboxFilter,
  type InboxItemView,
  filterInboxItems,
  formatInboxRelativeTime,
  getInboxFilterLabel,
  resolveInboxKindLabel,
  resolveInboxUrgencyLabel,
  sortInboxItems
} from "@/features/collaboration/inboxPresentation";

export function InboxPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useAuthStore((state) => state.userId) ?? "";
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(workspaceId));
  const [items, setItems] = useState<InboxItemView[]>([]);
  const [filter, setFilter] = useState<InboxFilter>("needs_action");
  const [selectedInboxItemId, setSelectedInboxItemId] = useState<string | null>(null);
  const [focusThreadId, setFocusThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inboxEmptyState = getGuidedEmptyState("INBOX");

  async function emitActivationEvent(action: string) {
    if (!workspaceId || !userId) {
      return;
    }
    await trackActivationEvent({
      workspaceId,
      projectId,
      userId,
      eventType: "EMPTY_STATE_ACTION_CLICKED",
      route: "/app/inbox",
      metadata: { scope: "INBOX", action }
    });
  }

  async function loadInbox() {
    if (!userId) {
      setError("Missing user session");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await request<InboxItemView[]>(`/api/v2/inbox?userId=${encodeURIComponent(userId)}&filter=all`);
      setItems(sortInboxItems(result));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInbox().catch(() => undefined);
  }, [userId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const threadId = params.get("threadId");
    if (threadId) {
      setFocusThreadId(threadId);
    }
  }, [location.search]);

  useEffect(() => {
    if (!selectedInboxItemId && items.length > 0) {
      const first = filterInboxItems(items, filter)[0] ?? items[0];
      if (first) {
        setSelectedInboxItemId(first.inboxItemId);
        if (first.sourceType === "THREAD") {
          setFocusThreadId(first.sourceId);
        }
      }
    }
  }, [filter, items, selectedInboxItemId]);

  async function patchItem(item: InboxItemView, status: "READ" | "RESOLVED") {
    try {
      const updated = await request<InboxItemView>(`/api/v2/inbox/${item.inboxItemId}`, {
        method: "PATCH",
        body: {
          userId,
          status
        }
      });
      setItems((prev) => sortInboxItems(prev.map((entry) => (entry.inboxItemId === updated.inboxItemId ? updated : entry))));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update inbox item");
    }
  }

  async function markAllRead() {
    const unread = items.filter((entry) => !entry.read);
    if (unread.length === 0) {
      return;
    }
    try {
      await Promise.all(
        unread.map((item) =>
          request<InboxItemView>(`/api/v2/inbox/${item.inboxItemId}`, {
            method: "PATCH",
            body: {
              userId,
              status: "READ"
            }
          })
        )
      );
      await loadInbox();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark all as read");
    }
  }

  const filteredItems = useMemo(() => filterInboxItems(items, filter), [filter, items]);
  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.inboxItemId === selectedInboxItemId) ?? filteredItems[0] ?? null,
    [filteredItems, selectedInboxItemId]
  );
  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);
  const counts = useMemo(() => {
    return {
      all: items.length,
      needs_action: filterInboxItems(items, "needs_action").length,
      mentions: filterInboxItems(items, "mentions").length,
      ai_questions: filterInboxItems(items, "ai_questions").length,
      resolved: filterInboxItems(items, "resolved").length
    };
  }, [items]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }
    if (selectedItem.sourceType === "THREAD") {
      setFocusThreadId(selectedItem.sourceId);
    } else {
      setFocusThreadId(null);
    }
  }, [selectedItem]);

  function openItem(item: InboxItemView) {
    setSelectedInboxItemId(item.inboxItemId);
    if (item.sourceType === "THREAD") {
      setFocusThreadId(item.sourceId);
    } else {
      navigate(item.sourcePath);
    }
  }

  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card orbit-inbox-page" style={{ gridColumn: "span 8" }}>
        <header className="orbit-inbox-page__hero">
          <div>
            <div className="orbit-ops-hub__eyebrow">협업 triage</div>
            <h2 style={{ margin: 0 }}>지금 처리해야 할 알림과 요청</h2>
            <p className="orbit-inbox-page__summary">
              원본 객체, 긴급도, 다음 행동을 먼저 보여주고 스레드나 작업으로 바로 들어갑니다.
            </p>
          </div>
          <div className="orbit-inbox-page__stats">
            <span className="orbit-notion-pill">미확인 {unreadCount}</span>
            <span className="orbit-notion-pill">조치 필요 {counts.needs_action}</span>
          </div>
        </header>

        <InboxFilterBar
          value={filter}
          counts={counts}
          onChange={setFilter}
          unreadCount={unreadCount}
          onMarkAllRead={markAllRead}
          onRefresh={() => loadInbox()}
        />

        {loading ? <p>인박스를 불러오는 중...</p> : null}
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}

        <section className="orbit-inbox-list" aria-label={`${getInboxFilterLabel(filter)} 항목 목록`}>
          {filteredItems.length === 0 ? (
            <EmptyStateCard
              title={inboxEmptyState.title}
              description={inboxEmptyState.description}
              statusHint={inboxEmptyState.statusHint}
              actions={[
                {
                  label: inboxEmptyState.primaryAction.label,
                  onClick: () => {
                    emitActivationEvent("open_board").catch(() => undefined);
                    navigate(inboxEmptyState.primaryAction.path);
                  }
                }
              ]}
              secondaryActions={(inboxEmptyState.secondaryActions ?? []).map((action) => ({
                label: action.label,
                variant: "ghost",
                onClick: () => {
                  emitActivationEvent(action.label).catch(() => undefined);
                  navigate(action.path);
                }
              }))}
            />
          ) : null}

          {filteredItems.map((item) => (
            <article
              key={item.inboxItemId}
              className={`orbit-inbox-row orbit-animate-card${selectedItem?.inboxItemId === item.inboxItemId ? " is-selected" : ""}`}
            >
              <button type="button" className="orbit-inbox-row__content" onClick={() => openItem(item)}>
                <div className="orbit-inbox-row__head">
                  <div className="orbit-inbox-row__chips">
                    <span className={`orbit-notion-pill orbit-inbox-row__urgency orbit-inbox-row__urgency--${String(item.urgency).toLowerCase()}`}>
                      {resolveInboxUrgencyLabel(item.urgency)}
                    </span>
                    <span className="orbit-notion-pill">{resolveInboxKindLabel(item.kind)}</span>
                    {!item.read ? <span className="orbit-notion-pill">미확인</span> : null}
                  </div>
                  <span className="orbit-inbox-row__time">{formatInboxRelativeTime(item.createdAt)}</span>
                </div>
                <strong className="orbit-inbox-row__title">{item.sourceSummary}</strong>
                <p className="orbit-inbox-row__preview">{item.preview}</p>
                <div className="orbit-inbox-row__meta">
                  <span>다음 행동: {item.nextActionLabel}</span>
                  <span>{item.status === "RESOLVED" ? "처리 완료" : "미해결"}</span>
                </div>
              </button>
              <div className="orbit-inbox-row__actions">
                <button className="orbit-button orbit-button--ghost" type="button" onClick={() => openItem(item)}>
                  {item.sourceType === "THREAD" ? "스레드 열기" : "원본 보기"}
                </button>
                <button className="orbit-button orbit-button--ghost" type="button" onClick={() => patchItem(item, "READ")}>
                  {item.read ? "읽음" : "읽음 처리"}
                </button>
                <button className="orbit-button orbit-button--ghost" type="button" onClick={() => patchItem(item, "RESOLVED")}>
                  해결
                </button>
              </div>
            </article>
          ))}
        </section>
      </article>

      <div style={{ gridColumn: "span 4" }}>
        <ThreadPanel focusThreadId={focusThreadId} selectedItem={selectedItem} />
      </div>
    </section>
  );
}

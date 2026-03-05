import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { request } from "@/lib/http/client";
import { ThreadPanel } from "@/components/collaboration/ThreadPanel";
import { InboxFilterBar, type InboxFilter } from "@/components/collaboration/InboxFilterBar";
import { useAuthStore } from "@/stores/authStore";

interface InboxItem {
  inboxItemId: string;
  userId: string;
  kind: "NOTIFICATION" | "REQUEST" | "MENTION" | "AI_QUESTION" | string;
  sourceType: string;
  sourceId: string;
  messageId: string;
  read: boolean;
  status: "OPEN" | "READ" | "RESOLVED" | string;
  createdAt: string;
  resolvedAt: string | null;
}

function toApiFilter(filter: InboxFilter): string {
  if (filter === "all") return "all";
  if (filter === "notifications") return "notifications";
  if (filter === "requests") return "requests";
  if (filter === "mentions") return "mentions";
  return "ai_questions";
}

export function InboxPage() {
  const location = useLocation();
  const userId = useAuthStore((state) => state.userId) ?? "";
  const [items, setItems] = useState<InboxItem[]>([]);
  const [focusThreadId, setFocusThreadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadInbox(nextFilter: InboxFilter = filter) {
    if (!userId) {
      setError("Missing user session");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await request<InboxItem[]>(
        `/api/v2/inbox?userId=${encodeURIComponent(userId)}&filter=${encodeURIComponent(toApiFilter(nextFilter))}`
      );
      setItems(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInbox(filter).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filter]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const threadId = params.get("threadId");
    if (threadId) {
      setFocusThreadId(threadId);
    }
  }, [location.search]);

  async function patchItem(item: InboxItem, status: "READ" | "RESOLVED") {
    try {
      const updated = await request<InboxItem>(`/api/v2/inbox/${item.inboxItemId}`, {
        method: "PATCH",
        body: {
          userId,
          status
        }
      });
      setItems((prev) => prev.map((entry) => (entry.inboxItemId === updated.inboxItemId ? updated : entry)));
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
          request<InboxItem>(`/api/v2/inbox/${item.inboxItemId}`, {
            method: "PATCH",
            body: {
              userId,
              status: "READ"
            }
          })
        )
      );
      await loadInbox(filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark all as read");
    }
  }

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 8", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Inbox</h2>
        <InboxFilterBar
          value={filter}
          onChange={setFilter}
          unreadCount={unreadCount}
          onMarkAllRead={markAllRead}
          onRefresh={() => loadInbox(filter)}
        />
        {loading ? <p>Loading inbox...</p> : null}
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}

        <div style={{ display: "grid", gap: 8 }}>
          {items.length === 0 ? <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>No inbox items.</p> : null}

          {items.map((item) => (
            <div key={item.inboxItemId} className="orbit-panel orbit-animate-card" style={{ padding: 10, display: "grid", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <strong>{item.kind}</strong>
                {!item.read ? <span style={{ color: "var(--orbit-accent)" }}>Unread</span> : null}
                <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--orbit-text-subtle)" }}>{item.status}</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
                Source: {item.sourceType} · {new Date(item.createdAt).toLocaleString()}
              </span>
              {item.resolvedAt ? (
                <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
                  Resolved: {new Date(item.resolvedAt).toLocaleString()}
                </span>
              ) : null}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="orbit-button orbit-button--ghost" type="button" onClick={() => patchItem(item, "READ")}>
                  {item.read ? "Read" : "Mark Read"}
                </button>
                <button className="orbit-button orbit-button--ghost" type="button" onClick={() => patchItem(item, "RESOLVED")}>
                  Resolve
                </button>
                {item.sourceType === "THREAD" ? (
                  <button className="orbit-button orbit-button--ghost" type="button" onClick={() => setFocusThreadId(item.sourceId)}>
                    Open Thread
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </article>

      <div style={{ gridColumn: "span 4" }}>
        <ThreadPanel focusThreadId={focusThreadId} />
      </div>
    </section>
  );
}

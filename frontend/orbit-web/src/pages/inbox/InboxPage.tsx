import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { HttpError, request } from "@/lib/http/client";
import { ThreadPanel } from "@/components/collaboration/ThreadPanel";
import { useAuthStore } from "@/stores/authStore";

interface GatewayNotification {
  id: string;
  userId: string;
  type: string;
  payloadJson: string;
  createdAt: string;
  readAt: string | null;
}

interface NotificationFeedResponse {
  items: GatewayNotification[];
  nextCursor: string | null;
}

interface CollaborationInboxItem {
  notificationId: string;
  userId: string;
  threadId: string;
  messageId: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface InboxItem {
  id: string;
  type: string;
  createdAt: string;
  read: boolean;
  threadId: string | null;
  messageId: string | null;
  source: "notifications" | "collaboration";
}

export function InboxPage() {
  const location = useLocation();
  const userId = useAuthStore((state) => state.userId) ?? "";
  const [items, setItems] = useState<InboxItem[]>([]);
  const [focusThreadId, setFocusThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function parsePayload(payloadJson: string): { threadId?: string; messageId?: string } {
    try {
      const parsed = JSON.parse(payloadJson) as { threadId?: string; messageId?: string };
      return parsed ?? {};
    } catch {
      return {};
    }
  }

  async function loadInbox() {
    if (!userId) {
      setError("Missing user session");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const feed = await request<NotificationFeedResponse>("/api/notifications?limit=50");
      const mapped: InboxItem[] = feed.items.map((entry) => {
        const payload = parsePayload(entry.payloadJson);
        return {
          id: entry.id,
          type: entry.type,
          createdAt: entry.createdAt,
          read: Boolean(entry.readAt),
          threadId: payload.threadId ?? null,
          messageId: payload.messageId ?? null,
          source: "notifications"
        };
      });
      setItems(mapped);
      return;
    } catch (e) {
      // Fall back to collaboration inbox when notification service endpoint is unavailable for this environment.
      if (!(e instanceof HttpError) || (e.status !== 404 && e.status !== 500 && e.status !== 503)) {
        setError(e instanceof Error ? e.message : "Failed to load inbox");
      }
    } finally {
      setLoading(false);
    }

    try {
      const legacy = await request<CollaborationInboxItem[]>(`/api/collaboration/inbox?userId=${encodeURIComponent(userId)}`);
      setItems(
        legacy.map((entry) => ({
          id: entry.notificationId,
          type: entry.type,
          createdAt: entry.createdAt,
          read: entry.read,
          threadId: entry.threadId,
          messageId: entry.messageId,
          source: "collaboration"
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inbox");
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

  async function markRead(item: InboxItem) {
    try {
      if (item.source === "notifications") {
        await request(`/api/notifications/${item.id}/read`, { method: "PATCH" });
      } else {
        await request(`/api/collaboration/inbox/${item.id}/read`, {
          method: "PATCH",
          body: {
            userId
          }
        });
      }
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark read");
    }
  }

  async function markAllRead() {
    try {
      await request("/api/notifications/read-all", { method: "PATCH" });
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark all read");
    }
  }

  const unreadCount = items.filter((item) => !item.read).length;

  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 8", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Inbox</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>Unread {unreadCount}</span>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={markAllRead}>
            Mark All Read
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={() => loadInbox()}>
            Refresh
          </button>
        </div>
        {loading ? <p>Loading inbox...</p> : null}
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}
        <div style={{ display: "grid", gap: 8 }}>
          {items.length === 0 ? <p>No notifications yet.</p> : null}
          {items.map((item) => (
            <div key={item.id} className="orbit-panel orbit-animate-card" style={{ padding: 10, display: "grid", gap: 6 }}>
              <strong>
                {item.type} {!item.read ? <span style={{ color: "var(--orbit-accent)" }}>•</span> : null}
              </strong>
              <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
                Thread {item.threadId?.slice(0, 8) ?? "-"} · Message {item.messageId?.slice(0, 8) ?? "-"}
              </span>
              <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{new Date(item.createdAt).toLocaleString()}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="orbit-button orbit-button--ghost" type="button" onClick={() => markRead(item)}>
                  {item.read ? "Read" : "Mark Read"}
                </button>
                {item.threadId ? (
                  <button className="orbit-button orbit-button--ghost" type="button" onClick={() => setFocusThreadId(item.threadId)}>
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

import { useEffect, useState } from "react";
import { request } from "@/lib/http/client";
import { ThreadPanel } from "@/components/collaboration/ThreadPanel";

interface InboxItem {
  notificationId: string;
  userId: string;
  threadId: string;
  messageId: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request<InboxItem[]>("/api/collaboration/inbox?userId=alex_stark")
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load inbox"));
  }, []);

  async function markRead(notificationId: string) {
    try {
      const updated = await request<InboxItem>(`/api/collaboration/inbox/${notificationId}/read`, {
        method: "PATCH",
        body: {
          userId: "alex_stark"
        }
      });
      setItems((prev) => prev.map((item) => (item.notificationId === notificationId ? updated : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark read");
    }
  }

  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 8", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Inbox</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>
          Mentions and thread notifications are collected here with read-state control.
        </p>
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}
        <div style={{ display: "grid", gap: 8 }}>
          {items.length === 0 ? <p>No notifications yet.</p> : null}
          {items.map((item) => (
            <div key={item.notificationId} className="orbit-panel" style={{ padding: 10, display: "grid", gap: 6 }}>
              <strong>{item.type}</strong>
              <span style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
                Thread {item.threadId.slice(0, 8)} · Message {item.messageId.slice(0, 8)}
              </span>
              <button className="orbit-button orbit-button--ghost" type="button" onClick={() => markRead(item.notificationId)}>
                {item.read ? "Read" : "Mark Read"}
              </button>
            </div>
          ))}
        </div>
      </article>

      <div style={{ gridColumn: "span 4" }}>
        <ThreadPanel />
      </div>
    </section>
  );
}

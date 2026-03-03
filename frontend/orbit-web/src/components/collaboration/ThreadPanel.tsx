import { useEffect, useState } from "react";
import { request } from "@/lib/http/client";

interface ThreadView {
  threadId: string;
  title: string;
}

interface MessageView {
  messageId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export function ThreadPanel() {
  const [thread, setThread] = useState<ThreadView | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [draft, setDraft] = useState("@alex_stark ETA 확인 부탁드립니다");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request<ThreadView>("/api/collaboration/threads", {
      method: "POST",
      body: {
        workspaceId: "11111111-1111-1111-1111-111111111111",
        workItemId: "33333333-3333-3333-3333-333333333333",
        title: "PAY-231 Redis 승인 스레드",
        createdBy: "pm@orbit.local"
      }
    })
      .then((created) => setThread(created))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to create thread"));
  }, []);

  async function sendMessage() {
    if (!thread || !draft.trim()) return;
    try {
      await request(`/api/collaboration/threads/${thread.threadId}/messages`, {
        method: "POST",
        body: {
          authorId: "pm@orbit.local",
          body: draft
        }
      });
      const next = await request<MessageView[]>(`/api/collaboration/threads/${thread.threadId}/messages`);
      setMessages(next);
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post message");
    }
  }

  return (
    <article className="orbit-card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>Thread</h3>
      <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 13 }}>
        Mention teammates with <code>@username</code> to generate inbox notifications.
      </p>
      {thread ? <strong>{thread.title}</strong> : <span>Preparing thread...</span>}
      <div style={{ display: "grid", gap: 8 }}>
        {messages.map((message) => (
          <div key={message.messageId} className="orbit-panel" style={{ padding: 10 }}>
            <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{message.authorId}</div>
            <div>{message.body}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="orbit-input" value={draft} onChange={(event) => setDraft(event.target.value)} />
        <button className="orbit-button" type="button" onClick={sendMessage}>
          Send
        </button>
      </div>
      {error ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{error}</p> : null}
    </article>
  );
}

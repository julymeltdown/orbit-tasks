import { useEffect, useMemo, useState } from "react";
import { request } from "@/lib/http/client";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useWorkItems } from "@/features/workitems/hooks/useWorkItems";

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

interface Props {
  focusThreadId?: string | null;
}

export function ThreadPanel({ focusThreadId = null }: Props) {
  const userId = useAuthStore((state) => state.userId) ?? "member@orbit.local";
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(workspaceId));
  const { items } = useWorkItems(projectId);

  const [thread, setThread] = useState<ThreadView | null>(null);
  const [threadTitle, setThreadTitle] = useState("New collaboration thread");
  const [workItemId, setWorkItemId] = useState("");
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [draft, setDraft] = useState("@owner ETA 확인 부탁드립니다");
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!focusThreadId) {
      return;
    }
    // If page requests focus, keep local placeholder thread reference.
    setThread((current) => (current && current.threadId === focusThreadId ? current : { threadId: focusThreadId, title: "Focused Thread" }));
  }, [focusThreadId]);

  useEffect(() => {
    if (!thread?.threadId) {
      setMessages([]);
      return;
    }
    request<MessageView[]>(`/api/collaboration/threads/${thread.threadId}/messages`)
      .then(setMessages)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load thread messages"));
  }, [thread?.threadId]);

  const availableWorkItems = useMemo(() => {
    return items.filter((item) => item.status !== "ARCHIVED");
  }, [items]);

  async function createThread() {
    if (!workspaceId) {
      setError("Select workspace first");
      return;
    }
    if (!workItemId) {
      setError("Select work item first");
      return;
    }
    if (!threadTitle.trim()) {
      setError("Thread title is required");
      return;
    }
    setError(null);
    try {
      const created = await request<ThreadView>("/api/collaboration/threads", {
        method: "POST",
        body: {
          workspaceId,
          workItemId,
          title: threadTitle.trim(),
          createdBy: userId
        }
      });
      setThread(created);
      setMessages([]);
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create thread");
    }
  }

  async function sendMessage() {
    if (!thread || !draft.trim()) return;
    try {
      await request(`/api/collaboration/threads/${thread.threadId}/messages`, {
        method: "POST",
        body: {
          authorId: userId,
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

  async function createDeepLink() {
    if (!workspaceId || !thread) {
      return;
    }
    setError(null);
    try {
      const issued = await request<{
        token: string;
        workspaceId: string;
        targetPath: string;
        consumed: boolean;
        expiresAtEpochMs: number;
      }>("/api/deeplinks", {
        method: "POST",
        body: {
          workspaceId,
          targetPath: `/app/inbox?threadId=${encodeURIComponent(thread.threadId)}`
        }
      });
      const url = `${window.location.origin}/dl/${issued.token}`;
      setDeepLinkUrl(url);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create deep link");
    }
  }

  return (
    <article className="orbit-card orbit-animate-card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>Thread</h3>
      <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 13 }}>
        Mention teammates with <code>@username</code> to generate inbox notifications.
      </p>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <input className="orbit-input" value={threadTitle} onChange={(event) => setThreadTitle(event.target.value)} placeholder="Thread title" />
        <select className="orbit-input" value={workItemId} onChange={(event) => setWorkItemId(event.target.value)}>
          <option value="">Select work item...</option>
          {availableWorkItems.map((item) => (
            <option key={item.workItemId} value={item.workItemId}>
              {item.title}
            </option>
          ))}
        </select>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={createThread}>
          Create
        </button>
      </div>

      {thread ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <strong>{thread.title}</strong>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={createDeepLink}>
            Copy Deep Link
          </button>
        </div>
      ) : (
        <span>Create a thread to start conversation.</span>
      )}
      {deepLinkUrl ? (
        <p style={{ margin: 0, fontSize: 12, color: "var(--orbit-text-subtle)" }}>
          Deep link: <a href={deepLinkUrl}>{deepLinkUrl}</a>
        </p>
      ) : null}
      <div style={{ display: "grid", gap: 8 }}>
        {messages.map((message) => (
          <div key={message.messageId} className="orbit-panel" style={{ padding: 10 }}>
            <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{message.authorId}</div>
            <div>{message.body}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          className="orbit-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={thread ? "Type message with @mention..." : "Create thread first"}
          disabled={!thread}
        />
        <button className="orbit-button" type="button" onClick={sendMessage} disabled={!thread}>
          Send
        </button>
      </div>
      {error ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{error}</p> : null}
    </article>
  );
}

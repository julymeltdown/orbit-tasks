import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "@/lib/http/client";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { displayWorkItemTitle } from "@/features/workitems/display";
import { useWorkItems } from "@/features/workitems/hooks/useWorkItems";
import type { InboxItemView, ThreadContextView } from "@/features/collaboration/inboxPresentation";

interface MessageView {
  messageId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

interface Props {
  focusThreadId?: string | null;
  selectedItem?: InboxItemView | null;
}

export function ThreadPanel({ focusThreadId = null, selectedItem = null }: Props) {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId) ?? "member@orbit.local";
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(workspaceId));
  const { items } = useWorkItems(projectId);

  const [thread, setThread] = useState<ThreadContextView | null>(null);
  const [threadTitle, setThreadTitle] = useState("새 협업 스레드");
  const [workItemId, setWorkItemId] = useState("");
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [draft, setDraft] = useState("@owner ETA 확인 부탁드립니다");
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!focusThreadId) {
      setThread(null);
      setMessages([]);
      return;
    }
    request<ThreadContextView>(`/api/v2/threads/${focusThreadId}`)
      .then((next) => {
        setThread(next);
        if (next.workItemId) {
          setWorkItemId(next.workItemId);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "스레드 정보를 불러오지 못했습니다."));
  }, [focusThreadId]);

  useEffect(() => {
    if (!thread?.threadId) {
      setMessages([]);
      return;
    }
    request<MessageView[]>(`/api/v2/threads/${thread.threadId}/messages`)
      .then(setMessages)
      .catch((e) => setError(e instanceof Error ? e.message : "메시지를 불러오지 못했습니다."));
  }, [thread?.threadId]);

  const availableWorkItems = useMemo(() => items.filter((item) => item.status !== "ARCHIVED"), [items]);

  const selectedWorkItem = useMemo(() => {
    return availableWorkItems.find((item) => item.workItemId === workItemId) ?? null;
  }, [availableWorkItems, workItemId]);

  async function createThread() {
    if (!workspaceId) {
      setError("워크스페이스를 먼저 선택하세요.");
      return;
    }
    if (!workItemId) {
      setError("연결할 작업을 선택하세요.");
      return;
    }
    if (!threadTitle.trim()) {
      setError("스레드 제목을 입력하세요.");
      return;
    }
    setError(null);
    try {
      const created = await request<ThreadContextView>("/api/v2/threads", {
        method: "POST",
        body: {
          workspaceId,
          workItemId,
          workItemTitle: selectedWorkItem?.title ?? "",
          title: threadTitle.trim(),
          createdBy: userId
        }
      });
      setThread(created);
      setMessages([]);
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "스레드를 만들지 못했습니다.");
    }
  }

  async function sendMessage() {
    if (!thread || !draft.trim()) {
      return;
    }
    try {
      await request(`/api/v2/threads/${thread.threadId}/messages`, {
        method: "POST",
        body: {
          authorId: userId,
          body: draft
        }
      });
      const [nextThread, nextMessages] = await Promise.all([
        request<ThreadContextView>(`/api/v2/threads/${thread.threadId}`),
        request<MessageView[]>(`/api/v2/threads/${thread.threadId}/messages`)
      ]);
      setThread(nextThread);
      setMessages(nextMessages);
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "메시지를 전송하지 못했습니다.");
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
      setError(e instanceof Error ? e.message : "딥링크를 만들지 못했습니다.");
    }
  }

  return (
    <aside className="orbit-thread-panel">
      <header className="orbit-thread-panel__header">
        <div className="orbit-thread-panel__eyebrow">협업 컨텍스트</div>
        <h3 className="orbit-thread-panel__title">{thread ? thread.title : "스레드 또는 요청 선택"}</h3>
        <p className="orbit-thread-panel__summary">
          {thread
            ? thread.sourceSummary
            : selectedItem?.sourceSummary ?? "인박스에서 항목을 선택하면 관련 스레드와 원본 작업 맥락을 여기서 검토합니다."}
        </p>
      </header>

      {thread ? (
        <>
          <section className="orbit-thread-panel__meta">
            <span className="orbit-notion-pill">{thread.status}</span>
            <span>{thread.messageCount}개 메시지</span>
            <span>{thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleString() : "새 스레드"}</span>
          </section>

          <section className="orbit-thread-panel__context">
            <div>
              <strong>원본 작업</strong>
              <div>{displayWorkItemTitle(thread.workItemTitle)}</div>
            </div>
            <div>
              <strong>권장 처리</strong>
              <div>{thread.resolutionHint}</div>
            </div>
            <div className="orbit-thread-panel__context-actions">
              <button className="orbit-button orbit-button--ghost" type="button" onClick={() => navigate(thread.sourcePath)}>
                원본 작업 보기
              </button>
              <button className="orbit-button orbit-button--ghost" type="button" onClick={createDeepLink}>
                딥링크 복사
              </button>
            </div>
          </section>

          <section className="orbit-thread-panel__messages" aria-label="Thread messages">
            {messages.length === 0 ? (
              <p className="orbit-thread-panel__empty">아직 메시지가 없습니다. 첫 메시지로 담당자와 다음 행동을 명확히 남기세요.</p>
            ) : null}
            {messages.map((message) => (
              <article key={message.messageId} className="orbit-thread-message">
                <div className="orbit-thread-message__head">
                  <strong>{message.authorId}</strong>
                  <span>{new Date(message.createdAt).toLocaleString()}</span>
                </div>
                <p>{message.body}</p>
              </article>
            ))}
          </section>

          <section className="orbit-thread-panel__composer">
            <textarea
              className="orbit-input orbit-thread-panel__composer-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="@username 형태로 멘션하면 인박스에 바로 전달됩니다."
            />
            <div className="orbit-thread-panel__context-actions">
              <button className="orbit-button" type="button" onClick={sendMessage}>
                메시지 전송
              </button>
            </div>
          </section>
        </>
      ) : (
        <section className="orbit-thread-panel__create">
          <div className="orbit-thread-panel__meta">
            <span className="orbit-notion-pill">새 스레드</span>
            {selectedItem ? <span>{selectedItem.nextActionLabel}</span> : <span>작업 중심 협업 시작</span>}
          </div>
          <input className="orbit-input" value={threadTitle} onChange={(event) => setThreadTitle(event.target.value)} placeholder="스레드 제목" />
          <select className="orbit-input" value={workItemId} onChange={(event) => setWorkItemId(event.target.value)}>
            <option value="">연결할 작업 선택...</option>
            {availableWorkItems.map((item) => (
              <option key={item.workItemId} value={item.workItemId}>
                {displayWorkItemTitle(item.title)}
              </option>
            ))}
          </select>
          {selectedWorkItem ? (
            <p className="orbit-thread-panel__summary">
              연결 예정: {displayWorkItemTitle(selectedWorkItem.title)} · {selectedWorkItem.assignee || "담당자 미지정"}
            </p>
          ) : null}
          <div className="orbit-thread-panel__context-actions">
            <button className="orbit-button" type="button" onClick={createThread}>
              스레드 만들기
            </button>
          </div>
        </section>
      )}

      {deepLinkUrl ? (
        <p className="orbit-thread-panel__deeplink">
          공유 링크: <a href={deepLinkUrl}>{deepLinkUrl}</a>
        </p>
      ) : null}
      {error ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{error}</p> : null}
    </aside>
  );
}

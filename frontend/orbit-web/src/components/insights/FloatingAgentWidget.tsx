import { useMemo, useState } from "react";
import { request } from "@/lib/http/client";
import { useProjectStore } from "@/stores/projectStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useEvaluationActions } from "@/features/insights/hooks/useEvaluationActions";

const OPEN_KEY = "orbit.ai.widget.open";

interface Evaluation {
  evaluationId: string;
  health: string;
  topRisks: Array<{
    type: string;
    summary: string;
    impact: string;
    recommendedActions: string[];
    evidence: string[];
  }>;
  questions: string[];
  confidence: number;
  fallback: boolean;
  reason: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

function readOpen() {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(OPEN_KEY) === "1";
}

function writeOpen(open: boolean) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(OPEN_KEY, open ? "1" : "0");
}

export function FloatingAgentWidget() {
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const projectId = useProjectStore((state) => state.getProjectId(workspaceId));
  const { submitAction } = useEvaluationActions();

  const [open, setOpen] = useState(readOpen());
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("이번 스프린트는 일정 내 완료 가능할까?");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unreadHints = useMemo(() => {
    return evaluation?.questions.length ?? 0;
  }, [evaluation?.questions.length]);

  function toggle() {
    const next = !open;
    setOpen(next);
    writeOpen(next);
  }

  async function runAssistant() {
    if (!workspaceId) {
      setError("Select workspace first");
      return;
    }
    if (!draft.trim()) {
      return;
    }
    setLoading(true);
    setError(null);
    const userMessage: ChatMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      text: draft.trim()
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await request<Evaluation>("/api/insights/schedule-evaluations", {
        method: "POST",
        body: {
          workspaceId,
          projectId,
          sprintId: "",
          remainingStoryPoints: 21,
          availableCapacitySp: 18,
          blockedCount: 1,
          atRiskCount: 1,
          simulateAiFailure: false
        }
      });
      setEvaluation(result);
      const firstRisk = result.topRisks[0];
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-a`,
        role: "assistant",
        text: firstRisk
          ? `[${result.health.toUpperCase()}] ${firstRisk.summary}\n권고: ${firstRisk.recommendedActions.join(" / ")}`
          : `[${result.health.toUpperCase()}] 리스크 없음`
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assistant request failed");
    } finally {
      setLoading(false);
    }
  }

  async function acceptTopRisk() {
    if (!evaluation) {
      return;
    }
    try {
      await submitAction({
        evaluationId: evaluation.evaluationId,
        action: "accept",
        note: "Accepted from floating agent"
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save action");
    }
  }

  return (
    <div className={`orbit-ai-widget${open ? " is-open" : ""}`} aria-live="polite">
      {open ? (
        <section className="orbit-ai-widget__panel orbit-animate-card">
          <header className="orbit-ai-widget__header">
            <strong>Orbit Agent</strong>
            <button className="orbit-button orbit-button--ghost" type="button" onClick={toggle}>
              Minimize
            </button>
          </header>

          <div className="orbit-ai-widget__messages">
            {messages.length === 0 ? (
              <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>
                일정, 스프린트, 블로커에 대해 물어보면 즉시 진단합니다.
              </p>
            ) : null}
            {messages.map((message) => (
              <div key={message.id} className={`orbit-ai-widget__bubble orbit-ai-widget__bubble--${message.role}`}>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", font: "inherit" }}>{message.text}</pre>
              </div>
            ))}
          </div>

          {evaluation ? (
            <div className="orbit-panel" style={{ padding: 10 }}>
              <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)", marginBottom: 6 }}>
                Health {evaluation.health} · confidence {(evaluation.confidence * 100).toFixed(0)}%
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="orbit-button orbit-button--ghost" type="button" onClick={acceptTopRisk}>
                  Accept Top Action
                </button>
              </div>
            </div>
          ) : null}

          {error ? <p style={{ margin: 0, color: "var(--orbit-danger)" }}>{error}</p> : null}

          <div className="orbit-ai-widget__composer">
            <input
              className="orbit-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Orbit Agent..."
            />
            <button className="orbit-button" type="button" onClick={runAssistant} disabled={loading}>
              {loading ? "..." : "Send"}
            </button>
          </div>
        </section>
      ) : null}

      <button className="orbit-ai-widget__trigger orbit-animate-card" type="button" onClick={toggle} aria-label="Toggle orbit agent">
        AI
        {unreadHints > 0 ? <span className="orbit-ai-widget__badge">{unreadHints}</span> : null}
      </button>
    </div>
  );
}

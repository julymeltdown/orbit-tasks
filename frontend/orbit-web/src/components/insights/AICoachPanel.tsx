import type { EvaluationAction } from "@/features/workitems/types";

interface Props {
  questions: string[];
  actions: EvaluationAction[];
  reason: string;
  onRun: () => void;
  loading: boolean;
}

export function AICoachPanel({ questions, actions, reason, onRun, loading }: Props) {
  return (
    <article className="orbit-card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>AI Coach</h3>
      <button className="orbit-button" type="button" onClick={onRun} disabled={loading}>
        {loading ? "Evaluating..." : "Run Evaluation"}
      </button>
      <div className="orbit-panel" style={{ padding: 10 }}>
        <strong style={{ fontSize: 12 }}>Reason</strong>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--orbit-text-subtle)" }}>{reason}</p>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
        {questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>
      <div className="orbit-panel" style={{ padding: 10, display: "grid", gap: 6 }}>
        <strong style={{ fontSize: 12 }}>Draft Actions</strong>
        {actions.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: "var(--orbit-text-subtle)" }}>No actions suggested yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
            {actions.map((action, index) => (
              <li key={`${action.label ?? "action"}-${index}`}>
                {action.label ?? action.note ?? "Suggested action"} · {(action.status ?? "draft").toUpperCase()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

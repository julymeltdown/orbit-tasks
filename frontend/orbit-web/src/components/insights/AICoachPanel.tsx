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
    <section className="orbit-ai-coach-panel">
      <h3 style={{ margin: 0 }}>AI 코치</h3>
      <button className="orbit-button" type="button" onClick={onRun} disabled={loading}>
        {loading ? "평가 중..." : "평가 실행"}
      </button>
      <div className="orbit-ai-coach-panel__block">
        <strong style={{ fontSize: 12 }}>평가 근거</strong>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--orbit-text-subtle)" }}>{reason}</p>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
        {questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>
      <div className="orbit-ai-coach-panel__block" style={{ display: "grid", gap: 6 }}>
        <strong style={{ fontSize: 12 }}>Draft 대응안</strong>
        {actions.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: "var(--orbit-text-subtle)" }}>아직 제안된 대응안이 없습니다.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
            {actions.map((action, index) => (
              <li key={`${action.label ?? "action"}-${index}`}>
                {action.label ?? action.note ?? "권고안"} · {(action.status ?? "draft").toUpperCase()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

interface Props {
  questions: string[];
  reason: string;
  onRun: () => void;
  loading: boolean;
}

export function AICoachPanel({ questions, reason, onRun, loading }: Props) {
  return (
    <article className="orbit-card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>AI Coach</h3>
      <p style={{ margin: 0, color: "var(--orbit-text-subtle)", fontSize: 13 }}>
        Structured schedule evaluation with deterministic fallback and action capture.
      </p>
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
    </article>
  );
}

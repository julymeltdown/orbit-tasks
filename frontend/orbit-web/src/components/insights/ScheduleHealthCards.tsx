interface RiskItem {
  type: string;
  summary: string;
  impact: string;
  recommendedActions: string[];
  evidence: string[];
}

interface Props {
  health: string;
  confidence: number;
  topRisks: RiskItem[];
  fallback: boolean;
}

export function ScheduleHealthCards({ health, confidence, topRisks, fallback }: Props) {
  return (
    <article className="orbit-card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>Schedule Health</h3>
      <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
        <strong style={{ fontSize: 26 }}>{health.toUpperCase()}</strong>
        <span style={{ color: "var(--orbit-text-subtle)", fontSize: 12 }}>
          confidence {(confidence * 100).toFixed(0)}%
        </span>
        {fallback ? <span style={{ color: "var(--orbit-danger)", fontSize: 12 }}>Fallback</span> : null}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {topRisks.map((risk) => (
          <div key={`${risk.type}-${risk.summary}`} className="orbit-panel" style={{ padding: 10 }}>
            <strong>{risk.summary}</strong>
            <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{risk.impact}</div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12 }}>
              {risk.recommendedActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}

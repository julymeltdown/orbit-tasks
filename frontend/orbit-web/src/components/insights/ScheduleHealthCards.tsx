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
    <section className="orbit-health-cards">
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
          <div key={`${risk.type}-${risk.summary}`} className="orbit-health-cards__risk">
            <strong>{risk.summary}</strong>
            <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>{risk.impact}</div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12 }}>
              {risk.recommendedActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
            {risk.evidence.length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {risk.evidence.map((entry) => (
                  <a
                    key={entry}
                    className="orbit-link-button orbit-link-button--tab"
                    href={`/app/projects/table?evidence=${encodeURIComponent(entry)}`}
                  >
                    {entry}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

interface Props {
  healthy: number;
  warning: number;
  atRisk: number;
}

export function RiskDistributionWidget({ healthy, warning, atRisk }: Props) {
  const total = Math.max(healthy + warning + atRisk, 1);
  const healthyPct = Math.round((healthy / total) * 100);
  const warningPct = Math.round((warning / total) * 100);
  const atRiskPct = Math.round((atRisk / total) * 100);

  return (
    <article className="orbit-card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <h3 style={{ margin: 0 }}>Risk Distribution</h3>
      <div className="orbit-panel" style={{ padding: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: `${healthyPct}% ${warningPct}% ${atRiskPct}%`, height: 10, gap: 2 }}>
          <div style={{ background: "var(--orbit-success)" }} />
          <div style={{ background: "#d19a00" }} />
          <div style={{ background: "var(--orbit-danger)" }} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)" }}>
        Healthy {healthyPct}% · Warning {warningPct}% · At risk {atRiskPct}%
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a className="orbit-link-button orbit-link-button--tab" href="/app/projects/table?status=DONE">
          Healthy Projects
        </a>
        <a className="orbit-link-button orbit-link-button--tab" href="/app/projects/table?status=REVIEW">
          Warning Projects
        </a>
        <a className="orbit-link-button orbit-link-button--tab" href="/app/projects/table?status=TODO">
          At Risk Projects
        </a>
      </div>
    </article>
  );
}

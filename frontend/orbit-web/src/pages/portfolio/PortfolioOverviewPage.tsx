import { useState } from "react";
import { request } from "@/lib/http/client";
import { RiskDistributionWidget } from "@/components/portfolio/RiskDistributionWidget";
import { EscalationCandidateTable } from "@/components/portfolio/EscalationCandidateTable";
import { usePortfolioExport } from "@/features/portfolio/hooks/usePortfolioExport";

interface Overview {
  workspaceId: string;
  portfolioId: string;
  healthyProjects: number;
  warningProjects: number;
  atRiskProjects: number;
  escalationCandidates: Array<{
    projectId: string;
    projectName: string;
    riskScore: number;
    blockerCount: number;
    owner: string;
    recommendation: string;
  }>;
}

export function PortfolioOverviewPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<string>("");
  const { exportMonthly } = usePortfolioExport();

  async function loadOverview() {
    setError(null);
    try {
      const next = await request<Overview>("/api/portfolio/overview", {
        method: "POST",
        body: {
          workspaceId: "11111111-1111-1111-1111-111111111111",
          portfolioId: "55555555-5555-5555-5555-555555555555",
          periodStart: "2026-03-01",
          periodEnd: "2026-03-31",
          projects: [
            { projectId: "P1", projectName: "Payments Revamp", health: "at_risk", riskScore: 82, blockerCount: 2, owner: "PM-A" },
            { projectId: "P2", projectName: "Infra Scale", health: "warning", riskScore: 63, blockerCount: 1, owner: "PM-B" },
            { projectId: "P3", projectName: "Growth Ops", health: "healthy", riskScore: 29, blockerCount: 0, owner: "PM-C" }
          ]
        }
      });
      setOverview(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load portfolio");
    }
  }

  async function exportCsv() {
    try {
      const csv = await exportMonthly("55555555-5555-5555-5555-555555555555");
      setCsvPreview(csv);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export monthly report");
    }
  }

  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 12", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Portfolio Overview</h2>
        <p style={{ color: "var(--orbit-text-subtle)" }}>Executive visibility for health trend and escalation targets.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="orbit-button" type="button" onClick={loadOverview}>
            Load Overview
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={exportCsv}>
            Export Monthly Report
          </button>
        </div>
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}
      </article>

      {overview ? (
        <>
          <div style={{ gridColumn: "span 4" }}>
            <RiskDistributionWidget
              healthy={overview.healthyProjects}
              warning={overview.warningProjects}
              atRisk={overview.atRiskProjects}
            />
          </div>
          <div style={{ gridColumn: "span 8" }}>
            <EscalationCandidateTable candidates={overview.escalationCandidates} />
          </div>
        </>
      ) : null}

      {csvPreview ? (
        <article className="orbit-card" style={{ gridColumn: "span 12", padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>CSV Preview</h3>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>{csvPreview}</pre>
        </article>
      ) : null}
    </section>
  );
}

import { useEffect, useState } from "react";
import { request } from "@/lib/http/client";
import { RiskDistributionWidget } from "@/components/portfolio/RiskDistributionWidget";
import { EscalationCandidateTable } from "@/components/portfolio/EscalationCandidateTable";
import { PortfolioSelector } from "@/components/portfolio/PortfolioSelector";
import { usePortfolioList } from "@/features/portfolio/hooks/usePortfolioList";
import { usePortfolioExport } from "@/features/portfolio/hooks/usePortfolioExport";
import { useWorkspaceStore } from "@/stores/workspaceStore";

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
  const workspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const { items: portfolios, loading: loadingPortfolios, error: portfolioError, load: reloadPortfolioList } = usePortfolioList(workspaceId);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<string>("");
  const [portfolioId, setPortfolioId] = useState("");
  const { exportMonthly } = usePortfolioExport();

  useEffect(() => {
    if (!portfolioId && portfolios.length > 0) {
      setPortfolioId(portfolios[0].portfolioId);
    }
  }, [portfolioId, portfolios]);

  async function loadOverview() {
    if (!workspaceId) {
      setError("Select workspace first");
      return;
    }
    setError(null);
    try {
      const next = await request<Overview>("/api/portfolio/overview", {
        method: "POST",
        body: {
          workspaceId,
          portfolioId: portfolioId || portfolios[0]?.portfolioId || "portfolio-core",
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
      const target = portfolioId || portfolios[0]?.portfolioId || "portfolio-core";
      const csv = await exportMonthly(target);
      setCsvPreview(csv);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export monthly report");
    }
  }

  async function createPortfolioQuick() {
    if (!workspaceId) {
      setError("Select workspace first");
      return;
    }
    try {
      await request("/api/portfolio/list", {
        method: "POST",
        body: {
          workspaceId,
          name: `Portfolio ${new Date().toISOString().slice(0, 10)}`
        }
      });
      await reloadPortfolioList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create portfolio");
    }
  }

  return (
    <section className="orbit-shell__content-grid">
      <article className="orbit-card" style={{ gridColumn: "span 12", padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Portfolio Overview</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="orbit-button" type="button" onClick={loadOverview}>
            Load Overview
          </button>
          <button className="orbit-button orbit-button--ghost" type="button" onClick={exportCsv}>
            Export Monthly Report
          </button>
        </div>
        {portfolioError ? <p style={{ color: "var(--orbit-danger)" }}>{portfolioError}</p> : null}
        {error ? <p style={{ color: "var(--orbit-danger)" }}>{error}</p> : null}
      </article>

      <div style={{ gridColumn: "span 4" }}>
        <PortfolioSelector
          portfolios={portfolios}
          selectedPortfolioId={portfolioId}
          onSelect={setPortfolioId}
          onCreateQuick={createPortfolioQuick}
          loading={loadingPortfolios}
        />
      </div>

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
      ) : (
        <article className="orbit-card" style={{ gridColumn: "span 8", padding: 14 }}>
          Select a portfolio and click <strong>Load Overview</strong>.
        </article>
      )}

      {csvPreview ? (
        <article className="orbit-card" style={{ gridColumn: "span 12", padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>CSV Preview</h3>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>{csvPreview}</pre>
        </article>
      ) : null}
    </section>
  );
}

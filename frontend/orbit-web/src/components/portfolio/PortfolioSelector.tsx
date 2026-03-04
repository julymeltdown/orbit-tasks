import type { PortfolioItem } from "@/features/portfolio/hooks/usePortfolioList";

interface Props {
  portfolios: PortfolioItem[];
  selectedPortfolioId: string;
  onSelect: (portfolioId: string) => void;
  onCreateQuick: () => void;
  loading?: boolean;
}

export function PortfolioSelector({ portfolios, selectedPortfolioId, onSelect, onCreateQuick, loading = false }: Props) {
  return (
    <article className="orbit-card" style={{ padding: 14, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Select Portfolio</h3>
        <button className="orbit-button orbit-button--ghost" type="button" onClick={onCreateQuick}>
          Create
        </button>
      </div>
      {loading ? <p style={{ margin: 0 }}>Loading portfolios...</p> : null}
      <div style={{ display: "grid", gap: 6 }}>
        {portfolios.map((portfolio) => (
          <button
            key={portfolio.portfolioId}
            type="button"
            className={`orbit-panel orbit-animate-row${selectedPortfolioId === portfolio.portfolioId ? " is-selected" : ""}`}
            style={{
              padding: 10,
              textAlign: "left",
              borderColor: selectedPortfolioId === portfolio.portfolioId ? "var(--orbit-accent)" : "var(--orbit-border)"
            }}
            onClick={() => onSelect(portfolio.portfolioId)}
          >
            <strong>{portfolio.name}</strong>
            <div style={{ fontSize: 12, color: "var(--orbit-text-subtle)", marginTop: 4 }}>
              {portfolio.projectCount} projects · {portfolio.status}
            </div>
          </button>
        ))}
        {portfolios.length === 0 && !loading ? (
          <p style={{ margin: 0, color: "var(--orbit-text-subtle)" }}>No portfolio found. Create one to continue.</p>
        ) : null}
      </div>
    </article>
  );
}


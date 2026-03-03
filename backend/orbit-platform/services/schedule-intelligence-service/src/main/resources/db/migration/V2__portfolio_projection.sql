CREATE TABLE IF NOT EXISTS portfolio_projections (
  projection_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  portfolio_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  healthy_projects INTEGER NOT NULL,
  warning_projects INTEGER NOT NULL,
  at_risk_projects INTEGER NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_escalation_candidates (
  candidate_id UUID PRIMARY KEY,
  portfolio_id UUID NOT NULL,
  project_id UUID NOT NULL,
  project_name VARCHAR(180) NOT NULL,
  risk_score NUMERIC(6,2) NOT NULL,
  blocker_count INTEGER NOT NULL,
  owner VARCHAR(120) NOT NULL,
  recommendation TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_candidates_score
  ON portfolio_escalation_candidates(portfolio_id, risk_score DESC);

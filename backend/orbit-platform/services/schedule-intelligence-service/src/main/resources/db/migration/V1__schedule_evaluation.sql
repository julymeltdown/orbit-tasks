CREATE TABLE IF NOT EXISTS schedule_evaluations (
  evaluation_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  project_id UUID NOT NULL,
  sprint_id UUID,
  health VARCHAR(24) NOT NULL,
  confidence NUMERIC(4,3) NOT NULL,
  deterministic_score NUMERIC(5,2) NOT NULL,
  llm_available BOOLEAN NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule_risks (
  risk_id UUID PRIMARY KEY,
  evaluation_id UUID NOT NULL,
  type VARCHAR(64) NOT NULL,
  summary TEXT NOT NULL,
  impact TEXT NOT NULL,
  urgency VARCHAR(16) NOT NULL,
  evidence JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_evaluations_project_created
  ON schedule_evaluations(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS integration_connector_subscriptions (
  subscription_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  provider VARCHAR(64) NOT NULL,
  scope VARCHAR(120) NOT NULL,
  auth_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_jobs (
  import_job_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  source_system VARCHAR(64) NOT NULL,
  source_ref VARCHAR(255) NOT NULL,
  mapping JSONB NOT NULL,
  validation_report JSONB NOT NULL,
  status VARCHAR(32) NOT NULL,
  rollback_snapshot JSONB,
  created_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_workspace_created
  ON import_jobs(workspace_id, created_at DESC);

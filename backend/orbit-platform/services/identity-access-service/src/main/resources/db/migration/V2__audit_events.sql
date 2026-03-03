CREATE TABLE IF NOT EXISTS identity_audit_events (
  audit_event_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  actor_id VARCHAR(120) NOT NULL,
  action VARCHAR(120) NOT NULL,
  target_type VARCHAR(120) NOT NULL,
  target_id VARCHAR(120) NOT NULL,
  payload JSONB NOT NULL,
  source_ip VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identity_audit_workspace_created
  ON identity_audit_events(workspace_id, created_at DESC);

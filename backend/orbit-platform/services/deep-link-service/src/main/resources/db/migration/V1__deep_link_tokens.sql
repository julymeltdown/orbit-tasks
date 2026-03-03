CREATE TABLE IF NOT EXISTS deep_link_tokens (
  token_id UUID PRIMARY KEY,
  token VARCHAR(128) NOT NULL UNIQUE,
  workspace_id UUID NOT NULL,
  target_type VARCHAR(32) NOT NULL,
  target_id UUID NOT NULL,
  target_path VARCHAR(255) NOT NULL,
  created_by VARCHAR(120) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deep_link_tokens_lookup
  ON deep_link_tokens(token, expires_at DESC);

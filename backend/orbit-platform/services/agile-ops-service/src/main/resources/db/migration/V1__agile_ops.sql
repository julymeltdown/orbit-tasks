CREATE TABLE IF NOT EXISTS agile_sprints (
  sprint_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  project_id UUID NOT NULL,
  name VARCHAR(120) NOT NULL,
  goal TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  capacity_sp INTEGER NOT NULL,
  created_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agile_backlog_items (
  backlog_item_id UUID PRIMARY KEY,
  sprint_id UUID,
  work_item_id UUID NOT NULL,
  rank_order INTEGER NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agile_dsu_entries (
  dsu_entry_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  sprint_id UUID,
  author_id VARCHAR(120) NOT NULL,
  raw_text TEXT NOT NULL,
  structured_payload JSONB NOT NULL,
  blocker_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agile_dsu_entries_workspace_created
  ON agile_dsu_entries(workspace_id, created_at DESC);

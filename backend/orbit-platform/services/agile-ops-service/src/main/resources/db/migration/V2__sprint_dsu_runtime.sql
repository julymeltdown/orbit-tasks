ALTER TABLE agile_sprints
    ADD COLUMN IF NOT EXISTS status VARCHAR(24) NOT NULL DEFAULT 'PLANNED';

ALTER TABLE agile_sprints
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE agile_backlog_items
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE agile_dsu_entries
    ADD COLUMN IF NOT EXISTS structured_signals_json TEXT NOT NULL DEFAULT '{}';

ALTER TABLE agile_dsu_entries
    ADD COLUMN IF NOT EXISTS ai_status VARCHAR(24) NOT NULL DEFAULT 'pending';

ALTER TABLE agile_dsu_entries
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_agile_sprints_project_status
    ON agile_sprints(project_id, status);

CREATE INDEX IF NOT EXISTS idx_agile_dsu_entries_sprint_created
    ON agile_dsu_entries(sprint_id, created_at DESC);


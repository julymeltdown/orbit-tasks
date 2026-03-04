CREATE TABLE IF NOT EXISTS workgraph_view_configurations (
    view_config_id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    owner_scope VARCHAR(32) NOT NULL DEFAULT 'USER',
    view_type VARCHAR(32) NOT NULL,
    filters_json TEXT NOT NULL DEFAULT '{}',
    sort_json TEXT NOT NULL DEFAULT '{}',
    group_by VARCHAR(64),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workgraph_view_configs_project
    ON workgraph_view_configurations(project_id);

CREATE INDEX IF NOT EXISTS idx_workgraph_view_configs_scope_type
    ON workgraph_view_configurations(project_id, owner_scope, view_type);


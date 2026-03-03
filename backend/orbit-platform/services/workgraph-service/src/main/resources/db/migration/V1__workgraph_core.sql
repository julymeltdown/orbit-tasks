CREATE TABLE IF NOT EXISTS orbit_work_item (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    assignee VARCHAR(64),
    start_at TIMESTAMP,
    due_at TIMESTAMP,
    priority VARCHAR(32),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orbit_work_dependency (
    id UUID PRIMARY KEY,
    from_work_item_id UUID NOT NULL,
    to_work_item_id UUID NOT NULL,
    type VARCHAR(16) NOT NULL DEFAULT 'FS',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_work_item_id, to_work_item_id)
);

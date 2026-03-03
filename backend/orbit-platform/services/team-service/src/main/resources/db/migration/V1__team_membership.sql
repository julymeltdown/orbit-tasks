CREATE TABLE IF NOT EXISTS orbit_team (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orbit_team_membership (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    role VARCHAR(64) NOT NULL,
    invited_by VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

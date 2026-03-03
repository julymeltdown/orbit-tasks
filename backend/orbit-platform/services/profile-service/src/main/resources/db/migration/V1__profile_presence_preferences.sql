CREATE TABLE IF NOT EXISTS orbit_profile_settings (
    user_id VARCHAR(64) PRIMARY KEY,
    timezone VARCHAR(80) NOT NULL DEFAULT 'UTC',
    locale VARCHAR(24) NOT NULL DEFAULT 'en-US',
    presence_status VARCHAR(32) NOT NULL DEFAULT 'online',
    notification_pref VARCHAR(64) NOT NULL DEFAULT 'mentions_only',
    mention_push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    thread_push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    digest_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orbit_profile_settings_presence
    ON orbit_profile_settings (presence_status);

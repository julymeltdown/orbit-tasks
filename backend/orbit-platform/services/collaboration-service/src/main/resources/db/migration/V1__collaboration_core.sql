CREATE TABLE IF NOT EXISTS collaboration_threads (
  thread_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL,
  work_item_id UUID NOT NULL,
  title VARCHAR(180) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS collaboration_messages (
  message_id UUID PRIMARY KEY,
  thread_id UUID NOT NULL,
  author_id VARCHAR(120) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collaboration_mentions (
  mention_id UUID PRIMARY KEY,
  message_id UUID NOT NULL,
  mentioned_user_id VARCHAR(120) NOT NULL,
  offset_start INTEGER NOT NULL,
  offset_end INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collab_mentions_user_created
  ON collaboration_mentions(mentioned_user_id, created_at DESC);

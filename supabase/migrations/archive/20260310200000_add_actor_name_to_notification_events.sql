-- Add actor_name column to notification_events for showing who triggered the event
ALTER TABLE notification_events ADD COLUMN IF NOT EXISTS actor_name text;
-- Add partial index on (user_id, is_read, created_at) for efficient unread queries
CREATE INDEX IF NOT EXISTS idx_notification_events_user_unread
  ON notification_events (user_id, is_read, created_at DESC)
  WHERE is_read = false;

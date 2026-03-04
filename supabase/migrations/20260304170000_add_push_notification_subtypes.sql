-- Add granular push notification preference columns
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS push_chat_messages BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_chat_mentions BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_ticket_updates BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_bulletins BOOLEAN DEFAULT true;

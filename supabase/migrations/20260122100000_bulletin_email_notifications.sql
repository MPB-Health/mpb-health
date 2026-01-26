-- Bulletin Email Notifications System
-- Tracks email notifications sent to advisors when bulletins are published

-- Create bulletin_email_notifications table
CREATE TABLE IF NOT EXISTS bulletin_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulletin_id UUID NOT NULL REFERENCES advisor_content(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_by UUID REFERENCES auth.users(id),
  total_recipients INTEGER DEFAULT 0,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'completed', 'failed')),
  error_message TEXT,
  resend_batch_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bulletin_email_recipients table (tracks individual sends)
CREATE TABLE IF NOT EXISTS bulletin_email_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES bulletin_email_notifications(id) ON DELETE CASCADE,
  advisor_id UUID REFERENCES advisor_profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  resend_message_id TEXT,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add notify_sent field to advisor_content to track if notification was sent
ALTER TABLE advisor_content
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notification_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bulletin_email_notifications_bulletin_id
ON bulletin_email_notifications(bulletin_id);

CREATE INDEX IF NOT EXISTS idx_bulletin_email_notifications_status
ON bulletin_email_notifications(status);

CREATE INDEX IF NOT EXISTS idx_bulletin_email_recipients_notification_id
ON bulletin_email_recipients(notification_id);

CREATE INDEX IF NOT EXISTS idx_bulletin_email_recipients_advisor_id
ON bulletin_email_recipients(advisor_id);

CREATE INDEX IF NOT EXISTS idx_advisor_content_notification_sent
ON advisor_content(notification_sent_at) WHERE content_type = 'bulletin';

-- Enable RLS
ALTER TABLE bulletin_email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_email_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin access
CREATE POLICY "Admins can manage bulletin notifications"
ON bulletin_email_notifications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "Admins can manage bulletin recipients"
ON bulletin_email_recipients
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Function to get active advisor emails for bulletin notifications
CREATE OR REPLACE FUNCTION get_active_advisor_emails()
RETURNS TABLE (
  advisor_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ap.id as advisor_id,
    COALESCE(ap.email, u.email) as email,
    ap.first_name,
    ap.last_name
  FROM advisor_profiles ap
  LEFT JOIN auth.users u ON ap.user_id = u.id
  WHERE ap.is_active = true
    AND (ap.email IS NOT NULL OR u.email IS NOT NULL);
END;
$$;

-- Function to record bulletin notification send
CREATE OR REPLACE FUNCTION start_bulletin_notification(
  p_bulletin_id UUID,
  p_sent_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
  v_recipient_count INTEGER;
BEGIN
  -- Count active advisors
  SELECT COUNT(*) INTO v_recipient_count
  FROM get_active_advisor_emails();

  -- Create notification record
  INSERT INTO bulletin_email_notifications (
    bulletin_id,
    sent_by,
    total_recipients,
    status
  ) VALUES (
    p_bulletin_id,
    p_sent_by,
    v_recipient_count,
    'pending'
  )
  RETURNING id INTO v_notification_id;

  -- Create recipient records
  INSERT INTO bulletin_email_recipients (
    notification_id,
    advisor_id,
    email,
    status
  )
  SELECT
    v_notification_id,
    advisor_id,
    email,
    'pending'
  FROM get_active_advisor_emails();

  RETURN v_notification_id;
END;
$$;

-- Function to update notification status
CREATE OR REPLACE FUNCTION update_bulletin_notification_status(
  p_notification_id UUID,
  p_status TEXT,
  p_successful INTEGER DEFAULT NULL,
  p_failed INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_resend_batch_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE bulletin_email_notifications
  SET
    status = p_status,
    successful_sends = COALESCE(p_successful, successful_sends),
    failed_sends = COALESCE(p_failed, failed_sends),
    error_message = COALESCE(p_error_message, error_message),
    resend_batch_id = COALESCE(p_resend_batch_id, resend_batch_id),
    updated_at = NOW()
  WHERE id = p_notification_id;

  -- If completed, update the bulletin record
  IF p_status = 'completed' THEN
    UPDATE advisor_content
    SET
      notification_sent_at = NOW(),
      notification_count = notification_count + 1
    WHERE id = (
      SELECT bulletin_id
      FROM bulletin_email_notifications
      WHERE id = p_notification_id
    );
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_active_advisor_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION start_bulletin_notification(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_bulletin_notification_status(UUID, TEXT, INTEGER, INTEGER, TEXT, TEXT) TO authenticated;

-- Add comment
COMMENT ON TABLE bulletin_email_notifications IS 'Tracks bulletin email notification campaigns sent to advisors';
COMMENT ON TABLE bulletin_email_recipients IS 'Tracks individual email sends to advisors for bulletin notifications';

/*
  # Lead Notifications Tracking System

  ## Overview
  Creates a table to track lead notification events for:
  - Preventing duplicate alerts
  - Tracking response times
  - Enabling notification analytics

  ## New Table
  1. `lead_notifications`
     - Tracks when leads were notified
     - Records priority classification
     - Identifies repeat leads
     - Tracks acknowledgment

  ## Security
  - RLS enabled
  - Admin/Advisor access for viewing notifications
  - System can insert notifications
*/

-- Create lead_notifications table
CREATE TABLE IF NOT EXISTS lead_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES zoho_lead_submissions(id) ON DELETE CASCADE,
  
  -- Notification details
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'critical')),
  is_repeat_lead BOOLEAN DEFAULT false,
  repeat_count INTEGER DEFAULT 0,
  
  -- Tracking
  notified_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES profiles(id),
  
  -- Desktop notification status
  desktop_notification_sent BOOLEAN DEFAULT false,
  desktop_notification_clicked BOOLEAN DEFAULT false,
  
  -- Response metrics
  time_to_acknowledge_seconds INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_lead_notifications_lead_id ON lead_notifications(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notifications_priority ON lead_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_lead_notifications_notified_at ON lead_notifications(notified_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_notifications_unacknowledged ON lead_notifications(acknowledged_at) WHERE acknowledged_at IS NULL;

-- Enable RLS
ALTER TABLE lead_notifications ENABLE ROW LEVEL SECURITY;

-- Admins and staff can view all notifications
CREATE POLICY "Admins can view all lead notifications"
  ON lead_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff', 'advisor')
    )
  );

-- Admins and staff can insert notifications
CREATE POLICY "Staff can insert lead notifications"
  ON lead_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff', 'advisor')
    )
  );

-- Allow anonymous inserts for system-triggered notifications
CREATE POLICY "System can insert lead notifications"
  ON lead_notifications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Staff can update notifications (for acknowledgment)
CREATE POLICY "Staff can update lead notifications"
  ON lead_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff', 'advisor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff', 'advisor')
    )
  );

-- Function to calculate time to acknowledge
CREATE OR REPLACE FUNCTION calculate_time_to_acknowledge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.acknowledged_at IS NOT NULL AND OLD.acknowledged_at IS NULL THEN
    NEW.time_to_acknowledge_seconds := EXTRACT(EPOCH FROM (NEW.acknowledged_at - NEW.notified_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-calculating acknowledgment time
DROP TRIGGER IF EXISTS calculate_acknowledge_time ON lead_notifications;
CREATE TRIGGER calculate_acknowledge_time
  BEFORE UPDATE ON lead_notifications
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_to_acknowledge();

-- Function to check for repeat leads (by email or phone)
CREATE OR REPLACE FUNCTION check_repeat_lead(p_email TEXT, p_phone TEXT)
RETURNS TABLE (
  is_repeat BOOLEAN,
  previous_count INTEGER
) AS $$
DECLARE
  email_count INTEGER;
  phone_count INTEGER;
BEGIN
  -- Count previous submissions with same email
  SELECT COUNT(*) INTO email_count
  FROM zoho_lead_submissions
  WHERE LOWER(email) = LOWER(p_email)
    AND created_at < now() - interval '5 minutes';
  
  -- Count previous submissions with same phone (if provided)
  IF p_phone IS NOT NULL AND p_phone != '' THEN
    SELECT COUNT(*) INTO phone_count
    FROM zoho_lead_submissions
    WHERE phone = p_phone
      AND created_at < now() - interval '5 minutes';
  ELSE
    phone_count := 0;
  END IF;
  
  is_repeat := (email_count > 0 OR phone_count > 0);
  previous_count := GREATEST(email_count, phone_count);
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notification stats
CREATE OR REPLACE FUNCTION get_lead_notification_stats(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  total_notifications BIGINT,
  acknowledged_count BIGINT,
  avg_response_time_seconds NUMERIC,
  critical_count BIGINT,
  high_count BIGINT,
  repeat_lead_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_notifications,
    COUNT(*) FILTER (WHERE acknowledged_at IS NOT NULL)::BIGINT AS acknowledged_count,
    AVG(time_to_acknowledge_seconds) AS avg_response_time_seconds,
    COUNT(*) FILTER (WHERE priority = 'critical')::BIGINT AS critical_count,
    COUNT(*) FILTER (WHERE priority = 'high')::BIGINT AS high_count,
    COUNT(*) FILTER (WHERE is_repeat_lead = true)::BIGINT AS repeat_lead_count
  FROM lead_notifications
  WHERE notified_at >= now() - make_interval(days => days_back);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- Advisor Video Conference Meetings System
-- Enables bi-weekly video conferences with advisors using Jitsi Meet
-- ============================================================================

-- Create advisor_meetings table
CREATE TABLE IF NOT EXISTS advisor_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  room_name TEXT NOT NULL UNIQUE,
  room_password TEXT,
  host_id UUID REFERENCES auth.users(id),
  host_name TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- 'weekly', 'biweekly', 'monthly'
  recurrence_day INTEGER, -- 0-6 for day of week
  recurrence_time TIME,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  recording_url TEXT,
  attendee_count INTEGER DEFAULT 0,
  max_attendees INTEGER,
  meeting_notes TEXT,
  agenda TEXT,
  resources JSONB DEFAULT '[]'::jsonb, -- Links to playbook, bulletins, etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create meeting attendees tracking table
CREATE TABLE IF NOT EXISTS advisor_meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES advisor_meetings(id) ON DELETE CASCADE,
  advisor_id UUID REFERENCES advisor_profiles(id),
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create meeting reminders table
CREATE TABLE IF NOT EXISTS advisor_meeting_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES advisor_meetings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'in_app')),
  send_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_advisor_meetings_scheduled_at ON advisor_meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_advisor_meetings_status ON advisor_meetings(status);
CREATE INDEX IF NOT EXISTS idx_advisor_meetings_room_name ON advisor_meetings(room_name);
CREATE INDEX IF NOT EXISTS idx_advisor_meeting_attendees_meeting ON advisor_meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_advisor_meeting_attendees_advisor ON advisor_meeting_attendees(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_meeting_reminders_meeting ON advisor_meeting_reminders(meeting_id);
CREATE INDEX IF NOT EXISTS idx_advisor_meeting_reminders_send_at ON advisor_meeting_reminders(send_at);
-- Enable RLS
ALTER TABLE advisor_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_meeting_reminders ENABLE ROW LEVEL SECURITY;
-- RLS Policies for advisor_meetings
-- Advisors can view all meetings
CREATE POLICY "Advisors can view meetings"
  ON advisor_meetings FOR SELECT
  TO authenticated
  USING (true);
-- Only admins/staff can create/update/delete meetings
CREATE POLICY "Admins can manage meetings"
  ON advisor_meetings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff', 'superadmin')
    )
  );
-- RLS Policies for advisor_meeting_attendees
-- Advisors can view their own attendance
CREATE POLICY "Advisors can view attendance"
  ON advisor_meeting_attendees FOR SELECT
  TO authenticated
  USING (true);
-- Advisors can record their own attendance
CREATE POLICY "Advisors can record attendance"
  ON advisor_meeting_attendees FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
-- Advisors can update their own attendance (e.g., when leaving)
CREATE POLICY "Advisors can update own attendance"
  ON advisor_meeting_attendees FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- Admins can manage all attendance
CREATE POLICY "Admins can manage attendance"
  ON advisor_meeting_attendees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff', 'superadmin')
    )
  );
-- RLS Policies for advisor_meeting_reminders
CREATE POLICY "Admins can manage reminders"
  ON advisor_meeting_reminders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff', 'superadmin')
    )
  );
-- Function to update meeting status
CREATE OR REPLACE FUNCTION update_meeting_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger for updated_at
DROP TRIGGER IF EXISTS advisor_meetings_updated_at ON advisor_meetings;
CREATE TRIGGER advisor_meetings_updated_at
  BEFORE UPDATE ON advisor_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_status();
-- Function to start a meeting
CREATE OR REPLACE FUNCTION start_advisor_meeting(p_meeting_id UUID)
RETURNS advisor_meetings AS $$
DECLARE
  v_meeting advisor_meetings;
BEGIN
  UPDATE advisor_meetings
  SET
    status = 'live',
    started_at = NOW()
  WHERE id = p_meeting_id
  RETURNING * INTO v_meeting;

  RETURN v_meeting;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to end a meeting
CREATE OR REPLACE FUNCTION end_advisor_meeting(p_meeting_id UUID)
RETURNS advisor_meetings AS $$
DECLARE
  v_meeting advisor_meetings;
BEGIN
  -- Update any attendees who haven't left
  UPDATE advisor_meeting_attendees
  SET
    left_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - joined_at))::INTEGER
  WHERE meeting_id = p_meeting_id
  AND left_at IS NULL;

  -- Get attendee count
  UPDATE advisor_meetings
  SET
    status = 'completed',
    ended_at = NOW(),
    attendee_count = (
      SELECT COUNT(DISTINCT COALESCE(advisor_id, user_id))
      FROM advisor_meeting_attendees
      WHERE meeting_id = p_meeting_id
    )
  WHERE id = p_meeting_id
  RETURNING * INTO v_meeting;

  RETURN v_meeting;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get active meeting
CREATE OR REPLACE FUNCTION get_active_advisor_meeting()
RETURNS advisor_meetings AS $$
BEGIN
  RETURN (
    SELECT * FROM advisor_meetings
    WHERE status = 'live'
    ORDER BY started_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get upcoming meetings
CREATE OR REPLACE FUNCTION get_upcoming_advisor_meetings(p_limit INTEGER DEFAULT 10)
RETURNS SETOF advisor_meetings AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM advisor_meetings
  WHERE status = 'scheduled'
  AND scheduled_at > NOW()
  ORDER BY scheduled_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to generate room name
CREATE OR REPLACE FUNCTION generate_meeting_room_name()
RETURNS TEXT AS $$
BEGIN
  RETURN 'mpb-advisor-' || substr(md5(random()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;
-- Grant execute permissions
GRANT EXECUTE ON FUNCTION start_advisor_meeting(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION end_advisor_meeting(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_advisor_meeting() TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_advisor_meetings(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_meeting_room_name() TO authenticated;
-- ============================================================================
-- Seed initial bi-weekly meeting template
-- ============================================================================
INSERT INTO advisor_meetings (
  title,
  description,
  scheduled_at,
  duration_minutes,
  room_name,
  is_recurring,
  recurrence_pattern,
  recurrence_day,
  recurrence_time,
  agenda,
  resources
) VALUES (
  'Advisor Town Hall',
  'Bi-weekly meeting with the MPB Health business development team. Join us to discuss updates, share best practices, and get your questions answered.',
  NOW() + INTERVAL '7 days',
  60,
  'mpb-advisor-townhall',
  true,
  'biweekly',
  3, -- Wednesday
  '14:00:00',
  '1. Welcome & Announcements
2. Product Updates
3. Sales Tips & Best Practices
4. Q&A Session
5. Open Discussion',
  '[
    {"type": "playbook", "title": "Advisor Playbook", "url": "/advisor/playbook"},
    {"type": "bulletin", "title": "Latest Bulletins", "url": "/advisor/content"},
    {"type": "training", "title": "Training University", "url": "/advisor/training-university"}
  ]'::jsonb
) ON CONFLICT (room_name) DO NOTHING;
-- ============================================================================
-- Done
-- ============================================================================;

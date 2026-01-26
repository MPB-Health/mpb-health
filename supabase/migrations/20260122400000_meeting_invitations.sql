-- ============================================================================
-- Enhanced Meeting Management with Invitations
-- ============================================================================

-- Add new columns to advisor_meetings for invitation management
ALTER TABLE advisor_meetings
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'all' CHECK (visibility IN ('all', 'selected', 'private')),
ADD COLUMN IF NOT EXISTS meeting_type TEXT DEFAULT 'group' CHECK (meeting_type IN ('all_hands', 'group', 'one_on_one', 'training', 'webinar')),
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS require_registration BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_guests BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS co_host_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS agenda TEXT,
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS passcode TEXT,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS auto_record BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- ============================================================================
-- Meeting Invitations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS meeting_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES advisor_meetings(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES advisor_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'tentative', 'no_response')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, advisor_id)
);

-- ============================================================================
-- Meeting Templates for Quick Scheduling
-- ============================================================================

CREATE TABLE IF NOT EXISTS meeting_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT DEFAULT 'group' CHECK (meeting_type IN ('all_hands', 'group', 'one_on_one', 'training', 'webinar')),
  default_duration INTEGER DEFAULT 60,
  default_visibility TEXT DEFAULT 'all' CHECK (default_visibility IN ('all', 'selected', 'private')),
  default_agenda TEXT,
  require_registration BOOLEAN DEFAULT false,
  allow_guests BOOLEAN DEFAULT false,
  auto_record BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_meeting_invitations_meeting ON meeting_invitations(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_invitations_advisor ON meeting_invitations(advisor_id);
CREATE INDEX IF NOT EXISTS idx_meeting_invitations_status ON meeting_invitations(status);
CREATE INDEX IF NOT EXISTS idx_advisor_meetings_visibility ON advisor_meetings(visibility);
CREATE INDEX IF NOT EXISTS idx_advisor_meetings_meeting_type ON advisor_meetings(meeting_type);
CREATE INDEX IF NOT EXISTS idx_advisor_meetings_host ON advisor_meetings(host_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE meeting_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_templates ENABLE ROW LEVEL SECURITY;

-- Meeting invitations policies
CREATE POLICY "Admins can manage all invitations"
  ON meeting_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Advisors can view their own invitations"
  ON meeting_invitations FOR SELECT
  TO authenticated
  USING (
    advisor_id IN (
      SELECT id FROM advisor_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Advisors can update their own invitation response"
  ON meeting_invitations FOR UPDATE
  TO authenticated
  USING (
    advisor_id IN (
      SELECT id FROM advisor_profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    advisor_id IN (
      SELECT id FROM advisor_profiles WHERE id = auth.uid()
    )
  );

-- Meeting templates policies
CREATE POLICY "Anyone can view active templates"
  ON meeting_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON meeting_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to invite advisors to a meeting
CREATE OR REPLACE FUNCTION invite_advisors_to_meeting(
  p_meeting_id UUID,
  p_advisor_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_advisor_id UUID;
BEGIN
  FOREACH v_advisor_id IN ARRAY p_advisor_ids
  LOOP
    INSERT INTO meeting_invitations (meeting_id, advisor_id, status)
    VALUES (p_meeting_id, v_advisor_id, 'pending')
    ON CONFLICT (meeting_id, advisor_id) DO NOTHING;

    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invite ALL advisors to a meeting
CREATE OR REPLACE FUNCTION invite_all_advisors_to_meeting(p_meeting_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO meeting_invitations (meeting_id, advisor_id, status)
  SELECT p_meeting_id, id, 'pending'
  FROM advisor_profiles
  WHERE status = 'active'
  ON CONFLICT (meeting_id, advisor_id) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to respond to meeting invitation
CREATE OR REPLACE FUNCTION respond_to_meeting_invitation(
  p_invitation_id UUID,
  p_response TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS meeting_invitations AS $$
DECLARE
  v_invitation meeting_invitations;
BEGIN
  UPDATE meeting_invitations
  SET
    status = p_response,
    responded_at = NOW(),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = p_invitation_id
  RETURNING * INTO v_invitation;

  RETURN v_invitation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create instant meeting
CREATE OR REPLACE FUNCTION create_instant_meeting(
  p_title TEXT,
  p_host_id UUID,
  p_visibility TEXT DEFAULT 'all',
  p_advisor_ids UUID[] DEFAULT NULL
)
RETURNS advisor_meetings AS $$
DECLARE
  v_meeting advisor_meetings;
  v_room_name TEXT;
BEGIN
  -- Generate unique room name
  v_room_name := 'mpb-instant-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);

  -- Create the meeting
  INSERT INTO advisor_meetings (
    title,
    description,
    scheduled_at,
    duration_minutes,
    status,
    jitsi_room_name,
    visibility,
    meeting_type,
    host_id,
    started_at
  ) VALUES (
    p_title,
    'Instant meeting started by admin',
    NOW(),
    60,
    'live',
    v_room_name,
    p_visibility,
    CASE WHEN array_length(p_advisor_ids, 1) = 1 THEN 'one_on_one' ELSE 'group' END,
    p_host_id,
    NOW()
  )
  RETURNING * INTO v_meeting;

  -- Invite specific advisors if provided
  IF p_advisor_ids IS NOT NULL AND array_length(p_advisor_ids, 1) > 0 THEN
    PERFORM invite_advisors_to_meeting(v_meeting.id, p_advisor_ids);
  ELSIF p_visibility = 'all' THEN
    -- Invite all advisors for 'all' visibility meetings
    PERFORM invite_all_advisors_to_meeting(v_meeting.id);
  END IF;

  RETURN v_meeting;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get meeting with invitation stats
CREATE OR REPLACE FUNCTION get_meeting_with_stats(p_meeting_id UUID)
RETURNS TABLE (
  meeting advisor_meetings,
  total_invited BIGINT,
  accepted BIGINT,
  declined BIGINT,
  pending BIGINT,
  tentative BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.*,
    COUNT(mi.id) as total_invited,
    COUNT(mi.id) FILTER (WHERE mi.status = 'accepted') as accepted,
    COUNT(mi.id) FILTER (WHERE mi.status = 'declined') as declined,
    COUNT(mi.id) FILTER (WHERE mi.status = 'pending') as pending,
    COUNT(mi.id) FILTER (WHERE mi.status = 'tentative') as tentative
  FROM advisor_meetings m
  LEFT JOIN meeting_invitations mi ON mi.meeting_id = m.id
  WHERE m.id = p_meeting_id
  GROUP BY m.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Seed Meeting Templates
-- ============================================================================

INSERT INTO meeting_templates (name, description, meeting_type, default_duration, default_visibility, default_agenda)
VALUES
  ('All-Hands Meeting', 'Monthly meeting with all advisors', 'all_hands', 60, 'all',
   '1. Welcome and Updates\n2. Performance Review\n3. New Product Announcements\n4. Q&A Session\n5. Action Items'),

  ('Training Session', 'Product or process training for advisors', 'training', 90, 'all',
   '1. Training Objectives\n2. Core Content\n3. Hands-on Practice\n4. Q&A\n5. Assessment'),

  ('One-on-One', 'Individual meeting with an advisor', 'one_on_one', 30, 'private',
   '1. Check-in\n2. Performance Discussion\n3. Challenges & Support\n4. Goals & Next Steps'),

  ('Team Huddle', 'Quick sync with selected team members', 'group', 30, 'selected',
   '1. Quick Updates\n2. Blockers\n3. Priorities\n4. Action Items'),

  ('Product Webinar', 'New product or feature presentation', 'webinar', 45, 'all',
   '1. Product Overview\n2. Key Features\n3. Demo\n4. Sales Talking Points\n5. Q&A')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp trigger for meeting_invitations
CREATE OR REPLACE FUNCTION update_meeting_invitation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meeting_invitation_updated ON meeting_invitations;
CREATE TRIGGER meeting_invitation_updated
  BEFORE UPDATE ON meeting_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_invitation_timestamp();

-- Update timestamp trigger for meeting_templates
DROP TRIGGER IF EXISTS meeting_template_updated ON meeting_templates;
CREATE TRIGGER meeting_template_updated
  BEFORE UPDATE ON meeting_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_invitation_timestamp();

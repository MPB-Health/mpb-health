-- ============================================================================
-- Champion Phase 2: Engagement Inbox
-- Unified messaging (SMS, email) and automated sequences
-- ============================================================================

-- ============================================================================
-- CONVERSATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Participant info
  lead_id UUID REFERENCES zoho_lead_submissions(id) ON DELETE SET NULL,
  contact_id UUID, -- Placeholder for future contacts table

  -- Contact details (denormalized for quick access)
  participant_name TEXT NOT NULL,
  participant_email TEXT,
  participant_phone TEXT,

  -- Conversation metadata
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'both')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'spam')),

  -- Tracking
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_direction TEXT CHECK (last_message_direction IN ('inbound', 'outbound')),
  unread_count INTEGER NOT NULL DEFAULT 0,

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_unread ON conversations(org_id, unread_count) WHERE unread_count > 0;
-- RLS for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view conversations in their org"
  ON conversations FOR SELECT
  USING (user_has_org_access(org_id));
CREATE POLICY "Users can insert conversations in their org"
  ON conversations FOR INSERT
  WITH CHECK (user_has_org_access(org_id));
CREATE POLICY "Users can update conversations in their org"
  ON conversations FOR UPDATE
  USING (user_has_org_access(org_id));
-- ============================================================================
-- MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Message content
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  -- For email
  subject TEXT,
  body_text TEXT,
  body_html TEXT,

  -- For SMS (also used as plain text for email)
  content TEXT,

  -- Sender/recipient info
  from_address TEXT, -- email or phone
  to_address TEXT,   -- email or phone

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'queued', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked'
  )),
  status_updated_at TIMESTAMPTZ,
  error_message TEXT,

  -- External IDs (from Twilio, SendGrid, etc.)
  external_id TEXT,
  external_provider TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Read tracking
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES auth.users(id),

  -- Who sent it (for outbound)
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ,

  -- Sequence tracking
  sequence_enrollment_id UUID,
  sequence_step_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON messages(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_external_id ON messages(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status) WHERE status IN ('pending', 'queued');
-- RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their org"
  ON messages FOR SELECT
  USING (user_has_org_access(org_id));
CREATE POLICY "Users can insert messages in their org"
  ON messages FOR INSERT
  WITH CHECK (user_has_org_access(org_id));
CREATE POLICY "Users can update messages in their org"
  ON messages FOR UPDATE
  USING (user_has_org_access(org_id));
-- ============================================================================
-- MESSAGE TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'both')),
  category TEXT DEFAULT 'general',

  -- Content
  subject TEXT, -- for email
  body_text TEXT NOT NULL,
  body_html TEXT, -- for email

  -- Variables (for merge fields)
  variables JSONB DEFAULT '[]', -- [{name: 'first_name', default: 'there'}]

  -- Usage tracking
  times_used INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Ownership
  created_by UUID REFERENCES auth.users(id),
  is_shared BOOLEAN NOT NULL DEFAULT true, -- visible to all org members

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes for templates
CREATE INDEX IF NOT EXISTS idx_message_templates_org_id ON message_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_channel ON message_templates(org_id, channel);
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(org_id, category);
-- RLS for templates
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view templates in their org"
  ON message_templates FOR SELECT
  USING (user_has_org_access(org_id) AND (is_shared OR created_by = auth.uid()));
CREATE POLICY "Users can insert templates in their org"
  ON message_templates FOR INSERT
  WITH CHECK (user_has_org_access(org_id));
CREATE POLICY "Users can update their own templates or shared ones as admin"
  ON message_templates FOR UPDATE
  USING (
    user_has_org_access(org_id) AND
    (created_by = auth.uid() OR user_is_org_manager_or_above(org_id))
  );
CREATE POLICY "Users can delete their own templates or as admin"
  ON message_templates FOR DELETE
  USING (
    user_has_org_access(org_id) AND
    (created_by = auth.uid() OR user_is_org_manager_or_above(org_id))
  );
-- ============================================================================
-- SEQUENCES (Automated outreach campaigns)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Sequence info
  name TEXT NOT NULL,
  description TEXT,

  -- Trigger settings
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN (
    'manual',           -- manually enroll leads
    'lead_created',     -- auto-enroll new leads
    'stage_change',     -- when lead moves to specific stage
    'priority_lane',    -- when added to priority lane
    'tag_added'         -- when specific tag is added
  )),
  trigger_conditions JSONB DEFAULT '{}',

  -- Execution settings
  send_window_start TIME DEFAULT '09:00',
  send_window_end TIME DEFAULT '17:00',
  send_days TEXT[] DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri'],
  timezone TEXT DEFAULT 'America/New_York',

  -- Exit conditions
  exit_on_reply BOOLEAN NOT NULL DEFAULT true,
  exit_on_meeting_scheduled BOOLEAN NOT NULL DEFAULT true,
  exit_on_unsubscribe BOOLEAN NOT NULL DEFAULT true,

  -- Stats
  total_enrolled INTEGER NOT NULL DEFAULT 0,
  total_completed INTEGER NOT NULL DEFAULT 0,
  total_replied INTEGER NOT NULL DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),

  -- Ownership
  created_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes for sequences
CREATE INDEX IF NOT EXISTS idx_sequences_org_id ON sequences(org_id);
CREATE INDEX IF NOT EXISTS idx_sequences_status ON sequences(org_id, status);
CREATE INDEX IF NOT EXISTS idx_sequences_trigger_type ON sequences(trigger_type) WHERE status = 'active';
-- RLS for sequences
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view sequences in their org"
  ON sequences FOR SELECT
  USING (user_has_org_access(org_id));
CREATE POLICY "Managers can insert sequences"
  ON sequences FOR INSERT
  WITH CHECK (user_is_org_manager_or_above(org_id));
CREATE POLICY "Managers can update sequences"
  ON sequences FOR UPDATE
  USING (user_is_org_manager_or_above(org_id));
CREATE POLICY "Managers can delete sequences"
  ON sequences FOR DELETE
  USING (user_is_org_manager_or_above(org_id));
-- ============================================================================
-- SEQUENCE STEPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,

  -- Step order
  step_number INTEGER NOT NULL,

  -- Timing (delay from previous step or enrollment)
  delay_days INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  delay_minutes INTEGER NOT NULL DEFAULT 0,

  -- Action type
  action_type TEXT NOT NULL CHECK (action_type IN (
    'send_email',
    'send_sms',
    'create_task',
    'add_tag',
    'move_to_lane',
    'notify_owner'
  )),

  -- Content (for messages)
  channel TEXT CHECK (channel IN ('sms', 'email')),
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,

  -- For other actions
  action_config JSONB DEFAULT '{}',

  -- Conditional execution
  condition_type TEXT DEFAULT 'always' CHECK (condition_type IN (
    'always',
    'if_no_reply',
    'if_no_open',
    'if_opened',
    'if_clicked'
  )),

  -- Stats
  times_executed INTEGER NOT NULL DEFAULT 0,
  times_skipped INTEGER NOT NULL DEFAULT 0,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(sequence_id, step_number)
);
-- Indexes for sequence_steps
CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence_id ON sequence_steps(sequence_id);
-- RLS for sequence_steps (inherits from sequence)
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view steps for sequences they can see"
  ON sequence_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sequences WHERE sequences.id = sequence_steps.sequence_id
    AND user_has_org_access(sequences.org_id)
  ));
CREATE POLICY "Managers can manage steps"
  ON sequence_steps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sequences WHERE sequences.id = sequence_steps.sequence_id
    AND user_is_org_manager_or_above(sequences.org_id)
  ));
-- ============================================================================
-- SEQUENCE ENROLLMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,

  -- Who is enrolled
  lead_id UUID REFERENCES zoho_lead_submissions(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

  -- Current state
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',      -- currently running
    'paused',      -- temporarily paused
    'completed',   -- finished all steps
    'exited',      -- exited early (reply, unsubscribe, etc.)
    'failed'       -- failed to execute
  )),
  exit_reason TEXT,

  -- Scheduling
  next_step_at TIMESTAMPTZ,

  -- Stats
  messages_sent INTEGER NOT NULL DEFAULT 0,
  messages_opened INTEGER NOT NULL DEFAULT 0,
  messages_clicked INTEGER NOT NULL DEFAULT 0,

  -- Who enrolled them
  enrolled_by UUID REFERENCES auth.users(id),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Completion
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate enrollments
  UNIQUE(sequence_id, lead_id) WHERE lead_id IS NOT NULL,
  UNIQUE(sequence_id, contact_id) WHERE contact_id IS NOT NULL
);
-- Indexes for enrollments
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_sequence_id ON sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_lead_id ON sequence_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_status ON sequence_enrollments(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_next_step ON sequence_enrollments(next_step_at)
  WHERE status = 'active' AND next_step_at IS NOT NULL;
-- RLS for enrollments
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view enrollments in their org"
  ON sequence_enrollments FOR SELECT
  USING (user_has_org_access(org_id));
CREATE POLICY "Users can insert enrollments in their org"
  ON sequence_enrollments FOR INSERT
  WITH CHECK (user_has_org_access(org_id));
CREATE POLICY "Users can update enrollments in their org"
  ON sequence_enrollments FOR UPDATE
  USING (user_has_org_access(org_id));
-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get or create a conversation for a lead/contact
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_org_id UUID,
  p_lead_id UUID DEFAULT NULL,
  p_contact_id UUID DEFAULT NULL,
  p_channel TEXT DEFAULT 'both'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
  v_participant_name TEXT;
  v_participant_email TEXT;
  v_participant_phone TEXT;
BEGIN
  -- Try to find existing conversation
  IF p_lead_id IS NOT NULL THEN
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE org_id = p_org_id AND lead_id = p_lead_id
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
      -- Get lead info
      SELECT
        COALESCE(first_name || ' ' || last_name, email),
        email,
        phone
      INTO v_participant_name, v_participant_email, v_participant_phone
      FROM zoho_lead_submissions
      WHERE id = p_lead_id;
    END IF;
  ELSIF p_contact_id IS NOT NULL THEN
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE org_id = p_org_id AND contact_id = p_contact_id
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
      -- Get contact info
      SELECT
        COALESCE(first_name || ' ' || last_name, email),
        email,
        phone
      INTO v_participant_name, v_participant_email, v_participant_phone
      FROM contacts
      WHERE id = p_contact_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Either lead_id or contact_id must be provided';
  END IF;

  -- Create if not exists
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (
      org_id, lead_id, contact_id, channel,
      participant_name, participant_email, participant_phone
    ) VALUES (
      p_org_id, p_lead_id, p_contact_id, p_channel,
      COALESCE(v_participant_name, 'Unknown'),
      v_participant_email,
      v_participant_phone
    )
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;
-- Function to send a message
CREATE OR REPLACE FUNCTION send_message(
  p_org_id UUID,
  p_conversation_id UUID,
  p_channel TEXT,
  p_content TEXT,
  p_subject TEXT DEFAULT NULL,
  p_body_html TEXT DEFAULT NULL,
  p_to_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
  v_conversation RECORD;
BEGIN
  -- Get conversation details
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = p_conversation_id AND org_id = p_org_id;

  IF v_conversation IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  -- Determine to_address
  IF p_to_address IS NULL THEN
    IF p_channel = 'email' THEN
      p_to_address := v_conversation.participant_email;
    ELSE
      p_to_address := v_conversation.participant_phone;
    END IF;
  END IF;

  -- Insert the message
  INSERT INTO messages (
    org_id, conversation_id, channel, direction,
    content, subject, body_text, body_html,
    to_address, status, sent_by, sent_at
  ) VALUES (
    p_org_id, p_conversation_id, p_channel, 'outbound',
    p_content, p_subject, p_content, p_body_html,
    p_to_address, 'pending', auth.uid(), now()
  )
  RETURNING id INTO v_message_id;

  -- Update conversation
  UPDATE conversations SET
    last_message_at = now(),
    last_message_preview = LEFT(p_content, 100),
    last_message_direction = 'outbound',
    updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_message_id;
END;
$$;
-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_conversation_read(
  p_conversation_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark all unread messages as read
  UPDATE messages SET
    read_at = now(),
    read_by = auth.uid()
  WHERE conversation_id = p_conversation_id
    AND direction = 'inbound'
    AND read_at IS NULL;

  -- Reset unread count
  UPDATE conversations SET
    unread_count = 0,
    updated_at = now()
  WHERE id = p_conversation_id;
END;
$$;
-- Function to enroll in a sequence
CREATE OR REPLACE FUNCTION enroll_in_sequence(
  p_org_id UUID,
  p_sequence_id UUID,
  p_lead_id UUID DEFAULT NULL,
  p_contact_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment_id UUID;
  v_first_step RECORD;
  v_next_step_at TIMESTAMPTZ;
BEGIN
  -- Validate sequence is active
  IF NOT EXISTS (
    SELECT 1 FROM sequences
    WHERE id = p_sequence_id AND org_id = p_org_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Sequence is not active';
  END IF;

  -- Get first step timing
  SELECT * INTO v_first_step
  FROM sequence_steps
  WHERE sequence_id = p_sequence_id AND step_number = 1 AND is_active = true;

  -- Calculate next step time
  IF v_first_step IS NOT NULL THEN
    v_next_step_at := now() +
      (v_first_step.delay_days || ' days')::interval +
      (v_first_step.delay_hours || ' hours')::interval +
      (v_first_step.delay_minutes || ' minutes')::interval;
  END IF;

  -- Create enrollment
  INSERT INTO sequence_enrollments (
    org_id, sequence_id, lead_id, contact_id,
    current_step, status, next_step_at, enrolled_by
  ) VALUES (
    p_org_id, p_sequence_id, p_lead_id, p_contact_id,
    0, 'active', v_next_step_at, auth.uid()
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_enrollment_id;

  -- Update sequence stats
  IF v_enrollment_id IS NOT NULL THEN
    UPDATE sequences SET
      total_enrolled = total_enrolled + 1,
      updated_at = now()
    WHERE id = p_sequence_id;
  END IF;

  RETURN v_enrollment_id;
END;
$$;
-- Function to get inbox summary
CREATE OR REPLACE FUNCTION get_inbox_summary(
  p_org_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_conversations BIGINT,
  unread_conversations BIGINT,
  active_sequences BIGINT,
  pending_messages BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM conversations WHERE org_id = p_org_id AND status = 'active')::BIGINT,
    (SELECT COUNT(*) FROM conversations WHERE org_id = p_org_id AND unread_count > 0)::BIGINT,
    (SELECT COUNT(*) FROM sequence_enrollments WHERE org_id = p_org_id AND status = 'active')::BIGINT,
    (SELECT COUNT(*) FROM messages WHERE org_id = p_org_id AND status = 'pending')::BIGINT;
END;
$$;
-- ============================================================================
-- SEED DATA: Sample templates
-- ============================================================================

-- These will be inserted for the default org
INSERT INTO message_templates (org_id, name, description, channel, category, subject, body_text, variables, is_shared)
SELECT
  'a0000000-0000-0000-0000-000000000001'::UUID,
  name, description, channel, category, subject, body_text, variables::JSONB, true
FROM (VALUES
  (
    'Initial Outreach',
    'First contact with a new lead',
    'email',
    'outreach',
    'Quick question about your Medicare coverage',
    E'Hi {{first_name}},\n\nI noticed you recently inquired about Medicare options. I''d love to help you understand your choices and find the best plan for your needs.\n\nWould you have a few minutes this week for a quick call?\n\nBest regards,\n{{advisor_name}}',
    '[{"name": "first_name", "default": "there"}, {"name": "advisor_name", "default": "Your Advisor"}]'
  ),
  (
    'Follow-up Reminder',
    'Gentle follow-up after no response',
    'email',
    'follow-up',
    'Following up on Medicare options',
    E'Hi {{first_name}},\n\nI wanted to follow up on my previous message about Medicare coverage options. I understand you might be busy, but I''m here to help whenever you''re ready.\n\nFeel free to reply to this email or give me a call at your convenience.\n\nBest,\n{{advisor_name}}',
    '[{"name": "first_name", "default": "there"}, {"name": "advisor_name", "default": "Your Advisor"}]'
  ),
  (
    'SMS Introduction',
    'Quick SMS intro message',
    'sms',
    'outreach',
    NULL,
    'Hi {{first_name}}! This is {{advisor_name}} from MPB Health. I saw your inquiry about Medicare plans. Would you like to schedule a quick call to discuss your options? Reply YES to get started!',
    '[{"name": "first_name", "default": "there"}, {"name": "advisor_name", "default": "Your Advisor"}]'
  ),
  (
    'Appointment Confirmation',
    'Confirm scheduled appointment',
    'sms',
    'scheduling',
    NULL,
    'Hi {{first_name}}! Just confirming our call scheduled for {{appointment_time}}. I''ll call you at this number. Reply if you need to reschedule!',
    '[{"name": "first_name", "default": "there"}, {"name": "appointment_time", "default": "tomorrow"}]'
  ),
  (
    'Thank You',
    'Post-meeting thank you',
    'email',
    'follow-up',
    'Thank you for your time!',
    E'Hi {{first_name}},\n\nThank you for taking the time to speak with me today about your Medicare options. I enjoyed our conversation and look forward to helping you find the perfect plan.\n\nAs we discussed, I''ll be sending over some plan comparisons shortly. Please don''t hesitate to reach out if you have any questions.\n\nBest regards,\n{{advisor_name}}',
    '[{"name": "first_name", "default": "there"}, {"name": "advisor_name", "default": "Your Advisor"}]'
  )
) AS t(name, description, channel, category, subject, body_text, variables)
ON CONFLICT DO NOTHING;
-- Add updated_at trigger for all new tables
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sequences_updated_at
  BEFORE UPDATE ON sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sequence_steps_updated_at
  BEFORE UPDATE ON sequence_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sequence_enrollments_updated_at
  BEFORE UPDATE ON sequence_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for conversations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

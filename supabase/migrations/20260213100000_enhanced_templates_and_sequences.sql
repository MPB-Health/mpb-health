-- ============================================================================
-- Migration: Enhanced Templates, Email Sequences, Meeting Scheduler & Calendar
-- Created: 2026-02-13
-- Description: Adds template folders, versioning & performance tracking,
--              email sequences with enrollments, calendar enhancements,
--              meeting scheduler, and calendar integrations.
-- ============================================================================

-- ============================================================================
-- PART 1: Template Folders
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_template_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_folder_id UUID REFERENCES crm_template_folders(id),
  color TEXT DEFAULT '#6366F1',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_template_folders_org
  ON crm_template_folders(org_id);

CREATE INDEX IF NOT EXISTS idx_crm_template_folders_parent
  ON crm_template_folders(parent_folder_id);

-- ============================================================================
-- PART 2: Template Enhancements (ALTER existing crm_templates)
-- ============================================================================

ALTER TABLE crm_templates
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES crm_template_folders(id),
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES crm_templates(id),
  ADD COLUMN IF NOT EXISTS performance_score NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_rate NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_rate NUMERIC(5,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_crm_templates_folder
  ON crm_templates(folder_id);

CREATE INDEX IF NOT EXISTS idx_crm_templates_version
  ON crm_templates(parent_version_id);

CREATE INDEX IF NOT EXISTS idx_crm_templates_performance
  ON crm_templates(performance_score DESC);

-- ============================================================================
-- PART 3: Email Sequences
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  trigger_type TEXT DEFAULT 'manual'
    CHECK (trigger_type IN ('manual', 'lead_created', 'stage_change', 'tag_added')),
  trigger_config JSONB DEFAULT '{}',
  exit_conditions JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_email_sequences_org
  ON crm_email_sequences(org_id);

CREATE INDEX IF NOT EXISTS idx_crm_email_sequences_status
  ON crm_email_sequences(status);

-- ============================================================================
-- PART 4: Email Sequence Steps
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES crm_email_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_type TEXT DEFAULT 'email'
    CHECK (step_type IN ('email', 'wait', 'condition', 'task')),
  template_id UUID REFERENCES crm_templates(id),
  subject_override TEXT,
  body_override TEXT,
  delay_days INTEGER DEFAULT 1,
  delay_hours INTEGER DEFAULT 0,
  condition_config JSONB,
  task_config JSONB,
  is_active BOOLEAN DEFAULT true,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(sequence_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_crm_sequence_steps_sequence
  ON crm_email_sequence_steps(sequence_id);

CREATE INDEX IF NOT EXISTS idx_crm_sequence_steps_template
  ON crm_email_sequence_steps(template_id);

-- ============================================================================
-- PART 5: Email Sequence Enrollments
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES crm_email_sequences(id) ON DELETE CASCADE,
  lead_id UUID,
  contact_id UUID,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'replied', 'bounced', 'unsubscribed', 'manually_removed')),
  current_step INTEGER DEFAULT 1,
  next_action_at TIMESTAMPTZ,
  enrolled_by UUID,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_sequence
  ON crm_email_sequence_enrollments(sequence_id);

CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_lead
  ON crm_email_sequence_enrollments(lead_id);

CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_contact
  ON crm_email_sequence_enrollments(contact_id);

CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_status
  ON crm_email_sequence_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_next_action
  ON crm_email_sequence_enrollments(next_action_at)
  WHERE status = 'active';

-- ============================================================================
-- PART 6: Calendar Event Enhancements (ALTER existing calendar_events)
-- ============================================================================

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS org_id UUID,
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS original_event_id UUID REFERENCES calendar_events(id),
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366F1',
  ADD COLUMN IF NOT EXISTS attendees JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_calendar_events_org
  ON calendar_events(org_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_original
  ON calendar_events(original_event_id);

-- ============================================================================
-- PART 7: Meeting Schedules
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_meeting_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  buffer_minutes INTEGER DEFAULT 0,
  slug TEXT NOT NULL UNIQUE,
  available_hours JSONB DEFAULT '{}',
  booking_window_days INTEGER DEFAULT 30,
  confirmation_template_id UUID REFERENCES crm_templates(id),
  reminder_template_id UUID REFERENCES crm_templates(id),
  is_active BOOLEAN DEFAULT true,
  location_type TEXT DEFAULT 'video'
    CHECK (location_type IN ('video', 'phone', 'in_person', 'custom')),
  location_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_meeting_schedules_org
  ON crm_meeting_schedules(org_id);

CREATE INDEX IF NOT EXISTS idx_crm_meeting_schedules_user
  ON crm_meeting_schedules(user_id);

CREATE INDEX IF NOT EXISTS idx_crm_meeting_schedules_slug
  ON crm_meeting_schedules(slug);

-- ============================================================================
-- PART 8: Meeting Bookings
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_meeting_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES crm_meeting_schedules(id) ON DELETE CASCADE,
  lead_id UUID,
  contact_id UUID,
  booker_name TEXT NOT NULL,
  booker_email TEXT NOT NULL,
  booker_phone TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  calendar_event_id UUID REFERENCES calendar_events(id),
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_meeting_bookings_schedule
  ON crm_meeting_bookings(schedule_id);

CREATE INDEX IF NOT EXISTS idx_crm_meeting_bookings_lead
  ON crm_meeting_bookings(lead_id);

CREATE INDEX IF NOT EXISTS idx_crm_meeting_bookings_time
  ON crm_meeting_bookings(start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_crm_meeting_bookings_status
  ON crm_meeting_bookings(status);

-- ============================================================================
-- PART 9: Calendar Integrations
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL
    CHECK (provider IN ('google', 'outlook', 'apple')),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_crm_calendar_integrations_org
  ON crm_calendar_integrations(org_id);

CREATE INDEX IF NOT EXISTS idx_crm_calendar_integrations_user
  ON crm_calendar_integrations(user_id);

-- ============================================================================
-- PART 10: Row Level Security
-- ============================================================================

-- --------------------------------------------------------------------------
-- crm_template_folders
-- --------------------------------------------------------------------------
ALTER TABLE crm_template_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view template folders for their org"
  ON crm_template_folders
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create template folders for their org"
  ON crm_template_folders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update template folders for their org"
  ON crm_template_folders
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  )
  WITH CHECK (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete template folders for their org"
  ON crm_template_folders
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

-- --------------------------------------------------------------------------
-- crm_email_sequences
-- --------------------------------------------------------------------------
ALTER TABLE crm_email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sequences for their org"
  ON crm_email_sequences
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create sequences for their org"
  ON crm_email_sequences
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update sequences for their org"
  ON crm_email_sequences
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  )
  WITH CHECK (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete sequences for their org"
  ON crm_email_sequences
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

-- --------------------------------------------------------------------------
-- crm_email_sequence_steps
-- --------------------------------------------------------------------------
ALTER TABLE crm_email_sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sequence steps for their org"
  ON crm_email_sequence_steps
  FOR SELECT
  TO authenticated
  USING (
    sequence_id IN (
      SELECT id FROM crm_email_sequences
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create sequence steps for their org"
  ON crm_email_sequence_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sequence_id IN (
      SELECT id FROM crm_email_sequences
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update sequence steps for their org"
  ON crm_email_sequence_steps
  FOR UPDATE
  TO authenticated
  USING (
    sequence_id IN (
      SELECT id FROM crm_email_sequences
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    sequence_id IN (
      SELECT id FROM crm_email_sequences
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete sequence steps for their org"
  ON crm_email_sequence_steps
  FOR DELETE
  TO authenticated
  USING (
    sequence_id IN (
      SELECT id FROM crm_email_sequences
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

-- --------------------------------------------------------------------------
-- crm_email_sequence_enrollments
-- --------------------------------------------------------------------------
ALTER TABLE crm_email_sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view enrollments for their org"
  ON crm_email_sequence_enrollments
  FOR SELECT
  TO authenticated
  USING (
    sequence_id IN (
      SELECT id FROM crm_email_sequences
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create enrollments for their org"
  ON crm_email_sequence_enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sequence_id IN (
      SELECT id FROM crm_email_sequences
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update enrollments for their org"
  ON crm_email_sequence_enrollments
  FOR UPDATE
  TO authenticated
  USING (
    sequence_id IN (
      SELECT id FROM crm_email_sequences
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    sequence_id IN (
      SELECT id FROM crm_email_sequences
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete enrollments for their org"
  ON crm_email_sequence_enrollments
  FOR DELETE
  TO authenticated
  USING (
    sequence_id IN (
      SELECT id FROM crm_email_sequences
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

-- --------------------------------------------------------------------------
-- crm_meeting_schedules
-- --------------------------------------------------------------------------
ALTER TABLE crm_meeting_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meeting schedules for their org"
  ON crm_meeting_schedules
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create meeting schedules for their org"
  ON crm_meeting_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update meeting schedules for their org"
  ON crm_meeting_schedules
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  )
  WITH CHECK (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete meeting schedules for their org"
  ON crm_meeting_schedules
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

-- --------------------------------------------------------------------------
-- crm_meeting_bookings
-- --------------------------------------------------------------------------
ALTER TABLE crm_meeting_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bookings for their org"
  ON crm_meeting_bookings
  FOR SELECT
  TO authenticated
  USING (
    schedule_id IN (
      SELECT id FROM crm_meeting_schedules
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create bookings for their org"
  ON crm_meeting_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    schedule_id IN (
      SELECT id FROM crm_meeting_schedules
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update bookings for their org"
  ON crm_meeting_bookings
  FOR UPDATE
  TO authenticated
  USING (
    schedule_id IN (
      SELECT id FROM crm_meeting_schedules
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    schedule_id IN (
      SELECT id FROM crm_meeting_schedules
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete bookings for their org"
  ON crm_meeting_bookings
  FOR DELETE
  TO authenticated
  USING (
    schedule_id IN (
      SELECT id FROM crm_meeting_schedules
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

-- --------------------------------------------------------------------------
-- crm_calendar_integrations
-- --------------------------------------------------------------------------
ALTER TABLE crm_calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calendar integrations for their org"
  ON crm_calendar_integrations
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create calendar integrations for their org"
  ON crm_calendar_integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update calendar integrations for their org"
  ON crm_calendar_integrations
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  )
  WITH CHECK (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete calendar integrations for their org"
  ON crm_calendar_integrations
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );

-- ============================================================================
-- PART 11: Updated-at Triggers
-- ============================================================================

DROP TRIGGER IF EXISTS trg_crm_template_folders_updated ON crm_template_folders;
CREATE TRIGGER trg_crm_template_folders_updated
  BEFORE UPDATE ON crm_template_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_email_sequences_updated ON crm_email_sequences;
CREATE TRIGGER trg_crm_email_sequences_updated
  BEFORE UPDATE ON crm_email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_meeting_schedules_updated ON crm_meeting_schedules;
CREATE TRIGGER trg_crm_meeting_schedules_updated
  BEFORE UPDATE ON crm_meeting_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_calendar_integrations_updated ON crm_calendar_integrations;
CREATE TRIGGER trg_crm_calendar_integrations_updated
  BEFORE UPDATE ON crm_calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 12: Service Role Bypass Policies
-- ============================================================================

CREATE POLICY "Service role full access to template_folders"
  ON crm_template_folders FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to email_sequences"
  ON crm_email_sequences FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to sequence_steps"
  ON crm_email_sequence_steps FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to sequence_enrollments"
  ON crm_email_sequence_enrollments FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to meeting_schedules"
  ON crm_meeting_schedules FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to meeting_bookings"
  ON crm_meeting_bookings FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access to calendar_integrations"
  ON crm_calendar_integrations FOR ALL TO service_role USING (true);

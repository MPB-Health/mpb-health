-- ============================================================================
-- Championship CRM Enhancement Migration
-- AI Task Cluster, Templates, Notifications, Calendar
-- ============================================================================

-- ----------------------------------------------------------------------------
-- AI Lead Insights Table
-- Stores AI-generated scores, summaries, and recommendations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_lead_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES zoho_lead_submissions(id) ON DELETE CASCADE,
  
  -- AI Scoring
  ai_score INTEGER DEFAULT 0 CHECK (ai_score >= 0 AND ai_score <= 100),
  score_factors JSONB DEFAULT '[]'::jsonb,
  conversion_probability DECIMAL(5,2) DEFAULT 0,
  
  -- Engagement Metrics
  engagement_level TEXT DEFAULT 'low' CHECK (engagement_level IN ('low', 'medium', 'high', 'very_high')),
  response_likelihood TEXT DEFAULT 'medium' CHECK (response_likelihood IN ('low', 'medium', 'high')),
  
  -- AI Recommendations
  recommended_action TEXT,
  recommended_channel TEXT CHECK (recommended_channel IN ('call', 'email', 'sms', 'meeting')),
  recommended_timing TIMESTAMPTZ,
  follow_up_urgency TEXT DEFAULT 'normal' CHECK (follow_up_urgency IN ('low', 'normal', 'high', 'urgent')),
  
  -- Conversation Summary
  conversation_summary TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  objections JSONB DEFAULT '[]'::jsonb,
  interests JSONB DEFAULT '[]'::jsonb,
  
  -- Next Best Actions
  next_actions JSONB DEFAULT '[]'::jsonb,
  
  -- Draft Content (AI-generated)
  draft_email_subject TEXT,
  draft_email_body TEXT,
  draft_sms TEXT,
  
  -- Metadata
  last_analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  analysis_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lead_id)
);
-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_lead_insights_lead_id ON ai_lead_insights(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_lead_insights_ai_score ON ai_lead_insights(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_lead_insights_urgency ON ai_lead_insights(follow_up_urgency);
-- ----------------------------------------------------------------------------
-- CRM Templates Table
-- Email and SMS templates library
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Info
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('email', 'sms', 'both')),
  category TEXT DEFAULT 'general',
  
  -- Content
  subject TEXT, -- For email templates
  body TEXT NOT NULL,
  
  -- Variables available in this template
  variables JSONB DEFAULT '[]'::jsonb,
  
  -- Tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- AI Features
  is_ai_generated BOOLEAN DEFAULT false,
  ai_performance_score DECIMAL(5,2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Ownership
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Index for template lookups
CREATE INDEX IF NOT EXISTS idx_crm_templates_type ON crm_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_crm_templates_category ON crm_templates(category);
CREATE INDEX IF NOT EXISTS idx_crm_templates_active ON crm_templates(is_active);
-- ----------------------------------------------------------------------------
-- Notification Preferences Table
-- Staff notification settings per channel
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email Notifications
  email_enabled BOOLEAN DEFAULT true,
  email_new_leads BOOLEAN DEFAULT true,
  email_hot_leads BOOLEAN DEFAULT true,
  email_task_reminders BOOLEAN DEFAULT true,
  email_daily_digest BOOLEAN DEFAULT true,
  email_weekly_summary BOOLEAN DEFAULT true,
  
  -- Push Notifications
  push_enabled BOOLEAN DEFAULT false,
  push_subscription JSONB, -- Web push subscription object
  push_new_leads BOOLEAN DEFAULT true,
  push_hot_leads BOOLEAN DEFAULT true,
  push_task_due BOOLEAN DEFAULT true,
  push_lead_activity BOOLEAN DEFAULT false,
  
  -- Slack Notifications
  slack_enabled BOOLEAN DEFAULT false,
  slack_webhook_url TEXT,
  slack_channel TEXT,
  slack_new_leads BOOLEAN DEFAULT true,
  slack_hot_leads BOOLEAN DEFAULT true,
  slack_daily_summary BOOLEAN DEFAULT false,
  
  -- Quiet Hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Priority Thresholds
  min_priority_for_push TEXT DEFAULT 'high' CHECK (min_priority_for_push IN ('low', 'medium', 'high', 'critical')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);
-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
-- ----------------------------------------------------------------------------
-- Calendar Events Table
-- Appointment tracking and scheduling
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Info
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('call', 'meeting', 'follow_up', 'demo', 'other')),
  
  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Location/Link
  location TEXT,
  meeting_link TEXT,
  
  -- Associations
  lead_id UUID REFERENCES zoho_lead_submissions(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT false,
  reminder_minutes INTEGER DEFAULT 30,
  
  -- External Calendar Sync
  external_calendar_id TEXT,
  external_event_id TEXT,
  last_synced_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  outcome TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for calendar queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_lead ON calendar_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_assigned ON calendar_events(assigned_to);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
-- ----------------------------------------------------------------------------
-- Notification Log Table
-- Track all sent notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID REFERENCES auth.users(id),
  
  -- Notification Details
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'slack', 'in_app')),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  
  -- Reference
  lead_id UUID REFERENCES zoho_lead_submissions(id) ON DELETE SET NULL,
  task_id UUID REFERENCES lead_tasks(id) ON DELETE SET NULL,
  event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  
  -- Delivery Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'clicked')),
  error_message TEXT,
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Index for notification queries
CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_channel ON notification_log(channel);
CREATE INDEX IF NOT EXISTS idx_notification_log_created ON notification_log(created_at DESC);
-- ----------------------------------------------------------------------------
-- AI Task Automation Rules Table
-- Configure automatic task creation rules
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Rule Info
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Trigger Conditions
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'new_lead', 'stage_change', 'no_activity', 'high_score', 
    'task_overdue', 'scheduled_time', 'lead_activity'
  )),
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  
  -- Action
  action_type TEXT NOT NULL CHECK (action_type IN (
    'create_task', 'send_notification', 'assign_lead', 
    'update_priority', 'send_email', 'send_slack'
  )),
  action_config JSONB DEFAULT '{}'::jsonb,
  
  -- Timing
  delay_minutes INTEGER DEFAULT 0,
  
  -- Tracking
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Index for active rules
CREATE INDEX IF NOT EXISTS idx_ai_automation_rules_active ON ai_automation_rules(is_active, trigger_type);
-- ----------------------------------------------------------------------------
-- Insert Default Templates
-- ----------------------------------------------------------------------------
INSERT INTO crm_templates (name, description, template_type, category, subject, body, variables, is_default) VALUES
(
  'Initial Follow-up',
  'First follow-up after lead submission',
  'email',
  'follow_up',
  'Thanks for your interest in MPB Health, {{first_name}}!',
  E'Hi {{first_name}},\n\nThank you for reaching out to learn more about our health sharing programs!\n\nI noticed you were looking at {{plan_interest}} options. I''d love to help you find the perfect fit for your needs.\n\nWould you have a few minutes for a quick call this week? I can answer any questions and walk you through the best options based on your situation.\n\nBest regards,\n{{advisor_name}}\nMPB Health Advisor\n{{advisor_phone}}',
  '["first_name", "plan_interest", "advisor_name", "advisor_phone"]',
  true
),
(
  'Hot Lead Alert',
  'Urgent follow-up for high-priority leads',
  'email',
  'hot_lead',
  '🔥 {{first_name}}, let''s get you covered today!',
  E'Hi {{first_name}},\n\nI wanted to personally reach out because I can see you''re serious about finding the right health coverage.\n\nBased on what you shared, I think I have some excellent options that could save you {{potential_savings}} compared to traditional insurance.\n\nCan we schedule a quick 10-minute call today? I have availability at {{available_times}}.\n\nLooking forward to helping you!\n\n{{advisor_name}}',
  '["first_name", "potential_savings", "available_times", "advisor_name"]',
  true
),
(
  'Quick SMS Follow-up',
  'Short SMS for quick touchpoint',
  'sms',
  'follow_up',
  NULL,
  'Hi {{first_name}}! This is {{advisor_name}} from MPB Health. Just checking in about the health plan info you requested. Any questions I can help with? Reply or call me at {{advisor_phone}}',
  '["first_name", "advisor_name", "advisor_phone"]',
  true
),
(
  'Appointment Reminder',
  'Reminder before scheduled call',
  'both',
  'appointment',
  'Reminder: Your MPB Health consultation is coming up!',
  E'Hi {{first_name}},\n\nJust a friendly reminder that we have a call scheduled for {{appointment_time}}.\n\nI''ll be calling you at {{phone}}. If you need to reschedule, just reply to this message.\n\nTalk soon!\n{{advisor_name}}',
  '["first_name", "appointment_time", "phone", "advisor_name"]',
  true
),
(
  'No Response Follow-up',
  'Follow-up after no response',
  'email',
  'follow_up',
  '{{first_name}}, still interested in health coverage options?',
  E'Hi {{first_name}},\n\nI reached out a few days ago about your health sharing inquiry but haven''t heard back. No worries - I know things get busy!\n\nJust wanted to make sure you have all the information you need. Our programs can often save families $300-$500/month compared to traditional insurance.\n\nIf you''d like to chat, I''m here to help. Just reply to this email or give me a call.\n\nBest,\n{{advisor_name}}\n{{advisor_phone}}',
  '["first_name", "advisor_name", "advisor_phone"]',
  true
)
ON CONFLICT DO NOTHING;
-- ----------------------------------------------------------------------------
-- Insert Default Automation Rules
-- ----------------------------------------------------------------------------
INSERT INTO ai_automation_rules (name, description, trigger_type, trigger_conditions, action_type, action_config) VALUES
(
  'Auto-task for new leads',
  'Create follow-up task when new lead arrives',
  'new_lead',
  '{}',
  'create_task',
  '{"task_type": "follow_up", "title": "Initial contact with new lead", "priority": "high", "due_hours": 2}'
),
(
  'Hot lead notification',
  'Send immediate notification for high-score leads',
  'high_score',
  '{"min_score": 80}',
  'send_notification',
  '{"channels": ["push", "slack"], "urgency": "urgent"}'
),
(
  'No activity reminder',
  'Create task when lead has no activity for 3 days',
  'no_activity',
  '{"days_inactive": 3, "stages": ["contacted", "qualified", "proposal"]}',
  'create_task',
  '{"task_type": "follow_up", "title": "Re-engage inactive lead", "priority": "medium", "due_hours": 24}'
),
(
  'Stage change notification',
  'Notify when lead moves to proposal stage',
  'stage_change',
  '{"to_stage": "proposal"}',
  'send_notification',
  '{"channels": ["email"], "template": "proposal_stage"}'
)
ON CONFLICT DO NOTHING;
-- ----------------------------------------------------------------------------
-- RLS Policies
-- ----------------------------------------------------------------------------

-- AI Lead Insights: Allow authenticated users to read
ALTER TABLE ai_lead_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read ai_lead_insights" ON ai_lead_insights
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service role full access ai_lead_insights" ON ai_lead_insights
  FOR ALL TO service_role USING (true);
-- CRM Templates: Allow authenticated users to manage
ALTER TABLE crm_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read crm_templates" ON crm_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert crm_templates" ON crm_templates
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update crm_templates" ON crm_templates
  FOR UPDATE TO authenticated USING (true);
-- Notification Preferences: Users can only access their own
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notification_preferences" ON notification_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id);
-- Calendar Events: Allow authenticated users
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read calendar_events" ON calendar_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert calendar_events" ON calendar_events
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update calendar_events" ON calendar_events
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete calendar_events" ON calendar_events
  FOR DELETE TO authenticated USING (assigned_to = auth.uid() OR created_by = auth.uid());
-- Notification Log: Users see their own
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notification_log" ON notification_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Allow service role full access notification_log" ON notification_log
  FOR ALL TO service_role USING (true);
-- Automation Rules: Authenticated read, service role write
ALTER TABLE ai_automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read ai_automation_rules" ON ai_automation_rules
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service role full access ai_automation_rules" ON ai_automation_rules
  FOR ALL TO service_role USING (true);
-- ----------------------------------------------------------------------------
-- Functions
-- ----------------------------------------------------------------------------

-- Function to get lead insights with AI recommendations
CREATE OR REPLACE FUNCTION get_lead_with_insights(p_lead_id UUID)
RETURNS TABLE (
  lead JSONB,
  insights JSONB,
  activities JSONB,
  tasks JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(l.*) as lead,
    to_jsonb(i.*) as insights,
    COALESCE((
      SELECT jsonb_agg(a.* ORDER BY a.created_at DESC)
      FROM lead_activities a
      WHERE a.lead_id = p_lead_id
      LIMIT 10
    ), '[]'::jsonb) as activities,
    COALESCE((
      SELECT jsonb_agg(t.* ORDER BY t.due_date ASC)
      FROM lead_tasks t
      WHERE t.lead_id = p_lead_id AND t.completed = false
    ), '[]'::jsonb) as tasks
  FROM zoho_lead_submissions l
  LEFT JOIN ai_lead_insights i ON i.lead_id = l.id
  WHERE l.id = p_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get upcoming calendar events
CREATE OR REPLACE FUNCTION get_upcoming_events(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  title TEXT,
  event_type TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  lead_id UUID,
  lead_name TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.event_type,
    e.start_time,
    e.end_time,
    e.lead_id,
    CONCAT(l.first_name, ' ', l.last_name) as lead_name,
    e.status
  FROM calendar_events e
  LEFT JOIN zoho_lead_submissions l ON l.id = e.lead_id
  WHERE e.assigned_to = p_user_id
    AND e.start_time >= NOW()
    AND e.start_time <= NOW() + (p_days || ' days')::INTERVAL
    AND e.status NOT IN ('cancelled')
  ORDER BY e.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to calculate lead score factors
CREATE OR REPLACE FUNCTION calculate_lead_score_factors(p_lead_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_lead RECORD;
  v_factors JSONB := '[]'::jsonb;
  v_score INTEGER := 0;
BEGIN
  SELECT * INTO v_lead FROM zoho_lead_submissions WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Household size scoring
  IF v_lead.household_size IS NOT NULL THEN
    IF v_lead.household_size >= 4 THEN
      v_factors := v_factors || jsonb_build_object('factor', 'Large household', 'points', 15, 'positive', true);
      v_score := v_score + 15;
    ELSIF v_lead.household_size >= 2 THEN
      v_factors := v_factors || jsonb_build_object('factor', 'Family household', 'points', 10, 'positive', true);
      v_score := v_score + 10;
    END IF;
  END IF;
  
  -- Contact preference scoring
  IF v_lead.contact_preference = 'call' THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Prefers phone calls', 'points', 20, 'positive', true);
    v_score := v_score + 20;
  ELSIF v_lead.contact_preference IS NOT NULL THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Has contact preference', 'points', 10, 'positive', true);
    v_score := v_score + 10;
  END IF;
  
  -- Primary concern scoring
  IF v_lead.primary_concern IN ('cost', 'coverage', 'both') THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Clear primary concern', 'points', 15, 'positive', true);
    v_score := v_score + 15;
  END IF;
  
  -- Lead age scoring (fresher = better)
  IF v_lead.created_at > NOW() - INTERVAL '24 hours' THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Fresh lead (< 24h)', 'points', 20, 'positive', true);
    v_score := v_score + 20;
  ELSIF v_lead.created_at > NOW() - INTERVAL '72 hours' THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Recent lead (< 3 days)', 'points', 10, 'positive', true);
    v_score := v_score + 10;
  ELSIF v_lead.created_at < NOW() - INTERVAL '7 days' THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Aging lead (> 7 days)', 'points', -10, 'positive', false);
    v_score := v_score - 10;
  END IF;
  
  -- Pipeline stage scoring
  IF v_lead.pipeline_stage = 'qualified' THEN
    v_factors := v_factors || jsonb_build_object('factor', 'Qualified status', 'points', 15, 'positive', true);
    v_score := v_score + 15;
  ELSIF v_lead.pipeline_stage = 'proposal' THEN
    v_factors := v_factors || jsonb_build_object('factor', 'In proposal stage', 'points', 25, 'positive', true);
    v_score := v_score + 25;
  END IF;
  
  -- Cap score between 0 and 100
  v_score := GREATEST(0, LEAST(100, v_score + 30)); -- Base score of 30
  
  -- Upsert the insights
  INSERT INTO ai_lead_insights (lead_id, ai_score, score_factors, last_analyzed_at)
  VALUES (p_lead_id, v_score, v_factors, NOW())
  ON CONFLICT (lead_id) DO UPDATE SET
    ai_score = EXCLUDED.ai_score,
    score_factors = EXCLUDED.score_factors,
    last_analyzed_at = NOW(),
    updated_at = NOW();
  
  RETURN jsonb_build_object('score', v_score, 'factors', v_factors);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to auto-calculate score on lead insert/update
CREATE OR REPLACE FUNCTION trigger_calculate_lead_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_lead_score_factors(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_calculate_lead_score ON zoho_lead_submissions;
CREATE TRIGGER trg_calculate_lead_score
  AFTER INSERT OR UPDATE ON zoho_lead_submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_lead_score();
-- ----------------------------------------------------------------------------
-- Update timestamp triggers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_ai_lead_insights_updated ON ai_lead_insights;
CREATE TRIGGER trg_ai_lead_insights_updated
  BEFORE UPDATE ON ai_lead_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trg_crm_templates_updated ON crm_templates;
CREATE TRIGGER trg_crm_templates_updated
  BEFORE UPDATE ON crm_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trg_notification_preferences_updated ON notification_preferences;
CREATE TRIGGER trg_notification_preferences_updated
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trg_calendar_events_updated ON calendar_events;
CREATE TRIGGER trg_calendar_events_updated
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

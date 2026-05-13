-- ============================================================================
-- Phase 8.2: Champion Automation Rules Engine
-- Enhanced automation with templates, conditions, and execution tracking
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extend ai_automation_rules with more trigger and action types
-- ----------------------------------------------------------------------------

-- Add new trigger types
ALTER TABLE ai_automation_rules
DROP CONSTRAINT IF EXISTS ai_automation_rules_trigger_type_check;
ALTER TABLE ai_automation_rules
ADD CONSTRAINT ai_automation_rules_trigger_type_check
CHECK (trigger_type IN (
  -- Original triggers
  'new_lead', 'stage_change', 'no_activity', 'high_score',
  'task_overdue', 'scheduled_time', 'lead_activity',
  -- New triggers
  'message_received', 'message_opened', 'message_clicked',
  'email_bounced', 'sequence_completed', 'sequence_enrolled',
  'meeting_scheduled', 'meeting_completed', 'meeting_cancelled',
  'tag_added', 'tag_removed', 'field_changed', 'priority_changed',
  'lead_assigned', 'compliance_due', 'form_submitted'
));
-- Add new action types
ALTER TABLE ai_automation_rules
DROP CONSTRAINT IF EXISTS ai_automation_rules_action_type_check;
ALTER TABLE ai_automation_rules
ADD CONSTRAINT ai_automation_rules_action_type_check
CHECK (action_type IN (
  -- Original actions
  'create_task', 'send_notification', 'assign_lead',
  'update_priority', 'send_email', 'send_slack',
  -- New actions
  'send_sms', 'enroll_sequence', 'exit_sequence',
  'add_to_lane', 'remove_from_lane', 'add_tag', 'remove_tag',
  'update_field', 'create_meeting', 'log_activity',
  'send_webhook', 'delay', 'branch'
));
-- Add org_id to ai_automation_rules if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_automation_rules' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE ai_automation_rules ADD COLUMN org_id UUID;
  END IF;
END $$;
-- Add priority column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_automation_rules' AND column_name = 'priority'
  ) THEN
    ALTER TABLE ai_automation_rules ADD COLUMN priority INTEGER DEFAULT 10;
  END IF;
END $$;
-- Add run_once column (only execute once per lead)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_automation_rules' AND column_name = 'run_once'
  ) THEN
    ALTER TABLE ai_automation_rules ADD COLUMN run_once BOOLEAN DEFAULT false;
  END IF;
END $$;
-- ----------------------------------------------------------------------------
-- 2. Automation Templates — Pre-built automation recipes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  icon TEXT DEFAULT 'zap',

  -- Template Definition
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}'::jsonb,
  delay_minutes INTEGER DEFAULT 0,

  -- Template Metadata
  is_popular BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,

  -- System vs Custom
  is_system BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_templates_category ON automation_templates(category);
CREATE INDEX IF NOT EXISTS idx_automation_templates_popular ON automation_templates(is_popular, use_count DESC);
-- ----------------------------------------------------------------------------
-- 3. Automation Conditions — Multi-condition logic for rules
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automation_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES ai_automation_rules(id) ON DELETE CASCADE,

  -- Condition Definition
  condition_group INTEGER DEFAULT 0, -- For grouping with AND/OR
  field_path TEXT NOT NULL,         -- e.g., 'lead.status', 'lead.ai_score'
  operator TEXT NOT NULL CHECK (operator IN (
    'equals', 'not_equals', 'contains', 'not_contains',
    'starts_with', 'ends_with', 'greater_than', 'less_than',
    'greater_or_equal', 'less_or_equal', 'is_empty', 'is_not_empty',
    'in_list', 'not_in_list', 'between', 'matches_regex'
  )),
  value JSONB NOT NULL,             -- The value to compare against

  -- Group Logic
  group_operator TEXT DEFAULT 'AND' CHECK (group_operator IN ('AND', 'OR')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_conditions_rule ON automation_conditions(rule_id);
-- ----------------------------------------------------------------------------
-- 4. Automation Actions Chain — Multiple actions per rule
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES ai_automation_rules(id) ON DELETE CASCADE,

  -- Action Definition
  action_order INTEGER NOT NULL DEFAULT 0,
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}'::jsonb,

  -- Delay before this action
  delay_minutes INTEGER DEFAULT 0,

  -- Conditional execution
  condition JSONB,  -- Optional condition for this specific action

  -- Stop on failure
  stop_on_failure BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_actions_rule ON automation_actions(rule_id, action_order);
-- ----------------------------------------------------------------------------
-- 5. Add org_id to automation_execution_log
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'automation_execution_log' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE automation_execution_log ADD COLUMN org_id UUID;
  END IF;

  -- Add action_id column for tracking individual actions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'automation_execution_log' AND column_name = 'action_id'
  ) THEN
    ALTER TABLE automation_execution_log ADD COLUMN action_id UUID REFERENCES automation_actions(id) ON DELETE SET NULL;
  END IF;

  -- Add execution_time_ms column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'automation_execution_log' AND column_name = 'execution_time_ms'
  ) THEN
    ALTER TABLE automation_execution_log ADD COLUMN execution_time_ms INTEGER;
  END IF;

  -- Add context column for debugging
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'automation_execution_log' AND column_name = 'context'
  ) THEN
    ALTER TABLE automation_execution_log ADD COLUMN context JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_auto_exec_log_org ON automation_execution_log(org_id, executed_at DESC);
-- ----------------------------------------------------------------------------
-- 6. Automation Run History — Track full execution chains
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  rule_id UUID NOT NULL REFERENCES ai_automation_rules(id) ON DELETE CASCADE,

  -- Trigger Context
  trigger_type TEXT NOT NULL,
  trigger_entity_type TEXT,  -- 'lead', 'message', 'task', etc.
  trigger_entity_id UUID,
  trigger_data JSONB DEFAULT '{}'::jsonb,

  -- Execution Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'cancelled', 'paused'
  )),

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Results
  actions_total INTEGER DEFAULT 0,
  actions_completed INTEGER DEFAULT 0,
  actions_failed INTEGER DEFAULT 0,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_automation_runs_org ON automation_runs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_rule ON automation_runs(rule_id, status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_entity ON automation_runs(trigger_entity_type, trigger_entity_id);
-- ----------------------------------------------------------------------------
-- 7. RLS Policies
-- ----------------------------------------------------------------------------

-- Automation Templates
ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read automation_templates"
  ON automation_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert automation_templates"
  ON automation_templates FOR INSERT TO authenticated WITH CHECK (NOT is_system);
CREATE POLICY "Allow authenticated update own automation_templates"
  ON automation_templates FOR UPDATE TO authenticated
  USING (NOT is_system OR created_by = auth.uid());
CREATE POLICY "Allow service role full access automation_templates"
  ON automation_templates FOR ALL TO service_role USING (true);
-- Automation Conditions
ALTER TABLE automation_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read automation_conditions"
  ON automation_conditions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert automation_conditions"
  ON automation_conditions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update automation_conditions"
  ON automation_conditions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete automation_conditions"
  ON automation_conditions FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow service role full access automation_conditions"
  ON automation_conditions FOR ALL TO service_role USING (true);
-- Automation Actions
ALTER TABLE automation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read automation_actions"
  ON automation_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert automation_actions"
  ON automation_actions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update automation_actions"
  ON automation_actions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete automation_actions"
  ON automation_actions FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow service role full access automation_actions"
  ON automation_actions FOR ALL TO service_role USING (true);
-- Automation Runs
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read automation_runs"
  ON automation_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert automation_runs"
  ON automation_runs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update automation_runs"
  ON automation_runs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow service role full access automation_runs"
  ON automation_runs FOR ALL TO service_role USING (true);
-- ----------------------------------------------------------------------------
-- 8. Helper Functions
-- ----------------------------------------------------------------------------

-- Get automation rules with their conditions and actions
CREATE OR REPLACE FUNCTION get_automation_rule_details(p_rule_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'rule', to_jsonb(r.*),
    'conditions', COALESCE((
      SELECT jsonb_agg(c.* ORDER BY c.condition_group, c.id)
      FROM automation_conditions c
      WHERE c.rule_id = p_rule_id
    ), '[]'::jsonb),
    'actions', COALESCE((
      SELECT jsonb_agg(a.* ORDER BY a.action_order)
      FROM automation_actions a
      WHERE a.rule_id = p_rule_id
    ), '[]'::jsonb)
  ) INTO v_result
  FROM ai_automation_rules r
  WHERE r.id = p_rule_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Get active rules for a trigger type
CREATE OR REPLACE FUNCTION get_active_automation_rules(
  p_org_id UUID,
  p_trigger_type TEXT
)
RETURNS SETOF ai_automation_rules AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM ai_automation_rules
  WHERE (org_id = p_org_id OR org_id IS NULL)
    AND trigger_type = p_trigger_type
    AND is_active = true
  ORDER BY priority DESC, created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Log automation execution
CREATE OR REPLACE FUNCTION log_automation_execution(
  p_org_id UUID,
  p_rule_id UUID,
  p_rule_name TEXT,
  p_trigger_type TEXT,
  p_action_type TEXT,
  p_lead_id UUID,
  p_status TEXT,
  p_result_message TEXT,
  p_action_id UUID DEFAULT NULL,
  p_execution_time_ms INTEGER DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO automation_execution_log (
    org_id, rule_id, rule_name, trigger_type, action_type,
    lead_id, status, result_message, action_id, execution_time_ms, context
  ) VALUES (
    p_org_id, p_rule_id, p_rule_name, p_trigger_type, p_action_type,
    p_lead_id, p_status, p_result_message, p_action_id, p_execution_time_ms, p_context
  )
  RETURNING id INTO v_log_id;

  -- Update rule execution stats
  UPDATE ai_automation_rules
  SET
    execution_count = execution_count + 1,
    last_executed_at = NOW()
  WHERE id = p_rule_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Get automation execution history
CREATE OR REPLACE FUNCTION get_automation_history(
  p_org_id UUID,
  p_rule_id UUID DEFAULT NULL,
  p_lead_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  rule_id UUID,
  rule_name TEXT,
  trigger_type TEXT,
  action_type TEXT,
  lead_id UUID,
  lead_name TEXT,
  status TEXT,
  result_message TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.rule_id,
    l.rule_name,
    l.trigger_type,
    l.action_type,
    l.lead_id,
    CONCAT(z.first_name, ' ', z.last_name) as lead_name,
    l.status,
    l.result_message,
    l.execution_time_ms,
    l.executed_at
  FROM automation_execution_log l
  LEFT JOIN zoho_lead_submissions z ON z.id = l.lead_id
  WHERE l.org_id = p_org_id
    AND (p_rule_id IS NULL OR l.rule_id = p_rule_id)
    AND (p_lead_id IS NULL OR l.lead_id = p_lead_id)
    AND (p_status IS NULL OR l.status = p_status)
  ORDER BY l.executed_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Get automation statistics
CREATE OR REPLACE FUNCTION get_automation_stats(p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_rules', (
      SELECT COUNT(*) FROM ai_automation_rules WHERE org_id = p_org_id OR org_id IS NULL
    ),
    'active_rules', (
      SELECT COUNT(*) FROM ai_automation_rules
      WHERE (org_id = p_org_id OR org_id IS NULL) AND is_active = true
    ),
    'executions_today', (
      SELECT COUNT(*) FROM automation_execution_log
      WHERE org_id = p_org_id AND executed_at >= CURRENT_DATE
    ),
    'executions_this_week', (
      SELECT COUNT(*) FROM automation_execution_log
      WHERE org_id = p_org_id AND executed_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    'success_rate', (
      SELECT ROUND(
        COUNT(*) FILTER (WHERE status = 'success')::NUMERIC /
        NULLIF(COUNT(*)::NUMERIC, 0) * 100, 1
      )
      FROM automation_execution_log
      WHERE org_id = p_org_id AND executed_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    'top_rules', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', r.id,
        'name', r.name,
        'execution_count', r.execution_count,
        'trigger_type', r.trigger_type
      ) ORDER BY r.execution_count DESC), '[]'::jsonb)
      FROM (
        SELECT id, name, execution_count, trigger_type
        FROM ai_automation_rules
        WHERE org_id = p_org_id OR org_id IS NULL
        ORDER BY execution_count DESC
        LIMIT 5
      ) r
    ),
    'executions_by_status', (
      SELECT jsonb_object_agg(status, cnt)
      FROM (
        SELECT status, COUNT(*) as cnt
        FROM automation_execution_log
        WHERE org_id = p_org_id AND executed_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY status
      ) s
    ),
    'executions_by_trigger', (
      SELECT jsonb_object_agg(trigger_type, cnt)
      FROM (
        SELECT trigger_type, COUNT(*) as cnt
        FROM automation_execution_log
        WHERE org_id = p_org_id AND executed_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY trigger_type
      ) t
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ----------------------------------------------------------------------------
-- 9. Seed Automation Templates
-- ----------------------------------------------------------------------------
INSERT INTO automation_templates (name, description, category, icon, trigger_type, trigger_conditions, action_type, action_config, is_popular, is_system) VALUES
-- Lead Management
(
  'Welcome New Lead',
  'Send a welcome email when a new lead is created',
  'lead_management',
  'user-plus',
  'new_lead',
  '{}',
  'send_email',
  '{"template_id": null, "subject": "Welcome to MPB Health!", "use_template": true}',
  true,
  true
),
(
  'Hot Lead Alert',
  'Notify team when lead score exceeds threshold',
  'lead_management',
  'flame',
  'high_score',
  '{"min_score": 80}',
  'send_notification',
  '{"channels": ["push", "slack"], "urgency": "urgent", "message": "Hot lead requires immediate attention!"}',
  true,
  true
),
(
  'Auto-Assign to Round Robin',
  'Automatically assign new leads to available advisors',
  'lead_management',
  'users',
  'new_lead',
  '{}',
  'assign_lead',
  '{"method": "round_robin", "team_id": null}',
  true,
  true
),

-- Follow-up Reminders
(
  'No Activity Follow-up',
  'Create task when lead has no activity for 3 days',
  'follow_up',
  'clock',
  'no_activity',
  '{"days_inactive": 3}',
  'create_task',
  '{"task_type": "follow_up", "title": "Follow up with inactive lead", "priority": "high", "due_hours": 24}',
  true,
  true
),
(
  'Stage Change Notification',
  'Notify when lead moves to a new stage',
  'follow_up',
  'arrow-right',
  'stage_change',
  '{}',
  'send_notification',
  '{"channels": ["in_app"], "message": "Lead moved to {{new_stage}} stage"}',
  false,
  true
),

-- Engagement
(
  'Auto-Enroll in Nurture Sequence',
  'Enroll lead in nurture sequence after initial contact',
  'engagement',
  'mail',
  'stage_change',
  '{"to_stage": "contacted"}',
  'enroll_sequence',
  '{"sequence_id": null, "delay_hours": 24}',
  true,
  true
),
(
  'Reply Received - Create Task',
  'Create follow-up task when lead replies',
  'engagement',
  'message-circle',
  'message_received',
  '{}',
  'create_task',
  '{"task_type": "follow_up", "title": "Respond to lead message", "priority": "high", "due_hours": 2}',
  true,
  true
),

-- Meeting Management
(
  'Meeting Scheduled - Add to Priority',
  'Add lead to hot lane when meeting is scheduled',
  'meetings',
  'calendar',
  'meeting_scheduled',
  '{}',
  'add_to_lane',
  '{"lane_name": "Hot", "reason": "Meeting scheduled"}',
  false,
  true
),
(
  'Meeting Completed - Update Stage',
  'Move lead to qualified after meeting completion',
  'meetings',
  'check-circle',
  'meeting_completed',
  '{}',
  'update_field',
  '{"field": "pipeline_stage", "value": "qualified"}',
  false,
  true
),

-- Compliance
(
  'Compliance Due Reminder',
  'Send reminder when compliance item is due soon',
  'compliance',
  'shield',
  'compliance_due',
  '{"days_before": 7}',
  'send_notification',
  '{"channels": ["email", "in_app"], "message": "Compliance item due in 7 days"}',
  false,
  true
),

-- Webhooks & Integrations
(
  'Webhook on Conversion',
  'Send webhook when lead converts',
  'integrations',
  'webhook',
  'stage_change',
  '{"to_stage": "converted"}',
  'send_webhook',
  '{"url": null, "method": "POST", "include_lead_data": true}',
  false,
  true
)
ON CONFLICT DO NOTHING;
-- ----------------------------------------------------------------------------
-- 10. Update Triggers
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_automation_templates_updated ON automation_templates;
CREATE TRIGGER trg_automation_templates_updated
  BEFORE UPDATE ON automation_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

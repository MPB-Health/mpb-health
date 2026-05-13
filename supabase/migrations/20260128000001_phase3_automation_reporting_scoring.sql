-- ============================================================================
-- Phase 3: Automation Execution Log, Lead Scoring Config, Automation RLS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Automation Execution Log
-- Records every automation rule execution for audit / debugging
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automation_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES ai_automation_rules(id) ON DELETE SET NULL,
  rule_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  action_type TEXT NOT NULL,
  lead_id UUID REFERENCES zoho_lead_submissions(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  result_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_auto_exec_log_rule ON automation_execution_log(rule_id, executed_at DESC);
CREATE INDEX idx_auto_exec_log_lead ON automation_execution_log(lead_id);
CREATE INDEX idx_auto_exec_log_status ON automation_execution_log(status, executed_at DESC);
ALTER TABLE automation_execution_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read automation_execution_log"
  ON automation_execution_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert automation_execution_log"
  ON automation_execution_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow service role full access automation_execution_log"
  ON automation_execution_log FOR ALL TO service_role USING (true);
-- ----------------------------------------------------------------------------
-- 2. RLS policies on ai_automation_rules for authenticated CRUD
-- The original migration only granted SELECT to authenticated and ALL to service_role.
-- We need INSERT, UPDATE, DELETE for authenticated users managing rules via the UI.
-- ----------------------------------------------------------------------------
CREATE POLICY "Allow authenticated insert ai_automation_rules"
  ON ai_automation_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update ai_automation_rules"
  ON ai_automation_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete ai_automation_rules"
  ON ai_automation_rules FOR DELETE TO authenticated USING (true);
-- ----------------------------------------------------------------------------
-- 3. Lead Scoring Configuration
-- Stores scoring factor weights that admins can tune from the UI
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_scoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factor_key TEXT UNIQUE NOT NULL,
  factor_label TEXT NOT NULL,
  weight INTEGER DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
  is_enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE lead_scoring_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read lead_scoring_config"
  ON lead_scoring_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write lead_scoring_config"
  ON lead_scoring_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update lead_scoring_config"
  ON lead_scoring_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access lead_scoring_config"
  ON lead_scoring_config FOR ALL TO service_role USING (true);
-- Seed default scoring factors
INSERT INTO lead_scoring_config (factor_key, factor_label, weight, is_enabled, description) VALUES
  ('household_size',     'Household Size',     60,  true, 'Larger households tend to have higher lifetime value'),
  ('contact_preference', 'Contact Preference',  40,  true, 'Leads who prefer calls convert faster'),
  ('primary_concern',    'Primary Concern',     70,  true, 'Certain concerns indicate higher urgency'),
  ('lead_freshness',     'Lead Freshness',      80,  true, 'Newer leads are more likely to convert'),
  ('pipeline_stage',     'Pipeline Stage',      50,  true, 'Later stages indicate stronger intent'),
  ('activity_count',     'Activity Count',      55,  true, 'More interactions signal higher engagement')
ON CONFLICT (factor_key) DO NOTHING;

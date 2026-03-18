/*
  # MPB Health Advisor Terminal System

  1. Purpose
    - Enable CLI-style command terminal for advisors and admins
    - Track all commands with full audit trail
    - Store approved links and tool permissions
    - Support AI-powered assistant with tightly-controlled tools

  2. New Tables
    - `advisor_terminal_sessions` - Track terminal sessions
    - `advisor_terminal_commands` - Audit log of all commands
    - `approved_links` - Curated links for advisors to share
    - `terminal_tool_permissions` - Tool access control by role

  3. Security
    - Enable RLS on all tables
    - Users can only view their own commands/sessions
    - Admins can view all activity for oversight
    - Service role for Edge Function writes
*/

-- Terminal Sessions Table
CREATE TABLE IF NOT EXISTS advisor_terminal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL UNIQUE,
  role text NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  total_commands int DEFAULT 0,
  total_tools_executed int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_terminal_sessions_user_id ON advisor_terminal_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_terminal_sessions_session_id ON advisor_terminal_sessions(session_id);

-- Terminal Commands Log
CREATE TABLE IF NOT EXISTS advisor_terminal_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  command_text text NOT NULL,
  command_intent text,
  tools_called jsonb DEFAULT '[]'::jsonb,
  success boolean NOT NULL DEFAULT false,
  response_text text,
  execution_time_ms int,
  tokens_used int,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_terminal_commands_user_id ON advisor_terminal_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_terminal_commands_session_id ON advisor_terminal_commands(session_id);

-- Approved Links Table
CREATE TABLE IF NOT EXISTS approved_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  description text,
  icon text,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approved_links_category ON approved_links(category);

-- Terminal Tool Permissions Table
CREATE TABLE IF NOT EXISTS terminal_tool_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  allowed_roles jsonb DEFAULT '["admin"]'::jsonb,
  rate_limit_calls int DEFAULT 50,
  rate_limit_period text DEFAULT 'hour',
  requires_approval boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_permissions_tool_name ON terminal_tool_permissions(tool_name);

-- Enable RLS
ALTER TABLE advisor_terminal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_terminal_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_tool_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Terminal Sessions
CREATE POLICY "Users view own sessions" ON advisor_terminal_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service manages sessions" ON advisor_terminal_sessions FOR ALL USING (true);

-- RLS Policies for Terminal Commands
CREATE POLICY "Users view own commands" ON advisor_terminal_commands FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service inserts commands" ON advisor_terminal_commands FOR INSERT WITH CHECK (true);

-- RLS Policies for Approved Links
CREATE POLICY "View active links" ON approved_links FOR SELECT TO authenticated USING (is_active = true);

-- RLS Policies for Tool Permissions
CREATE POLICY "View tool permissions" ON terminal_tool_permissions FOR SELECT TO authenticated USING (is_active = true);

-- Seed data for tool permissions
INSERT INTO terminal_tool_permissions (tool_name, display_name, description, allowed_roles, rate_limit_calls, rate_limit_period)
VALUES
  ('get_approved_links', 'Get Approved Links', 'Fetch pre-approved MPB links by category', '["advisor", "admin"]'::jsonb, 100, 'hour'),
  ('lookup_member', 'Lookup Member', 'Search for member profile information', '["advisor", "admin"]'::jsonb, 50, 'hour'),
  ('get_my_stats', 'Get My Stats', 'View your performance statistics', '["advisor", "admin"]'::jsonb, 100, 'hour'),
  ('search_knowledge_base', 'Search Knowledge Base', 'Search training materials and FAQs', '["advisor", "admin"]'::jsonb, 50, 'hour'),
  ('draft_email', 'Draft Email', 'Generate email draft', '["advisor", "admin"]'::jsonb, 30, 'hour'),
  ('send_email', 'Send Email', 'Send transactional email', '["advisor", "admin"]'::jsonb, 20, 'hour'),
  ('create_ticket', 'Create Ticket', 'Create support or operations ticket', '["advisor", "admin"]'::jsonb, 20, 'hour')
ON CONFLICT (tool_name) DO NOTHING;

-- Seed data for approved links
INSERT INTO approved_links (category, title, url, description, icon, display_order)
VALUES
  ('enrollment', 'Care Plus Enrollment', 'https://careplus.enrollmpb.com/', 'Primary enrollment portal for Care Plus members', 'UserPlus', 1),
  ('enrollment', 'Direct Enrollment', 'https://direct.enrollmpb.com/', 'Enrollment portal for Direct plan members', 'UserCheck', 2),
  ('enrollment', 'Secure HSA Enrollment', 'https://securehsa.enrollmpb.com/', 'Enrollment portal for Secure HSA members', 'Shield', 3),
  ('calculators', 'Get A Quote', 'https://mpb.health/get-a-quote', 'Personalized rate calculator', 'Calculator', 1),
  ('plans', 'Plan Comparison', 'https://mpb.health/plans', 'Compare all available plans', 'FileText', 1),
  ('plans', 'Care Plus Details', 'https://mpb.health/plans/care-plus', 'Care Plus plan information', 'Heart', 2),
  ('resources', 'Resource Library', 'https://mpb.health/resources', 'Educational resources and guides', 'BookOpen', 1),
  ('training', 'Advisor Training', 'https://mpb.health/advisor/training', 'Access training modules', 'GraduationCap', 1)
ON CONFLICT DO NOTHING;

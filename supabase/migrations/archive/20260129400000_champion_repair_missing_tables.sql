-- ============================================================================
-- Champion Repair: Create Missing Tables
-- Fixes issues with failed migrations due to missing dependencies
-- ============================================================================

-- First, ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- LEADS TABLE
-- This is the champion CRM leads table (separate from zoho_lead_submissions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic info
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,

  -- Source tracking
  source TEXT,
  source_campaign TEXT,
  source_medium TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'archived')),

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Scoring
  score INTEGER DEFAULT 0,

  -- Additional data
  company TEXT,
  job_title TEXT,
  address JSONB,
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Engagement tracking
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(org_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
-- RLS for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view leads in their org" ON leads;
  DROP POLICY IF EXISTS "Users can insert leads in their org" ON leads;
  DROP POLICY IF EXISTS "Users can update leads in their org" ON leads;
  DROP POLICY IF EXISTS "Users can delete leads in their org" ON leads;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
CREATE POLICY "Users can view leads in their org" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = leads.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
    )
  );
CREATE POLICY "Users can insert leads in their org" ON leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = leads.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
    )
  );
CREATE POLICY "Users can update leads in their org" ON leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = leads.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
    )
  );
CREATE POLICY "Users can delete leads in their org" ON leads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = leads.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
      AND org_memberships.role IN ('owner', 'admin', 'manager')
    )
  );
-- ============================================================================
-- TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Task info
  title TEXT NOT NULL,
  description TEXT,

  -- Related entities
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_id UUID,

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Dates
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(org_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE status NOT IN ('completed', 'cancelled');
-- RLS for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view tasks in their org" ON tasks;
  DROP POLICY IF EXISTS "Users can insert tasks in their org" ON tasks;
  DROP POLICY IF EXISTS "Users can update tasks in their org" ON tasks;
  DROP POLICY IF EXISTS "Users can delete tasks in their org" ON tasks;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
CREATE POLICY "Users can view tasks in their org" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = tasks.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
    )
  );
CREATE POLICY "Users can insert tasks in their org" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = tasks.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
    )
  );
CREATE POLICY "Users can update tasks in their org" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = tasks.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
    )
  );
CREATE POLICY "Users can delete tasks in their org" ON tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = tasks.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
      AND org_memberships.role IN ('owner', 'admin', 'manager')
    )
    OR tasks.created_by = auth.uid()
  );
-- ============================================================================
-- ACTIVITIES TABLE (Recreation)
-- ============================================================================

-- Create types if they don't exist
DO $$
BEGIN
  CREATE TYPE activity_type AS ENUM (
    'lead_created', 'lead_updated', 'lead_assigned', 'lead_status_changed',
    'lead_converted', 'lead_lost', 'message_sent', 'message_received',
    'message_opened', 'task_created', 'task_completed', 'task_overdue',
    'task_assigned', 'compliance_completed', 'compliance_due',
    'compliance_violation', 'meeting_scheduled', 'meeting_started',
    'meeting_completed', 'meeting_cancelled', 'sequence_enrolled',
    'sequence_completed', 'sequence_paused', 'member_joined',
    'member_left', 'member_role_changed', 'goal_achieved',
    'milestone_reached', 'system_alert'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'push');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Actor
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL DEFAULT 'user',

  -- Activity details
  activity_type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Related entities
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_id UUID,
  conversation_id UUID,
  task_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Visibility
  is_public BOOLEAN DEFAULT TRUE,
  visible_to UUID[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_activities_org_created ON activities(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_actor ON activities(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id, created_at DESC) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(org_id, activity_type, created_at DESC);
-- RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view org activities" ON activities;
  DROP POLICY IF EXISTS "Users can create activities" ON activities;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
CREATE POLICY "Users can view org activities" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = activities.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
    )
    AND (is_public = TRUE OR auth.uid() = ANY(visible_to) OR actor_id = auth.uid())
  );
CREATE POLICY "Users can create activities" ON activities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = activities.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
    )
  );
-- ============================================================================
-- NOTIFICATIONS TABLE (Recreation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Related activity
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  body TEXT,
  icon TEXT,

  -- Links
  action_url TEXT,
  action_label TEXT,

  -- Priority and type
  priority notification_priority DEFAULT 'normal',
  category TEXT,

  -- Delivery
  channels notification_channel[] DEFAULT '{in_app}',
  delivered_via notification_channel[] DEFAULT '{}',

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = FALSE AND is_dismissed = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_all ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(user_id, category, created_at DESC);
-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
  DROP POLICY IF EXISTS "System can create notifications" ON notifications;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = notifications.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
    )
    OR auth.uid() IS NOT NULL
  );
-- ============================================================================
-- QUICK ACTIONS TABLE (Recreation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  shortcut TEXT,
  category TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quick_actions_org ON quick_actions(org_id);
CREATE INDEX IF NOT EXISTS idx_quick_actions_category ON quick_actions(category);
ALTER TABLE quick_actions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  DROP POLICY IF EXISTS "quick_actions_select" ON quick_actions;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;
CREATE POLICY "quick_actions_select" ON quick_actions
  FOR SELECT USING (
    org_id IS NULL
    OR EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = quick_actions.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
    )
  );
-- Insert default quick actions
INSERT INTO quick_actions (name, description, icon, action_type, action_data, shortcut, category, display_order) VALUES
  ('Go to Dashboard', 'View your dashboard', 'layout-dashboard', 'navigate', '{"url": "/"}', 'g d', 'navigation', 1),
  ('Go to Power List', 'View your power list', 'zap', 'navigate', '{"url": "/power-list"}', 'g p', 'navigation', 2),
  ('Go to Inbox', 'View your inbox', 'inbox', 'navigate', '{"url": "/inbox"}', 'g i', 'navigation', 3),
  ('Go to Leads', 'View all leads', 'users', 'navigate', '{"url": "/leads"}', 'g l', 'navigation', 4),
  ('Go to Analytics', 'View analytics', 'bar-chart-3', 'navigate', '{"url": "/analytics"}', 'g a', 'navigation', 5),
  ('Go to Settings', 'Open settings', 'settings', 'navigate', '{"url": "/settings"}', 'g s', 'navigation', 6),
  ('New Lead', 'Create a new lead', 'user-plus', 'create', '{"entity": "lead"}', 'c l', 'create', 10),
  ('New Message', 'Compose a new message', 'message-square-plus', 'create', '{"entity": "message"}', 'c m', 'create', 11),
  ('New Task', 'Create a new task', 'plus-circle', 'create', '{"entity": "task"}', 'c t', 'create', 12),
  ('Schedule Meeting', 'Schedule a new meeting', 'calendar-plus', 'create', '{"entity": "meeting"}', 'c e', 'create', 13),
  ('New Sequence', 'Create a new sequence', 'workflow', 'create', '{"entity": "sequence"}', 'c s', 'create', 14),
  ('Keyboard Shortcuts', 'View all keyboard shortcuts', 'keyboard', 'toggle', '{"modal": "shortcuts"}', '?', 'help', 20),
  ('Help Center', 'Open help documentation', 'help-circle', 'navigate', '{"url": "/help"}', NULL, 'help', 21),
  ('Contact Support', 'Get help from support', 'message-circle', 'custom', '{"action": "support"}', NULL, 'help', 22)
ON CONFLICT DO NOTHING;
-- ============================================================================
-- USER ACHIEVEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Achievement info
  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_tier TEXT DEFAULT 'bronze',

  -- Progress
  progress INTEGER DEFAULT 0,
  target INTEGER DEFAULT 1,

  -- Status
  earned_at TIMESTAMPTZ,
  is_earned BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_achievement UNIQUE (user_id, org_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_org ON user_achievements(org_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(user_id, is_earned);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can view org achievements" ON user_achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = user_achievements.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
    )
  );
CREATE POLICY "System can manage achievements" ON user_achievements
  FOR ALL USING (auth.uid() IS NOT NULL);
-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id
      AND is_read = FALSE
      AND is_dismissed = FALSE
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_org_id UUID,
  p_metric TEXT DEFAULT 'score',
  p_period TEXT DEFAULT 'week',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  user_name TEXT,
  avatar_url TEXT,
  score INTEGER,
  achievements_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COALESCE(ap.points, 0) DESC)::INTEGER AS rank,
    ap.user_id,
    COALESCE(ap.first_name || ' ' || ap.last_name, 'Unknown') AS user_name,
    ap.avatar_url,
    COALESCE(ap.points, 0)::INTEGER AS score,
    (SELECT COUNT(*)::INTEGER FROM user_achievements ua WHERE ua.user_id = ap.user_id AND ua.is_earned = TRUE) AS achievements_count
  FROM advisor_profiles ap
  JOIN org_memberships om ON om.user_id = ap.user_id
  WHERE om.org_id = p_org_id
  AND om.status = 'active'
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Get recent searches
CREATE OR REPLACE FUNCTION get_recent_searches(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  query TEXT,
  entity_type TEXT,
  result_count INTEGER,
  searched_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (rs.query)
    rs.id,
    rs.query,
    rs.entity_type,
    rs.result_count,
    rs.searched_at
  FROM recent_searches rs
  WHERE rs.user_id = p_user_id
  ORDER BY rs.query, rs.searched_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard(UUID, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_searches(UUID, INTEGER) TO authenticated;
-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE activities;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

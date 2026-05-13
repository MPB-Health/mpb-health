-- ============================================================================
-- Championship Command Center Dashboard Migration
-- Customizable widget-based dashboard with drag-and-drop layouts
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Dashboard Layouts Table
-- Per-user customizable widget layouts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,

  -- Layout identification
  name TEXT NOT NULL DEFAULT 'Default',
  description TEXT,
  is_default BOOLEAN DEFAULT false,

  -- Widget instances configuration (JSONB array)
  -- Each widget: { instanceId, widgetId, size, position: {x, y}, collapsed, config }
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Grid settings
  grid_columns INTEGER DEFAULT 12,
  row_height INTEGER DEFAULT 100,

  -- Theme customization
  theme JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one layout name per user per org
  UNIQUE(user_id, org_id, name)
);
-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user ON crm_dashboard_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_org ON crm_dashboard_layouts(org_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_default ON crm_dashboard_layouts(user_id, org_id, is_default) WHERE is_default = true;
-- Enable RLS
ALTER TABLE crm_dashboard_layouts ENABLE ROW LEVEL SECURITY;
-- Users can manage their own layouts
CREATE POLICY "Users manage own dashboard layouts" ON crm_dashboard_layouts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);
-- ----------------------------------------------------------------------------
-- Dashboard Notes Table
-- Quick notes for the Notes widget
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_dashboard_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,

  -- Note content (rich text HTML from Tiptap)
  title TEXT,
  content TEXT NOT NULL,

  -- Organization
  is_pinned BOOLEAN DEFAULT false,
  color TEXT DEFAULT 'default' CHECK (color IN ('default', 'yellow', 'green', 'blue', 'purple', 'red', 'orange')),

  -- Optional entity links
  linked_entity_type TEXT, -- 'lead', 'contact', 'deal', 'account'
  linked_entity_id UUID,

  -- Tags for filtering
  tags TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_notes_user ON crm_dashboard_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_notes_org ON crm_dashboard_notes(org_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_notes_pinned ON crm_dashboard_notes(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_dashboard_notes_entity ON crm_dashboard_notes(linked_entity_type, linked_entity_id) WHERE linked_entity_id IS NOT NULL;
-- Enable RLS
ALTER TABLE crm_dashboard_notes ENABLE ROW LEVEL SECURITY;
-- Users can manage their own notes
CREATE POLICY "Users manage own dashboard notes" ON crm_dashboard_notes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id);
-- ----------------------------------------------------------------------------
-- User Goals Table
-- Goals tracking for the Goals widget
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,

  -- Goal definition
  name TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,

  -- Metric type for automatic tracking
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'leads_created',
    'leads_converted',
    'deals_won',
    'deals_value',
    'calls_made',
    'emails_sent',
    'meetings_held',
    'tasks_completed',
    'custom'
  )),

  -- Time period
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Goal ownership
  is_personal BOOLEAN DEFAULT true, -- vs admin-assigned team goal
  assigned_by UUID REFERENCES auth.users(id),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  completed_at TIMESTAMPTZ,

  -- Visual customization
  icon TEXT DEFAULT 'target',
  color TEXT DEFAULT 'violet',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_goals_user ON crm_user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_org ON crm_user_goals(org_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_active ON crm_user_goals(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_goals_period ON crm_user_goals(start_date, end_date);
-- Enable RLS
ALTER TABLE crm_user_goals ENABLE ROW LEVEL SECURITY;
-- Users can view their own goals and goals assigned to them
CREATE POLICY "Users view own and assigned goals" ON crm_user_goals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = assigned_by);
-- Users can manage their own personal goals
CREATE POLICY "Users manage own personal goals" ON crm_user_goals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id AND is_personal = true);
-- Admins can assign goals (we'll check role in application layer)
CREATE POLICY "Admins assign team goals" ON crm_user_goals
  FOR INSERT TO authenticated
  WITH CHECK (is_personal = false AND auth.uid() = assigned_by);
-- ----------------------------------------------------------------------------
-- Default Layout Templates Table
-- Organization-wide default layouts for new users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_default_layout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID,  -- NULL for system-wide defaults

  -- Template info
  name TEXT NOT NULL DEFAULT 'Standard',
  description TEXT,

  -- Widget configuration
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Grid settings
  grid_columns INTEGER DEFAULT 12,
  row_height INTEGER DEFAULT 100,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Ownership
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, name)
);
-- Index
CREATE INDEX IF NOT EXISTS idx_default_layouts_org ON crm_default_layout_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_default_layouts_active ON crm_default_layout_templates(is_active) WHERE is_active = true;
-- Enable RLS
ALTER TABLE crm_default_layout_templates ENABLE ROW LEVEL SECURITY;
-- Anyone authenticated can read default templates
CREATE POLICY "Read default layout templates" ON crm_default_layout_templates
  FOR SELECT TO authenticated
  USING (true);
-- ----------------------------------------------------------------------------
-- Insert system default layout template
-- ----------------------------------------------------------------------------
INSERT INTO crm_default_layout_templates (org_id, name, description, widgets) VALUES
(NULL, 'Championship Command Center', 'Default layout with essential CRM widgets', '[
  {"instanceId": "metrics-1", "widgetId": "metrics", "size": "sm", "position": {"x": 0, "y": 0}, "collapsed": false, "config": {"metric": "total_leads"}},
  {"instanceId": "metrics-2", "widgetId": "metrics", "size": "sm", "position": {"x": 3, "y": 0}, "collapsed": false, "config": {"metric": "new_leads"}},
  {"instanceId": "metrics-3", "widgetId": "metrics", "size": "sm", "position": {"x": 6, "y": 0}, "collapsed": false, "config": {"metric": "tasks_due"}},
  {"instanceId": "metrics-4", "widgetId": "metrics", "size": "sm", "position": {"x": 9, "y": 0}, "collapsed": false, "config": {"metric": "overdue_tasks"}},
  {"instanceId": "pipeline-1", "widgetId": "pipeline", "size": "md", "position": {"x": 0, "y": 1}, "collapsed": false, "config": {}},
  {"instanceId": "recent-leads-1", "widgetId": "recent-leads", "size": "md", "position": {"x": 6, "y": 1}, "collapsed": false, "config": {"limit": 5}},
  {"instanceId": "tasks-1", "widgetId": "tasks", "size": "md", "position": {"x": 0, "y": 2}, "collapsed": false, "config": {"view": "due-today"}},
  {"instanceId": "activity-1", "widgetId": "activity", "size": "md", "position": {"x": 6, "y": 2}, "collapsed": false, "config": {"limit": 5}},
  {"instanceId": "quick-actions-1", "widgetId": "quick-actions", "size": "full", "position": {"x": 0, "y": 3}, "collapsed": false, "config": {}}
]'::jsonb);
-- ----------------------------------------------------------------------------
-- Function: Get or create user dashboard layout
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_or_create_dashboard_layout(
  p_user_id UUID,
  p_org_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_layout JSONB;
  v_default_widgets JSONB;
BEGIN
  -- Try to get existing layout
  SELECT to_jsonb(l.*) INTO v_layout
  FROM crm_dashboard_layouts l
  WHERE l.user_id = p_user_id
    AND l.org_id = p_org_id
    AND l.is_default = true;

  IF v_layout IS NOT NULL THEN
    RETURN v_layout;
  END IF;

  -- Get default template (org-specific or system default)
  SELECT widgets INTO v_default_widgets
  FROM crm_default_layout_templates
  WHERE (org_id = p_org_id OR org_id IS NULL)
    AND is_active = true
  ORDER BY org_id NULLS LAST
  LIMIT 1;

  IF v_default_widgets IS NULL THEN
    v_default_widgets := '[]'::jsonb;
  END IF;

  -- Create new layout for user
  INSERT INTO crm_dashboard_layouts (user_id, org_id, name, is_default, widgets)
  VALUES (p_user_id, p_org_id, 'Default', true, v_default_widgets)
  ON CONFLICT (user_id, org_id, name) DO UPDATE SET updated_at = NOW()
  RETURNING to_jsonb(crm_dashboard_layouts.*) INTO v_layout;

  RETURN v_layout;
END;
$$;
-- ----------------------------------------------------------------------------
-- Function: Save dashboard layout
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION save_dashboard_layout(
  p_user_id UUID,
  p_org_id UUID,
  p_widgets JSONB,
  p_name TEXT DEFAULT 'Default'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_layout JSONB;
BEGIN
  INSERT INTO crm_dashboard_layouts (user_id, org_id, name, widgets, is_default)
  VALUES (p_user_id, p_org_id, p_name, p_widgets, p_name = 'Default')
  ON CONFLICT (user_id, org_id, name)
  DO UPDATE SET
    widgets = p_widgets,
    updated_at = NOW()
  RETURNING to_jsonb(crm_dashboard_layouts.*) INTO v_layout;

  RETURN v_layout;
END;
$$;
-- ----------------------------------------------------------------------------
-- Function: Update goal progress automatically
-- Called by triggers when relevant actions occur
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update leads_created goals
  IF TG_TABLE_NAME = 'zoho_lead_submissions' AND TG_OP = 'INSERT' THEN
    UPDATE crm_user_goals
    SET current_value = current_value + 1,
        updated_at = NOW(),
        status = CASE
          WHEN current_value + 1 >= target_value THEN 'completed'
          ELSE status
        END,
        completed_at = CASE
          WHEN current_value + 1 >= target_value THEN NOW()
          ELSE completed_at
        END
    WHERE metric_type = 'leads_created'
      AND status = 'active'
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE
      AND org_id = NEW.organization_id;
  END IF;

  -- Update tasks_completed goals
  IF TG_TABLE_NAME = 'lead_tasks' AND TG_OP = 'UPDATE' THEN
    IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
      UPDATE crm_user_goals
      SET current_value = current_value + 1,
          updated_at = NOW(),
          status = CASE
            WHEN current_value + 1 >= target_value THEN 'completed'
            ELSE status
          END,
          completed_at = CASE
            WHEN current_value + 1 >= target_value THEN NOW()
            ELSE completed_at
          END
      WHERE metric_type = 'tasks_completed'
        AND status = 'active'
        AND start_date <= CURRENT_DATE
        AND end_date >= CURRENT_DATE
        AND user_id = NEW.assigned_to;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;
-- Create triggers for automatic goal updates (only if source tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'zoho_lead_submissions') THEN
    DROP TRIGGER IF EXISTS trg_update_goals_on_lead ON zoho_lead_submissions;
    CREATE TRIGGER trg_update_goals_on_lead
      AFTER INSERT ON zoho_lead_submissions
      FOR EACH ROW
      EXECUTE FUNCTION update_goal_progress();
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lead_tasks') THEN
    DROP TRIGGER IF EXISTS trg_update_goals_on_task ON lead_tasks;
    CREATE TRIGGER trg_update_goals_on_task
      AFTER UPDATE OF completed ON lead_tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_goal_progress();
  END IF;
END;
$$;
-- ----------------------------------------------------------------------------
-- Grant execute permissions
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION get_or_create_dashboard_layout TO authenticated;
GRANT EXECUTE ON FUNCTION save_dashboard_layout TO authenticated;

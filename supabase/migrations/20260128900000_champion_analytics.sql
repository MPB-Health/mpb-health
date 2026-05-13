-- ============================================================================
-- Champion Analytics & Reporting Schema
-- ============================================================================

-- Metric types enum
CREATE TYPE metric_type AS ENUM (
  'leads_total',
  'leads_new',
  'leads_converted',
  'leads_lost',
  'conversion_rate',
  'messages_sent',
  'messages_received',
  'response_time_avg',
  'response_time_median',
  'compliance_score',
  'tasks_completed',
  'tasks_overdue',
  'calls_made',
  'meetings_held',
  'revenue_potential',
  'revenue_closed'
);
-- Time granularity enum
CREATE TYPE time_granularity AS ENUM ('hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly');
-- Report status enum
CREATE TYPE report_status AS ENUM ('draft', 'generating', 'ready', 'failed', 'archived');
-- ============================================================================
-- METRIC SNAPSHOTS — Time-series metrics data
-- ============================================================================
CREATE TABLE metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metric identification
  metric_type metric_type NOT NULL,
  granularity time_granularity NOT NULL DEFAULT 'daily',

  -- Time period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Values
  value NUMERIC NOT NULL,
  previous_value NUMERIC,
  change_percent NUMERIC,

  -- Dimensions (for drill-down)
  dimensions JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint for upserts
  CONSTRAINT unique_metric_snapshot UNIQUE (org_id, user_id, metric_type, granularity, period_start)
);
-- Indexes for metric queries
CREATE INDEX idx_metric_snapshots_org_type ON metric_snapshots(org_id, metric_type, period_start DESC);
CREATE INDEX idx_metric_snapshots_user ON metric_snapshots(user_id, metric_type, period_start DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_metric_snapshots_period ON metric_snapshots(period_start, period_end);
-- ============================================================================
-- PERFORMANCE GOALS — Target metrics for users/teams
-- ============================================================================
CREATE TABLE performance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Goal definition
  name TEXT NOT NULL,
  description TEXT,
  metric_type metric_type NOT NULL,

  -- Target
  target_value NUMERIC NOT NULL,
  target_period time_granularity NOT NULL DEFAULT 'monthly',

  -- Current progress (cached)
  current_value NUMERIC DEFAULT 0,
  progress_percent NUMERIC DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,

  -- Time bounds
  start_date DATE NOT NULL,
  end_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  achieved_at TIMESTAMPTZ,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_performance_goals_org ON performance_goals(org_id, is_active);
CREATE INDEX idx_performance_goals_user ON performance_goals(user_id, is_active) WHERE user_id IS NOT NULL;
-- ============================================================================
-- SAVED REPORTS — User-created report configurations
-- ============================================================================
CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Report info
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL, -- 'performance', 'leads', 'compliance', 'activity', 'custom'

  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',
  -- Config includes: metrics[], filters{}, groupBy[], dateRange{}, chartType, etc.

  -- Sharing
  is_public BOOLEAN DEFAULT FALSE,
  shared_with UUID[] DEFAULT '{}',

  -- Usage tracking
  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_saved_reports_org ON saved_reports(org_id);
CREATE INDEX idx_saved_reports_creator ON saved_reports(created_by);
-- ============================================================================
-- REPORT SCHEDULES — Automated report delivery
-- ============================================================================
CREATE TABLE report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES saved_reports(id) ON DELETE CASCADE,

  -- Schedule
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  day_of_week INTEGER, -- 0-6 for weekly
  day_of_month INTEGER, -- 1-31 for monthly
  time_of_day TIME NOT NULL DEFAULT '09:00',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',

  -- Delivery
  delivery_method TEXT NOT NULL DEFAULT 'email', -- 'email', 'slack', 'webhook'
  recipients JSONB NOT NULL DEFAULT '[]',
  -- Recipients format: [{ type: 'email', address: '...' }, { type: 'user_id', id: '...' }]

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  last_error TEXT,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_report_schedules_next ON report_schedules(next_send_at) WHERE is_active = TRUE;
-- ============================================================================
-- REPORT RUNS — History of generated reports
-- ============================================================================
CREATE TABLE report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_id UUID REFERENCES saved_reports(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,

  -- Run info
  status report_status NOT NULL DEFAULT 'generating',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Parameters used
  parameters JSONB NOT NULL DEFAULT '{}',
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,

  -- Results
  result_data JSONB,
  row_count INTEGER,

  -- Export
  export_format TEXT, -- 'json', 'csv', 'pdf'
  export_url TEXT,
  export_expires_at TIMESTAMPTZ,

  -- Error handling
  error_message TEXT,

  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_report_runs_org ON report_runs(org_id, created_at DESC);
CREATE INDEX idx_report_runs_report ON report_runs(report_id, created_at DESC);
-- ============================================================================
-- DASHBOARD WIDGETS — Custom dashboard configurations
-- ============================================================================
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Widget info
  name TEXT NOT NULL,
  widget_type TEXT NOT NULL, -- 'kpi', 'chart', 'table', 'leaderboard', 'goal_progress'

  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',
  -- Config includes: metric, chartType, colors, dateRange, filters, etc.

  -- Layout
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,

  -- Visibility
  is_visible BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_dashboard_widgets_user ON dashboard_widgets(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_dashboard_widgets_org ON dashboard_widgets(org_id) WHERE user_id IS NULL;
-- ============================================================================
-- LEADERBOARD ENTRIES — Cached leaderboard rankings
-- ============================================================================
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Period
  period_type time_granularity NOT NULL,
  period_start DATE NOT NULL,

  -- Rankings by metric
  leads_converted_rank INTEGER,
  leads_converted_value INTEGER DEFAULT 0,

  response_time_rank INTEGER,
  response_time_value NUMERIC, -- in minutes

  compliance_score_rank INTEGER,
  compliance_score_value NUMERIC DEFAULT 0,

  messages_sent_rank INTEGER,
  messages_sent_value INTEGER DEFAULT 0,

  tasks_completed_rank INTEGER,
  tasks_completed_value INTEGER DEFAULT 0,

  -- Overall score
  overall_score NUMERIC DEFAULT 0,
  overall_rank INTEGER,

  -- Badges/achievements
  badges JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_leaderboard_entry UNIQUE (org_id, user_id, period_type, period_start)
);
CREATE INDEX idx_leaderboard_entries_org_period ON leaderboard_entries(org_id, period_type, period_start DESC);
CREATE INDEX idx_leaderboard_entries_user ON leaderboard_entries(user_id, period_start DESC);
-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE metric_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
-- Metric snapshots policies
CREATE POLICY "Users can view org metrics" ON metric_snapshots
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can manage metrics" ON metric_snapshots
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );
-- Performance goals policies
CREATE POLICY "Users can view their goals" ON performance_goals
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
    AND (user_id = auth.uid() OR user_id IS NULL)
  );
CREATE POLICY "Admins can manage goals" ON performance_goals
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );
-- Saved reports policies
CREATE POLICY "Users can view accessible reports" ON saved_reports
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
    AND (created_by = auth.uid() OR is_public = TRUE OR auth.uid() = ANY(shared_with))
  );
CREATE POLICY "Users can manage own reports" ON saved_reports
  FOR ALL USING (created_by = auth.uid());
-- Report schedules policies
CREATE POLICY "Users can view org schedules" ON report_schedules
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
  );
CREATE POLICY "Admins can manage schedules" ON report_schedules
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );
-- Report runs policies
CREATE POLICY "Users can view org report runs" ON report_runs
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create report runs" ON report_runs
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
  );
-- Dashboard widgets policies
CREATE POLICY "Users can manage own widgets" ON dashboard_widgets
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view org widgets" ON dashboard_widgets
  FOR SELECT USING (
    user_id IS NULL AND
    org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
  );
-- Leaderboard policies
CREATE POLICY "Users can view org leaderboard" ON leaderboard_entries
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM user_organization_roles WHERE user_id = auth.uid())
  );
-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate metrics for a time period
CREATE OR REPLACE FUNCTION calculate_user_metrics(
  p_org_id UUID,
  p_user_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'leads_new', COALESCE((
      SELECT COUNT(*) FROM leads
      WHERE org_id = p_org_id
        AND assigned_to = p_user_id
        AND created_at BETWEEN p_start_date AND p_end_date
    ), 0),
    'leads_converted', COALESCE((
      SELECT COUNT(*) FROM leads
      WHERE org_id = p_org_id
        AND assigned_to = p_user_id
        AND status = 'converted'
        AND updated_at BETWEEN p_start_date AND p_end_date
    ), 0),
    'messages_sent', COALESCE((
      SELECT COUNT(*) FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.org_id = p_org_id
        AND m.sender_id = p_user_id
        AND m.created_at BETWEEN p_start_date AND p_end_date
    ), 0),
    'tasks_completed', COALESCE((
      SELECT COUNT(*) FROM priority_items
      WHERE org_id = p_org_id
        AND assigned_to = p_user_id
        AND status = 'completed'
        AND completed_at BETWEEN p_start_date AND p_end_date
    ), 0)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get leaderboard for a period
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_org_id UUID,
  p_metric TEXT,
  p_period_type time_granularity,
  p_period_start DATE,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  metric_value NUMERIC,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    le.user_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    CASE p_metric
      WHEN 'leads_converted' THEN le.leads_converted_value::NUMERIC
      WHEN 'response_time' THEN le.response_time_value
      WHEN 'compliance_score' THEN le.compliance_score_value
      WHEN 'messages_sent' THEN le.messages_sent_value::NUMERIC
      WHEN 'tasks_completed' THEN le.tasks_completed_value::NUMERIC
      ELSE le.overall_score
    END AS metric_value,
    CASE p_metric
      WHEN 'leads_converted' THEN le.leads_converted_rank
      WHEN 'response_time' THEN le.response_time_rank
      WHEN 'compliance_score' THEN le.compliance_score_rank
      WHEN 'messages_sent' THEN le.messages_sent_rank
      WHEN 'tasks_completed' THEN le.tasks_completed_rank
      ELSE le.overall_rank
    END AS rank
  FROM leaderboard_entries le
  JOIN advisor_profiles p ON p.user_id = le.user_id
  WHERE le.org_id = p_org_id
    AND le.period_type = p_period_type
    AND le.period_start = p_period_start
  ORDER BY rank ASC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to get metric time series
CREATE OR REPLACE FUNCTION get_metric_timeseries(
  p_org_id UUID,
  p_user_id UUID,
  p_metric_type metric_type,
  p_granularity time_granularity,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
) RETURNS TABLE (
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  value NUMERIC,
  change_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ms.period_start,
    ms.period_end,
    ms.value,
    ms.change_percent
  FROM metric_snapshots ms
  WHERE ms.org_id = p_org_id
    AND (p_user_id IS NULL OR ms.user_id = p_user_id)
    AND ms.metric_type = p_metric_type
    AND ms.granularity = p_granularity
    AND ms.period_start >= p_start_date
    AND ms.period_end <= p_end_date
  ORDER BY ms.period_start ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Function to snapshot daily metrics (to be called by cron)
CREATE OR REPLACE FUNCTION snapshot_daily_metrics() RETURNS void AS $$
DECLARE
  org RECORD;
  usr RECORD;
  today DATE := CURRENT_DATE;
  yesterday DATE := CURRENT_DATE - 1;
  metrics JSONB;
BEGIN
  -- Loop through all organizations
  FOR org IN SELECT id FROM organizations WHERE is_active = TRUE LOOP
    -- Loop through all users in org
    FOR usr IN
      SELECT user_id FROM user_organization_roles WHERE org_id = org.id
    LOOP
      -- Calculate metrics for yesterday
      metrics := calculate_user_metrics(
        org.id,
        usr.user_id,
        yesterday::TIMESTAMPTZ,
        today::TIMESTAMPTZ
      );

      -- Insert metric snapshots
      INSERT INTO metric_snapshots (org_id, user_id, metric_type, granularity, period_start, period_end, value)
      VALUES
        (org.id, usr.user_id, 'leads_new', 'daily', yesterday, today, (metrics->>'leads_new')::NUMERIC),
        (org.id, usr.user_id, 'leads_converted', 'daily', yesterday, today, (metrics->>'leads_converted')::NUMERIC),
        (org.id, usr.user_id, 'messages_sent', 'daily', yesterday, today, (metrics->>'messages_sent')::NUMERIC),
        (org.id, usr.user_id, 'tasks_completed', 'daily', yesterday, today, (metrics->>'tasks_completed')::NUMERIC)
      ON CONFLICT (org_id, user_id, metric_type, granularity, period_start)
      DO UPDATE SET value = EXCLUDED.value, created_at = NOW();
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER update_performance_goals_updated_at
  BEFORE UPDATE ON performance_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_reports_updated_at
  BEFORE UPDATE ON saved_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_schedules_updated_at
  BEFORE UPDATE ON report_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaderboard_entries_updated_at
  BEFORE UPDATE ON leaderboard_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

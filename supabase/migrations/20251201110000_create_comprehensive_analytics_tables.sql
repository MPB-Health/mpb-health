/*
  # Comprehensive Analytics Tables

  1. New Tables
    - `analytics_sessions` - Track user sessions with duration, bounce rate, entry/exit pages
    - `analytics_events` - Track user interactions (clicks, scrolls, form submissions)
    - `page_performance` - Daily aggregated page metrics
    - `traffic_sources` - Track referrer breakdown by source type

  2. Enhance page_views
    - Add time_on_page, scroll_depth, is_entry, is_exit columns

  3. Security
    - Enable RLS on all tables
    - Anyone can insert (for anonymous tracking)
    - Only admins can read analytics data

  4. Indexes
    - Optimized for date range queries and aggregations
*/

-- ============================================================================
-- 1. ANALYTICS SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timing
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer DEFAULT 0,
  
  -- Behavior
  page_count integer DEFAULT 1,
  is_bounce boolean DEFAULT true,
  
  -- Navigation
  entry_page text NOT NULL,
  exit_page text,
  
  -- Attribution
  referrer text,
  referrer_source text CHECK (referrer_source IN ('direct', 'organic', 'referral', 'social', 'email', 'paid', 'other')),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  
  -- Device & Location
  device_type text CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser text,
  os text,
  country text,
  region text,
  city text,
  
  -- Visitor type
  is_new_visitor boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for analytics_sessions
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started_at ON analytics_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_referrer_source ON analytics_sessions(referrer_source);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_device_type ON analytics_sessions(device_type);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_country ON analytics_sessions(country);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_is_bounce ON analytics_sessions(is_bounce);
-- Note: Using started_at index for date-based queries (DATE() is not IMMUTABLE)

-- ============================================================================
-- 2. ANALYTICS EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event details
  event_type text NOT NULL CHECK (event_type IN (
    'click', 'scroll', 'form_start', 'form_submit', 'form_abandon',
    'video_play', 'video_complete', 'download', 'outbound_link',
    'search', 'filter', 'add_to_cart', 'purchase', 'signup',
    'cta_click', 'modal_open', 'modal_close', 'tab_switch', 'custom'
  )),
  event_category text,
  event_label text,
  event_value numeric,
  
  -- Context
  page_path text NOT NULL,
  page_title text,
  element_id text,
  element_class text,
  element_text text,
  
  -- Additional data
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_path ON analytics_events(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
-- Note: Using created_at index for date-based queries (DATE() is not IMMUTABLE)

-- ============================================================================
-- 3. PAGE PERFORMANCE TABLE (Daily Aggregates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS page_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  page_title text,
  date date NOT NULL,
  
  -- Traffic metrics
  views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  
  -- Engagement metrics
  avg_time_on_page numeric(10,2) DEFAULT 0,
  avg_scroll_depth numeric(5,2) DEFAULT 0,
  bounce_rate numeric(5,2) DEFAULT 0,
  
  -- Navigation metrics
  entry_count integer DEFAULT 0,
  exit_count integer DEFAULT 0,
  
  -- Conversion metrics
  cta_clicks integer DEFAULT 0,
  form_submissions integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(page_path, date)
);

-- Indexes for page_performance
CREATE INDEX IF NOT EXISTS idx_page_performance_date ON page_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_page_performance_page_path ON page_performance(page_path);
CREATE INDEX IF NOT EXISTS idx_page_performance_views ON page_performance(views DESC);

-- ============================================================================
-- 4. TRAFFIC SOURCES TABLE (Daily Aggregates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS traffic_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  
  -- Source details
  source_type text NOT NULL CHECK (source_type IN ('direct', 'organic', 'referral', 'social', 'email', 'paid', 'other')),
  source_name text, -- e.g., 'google', 'facebook', 'twitter'
  source_medium text, -- e.g., 'cpc', 'organic', 'referral'
  
  -- Metrics
  sessions integer DEFAULT 0,
  users integer DEFAULT 0,
  page_views integer DEFAULT 0,
  bounce_rate numeric(5,2) DEFAULT 0,
  avg_session_duration numeric(10,2) DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(date, source_type, source_name)
);

-- Indexes for traffic_sources
CREATE INDEX IF NOT EXISTS idx_traffic_sources_date ON traffic_sources(date DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_type ON traffic_sources(source_type);

-- ============================================================================
-- 5. DAILY ANALYTICS SUMMARY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_analytics_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  
  -- Traffic metrics
  total_sessions integer DEFAULT 0,
  total_users integer DEFAULT 0,
  new_users integer DEFAULT 0,
  returning_users integer DEFAULT 0,
  total_page_views integer DEFAULT 0,
  
  -- Engagement metrics
  bounce_rate numeric(5,2) DEFAULT 0,
  avg_session_duration numeric(10,2) DEFAULT 0,
  pages_per_session numeric(5,2) DEFAULT 0,
  
  -- Device breakdown
  desktop_sessions integer DEFAULT 0,
  mobile_sessions integer DEFAULT 0,
  tablet_sessions integer DEFAULT 0,
  
  -- Top metrics (stored as JSONB for flexibility)
  top_pages jsonb DEFAULT '[]'::jsonb,
  top_countries jsonb DEFAULT '[]'::jsonb,
  top_sources jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for daily_analytics_summary
CREATE INDEX IF NOT EXISTS idx_daily_analytics_summary_date ON daily_analytics_summary(date DESC);

-- ============================================================================
-- 6. ENHANCE PAGE_VIEWS TABLE (Add new columns if not exists)
-- ============================================================================
DO $$
BEGIN
  -- Add time_on_page column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'page_views' AND column_name = 'time_on_page') THEN
    ALTER TABLE page_views ADD COLUMN time_on_page integer DEFAULT 0;
  END IF;
  
  -- Add scroll_depth column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'page_views' AND column_name = 'scroll_depth') THEN
    ALTER TABLE page_views ADD COLUMN scroll_depth numeric(5,2) DEFAULT 0;
  END IF;
  
  -- Add is_entry column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'page_views' AND column_name = 'is_entry') THEN
    ALTER TABLE page_views ADD COLUMN is_entry boolean DEFAULT false;
  END IF;
  
  -- Add is_exit column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'page_views' AND column_name = 'is_exit') THEN
    ALTER TABLE page_views ADD COLUMN is_exit boolean DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics_summary ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. RLS POLICIES - Insert (Anyone can track)
-- ============================================================================
CREATE POLICY "Anyone can insert analytics_sessions"
  ON analytics_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert analytics_events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 9. RLS POLICIES - Select (Admins only)
-- ============================================================================
CREATE POLICY "Admins can view analytics_sessions"
  ON analytics_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff')
    )
  );

CREATE POLICY "Admins can view analytics_events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff')
    )
  );

CREATE POLICY "Admins can view page_performance"
  ON page_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff')
    )
  );

CREATE POLICY "Admins can manage page_performance"
  ON page_performance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can view traffic_sources"
  ON traffic_sources FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff')
    )
  );

CREATE POLICY "Admins can manage traffic_sources"
  ON traffic_sources FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admins can view daily_analytics_summary"
  ON daily_analytics_summary FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff')
    )
  );

CREATE POLICY "Admins can manage daily_analytics_summary"
  ON daily_analytics_summary FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- 10. UPDATE POLICIES (for session updates)
-- ============================================================================
CREATE POLICY "Anyone can update own session"
  ON analytics_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 11. HELPER FUNCTIONS
-- ============================================================================

-- Function to update session on page view
CREATE OR REPLACE FUNCTION update_session_on_page_view()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE analytics_sessions
  SET 
    page_count = page_count + 1,
    is_bounce = false,
    exit_page = NEW.path,
    ended_at = NEW.created_at,
    duration_seconds = EXTRACT(EPOCH FROM (NEW.created_at - started_at))::integer,
    updated_at = now()
  WHERE session_id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update session on new page view
DROP TRIGGER IF EXISTS trigger_update_session_on_page_view ON page_views;
CREATE TRIGGER trigger_update_session_on_page_view
  AFTER INSERT ON page_views
  FOR EACH ROW
  EXECUTE FUNCTION update_session_on_page_view();

-- Function to aggregate daily analytics
CREATE OR REPLACE FUNCTION aggregate_daily_analytics(target_date date)
RETURNS void AS $$
DECLARE
  summary_record RECORD;
BEGIN
  -- Calculate daily summary
  SELECT
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(DISTINCT COALESCE(user_id::text, session_id)) as total_users,
    COUNT(DISTINCT CASE WHEN is_new_visitor THEN session_id END) as new_users,
    COUNT(DISTINCT CASE WHEN NOT is_new_visitor THEN session_id END) as returning_users,
    COALESCE(SUM(page_count), 0) as total_page_views,
    COALESCE(AVG(CASE WHEN is_bounce THEN 100 ELSE 0 END), 0) as bounce_rate,
    COALESCE(AVG(duration_seconds), 0) as avg_session_duration,
    COALESCE(AVG(page_count), 0) as pages_per_session,
    COUNT(CASE WHEN device_type = 'desktop' THEN 1 END) as desktop_sessions,
    COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) as mobile_sessions,
    COUNT(CASE WHEN device_type = 'tablet' THEN 1 END) as tablet_sessions
  INTO summary_record
  FROM analytics_sessions
  WHERE DATE(started_at) = target_date;
  
  -- Upsert daily summary
  INSERT INTO daily_analytics_summary (
    date, total_sessions, total_users, new_users, returning_users,
    total_page_views, bounce_rate, avg_session_duration, pages_per_session,
    desktop_sessions, mobile_sessions, tablet_sessions, updated_at
  ) VALUES (
    target_date,
    COALESCE(summary_record.total_sessions, 0),
    COALESCE(summary_record.total_users, 0),
    COALESCE(summary_record.new_users, 0),
    COALESCE(summary_record.returning_users, 0),
    COALESCE(summary_record.total_page_views, 0),
    COALESCE(summary_record.bounce_rate, 0),
    COALESCE(summary_record.avg_session_duration, 0),
    COALESCE(summary_record.pages_per_session, 0),
    COALESCE(summary_record.desktop_sessions, 0),
    COALESCE(summary_record.mobile_sessions, 0),
    COALESCE(summary_record.tablet_sessions, 0),
    now()
  )
  ON CONFLICT (date) DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    total_users = EXCLUDED.total_users,
    new_users = EXCLUDED.new_users,
    returning_users = EXCLUDED.returning_users,
    total_page_views = EXCLUDED.total_page_views,
    bounce_rate = EXCLUDED.bounce_rate,
    avg_session_duration = EXCLUDED.avg_session_duration,
    pages_per_session = EXCLUDED.pages_per_session,
    desktop_sessions = EXCLUDED.desktop_sessions,
    mobile_sessions = EXCLUDED.mobile_sessions,
    tablet_sessions = EXCLUDED.tablet_sessions,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION aggregate_daily_analytics(date) TO authenticated;


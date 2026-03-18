/*
  # SEO Analytics Tables for Google Search Console Integration

  1. New Tables
    - `seo_google_credentials` - OAuth tokens for Google Search Console
    - `seo_keywords` - Historical keyword performance data
    - `seo_keyword_rankings` - Daily position tracking
    - `seo_pages` - Page-level SEO metrics
    - `seo_backlinks` - Manual backlink tracking
    - `seo_sync_logs` - Track data sync history

  2. Security
    - Enable RLS on all tables
    - Admin-only access for credentials and data

  3. Indexes
    - Optimized for date range queries and keyword lookups
*/

-- ============================================================================
-- 1. SEO GOOGLE CREDENTIALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_google_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url text NOT NULL UNIQUE,
  site_name text,
  
  -- OAuth tokens
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_type text DEFAULT 'Bearer',
  expires_at timestamptz NOT NULL,
  scope text,
  
  -- Connection status
  is_connected boolean DEFAULT true,
  last_sync_at timestamptz,
  sync_status text CHECK (sync_status IN ('idle', 'syncing', 'success', 'error')),
  sync_error text,
  
  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for credentials
CREATE INDEX IF NOT EXISTS idx_seo_google_credentials_site ON seo_google_credentials(site_url);

-- ============================================================================
-- 2. SEO KEYWORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url text NOT NULL,
  
  -- Keyword data
  keyword text NOT NULL,
  page_url text,
  
  -- Metrics
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  ctr numeric(6,4) DEFAULT 0, -- Click-through rate as decimal (0.0000 to 1.0000)
  position numeric(6,2) DEFAULT 0, -- Average position
  
  -- Time period
  date date NOT NULL,
  
  -- Device/Country breakdown (optional)
  device text CHECK (device IN ('DESKTOP', 'MOBILE', 'TABLET', NULL)),
  country text,
  
  created_at timestamptz DEFAULT now(),
  
  -- Simple unique constraint for aggregated data
  UNIQUE(site_url, keyword, date)
);

-- Indexes for keywords
CREATE INDEX IF NOT EXISTS idx_seo_keywords_site ON seo_keywords(site_url);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_keyword ON seo_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_date ON seo_keywords(date DESC);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_clicks ON seo_keywords(clicks DESC);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_position ON seo_keywords(position);
CREATE INDEX IF NOT EXISTS idx_seo_keywords_composite ON seo_keywords(site_url, date, keyword);

-- ============================================================================
-- 3. SEO KEYWORD RANKINGS TABLE (Daily Position Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_keyword_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url text NOT NULL,
  keyword text NOT NULL,
  
  -- Position data
  date date NOT NULL,
  position numeric(6,2) NOT NULL,
  previous_position numeric(6,2),
  position_change numeric(6,2) DEFAULT 0, -- Negative = improved (moved up)
  
  -- Trend indicators
  trend text CHECK (trend IN ('up', 'down', 'stable', 'new')),
  days_in_trend integer DEFAULT 1,
  
  -- Additional metrics for context
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(site_url, keyword, date)
);

-- Indexes for rankings
CREATE INDEX IF NOT EXISTS idx_seo_keyword_rankings_site ON seo_keyword_rankings(site_url);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_rankings_keyword ON seo_keyword_rankings(keyword);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_rankings_date ON seo_keyword_rankings(date DESC);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_rankings_trend ON seo_keyword_rankings(trend);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_rankings_position ON seo_keyword_rankings(position);

-- ============================================================================
-- 4. SEO PAGES TABLE (Page-level metrics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url text NOT NULL,
  page_url text NOT NULL,
  page_title text,
  
  -- Metrics
  date date NOT NULL,
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  ctr numeric(6,4) DEFAULT 0,
  avg_position numeric(6,2) DEFAULT 0,
  
  -- Keyword count for this page
  keyword_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(site_url, page_url, date)
);

-- Indexes for pages
CREATE INDEX IF NOT EXISTS idx_seo_pages_site ON seo_pages(site_url);
CREATE INDEX IF NOT EXISTS idx_seo_pages_url ON seo_pages(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_pages_date ON seo_pages(date DESC);
CREATE INDEX IF NOT EXISTS idx_seo_pages_clicks ON seo_pages(clicks DESC);

-- ============================================================================
-- 5. SEO BACKLINKS TABLE (Manual tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_backlinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url text NOT NULL,
  
  -- Link details
  source_url text NOT NULL,
  source_domain text NOT NULL,
  target_url text NOT NULL,
  anchor_text text,
  
  -- Metrics
  domain_authority integer,
  page_authority integer,
  spam_score integer,
  
  -- Link attributes
  link_type text CHECK (link_type IN ('dofollow', 'nofollow', 'sponsored', 'ugc', 'unknown')),
  is_active boolean DEFAULT true,
  
  -- Discovery
  first_seen_at timestamptz DEFAULT now(),
  last_checked_at timestamptz,
  status text CHECK (status IN ('active', 'lost', 'broken', 'pending')),
  
  -- Source
  data_source text, -- e.g., 'ahrefs', 'semrush', 'moz', 'manual'
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(site_url, source_url, target_url)
);

-- Indexes for backlinks
CREATE INDEX IF NOT EXISTS idx_seo_backlinks_site ON seo_backlinks(site_url);
CREATE INDEX IF NOT EXISTS idx_seo_backlinks_source_domain ON seo_backlinks(source_domain);
CREATE INDEX IF NOT EXISTS idx_seo_backlinks_status ON seo_backlinks(status);
CREATE INDEX IF NOT EXISTS idx_seo_backlinks_da ON seo_backlinks(domain_authority DESC);

-- ============================================================================
-- 6. SEO SYNC LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url text NOT NULL,
  
  -- Sync details
  sync_type text NOT NULL CHECK (sync_type IN ('keywords', 'pages', 'full')),
  status text NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  
  -- Results
  records_fetched integer DEFAULT 0,
  records_inserted integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  
  -- Date range synced
  date_from date,
  date_to date,
  
  -- Error handling
  error_message text,
  error_details jsonb,
  
  -- Timing
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  
  created_at timestamptz DEFAULT now()
);

-- Index for sync logs
CREATE INDEX IF NOT EXISTS idx_seo_sync_logs_site ON seo_sync_logs(site_url);
CREATE INDEX IF NOT EXISTS idx_seo_sync_logs_created ON seo_sync_logs(created_at DESC);

-- ============================================================================
-- 7. SEO DAILY SUMMARY TABLE (Pre-aggregated)
-- ============================================================================
CREATE TABLE IF NOT EXISTS seo_daily_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url text NOT NULL,
  date date NOT NULL,
  
  -- Totals
  total_clicks integer DEFAULT 0,
  total_impressions integer DEFAULT 0,
  avg_ctr numeric(6,4) DEFAULT 0,
  avg_position numeric(6,2) DEFAULT 0,
  
  -- Counts
  total_keywords integer DEFAULT 0,
  keywords_in_top_3 integer DEFAULT 0,
  keywords_in_top_10 integer DEFAULT 0,
  keywords_in_top_20 integer DEFAULT 0,
  keywords_improved integer DEFAULT 0,
  keywords_declined integer DEFAULT 0,
  
  -- Top performers (stored as JSONB)
  top_keywords jsonb DEFAULT '[]'::jsonb,
  top_pages jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(site_url, date)
);

-- Index for daily summary
CREATE INDEX IF NOT EXISTS idx_seo_daily_summary_site ON seo_daily_summary(site_url);
CREATE INDEX IF NOT EXISTS idx_seo_daily_summary_date ON seo_daily_summary(date DESC);

-- ============================================================================
-- 8. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE seo_google_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_daily_summary ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. RLS POLICIES - Admin Only Access
-- ============================================================================

-- Credentials (Admin only - sensitive data)
CREATE POLICY "Admins can manage seo_google_credentials"
  ON seo_google_credentials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Keywords (Admin/Staff can view)
CREATE POLICY "Staff can view seo_keywords"
  ON seo_keywords FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff')
    )
  );

CREATE POLICY "Admins can manage seo_keywords"
  ON seo_keywords FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Rankings (Admin/Staff can view)
CREATE POLICY "Staff can view seo_keyword_rankings"
  ON seo_keyword_rankings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff')
    )
  );

CREATE POLICY "Admins can manage seo_keyword_rankings"
  ON seo_keyword_rankings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Pages (Admin/Staff can view)
CREATE POLICY "Staff can view seo_pages"
  ON seo_pages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff')
    )
  );

CREATE POLICY "Admins can manage seo_pages"
  ON seo_pages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Backlinks (Admin/Staff can view)
CREATE POLICY "Staff can view seo_backlinks"
  ON seo_backlinks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff')
    )
  );

CREATE POLICY "Admins can manage seo_backlinks"
  ON seo_backlinks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Sync Logs (Admin only)
CREATE POLICY "Admins can manage seo_sync_logs"
  ON seo_sync_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Daily Summary (Admin/Staff can view)
CREATE POLICY "Staff can view seo_daily_summary"
  ON seo_daily_summary FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff')
    )
  );

CREATE POLICY "Admins can manage seo_daily_summary"
  ON seo_daily_summary FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- 10. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate keyword ranking changes
CREATE OR REPLACE FUNCTION calculate_keyword_ranking_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Get previous position
  SELECT position INTO NEW.previous_position
  FROM seo_keyword_rankings
  WHERE site_url = NEW.site_url
    AND keyword = NEW.keyword
    AND date < NEW.date
  ORDER BY date DESC
  LIMIT 1;
  
  -- Calculate change (negative = improvement)
  IF NEW.previous_position IS NOT NULL THEN
    NEW.position_change := NEW.position - NEW.previous_position;
    
    -- Determine trend
    IF NEW.position_change < -0.5 THEN
      NEW.trend := 'up';
    ELSIF NEW.position_change > 0.5 THEN
      NEW.trend := 'down';
    ELSE
      NEW.trend := 'stable';
    END IF;
  ELSE
    NEW.trend := 'new';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ranking changes
DROP TRIGGER IF EXISTS trigger_calculate_ranking_change ON seo_keyword_rankings;
CREATE TRIGGER trigger_calculate_ranking_change
  BEFORE INSERT ON seo_keyword_rankings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_keyword_ranking_change();

-- Function to get trending keywords
CREATE OR REPLACE FUNCTION get_trending_keywords(
  p_site_url text,
  p_days integer DEFAULT 7,
  p_limit integer DEFAULT 10,
  p_direction text DEFAULT 'up'
)
RETURNS TABLE (
  keyword text,
  current_position numeric,
  previous_position numeric,
  position_change numeric,
  clicks integer,
  impressions integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.keyword,
    r.position as current_position,
    r.previous_position,
    r.position_change,
    r.clicks,
    r.impressions
  FROM seo_keyword_rankings r
  WHERE r.site_url = p_site_url
    AND r.date >= CURRENT_DATE - p_days
    AND r.trend = p_direction
  ORDER BY 
    CASE WHEN p_direction = 'up' THEN r.position_change END ASC,
    CASE WHEN p_direction = 'down' THEN r.position_change END DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_trending_keywords(text, integer, integer, text) TO authenticated;


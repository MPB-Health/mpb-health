/*
  # Create Admin Analytics Dashboard Tables

  1. New Tables
    - `site_analytics`
      - Tracks overall site performance metrics
      - Daily aggregated analytics data
      - Page views, unique visitors, bounce rate, etc.
    
    - `marketing_campaigns`
      - Marketing campaign tracking
      - Budget, spend, revenue, conversions
      - Multi-channel campaign management
    
    - `content_analytics`
      - Content performance tracking
      - Blog articles, resources, pages
      - Views, engagement, time on page
    
    - `seo_metadata`
      - SEO settings per page
      - Meta titles, descriptions, keywords
      - Open Graph and Twitter Card data
    
    - `site_settings`
      - Global site configuration
      - Feature flags, API keys, settings
      - Categorized settings management

  2. Security
    - Enable RLS on all tables
    - Admin-only access policies
    - Secure sensitive configuration data
*/

-- Site Analytics Table
CREATE TABLE IF NOT EXISTS site_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  page_views integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  new_visitors integer DEFAULT 0,
  returning_visitors integer DEFAULT 0,
  bounce_rate numeric(5,2) DEFAULT 0,
  avg_session_duration integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  conversion_rate numeric(5,2) DEFAULT 0,
  top_pages jsonb DEFAULT '[]'::jsonb,
  traffic_sources jsonb DEFAULT '{}'::jsonb,
  device_breakdown jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_analytics_date ON site_analytics(date DESC);

-- Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL,
  status text DEFAULT 'active',
  start_date date NOT NULL,
  end_date date,
  budget numeric(10,2) DEFAULT 0,
  spent numeric(10,2) DEFAULT 0,
  revenue numeric(10,2) DEFAULT 0,
  conversions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  ctr numeric(5,2) DEFAULT 0,
  cpc numeric(10,2) DEFAULT 0,
  roas numeric(10,2) DEFAULT 0,
  target_audience jsonb DEFAULT '{}'::jsonb,
  utm_params jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_channel ON marketing_campaigns(channel);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_dates ON marketing_campaigns(start_date, end_date);

-- Content Analytics Table
CREATE TABLE IF NOT EXISTS content_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text NOT NULL,
  date date NOT NULL,
  views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  avg_time_on_page integer DEFAULT 0,
  bounce_rate numeric(5,2) DEFAULT 0,
  scroll_depth_avg numeric(5,2) DEFAULT 0,
  cta_clicks integer DEFAULT 0,
  shares integer DEFAULT 0,
  engagement_score numeric(10,2) DEFAULT 0,
  traffic_sources jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_analytics_content ON content_analytics(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_analytics_date ON content_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_content_analytics_type ON content_analytics(content_type);

-- SEO Metadata Table
CREATE TABLE IF NOT EXISTS seo_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text UNIQUE NOT NULL,
  meta_title text,
  meta_description text,
  meta_keywords text[],
  og_title text,
  og_description text,
  og_image text,
  og_type text DEFAULT 'website',
  twitter_card text DEFAULT 'summary_large_image',
  twitter_title text,
  twitter_description text,
  twitter_image text,
  canonical_url text,
  robots text DEFAULT 'index,follow',
  structured_data jsonb DEFAULT '{}'::jsonb,
  priority numeric(2,1) DEFAULT 0.5,
  change_frequency text DEFAULT 'weekly',
  last_crawled timestamptz,
  crawl_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_metadata_path ON seo_metadata(page_path);

-- Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL,
  data_type text DEFAULT 'string',
  is_public boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_public ON site_settings(is_public);

-- Enable Row Level Security
ALTER TABLE site_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access for analytics tables
CREATE POLICY "Admin can view site analytics"
  ON site_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can manage site analytics"
  ON site_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can view marketing campaigns"
  ON marketing_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can manage marketing campaigns"
  ON marketing_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can view content analytics"
  ON content_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can manage content analytics"
  ON content_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can view SEO metadata"
  ON seo_metadata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin can manage SEO metadata"
  ON seo_metadata FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can view all site settings"
  ON site_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Public can view public site settings"
  ON site_settings FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY "Admin can manage site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

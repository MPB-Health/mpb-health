/*
  # Analytics Tracking Configuration System

  ## Overview
  Complete analytics pipeline management similar to WordPress admin with enhanced marketing intelligence.

  ## Tables Created
  
  ### 1. tracking_platforms
  - Master registry of all available tracking platforms
  - Platform metadata, status, and configuration options
  
  ### 2. tracking_snippets
  - Individual tracking code snippets and pixels
  - Platform-specific configurations with IDs and parameters
  - Version control and testing modes
  
  ### 3. tracking_tags
  - Tag container system for organizing tracking codes
  - Categories, priorities, and firing rules
  
  ### 4. tag_firing_rules
  - Conditional logic for when tags should fire
  - Page paths, URL parameters, user conditions
  
  ### 5. conversion_events
  - Custom conversion event definitions
  - Multi-platform event routing and mapping
  
  ### 6. utm_campaigns
  - Campaign URL tracking and management
  - UTM parameter templates and performance
  
  ### 7. tracking_event_log
  - Real-time event stream storage
  - Debugging and audit trail
  
  ### 8. integration_health
  - Platform connection status monitoring
  - Error detection and alerting
  
  ### 9. analytics_experiments
  - A/B testing configuration and results
  - Statistical analysis and variant performance

  ## Security
  - Enable RLS on all tables
  - Admin-only write access
  - Read access for analytics processing
*/

-- Tracking Platforms Registry
CREATE TABLE IF NOT EXISTS tracking_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name text UNIQUE NOT NULL,
  platform_type text NOT NULL,
  display_name text NOT NULL,
  description text,
  icon_url text,
  documentation_url text,
  is_active boolean DEFAULT true,
  requires_consent boolean DEFAULT true,
  config_schema jsonb DEFAULT '{}'::jsonb,
  default_settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_platforms_type ON tracking_platforms(platform_type);
CREATE INDEX IF NOT EXISTS idx_tracking_platforms_active ON tracking_platforms(is_active);

-- Tracking Snippets (Individual Pixels/Codes)
CREATE TABLE IF NOT EXISTS tracking_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id uuid REFERENCES tracking_platforms(id) ON DELETE CASCADE,
  snippet_name text NOT NULL,
  tracking_id text,
  snippet_code text,
  snippet_type text DEFAULT 'javascript',
  injection_point text DEFAULT 'head',
  is_enabled boolean DEFAULT true,
  is_test_mode boolean DEFAULT false,
  load_priority integer DEFAULT 100,
  configuration jsonb DEFAULT '{}'::jsonb,
  custom_parameters jsonb DEFAULT '{}'::jsonb,
  version integer DEFAULT 1,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_snippets_platform ON tracking_snippets(platform_id);
CREATE INDEX IF NOT EXISTS idx_tracking_snippets_enabled ON tracking_snippets(is_enabled);
CREATE INDEX IF NOT EXISTS idx_tracking_snippets_priority ON tracking_snippets(load_priority);

-- Tracking Tags (Tag Container System)
CREATE TABLE IF NOT EXISTS tracking_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name text NOT NULL,
  tag_category text NOT NULL,
  tag_type text NOT NULL,
  snippet_id uuid REFERENCES tracking_snippets(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  fire_on_page_load boolean DEFAULT true,
  fire_priority integer DEFAULT 100,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_tags_category ON tracking_tags(tag_category);
CREATE INDEX IF NOT EXISTS idx_tracking_tags_active ON tracking_tags(is_active);
CREATE INDEX IF NOT EXISTS idx_tracking_tags_snippet ON tracking_tags(snippet_id);

-- Tag Firing Rules
CREATE TABLE IF NOT EXISTS tag_firing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id uuid REFERENCES tracking_tags(id) ON DELETE CASCADE,
  rule_type text NOT NULL,
  rule_condition text NOT NULL,
  rule_value text,
  match_type text DEFAULT 'equals',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tag_firing_rules_tag ON tag_firing_rules(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_firing_rules_type ON tag_firing_rules(rule_type);

-- Conversion Events
CREATE TABLE IF NOT EXISTS conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text UNIQUE NOT NULL,
  event_display_name text NOT NULL,
  event_category text NOT NULL,
  event_description text,
  is_active boolean DEFAULT true,
  track_value boolean DEFAULT false,
  track_currency boolean DEFAULT false,
  platform_mappings jsonb DEFAULT '{}'::jsonb,
  custom_properties jsonb DEFAULT '{}'::jsonb,
  funnel_step integer,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_category ON conversion_events(event_category);
CREATE INDEX IF NOT EXISTS idx_conversion_events_active ON conversion_events(is_active);

-- UTM Campaigns
CREATE TABLE IF NOT EXISTS utm_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL,
  campaign_url text NOT NULL,
  utm_source text NOT NULL,
  utm_medium text NOT NULL,
  utm_campaign text NOT NULL,
  utm_term text,
  utm_content text,
  short_url text,
  qr_code_url text,
  campaign_start_date date,
  campaign_end_date date,
  campaign_budget numeric(10,2),
  is_active boolean DEFAULT true,
  click_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  revenue_generated numeric(10,2) DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_utm_campaigns_source ON utm_campaigns(utm_source);
CREATE INDEX IF NOT EXISTS idx_utm_campaigns_medium ON utm_campaigns(utm_medium);
CREATE INDEX IF NOT EXISTS idx_utm_campaigns_campaign ON utm_campaigns(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_utm_campaigns_active ON utm_campaigns(is_active);

-- Tracking Event Log (Real-time Event Stream)
CREATE TABLE IF NOT EXISTS tracking_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  event_type text NOT NULL,
  platform_name text,
  event_data jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  session_id text,
  page_path text,
  referrer text,
  user_agent text,
  ip_address inet,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_event_log_name ON tracking_event_log(event_name);
CREATE INDEX IF NOT EXISTS idx_tracking_event_log_type ON tracking_event_log(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_event_log_platform ON tracking_event_log(platform_name);
CREATE INDEX IF NOT EXISTS idx_tracking_event_log_created ON tracking_event_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_event_log_user ON tracking_event_log(user_id);

-- Integration Health Monitoring
CREATE TABLE IF NOT EXISTS integration_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id uuid REFERENCES tracking_platforms(id) ON DELETE CASCADE,
  status text DEFAULT 'healthy',
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error_message text,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  avg_response_time numeric(10,2),
  uptime_percentage numeric(5,2),
  alerts_enabled boolean DEFAULT true,
  last_checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_health_platform ON integration_health(platform_id);
CREATE INDEX IF NOT EXISTS idx_integration_health_status ON integration_health(status);

-- Analytics Experiments (A/B Testing)
CREATE TABLE IF NOT EXISTS analytics_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name text NOT NULL,
  experiment_description text,
  experiment_type text DEFAULT 'ab_test',
  hypothesis text,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  status text DEFAULT 'draft',
  traffic_allocation numeric(5,2) DEFAULT 50,
  variants jsonb NOT NULL,
  success_metric text NOT NULL,
  baseline_value numeric(10,4),
  target_value numeric(10,4),
  statistical_significance numeric(5,2),
  winner_variant text,
  participants_count integer DEFAULT 0,
  conversions_count integer DEFAULT 0,
  results_data jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_experiments_status ON analytics_experiments(status);
CREATE INDEX IF NOT EXISTS idx_analytics_experiments_dates ON analytics_experiments(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE tracking_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_firing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_experiments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin Full Access
CREATE POLICY "Admin can manage tracking platforms"
  ON tracking_platforms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage tracking snippets"
  ON tracking_snippets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage tracking tags"
  ON tracking_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage tag firing rules"
  ON tag_firing_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage conversion events"
  ON conversion_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage UTM campaigns"
  ON utm_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can view tracking event log"
  ON tracking_event_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "System can insert tracking events"
  ON tracking_event_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can view integration health"
  ON integration_health FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "System can update integration health"
  ON integration_health FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can manage analytics experiments"
  ON analytics_experiments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public read access for active configurations
CREATE POLICY "Public can view active tracking platforms"
  ON tracking_platforms FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Public can view enabled tracking snippets"
  ON tracking_snippets FOR SELECT
  TO anon
  USING (is_enabled = true AND is_test_mode = false);

CREATE POLICY "Public can view active conversion events"
  ON conversion_events FOR SELECT
  TO anon
  USING (is_active = true);

-- Seed default tracking platforms
INSERT INTO tracking_platforms (platform_name, platform_type, display_name, description, requires_consent) VALUES
  ('google_analytics', 'analytics', 'Google Analytics 4', 'Universal web analytics platform with advanced reporting', true),
  ('facebook_pixel', 'advertising', 'Facebook Pixel', 'Meta advertising pixel for conversion tracking', true),
  ('linkedin_insight', 'advertising', 'LinkedIn Insight Tag', 'LinkedIn conversion tracking and audience building', true),
  ('twitter_pixel', 'advertising', 'Twitter Pixel', 'X (Twitter) advertising conversion tracking', true),
  ('pinterest_tag', 'advertising', 'Pinterest Tag', 'Pinterest conversion tracking and analytics', true),
  ('tiktok_pixel', 'advertising', 'TikTok Pixel', 'TikTok advertising pixel for campaign optimization', true),
  ('reddit_pixel', 'advertising', 'Reddit Pixel', 'Reddit advertising conversion tracking', true),
  ('snapchat_pixel', 'advertising', 'Snapchat Pixel', 'Snapchat advertising pixel', true),
  ('microsoft_clarity', 'analytics', 'Microsoft Clarity', 'Session recording and heatmap analytics', true),
  ('hotjar', 'analytics', 'Hotjar', 'Behavioral analytics and user feedback platform', true),
  ('custom_javascript', 'custom', 'Custom JavaScript', 'Custom tracking code snippets', false)
ON CONFLICT (platform_name) DO NOTHING;

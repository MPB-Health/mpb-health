/*
  # Admin Analytics and Site Management System

  ## New Tables

  ### site_analytics
  Tracks overall site metrics and performance
  - `id` (uuid, primary key) - Record identifier
  - `date` (date) - Analytics date
  - `page_views` (integer) - Total page views
  - `unique_visitors` (integer) - Unique visitors
  - `bounce_rate` (decimal) - Bounce rate percentage
  - `avg_session_duration` (integer) - Average session duration in seconds
  - `conversion_rate` (decimal) - Conversion rate percentage
  - `created_at` (timestamptz) - Record creation timestamp

  ### marketing_campaigns
  Tracks marketing campaign performance
  - `id` (uuid, primary key) - Campaign identifier
  - `name` (text) - Campaign name
  - `channel` (text) - Marketing channel (google_ads, facebook, linkedin, email)
  - `budget` (decimal) - Campaign budget
  - `spent` (decimal) - Amount spent
  - `impressions` (integer) - Ad impressions
  - `clicks` (integer) - Click count
  - `conversions` (integer) - Conversion count
  - `revenue` (decimal) - Revenue generated
  - `start_date` (date) - Campaign start date
  - `end_date` (date) - Campaign end date
  - `status` (text) - Campaign status
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update

  ### content_analytics
  Tracks blog and content performance
  - `id` (uuid, primary key) - Record identifier
  - `content_id` (uuid) - Reference to blog article or content
  - `content_type` (text) - Type (blog_article, landing_page, resource)
  - `views` (integer) - View count
  - `unique_views` (integer) - Unique visitor views
  - `avg_time_on_page` (integer) - Average time in seconds
  - `shares` (integer) - Social share count
  - `leads_generated` (integer) - Leads from this content
  - `date` (date) - Analytics date
  - `created_at` (timestamptz) - Record creation

  ### admin_actions_log
  Audit trail for all admin actions
  - `id` (uuid, primary key) - Log identifier
  - `admin_user_id` (uuid) - Admin user who performed action
  - `action_type` (text) - Type of action
  - `target_type` (text) - What was affected (member, claim, blog_post, etc)
  - `target_id` (uuid) - ID of affected record
  - `changes` (jsonb) - JSON of what changed
  - `ip_address` (text) - IP address of admin
  - `user_agent` (text) - Browser user agent
  - `created_at` (timestamptz) - When action occurred

  ### site_settings
  Global site configuration
  - `id` (uuid, primary key) - Setting identifier
  - `category` (text) - Setting category (general, contact, social, features)
  - `key` (text, unique) - Setting key
  - `value` (jsonb) - Setting value
  - `description` (text) - Setting description
  - `updated_by` (uuid) - Last admin who updated
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update

  ### seo_metadata
  SEO settings for pages
  - `id` (uuid, primary key) - Record identifier
  - `page_path` (text, unique) - Page URL path
  - `meta_title` (text) - Page title for SEO
  - `meta_description` (text) - Meta description
  - `meta_keywords` (text) - Keywords
  - `og_title` (text) - OpenGraph title
  - `og_description` (text) - OpenGraph description
  - `og_image` (text) - OpenGraph image URL
  - `canonical_url` (text) - Canonical URL
  - `robots` (text) - Robots directive
  - `updated_by` (uuid) - Last admin who updated
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update

  ### email_templates
  Email template management
  - `id` (uuid, primary key) - Template identifier
  - `name` (text) - Template name
  - `slug` (text, unique) - Template identifier slug
  - `subject` (text) - Email subject line
  - `html_body` (text) - HTML email body
  - `text_body` (text) - Plain text body
  - `variables` (jsonb) - Available template variables
  - `category` (text) - Template category
  - `is_active` (boolean) - Whether template is in use
  - `updated_by` (uuid) - Last admin who updated
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update

  ### site_redirects
  URL redirect management
  - `id` (uuid, primary key) - Redirect identifier
  - `from_path` (text, unique) - Source URL path
  - `to_path` (text) - Destination URL path
  - `redirect_type` (integer) - HTTP status code (301, 302, etc)
  - `is_active` (boolean) - Whether redirect is enabled
  - `hit_count` (integer) - Number of times redirect was used
  - `created_by` (uuid) - Admin who created redirect
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update

  ## Security
  - Enable RLS on all tables
  - Admin-only access for all operations
  - Audit logging for sensitive actions

  ## Performance
  - Indexes on foreign keys and frequently queried fields
  - Indexes on date fields for time-series queries
*/

-- Create site_analytics table
CREATE TABLE IF NOT EXISTS site_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  page_views integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  bounce_rate decimal(5,2) DEFAULT 0,
  avg_session_duration integer DEFAULT 0,
  conversion_rate decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create marketing_campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL,
  budget decimal(10,2) DEFAULT 0,
  spent decimal(10,2) DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue decimal(10,2) DEFAULT 0,
  start_date date,
  end_date date,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create content_analytics table
CREATE TABLE IF NOT EXISTS content_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid,
  content_type text NOT NULL,
  views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  avg_time_on_page integer DEFAULT 0,
  shares integer DEFAULT 0,
  leads_generated integer DEFAULT 0,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(content_id, date)
);

-- Create admin_actions_log table
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  changes jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text UNIQUE NOT NULL,
  value jsonb DEFAULT '{}',
  description text DEFAULT '',
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create seo_metadata table
CREATE TABLE IF NOT EXISTS seo_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text UNIQUE NOT NULL,
  meta_title text DEFAULT '',
  meta_description text DEFAULT '',
  meta_keywords text DEFAULT '',
  og_title text DEFAULT '',
  og_description text DEFAULT '',
  og_image text DEFAULT '',
  canonical_url text DEFAULT '',
  robots text DEFAULT 'index, follow',
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  subject text NOT NULL,
  html_body text DEFAULT '',
  text_body text DEFAULT '',
  variables jsonb DEFAULT '[]',
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create site_redirects table
CREATE TABLE IF NOT EXISTS site_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path text UNIQUE NOT NULL,
  to_path text NOT NULL,
  redirect_type integer DEFAULT 301,
  is_active boolean DEFAULT true,
  hit_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_analytics_date ON site_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_channel ON marketing_campaigns(channel);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_dates ON marketing_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_content_analytics_content ON content_analytics(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_analytics_date ON content_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_user ON admin_actions_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON admin_actions_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON email_templates(slug);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_site_redirects_from ON site_redirects(from_path);
CREATE INDEX IF NOT EXISTS idx_site_redirects_active ON site_redirects(is_active);

-- Enable Row Level Security
ALTER TABLE site_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_redirects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_analytics (Admin only)
CREATE POLICY "Admins can view site analytics"
  ON site_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can insert site analytics"
  ON site_analytics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can update site analytics"
  ON site_analytics FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- RLS Policies for marketing_campaigns (Admin only)
CREATE POLICY "Admins can view campaigns"
  ON marketing_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage campaigns"
  ON marketing_campaigns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for content_analytics (Admin only)
CREATE POLICY "Admins can view content analytics"
  ON content_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage content analytics"
  ON content_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- RLS Policies for admin_actions_log (Admin only)
CREATE POLICY "Admins can view action logs"
  ON admin_actions_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can insert action logs"
  ON admin_actions_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- RLS Policies for site_settings (Admin only)
CREATE POLICY "Admins can view site settings"
  ON site_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for seo_metadata (Admin only)
CREATE POLICY "Admins can view SEO metadata"
  ON seo_metadata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage SEO metadata"
  ON seo_metadata FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- RLS Policies for email_templates (Admin only)
CREATE POLICY "Admins can view email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for site_redirects (Admin only)
CREATE POLICY "Admins can view redirects"
  ON site_redirects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admins can manage redirects"
  ON site_redirects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Insert default site settings
INSERT INTO site_settings (category, key, value, description) VALUES
  ('general', 'site_name', '"MPB Health"', 'Site name'),
  ('general', 'site_tagline', '"Healthcare That Shares"', 'Site tagline'),
  ('general', 'maintenance_mode', 'false', 'Enable maintenance mode'),
  ('contact', 'phone', '"(855) 816-4650"', 'Primary contact phone'),
  ('contact', 'email', '"info@mpb.health"', 'Primary contact email'),
  ('contact', 'address', '{"street":"", "city":"", "state":"", "zip":""}', 'Business address'),
  ('social', 'facebook_url', '""', 'Facebook page URL'),
  ('social', 'linkedin_url', '""', 'LinkedIn company URL'),
  ('social', 'twitter_url', '""', 'Twitter/X profile URL'),
  ('features', 'blog_enabled', 'true', 'Enable blog feature'),
  ('features', 'enrollment_enabled', 'true', 'Enable enrollment'),
  ('features', 'chat_enabled', 'true', 'Enable live chat')
ON CONFLICT (key) DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (name, slug, subject, category, variables) VALUES
  ('Welcome Email', 'welcome', 'Welcome to MPB Health', 'onboarding', '["member_name", "member_number", "advisor_name"]'),
  ('Claim Submitted', 'claim-submitted', 'Your Claim Has Been Received', 'claims', '["member_name", "claim_number", "claim_amount"]'),
  ('Claim Approved', 'claim-approved', 'Your Claim Has Been Approved', 'claims', '["member_name", "claim_number", "approved_amount"]'),
  ('Password Reset', 'password-reset', 'Reset Your Password', 'account', '["member_name", "reset_link"]')
ON CONFLICT (slug) DO NOTHING;

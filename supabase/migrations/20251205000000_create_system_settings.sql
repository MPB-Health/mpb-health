/*
  # System Settings Management

  ## Overview
  Key-value storage for all site configuration settings that can be managed by admins.

  ## Tables Created

  ### system_settings
  - Stores all configurable site settings
  - `id` (uuid, primary key)
  - `key` (text, unique) - Setting identifier
  - `value` (text) - Setting value
  - `category` (text) - Category for grouping (general, email, security, etc.)
  - `description` (text) - Human-readable description
  - `is_sensitive` (boolean) - Whether to mask the value in UI
  - `created_at` (timestamptz) - Record creation
  - `updated_at` (timestamptz) - Last update

  ## Security
  - Enable RLS
  - Authenticated users can read non-sensitive settings
  - Admin/staff can read all settings and modify
*/

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  description text DEFAULT '',
  is_sensitive boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

-- Enable Row Level Security
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read non-sensitive settings
DO $$ BEGIN
  CREATE POLICY "Authenticated can view non-sensitive settings"
    ON system_settings FOR SELECT
    TO authenticated
    USING (is_sensitive = false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins can read all settings
DO $$ BEGIN
  CREATE POLICY "Admins can view all settings"
    ON system_settings FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff', 'superadmin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admins can manage settings
DO $$ BEGIN
  CREATE POLICY "Admins can manage settings"
    ON system_settings FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff', 'superadmin')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff', 'superadmin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed default settings
INSERT INTO system_settings (key, value, category, description, is_sensitive) VALUES
  -- General Settings
  ('site_name', 'MPB Health', 'general', 'The name displayed across the site', false),
  ('site_description', 'Affordable Healthcare Memberships', 'general', 'Site meta description', false),
  ('support_email', 'info@mympb.com', 'general', 'Primary support email address', false),
  ('support_phone', '(855) 816-4650', 'general', 'Primary support phone number displayed in header', false),
  ('timezone', 'America/New_York', 'general', 'Default timezone for the application', false),
  ('maintenance_mode', 'false', 'general', 'Enable maintenance mode', false),
  
  -- Email Settings
  ('smtp_host', '', 'email', 'SMTP server hostname', false),
  ('smtp_port', '587', 'email', 'SMTP server port', false),
  ('smtp_username', '', 'email', 'SMTP authentication username', false),
  ('smtp_password', '', 'email', 'SMTP authentication password', true),
  ('from_email', 'noreply@mympb.com', 'email', 'Default sender email address', false),
  ('from_name', 'MPB Health', 'email', 'Default sender name', false),
  
  -- Security Settings
  ('session_timeout', '30', 'security', 'Session timeout in minutes', false),
  ('max_login_attempts', '5', 'security', 'Maximum failed login attempts before lockout', false),
  ('lockout_duration', '15', 'security', 'Account lockout duration in minutes', false),
  ('require_mfa', 'false', 'security', 'Require MFA for all admin users', false),
  ('password_min_length', '8', 'security', 'Minimum password length', false),
  ('allowed_origins', '*', 'security', 'CORS allowed origins', false),
  
  -- Notification Settings
  ('enable_email_notifications', 'true', 'notifications', 'Enable email notifications', false),
  ('enable_sms_notifications', 'false', 'notifications', 'Enable SMS notifications', false),
  ('enable_push_notifications', 'true', 'notifications', 'Enable push notifications', false),
  ('notification_digest', 'daily', 'notifications', 'Notification digest frequency (instant/daily/weekly)', false),
  ('admin_alert_email', '', 'notifications', 'Email for admin alerts', false),
  
  -- Appearance Settings
  ('primary_color', '#0a4c8f', 'appearance', 'Primary brand color', false),
  ('secondary_color', '#00a651', 'appearance', 'Secondary brand color', false),
  ('logo_url', '/assets/logo.png', 'appearance', 'Path to logo image', false),
  ('favicon_url', '/favicon.ico', 'appearance', 'Path to favicon', false),
  ('dark_mode_enabled', 'false', 'appearance', 'Enable dark mode option', false),
  
  -- Integration Settings
  ('google_analytics_id', '', 'integrations', 'Google Analytics tracking ID', false),
  ('zoho_salesiq_widget_code', '', 'integrations', 'Zoho SalesIQ widget code', false),
  ('stripe_public_key', '', 'integrations', 'Stripe publishable key', false),
  ('stripe_secret_key', '', 'integrations', 'Stripe secret key', true)
ON CONFLICT (key) DO NOTHING;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS system_settings_updated_at ON system_settings;
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();



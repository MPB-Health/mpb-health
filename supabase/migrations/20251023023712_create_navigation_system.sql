/*
  # Navigation System Schema

  1. New Tables
    - `navigation_items`
      - `id` (uuid, primary key)
      - `label` (text) - Display text for navigation item
      - `href` (text) - URL path for navigation
      - `description` (text, nullable) - Description shown in mega-menu
      - `icon` (text, nullable) - Lucide icon name
      - `parent_id` (uuid, nullable) - For nested navigation items
      - `order` (integer) - Display order within parent
      - `is_active` (boolean) - Show/hide navigation item
      - `requires_auth` (boolean) - Requires authenticated user
      - `allowed_roles` (text[], nullable) - Specific roles that can see this item
      - `external` (boolean) - Opens in new tab
      - `badge` (text, nullable) - Badge text like "New" or "Popular"
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_navigation_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `favorite_links` (jsonb) - User's favorite navigation items
      - `recent_pages` (jsonb) - Recently visited pages
      - `custom_order` (jsonb, nullable) - Custom navigation ordering
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `navigation_analytics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable, references auth.users)
      - `navigation_item_id` (uuid, references navigation_items)
      - `session_id` (text) - Anonymous session tracking
      - `action` (text) - click, hover, search, etc.
      - `timestamp` (timestamptz)
      - `user_agent` (text, nullable)
      - `referrer` (text, nullable)

  2. Security
    - Enable RLS on all tables
    - Public read access for non-auth navigation items
    - Authenticated users can read auth-required items
    - Only authenticated users can manage their preferences
    - Analytics tracking allows anonymous and authenticated
*/

-- Navigation Items Table
CREATE TABLE IF NOT EXISTS navigation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  href text NOT NULL,
  description text,
  icon text,
  parent_id uuid REFERENCES navigation_items(id) ON DELETE CASCADE,
  order_position integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  requires_auth boolean DEFAULT false,
  allowed_roles text[],
  external boolean DEFAULT false,
  badge text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Navigation Preferences Table
CREATE TABLE IF NOT EXISTS user_navigation_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  favorite_links jsonb DEFAULT '[]'::jsonb,
  recent_pages jsonb DEFAULT '[]'::jsonb,
  custom_order jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Navigation Analytics Table
CREATE TABLE IF NOT EXISTS navigation_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  navigation_item_id uuid REFERENCES navigation_items(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  action text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  user_agent text,
  referrer text
);

-- Enable Row Level Security
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_navigation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for navigation_items
CREATE POLICY "Anyone can view public navigation items"
  ON navigation_items FOR SELECT
  USING (is_active = true AND requires_auth = false);

CREATE POLICY "Authenticated users can view auth-required items"
  ON navigation_items FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Only admins can insert navigation items"
  ON navigation_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Only admins can update navigation items"
  ON navigation_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Only admins can delete navigation items"
  ON navigation_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for user_navigation_preferences
CREATE POLICY "Users can view own navigation preferences"
  ON user_navigation_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own navigation preferences"
  ON user_navigation_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own navigation preferences"
  ON user_navigation_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own navigation preferences"
  ON user_navigation_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for navigation_analytics
CREATE POLICY "Anyone can insert navigation analytics"
  ON navigation_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all analytics"
  ON navigation_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_navigation_items_parent_id ON navigation_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_navigation_items_order ON navigation_items(order_position);
CREATE INDEX IF NOT EXISTS idx_navigation_items_active ON navigation_items(is_active);
CREATE INDEX IF NOT EXISTS idx_navigation_items_requires_auth ON navigation_items(requires_auth);
CREATE INDEX IF NOT EXISTS idx_user_navigation_preferences_user_id ON user_navigation_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_navigation_analytics_timestamp ON navigation_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_navigation_analytics_session_id ON navigation_analytics(session_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_navigation_items_updated_at ON navigation_items;
CREATE TRIGGER update_navigation_items_updated_at
  BEFORE UPDATE ON navigation_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_navigation_preferences_updated_at ON user_navigation_preferences;
CREATE TRIGGER update_user_navigation_preferences_updated_at
  BEFORE UPDATE ON user_navigation_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial prospect navigation structure
INSERT INTO navigation_items (label, href, icon, order_position, requires_auth) VALUES
  ('Home', '/', 'Home', 1, false),
  ('Plans & Pricing', '/plans', 'DollarSign', 2, false),
  ('How It Works', '/how-it-works', 'HelpCircle', 3, false),
  ('Features', '/features', 'Star', 4, false),
  ('Resources', '/resources', 'BookOpen', 5, false),
  ('About', '/about-us', 'Info', 6, false);

-- Insert Plans & Pricing sub-items
DO $$
DECLARE
  plans_parent_id uuid;
BEGIN
  SELECT id INTO plans_parent_id FROM navigation_items WHERE href = '/plans';
  
  INSERT INTO navigation_items (label, href, description, icon, parent_id, order_position, requires_auth) VALUES
    ('Individuals & Families', '/individuals-and-families', 'Comprehensive health sharing plans for you and your loved ones', 'Users', plans_parent_id, 1, false),
    ('Businesses & Organizations', '/businesses-and-organizations', 'Health Plan with Health Savings Account', 'Building2', plans_parent_id, 2, false),
    ('Compare Plans', '/compare-plans', 'Side-by-side comparison of all available plans', 'GitCompare', plans_parent_id, 3, false),
    ('Get Free Quote', '/get-started', 'Get personalized pricing in minutes', 'Calculator', plans_parent_id, 4, false);
END $$;

-- Insert Resources sub-items
DO $$
DECLARE
  resources_parent_id uuid;
BEGIN
  SELECT id INTO resources_parent_id FROM navigation_items WHERE href = '/resources';
  
  INSERT INTO navigation_items (label, href, description, icon, parent_id, order_position, requires_auth) VALUES
    ('Resource Library', '/resources', 'Guides, articles, and helpful resources', 'BookOpen', resources_parent_id, 1, false),
    ('Blog', '/blog', 'Latest news and healthcare insights', 'Newspaper', resources_parent_id, 2, false),
    ('Events', '/events', 'Upcoming webinars and community events', 'Calendar', resources_parent_id, 3, false),
    ('Member Stories', '/member-stories', 'Real experiences from our community', 'Heart', resources_parent_id, 4, false),
    ('FAQ', '/faq', 'Answers to common questions', 'MessageCircle', resources_parent_id, 5, false);
END $$;

-- Insert About sub-items
DO $$
DECLARE
  about_parent_id uuid;
BEGIN
  SELECT id INTO about_parent_id FROM navigation_items WHERE href = '/about-us';
  
  INSERT INTO navigation_items (label, href, description, icon, parent_id, order_position, requires_auth) VALUES
    ('About Us', '/about-us', 'Our mission, values, and story', 'Info', about_parent_id, 1, false),
    ('Contact', '/contact', 'Get in touch with our team', 'Mail', about_parent_id, 2, false),
    ('Join Our Team', '/join-our-team', 'Explore career opportunities', 'Briefcase', about_parent_id, 3, false),
    ('Support', '/support', 'Get help with your account', 'HelpCircle', about_parent_id, 4, false);
END $$;

-- Insert Member Portal navigation (requires_auth = true)
INSERT INTO navigation_items (label, href, icon, order_position, requires_auth, badge) VALUES
  ('My Dashboard', '/member-portal', 'LayoutDashboard', 1, true, null),
  ('My Account', '/member-portal/account', 'User', 2, true, null),
  ('Member Services', '/member-portal/services', 'Headphones', 3, true, null),
  ('Resources', '/member-portal/resources', 'BookOpen', 4, true, null);

-- Insert Member Services sub-items
DO $$
DECLARE
  services_parent_id uuid;
BEGIN
  SELECT id INTO services_parent_id FROM navigation_items WHERE href = '/member-portal/services';
  
  INSERT INTO navigation_items (label, href, description, icon, parent_id, order_position, requires_auth) VALUES
    ('Member Feedback', '/member-feedback', 'Share your experience with us', 'MessageSquare', services_parent_id, 1, true),
    ('Refer a Friend', '/refer-a-friend', 'Help others discover MPB Health', 'UserPlus', services_parent_id, 2, true),
    ('Review Us', '/review-us', 'Leave a review and help our community grow', 'Star', services_parent_id, 3, true),
    ('Review or Change Advisor', '/review-or-change-advisor', 'Update your healthcare advisor preferences', 'Users', services_parent_id, 4, true),
    ('Schedule Welcome Call', '/schedule-welcome-call', 'Book your personalized orientation session', 'Phone', services_parent_id, 5, true),
    ('Welcome Call Survey', '/welcome-call-survey', 'Share feedback on your welcome experience', 'ClipboardList', services_parent_id, 6, true);
END $$;

-- Insert Employer Tools sub-items (specific role required)
DO $$
DECLARE
  services_parent_id uuid;
BEGIN
  SELECT id INTO services_parent_id FROM navigation_items WHERE href = '/member-portal/services';
  
  INSERT INTO navigation_items (label, href, description, icon, parent_id, order_position, requires_auth, allowed_roles) VALUES
    ('List-Bill Setup', '/list-bill-setup', 'Initialize list-billing for your organization', 'Briefcase', services_parent_id, 7, true, ARRAY['employer', 'admin']),
    ('List-Bill Conversion', '/list-bill-conversion', 'Convert existing billing to list-bill format', 'FileText', services_parent_id, 8, true, ARRAY['employer', 'admin']),
    ('List-Bill Update', '/list-bill-update', 'Update your list-billing information', 'ClipboardList', services_parent_id, 9, true, ARRAY['employer', 'admin']),
    ('Employee Removal', '/employee-removal', 'Process employee termination requests', 'UserMinus', services_parent_id, 10, true, ARRAY['employer', 'admin']);
END $$;
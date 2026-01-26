/*
  # Feature Tracking and Analytics System

  1. New Tables
    - `feature_views`
      - Tracks when members view healthcare feature detail pages
      - Used for analytics on which features are most popular
    - `feature_interests`
      - Captures member interest signals when they interact with features
      - Helps understand which features drive engagement
    - `feature_journey_tracking`
      - Tracks the path from feature viewing to plan selection
      - Analyzes conversion from education to enrollment

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin access
    - Allow anonymous view tracking for analytics
*/

-- Feature Views Table
CREATE TABLE IF NOT EXISTS feature_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id text NOT NULL,
  feature_name text NOT NULL,
  session_id uuid,
  user_id uuid REFERENCES auth.users(id),
  referrer_url text,
  time_on_page_seconds integer,
  scrolled_to_bottom boolean DEFAULT false,
  clicked_get_started boolean DEFAULT false,
  viewed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Feature Interests Table
CREATE TABLE IF NOT EXISTS feature_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id text NOT NULL,
  feature_name text NOT NULL,
  session_id uuid,
  user_id uuid REFERENCES auth.users(id),
  interest_type text NOT NULL,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Feature Journey Tracking Table
CREATE TABLE IF NOT EXISTS feature_journey_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  entry_feature_id text NOT NULL,
  entry_feature_name text NOT NULL,
  viewed_features text[] DEFAULT '{}',
  started_onboarding boolean DEFAULT false,
  completed_onboarding boolean DEFAULT false,
  recommended_plan text,
  submitted_lead boolean DEFAULT false,
  converted_to_member boolean DEFAULT false,
  total_time_minutes integer,
  entry_timestamp timestamptz DEFAULT now(),
  last_activity_timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_views_feature_id ON feature_views(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_views_viewed_at ON feature_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_feature_views_session_id ON feature_views(session_id);

CREATE INDEX IF NOT EXISTS idx_feature_interests_feature_id ON feature_interests(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_interests_created_at ON feature_interests(created_at);

CREATE INDEX IF NOT EXISTS idx_feature_journey_session_id ON feature_journey_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_feature_journey_entry_feature ON feature_journey_tracking(entry_feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_journey_completed ON feature_journey_tracking(completed_onboarding);

-- Enable Row Level Security
ALTER TABLE feature_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_journey_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_views

-- Allow anonymous insert for analytics tracking
CREATE POLICY "Allow anonymous feature view tracking"
  ON feature_views
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert their own views
CREATE POLICY "Users can track own feature views"
  ON feature_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow authenticated admins to view all feature views
CREATE POLICY "Admins can view all feature views"
  ON feature_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for feature_interests

-- Allow anonymous insert for interest capture
CREATE POLICY "Allow anonymous feature interest capture"
  ON feature_interests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert their own interests
CREATE POLICY "Users can submit own feature interests"
  ON feature_interests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow authenticated admins to view all interests
CREATE POLICY "Admins can view all feature interests"
  ON feature_interests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for feature_journey_tracking

-- Allow anonymous insert for journey tracking
CREATE POLICY "Allow anonymous journey tracking"
  ON feature_journey_tracking
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous update of own journey
CREATE POLICY "Allow anonymous journey updates by session"
  ON feature_journey_tracking
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to track their own journey
CREATE POLICY "Users can track own feature journey"
  ON feature_journey_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow authenticated users to update their own journey
CREATE POLICY "Users can update own feature journey"
  ON feature_journey_tracking
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow authenticated admins to view all journeys
CREATE POLICY "Admins can view all feature journeys"
  ON feature_journey_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

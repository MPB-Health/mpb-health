/*
  # Create Support Analytics Tables

  ## Overview
  This migration creates tables to track user interactions with the support page,
  allowing administrators to understand which support resources are most frequently
  accessed by different user roles.

  ## New Tables
    - `support_interactions`
      - `id` (uuid, primary key) - Unique identifier for each interaction
      - `action_type` (text) - The support action clicked (e.g., "Add Employee", "Submit Medical Need")
      - `user_role` (text) - The role category (Employer, Member, Advisor)
      - `target_url` (text) - The destination URL or path
      - `is_external` (boolean) - Whether the link was external
      - `session_id` (text) - Anonymous session identifier for grouping actions
      - `user_agent` (text) - Browser/device information
      - `created_at` (timestamptz) - When the interaction occurred

    - `support_page_views`
      - `id` (uuid, primary key) - Unique identifier for each page view
      - `session_id` (text) - Anonymous session identifier
      - `referrer` (text) - Where the user came from
      - `user_agent` (text) - Browser/device information
      - `created_at` (timestamptz) - When the page was viewed

  ## Security
    - Enable RLS on both tables
    - Only authenticated admin users can read analytics data
    - Public users can insert their own interaction events (for tracking)
    - No updates or deletes allowed to maintain data integrity

  ## Indexes
    - Index on created_at for time-based queries
    - Index on action_type for filtering by support action
    - Index on user_role for role-based analytics
*/

-- Create support_interactions table
CREATE TABLE IF NOT EXISTS support_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  user_role text NOT NULL CHECK (user_role IN ('Employer', 'Member', 'Advisor')),
  target_url text NOT NULL,
  is_external boolean DEFAULT false,
  session_id text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create support_page_views table
CREATE TABLE IF NOT EXISTS support_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  referrer text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_interactions_created_at ON support_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_interactions_action_type ON support_interactions(action_type);
CREATE INDEX IF NOT EXISTS idx_support_interactions_user_role ON support_interactions(user_role);
CREATE INDEX IF NOT EXISTS idx_support_page_views_created_at ON support_page_views(created_at DESC);

-- Enable Row Level Security
ALTER TABLE support_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_page_views ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insert for tracking (anonymous analytics)
CREATE POLICY "Allow public insert for support interactions"
  ON support_interactions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public insert for support page views"
  ON support_page_views
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Only authenticated admins can read analytics data
CREATE POLICY "Admins can read support interactions"
  ON support_interactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can read support page views"
  ON support_page_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

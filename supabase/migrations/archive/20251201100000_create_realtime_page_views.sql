/*
  # Create Real-Time Page Views Table

  1. New Tables
    - `page_views`
      - `id` (uuid, primary key)
      - `path` (text) - URL path visited
      - `title` (text) - Page title
      - `session_id` (text) - Anonymous session tracking
      - `user_id` (uuid, nullable) - Authenticated user reference
      - `user_agent` (text) - Browser user agent
      - `referrer` (text) - Referring URL
      - `country` (text) - Country from timezone
      - `device_type` (text) - desktop/mobile/tablet
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Anyone can insert page views (for anonymous tracking)
    - Only admins can read page views

  3. Realtime
    - Enable realtime for live dashboard updates
*/

-- Create page_views table for real-time analytics
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  title text,
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent text,
  referrer text,
  country text,
  device_type text CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_device_type ON page_views(device_type);

-- Enable Row Level Security
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can insert page views (for anonymous tracking)
CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Admins can view all page views
CREATE POLICY "Admins can view page views"
  ON page_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff')
    )
  );

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE page_views;

-- Create a function to clean up old page views (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_page_views()
RETURNS void AS $$
BEGIN
  DELETE FROM page_views WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create active_sessions view for quick active visitor counts
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
  session_id,
  MAX(created_at) as last_activity,
  COUNT(*) as page_count,
  MAX(device_type) as device_type,
  MAX(country) as country
FROM page_views
WHERE created_at > now() - interval '5 minutes'
GROUP BY session_id;

-- Grant access to the view
GRANT SELECT ON active_sessions TO authenticated;


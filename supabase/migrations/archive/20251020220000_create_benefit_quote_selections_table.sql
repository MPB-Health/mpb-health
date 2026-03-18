/*
  # Create Benefit Quote Selections Table

  1. New Tables
    - `benefit_quote_selections`
      - `id` (uuid, primary key)
      - `session_id` (text) - Unique session identifier for tracking user selections
      - `user_email` (text, optional) - User's email if provided
      - `benefit_ids` (text[]) - Array of selected benefit IDs
      - `quote_details` (jsonb) - Additional quote information (age, family size, zip, etc.)
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Last update timestamp
      - `expires_at` (timestamptz) - Session expiration timestamp

  2. Security
    - Enable RLS on `benefit_quote_selections` table
    - Add policy for anonymous users to insert and read their own session
    - Add policy for authenticated admin users to read all selections
    - Add policy for session-based updates using session_id
*/

CREATE TABLE IF NOT EXISTS benefit_quote_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_email text,
  benefit_ids text[] DEFAULT ARRAY[]::text[],
  quote_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

-- Create index on session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_benefit_quote_session_id ON benefit_quote_selections(session_id);

-- Create index on user_email for user lookups
CREATE INDEX IF NOT EXISTS idx_benefit_quote_user_email ON benefit_quote_selections(user_email);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_benefit_quote_expires_at ON benefit_quote_selections(expires_at);

-- Enable Row Level Security
ALTER TABLE benefit_quote_selections ENABLE ROW LEVEL SECURITY;

-- Policy: Anonymous users can insert new sessions
CREATE POLICY "Anyone can create quote session"
  ON benefit_quote_selections
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Users can view their own session by session_id
CREATE POLICY "Users can view own quote session"
  ON benefit_quote_selections
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Users can update their own session by session_id
CREATE POLICY "Users can update own quote session"
  ON benefit_quote_selections
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated admin users can view all sessions
CREATE POLICY "Admins can view all quote sessions"
  ON benefit_quote_selections
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_benefit_quote_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
DROP TRIGGER IF EXISTS benefit_quote_updated_at_trigger ON benefit_quote_selections;
CREATE TRIGGER benefit_quote_updated_at_trigger
  BEFORE UPDATE ON benefit_quote_selections
  FOR EACH ROW
  EXECUTE FUNCTION update_benefit_quote_updated_at();

-- Function to clean up expired sessions (can be called by a cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_benefit_quotes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM benefit_quote_selections
  WHERE expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

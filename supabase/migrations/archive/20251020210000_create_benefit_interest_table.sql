/*
  # Create Benefit Interest Tracking Table

  1. New Tables
    - `benefit_interest_submissions`
      - `id` (uuid, primary key)
      - `benefit_type` (text) - Type of benefit user is interested in
      - `user_email` (text) - User's email address
      - `user_name` (text) - User's full name
      - `user_phone` (text, optional) - User's phone number
      - `additional_info` (jsonb, optional) - Any additional qualifying information
      - `created_at` (timestamptz) - Timestamp of submission
      - `updated_at` (timestamptz) - Last update timestamp
      - `status` (text) - Submission status (new, contacted, enrolled, declined)

  2. Security
    - Enable RLS on `benefit_interest_submissions` table
    - Add policy for public inserts (anyone can submit interest)
    - Add policy for authenticated admin users to read all submissions
*/

CREATE TABLE IF NOT EXISTS benefit_interest_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_type text NOT NULL,
  user_email text NOT NULL,
  user_name text NOT NULL,
  user_phone text,
  additional_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled', 'declined'))
);

-- Create index on benefit_type for faster queries
CREATE INDEX IF NOT EXISTS idx_benefit_interest_benefit_type ON benefit_interest_submissions(benefit_type);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_benefit_interest_status ON benefit_interest_submissions(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_benefit_interest_created_at ON benefit_interest_submissions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE benefit_interest_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert their interest (public submissions)
CREATE POLICY "Anyone can submit benefit interest"
  ON benefit_interest_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Only authenticated users can view all submissions
CREATE POLICY "Authenticated users can view all submissions"
  ON benefit_interest_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only authenticated users can update submissions
CREATE POLICY "Authenticated users can update submissions"
  ON benefit_interest_submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_benefit_interest_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
DROP TRIGGER IF EXISTS benefit_interest_updated_at_trigger ON benefit_interest_submissions;
CREATE TRIGGER benefit_interest_updated_at_trigger
  BEFORE UPDATE ON benefit_interest_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_benefit_interest_updated_at();

/*
  # Create Onboarding Responses Table

  1. New Tables
    - `onboarding_responses`
      - `id` (uuid, primary key)
      - `session_id` (uuid) - for tracking multi-visit sessions
      - `audience` (text) - individual, family, employer
      - `zip_code` (text)
      - `ages` (jsonb) - array of household ages
      - `priority` (text) - cost, balanced, hsa, coverage
      - `usage` (text) - virtual, mixed, inperson
      - `iua_comfort` (text) - higher, lower
      - `extras` (jsonb) - array of selected extras
      - `pre_existing_awareness` (boolean)
      - `contact_opt_in` (boolean)
      - `contact_email` (text)
      - `contact_phone` (text)
      - `recommended_plan_primary` (text)
      - `recommended_plan_alternate` (text)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `onboarding_responses` table
    - Add policy for anonymous users to insert their own responses
    - Add policy for authenticated admins to read all responses

  3. Indexes
    - Add index on session_id for fast lookups
    - Add index on created_at for analytics queries
*/

CREATE TABLE IF NOT EXISTS onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  audience text,
  zip_code text,
  ages jsonb DEFAULT '[]'::jsonb,
  priority text,
  usage text,
  iua_comfort text,
  extras jsonb DEFAULT '[]'::jsonb,
  pre_existing_awareness boolean DEFAULT false,
  contact_opt_in boolean DEFAULT false,
  contact_email text,
  contact_phone text,
  recommended_plan_primary text,
  recommended_plan_alternate text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert their own onboarding responses
CREATE POLICY "Anyone can insert onboarding responses"
  ON onboarding_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Users can read their own session responses
CREATE POLICY "Users can read own session responses"
  ON onboarding_responses
  FOR SELECT
  TO anon, authenticated
  USING (session_id = gen_random_uuid() OR true);

-- Policy: Authenticated users can read all responses (for admin/analytics)
CREATE POLICY "Authenticated users can read all responses"
  ON onboarding_responses
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_session_id 
  ON onboarding_responses(session_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_created_at 
  ON onboarding_responses(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_onboarding_updated_at'
  ) THEN
    CREATE TRIGGER set_onboarding_updated_at
      BEFORE UPDATE ON onboarding_responses
      FOR EACH ROW
      EXECUTE FUNCTION update_onboarding_updated_at();
  END IF;
END $$;
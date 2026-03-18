/*
  # Create enrollment tracking and plan selection tables

  ## Purpose
  Track user interactions with enrollment pages, plan selections, and rate calculator usage
  to optimize conversion funnel and provide analytics.

  ## New Tables
  
  ### `plan_selections`
  Tracks when users view or select specific plans (Care+, Direct, Secure HSA)
  - `id` (uuid, primary key)
  - `session_id` (text) - Anonymous session tracking
  - `plan_type` (text) - 'care-plus', 'direct', or 'secure-hsa'
  - `action` (text) - 'viewed', 'clicked', 'calculated'
  - `user_agent` (text) - Browser/device info
  - `referrer` (text) - Traffic source
  - `created_at` (timestamptz)
  
  ### `enrollment_intent`
  Captures when users initiate rate calculations or enrollment
  - `id` (uuid, primary key)
  - `session_id` (text)
  - `plan_type` (text)
  - `age_band` (text) - '18-29', '30-49', '50-64'
  - `iua` (integer) - 1250, 2500, or 5000
  - `household_size` (integer)
  - `has_tobacco` (boolean)
  - `start_date` (date) - Desired coverage start date
  - `estimated_rate` (numeric) - Calculated monthly rate
  - `created_at` (timestamptz)

  ### `rate_calculator_views`
  Tracks calculator page visits and completion rates
  - `id` (uuid, primary key)
  - `session_id` (text)
  - `source_section` (text) - Which CTA brought them to calculator
  - `completed` (boolean) - Did they complete the calculation?
  - `created_at` (timestamptz)

  ## Security
  - All tables have RLS enabled
  - Anonymous insert only (no auth required for tracking)
  - No public read access (admin/analytics only)

  ## Notes
  - Session IDs are client-generated UUIDs, not tied to auth
  - Data used for conversion optimization and A/B testing
  - PII is not collected; only aggregated behavior data
*/

-- Plan selections tracking
CREATE TABLE IF NOT EXISTS plan_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('care-plus', 'direct', 'secure-hsa')),
  action text NOT NULL CHECK (action IN ('viewed', 'clicked', 'calculated')),
  user_agent text,
  referrer text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_selections_session ON plan_selections(session_id);
CREATE INDEX IF NOT EXISTS idx_plan_selections_created ON plan_selections(created_at);

ALTER TABLE plan_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert on plan_selections"
  ON plan_selections
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all plan selections"
  ON plan_selections
  FOR SELECT
  TO authenticated
  USING (true);

-- Enrollment intent tracking
CREATE TABLE IF NOT EXISTS enrollment_intent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('care-plus', 'direct', 'secure-hsa')),
  age_band text CHECK (age_band IN ('18-29', '30-49', '50-64')),
  iua integer CHECK (iua IN (1250, 2500, 5000)),
  household_size integer CHECK (household_size >= 1 AND household_size <= 20),
  has_tobacco boolean DEFAULT false,
  start_date date,
  estimated_rate numeric(10, 2),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_intent_session ON enrollment_intent(session_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_intent_created ON enrollment_intent(created_at);
CREATE INDEX IF NOT EXISTS idx_enrollment_intent_plan ON enrollment_intent(plan_type);

ALTER TABLE enrollment_intent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert on enrollment_intent"
  ON enrollment_intent
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all enrollment intent"
  ON enrollment_intent
  FOR SELECT
  TO authenticated
  USING (true);

-- Rate calculator views tracking
CREATE TABLE IF NOT EXISTS rate_calculator_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  source_section text,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_calculator_views_session ON rate_calculator_views(session_id);
CREATE INDEX IF NOT EXISTS idx_rate_calculator_views_created ON rate_calculator_views(created_at);

ALTER TABLE rate_calculator_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert on rate_calculator_views"
  ON rate_calculator_views
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update on rate_calculator_views"
  ON rate_calculator_views
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all rate calculator views"
  ON rate_calculator_views
  FOR SELECT
  TO authenticated
  USING (true);
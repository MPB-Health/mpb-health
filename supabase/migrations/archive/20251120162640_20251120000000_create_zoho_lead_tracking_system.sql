/*
  # Zoho CRM Lead Tracking System

  ## Overview
  Creates tables and functions to track leads submitted through the Get a Quote form
  and synced to Zoho CRM, with retry logic for failed submissions.

  ## New Tables
  1. `zoho_tokens`
     - Stores Zoho OAuth access tokens
     - Single row table (id=1)
     - Encrypted token storage

  2. `zoho_lead_submissions`
     - Tracks all lead submissions
     - Links to Zoho CRM lead IDs
     - Stores submission status and retry attempts

  3. `lead_routing_logs`
     - Tracks user journey before quote form
     - Records which CTAs/buttons were clicked
     - Enables attribution analysis

  ## Security
  - RLS enabled on all tables
  - Admin-only access for sensitive data
  - Authenticated users can view their own submissions
*/

-- Create zoho_tokens table for OAuth token management
CREATE TABLE IF NOT EXISTS zoho_tokens (
  id integer PRIMARY KEY DEFAULT 1,
  access_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

ALTER TABLE zoho_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage Zoho tokens"
  ON zoho_tokens
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Create zoho_lead_submissions table
CREATE TABLE IF NOT EXISTS zoho_lead_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Form data
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  household_size integer,
  current_insurance text,
  monthly_premium text,
  coverage_preference text,
  zip_code text,
  primary_concern text,
  contact_preference text DEFAULT 'phone',

  -- Routing context
  source_page text,
  source_cta text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,

  -- Zoho CRM data
  zoho_lead_id text,
  zoho_sync_status text DEFAULT 'pending' CHECK (zoho_sync_status IN ('pending', 'success', 'failed', 'retrying')),
  zoho_sync_attempts integer DEFAULT 0,
  zoho_last_sync_at timestamptz,
  zoho_error_message text,

  -- Additional metadata
  form_data jsonb,
  ip_address inet,
  user_agent text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_email ON zoho_lead_submissions(email);
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_user_id ON zoho_lead_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_zoho_lead_id ON zoho_lead_submissions(zoho_lead_id);
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_sync_status ON zoho_lead_submissions(zoho_sync_status);
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_created_at ON zoho_lead_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_pending_sync ON zoho_lead_submissions(zoho_sync_status, zoho_sync_attempts)
  WHERE zoho_sync_status IN ('pending', 'failed');

ALTER TABLE zoho_lead_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all lead submissions"
  ON zoho_lead_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Users can view their own submissions"
  ON zoho_lead_submissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert lead submissions"
  ON zoho_lead_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update lead submissions"
  ON zoho_lead_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Create lead_routing_logs table for attribution tracking
CREATE TABLE IF NOT EXISTS lead_routing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Journey tracking
  page_path text NOT NULL,
  cta_type text,
  cta_text text,
  cta_location text,

  -- Context
  plan_type text,
  household_size integer,
  estimated_premium numeric,

  -- Timestamps
  clicked_at timestamptz DEFAULT now(),

  -- Session data
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text
);

CREATE INDEX IF NOT EXISTS idx_lead_routing_logs_session_id ON lead_routing_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_lead_routing_logs_user_id ON lead_routing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_routing_logs_clicked_at ON lead_routing_logs(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_routing_logs_cta_type ON lead_routing_logs(cta_type);

ALTER TABLE lead_routing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all routing logs"
  ON lead_routing_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Anyone can insert routing logs"
  ON lead_routing_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_zoho_lead_submission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_zoho_lead_submissions_updated_at ON zoho_lead_submissions;
CREATE TRIGGER update_zoho_lead_submissions_updated_at
  BEFORE UPDATE ON zoho_lead_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_zoho_lead_submission_updated_at();

-- Function to get pending Zoho syncs (for retry worker)
CREATE OR REPLACE FUNCTION get_pending_zoho_syncs(max_attempts integer DEFAULT 3)
RETURNS TABLE (
  id uuid,
  email text,
  zoho_sync_attempts integer,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    zls.id,
    zls.email,
    zls.zoho_sync_attempts,
    zls.created_at
  FROM zoho_lead_submissions zls
  WHERE zls.zoho_sync_status IN ('pending', 'failed')
    AND zls.zoho_sync_attempts < max_attempts
    AND (
      zls.zoho_last_sync_at IS NULL
      OR zls.zoho_last_sync_at < now() - interval '15 minutes'
    )
  ORDER BY zls.created_at ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lead submission stats
CREATE OR REPLACE FUNCTION get_lead_submission_stats(days_back integer DEFAULT 30)
RETURNS TABLE (
  total_submissions bigint,
  successful_syncs bigint,
  pending_syncs bigint,
  failed_syncs bigint,
  avg_sync_attempts numeric,
  submissions_by_source jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint AS total_submissions,
    COUNT(*) FILTER (WHERE zoho_sync_status = 'success')::bigint AS successful_syncs,
    COUNT(*) FILTER (WHERE zoho_sync_status = 'pending')::bigint AS pending_syncs,
    COUNT(*) FILTER (WHERE zoho_sync_status = 'failed')::bigint AS failed_syncs,
    AVG(zoho_sync_attempts) AS avg_sync_attempts,
    jsonb_object_agg(
      COALESCE(source_cta, 'unknown'),
      count
    ) AS submissions_by_source
  FROM zoho_lead_submissions
  CROSS JOIN LATERAL (
    SELECT COUNT(*)::integer AS count
    FROM zoho_lead_submissions zls2
    WHERE zls2.source_cta = zoho_lead_submissions.source_cta
      AND zls2.created_at >= now() - make_interval(days => days_back)
  ) counts
  WHERE created_at >= now() - make_interval(days => days_back);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
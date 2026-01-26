/*
  # Create Zoho SalesIQ Error Tracking System

  1. New Tables
    - `zoho_salesiq_errors`
      - `id` (uuid, primary key)
      - `error_type` (text) - Type of error encountered
      - `error_message` (text) - Detailed error message
      - `widget_code` (text) - Zoho widget identifier
      - `user_agent` (text) - Browser user agent string
      - `url` (text) - Page URL where error occurred
      - `network_details` (jsonb) - Network response details
      - `created_at` (timestamptz) - When error occurred
      
    - `zoho_salesiq_health_checks`
      - `id` (uuid, primary key)
      - `status` (text) - Widget status (ready, loading, error)
      - `is_loaded` (boolean) - Whether script loaded
      - `is_ready` (boolean) - Whether widget is ready
      - `response_time_ms` (integer) - Network response time
      - `checked_at` (timestamptz) - When health check ran

  2. Security
    - Enable RLS on both tables
    - Add policies for public insert (for error logging)
    - Add policies for authenticated read (for admin dashboard)

  3. Indexes
    - Index on created_at for efficient time-based queries
    - Index on error_type for filtering
    - Index on checked_at for health check history
*/

CREATE TABLE IF NOT EXISTS zoho_salesiq_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  error_message text NOT NULL,
  widget_code text NOT NULL,
  user_agent text NOT NULL,
  url text NOT NULL,
  network_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS zoho_salesiq_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL,
  is_loaded boolean DEFAULT false,
  is_ready boolean DEFAULT false,
  response_time_ms integer,
  checked_at timestamptz DEFAULT now()
);

ALTER TABLE zoho_salesiq_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoho_salesiq_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error logs"
  ON zoho_salesiq_errors
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read error logs"
  ON zoho_salesiq_errors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert health checks"
  ON zoho_salesiq_health_checks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read health checks"
  ON zoho_salesiq_health_checks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_zoho_errors_created_at 
  ON zoho_salesiq_errors(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_zoho_errors_type 
  ON zoho_salesiq_errors(error_type);

CREATE INDEX IF NOT EXISTS idx_zoho_health_checked_at 
  ON zoho_salesiq_health_checks(checked_at DESC);

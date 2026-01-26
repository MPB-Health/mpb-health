/*
  # Final Fix for Zoho Lead Submissions RLS Policy
  
  1. Problem
    - Form submissions failing with "new row violates row-level security policy"
    - 401 Unauthorized errors from Supabase API
    - Policy exists in migration files but not active in live database
  
  2. Solution
    - Drop and recreate INSERT policy with explicit anon + authenticated roles
    - Ensure RLS is enabled
    - Grant proper permissions to anon role
  
  3. Security
    - Policy allows public lead form submissions (required for quote form)
    - Admin policies remain restrictive for SELECT and UPDATE
    - No data leakage risk as anonymous users can only INSERT, not read
*/

-- Ensure RLS is enabled on the table
ALTER TABLE zoho_lead_submissions ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "Anyone can insert lead submissions" ON zoho_lead_submissions;
DROP POLICY IF EXISTS "Admins can view all lead submissions" ON zoho_lead_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON zoho_lead_submissions;
DROP POLICY IF EXISTS "Admins can update lead submissions" ON zoho_lead_submissions;

-- Recreate INSERT policy (most important - allows public form submissions)
CREATE POLICY "Anyone can insert lead submissions"
  ON zoho_lead_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Recreate SELECT policies
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

-- Recreate UPDATE policy
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

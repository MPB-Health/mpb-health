/*
  # Fix RLS Policy for zoho_lead_submissions Table

  1. Problem
    - Users receiving "new row violates row-level security policy" error
    - INSERT policy exists in original migration but not active in database
    - Lead submissions failing for anonymous users filling out quote form

  2. Solution
    - Drop existing INSERT policy if it exists
    - Recreate INSERT policy to allow anonymous and authenticated users to submit leads
    - Verify RLS is enabled on table

  3. Security
    - Policy allows anyone (anon or authenticated) to INSERT lead submissions
    - This is intentional for public-facing quote forms
    - No restrictions on data insertion for leads
    - Other policies (SELECT, UPDATE) remain admin-only or user-specific
*/

-- Ensure RLS is enabled on the table
ALTER TABLE zoho_lead_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policy if it exists (to ensure clean state)
DROP POLICY IF EXISTS "Anyone can insert lead submissions" ON zoho_lead_submissions;

-- Recreate INSERT policy with explicit permissions
CREATE POLICY "Anyone can insert lead submissions"
  ON zoho_lead_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
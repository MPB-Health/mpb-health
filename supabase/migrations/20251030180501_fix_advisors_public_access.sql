/*
  # Fix Advisors Table Public Access
  
  ## Summary
  This migration fixes the RLS policy on the advisors table to allow public (non-authenticated) 
  users to view all active advisors. The previous policy was too restrictive, requiring both 
  `is_active = true` AND `status LIKE '%Active%'`, which filtered out advisors with NULL 
  or non-standard status values.
  
  ## Changes Made
  1. Drop the existing restrictive RLS policy
  2. Create a new, more permissive policy that only checks `is_active = true`
  3. This allows all active advisors to be visible to the public, regardless of their status field value
  
  ## Security
  - RLS remains enabled on the advisors table
  - Policy restricts visibility to only advisors marked as active (`is_active = true`)
  - Anonymous users can only SELECT (read), not INSERT, UPDATE, or DELETE
  - Authenticated users would need separate policies for write operations
*/

-- Drop the existing overly restrictive policy
DROP POLICY IF EXISTS "Public can view active advisors" ON advisors;

-- Create a new policy that allows public read access to all active advisors
CREATE POLICY "Public can view active advisors"
  ON advisors
  FOR SELECT
  TO public
  USING (is_active = true);

-- Add a helpful comment
COMMENT ON POLICY "Public can view active advisors" ON advisors IS 
  'Allows anonymous (public) users to view all advisors where is_active = true. This policy does not check the status field to be more inclusive of advisors with NULL or non-standard status values.';
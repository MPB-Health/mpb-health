/*
  # Consolidate Advisors RLS Policies

  1. Changes
    - Remove redundant "Public can view active advisors" policy
    - Keep "Anyone can view active advisors" which already includes anon, authenticated, and public roles
  
  2. Security
    - Only SELECT access to active advisors (is_active = true)
    - Available to all users (anon, authenticated, public)
    - Write operations remain restricted to service_role
*/

-- Remove redundant policy
DROP POLICY IF EXISTS "Public can view active advisors" ON advisors;

-- The "Anyone can view active advisors" policy already exists with correct access
-- Verify it includes all necessary roles
DROP POLICY IF EXISTS "Anyone can view active advisors" ON advisors;
CREATE POLICY "Anyone can view active advisors"
  ON advisors
  FOR SELECT
  TO anon, authenticated, public
  USING (is_active = true);

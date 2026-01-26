/*
  # Fix Resource Library Anonymous Access - Final

  1. Problem Analysis
    - The Resource Library page shows 401 errors on the deployed site
    - Database RLS policies show `{public}` role, which should allow anonymous access
    - The issue is that the policies need to explicitly grant access to the `anon` role

  2. Changes
    - Recreate SELECT policies for `resource_library` with explicit `anon` and `authenticated` grants
    - Recreate SELECT policies for `resource_topics` with explicit `anon` and `authenticated` grants
    - Ensure policies are permissive and allow public read access

  3. Security
    - Only SELECT access is granted to anonymous users
    - Only published resources are visible (is_published = true)
    - Write operations still require authentication
    - This maintains data security while enabling public browsing
*/

-- ============================================================================
-- Fix resource_library policies
-- ============================================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Anyone can view published resources" ON resource_library;

-- Recreate with explicit role grants
CREATE POLICY "Public can view published resources"
  ON resource_library
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- ============================================================================
-- Fix resource_topics policies
-- ============================================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Anyone can view published topics" ON resource_topics;

-- Recreate with explicit role grants
CREATE POLICY "Public can view all topics"
  ON resource_topics
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- Verify RLS is enabled
-- ============================================================================

-- Ensure RLS is enabled on both tables
ALTER TABLE resource_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_topics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Grant necessary permissions to anon role
-- ============================================================================

-- Grant SELECT permission on tables to anon role
GRANT SELECT ON resource_library TO anon;
GRANT SELECT ON resource_topics TO anon;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon;

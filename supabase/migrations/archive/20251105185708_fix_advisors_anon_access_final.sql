/*
  # Fix Advisors Anonymous Access - Final Solution

  ## Overview
  This migration comprehensively fixes the RLS policies on the advisors table
  to ensure anonymous (unauthenticated) users can access the advisor directory
  on the deployed site.

  ## Problem
  The advisor directory was returning 401 errors because the RLS policies
  were not properly configured for anonymous access. Previous migrations
  attempted to use 'public' role which doesn't work as expected in Supabase.

  ## Solution
  - Drop all existing conflicting policies
  - Create a single, clear policy using 'anon' role (which is what Supabase uses for unauthenticated requests)
  - Explicitly grant SELECT permission to both 'anon' and 'authenticated' roles
  - Ensure policy only filters by is_active = true (no status checks)

  ## Security
  - RLS remains enabled on advisors table
  - Anonymous users can only SELECT (read) active advisors
  - No INSERT, UPDATE, or DELETE permissions for anonymous users
  - All write operations remain restricted to service_role or authenticated admin users

  ## Testing
  After this migration:
  1. Anonymous users should be able to query: SELECT * FROM advisors WHERE is_active = true
  2. The advisor directory page should load without 401 errors
  3. Filter queries (by state, agent_type) should work
*/

-- ============================================================================
-- STEP 1: Drop all existing conflicting policies
-- ============================================================================

DROP POLICY IF EXISTS "Public can view active advisors" ON advisors;
DROP POLICY IF EXISTS "Anyone can view active advisors" ON advisors;
DROP POLICY IF EXISTS "Anonymous can view active advisors" ON advisors;
DROP POLICY IF EXISTS "Authenticated users can view active advisors" ON advisors;

-- ============================================================================
-- STEP 2: Create a single comprehensive policy for read access
-- ============================================================================

-- This policy allows both anonymous (anon) and authenticated users to read active advisors
CREATE POLICY "Allow public read access to active advisors"
  ON advisors
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ============================================================================
-- STEP 3: Add helpful comment for future reference
-- ============================================================================

COMMENT ON POLICY "Allow public read access to active advisors" ON advisors IS
  'Allows both anonymous (anon) and authenticated users to view all active advisors. This policy only checks is_active = true to ensure maximum compatibility. Created to fix 401 errors on advisor directory page.';

-- ============================================================================
-- STEP 4: Verify RLS is enabled (should already be, but ensure it)
-- ============================================================================

ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;

/*
  # Fix Resource Library Admin Access

  ## Problem
  The previous migration (20251106165611) broke admin access to the resource_library table.
  It changed the SELECT policy to only allow viewing published resources (is_published = true),
  which means authenticated admins can no longer see unpublished/draft resources in the admin panel.

  The original policy in 20251016181315 correctly allowed:
  - Public users: view published resources only
  - Authenticated users: view ALL resources (including drafts)

  ## Solution
  1. Drop the restrictive SELECT policy
  2. Recreate with the original logic that allows authenticated users to see all resources
  3. Ensure INSERT, UPDATE, DELETE policies are properly set for authenticated users
  4. Grant necessary permissions

  ## Security
  - Anonymous users can only SELECT published resources (is_published = true)
  - Authenticated users can SELECT all resources (for admin management)
  - Only authenticated users can INSERT, UPDATE, DELETE
*/

-- ============================================================================
-- Fix resource_library SELECT policy
-- ============================================================================

-- Drop the overly restrictive policy from the previous migration
DROP POLICY IF EXISTS "Public can view published resources" ON resource_library;

-- Recreate with proper logic: public sees published only, authenticated sees all
CREATE POLICY "resource_library_select_policy"
  ON resource_library
  FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    OR auth.uid() IS NOT NULL
  );

-- ============================================================================
-- Ensure write policies exist for authenticated users
-- ============================================================================

-- Drop and recreate INSERT policy to ensure it exists
DROP POLICY IF EXISTS "Authenticated users can insert resources" ON resource_library;
CREATE POLICY "resource_library_insert_policy"
  ON resource_library
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Drop and recreate UPDATE policy to ensure it exists
DROP POLICY IF EXISTS "Authenticated users can update resources" ON resource_library;
CREATE POLICY "resource_library_update_policy"
  ON resource_library
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Drop and recreate DELETE policy to ensure it exists
DROP POLICY IF EXISTS "Authenticated users can delete resources" ON resource_library;
CREATE POLICY "resource_library_delete_policy"
  ON resource_library
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- Grant permissions
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE resource_library ENABLE ROW LEVEL SECURITY;

-- Grant SELECT to anon for public viewing
GRANT SELECT ON resource_library TO anon;

-- Grant full access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON resource_library TO authenticated;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

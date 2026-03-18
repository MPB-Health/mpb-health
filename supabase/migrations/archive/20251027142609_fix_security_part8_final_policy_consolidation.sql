/*
  # Fix Database Security Issues - Part 8: Final Policy Consolidation

  ## Fix Remaining Multiple Permissive Policies
    - Consolidate plan_features policies
    - Consolidate plan_pricing policies  
    - Consolidate plan_sharing_details policies
    - Consolidate plans policies
    - Each table will have only one SELECT policy for authenticated users

  ## Security
    - Maintains existing access patterns
    - Simplifies policy structure
    - Improves query planning
*/

-- ============================================================================
-- CONSOLIDATE REMAINING MULTIPLE PERMISSIVE POLICIES
-- ============================================================================

-- Plan features - remove admin-only policy, keep consolidated view policy
DROP POLICY IF EXISTS "Admins can manage plan features" ON plan_features;

-- Plan features - recreate admin management policies separately for INSERT, UPDATE, DELETE
CREATE POLICY "Admins can insert plan features"
  ON plan_features FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

CREATE POLICY "Admins can update plan features"
  ON plan_features FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

CREATE POLICY "Admins can delete plan features"
  ON plan_features FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin');

-- Plan pricing - remove admin-only policy, keep consolidated view policy
DROP POLICY IF EXISTS "Admins can manage plan pricing" ON plan_pricing;

-- Plan pricing - recreate admin management policies separately for INSERT, UPDATE, DELETE
CREATE POLICY "Admins can insert plan pricing"
  ON plan_pricing FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

CREATE POLICY "Admins can update plan pricing"
  ON plan_pricing FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

CREATE POLICY "Admins can delete plan pricing"
  ON plan_pricing FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin');

-- Plan sharing details - remove admin-only policy, keep consolidated view policy
DROP POLICY IF EXISTS "Admins can manage plan sharing details" ON plan_sharing_details;

-- Plan sharing details - recreate admin management policies separately for INSERT, UPDATE, DELETE
CREATE POLICY "Admins can insert plan sharing details"
  ON plan_sharing_details FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

CREATE POLICY "Admins can update plan sharing details"
  ON plan_sharing_details FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

CREATE POLICY "Admins can delete plan sharing details"
  ON plan_sharing_details FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin');

-- Plans - remove admin-only ALL policy, keep consolidated view policy
DROP POLICY IF EXISTS "Admins can manage plans" ON plans;

-- Plans - recreate admin management policies separately for INSERT, UPDATE, DELETE
CREATE POLICY "Admins can insert plans"
  ON plans FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

CREATE POLICY "Admins can update plans"
  ON plans FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

CREATE POLICY "Admins can delete plans"
  ON plans FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin');

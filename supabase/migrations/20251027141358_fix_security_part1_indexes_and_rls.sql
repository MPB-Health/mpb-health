/*
  # Fix Database Security Issues - Part 1: Indexes and Core RLS

  ## 1. Add Missing Foreign Key Indexes
    - Add index on `navigation_analytics.navigation_item_id`
    - Add index on `navigation_analytics.user_id`

  ## 2. Optimize Core RLS Policies
    - Update RLS policies to use `(SELECT auth.uid())` instead of `auth.uid()`
    - Update RLS policies to use `(SELECT auth.jwt())` instead of `auth.jwt()`
    - This prevents re-evaluation for each row and improves performance

  ## Security
    - All changes maintain existing access patterns
    - No data access changes, only performance optimizations
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_navigation_analytics_navigation_item_id 
  ON navigation_analytics(navigation_item_id);

CREATE INDEX IF NOT EXISTS idx_navigation_analytics_user_id 
  ON navigation_analytics(user_id);

-- ============================================================================
-- 2. OPTIMIZE RLS POLICIES - Core Tables
-- ============================================================================

-- Resource Library (uses is_published, not status)
DROP POLICY IF EXISTS "Anyone can view published resources" ON resource_library;
CREATE POLICY "Anyone can view published resources"
  ON resource_library FOR SELECT
  USING (is_published = true);

-- Plans table
DROP POLICY IF EXISTS "Admins can manage plans" ON plans;
CREATE POLICY "Admins can manage plans"
  ON plans FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

-- Plan features
DROP POLICY IF EXISTS "Admins can manage plan features" ON plan_features;
CREATE POLICY "Admins can manage plan features"
  ON plan_features FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

-- Plan sharing details
DROP POLICY IF EXISTS "Admins can manage plan sharing details" ON plan_sharing_details;
CREATE POLICY "Admins can manage plan sharing details"
  ON plan_sharing_details FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

-- Plan pricing
DROP POLICY IF EXISTS "Admins can manage plan pricing" ON plan_pricing;
CREATE POLICY "Admins can manage plan pricing"
  ON plan_pricing FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

-- Lead submissions
DROP POLICY IF EXISTS "Staff can update assigned leads" ON lead_submissions;
CREATE POLICY "Staff can update assigned leads"
  ON lead_submissions FOR UPDATE
  TO authenticated
  USING (assigned_to = (SELECT auth.uid()))
  WITH CHECK (assigned_to = (SELECT auth.uid()));

-- Navigation items - INSERT
DROP POLICY IF EXISTS "Only admins can insert navigation items" ON navigation_items;
CREATE POLICY "Only admins can insert navigation items"
  ON navigation_items FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

-- Navigation items - UPDATE
DROP POLICY IF EXISTS "Only admins can update navigation items" ON navigation_items;
CREATE POLICY "Only admins can update navigation items"
  ON navigation_items FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin')
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

-- Navigation items - DELETE
DROP POLICY IF EXISTS "Only admins can delete navigation items" ON navigation_items;
CREATE POLICY "Only admins can delete navigation items"
  ON navigation_items FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin');

-- User navigation preferences - SELECT
DROP POLICY IF EXISTS "Users can view own navigation preferences" ON user_navigation_preferences;
CREATE POLICY "Users can view own navigation preferences"
  ON user_navigation_preferences FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- User navigation preferences - INSERT
DROP POLICY IF EXISTS "Users can insert own navigation preferences" ON user_navigation_preferences;
CREATE POLICY "Users can insert own navigation preferences"
  ON user_navigation_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- User navigation preferences - UPDATE
DROP POLICY IF EXISTS "Users can update own navigation preferences" ON user_navigation_preferences;
CREATE POLICY "Users can update own navigation preferences"
  ON user_navigation_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- User navigation preferences - DELETE
DROP POLICY IF EXISTS "Users can delete own navigation preferences" ON user_navigation_preferences;
CREATE POLICY "Users can delete own navigation preferences"
  ON user_navigation_preferences FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Navigation analytics
DROP POLICY IF EXISTS "Admins can view all analytics" ON navigation_analytics;
CREATE POLICY "Admins can view all analytics"
  ON navigation_analytics FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin');

-- Profiles - consolidate policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Users and admins can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid()) 
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Users and admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT auth.uid()) 
    OR (SELECT auth.jwt())->>'role' = 'admin'
  )
  WITH CHECK (
    id = (SELECT auth.uid()) 
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.jwt())->>'role' = 'admin');

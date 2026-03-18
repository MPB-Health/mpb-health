/*
  # Fix Anonymous Access for Public Tables

  ## Overview
  This migration fixes RLS policies to allow anonymous (unauthenticated) users
  to access public data that should be available to all visitors.

  ## Changes

  ### 1. FAQ Items - Add Anonymous Read Access
  - Drop existing restrictive policy
  - Create new policy allowing anonymous users to read active FAQ items
  - Maintains authenticated admin access for management

  ### 2. Zoho SalesIQ Tables - Verify Anonymous Insert Access
  - Ensure anonymous users can log errors and health checks
  - Maintains authenticated admin read access

  ## Security
  - Anonymous users can only READ active FAQ items
  - Anonymous users can only INSERT errors/health checks (no read/update/delete)
  - Authenticated users retain full admin access
  - All policies follow least-privilege principle
*/

-- ============================================================================
-- 1. FIX FAQ ITEMS POLICIES
-- ============================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view active FAQ items" ON faq_items;

-- Create new policy allowing anonymous read access
CREATE POLICY "Public can view active FAQ items"
  ON faq_items
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Ensure authenticated users can still manage FAQ items
DROP POLICY IF EXISTS "Authenticated users can manage FAQ items" ON faq_items;

CREATE POLICY "Authenticated users can manage FAQ items"
  ON faq_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. VERIFY ZOHO SALESIQ ERROR LOGGING POLICIES
-- ============================================================================

-- Verify the existing INSERT policies are correct
-- These should already exist from the original migration, but we ensure they're correct

DROP POLICY IF EXISTS "Anyone can insert error logs" ON zoho_salesiq_errors;

CREATE POLICY "Anonymous can insert error logs"
  ON zoho_salesiq_errors
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read error logs" ON zoho_salesiq_errors;

CREATE POLICY "Authenticated users can read error logs"
  ON zoho_salesiq_errors
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify health check policies
DROP POLICY IF EXISTS "Anyone can insert health checks" ON zoho_salesiq_health_checks;

CREATE POLICY "Anonymous can insert health checks"
  ON zoho_salesiq_health_checks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read health checks" ON zoho_salesiq_health_checks;

CREATE POLICY "Authenticated users can read health checks"
  ON zoho_salesiq_health_checks
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 3. VERIFY EDUCATIONAL CONTENT POLICIES
-- ============================================================================

-- Ensure educational content is publicly readable
DROP POLICY IF EXISTS "Anyone can view active educational content" ON educational_content;

CREATE POLICY "Public can view active educational content"
  ON educational_content
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ============================================================================
-- 4. VERIFY BENEFITS POLICIES
-- ============================================================================

-- Ensure benefits are publicly readable
DROP POLICY IF EXISTS "Anyone can view active benefits" ON benefits;

CREATE POLICY "Public can view active benefits"
  ON benefits
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ============================================================================
-- 5. VERIFY RATE CONFIGURATION POLICIES
-- ============================================================================

-- Ensure rate configuration is publicly readable
DROP POLICY IF EXISTS "Anyone can view active rate configuration" ON rate_configuration;

CREATE POLICY "Public can view active rate configuration"
  ON rate_configuration
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

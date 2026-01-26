/*
  # Comprehensive RLS Policy Fix

  1. Problem
    - Multiple conflicting policies causing 401 errors
    - FAQ items, Zoho tracking tables blocking anonymous access
    - Dashboard unable to load due to RLS restrictions

  2. Solution
    - Drop ALL conflicting policies
    - Create clean, consolidated policies
    - Ensure anonymous users can read public data
    - Ensure anonymous users can insert logs/errors

  3. Security
    - Anonymous: Read active public content, insert logs
    - Authenticated: Full access to manage content
    - No data exposure beyond intended scope
*/

-- ============================================================================
-- 1. FAQ ITEMS - COMPREHENSIVE FIX
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can view active FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Public can view active FAQs, admins can manage" ON faq_items;
DROP POLICY IF EXISTS "Authenticated users can manage FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Allow anonymous and authenticated to view active FAQs" ON faq_items;
DROP POLICY IF EXISTS "Allow authenticated users full access to FAQs" ON faq_items;
DROP POLICY IF EXISTS "Anyone can view active FAQ items" ON faq_items;

-- Create single policy for reading active FAQs
CREATE POLICY "faq_items_public_read"
  ON faq_items
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Create single policy for authenticated management
CREATE POLICY "faq_items_authenticated_manage"
  ON faq_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. ZOHO SALESIQ ERROR LOGGING - COMPREHENSIVE FIX
-- ============================================================================

-- Drop all existing error log policies
DROP POLICY IF EXISTS "Anyone can insert error logs" ON zoho_salesiq_errors;
DROP POLICY IF EXISTS "Anonymous can insert error logs" ON zoho_salesiq_errors;
DROP POLICY IF EXISTS "Authenticated users can read error logs" ON zoho_salesiq_errors;
DROP POLICY IF EXISTS "Allow anyone to insert Zoho SalesIQ error logs" ON zoho_salesiq_errors;

-- Create clean policies for error logging
CREATE POLICY "zoho_errors_anonymous_insert"
  ON zoho_salesiq_errors
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "zoho_errors_authenticated_read"
  ON zoho_salesiq_errors
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 3. ZOHO SALESIQ HEALTH CHECKS - COMPREHENSIVE FIX
-- ============================================================================

-- Drop all existing health check policies
DROP POLICY IF EXISTS "Anyone can insert health checks" ON zoho_salesiq_health_checks;
DROP POLICY IF EXISTS "Anonymous can insert health checks" ON zoho_salesiq_health_checks;
DROP POLICY IF EXISTS "Authenticated users can read health checks" ON zoho_salesiq_health_checks;
DROP POLICY IF EXISTS "Allow anyone to insert Zoho SalesIQ health checks" ON zoho_salesiq_health_checks;

-- Create clean policies for health checks
CREATE POLICY "zoho_health_anonymous_insert"
  ON zoho_salesiq_health_checks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "zoho_health_authenticated_read"
  ON zoho_salesiq_health_checks
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 4. EDUCATIONAL CONTENT - COMPREHENSIVE FIX
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view active educational content" ON educational_content;
DROP POLICY IF EXISTS "Public can view active educational content" ON educational_content;
DROP POLICY IF EXISTS "Anyone can view published content" ON educational_content;

-- Create single policy for public reading
CREATE POLICY "educational_content_public_read"
  ON educational_content
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ============================================================================
-- 5. BENEFITS - COMPREHENSIVE FIX
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view active benefits" ON benefits;
DROP POLICY IF EXISTS "Public can view active benefits" ON benefits;

-- Create single policy for public reading
CREATE POLICY "benefits_public_read"
  ON benefits
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ============================================================================
-- 6. RATE CONFIGURATION - COMPREHENSIVE FIX
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view active rate configuration" ON rate_configuration;
DROP POLICY IF EXISTS "Public can view active rate configuration" ON rate_configuration;

-- Create single policy for public reading
CREATE POLICY "rate_config_public_read"
  ON rate_configuration
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

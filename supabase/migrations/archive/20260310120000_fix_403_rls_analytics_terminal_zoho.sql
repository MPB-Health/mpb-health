-- ============================================================================
-- Migration: Fix 403 RLS errors for analytics, terminal, and Zoho tables
-- Description:
--   1. page_views: Allow anon INSERT (anonymous tracking); update SELECT to use current_user_has_admin_access
--   2. analytics_sessions: Update SELECT to use current_user_has_admin_access
--   3. advisor_terminal_sessions: Add authenticated INSERT/UPDATE for own sessions
--   4. zoho_salesiq_errors: Add SELECT policy for admins
-- ============================================================================

BEGIN;
-- ============================================================================
-- 1. PAGE_VIEWS - Allow anon insert + fix admin SELECT
-- ============================================================================

-- Allow anon to insert (session tracking for anonymous visitors)
DROP POLICY IF EXISTS "Authenticated can insert page views" ON public.page_views;
CREATE POLICY "Analytics can insert page views" ON public.page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));
-- Update SELECT to use universal admin helper (user_roles + profiles)
DROP POLICY IF EXISTS "Admins can view page views" ON public.page_views;
DROP POLICY IF EXISTS "Authenticated users can view page views" ON public.page_views;
CREATE POLICY "Admins can view page views" ON public.page_views
  FOR SELECT TO authenticated
  USING (public.current_user_has_admin_access());
-- ============================================================================
-- 2. ANALYTICS_SESSIONS - Fix admin SELECT
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view analytics_sessions" ON public.analytics_sessions;
CREATE POLICY "Admins can view analytics_sessions" ON public.analytics_sessions
  FOR SELECT TO authenticated
  USING (public.current_user_has_admin_access());
-- ============================================================================
-- 3. ADVISOR_TERMINAL_SESSIONS - Add authenticated INSERT/UPDATE for own sessions
-- ============================================================================

-- Users can insert their own sessions (TerminalContext creates session on load)
CREATE POLICY "Users can insert own sessions" ON public.advisor_terminal_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
-- Users can update their own sessions (last_activity_at, total_commands)
CREATE POLICY "Users can update own sessions" ON public.advisor_terminal_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Ensure SELECT exists for own sessions (may already exist from original migration)
DROP POLICY IF EXISTS "Users view own sessions" ON public.advisor_terminal_sessions;
CREATE POLICY "Users view own sessions" ON public.advisor_terminal_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
-- ============================================================================
-- 4. ZOHO_SALESIQ_ERRORS - Add admin SELECT
-- ============================================================================

CREATE POLICY "Admins can view zoho errors" ON public.zoho_salesiq_errors
  FOR SELECT TO authenticated
  USING (public.current_user_has_admin_access());
COMMIT;

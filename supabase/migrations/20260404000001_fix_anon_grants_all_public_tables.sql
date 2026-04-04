-- ============================================================================
-- Fix anon privileges on all remaining public-facing tables
--
-- Root cause: Migration 20260227000000_security_hardening_soc2_hipaa ran
--   REVOKE ALL ON <table> FROM anon
-- on every public table. Subsequent migrations added RLS INSERT policies
-- for anon but never restored the table-level GRANT. Without the GRANT,
-- PostgREST returns 42501 even when a permissive RLS policy exists.
--
-- The lead_submissions table was fixed in 20260404000000. This migration
-- fixes the remaining public-facing tables.
-- ============================================================================


-- ============================================================================
-- 1. onboarding_responses (plan finder / quick start flow)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can insert onboarding responses" ON public.onboarding_responses;
CREATE POLICY "Anyone can insert onboarding responses" ON public.onboarding_responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.onboarding_responses TO anon;


-- ============================================================================
-- 2. newsletter_subscribers (public subscribe form)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.newsletter_subscribers TO anon;


-- ============================================================================
-- 3. analytics_events (anonymous visitor analytics)
-- ============================================================================

DROP POLICY IF EXISTS "Analytics can insert events" ON public.analytics_events;
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.analytics_events TO anon;


-- ============================================================================
-- 4. analytics_sessions (anonymous session tracking)
-- ============================================================================

DROP POLICY IF EXISTS "Analytics can insert sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Anyone can insert analytics sessions" ON public.analytics_sessions;
CREATE POLICY "Anyone can insert analytics sessions" ON public.analytics_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.analytics_sessions TO anon;


-- ============================================================================
-- 5. plan_selections (anonymous plan browsing tracking)
-- ============================================================================

DROP POLICY IF EXISTS "Allow anonymous insert on plan_selections" ON public.plan_selections;
CREATE POLICY "Allow anonymous insert on plan_selections" ON public.plan_selections
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.plan_selections TO anon;


-- ============================================================================
-- 6. rate_calculator_views (anonymous rate calculator tracking)
-- ============================================================================

DROP POLICY IF EXISTS "Allow anonymous insert on rate_calculator_views" ON public.rate_calculator_views;
CREATE POLICY "Allow anonymous insert on rate_calculator_views" ON public.rate_calculator_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.rate_calculator_views TO anon;


-- ============================================================================
-- 7. page_views (anonymous page view tracking)
-- ============================================================================

DROP POLICY IF EXISTS "Analytics can insert page views" ON public.page_views;
CREATE POLICY "Analytics can insert page views" ON public.page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.page_views TO anon;


-- ============================================================================
-- 8. lead_routing_logs (public form routing)
-- ============================================================================

DROP POLICY IF EXISTS "Anon or authenticated can insert routing logs" ON public.lead_routing_logs;
CREATE POLICY "Anon or authenticated can insert routing logs" ON public.lead_routing_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.lead_routing_logs TO anon;


-- ============================================================================
-- 9. zoho_salesiq_errors (widget error logging)
-- ============================================================================

DROP POLICY IF EXISTS "zoho_errors_anonymous_insert" ON public.zoho_salesiq_errors;
CREATE POLICY "zoho_errors_anonymous_insert" ON public.zoho_salesiq_errors
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.zoho_salesiq_errors TO anon;

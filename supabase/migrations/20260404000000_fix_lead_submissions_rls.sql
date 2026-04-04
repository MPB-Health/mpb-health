-- ============================================================================
-- Fix anon privileges on all public-facing tables
--
-- Root cause: Migration 20260227000000_security_hardening_soc2_hipaa ran
--   REVOKE ALL ON <table> FROM anon
-- on every public table. Subsequent migrations added RLS INSERT policies
-- for anon but never restored the table-level GRANT. Without the GRANT,
-- PostgREST returns 42501 even when a permissive RLS policy exists.
--
-- This migration restores GRANTs and ensures RLS policies exist for every
-- table the public website writes to as an anonymous visitor.
-- ============================================================================


-- ============================================================================
-- 1. lead_submissions (quick quote, lead forms, hero calculator)
-- ============================================================================

ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.lead_submissions;
CREATE POLICY "Anyone can insert lead submissions" ON public.lead_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "lead_submissions_anon_select" ON public.lead_submissions;
DROP POLICY IF EXISTS "zoho_lead_submissions_anon_select" ON public.lead_submissions;
CREATE POLICY "lead_submissions_anon_select" ON public.lead_submissions
  FOR SELECT TO anon
  USING (created_at > (now() - interval '5 seconds'));

DROP POLICY IF EXISTS "Admins can view all lead submissions" ON public.lead_submissions;
CREATE POLICY "Admins can view all lead submissions" ON public.lead_submissions
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_admin_access()
    OR public.current_user_has_super_admin_access()
  );

DROP POLICY IF EXISTS "Admins can update lead submissions" ON public.lead_submissions;
CREATE POLICY "Admins can update lead submissions" ON public.lead_submissions
  FOR UPDATE TO authenticated
  USING (
    public.current_user_has_admin_access()
    OR public.current_user_has_super_admin_access()
  )
  WITH CHECK (
    public.current_user_has_admin_access()
    OR public.current_user_has_super_admin_access()
  );

GRANT SELECT, INSERT ON public.lead_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_submissions TO authenticated;
GRANT ALL ON public.lead_submissions TO service_role;


-- ============================================================================
-- 2. onboarding_responses (plan finder / quick start flow)
-- ============================================================================

ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert onboarding responses" ON public.onboarding_responses;
CREATE POLICY "Anyone can insert onboarding responses" ON public.onboarding_responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.onboarding_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_responses TO authenticated;
GRANT ALL ON public.onboarding_responses TO service_role;


-- ============================================================================
-- 3. newsletter_subscribers (public subscribe form)
-- ============================================================================

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;


-- ============================================================================
-- 4. analytics_events (anonymous visitor analytics)
-- ============================================================================

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Analytics can insert events" ON public.analytics_events;
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.analytics_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;


-- ============================================================================
-- 5. analytics_sessions (anonymous session tracking)
-- ============================================================================

ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Analytics can insert sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Anyone can insert analytics sessions" ON public.analytics_sessions;
CREATE POLICY "Anyone can insert analytics sessions" ON public.analytics_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.analytics_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_sessions TO authenticated;
GRANT ALL ON public.analytics_sessions TO service_role;


-- ============================================================================
-- 6. plan_selections (anonymous plan browsing tracking)
-- ============================================================================

ALTER TABLE public.plan_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert on plan_selections" ON public.plan_selections;
CREATE POLICY "Allow anonymous insert on plan_selections" ON public.plan_selections
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.plan_selections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_selections TO authenticated;
GRANT ALL ON public.plan_selections TO service_role;


-- ============================================================================
-- 7. rate_calculator_views (anonymous rate calculator tracking)
-- ============================================================================

ALTER TABLE public.rate_calculator_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous insert on rate_calculator_views" ON public.rate_calculator_views;
CREATE POLICY "Allow anonymous insert on rate_calculator_views" ON public.rate_calculator_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.rate_calculator_views TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_calculator_views TO authenticated;
GRANT ALL ON public.rate_calculator_views TO service_role;


-- ============================================================================
-- 8. page_views (anonymous page view tracking)
-- ============================================================================

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Analytics can insert page views" ON public.page_views;
CREATE POLICY "Analytics can insert page views" ON public.page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.page_views TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;


-- ============================================================================
-- 9. lead_routing_logs (public form routing)
-- ============================================================================

ALTER TABLE public.lead_routing_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon or authenticated can insert routing logs" ON public.lead_routing_logs;
CREATE POLICY "Anon or authenticated can insert routing logs" ON public.lead_routing_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.lead_routing_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_routing_logs TO authenticated;
GRANT ALL ON public.lead_routing_logs TO service_role;


-- ============================================================================
-- 10. zoho_salesiq_errors (widget error logging)
-- ============================================================================

ALTER TABLE public.zoho_salesiq_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "zoho_errors_anonymous_insert" ON public.zoho_salesiq_errors;
CREATE POLICY "zoho_errors_anonymous_insert" ON public.zoho_salesiq_errors
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

GRANT INSERT ON public.zoho_salesiq_errors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zoho_salesiq_errors TO authenticated;
GRANT ALL ON public.zoho_salesiq_errors TO service_role;

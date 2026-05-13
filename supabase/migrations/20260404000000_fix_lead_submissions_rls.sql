-- ============================================================================
-- Fix RLS policies on lead_submissions after zoho_lead_submissions rename
--
-- Problem: Anonymous INSERT via the public website returns 42501
--   "new row violates row-level security policy for table lead_submissions"
--
-- Root cause: The rename migration (20260403100000) dropped the old
-- lead_submissions table with CASCADE, which removed any policies that
-- referenced it.  The INSERT policy on zoho_lead_submissions should have
-- survived the rename, but the production database's policy state does not
-- match expectations.  This migration re-creates all required policies
-- idempotently so anonymous visitors can submit lead forms.
-- ============================================================================

-- 1. Ensure RLS is enabled (should already be, but be safe)
ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;
-- 2. INSERT policy: anonymous visitors + authenticated users can submit leads
DROP POLICY IF EXISTS "Anyone can insert lead submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.lead_submissions;
CREATE POLICY "Anyone can insert lead submissions" ON public.lead_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
-- 3. SELECT policy: anon can only read rows created in the last 5 seconds
--    (needed for .insert().select().single() pattern used by the website)
DROP POLICY IF EXISTS "lead_submissions_anon_select" ON public.lead_submissions;
DROP POLICY IF EXISTS "zoho_lead_submissions_anon_select" ON public.lead_submissions;
CREATE POLICY "lead_submissions_anon_select" ON public.lead_submissions
  FOR SELECT TO anon
  USING (created_at > (now() - interval '5 seconds'));
-- 4. Authenticated admin SELECT (may already exist under various names)
DROP POLICY IF EXISTS "Admins can view all lead submissions" ON public.lead_submissions;
CREATE POLICY "Admins can view all lead submissions" ON public.lead_submissions
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_admin_access()
    OR public.current_user_has_super_admin_access()
  );
-- 5. Authenticated admin UPDATE
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
-- 6. Ensure GRANT permissions are in place for PostgREST
GRANT SELECT, INSERT ON public.lead_submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_submissions TO authenticated;
GRANT ALL ON public.lead_submissions TO service_role;

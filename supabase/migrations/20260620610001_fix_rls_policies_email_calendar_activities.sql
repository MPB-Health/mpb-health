-- Fix misconfigured RLS policies across email, calendar, and activity tables.
-- Several policies were stored as SELECT instead of the intended command type,
-- and crm_email_drafts/signatures were missing INSERT/UPDATE/DELETE policies entirely.

-- ============================================================================
-- crm_email_drafts: add INSERT, UPDATE, DELETE (only SELECT existed)
-- ============================================================================

CREATE POLICY "Users can insert their own drafts"
  ON public.crm_email_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own drafts"
  ON public.crm_email_drafts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own drafts"
  ON public.crm_email_drafts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- calendar_events: drop misconfigured SELECT policies, recreate as proper types
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated delete calendar_events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar_events" ON public.calendar_events;

CREATE POLICY "Users can insert calendar_events"
  ON public.calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own calendar_events"
  ON public.calendar_events
  FOR UPDATE
  TO authenticated
  USING ((assigned_to = auth.uid()) OR (created_by = auth.uid()))
  WITH CHECK ((assigned_to = auth.uid()) OR (created_by = auth.uid()));

CREATE POLICY "Users can delete own calendar_events"
  ON public.calendar_events
  FOR DELETE
  TO authenticated
  USING ((assigned_to = auth.uid()) OR (created_by = auth.uid()));

-- ============================================================================
-- crm_activities: drop misconfigured delete policy (stored as SELECT), recreate
-- ============================================================================

DROP POLICY IF EXISTS "crm_activities_delete" ON public.crm_activities;

CREATE POLICY "crm_activities_delete"
  ON public.crm_activities
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ============================================================================
-- crm_email_signatures: add INSERT, UPDATE, DELETE (only SELECT existed)
-- ============================================================================

CREATE POLICY "Users can insert their own signatures"
  ON public.crm_email_signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own signatures"
  ON public.crm_email_signatures
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own signatures"
  ON public.crm_email_signatures
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- crm_email_threads: drop misconfigured "manage" policy, add proper UPDATE
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage org threads" ON public.crm_email_threads;

CREATE POLICY "Users can update org threads"
  ON public.crm_email_threads
  FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid()));

-- ============================================================================
-- crm_email_log: add UPDATE policy for star/archive/label operations
-- ============================================================================

CREATE POLICY "Org members can update email logs"
  ON public.crm_email_log
  FOR UPDATE
  TO authenticated
  USING ((org_id IS NOT NULL) AND is_org_member(org_id))
  WITH CHECK ((org_id IS NOT NULL) AND is_org_member(org_id));

-- ============================================================================
-- lead_activities: drop misconfigured admin policies stored as SELECT
-- ============================================================================

DROP POLICY IF EXISTS "Admins can delete lead activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Admins can update lead activities" ON public.lead_activities;

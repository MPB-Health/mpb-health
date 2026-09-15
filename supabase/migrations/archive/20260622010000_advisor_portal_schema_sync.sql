-- Advisor portal: align RLS + RPC with advisor-core / advisor-portal expectations

-- ============================================================================
-- 1. member_profiles — advisors read members assigned to them (auth UUID)
-- ============================================================================

DROP POLICY IF EXISTS "advisor_assigned_members_select" ON public.member_profiles;
CREATE POLICY "advisor_assigned_members_select" ON public.member_profiles
  FOR SELECT TO authenticated
  USING (
    assigned_advisor_id = auth.uid()
    AND public.current_user_has_advisor_or_admin_access()
  );

COMMENT ON POLICY "advisor_assigned_members_select" ON public.member_profiles IS
  'Assigned advisors can read member_profiles where assigned_advisor_id = auth.uid().';

-- ============================================================================
-- 2. commission_records / commission_payouts — advisor self + org access
--    (user_has_org_access includes advisor_profiles.org_id without org_memberships)
-- ============================================================================

DROP POLICY IF EXISTS "commission_records_select" ON public.commission_records;
CREATE POLICY "commission_records_select" ON public.commission_records
  FOR SELECT TO authenticated
  USING (
    advisor_id = auth.uid()
    OR public.user_has_org_access(org_id)
    OR public.is_org_member(org_id)
  );

DROP POLICY IF EXISTS "commission_payouts_select" ON public.commission_payouts;
CREATE POLICY "commission_payouts_select" ON public.commission_payouts
  FOR SELECT TO authenticated
  USING (
    advisor_id = auth.uid()
    OR public.user_has_org_access(org_id)
    OR public.is_org_member(org_id)
  );

-- ============================================================================
-- 3. form_submissions — advisors insert their own submission rows
-- ============================================================================

DROP POLICY IF EXISTS "form_submissions_advisor_insert" ON public.form_submissions;
CREATE POLICY "form_submissions_advisor_insert" ON public.form_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    advisor_id = auth.uid()
    AND public.current_user_has_advisor_or_admin_access()
  );

DROP POLICY IF EXISTS "form_submissions_advisor_update" ON public.form_submissions;
CREATE POLICY "form_submissions_advisor_update" ON public.form_submissions
  FOR UPDATE TO authenticated
  USING (
    advisor_id = auth.uid()
    AND public.current_user_has_advisor_or_admin_access()
  )
  WITH CHECK (
    advisor_id = auth.uid()
    AND public.current_user_has_advisor_or_admin_access()
  );

-- ============================================================================
-- 4. Missing RPC referenced by FormsService.recordSubmission()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_form_submission_count(form_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- No submission_count column on cognito_forms today; keep RPC for API compatibility.
  NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_form_submission_count(uuid) TO authenticated;

COMMENT ON FUNCTION public.increment_form_submission_count(uuid) IS
  'No-op placeholder; cognito_forms has no submission_count column. Called after form_submissions insert.';

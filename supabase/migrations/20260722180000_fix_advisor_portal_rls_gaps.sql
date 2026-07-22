-- Fix advisor portal console errors:
-- 1) advisor_content_views: INSERT policy missing (403 on mark-as-read)
-- 2) lead_submissions: assigned-advisor SELECT/UPDATE policies missing
--    (migration 20260621000000 was not present on live)

BEGIN;

-- ---------------------------------------------------------------------------
-- advisor_content_views — advisors may record their own views
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Advisors can insert their own views" ON public.advisor_content_views;
CREATE POLICY "Advisors can insert their own views"
  ON public.advisor_content_views
  FOR INSERT
  TO authenticated
  WITH CHECK (
    advisor_id = auth.uid()
    AND public.current_user_has_advisor_or_admin_access()
  );

-- ---------------------------------------------------------------------------
-- lead_submissions — advisors may read/update leads assigned to them
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.advisor_can_access_lead(p_lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lead_submissions ls
    WHERE ls.id = p_lead_id
      AND ls.assigned_to = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.advisor_can_access_lead(uuid) TO authenticated;

DROP POLICY IF EXISTS "advisor_assigned_leads_select" ON public.lead_submissions;
CREATE POLICY "advisor_assigned_leads_select"
  ON public.lead_submissions
  FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    AND public.current_user_has_advisor_or_admin_access()
  );

DROP POLICY IF EXISTS "advisor_assigned_leads_update" ON public.lead_submissions;
CREATE POLICY "advisor_assigned_leads_update"
  ON public.lead_submissions
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    AND public.current_user_has_advisor_or_admin_access()
  )
  WITH CHECK (
    assigned_to = auth.uid()
    AND public.current_user_has_advisor_or_admin_access()
  );

COMMIT;

-- ============================================================================
-- Add missing DELETE policy for lead_submissions
--
-- Root cause: the 20260404000000 migration created INSERT, SELECT, and UPDATE
-- RLS policies but omitted a FOR DELETE policy. The table-level GRANT gives
-- DELETE to authenticated, but without a permissive RLS policy PostgREST
-- silently returns 0 rows affected instead of an error.
-- ============================================================================

DROP POLICY IF EXISTS "Admins can delete lead submissions" ON public.lead_submissions;
CREATE POLICY "Admins can delete lead submissions" ON public.lead_submissions
  FOR DELETE TO authenticated
  USING (
    public.current_user_has_admin_access()
    OR public.current_user_has_super_admin_access()
  );

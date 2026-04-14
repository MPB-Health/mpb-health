-- ============================================================================
-- system_settings: reliable admin writes for UPSERT (INSERT + UPDATE)
--
-- Some environments still had only SELECT covered by legacy policy names, or
-- FOR ALL policies can be finicky with PostgREST upserts. Mirror the pattern
-- used on integrations / site_settings: explicit INSERT & UPDATE policies
-- using SECURITY DEFINER current_user_has_admin_access().
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;

CREATE POLICY "Admins can insert system settings"
  ON public.system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_has_admin_access());

CREATE POLICY "Admins can update system settings"
  ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

CREATE POLICY "Admins can delete system settings"
  ON public.system_settings
  FOR DELETE
  TO authenticated
  USING (public.current_user_has_admin_access());

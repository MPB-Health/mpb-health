-- ============================================================================
-- Migration: Fix geo_state_settings UPDATE 403 - "Failed to update state settings"
-- Description: Update RLS policy to use current_user_has_admin_access() so
--   admins via user_roles (super_admin, admin) can update state settings.
-- ============================================================================

BEGIN;
DROP POLICY IF EXISTS "Admins can manage geo state settings" ON public.geo_state_settings;
CREATE POLICY "Admins can manage geo state settings" ON public.geo_state_settings
  FOR ALL TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());
COMMIT;

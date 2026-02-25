-- ============================================================================
-- Migration: Fix Video Manager RLS and Settings
-- Description:
--   1. Allow anon users to read non-sensitive settings (so public website shows videos)
--   2. Update system_settings RLS to allow user_roles.super_admin (in addition to profiles)
--   3. Update advisor_videos RLS to include super_admin for management
-- ============================================================================

-- ============================================================================
-- PART 0: system_settings - Allow anon to read non-sensitive (for public website)
-- ============================================================================

DROP POLICY IF EXISTS "Anon can view non-sensitive settings" ON public.system_settings;
CREATE POLICY "Anon can view non-sensitive settings"
  ON public.system_settings
  FOR SELECT
  TO anon
  USING (is_sensitive = false);

-- ============================================================================
-- PART 1: system_settings - Allow user_roles super_admin to manage
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage settings" ON public.system_settings;

CREATE POLICY "Admins can manage settings"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'superadmin')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'superadmin')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Also update the "Admins can view all settings" policy for consistency
DROP POLICY IF EXISTS "Admins can view all settings" ON public.system_settings;

CREATE POLICY "Admins can view all settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'superadmin')
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- PART 2: advisor_videos - Add super_admin to management policy
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage videos" ON public.advisor_videos;

CREATE POLICY "Admins can manage videos"
  ON public.advisor_videos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'staff')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'staff')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'superadmin')
    )
  );

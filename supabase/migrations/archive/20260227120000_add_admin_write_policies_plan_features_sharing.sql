-- ============================================================================
-- Add missing INSERT / UPDATE / DELETE RLS policies for plan_features and
-- plan_sharing_details tables.  These tables currently only have SELECT
-- policies, which means admin writes are silently blocked by RLS.
-- ============================================================================

-- --------------------------------------------------------------------------
-- plan_features — admin write policies
-- --------------------------------------------------------------------------
DO $$
BEGIN
  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plan_features'
      AND policyname = 'Admins can insert plan features'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Admins can insert plan features" ON public.plan_features FOR INSERT TO authenticated WITH CHECK (current_user_has_admin_access() OR current_user_has_super_admin_access())'
    );
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plan_features'
      AND policyname = 'Admins can update plan features'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Admins can update plan features" ON public.plan_features FOR UPDATE TO authenticated USING (current_user_has_admin_access() OR current_user_has_super_admin_access()) WITH CHECK (current_user_has_admin_access() OR current_user_has_super_admin_access())'
    );
  END IF;

  -- DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plan_features'
      AND policyname = 'Admins can delete plan features'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Admins can delete plan features" ON public.plan_features FOR DELETE TO authenticated USING (current_user_has_admin_access() OR current_user_has_super_admin_access())'
    );
  END IF;
END
$$;
-- --------------------------------------------------------------------------
-- plan_sharing_details — admin write policies
-- --------------------------------------------------------------------------
DO $$
BEGIN
  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plan_sharing_details'
      AND policyname = 'Admins can insert plan sharing details'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Admins can insert plan sharing details" ON public.plan_sharing_details FOR INSERT TO authenticated WITH CHECK (current_user_has_admin_access() OR current_user_has_super_admin_access())'
    );
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plan_sharing_details'
      AND policyname = 'Admins can update plan sharing details'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Admins can update plan sharing details" ON public.plan_sharing_details FOR UPDATE TO authenticated USING (current_user_has_admin_access() OR current_user_has_super_admin_access()) WITH CHECK (current_user_has_admin_access() OR current_user_has_super_admin_access())'
    );
  END IF;

  -- DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plan_sharing_details'
      AND policyname = 'Admins can delete plan sharing details'
  ) THEN
    EXECUTE format(
      'CREATE POLICY "Admins can delete plan sharing details" ON public.plan_sharing_details FOR DELETE TO authenticated USING (current_user_has_admin_access() OR current_user_has_super_admin_access())'
    );
  END IF;
END
$$;

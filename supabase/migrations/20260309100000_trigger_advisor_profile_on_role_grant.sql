-- ============================================================================
-- Auto-create advisor_profiles when user is granted advisor/admin/super_admin role
-- ============================================================================
-- Prevents login loop for users who get role via user_roles but have no
-- advisor_profiles row. Runs on INSERT to user_roles.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_advisor_profile_on_role_grant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only for advisor-portal roles
  IF NEW.role IN ('advisor', 'super_admin', 'admin') THEN
    INSERT INTO advisor_profiles (
      id,
      first_name,
      last_name,
      email,
      phone,
      specialization,
      status,
      onboarding_completed,
      onboarding_completed_at,
      metadata,
      created_at,
      updated_at
    )
    SELECT
      u.id,
      COALESCE(
        (u.raw_user_meta_data->>'first_name')::text,
        split_part(COALESCE((u.raw_user_meta_data->>'full_name')::text, u.email), ' ', 1),
        'Advisor'
      ),
      COALESCE(
        (u.raw_user_meta_data->>'last_name')::text,
        CASE
          WHEN (u.raw_user_meta_data->>'full_name')::text IS NOT NULL
            AND position(' ' in (u.raw_user_meta_data->>'full_name')::text) > 0
          THEN trim(substring((u.raw_user_meta_data->>'full_name')::text from position(' ' in (u.raw_user_meta_data->>'full_name')::text) + 1))
          ELSE ''
        END
      ),
      COALESCE(u.email, ''),
      COALESCE((u.raw_user_meta_data->>'phone')::text, ''),
      'Health Share',
      'active',
      true,
      now(),
      jsonb_build_object('provisioned_by', 'trigger_ensure_advisor_profile_on_role_grant', 'source', 'user_roles_insert'),
      now(),
      now()
    FROM auth.users u
    WHERE u.id = NEW.user_id
      AND NOT EXISTS (SELECT 1 FROM advisor_profiles ap WHERE ap.id = NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_advisor_profile_on_role_grant ON user_roles;
CREATE TRIGGER trg_ensure_advisor_profile_on_role_grant
  AFTER INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_advisor_profile_on_role_grant();

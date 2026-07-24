-- Ensure designated super admins can assign HR Staff Admins (staff_hr),
-- and that assigning staff_hr also provisions Staff Hub identity rows.

-- 1) Lock in super_admin for vrt@ and system@
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT u.id, 'super_admin', u.id
FROM auth.users u
WHERE lower(u.email) IN ('vrt@mympb.com', 'system@mympb.com')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.admin_users (id, email, role, status, first_name, last_name)
SELECT
  u.id,
  u.email,
  'super_admin',
  'active',
  COALESCE(au.first_name, split_part(u.email, '@', 1)),
  COALESCE(au.last_name, '')
FROM auth.users u
LEFT JOIN public.admin_users au ON au.id = u.id
WHERE lower(u.email) IN ('vrt@mympb.com', 'system@mympb.com')
ON CONFLICT (id) DO UPDATE
  SET role = 'super_admin',
      status = 'active',
      email = EXCLUDED.email;

-- 2) assign_user_role: keep super_admin-only gate; provision Staff Hub on staff_hr
CREATE OR REPLACE FUNCTION public.assign_user_role(
    target_user_id UUID,
    target_role TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_row user_roles%ROWTYPE;
    default_org UUID := '00000000-0000-4000-a000-000000000001';
    mpb_org UUID;
    already_had boolean := false;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: super_admin role required';
    END IF;

    IF target_role NOT IN (
      'super_admin', 'admin', 'advisor', 'member', 'crm_user', 'concierge', 'staff_hr'
    ) THEN
        RAISE EXCEPTION 'Invalid role: %', target_role;
    END IF;

    SELECT id INTO mpb_org FROM public.organizations WHERE slug = 'mpb-health' LIMIT 1;
    IF mpb_org IS NULL THEN
      mpb_org := default_org;
    END IF;

    INSERT INTO user_roles (user_id, role, granted_by)
    VALUES (target_user_id, target_role, auth.uid())
    ON CONFLICT (user_id, role) DO NOTHING
    RETURNING * INTO new_row;

    IF new_row.id IS NULL THEN
        already_had := true;
        SELECT * INTO new_row
        FROM user_roles
        WHERE user_id = target_user_id AND role = target_role
        LIMIT 1;
    END IF;

    IF target_role = 'crm_user' THEN
        INSERT INTO org_memberships (user_id, org_id, role, status, joined_at)
        VALUES (target_user_id, default_org, 'member', 'active', now())
        ON CONFLICT (user_id, org_id)
        DO UPDATE SET status = 'active', joined_at = COALESCE(org_memberships.joined_at, now());
    END IF;

    IF target_role IN ('admin', 'super_admin') THEN
        INSERT INTO admin_users (id, email, role, status)
        SELECT target_user_id, u.email, target_role, 'active'
        FROM auth.users u WHERE u.id = target_user_id
        ON CONFLICT (id)
        DO UPDATE SET status = 'active', role = EXCLUDED.role;
    END IF;

    -- HR Staff Admin: keep/create Staff Hub identity + roster profile
    IF target_role = 'staff_hr' THEN
        INSERT INTO admin_users (id, email, role, status, first_name, last_name)
        SELECT
          target_user_id,
          u.email,
          COALESCE(NULLIF(au.role, ''), 'staff'),
          'active',
          COALESCE(au.first_name, split_part(u.email, '@', 1)),
          COALESCE(au.last_name, '')
        FROM auth.users u
        LEFT JOIN public.admin_users au ON au.id = u.id
        WHERE u.id = target_user_id
        ON CONFLICT (id) DO UPDATE
          SET status = 'active',
              email = EXCLUDED.email;

        INSERT INTO public.staff_profiles (
          org_id, user_id, display_name, email, title, is_active
        )
        SELECT
          mpb_org,
          au.id,
          COALESCE(
            NULLIF(trim(concat_ws(' ', au.first_name, au.last_name)), ''),
            split_part(au.email, '@', 1)
          ),
          lower(au.email),
          au.title,
          true
        FROM public.admin_users au
        WHERE au.id = target_user_id
        ON CONFLICT (org_id, user_id) DO UPDATE
          SET is_active = true,
              email = EXCLUDED.email,
              display_name = CASE
                WHEN staff_profiles.display_name = '' THEN EXCLUDED.display_name
                ELSE staff_profiles.display_name
              END;
    END IF;

    IF already_had THEN
        RETURN jsonb_build_object(
          'success', true,
          'message', 'Role already assigned',
          'id', new_row.id,
          'user_id', new_row.user_id,
          'role', new_row.role::text
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'id', new_row.id,
        'user_id', new_row.user_id,
        'role', new_row.role::text,
        'created_at', new_row.created_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.assign_user_role(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_user_role(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.assign_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_role(uuid, text) TO service_role;

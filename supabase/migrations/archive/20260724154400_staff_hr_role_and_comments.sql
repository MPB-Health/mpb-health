-- Staff HR role as source of truth for time-off review (after enum value exists).
-- user_roles.role is text with CHECK; also keep user_role_type enum in sync for casts.

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role = ANY (ARRAY[
    'super_admin'::text,
    'admin'::text,
    'advisor'::text,
    'member'::text,
    'crm_user'::text,
    'concierge'::text,
    'staff_hr'::text
  ]));

CREATE OR REPLACE FUNCTION public.is_staff_hr()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'staff_hr'
  );
$$;

REVOKE ALL ON FUNCTION public.is_staff_hr() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_hr() TO authenticated;

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

    INSERT INTO user_roles (user_id, role, granted_by)
    VALUES (target_user_id, target_role, auth.uid())
    ON CONFLICT (user_id, role) DO NOTHING
    RETURNING * INTO new_row;

    IF new_row.id IS NULL THEN
        IF target_role = 'crm_user' THEN
            INSERT INTO org_memberships (user_id, org_id, role, status, joined_at)
            VALUES (target_user_id, default_org, 'member', 'active', now())
            ON CONFLICT (user_id, org_id)
            DO UPDATE SET status = 'active', joined_at = COALESCE(org_memberships.joined_at, now());
        END IF;
        RETURN jsonb_build_object('success', true, 'message', 'Role already assigned');
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
        DO UPDATE SET status = 'active';
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

INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT u.id, 'staff_hr', u.id
FROM auth.users u
WHERE lower(u.email) IN (
  'accounting@mympb.com',
  'catherine@mympb.com',
  'dayra@mympb.com'
)
ON CONFLICT (user_id, role) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_staff_time_request_events_action
  ON public.staff_time_request_events (request_id, action, created_at DESC);

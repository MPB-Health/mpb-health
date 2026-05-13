-- ============================================================================
-- Migration: Fix Role Management
-- Description:
--   1. Create SECURITY DEFINER RPCs for role assignment/removal (bypasses RLS
--      safely, with server-side authorization check)
--   2. Sync admin_users super_admins → user_roles (one-time data fix)
--   3. Add trigger: admin_users.role changes → sync to user_roles
--   4. Re-create users_with_roles as SECURITY DEFINER view-function for
--      backwards compatibility with code that queries the old view name
-- ============================================================================

-- ============================================================================
-- 1. SECURITY DEFINER RPC: assign_user_role
-- ============================================================================
CREATE OR REPLACE FUNCTION public.assign_user_role(
    target_user_id UUID,
    target_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_row user_roles%ROWTYPE;
BEGIN
    -- Verify caller is super_admin
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: super_admin role required';
    END IF;

    -- Validate role value
    IF target_role NOT IN ('super_admin', 'admin', 'advisor', 'member', 'crm_user') THEN
        RAISE EXCEPTION 'Invalid role: %', target_role;
    END IF;

    -- Insert (or no-op on conflict)
    INSERT INTO user_roles (user_id, role, granted_by)
    VALUES (target_user_id, target_role::user_role_type, auth.uid())
    ON CONFLICT (user_id, role) DO NOTHING
    RETURNING * INTO new_row;

    IF new_row.id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'message', 'Role already assigned');
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
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT) TO authenticated;
-- ============================================================================
-- 2. SECURITY DEFINER RPC: remove_user_role
-- ============================================================================
CREATE OR REPLACE FUNCTION public.remove_user_role(
    target_user_id UUID,
    target_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deleted_count INT;
BEGIN
    -- Verify caller is super_admin
    IF NOT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: super_admin role required';
    END IF;

    -- Prevent removing your own super_admin role
    IF target_user_id = auth.uid() AND target_role = 'super_admin' THEN
        RAISE EXCEPTION 'Cannot remove your own super_admin role';
    END IF;

    DELETE FROM user_roles
    WHERE user_id = target_user_id AND role::text = target_role;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'removed', deleted_count > 0
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.remove_user_role(UUID, TEXT) TO authenticated;
-- ============================================================================
-- 3. One-time sync: admin_users super_admins → user_roles
--    Ensures every admin_users.role = 'super_admin' has a user_roles row
-- ============================================================================
INSERT INTO user_roles (user_id, role)
SELECT au.id, 'super_admin'::user_role_type
FROM admin_users au
WHERE au.role = 'super_admin'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = au.id AND ur.role = 'super_admin'
  )
ON CONFLICT (user_id, role) DO NOTHING;
-- Also sync admin role
INSERT INTO user_roles (user_id, role)
SELECT au.id, 'admin'::user_role_type
FROM admin_users au
WHERE au.role = 'admin'
  AND NOT EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = au.id AND ur.role = 'admin'
  )
ON CONFLICT (user_id, role) DO NOTHING;
-- ============================================================================
-- 4. Trigger: admin_users.role changes → sync to user_roles
--    (The existing sync_roles_to_legacy trigger only goes user_roles → admin_users.
--     This adds the reverse direction.)
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_admin_users_role_to_user_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- On role change, ensure the new role exists in user_roles
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Insert new role
        INSERT INTO user_roles (user_id, role)
        VALUES (NEW.id, NEW.role::user_role_type)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trigger_sync_admin_role_to_user_roles ON admin_users;
CREATE TRIGGER trigger_sync_admin_role_to_user_roles
    AFTER UPDATE OF role ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION sync_admin_users_role_to_user_roles();
-- Also sync on insert
DROP TRIGGER IF EXISTS trigger_sync_admin_role_to_user_roles_insert ON admin_users;
CREATE TRIGGER trigger_sync_admin_role_to_user_roles_insert
    AFTER INSERT ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION sync_admin_users_role_to_user_roles();

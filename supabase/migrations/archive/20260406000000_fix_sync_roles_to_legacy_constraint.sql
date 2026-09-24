-- ============================================================================
-- Migration: Fix sync_roles_to_legacy trigger violating admin_users_role_check
--
-- Problem: When a role is deleted from user_roles, the sync_roles_to_legacy
-- trigger fires and sets admin_users.role to the new highest role. If the
-- remaining highest role is 'advisor', 'member', or 'guest', the UPDATE
-- violates admin_users_role_check (which only allows super_admin, admin,
-- manager, staff). This causes "Failed to remove role" errors in the UI.
--
-- Fix: Only update admin_users.role when the new highest role is one of
-- the valid admin roles. Otherwise set admin_users to inactive and leave
-- its role column unchanged.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_roles_to_legacy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_uid  uuid;
    highest_role text;
    profile_role text;
BEGIN
    target_uid := COALESCE(NEW.user_id, OLD.user_id);

    SELECT
        CASE
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_uid AND role = 'super_admin') THEN 'super_admin'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_uid AND role = 'admin')       THEN 'admin'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_uid AND role = 'manager')     THEN 'manager'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_uid AND role = 'staff')       THEN 'staff'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_uid AND role = 'advisor')     THEN 'advisor'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_uid AND role = 'member')      THEN 'member'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_uid AND role = 'guest')       THEN 'guest'
            ELSE 'member'
        END
    INTO highest_role;

    profile_role := CASE highest_role
        WHEN 'super_admin' THEN 'admin'
        WHEN 'admin'       THEN 'admin'
        WHEN 'manager'     THEN 'staff'
        WHEN 'staff'       THEN 'staff'
        WHEN 'advisor'     THEN 'advisor'
        WHEN 'guest'       THEN 'guest'
        ELSE 'member'
    END;

    UPDATE profiles
    SET role = profile_role, updated_at = NOW()
    WHERE id = target_uid;

    -- Only update admin_users.role when it satisfies admin_users_role_check
    IF highest_role IN ('super_admin', 'admin', 'manager', 'staff') THEN
        UPDATE admin_users
        SET role = highest_role, updated_at = NOW()
        WHERE id = target_uid;
    ELSE
        UPDATE admin_users
        SET status = 'inactive', updated_at = NOW()
        WHERE id = target_uid;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

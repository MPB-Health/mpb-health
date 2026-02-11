-- ============================================================================
-- Migration: Unify Role Systems (Part 2 - Migrate data & create functions)
-- Description: Consolidate profiles.role, user_roles table, and admin_users.role
--              into user_roles as the single source of truth.
--              Runs after enum values are committed in Part 1.
-- ============================================================================

-- ============================================================================
-- MIGRATE EXISTING ROLES TO user_roles TABLE
-- ============================================================================

-- Migrate from profiles.role (only if not already in user_roles)
INSERT INTO user_roles (user_id, role)
SELECT
    p.id as user_id,
    CASE p.role
        WHEN 'admin' THEN 'admin'
        WHEN 'staff' THEN 'staff'
        WHEN 'advisor' THEN 'advisor'
        WHEN 'guest' THEN 'guest'
        ELSE 'member'
    END::user_role_type as role
FROM profiles p
WHERE p.role IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Migrate from admin_users.role (ensure admin portal users have correct roles)
INSERT INTO user_roles (user_id, role)
SELECT
    au.id as user_id,
    au.role::user_role_type as role
FROM admin_users au
WHERE au.role IS NOT NULL
AND au.role IN ('super_admin', 'admin', 'manager', 'staff', 'advisor', 'member', 'guest')
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = au.id
    AND ur.role::text = au.role
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- CREATE SYNC FUNCTION: user_roles -> profiles & admin_users
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_roles_to_legacy()
RETURNS TRIGGER AS $$
DECLARE
    highest_role text;
    profile_role text;
BEGIN
    -- Calculate the highest privilege role for this user
    SELECT
        CASE
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'super_admin') THEN 'super_admin'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'admin') THEN 'admin'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'manager') THEN 'manager'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'staff') THEN 'staff'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'advisor') THEN 'advisor'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'member') THEN 'member'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = COALESCE(NEW.user_id, OLD.user_id) AND role = 'guest') THEN 'guest'
            ELSE 'member'
        END
    INTO highest_role;

    -- Map to profiles.role (profiles uses: guest, member, advisor, admin, staff)
    profile_role := CASE highest_role
        WHEN 'super_admin' THEN 'admin'
        WHEN 'admin' THEN 'admin'
        WHEN 'manager' THEN 'staff'
        WHEN 'staff' THEN 'staff'
        WHEN 'advisor' THEN 'advisor'
        WHEN 'guest' THEN 'guest'
        ELSE 'member'
    END;

    -- Update profiles table
    UPDATE profiles
    SET role = profile_role, updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);

    -- Update admin_users table (only if row exists)
    UPDATE admin_users
    SET role = highest_role, updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_roles_on_insert ON user_roles;
DROP TRIGGER IF EXISTS trigger_sync_roles_on_update ON user_roles;
DROP TRIGGER IF EXISTS trigger_sync_roles_on_delete ON user_roles;

-- Create triggers for INSERT, UPDATE, DELETE
CREATE TRIGGER trigger_sync_roles_on_insert
    AFTER INSERT ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION sync_roles_to_legacy();

CREATE TRIGGER trigger_sync_roles_on_update
    AFTER UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION sync_roles_to_legacy();

CREATE TRIGGER trigger_sync_roles_on_delete
    AFTER DELETE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION sync_roles_to_legacy();

-- ============================================================================
-- UPDATE PROFILE CREATION TRIGGER
-- ============================================================================

-- Update the handle_new_user function to also create user_roles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create profile with default member role
    INSERT INTO public.profiles (id, role)
    VALUES (NEW.id, 'member')
    ON CONFLICT (id) DO NOTHING;

    -- Also create user_roles entry
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'member'::user_role_type)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE UNIFIED ROLE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.unified_user_roles AS
SELECT
    u.id as user_id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    p.role as profile_role,
    COALESCE(
        (SELECT array_agg(ur.role::text ORDER BY
            CASE ur.role
                WHEN 'super_admin' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'manager' THEN 3
                WHEN 'staff' THEN 4
                WHEN 'advisor' THEN 5
                WHEN 'member' THEN 6
                WHEN 'guest' THEN 7
            END
        ) FROM user_roles ur WHERE ur.user_id = u.id),
        ARRAY[]::text[]
    ) as roles,
    COALESCE(
        (SELECT ur.role::text FROM user_roles ur WHERE ur.user_id = u.id
         ORDER BY
            CASE ur.role
                WHEN 'super_admin' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'manager' THEN 3
                WHEN 'staff' THEN 4
                WHEN 'advisor' THEN 5
                WHEN 'member' THEN 6
                WHEN 'guest' THEN 7
            END
         LIMIT 1),
        'member'
    ) as highest_role,
    au.role as admin_role,
    au.status as admin_status,
    au.permissions as admin_permissions
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN admin_users au ON au.id = u.id;

-- Grant access to the view
GRANT SELECT ON public.unified_user_roles TO authenticated;

-- ============================================================================
-- HELPER FUNCTION: Get user's highest role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_highest_role(check_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    SELECT
        CASE
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'super_admin') THEN 'super_admin'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'admin') THEN 'admin'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'manager') THEN 'manager'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'staff') THEN 'staff'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'advisor') THEN 'advisor'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'member') THEN 'member'
            WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = check_user_id AND role = 'guest') THEN 'guest'
            ELSE 'member'
        END
    INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_highest_role(UUID) TO authenticated;

-- ============================================================================
-- SYNC EXISTING DATA (run sync for all existing users)
-- ============================================================================

-- This ensures profiles and admin_users are in sync with user_roles
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT DISTINCT user_id FROM user_roles LOOP
        -- Trigger the sync by doing a no-op update
        UPDATE user_roles
        SET updated_at = NOW()
        WHERE user_id = user_record.user_id
        AND id = (SELECT id FROM user_roles WHERE user_id = user_record.user_id LIMIT 1);
    END LOOP;
END $$;

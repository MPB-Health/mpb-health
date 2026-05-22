-- ============================================================================
-- Migration: Fix CRM role assignment to sync org_memberships
--
-- Problem: When crm_user role is assigned via assign_user_role RPC, the
-- org_memberships table is NOT updated. The website does this client-side
-- which is fragile and can fail silently due to RLS. When re-granting after
-- revoke, org_memberships.status stays 'left' causing CRM portal access
-- to fail (get_user_org_ids filters by status='active').
--
-- Fix: Extend assign_user_role and remove_user_role RPCs to handle
-- org_memberships sync for crm_user role atomically within the same
-- SECURITY DEFINER transaction.
-- ============================================================================

-- Default org for CRM users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'default_org_constant') THEN
    -- Just a comment: DEFAULT_ORG_ID = '00000000-0000-4000-a000-000000000001'
    NULL;
  END IF;
END $$;

-- ============================================================================
-- Updated assign_user_role: now syncs org_memberships for crm_user
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
    default_org UUID := '00000000-0000-4000-a000-000000000001';
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
        -- Role already assigned, but still ensure org_memberships is correct
        IF target_role = 'crm_user' THEN
            INSERT INTO org_memberships (user_id, org_id, role, status, joined_at)
            VALUES (target_user_id, default_org, 'member', 'active', now())
            ON CONFLICT (user_id, org_id)
            DO UPDATE SET status = 'active', joined_at = COALESCE(org_memberships.joined_at, now());
        END IF;
        RETURN jsonb_build_object('success', true, 'message', 'Role already assigned');
    END IF;

    -- Sync org_memberships for CRM users
    IF target_role = 'crm_user' THEN
        INSERT INTO org_memberships (user_id, org_id, role, status, joined_at)
        VALUES (target_user_id, default_org, 'member', 'active', now())
        ON CONFLICT (user_id, org_id)
        DO UPDATE SET status = 'active', joined_at = COALESCE(org_memberships.joined_at, now());
    END IF;

    -- Sync admin_users for admin/super_admin roles
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

-- ============================================================================
-- Updated remove_user_role: now syncs org_memberships for crm_user
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
    default_org UUID := '00000000-0000-4000-a000-000000000001';
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

    -- Deactivate org membership when CRM role removed
    IF target_role = 'crm_user' THEN
        UPDATE org_memberships
        SET status = 'inactive'
        WHERE user_id = target_user_id AND org_id = default_org;
    END IF;

    -- Deactivate admin_users when admin/super_admin role removed
    IF target_role IN ('admin', 'super_admin') THEN
        -- Only deactivate if user has no other admin-level roles
        IF NOT EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = target_user_id AND role IN ('admin', 'super_admin')
        ) THEN
            UPDATE admin_users SET status = 'inactive' WHERE id = target_user_id;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'removed', deleted_count > 0
    );
END;
$$;

-- ============================================================================
-- Migration: Fix Supabase Security Linter Issues
-- Description:
--   1. auth_users_exposed: Replace unified_user_roles and users_with_roles
--      views (which expose auth.users) with SECURITY DEFINER RPCs
--   2. security_definer_view: Recreate views with security_invoker=true
--      so they respect caller's RLS instead of bypassing it
-- ============================================================================

-- ============================================================================
-- PART 1: FIX auth_users_exposed — Replace views that expose auth.users
-- ============================================================================

-- 1a. Drop unified_user_roles view and replace with RPC
DROP VIEW IF EXISTS public.unified_user_roles;
CREATE OR REPLACE FUNCTION public.get_unified_user_roles()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    full_name TEXT,
    profile_role TEXT,
    roles TEXT[],
    highest_role TEXT,
    admin_role TEXT,
    admin_status TEXT,
    admin_permissions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow super_admins and admins to call this function
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin role required';
    END IF;

    RETURN QUERY
    SELECT
        u.id AS user_id,
        u.email::TEXT,
        (u.raw_user_meta_data->>'full_name')::TEXT AS full_name,
        p.role::TEXT AS profile_role,
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
        ) AS roles,
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
        )::TEXT AS highest_role,
        au.role::TEXT AS admin_role,
        au.status::TEXT AS admin_status,
        au.permissions AS admin_permissions
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    LEFT JOIN admin_users au ON au.id = u.id
    ORDER BY u.email;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_unified_user_roles() TO authenticated;
COMMENT ON FUNCTION public.get_unified_user_roles() IS
    'Returns unified user roles (replaces unified_user_roles view). Only accessible by admins. Does not expose auth.users to API.';
-- 1b. Ensure users_with_roles view is dropped (may have been re-created elsewhere)
DROP VIEW IF EXISTS public.users_with_roles;
-- ============================================================================
-- PART 2: FIX security_definer_view — Use security_invoker on views
-- ============================================================================

-- 2a. crm_deal_stage_metrics — no auth.users, use security_invoker
-- Use CTE for window function (aggregates cannot contain window functions)
DROP VIEW IF EXISTS public.crm_deal_stage_metrics;
CREATE VIEW public.crm_deal_stage_metrics
WITH (security_invoker = true)
AS
WITH stage_durations AS (
    SELECT
        h.deal_id,
        h.to_stage_id,
        EXTRACT(EPOCH FROM (
            LEAD(h.changed_at) OVER (PARTITION BY h.deal_id ORDER BY h.changed_at) - h.changed_at
        )) / 86400.0 AS days_in_stage
    FROM public.crm_deal_stage_history h
)
SELECT
    d.org_id,
    s.id AS stage_id,
    s.name AS stage_name,
    s.display_name AS stage_display_name,
    s.sort_order,
    s.is_won_stage,
    s.is_lost_stage,
    COUNT(DISTINCT d.id) AS total_deals,
    COUNT(DISTINCT d.id) FILTER (WHERE d.won_at IS NOT NULL) AS won_deals,
    COUNT(DISTINCT d.id) FILTER (WHERE d.lost_at IS NOT NULL) AS lost_deals,
    CASE
        WHEN COUNT(DISTINCT d.id) FILTER (WHERE d.won_at IS NOT NULL OR d.lost_at IS NOT NULL) > 0
        THEN ROUND(
            COUNT(DISTINCT d.id) FILTER (WHERE d.won_at IS NOT NULL)::numeric /
            COUNT(DISTINCT d.id) FILTER (WHERE d.won_at IS NOT NULL OR d.lost_at IS NOT NULL)::numeric * 100,
            1
        )
        ELSE 0
    END AS win_rate,
    COALESCE(ROUND(AVG(d.amount) FILTER (WHERE d.amount IS NOT NULL), 2), 0) AS avg_deal_size,
    COALESCE(
        ROUND(AVG(sd.days_in_stage) FILTER (WHERE sd.days_in_stage IS NOT NULL), 1),
        0
    ) AS avg_days_in_stage
FROM public.crm_deal_stages s
LEFT JOIN public.crm_deals d ON d.stage_id = s.id
LEFT JOIN stage_durations sd ON sd.deal_id = d.id AND sd.to_stage_id = s.id
WHERE s.is_active = true
GROUP BY d.org_id, s.id, s.name, s.display_name, s.sort_order, s.is_won_stage, s.is_lost_stage
ORDER BY s.sort_order;
-- 2b. meeting_attendees — alias for advisor_meeting_attendees
DROP VIEW IF EXISTS public.meeting_attendees;
CREATE VIEW public.meeting_attendees
WITH (security_invoker = true)
AS
SELECT * FROM public.advisor_meeting_attendees;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_attendees TO authenticated;
GRANT SELECT ON public.meeting_attendees TO anon;
GRANT ALL ON public.meeting_attendees TO service_role;
COMMENT ON VIEW public.meeting_attendees IS
    'Compatibility view for advisor_meeting_attendees. Code references meeting_attendees; physical table is advisor_meeting_attendees.';
-- 2c. organization_members — alias for org_memberships
DROP VIEW IF EXISTS public.organization_members;
CREATE VIEW public.organization_members
WITH (security_invoker = true)
AS
SELECT
    user_id,
    org_id,
    role,
    status,
    joined_at,
    created_at,
    updated_at
FROM org_memberships
WHERE status = 'active';
GRANT SELECT ON public.organization_members TO authenticated;
-- 2d. user_organization_roles — alias for org_memberships (has INSTEAD OF triggers)
-- Triggers remain SECURITY DEFINER (required for INSERT/UPDATE/DELETE)
DROP VIEW IF EXISTS public.user_organization_roles;
CREATE VIEW public.user_organization_roles
WITH (security_invoker = true)
AS
SELECT
    user_id,
    org_id,
    role,
    joined_at AS created_at
FROM org_memberships
WHERE status = 'active';
GRANT SELECT ON public.user_organization_roles TO authenticated;
-- Re-create INSTEAD OF triggers (they were dropped with the view)
CREATE OR REPLACE FUNCTION user_organization_roles_insert_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO org_memberships (user_id, org_id, role, status)
    VALUES (NEW.user_id, NEW.org_id, NEW.role, 'active')
    ON CONFLICT (org_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = 'active',
        updated_at = NOW();
    RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION user_organization_roles_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE org_memberships
    SET role = NEW.role, updated_at = NOW()
    WHERE user_id = NEW.user_id AND org_id = NEW.org_id AND status = 'active';
    RETURN NEW;
END;
$$;
CREATE OR REPLACE FUNCTION user_organization_roles_delete_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE org_memberships
    SET status = 'left', updated_at = NOW()
    WHERE user_id = OLD.user_id AND org_id = OLD.org_id;
    RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS user_organization_roles_instead_of_insert ON public.user_organization_roles;
CREATE TRIGGER user_organization_roles_instead_of_insert
    INSTEAD OF INSERT ON public.user_organization_roles
    FOR EACH ROW
    EXECUTE FUNCTION user_organization_roles_insert_trigger();
DROP TRIGGER IF EXISTS user_organization_roles_instead_of_update ON public.user_organization_roles;
CREATE TRIGGER user_organization_roles_instead_of_update
    INSTEAD OF UPDATE ON public.user_organization_roles
    FOR EACH ROW
    EXECUTE FUNCTION user_organization_roles_update_trigger();
DROP TRIGGER IF EXISTS user_organization_roles_instead_of_delete ON public.user_organization_roles;
CREATE TRIGGER user_organization_roles_instead_of_delete
    INSTEAD OF DELETE ON public.user_organization_roles
    FOR EACH ROW
    EXECUTE FUNCTION user_organization_roles_delete_trigger();

-- ============================================================================
-- Migration: CRM Reporting RPCs
-- Operational reporting functions for plan-type segmentation,
-- advisor performance, and pipeline analytics.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Plan-Type Segmented Stats
-- Returns lead counts grouped by plan_type for operational dashboards.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_plan_type_stats(
    p_org_id uuid
)
RETURNS TABLE (
    plan_type text,
    total_count bigint,
    new_today bigint,
    new_this_week bigint,
    new_this_month bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(l.plan_type, 'unspecified')::text AS plan_type,
        COUNT(*)::bigint AS total_count,
        COUNT(*) FILTER (WHERE l.created_at >= CURRENT_DATE)::bigint AS new_today,
        COUNT(*) FILTER (WHERE l.created_at >= date_trunc('week', CURRENT_DATE))::bigint AS new_this_week,
        COUNT(*) FILTER (WHERE l.created_at >= date_trunc('month', CURRENT_DATE))::bigint AS new_this_month
    FROM public.zoho_lead_submissions l
    WHERE l.org_id = p_org_id
    GROUP BY COALESCE(l.plan_type, 'unspecified')
    ORDER BY total_count DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_plan_type_stats(uuid) TO authenticated;

-- ============================================================================
-- 2. Advisor Performance Stats
-- Returns per-advisor lead counts, conversion metrics, and activity counts.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_advisor_performance(
    p_org_id uuid
)
RETURNS TABLE (
    advisor_id uuid,
    advisor_email text,
    advisor_name text,
    total_leads bigint,
    new_leads_this_month bigint,
    converted_leads bigint,
    open_tasks bigint,
    overdue_tasks bigint,
    activities_this_month bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS advisor_id,
        u.email::text AS advisor_email,
        COALESCE(u.raw_user_meta_data->>'full_name', u.email)::text AS advisor_name,
        COUNT(DISTINCT l.id)::bigint AS total_leads,
        COUNT(DISTINCT l.id) FILTER (
            WHERE l.created_at >= date_trunc('month', CURRENT_DATE)
        )::bigint AS new_leads_this_month,
        COUNT(DISTINCT l.id) FILTER (
            WHERE l.pipeline_stage IN ('converted', 'won', 'closed_won')
        )::bigint AS converted_leads,
        (
            SELECT COUNT(*)::bigint
            FROM public.crm_lead_tasks t
            WHERE t.assigned_to = u.id
            AND t.org_id = p_org_id
            AND t.status != 'completed'
        ) AS open_tasks,
        (
            SELECT COUNT(*)::bigint
            FROM public.crm_lead_tasks t
            WHERE t.assigned_to = u.id
            AND t.org_id = p_org_id
            AND t.status != 'completed'
            AND t.due_date < CURRENT_DATE
        ) AS overdue_tasks,
        (
            SELECT COUNT(*)::bigint
            FROM public.crm_lead_activities a
            WHERE a.created_by = u.id
            AND a.org_id = p_org_id
            AND a.created_at >= date_trunc('month', CURRENT_DATE)
        ) AS activities_this_month
    FROM auth.users u
    INNER JOIN public.org_members om ON om.user_id = u.id AND om.org_id = p_org_id
    LEFT JOIN public.zoho_lead_submissions l ON l.owner_id = u.id AND l.org_id = p_org_id
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY total_leads DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_advisor_performance(uuid) TO authenticated;

-- ============================================================================
-- 3. Pipeline Stage Summary with plan-type breakdown
-- Returns stage-level counts with plan_type sub-counts.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_pipeline_breakdown(
    p_org_id uuid
)
RETURNS TABLE (
    stage_name text,
    stage_display_name text,
    stage_color text,
    total_in_stage bigint,
    healthshare_count bigint,
    traditional_count bigint,
    unspecified_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ps.name::text AS stage_name,
        ps.display_name::text AS stage_display_name,
        ps.color::text AS stage_color,
        COUNT(l.id)::bigint AS total_in_stage,
        COUNT(l.id) FILTER (WHERE l.plan_type = 'healthshare')::bigint AS healthshare_count,
        COUNT(l.id) FILTER (WHERE l.plan_type = 'traditional')::bigint AS traditional_count,
        COUNT(l.id) FILTER (WHERE l.plan_type IS NULL OR l.plan_type NOT IN ('healthshare', 'traditional'))::bigint AS unspecified_count
    FROM public.crm_pipeline_stages ps
    LEFT JOIN public.zoho_lead_submissions l
        ON l.pipeline_stage = ps.name
        AND l.org_id = p_org_id
    WHERE ps.org_id = p_org_id
    AND ps.is_active = true
    ORDER BY ps.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_pipeline_breakdown(uuid) TO authenticated;

COMMIT;

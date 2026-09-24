-- ============================================================================
-- Migration: Fix org_members → org_memberships in reporting RPCs
-- Description: Several RPC functions reference public.org_members which does
--   not exist. The correct table is public.org_memberships. This migration
--   redefines every affected function with the corrected join.
-- Affected RPCs:
--   - crm_advisor_performance (from 20260413100000)
--   - crm_individual_performance (from 20260413200000)
--   - crm_revenue_closed_sales (from 20260413200000)
--   - crm_conversion_rates (from 20260413200000)
--   - crm_activity_summary_vs_targets (from 20260413200000)
--   - crm_annual_revenue_trend (from 20260413200000)
--   - crm_annual_conversion_by_rep (from 20260413200000)
-- ============================================================================

BEGIN;
-- ============================================================================
-- 1. crm_advisor_performance
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
            FROM public.lead_tasks t
            WHERE t.assigned_to = u.id
            AND t.completed = false
        ) AS open_tasks,
        (
            SELECT COUNT(*)::bigint
            FROM public.lead_tasks t
            WHERE t.assigned_to = u.id
            AND t.completed = false
            AND t.due_date < CURRENT_DATE
        ) AS overdue_tasks,
        (
            SELECT COUNT(*)::bigint
            FROM public.lead_activities a
            WHERE a.created_by = u.id
            AND a.created_at >= date_trunc('month', CURRENT_DATE)
        ) AS activities_this_month
    FROM auth.users u
    INNER JOIN public.org_memberships om ON om.user_id = u.id AND om.org_id = p_org_id
    LEFT JOIN public.lead_submissions l ON l.assigned_to = u.id AND l.org_id = p_org_id
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY total_leads DESC;
END;
$$;
-- ============================================================================
-- 2. crm_individual_performance
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_individual_performance(
    p_org_id uuid,
    p_month integer,
    p_year integer
)
RETURNS TABLE (
    rep_id uuid,
    rep_name text,
    calls_made bigint,
    emails_sent bigint,
    linkedin_messages bigint,
    presentations_given bigint,
    proposals_sent bigint,
    meetings_held bigint,
    closed_sales bigint,
    revenue numeric,
    close_rate numeric,
    avg_deal_size numeric,
    new_leads_entered bigint,
    referrals_requested bigint,
    community_activities bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_start timestamptz;
    v_end timestamptz;
BEGIN
    v_start := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
    v_end := (v_start + interval '1 month');

    RETURN QUERY
    SELECT
        u.id AS rep_id,
        COALESCE(u.raw_user_meta_data->>'full_name', u.email)::text AS rep_name,
        COUNT(*) FILTER (WHERE la.activity_type = 'call')::bigint AS calls_made,
        COUNT(*) FILTER (WHERE la.activity_type = 'email')::bigint AS emails_sent,
        COUNT(*) FILTER (WHERE la.activity_type = 'linkedin_message')::bigint AS linkedin_messages,
        COUNT(*) FILTER (WHERE la.activity_type = 'presentation')::bigint AS presentations_given,
        COUNT(*) FILTER (WHERE la.activity_type = 'proposal_sent')::bigint AS proposals_sent,
        COUNT(*) FILTER (WHERE la.activity_type = 'meeting')::bigint AS meetings_held,
        (SELECT COUNT(*)::bigint FROM public.lead_submissions ls
         WHERE ls.assigned_to = u.id AND ls.org_id = p_org_id
         AND ls.pipeline_stage IN ('won','converted','closed_won')
         AND ls.converted_at >= v_start AND ls.converted_at < v_end
        ) AS closed_sales,
        (SELECT COALESCE(SUM(d.amount), 0)::numeric FROM public.crm_deals d
         WHERE d.owner_id = u.id AND d.org_id = p_org_id
         AND d.stage_name IN ('won','closed_won')
         AND d.closed_at >= v_start AND d.closed_at < v_end
        ) AS revenue,
        CASE
            WHEN (SELECT COUNT(*) FROM public.lead_submissions ls2
                  WHERE ls2.assigned_to = u.id AND ls2.org_id = p_org_id
                  AND ls2.created_at >= v_start AND ls2.created_at < v_end) > 0
            THEN ROUND(
                (SELECT COUNT(*)::numeric FROM public.lead_submissions ls3
                 WHERE ls3.assigned_to = u.id AND ls3.org_id = p_org_id
                 AND ls3.pipeline_stage IN ('won','converted','closed_won')
                 AND ls3.converted_at >= v_start AND ls3.converted_at < v_end) * 100.0 /
                NULLIF((SELECT COUNT(*) FROM public.lead_submissions ls4
                        WHERE ls4.assigned_to = u.id AND ls4.org_id = p_org_id
                        AND ls4.created_at >= v_start AND ls4.created_at < v_end), 0), 1)
            ELSE 0
        END AS close_rate,
        CASE
            WHEN (SELECT COUNT(*) FROM public.lead_submissions ls5
                  WHERE ls5.assigned_to = u.id AND ls5.org_id = p_org_id
                  AND ls5.pipeline_stage IN ('won','converted','closed_won')
                  AND ls5.converted_at >= v_start AND ls5.converted_at < v_end) > 0
            THEN ROUND(
                (SELECT COALESCE(SUM(d2.amount), 0) FROM public.crm_deals d2
                 WHERE d2.owner_id = u.id AND d2.org_id = p_org_id
                 AND d2.stage_name IN ('won','closed_won')
                 AND d2.closed_at >= v_start AND d2.closed_at < v_end) /
                NULLIF((SELECT COUNT(*) FROM public.lead_submissions ls6
                        WHERE ls6.assigned_to = u.id AND ls6.org_id = p_org_id
                        AND ls6.pipeline_stage IN ('won','converted','closed_won')
                        AND ls6.converted_at >= v_start AND ls6.converted_at < v_end), 0), 2)
            ELSE 0
        END AS avg_deal_size,
        COUNT(*) FILTER (WHERE la.activity_type = 'crm_lead_entered')::bigint AS new_leads_entered,
        COUNT(*) FILTER (WHERE la.activity_type = 'referral_requested')::bigint AS referrals_requested,
        COUNT(*) FILTER (WHERE la.activity_type = 'community_outreach')::bigint AS community_activities
    FROM auth.users u
    INNER JOIN public.org_memberships om ON om.user_id = u.id AND om.org_id = p_org_id
    LEFT JOIN public.lead_activities la
        ON la.created_by = u.id
        AND la.created_at >= v_start AND la.created_at < v_end
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY rep_name;
END;
$$;
-- ============================================================================
-- 3. crm_revenue_closed_sales
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_revenue_closed_sales(
    p_org_id uuid,
    p_month integer,
    p_year integer
)
RETURNS TABLE (
    rep_id uuid,
    rep_name text,
    closed_sales_month bigint,
    revenue_month numeric,
    closed_sales_ytd bigint,
    revenue_ytd numeric,
    avg_deal_size numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_month_start timestamptz;
    v_month_end timestamptz;
    v_year_start timestamptz;
BEGIN
    v_month_start := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
    v_month_end := (v_month_start + interval '1 month');
    v_year_start := make_timestamptz(p_year, 1, 1, 0, 0, 0, 'UTC');

    RETURN QUERY
    SELECT
        u.id AS rep_id,
        COALESCE(u.raw_user_meta_data->>'full_name', u.email)::text AS rep_name,
        (SELECT COUNT(*)::bigint FROM public.lead_submissions ls
         WHERE ls.assigned_to = u.id AND ls.org_id = p_org_id
         AND ls.pipeline_stage IN ('won','converted','closed_won')
         AND ls.converted_at >= v_month_start AND ls.converted_at < v_month_end
        ) AS closed_sales_month,
        (SELECT COALESCE(SUM(d.amount), 0)::numeric FROM public.crm_deals d
         WHERE d.owner_id = u.id AND d.org_id = p_org_id
         AND d.stage_name IN ('won','closed_won')
         AND d.closed_at >= v_month_start AND d.closed_at < v_month_end
        ) AS revenue_month,
        (SELECT COUNT(*)::bigint FROM public.lead_submissions ls2
         WHERE ls2.assigned_to = u.id AND ls2.org_id = p_org_id
         AND ls2.pipeline_stage IN ('won','converted','closed_won')
         AND ls2.converted_at >= v_year_start AND ls2.converted_at < v_month_end
        ) AS closed_sales_ytd,
        (SELECT COALESCE(SUM(d2.amount), 0)::numeric FROM public.crm_deals d2
         WHERE d2.owner_id = u.id AND d2.org_id = p_org_id
         AND d2.stage_name IN ('won','closed_won')
         AND d2.closed_at >= v_year_start AND d2.closed_at < v_month_end
        ) AS revenue_ytd,
        CASE WHEN (SELECT COUNT(*) FROM public.lead_submissions ls3
                   WHERE ls3.assigned_to = u.id AND ls3.org_id = p_org_id
                   AND ls3.pipeline_stage IN ('won','converted','closed_won')
                   AND ls3.converted_at >= v_year_start AND ls3.converted_at < v_month_end) > 0
            THEN ROUND(
                (SELECT COALESCE(SUM(d3.amount), 0) FROM public.crm_deals d3
                 WHERE d3.owner_id = u.id AND d3.org_id = p_org_id
                 AND d3.stage_name IN ('won','closed_won')
                 AND d3.closed_at >= v_year_start AND d3.closed_at < v_month_end) /
                NULLIF((SELECT COUNT(*) FROM public.lead_submissions ls4
                        WHERE ls4.assigned_to = u.id AND ls4.org_id = p_org_id
                        AND ls4.pipeline_stage IN ('won','converted','closed_won')
                        AND ls4.converted_at >= v_year_start AND ls4.converted_at < v_month_end), 0), 2)
            ELSE 0
        END AS avg_deal_size
    FROM auth.users u
    INNER JOIN public.org_memberships om ON om.user_id = u.id AND om.org_id = p_org_id
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY rep_name;
END;
$$;
-- ============================================================================
-- 4. crm_conversion_rates
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_conversion_rates(
    p_org_id uuid,
    p_month integer,
    p_year integer
)
RETURNS TABLE (
    rep_id uuid,
    rep_name text,
    leads_received bigint,
    inhouse_leads bigint,
    inhouse_closed bigint,
    inhouse_conv_pct numeric,
    selfgen_leads bigint,
    selfgen_closed bigint,
    selfgen_conv_pct numeric,
    overall_conv_pct numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_start timestamptz;
    v_end timestamptz;
BEGIN
    v_start := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
    v_end := (v_start + interval '1 month');

    RETURN QUERY
    SELECT
        u.id AS rep_id,
        COALESCE(u.raw_user_meta_data->>'full_name', u.email)::text AS rep_name,
        COUNT(ls.id)::bigint AS leads_received,
        COUNT(ls.id) FILTER (WHERE ls.is_self_generated = false)::bigint AS inhouse_leads,
        COUNT(ls.id) FILTER (WHERE ls.is_self_generated = false AND ls.pipeline_stage IN ('won','converted','closed_won'))::bigint AS inhouse_closed,
        CASE WHEN COUNT(ls.id) FILTER (WHERE ls.is_self_generated = false) > 0
            THEN ROUND(COUNT(ls.id) FILTER (WHERE ls.is_self_generated = false AND ls.pipeline_stage IN ('won','converted','closed_won'))::numeric * 100.0 /
                 NULLIF(COUNT(ls.id) FILTER (WHERE ls.is_self_generated = false), 0), 1)
            ELSE 0 END AS inhouse_conv_pct,
        COUNT(ls.id) FILTER (WHERE ls.is_self_generated = true)::bigint AS selfgen_leads,
        COUNT(ls.id) FILTER (WHERE ls.is_self_generated = true AND ls.pipeline_stage IN ('won','converted','closed_won'))::bigint AS selfgen_closed,
        CASE WHEN COUNT(ls.id) FILTER (WHERE ls.is_self_generated = true) > 0
            THEN ROUND(COUNT(ls.id) FILTER (WHERE ls.is_self_generated = true AND ls.pipeline_stage IN ('won','converted','closed_won'))::numeric * 100.0 /
                 NULLIF(COUNT(ls.id) FILTER (WHERE ls.is_self_generated = true), 0), 1)
            ELSE 0 END AS selfgen_conv_pct,
        CASE WHEN COUNT(ls.id) > 0
            THEN ROUND(COUNT(ls.id) FILTER (WHERE ls.pipeline_stage IN ('won','converted','closed_won'))::numeric * 100.0 / COUNT(ls.id), 1)
            ELSE 0 END AS overall_conv_pct
    FROM auth.users u
    INNER JOIN public.org_memberships om ON om.user_id = u.id AND om.org_id = p_org_id
    LEFT JOIN public.lead_submissions ls
        ON ls.assigned_to = u.id AND ls.org_id = p_org_id
        AND ls.created_at >= v_start AND ls.created_at < v_end
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY rep_name;
END;
$$;
-- ============================================================================
-- 5. crm_activity_summary_vs_targets
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_activity_summary_vs_targets(
    p_org_id uuid,
    p_month integer,
    p_year integer
)
RETURNS TABLE (
    rep_id uuid,
    rep_name text,
    activity_type text,
    actual bigint,
    target integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_start timestamptz;
    v_end timestamptz;
BEGIN
    v_start := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
    v_end := (v_start + interval '1 month');

    RETURN QUERY
    SELECT
        u.id AS rep_id,
        COALESCE(u.raw_user_meta_data->>'full_name', u.email)::text AS rep_name,
        la.activity_type::text,
        COUNT(*)::bigint AS actual,
        COALESCE(
            (SELECT (t.targets->>la.activity_type)::integer
             FROM public.crm_activity_targets t
             WHERE t.org_id = p_org_id
               AND t.target_type = 'monthly_rep'
               AND t.rep_id = u.id
               AND t.period_start = v_start::date
             LIMIT 1),
            0
        ) AS target
    FROM auth.users u
    INNER JOIN public.org_memberships om ON om.user_id = u.id AND om.org_id = p_org_id
    INNER JOIN public.lead_activities la
        ON la.created_by = u.id
        AND la.created_at >= v_start AND la.created_at < v_end
    GROUP BY u.id, u.email, u.raw_user_meta_data, la.activity_type
    ORDER BY rep_name, la.activity_type;
END;
$$;
-- ============================================================================
-- 6. crm_annual_revenue_trend
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_annual_revenue_trend(
    p_org_id uuid,
    p_year integer
)
RETURNS TABLE (
    rep_id uuid,
    rep_name text,
    month_num integer,
    revenue numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS rep_id,
        COALESCE(u.raw_user_meta_data->>'full_name', u.email)::text AS rep_name,
        m.n AS month_num,
        COALESCE(SUM(d.amount), 0)::numeric AS revenue
    FROM auth.users u
    INNER JOIN public.org_memberships om ON om.user_id = u.id AND om.org_id = p_org_id
    CROSS JOIN generate_series(1, 12) AS m(n)
    LEFT JOIN public.crm_deals d
        ON d.owner_id = u.id AND d.org_id = p_org_id
        AND d.stage_name IN ('won','closed_won')
        AND d.closed_at >= make_timestamptz(p_year, m.n, 1, 0, 0, 0, 'UTC')
        AND d.closed_at < make_timestamptz(p_year, m.n, 1, 0, 0, 0, 'UTC') + interval '1 month'
    GROUP BY u.id, u.email, u.raw_user_meta_data, m.n
    ORDER BY rep_name, m.n;
END;
$$;
-- ============================================================================
-- 7. crm_annual_conversion_by_rep
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_annual_conversion_by_rep(
    p_org_id uuid,
    p_year integer
)
RETURNS TABLE (
    rep_id uuid,
    rep_name text,
    total_leads bigint,
    total_closed bigint,
    overall_conv_pct numeric,
    inhouse_conv_pct numeric,
    selfgen_conv_pct numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_start timestamptz;
    v_end timestamptz;
BEGIN
    v_start := make_timestamptz(p_year, 1, 1, 0, 0, 0, 'UTC');
    v_end := make_timestamptz(p_year + 1, 1, 1, 0, 0, 0, 'UTC');

    RETURN QUERY
    SELECT
        u.id AS rep_id,
        COALESCE(u.raw_user_meta_data->>'full_name', u.email)::text AS rep_name,
        COUNT(ls.id)::bigint AS total_leads,
        COUNT(ls.id) FILTER (WHERE ls.pipeline_stage IN ('won','converted','closed_won'))::bigint AS total_closed,
        CASE WHEN COUNT(ls.id) > 0
            THEN ROUND(COUNT(ls.id) FILTER (WHERE ls.pipeline_stage IN ('won','converted','closed_won'))::numeric * 100.0 / COUNT(ls.id), 1)
            ELSE 0 END AS overall_conv_pct,
        CASE WHEN COUNT(ls.id) FILTER (WHERE ls.is_self_generated = false) > 0
            THEN ROUND(COUNT(ls.id) FILTER (WHERE ls.is_self_generated = false AND ls.pipeline_stage IN ('won','converted','closed_won'))::numeric * 100.0 /
                 NULLIF(COUNT(ls.id) FILTER (WHERE ls.is_self_generated = false), 0), 1)
            ELSE 0 END AS inhouse_conv_pct,
        CASE WHEN COUNT(ls.id) FILTER (WHERE ls.is_self_generated = true) > 0
            THEN ROUND(COUNT(ls.id) FILTER (WHERE ls.is_self_generated = true AND ls.pipeline_stage IN ('won','converted','closed_won'))::numeric * 100.0 /
                 NULLIF(COUNT(ls.id) FILTER (WHERE ls.is_self_generated = true), 0), 1)
            ELSE 0 END AS selfgen_conv_pct
    FROM auth.users u
    INNER JOIN public.org_memberships om ON om.user_id = u.id AND om.org_id = p_org_id
    LEFT JOIN public.lead_submissions ls
        ON ls.assigned_to = u.id AND ls.org_id = p_org_id
        AND ls.created_at >= v_start AND ls.created_at < v_end
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY rep_name;
END;
$$;
COMMIT;

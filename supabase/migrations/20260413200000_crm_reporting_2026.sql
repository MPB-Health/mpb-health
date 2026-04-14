-- ============================================================================
-- Migration: CRM Reports & Dashboards 2026
-- Description: 11 reporting RPCs for the Sales Reports & Dashboards workbook.
--   7 monthly reports + 4 annual overview dashboards.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Individual Performance Dashboard (monthly, per-rep)
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
    INNER JOIN public.org_members om ON om.user_id = u.id AND om.org_id = p_org_id
    LEFT JOIN public.lead_activities la
        ON la.created_by = u.id
        AND la.created_at >= v_start AND la.created_at < v_end
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY rep_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_individual_performance(uuid, integer, integer) TO authenticated;

-- ============================================================================
-- 2. Leads: Inhouse vs Self-Generated
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_leads_inhouse_vs_selfgen(
    p_org_id uuid,
    p_month integer,
    p_year integer
)
RETURNS TABLE (
    source_label text,
    lead_count bigint,
    is_self_generated boolean
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
        COALESCE(ls.lead_source, 'unknown')::text AS source_label,
        COUNT(*)::bigint AS lead_count,
        COALESCE(ls.is_self_generated, false) AS is_self_generated
    FROM public.lead_submissions ls
    WHERE ls.org_id = p_org_id
      AND ls.created_at >= v_start AND ls.created_at < v_end
    GROUP BY ls.lead_source, ls.is_self_generated
    ORDER BY lead_count DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_leads_inhouse_vs_selfgen(uuid, integer, integer) TO authenticated;

-- ============================================================================
-- 3. Lead Source Breakdown (with conversion %)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_lead_source_breakdown_monthly(
    p_org_id uuid,
    p_month integer,
    p_year integer
)
RETURNS TABLE (
    source_label text,
    total_leads bigint,
    converted_leads bigint,
    conversion_pct numeric
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
        COALESCE(ls.lead_source, 'unknown')::text AS source_label,
        COUNT(*)::bigint AS total_leads,
        COUNT(*) FILTER (WHERE ls.pipeline_stage IN ('won','converted','closed_won'))::bigint AS converted_leads,
        CASE WHEN COUNT(*) > 0
            THEN ROUND(COUNT(*) FILTER (WHERE ls.pipeline_stage IN ('won','converted','closed_won'))::numeric * 100.0 / COUNT(*), 1)
            ELSE 0
        END AS conversion_pct
    FROM public.lead_submissions ls
    WHERE ls.org_id = p_org_id
      AND ls.created_at >= v_start AND ls.created_at < v_end
    GROUP BY ls.lead_source
    ORDER BY total_leads DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_lead_source_breakdown_monthly(uuid, integer, integer) TO authenticated;

-- ============================================================================
-- 4. Revenue & Closed Sales (monthly + YTD)
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
    INNER JOIN public.org_members om ON om.user_id = u.id AND om.org_id = p_org_id
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY rep_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_revenue_closed_sales(uuid, integer, integer) TO authenticated;

-- ============================================================================
-- 5. Conversion Rates (Inhouse, Self-Gen, Overall)
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
    INNER JOIN public.org_members om ON om.user_id = u.id AND om.org_id = p_org_id
    LEFT JOIN public.lead_submissions ls
        ON ls.assigned_to = u.id AND ls.org_id = p_org_id
        AND ls.created_at >= v_start AND ls.created_at < v_end
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY rep_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_conversion_rates(uuid, integer, integer) TO authenticated;

-- ============================================================================
-- 6. Activity Log Summary vs Targets
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
    INNER JOIN public.org_members om ON om.user_id = u.id AND om.org_id = p_org_id
    INNER JOIN public.lead_activities la
        ON la.created_by = u.id
        AND la.created_at >= v_start AND la.created_at < v_end
    GROUP BY u.id, u.email, u.raw_user_meta_data, la.activity_type
    ORDER BY rep_name, la.activity_type;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_activity_summary_vs_targets(uuid, integer, integer) TO authenticated;

-- ============================================================================
-- 7. Outside Advisor Production
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_outside_advisor_production(
    p_org_id uuid,
    p_month integer,
    p_year integer
)
RETURNS TABLE (
    advisor_id uuid,
    advisor_name text,
    leads_month bigint,
    closed_month bigint,
    leads_ytd bigint,
    closed_ytd bigint
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
        oa.id AS advisor_id,
        oa.name::text AS advisor_name,
        (SELECT COUNT(*)::bigint FROM public.lead_submissions ls
         WHERE ls.org_id = p_org_id AND ls.lead_source = 'outside_advisors'
         AND ls.created_at >= v_month_start AND ls.created_at < v_month_end
        ) AS leads_month,
        (SELECT COUNT(*)::bigint FROM public.lead_submissions ls2
         WHERE ls2.org_id = p_org_id AND ls2.lead_source = 'outside_advisors'
         AND ls2.pipeline_stage IN ('won','converted','closed_won')
         AND ls2.converted_at >= v_month_start AND ls2.converted_at < v_month_end
        ) AS closed_month,
        (SELECT COUNT(*)::bigint FROM public.lead_submissions ls3
         WHERE ls3.org_id = p_org_id AND ls3.lead_source = 'outside_advisors'
         AND ls3.created_at >= v_year_start AND ls3.created_at < v_month_end
        ) AS leads_ytd,
        (SELECT COUNT(*)::bigint FROM public.lead_submissions ls4
         WHERE ls4.org_id = p_org_id AND ls4.lead_source = 'outside_advisors'
         AND ls4.pipeline_stage IN ('won','converted','closed_won')
         AND ls4.converted_at >= v_year_start AND ls4.converted_at < v_month_end
        ) AS closed_ytd
    FROM public.crm_outside_advisors oa
    WHERE oa.org_id = p_org_id AND oa.is_active = true
    ORDER BY oa.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_outside_advisor_production(uuid, integer, integer) TO authenticated;

-- ============================================================================
-- 8. Annual Lead Trend (12-month line)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_annual_lead_trend(
    p_org_id uuid,
    p_year integer
)
RETURNS TABLE (
    month_num integer,
    month_label text,
    lead_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.n AS month_num,
        TO_CHAR(make_date(p_year, m.n, 1), 'Mon')::text AS month_label,
        (SELECT COUNT(*)::bigint FROM public.lead_submissions ls
         WHERE ls.org_id = p_org_id
         AND ls.created_at >= make_timestamptz(p_year, m.n, 1, 0, 0, 0, 'UTC')
         AND ls.created_at < make_timestamptz(p_year, m.n, 1, 0, 0, 0, 'UTC') + interval '1 month'
        ) AS lead_count
    FROM generate_series(1, 12) AS m(n)
    ORDER BY m.n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_annual_lead_trend(uuid, integer) TO authenticated;

-- ============================================================================
-- 9. Annual Revenue Trend (per-rep bar)
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
    INNER JOIN public.org_members om ON om.user_id = u.id AND om.org_id = p_org_id
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

GRANT EXECUTE ON FUNCTION public.crm_annual_revenue_trend(uuid, integer) TO authenticated;

-- ============================================================================
-- 10. Annual Lead Source Distribution (pie + YTD conv %)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_annual_source_distribution(
    p_org_id uuid,
    p_year integer
)
RETURNS TABLE (
    source_label text,
    total_leads bigint,
    converted bigint,
    conversion_pct numeric
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
        COALESCE(ls.lead_source, 'unknown')::text AS source_label,
        COUNT(*)::bigint AS total_leads,
        COUNT(*) FILTER (WHERE ls.pipeline_stage IN ('won','converted','closed_won'))::bigint AS converted,
        CASE WHEN COUNT(*) > 0
            THEN ROUND(COUNT(*) FILTER (WHERE ls.pipeline_stage IN ('won','converted','closed_won'))::numeric * 100.0 / COUNT(*), 1)
            ELSE 0
        END AS conversion_pct
    FROM public.lead_submissions ls
    WHERE ls.org_id = p_org_id
      AND ls.created_at >= v_start AND ls.created_at < v_end
    GROUP BY ls.lead_source
    ORDER BY total_leads DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_annual_source_distribution(uuid, integer) TO authenticated;

-- ============================================================================
-- 11. Annual Conversion Rates by Rep (bar + YTD table)
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
    INNER JOIN public.org_members om ON om.user_id = u.id AND om.org_id = p_org_id
    LEFT JOIN public.lead_submissions ls
        ON ls.assigned_to = u.id AND ls.org_id = p_org_id
        AND ls.created_at >= v_start AND ls.created_at < v_end
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY rep_name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_annual_conversion_by_rep(uuid, integer) TO authenticated;

COMMIT;

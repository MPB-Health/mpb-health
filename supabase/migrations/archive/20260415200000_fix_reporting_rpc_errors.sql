-- ============================================================================
-- Migration: Fix Reporting RPC Errors (DB Lint)
-- Fixes 5 errors found by supabase db lint:
--   1. crm_pipeline_breakdown      – missing GROUP BY
--   2. crm_lead_stage_velocity     – ROUND(double precision) cast
--   3. crm_revenue_closed_sales    – d.stage_name / d.closed_at don't exist
--   4. crm_annual_revenue_trend    – d.stage_name / d.closed_at don't exist
--   5. crm_individual_performance  – d.stage_name / d.closed_at don't exist
-- ============================================================================

BEGIN;
-- --------------------------------------------------------------------------
-- 1. crm_pipeline_breakdown – add missing GROUP BY
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_pipeline_breakdown(p_org_id uuid)
RETURNS TABLE(
    stage_name text,
    stage_display_name text,
    stage_color text,
    total_in_stage bigint,
    healthshare_count bigint,
    traditional_count bigint,
    unspecified_count bigint
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ps.name::text AS stage_name,
        ps.display_name::text AS stage_display_name,
        ps.color::text AS stage_color,
        COUNT(l.id)::bigint AS total_in_stage,
        COUNT(l.id) FILTER (WHERE l.plan_type = 'healthshare')::bigint AS healthshare_count,
        COUNT(l.id) FILTER (WHERE l.plan_type IN ('traditional', 'traditional_insurance'))::bigint AS traditional_count,
        COUNT(l.id) FILTER (WHERE l.plan_type IS NULL OR l.plan_type NOT IN ('healthshare', 'traditional', 'traditional_insurance'))::bigint AS unspecified_count
    FROM public.crm_pipeline_stages ps
    LEFT JOIN public.lead_submissions l
        ON l.pipeline_stage = ps.name
        AND l.org_id = p_org_id
    WHERE ps.org_id = p_org_id
      AND ps.is_active = true
    GROUP BY ps.name, ps.display_name, ps.color, ps.sort_order
    ORDER BY ps.sort_order;
END;
$$;
-- --------------------------------------------------------------------------
-- 2. crm_lead_stage_velocity – cast AVG / PERCENTILE_CONT to numeric
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_lead_stage_velocity(p_org_id uuid)
RETURNS TABLE(
    stage_name        text,
    stage_display_name text,
    stage_color       text,
    lead_count        int,
    avg_days_in_stage numeric,
    median_days_in_stage numeric,
    total_value       numeric,
    conversion_rate   numeric,
    stuck_count       int
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    WITH stage_leads AS (
        SELECT
            ps.name            AS s_name,
            ps.display_name    AS s_display,
            ps.color           AS s_color,
            ps.sort_order      AS s_order,
            ls.id              AS lead_id,
            ls.premium_amount,
            ls.stage_changed_at,
            ls.last_contacted_at,
            EXTRACT(EPOCH FROM (now() - COALESCE(ls.stage_changed_at, ls.created_at))) / 86400.0
                AS days_in
        FROM lead_submissions ls
        JOIN crm_pipeline_stages ps
            ON ps.name = ls.pipeline_stage
            AND (ps.org_id = p_org_id OR ps.org_id IS NULL)
        WHERE ls.org_id = p_org_id
          AND ps.is_active = true
    ),
    stage_agg AS (
        SELECT
            sl.s_name,
            sl.s_display,
            sl.s_color,
            sl.s_order,
            COUNT(*)::int                                                        AS cnt,
            ROUND(AVG(sl.days_in)::numeric, 1)                                  AS avg_d,
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sl.days_in)::numeric, 1) AS med_d,
            COALESCE(SUM(sl.premium_amount), 0)::numeric                         AS val,
            COUNT(*) FILTER (
                WHERE sl.days_in > 7
                  AND (sl.last_contacted_at IS NULL OR sl.last_contacted_at < now() - interval '3 days')
            )::int                                                               AS stuck
        FROM stage_leads sl
        GROUP BY sl.s_name, sl.s_display, sl.s_color, sl.s_order
    )
    SELECT
        sa.s_name::text                     AS stage_name,
        sa.s_display::text                  AS stage_display_name,
        sa.s_color::text                    AS stage_color,
        sa.cnt                              AS lead_count,
        sa.avg_d                            AS avg_days_in_stage,
        sa.med_d                            AS median_days_in_stage,
        sa.val                              AS total_value,
        CASE WHEN sa.cnt > 0
            THEN ROUND(
                (sa.cnt - sa.stuck)::numeric / sa.cnt * 100, 1
            )
            ELSE 0
        END                                 AS conversion_rate,
        sa.stuck                            AS stuck_count
    FROM stage_agg sa
    ORDER BY sa.s_order;
END;
$$;
-- --------------------------------------------------------------------------
-- 3. crm_revenue_closed_sales – join crm_deal_stages, use won_at
-- --------------------------------------------------------------------------
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
        (SELECT COALESCE(SUM(d.amount), 0)::numeric
         FROM public.crm_deals d
         JOIN public.crm_deal_stages ds ON ds.id = d.stage_id
         WHERE d.owner_id = u.id AND d.org_id = p_org_id
         AND ds.is_won_stage = true
         AND d.won_at >= v_month_start AND d.won_at < v_month_end
        ) AS revenue_month,
        (SELECT COUNT(*)::bigint FROM public.lead_submissions ls2
         WHERE ls2.assigned_to = u.id AND ls2.org_id = p_org_id
         AND ls2.pipeline_stage IN ('won','converted','closed_won')
         AND ls2.converted_at >= v_year_start AND ls2.converted_at < v_month_end
        ) AS closed_sales_ytd,
        (SELECT COALESCE(SUM(d2.amount), 0)::numeric
         FROM public.crm_deals d2
         JOIN public.crm_deal_stages ds2 ON ds2.id = d2.stage_id
         WHERE d2.owner_id = u.id AND d2.org_id = p_org_id
         AND ds2.is_won_stage = true
         AND d2.won_at >= v_year_start AND d2.won_at < v_month_end
        ) AS revenue_ytd,
        CASE WHEN (SELECT COUNT(*) FROM public.lead_submissions ls3
                   WHERE ls3.assigned_to = u.id AND ls3.org_id = p_org_id
                   AND ls3.pipeline_stage IN ('won','converted','closed_won')
                   AND ls3.converted_at >= v_year_start AND ls3.converted_at < v_month_end) > 0
            THEN ROUND(
                (SELECT COALESCE(SUM(d3.amount), 0)
                 FROM public.crm_deals d3
                 JOIN public.crm_deal_stages ds3 ON ds3.id = d3.stage_id
                 WHERE d3.owner_id = u.id AND d3.org_id = p_org_id
                 AND ds3.is_won_stage = true
                 AND d3.won_at >= v_year_start AND d3.won_at < v_month_end) /
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
-- --------------------------------------------------------------------------
-- 4. crm_annual_revenue_trend – join crm_deal_stages, use won_at
-- --------------------------------------------------------------------------
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
    LEFT JOIN (
        public.crm_deals d
        INNER JOIN public.crm_deal_stages ds ON ds.id = d.stage_id AND ds.is_won_stage = true
    ) ON d.owner_id = u.id AND d.org_id = p_org_id
        AND d.won_at >= make_timestamptz(p_year, m.n, 1, 0, 0, 0, 'UTC')
        AND d.won_at < make_timestamptz(p_year, m.n, 1, 0, 0, 0, 'UTC') + interval '1 month'
    GROUP BY u.id, u.email, u.raw_user_meta_data, m.n
    ORDER BY rep_name, m.n;
END;
$$;
-- --------------------------------------------------------------------------
-- 5. crm_individual_performance – join crm_deal_stages, use won_at
-- --------------------------------------------------------------------------
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
        (SELECT COALESCE(SUM(d.amount), 0)::numeric
         FROM public.crm_deals d
         JOIN public.crm_deal_stages ds ON ds.id = d.stage_id
         WHERE d.owner_id = u.id AND d.org_id = p_org_id
         AND ds.is_won_stage = true
         AND d.won_at >= v_start AND d.won_at < v_end
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
                (SELECT COALESCE(SUM(d2.amount), 0)
                 FROM public.crm_deals d2
                 JOIN public.crm_deal_stages ds2 ON ds2.id = d2.stage_id
                 WHERE d2.owner_id = u.id AND d2.org_id = p_org_id
                 AND ds2.is_won_stage = true
                 AND d2.won_at >= v_start AND d2.won_at < v_end) /
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
COMMIT;

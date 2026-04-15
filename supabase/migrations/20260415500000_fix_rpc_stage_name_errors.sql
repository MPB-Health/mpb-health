-- Fix crm_revenue_closed_sales, crm_annual_revenue_trend, crm_individual_performance
-- These functions reference d.stage_name and d.closed_at which don't exist on crm_deals.
-- Correct approach: JOIN crm_deal_stages and use d.won_at.

-- 1. crm_revenue_closed_sales
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
        (SELECT COALESCE(SUM(dd.amount), 0)::numeric
         FROM public.crm_deals dd
         INNER JOIN public.crm_deal_stages dds ON dds.id = dd.stage_id
         WHERE dd.owner_id = u.id AND dd.org_id = p_org_id
         AND dds.is_won_stage = true
         AND dd.won_at >= v_month_start AND dd.won_at < v_month_end
        ) AS revenue_month,
        (SELECT COUNT(*)::bigint FROM public.lead_submissions ls2
         WHERE ls2.assigned_to = u.id AND ls2.org_id = p_org_id
         AND ls2.pipeline_stage IN ('won','converted','closed_won')
         AND ls2.converted_at >= v_year_start AND ls2.converted_at < v_month_end
        ) AS closed_sales_ytd,
        (SELECT COALESCE(SUM(dd2.amount), 0)::numeric
         FROM public.crm_deals dd2
         INNER JOIN public.crm_deal_stages dds2 ON dds2.id = dd2.stage_id
         WHERE dd2.owner_id = u.id AND dd2.org_id = p_org_id
         AND dds2.is_won_stage = true
         AND dd2.won_at >= v_year_start AND dd2.won_at < v_month_end
        ) AS revenue_ytd,
        CASE WHEN (SELECT COUNT(*) FROM public.lead_submissions ls3
                   WHERE ls3.assigned_to = u.id AND ls3.org_id = p_org_id
                   AND ls3.pipeline_stage IN ('won','converted','closed_won')
                   AND ls3.converted_at >= v_year_start AND ls3.converted_at < v_month_end) > 0
            THEN ROUND(
                (SELECT COALESCE(SUM(dd3.amount), 0)
                 FROM public.crm_deals dd3
                 INNER JOIN public.crm_deal_stages dds3 ON dds3.id = dd3.stage_id
                 WHERE dd3.owner_id = u.id AND dd3.org_id = p_org_id
                 AND dds3.is_won_stage = true
                 AND dd3.won_at >= v_year_start AND dd3.won_at < v_month_end) /
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

-- 2. crm_annual_revenue_trend
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
        COALESCE(SUM(dd.amount), 0)::numeric AS revenue
    FROM auth.users u
    INNER JOIN public.org_memberships om ON om.user_id = u.id AND om.org_id = p_org_id
    CROSS JOIN generate_series(1, 12) AS m(n)
    LEFT JOIN public.crm_deals dd
        ON dd.owner_id = u.id AND dd.org_id = p_org_id
        AND dd.won_at >= make_timestamptz(p_year, m.n, 1, 0, 0, 0, 'UTC')
        AND dd.won_at < make_timestamptz(p_year, m.n, 1, 0, 0, 0, 'UTC') + interval '1 month'
    LEFT JOIN public.crm_deal_stages dds
        ON dds.id = dd.stage_id AND dds.is_won_stage = true
    WHERE (dd.id IS NULL OR dds.id IS NOT NULL)
    GROUP BY u.id, u.email, u.raw_user_meta_data, m.n
    ORDER BY rep_name, m.n;
END;
$$;

-- 3. crm_individual_performance
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
        (SELECT COALESCE(SUM(dd.amount), 0)::numeric
         FROM public.crm_deals dd
         INNER JOIN public.crm_deal_stages dds ON dds.id = dd.stage_id
         WHERE dd.owner_id = u.id AND dd.org_id = p_org_id
         AND dds.is_won_stage = true
         AND dd.won_at >= v_start AND dd.won_at < v_end
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
                (SELECT COALESCE(SUM(dd2.amount), 0)
                 FROM public.crm_deals dd2
                 INNER JOIN public.crm_deal_stages dds2 ON dds2.id = dd2.stage_id
                 WHERE dd2.owner_id = u.id AND dd2.org_id = p_org_id
                 AND dds2.is_won_stage = true
                 AND dd2.won_at >= v_start AND dd2.won_at < v_end) /
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

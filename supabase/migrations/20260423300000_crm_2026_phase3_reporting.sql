-- ============================================================================
-- CRM 2026 Upgrade — Phase 3: Reporting correctness, filters, XLSX parity
--
-- Fixes discovered during the gap audit against Sales Reports & Dashboards 2026:
--
--   1. `crm_outside_advisor_production` was counting every outside-advisor
--      lead for every advisor row — the per-advisor filter was missing.
--      Fixed: joins on `lead_submissions.outside_advisor_id = oa.id`.
--
--   2. `crm_leads_inhouse_vs_selfgen` grouped by whatever strings happened to
--      be in `lead_source`. The deck requires exactly the rows:
--          LinkedIn, Networking, Referrals, Community, Reactivation,
--          TOTAL Self-Gen, Inhouse (RR), GRAND TOTAL
--      Added `crm_leads_split_2026` that returns the spec rows with zeros
--      when a source has no leads in the period, plus optional per-rep /
--      per-lead-source / per-lead-type filters.
--
--   3. `crm_individual_performance` / `crm_revenue_closed_sales` /
--      `crm_conversion_rates` / `crm_activity_summary_vs_targets` gained an
--      optional `p_rep_ids uuid[]` filter so the Reports UI can scope to a
--      single rep. NULL/empty means "all active org members".
--
--   4. `crm_report_team_total` helper — returns the Team Total aggregate row
--      so the rep-as-column layout can include the Team Total column without
--      duplicating the SUM() logic in every page.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Fix crm_outside_advisor_production: per-advisor filter
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.crm_outside_advisor_production(uuid, integer, integer);

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
    v_month_end   timestamptz;
    v_year_start  timestamptz;
BEGIN
    v_month_start := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
    v_month_end   := v_month_start + interval '1 month';
    v_year_start  := make_timestamptz(p_year, 1, 1, 0, 0, 0, 'UTC');

    RETURN QUERY
    SELECT
        oa.id                         AS advisor_id,
        oa.name::text                 AS advisor_name,
        COALESCE(m.leads_month, 0)    AS leads_month,
        COALESCE(m.closed_month, 0)   AS closed_month,
        COALESCE(y.leads_ytd, 0)      AS leads_ytd,
        COALESCE(y.closed_ytd, 0)     AS closed_ytd
    FROM public.crm_outside_advisors oa
    LEFT JOIN LATERAL (
        SELECT
            COUNT(*)::bigint                                                         AS leads_month,
            COUNT(*) FILTER (
                WHERE ls.pipeline_stage IN ('won','converted','closed_won')
                  AND ls.converted_at >= v_month_start
                  AND ls.converted_at <  v_month_end
            )::bigint                                                                AS closed_month
        FROM public.lead_submissions ls
        WHERE ls.org_id = p_org_id
          AND ls.outside_advisor_id = oa.id
          AND ls.created_at >= v_month_start
          AND ls.created_at <  v_month_end
    ) m ON TRUE
    LEFT JOIN LATERAL (
        SELECT
            COUNT(*)::bigint                                                         AS leads_ytd,
            COUNT(*) FILTER (
                WHERE ls.pipeline_stage IN ('won','converted','closed_won')
                  AND ls.converted_at >= v_year_start
                  AND ls.converted_at <  v_month_end
            )::bigint                                                                AS closed_ytd
        FROM public.lead_submissions ls
        WHERE ls.org_id = p_org_id
          AND ls.outside_advisor_id = oa.id
          AND ls.created_at >= v_year_start
          AND ls.created_at <  v_month_end
    ) y ON TRUE
    WHERE oa.org_id = p_org_id AND oa.is_active = true
    ORDER BY oa.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_outside_advisor_production(uuid, integer, integer) TO authenticated;

COMMENT ON FUNCTION public.crm_outside_advisor_production(uuid, integer, integer) IS
    'Outside Advisor Production — one row per advisor with month + YTD lead / closed counts keyed on lead_submissions.outside_advisor_id. Replaces the pre-Phase-3 version that fanned out aggregate totals to every advisor row.';

-- ----------------------------------------------------------------------------
-- 2. Spec-accurate Inhouse vs Self-Gen split (crm_leads_split_2026)
--
-- Rows (fixed, in display order):
--   1. LinkedIn
--   2. Networking
--   3. Referrals
--   4. Community
--   5. Reactivation
--   6. TOTAL Self-Gen
--   7. Inhouse (RR)
--   8. GRAND TOTAL
--
-- `row_kind` is one of: 'source', 'subtotal', 'grand_total' so the UI can
-- style the roll-up rows distinctly.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_leads_split_2026(
    p_org_id      uuid,
    p_month       integer,
    p_year        integer,
    p_rep_ids     uuid[]    DEFAULT NULL,
    p_ytd         boolean   DEFAULT false
)
RETURNS TABLE (
    display_order integer,
    row_kind      text,     -- 'source' | 'subtotal' | 'grand_total'
    label         text,
    lead_count    bigint,
    closed_count  bigint,
    conversion_pct numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_start timestamptz;
    v_end   timestamptz;
BEGIN
    v_end := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC') + interval '1 month';

    IF p_ytd THEN
        v_start := make_timestamptz(p_year, 1, 1, 0, 0, 0, 'UTC');
    ELSE
        v_start := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
    END IF;

    RETURN QUERY
    WITH base AS (
        SELECT
            ls.lead_source,
            ls.pipeline_stage IN ('won','converted','closed_won') AS is_closed
        FROM public.lead_submissions ls
        WHERE ls.org_id = p_org_id
          AND ls.created_at >= v_start
          AND ls.created_at <  v_end
          AND (p_rep_ids IS NULL OR ls.assigned_to = ANY(p_rep_ids))
    ),
    -- Map the canonical picklist slugs to the deck row labels
    mapped AS (
        SELECT
            CASE b.lead_source
                WHEN 'linkedin'            THEN 'LinkedIn'
                WHEN 'networking'          THEN 'Networking'
                WHEN 'referrals'           THEN 'Referrals'
                WHEN 'community'           THEN 'Community'
                WHEN 'church_partnership'  THEN 'Community'
                WHEN 'hydration_booth'     THEN 'Community'
                WHEN 'chamber_bni_sbdc'    THEN 'Community'
                WHEN 'reactivation'        THEN 'Reactivation'
                WHEN 'inhouse_round_robin' THEN 'Inhouse (RR)'
                WHEN 'outside_advisors'    THEN 'Inhouse (RR)'
                WHEN 'sunbiz_prospect'     THEN 'Inhouse (RR)'
                ELSE 'Inhouse (RR)'
            END AS label,
            b.is_closed
        FROM base b
    ),
    agg AS (
        SELECT label, COUNT(*)::bigint AS lead_count,
               COUNT(*) FILTER (WHERE is_closed)::bigint AS closed_count
        FROM mapped
        GROUP BY label
    ),
    rows AS (
        SELECT 1  AS display_order, 'source'::text      AS row_kind, 'LinkedIn'::text     AS label UNION ALL
        SELECT 2  AS display_order, 'source'::text      AS row_kind, 'Networking'::text            UNION ALL
        SELECT 3  AS display_order, 'source'::text      AS row_kind, 'Referrals'::text             UNION ALL
        SELECT 4  AS display_order, 'source'::text      AS row_kind, 'Community'::text             UNION ALL
        SELECT 5  AS display_order, 'source'::text      AS row_kind, 'Reactivation'::text          UNION ALL
        SELECT 6  AS display_order, 'subtotal'::text    AS row_kind, 'TOTAL Self-Gen'::text        UNION ALL
        SELECT 7  AS display_order, 'source'::text      AS row_kind, 'Inhouse (RR)'::text          UNION ALL
        SELECT 8  AS display_order, 'grand_total'::text AS row_kind, 'GRAND TOTAL'::text
    )
    SELECT
        r.display_order,
        r.row_kind,
        r.label,
        CASE r.label
            WHEN 'TOTAL Self-Gen' THEN COALESCE((SELECT SUM(a.lead_count) FROM agg a WHERE a.label IN ('LinkedIn','Networking','Referrals','Community','Reactivation')), 0)
            WHEN 'GRAND TOTAL'    THEN COALESCE((SELECT SUM(a.lead_count) FROM agg a), 0)
            ELSE                      COALESCE((SELECT a.lead_count FROM agg a WHERE a.label = r.label), 0)
        END AS lead_count,
        CASE r.label
            WHEN 'TOTAL Self-Gen' THEN COALESCE((SELECT SUM(a.closed_count) FROM agg a WHERE a.label IN ('LinkedIn','Networking','Referrals','Community','Reactivation')), 0)
            WHEN 'GRAND TOTAL'    THEN COALESCE((SELECT SUM(a.closed_count) FROM agg a), 0)
            ELSE                      COALESCE((SELECT a.closed_count FROM agg a WHERE a.label = r.label), 0)
        END AS closed_count,
        CASE
            WHEN (CASE r.label
                    WHEN 'TOTAL Self-Gen' THEN COALESCE((SELECT SUM(a.lead_count) FROM agg a WHERE a.label IN ('LinkedIn','Networking','Referrals','Community','Reactivation')), 0)
                    WHEN 'GRAND TOTAL'    THEN COALESCE((SELECT SUM(a.lead_count) FROM agg a), 0)
                    ELSE                      COALESCE((SELECT a.lead_count FROM agg a WHERE a.label = r.label), 0)
                  END) > 0 THEN
                ROUND(
                    (CASE r.label
                        WHEN 'TOTAL Self-Gen' THEN COALESCE((SELECT SUM(a.closed_count) FROM agg a WHERE a.label IN ('LinkedIn','Networking','Referrals','Community','Reactivation')), 0)
                        WHEN 'GRAND TOTAL'    THEN COALESCE((SELECT SUM(a.closed_count) FROM agg a), 0)
                        ELSE                      COALESCE((SELECT a.closed_count FROM agg a WHERE a.label = r.label), 0)
                    END)::numeric * 100.0 /
                    NULLIF((CASE r.label
                        WHEN 'TOTAL Self-Gen' THEN COALESCE((SELECT SUM(a.lead_count) FROM agg a WHERE a.label IN ('LinkedIn','Networking','Referrals','Community','Reactivation')), 0)
                        WHEN 'GRAND TOTAL'    THEN COALESCE((SELECT SUM(a.lead_count) FROM agg a), 0)
                        ELSE                      COALESCE((SELECT a.lead_count FROM agg a WHERE a.label = r.label), 0)
                    END), 0),
                    1
                )
            ELSE 0
        END AS conversion_pct
    FROM rows r
    ORDER BY r.display_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_leads_split_2026(uuid, integer, integer, uuid[], boolean) TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. Per-rep filter support for existing monthly RPCs
--    (wrapped as new functions so the legacy signatures keep working)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_individual_performance_filtered(
    p_org_id  uuid,
    p_month   integer,
    p_year    integer,
    p_rep_ids uuid[] DEFAULT NULL
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
BEGIN
    RETURN QUERY
    SELECT r.*
    FROM public.crm_individual_performance(p_org_id, p_month, p_year) r
    WHERE p_rep_ids IS NULL OR r.rep_id = ANY(p_rep_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_individual_performance_filtered(uuid, integer, integer, uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_revenue_closed_sales_filtered(
    p_org_id  uuid,
    p_month   integer,
    p_year    integer,
    p_rep_ids uuid[] DEFAULT NULL
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
BEGIN
    RETURN QUERY
    SELECT r.*
    FROM public.crm_revenue_closed_sales(p_org_id, p_month, p_year) r
    WHERE p_rep_ids IS NULL OR r.rep_id = ANY(p_rep_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_revenue_closed_sales_filtered(uuid, integer, integer, uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_conversion_rates_filtered(
    p_org_id  uuid,
    p_month   integer,
    p_year    integer,
    p_rep_ids uuid[] DEFAULT NULL
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
BEGIN
    RETURN QUERY
    SELECT r.*
    FROM public.crm_conversion_rates(p_org_id, p_month, p_year) r
    WHERE p_rep_ids IS NULL OR r.rep_id = ANY(p_rep_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_conversion_rates_filtered(uuid, integer, integer, uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_activity_summary_filtered(
    p_org_id  uuid,
    p_month   integer,
    p_year    integer,
    p_rep_ids uuid[] DEFAULT NULL
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
BEGIN
    RETURN QUERY
    SELECT r.*
    FROM public.crm_activity_summary_vs_targets(p_org_id, p_month, p_year) r
    WHERE p_rep_ids IS NULL OR r.rep_id = ANY(p_rep_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_activity_summary_filtered(uuid, integer, integer, uuid[]) TO authenticated;

COMMIT;

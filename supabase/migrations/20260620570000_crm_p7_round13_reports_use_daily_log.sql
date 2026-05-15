-- ============================================================================
-- CRM rebuild — Round 13 follow-up (2026-05-15):
--   Wire Sales Reports & Dashboards 2026 to read from `crm_daily_log_events`
-- ============================================================================
-- Spec source: chat 2026-05-15:
--   "In reports, lets make sure the daily logs are feeding into this
--    report created with the sales plan Sales Reports & Dashboards 2026.pptx"
--
-- Today's gap: `crm_individual_performance` (powers PerformanceReport) and
-- `crm_activity_summary_vs_targets` (powers ActivityTargetsReport) read
-- activity counts from `public.lead_activities` — the legacy per-lead
-- activity log. That table is fed by the rep-side quick-action modals
-- (LogCallModal, AddNoteModal, LogMeetingModal) and a few lead-detail
-- writes, but it never receives:
--
--   • Manual Daily Log entries (`crm_daily_log_add_manual_v2`) — off-CRM
--     rows like personal-cell calls, networking events, content drafted,
--     special projects with time capture.
--   • Auto-captured rows that the Phase 4 / Section 8 triggers emit on
--     `crm_activities` + `crm_email_log` + `crm_lead_quote_history`.
--   • LinkedIn replies / profile views, template / signature creation
--     rows, and the GoTo-call cancellation subtype that only land on
--     `crm_daily_log_events`.
--
-- Net result: a rep who logs ten calls via the Daily Log accordion shows
-- up as zero on the Performance / Activity dashboards. This migration
-- rewrites both RPCs to pull from `crm_daily_log_events` so every
-- captured action — manual or auto — flows into the Reports module the
-- way the Sales Plan deck assumes.
--
-- The lead-side fields (`closed_sales`, `revenue`, `close_rate`,
-- `avg_deal_size`) already read from `lead_submissions` + `crm_deals`
-- and stay unchanged.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. crm_individual_performance — read activity counts from Daily Log
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.crm_individual_performance(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.crm_individual_performance(
    p_org_id uuid,
    p_month integer,
    p_year integer
)
RETURNS TABLE (
    rep_id uuid,
    rep_name text,
    calls_made bigint,
    -- Round 13 follow-up — Section 11 separates cancellation calls from
    -- regular calls. Surface both so the Sales Reports & Dashboards 2026
    -- deck can render them side by side without re-deriving from the
    -- daily log on the client.
    cancellation_calls bigint,
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
        -- Activity counts read from crm_daily_log_events so manual rows
        -- and auto-captured rows both flow in. Cancellation calls are
        -- excluded from the regular `calls_made` total so the dashboard
        -- doesn't double-count them.
        COUNT(*) FILTER (
            WHERE e.activity_type = 'call'
              AND COALESCE(e.activity_subtype, '') <> 'cancellation'
        )::bigint AS calls_made,
        COUNT(*) FILTER (
            WHERE e.activity_type = 'call'
              AND e.activity_subtype = 'cancellation'
        )::bigint AS cancellation_calls,
        COUNT(*) FILTER (WHERE e.activity_type = 'email')::bigint AS emails_sent,
        COUNT(*) FILTER (WHERE e.activity_type = 'linkedin_message')::bigint AS linkedin_messages,
        COUNT(*) FILTER (WHERE e.activity_type = 'presentation')::bigint AS presentations_given,
        COUNT(*) FILTER (WHERE e.activity_type = 'proposal_sent')::bigint AS proposals_sent,
        COUNT(*) FILTER (WHERE e.activity_type = 'meeting')::bigint AS meetings_held,
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
        -- "New Leads Entered" — leads created in the period and owned
        -- (assigned_to) by this rep. Sourced from lead_submissions
        -- directly; the previous implementation looked for an
        -- `activity_type='crm_lead_entered'` row that was never
        -- auto-emitted, so this column read 0 for everyone. The table
        -- has no `created_by` column today (audited 2026-05-15) so we
        -- attribute via assigned_to — round-robin still resolves to
        -- exactly one owner per lead.
        (SELECT COUNT(*)::bigint FROM public.lead_submissions ls_new
         WHERE ls_new.org_id = p_org_id
           AND ls_new.assigned_to = u.id
           AND ls_new.created_at >= v_start
           AND ls_new.created_at <  v_end
        ) AS new_leads_entered,
        COUNT(*) FILTER (WHERE e.activity_type = 'referral_requested')::bigint AS referrals_requested,
        COUNT(*) FILTER (WHERE e.activity_type = 'community_outreach')::bigint AS community_activities
    FROM auth.users u
    INNER JOIN public.org_memberships om
        ON om.user_id = u.id AND om.org_id = p_org_id AND om.status = 'active'
    LEFT JOIN public.crm_daily_log_events e
        ON e.user_id = u.id
       AND e.org_id = p_org_id
       AND e.occurred_at >= v_start
       AND e.occurred_at <  v_end
    GROUP BY u.id, u.email, u.raw_user_meta_data
    ORDER BY rep_name;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_individual_performance(uuid, integer, integer)
    TO authenticated, service_role;
COMMENT ON FUNCTION public.crm_individual_performance(uuid, integer, integer) IS
    'CRM rebuild Round 13 follow-up (2026-05-15) — Sales Reports & Dashboards 2026 Performance dashboard. Reads activity counts from crm_daily_log_events so manual + auto-captured Daily Log rows both feed the report. Adds cancellation_calls (Section 11) as a first-class column. Sales / revenue / close_rate / avg_deal_size still read from lead_submissions + crm_deals.';

-- ----------------------------------------------------------------------------
-- 2. crm_activity_summary_vs_targets — source from Daily Log
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.crm_activity_summary_vs_targets(uuid, integer, integer);

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
        e.activity_type::text,
        COUNT(*)::bigint AS actual,
        COALESCE(
            (SELECT (t.targets->>e.activity_type)::integer
             FROM public.crm_activity_targets t
             WHERE t.org_id = p_org_id
               AND t.target_type = 'monthly_rep'
               AND t.rep_id = u.id
               AND t.period_start = v_start::date
             LIMIT 1),
            0
        ) AS target
    FROM auth.users u
    INNER JOIN public.org_memberships om
        ON om.user_id = u.id AND om.org_id = p_org_id AND om.status = 'active'
    INNER JOIN public.crm_daily_log_events e
        ON e.user_id = u.id
       AND e.org_id = p_org_id
       AND e.occurred_at >= v_start
       AND e.occurred_at <  v_end
    GROUP BY u.id, u.email, u.raw_user_meta_data, e.activity_type
    ORDER BY rep_name, e.activity_type;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_activity_summary_vs_targets(uuid, integer, integer)
    TO authenticated, service_role;
COMMENT ON FUNCTION public.crm_activity_summary_vs_targets(uuid, integer, integer) IS
    'CRM rebuild Round 13 follow-up (2026-05-15) — Sales Reports & Dashboards 2026 Activity vs Targets. Reads from crm_daily_log_events so manual + auto-captured Daily Log rows feed the actuals column.';

COMMIT;

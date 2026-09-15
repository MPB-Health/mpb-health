-- ============================================================================
-- CRM rebuild — Round 13 (2026-05-15):
--   Sales vs. Cancellations vs. Leads snapshot RPC
-- ============================================================================
-- Spec source: Round 13 Adjustments image (2026-05-15):
--   "Adds a single comparative report to the Reports module that surfaces
--    Sales (deals closed), Cancellations, and Number of New Leads side by
--    side for both the week and the month. Inputs are already captured by
--    the system (Sections 2e, 5, 11) — this section wires them into one
--    snapshot so admin sees net growth and top-of-funnel volume at a glance."
--
-- Sources:
--   • Sales            → lead_submissions WHERE enrollment_approved_at
--                        BETWEEN p_period_start AND p_period_end. Same
--                        timestamp `crm_apply_enrollment_won` writes; same
--                        as the Daily Log "Deals Closed" section.
--   • Cancellations    → crm_daily_log_events WHERE
--                        section='lead_communication' AND activity_type='call'
--                        AND activity_subtype='cancellation' AND log_date
--                        BETWEEN range. Section 11 already auto-captures
--                        these separately from regular calls.
--   • Number of New    → lead_submissions WHERE created_at BETWEEN range.
--     Leads
--
-- Returns one totals row + one row per non-zero lead source bucket. Source
-- bucket labels follow Section 13 (Self-Generated, Inhouse, LinkedIn,
-- Networking, Referral, Community, Past Reactivation, Website auto-response).
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.crm_sales_cancellations_leads_snapshot(
    p_org_id uuid,
    p_period_start timestamptz,
    p_period_end timestamptz,
    p_user_id uuid DEFAULT NULL
) RETURNS TABLE (
    -- One totals row (`row_kind = 'total'`, source = NULL) plus one
    -- per-source row (`row_kind = 'source'`).
    row_kind text,
    source text,
    new_leads integer,
    sales integer,
    cancellations integer,
    net integer
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_total_new integer := 0;
    v_total_sales integer := 0;
    v_total_cancel integer := 0;
BEGIN
    IF NOT public.is_org_member(p_org_id) THEN
        RAISE EXCEPTION 'Not a member of org %', p_org_id USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- ── Totals row ─────────────────────────────────────────────────────────

    SELECT COUNT(*)::integer INTO v_total_new
      FROM public.lead_submissions l
     WHERE l.org_id = p_org_id
       AND l.created_at >= p_period_start
       AND l.created_at <  p_period_end
       AND (p_user_id IS NULL OR l.assigned_to = p_user_id);

    SELECT COUNT(*)::integer INTO v_total_sales
      FROM public.lead_submissions l
     WHERE l.org_id = p_org_id
       AND l.enrollment_approved_at IS NOT NULL
       AND l.enrollment_approved_at >= p_period_start
       AND l.enrollment_approved_at <  p_period_end
       AND (p_user_id IS NULL OR l.assigned_to = p_user_id);

    SELECT COUNT(*)::integer INTO v_total_cancel
      FROM public.crm_daily_log_events e
     WHERE e.org_id = p_org_id
       AND e.section = 'lead_communication'
       AND e.activity_type = 'call'
       AND e.activity_subtype = 'cancellation'
       AND e.occurred_at >= p_period_start
       AND e.occurred_at <  p_period_end
       AND (p_user_id IS NULL OR e.user_id = p_user_id);

    row_kind := 'total';
    source := NULL;
    new_leads := v_total_new;
    sales := v_total_sales;
    cancellations := v_total_cancel;
    net := v_total_sales - v_total_cancel;
    RETURN NEXT;

    -- ── Per-source rows ────────────────────────────────────────────────────
    -- Section 13 source taxonomy is rendered through
    -- `crm_lead_source_types.label`; we segment New Leads + Sales by that
    -- label and skip rows that are zero on both sides so the table stays
    -- compact. Cancellations are NOT segmented by source (the spec only
    -- asks for source attribution on New Leads and Sales — cancellations
    -- live on the Daily Log event, not the lead row, and there is no
    -- 1:1 source mapping at the call level).

    FOR row_kind, source, new_leads, sales, cancellations, net IN
        WITH new_by_source AS (
            SELECT COALESCE(t.label, 'Unattributed') AS source_label,
                   COUNT(*)::integer AS new_count
              FROM public.lead_submissions l
              LEFT JOIN public.crm_lead_source_types t
                ON t.slug = l.lead_source
              WHERE l.org_id = p_org_id
                AND l.created_at >= p_period_start
                AND l.created_at <  p_period_end
                AND (p_user_id IS NULL OR l.assigned_to = p_user_id)
              GROUP BY 1
        ),
        sales_by_source AS (
            SELECT COALESCE(t.label, 'Unattributed') AS source_label,
                   COUNT(*)::integer AS sale_count
              FROM public.lead_submissions l
              LEFT JOIN public.crm_lead_source_types t
                ON t.slug = l.lead_source
              WHERE l.org_id = p_org_id
                AND l.enrollment_approved_at IS NOT NULL
                AND l.enrollment_approved_at >= p_period_start
                AND l.enrollment_approved_at <  p_period_end
                AND (p_user_id IS NULL OR l.assigned_to = p_user_id)
              GROUP BY 1
        ),
        merged AS (
            SELECT n.source_label, n.new_count, COALESCE(s.sale_count, 0) AS sale_count
              FROM new_by_source n
              LEFT JOIN sales_by_source s USING (source_label)
            UNION
            SELECT s.source_label, COALESCE(n.new_count, 0), s.sale_count
              FROM sales_by_source s
              LEFT JOIN new_by_source n USING (source_label)
        )
        SELECT 'source'::text,
               m.source_label,
               m.new_count,
               m.sale_count,
               0::integer,            -- cancellations not segmented by source
               m.sale_count           -- net = sales - cancellations(0) at row level
          FROM merged m
         WHERE m.new_count > 0 OR m.sale_count > 0
         ORDER BY m.sale_count DESC, m.new_count DESC, m.source_label
    LOOP
        RETURN NEXT;
    END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_sales_cancellations_leads_snapshot(
    uuid, timestamptz, timestamptz, uuid
) TO authenticated, service_role;
COMMENT ON FUNCTION public.crm_sales_cancellations_leads_snapshot(
    uuid, timestamptz, timestamptz, uuid
) IS
    'CRM rebuild Round 13 (2026-05-15) — Sales vs Cancellations vs New Leads snapshot for the Reports module. Returns a totals row plus one row per non-zero lead source bucket so the admin UI can render side-by-side period comparisons.';

COMMIT;

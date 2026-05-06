-- Reporting helpers for MP 8-stage CRM (dashboards + custom report pages)

BEGIN;

CREATE OR REPLACE FUNCTION public.crm_report_lead_stage_counts(p_org_id uuid)
RETURNS TABLE (pipeline_stage text, lead_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_org_member(p_org_id) THEN
        RAISE EXCEPTION 'not_found_or_denied';
    END IF;

    RETURN QUERY
    SELECT COALESCE(ls.pipeline_stage, 'unknown') AS pipeline_stage,
           COUNT(*)::bigint AS lead_count
    FROM public.lead_submissions ls
    WHERE ls.org_id = p_org_id
    GROUP BY 1
    ORDER BY 1;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_report_lead_stage_counts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_report_lead_stage_counts(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.crm_report_application_dropoff(p_org_id uuid)
RETURNS TABLE (withdrawn_or_lost bigint, still_in_progress bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_org_member(p_org_id) THEN
        RAISE EXCEPTION 'not_found_or_denied';
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*) FILTER (
            WHERE pipeline_stage IN ('lost', 'nurture')
              AND (lost_reason ILIKE '%withdraw%' OR lost_reason ILIKE ANY (ARRAY['%drop%', '%application%']))
        )::bigint,
        COUNT(*) FILTER (WHERE pipeline_stage = 'application_in_progress')::bigint
    FROM public.lead_submissions
    WHERE org_id = p_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_report_application_dropoff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_report_application_dropoff(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.crm_report_lead_stage_counts IS 'Per-stage lead counts for funnel / stalled-stage reports.';
COMMENT ON FUNCTION public.crm_report_application_dropoff IS 'Heuristic application funnel drop-off snapshot (tune lost_reason filters over time).';

COMMIT;

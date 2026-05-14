-- ============================================================================
-- CRM Round 11 — crm_perflag_metric_for_user supports business_days_only
-- ============================================================================
-- The function now takes an extra boolean parameter; when true, only
-- events on Mon–Fri count toward the score. The previous five-arg
-- signature is preserved (overload) so any caller that hasn't been
-- updated yet keeps working with `business_days_only := false`.
-- ============================================================================

-- New 7-arg version that includes the business_days_only flag.
CREATE OR REPLACE FUNCTION public.crm_perflag_metric_for_user(
    p_org_id uuid,
    p_user_id uuid,
    p_window_start date,
    p_window_end date,
    p_metric_kind text,
    p_section_filter text,
    p_business_days_only boolean
)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $function$
    SELECT CASE p_metric_kind
        WHEN 'leads_worked' THEN
            (SELECT COUNT(DISTINCT (e.metadata ->> 'lead_id'))
               FROM public.crm_daily_log_events e
              WHERE e.org_id = p_org_id
                AND e.user_id = p_user_id
                AND (p_section_filter IS NULL OR e.section <> p_section_filter)
                AND (e.metadata ? 'lead_id')
                AND e.log_date BETWEEN p_window_start AND p_window_end
                AND (NOT p_business_days_only OR EXTRACT(ISODOW FROM e.log_date)::int <= 5))::int
        WHEN 'time_logged_minutes' THEN
            COALESCE(
                (SELECT SUM(time_minutes)::int
                   FROM public.crm_special_projects sp
                  WHERE sp.org_id = p_org_id AND sp.user_id = p_user_id
                    AND sp.log_date BETWEEN p_window_start AND p_window_end
                    AND (NOT p_business_days_only OR EXTRACT(ISODOW FROM sp.log_date)::int <= 5)),
                0
            )
            +
            COALESCE(
                (SELECT SUM(COALESCE((e.metadata ->> 'call_duration_seconds')::int, 0))::int / 60
                   FROM public.crm_daily_log_events e
                  WHERE e.org_id = p_org_id AND e.user_id = p_user_id
                    AND e.activity_type = 'call'
                    AND e.log_date BETWEEN p_window_start AND p_window_end
                    AND (NOT p_business_days_only OR EXTRACT(ISODOW FROM e.log_date)::int <= 5)),
                0
            )
        ELSE
            (SELECT COUNT(*)
               FROM public.crm_daily_log_events e
              WHERE e.org_id = p_org_id
                AND e.user_id = p_user_id
                AND (p_section_filter IS NULL OR e.section <> p_section_filter)
                AND e.log_date BETWEEN p_window_start AND p_window_end
                AND (NOT p_business_days_only OR EXTRACT(ISODOW FROM e.log_date)::int <= 5))::int
    END;
$function$;

COMMENT ON FUNCTION public.crm_perflag_metric_for_user(uuid, uuid, date, date, text, text, boolean) IS
    'Round 11: shared metric extractor. p_business_days_only=true filters to Mon–Fri only.';

-- Backwards-compatible 6-arg version delegates with business_days_only=false.
CREATE OR REPLACE FUNCTION public.crm_perflag_metric_for_user(
    p_org_id uuid,
    p_user_id uuid,
    p_window_start date,
    p_window_end date,
    p_metric_kind text,
    p_section_filter text
)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $function$
    SELECT public.crm_perflag_metric_for_user(
        p_org_id, p_user_id, p_window_start, p_window_end,
        p_metric_kind, p_section_filter, false
    );
$function$;

COMMENT ON FUNCTION public.crm_perflag_metric_for_user(uuid, uuid, date, date, text, text) IS
    'Round 9 → Round 11: 6-arg delegate. Forwards to the 7-arg version with business_days_only=false. Use the 7-arg version directly when business-days-only is required.';

-- ---------------------------------------------------------------------------
-- Helper: count distinct business-day activity for the new-hire grace
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crm_perflag_distinct_business_days(
    p_org_id uuid,
    p_user_id uuid,
    p_section_filter text
)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $function$
    SELECT COUNT(DISTINCT e.log_date)::int
      FROM public.crm_daily_log_events e
     WHERE e.org_id = p_org_id
       AND e.user_id = p_user_id
       AND (p_section_filter IS NULL OR e.section <> p_section_filter)
       AND EXTRACT(ISODOW FROM e.log_date)::int <= 5;
$function$;

COMMENT ON FUNCTION public.crm_perflag_distinct_business_days(uuid, uuid, text) IS
    'Section 12 / Round 11: counts distinct Mon–Fri days a rep has at least one non-Special-Projects activity. Used for the new-hire grace floor (5 business days).';

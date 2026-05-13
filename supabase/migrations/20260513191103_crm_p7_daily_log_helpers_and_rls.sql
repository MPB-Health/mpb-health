-- Leads worked count
CREATE OR REPLACE FUNCTION public.crm_count_leads_worked(
    p_org_id uuid, p_user_id uuid, p_date date
) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
    SELECT COUNT(DISTINCT (e.metadata ->> 'lead_id'))::integer
      FROM public.crm_daily_log_events e
     WHERE e.org_id = p_org_id
       AND e.user_id = p_user_id
       AND e.log_date = p_date
       AND (e.metadata ->> 'lead_id') IS NOT NULL;
$$;
GRANT EXECUTE ON FUNCTION public.crm_count_leads_worked(uuid, uuid, date) TO authenticated, service_role;
COMMENT ON FUNCTION public.crm_count_leads_worked(uuid, uuid, date) IS 'CRM rebuild Section 8 - distinct lead ids touched by a rep on a given day.';

-- Manual entry RPC
CREATE OR REPLACE FUNCTION public.crm_daily_log_add_manual(
    p_org_id uuid, p_section text, p_activity_type text, p_description text,
    p_occurred_at timestamptz DEFAULT now(), p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_user uuid := auth.uid();
    v_id uuid;
    v_section text := lower(p_section);
BEGIN
    IF v_user IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'insufficient_privilege'; END IF;
    IF NOT public.is_org_member(p_org_id) THEN RAISE EXCEPTION 'Not a member of org %', p_org_id USING ERRCODE = 'insufficient_privilege'; END IF;
    IF v_section NOT IN ('lead_communication','linkedin_activity','pipeline','deals_closed','activities','content_creation','special_projects') THEN
        RAISE EXCEPTION 'Invalid section: %', p_section USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF p_activity_type IS NULL OR length(trim(both ' ' FROM p_activity_type)) = 0 THEN
        RAISE EXCEPTION 'activity_type is required' USING ERRCODE = 'invalid_parameter_value';
    END IF;
    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date, source, source_id, section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at
    ) VALUES (
        p_org_id, v_user, COALESCE(p_occurred_at, now())::date, 'manual', NULL,
        v_section, lower(p_activity_type), NULL, p_description,
        COALESCE(p_metadata, '{}'::jsonb), true, COALESCE(p_occurred_at, now())
    ) RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_daily_log_add_manual(uuid, text, text, text, timestamptz, jsonb) TO authenticated;
COMMENT ON FUNCTION public.crm_daily_log_add_manual(uuid, text, text, text, timestamptz, jsonb) IS 'CRM rebuild Section 8 - rep manual entry for off-CRM activity. Writes to crm_daily_log_events with manual=true.';

-- Tighten RLS so only manual rows are editable by reps
DROP POLICY IF EXISTS daily_log_events_update_self ON public.crm_daily_log_events;
DROP POLICY IF EXISTS daily_log_events_delete_self ON public.crm_daily_log_events;
DROP POLICY IF EXISTS daily_log_events_insert_self ON public.crm_daily_log_events;
CREATE POLICY daily_log_events_insert_self ON public.crm_daily_log_events FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(org_id) AND user_id = auth.uid() AND manual = true);
CREATE POLICY daily_log_events_update_self ON public.crm_daily_log_events FOR UPDATE TO authenticated
    USING (public.is_org_member(org_id) AND user_id = auth.uid() AND manual = true)
    WITH CHECK (public.is_org_member(org_id) AND user_id = auth.uid() AND manual = true);
CREATE POLICY daily_log_events_delete_self ON public.crm_daily_log_events FOR DELETE TO authenticated
    USING (public.is_org_member(org_id) AND user_id = auth.uid() AND manual = true);;

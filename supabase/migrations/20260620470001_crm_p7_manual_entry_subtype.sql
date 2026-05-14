-- ============================================================================
-- CRM rebuild — Phase 7 / Section 11 Round 6 (Manual entry subtype passthrough)
-- ============================================================================
-- The Daily Log accordion needs cancellation-call rows to render with the
-- red "cancellation" chip even when the rep logs them manually (off-CRM
-- call, personal cell, etc.). The auto-emit trigger already populates
-- activity_subtype for crm_activities-sourced rows; this migration teaches
-- crm_daily_log_add_manual to honour an explicit subtype passed via
-- metadata.
--
-- Backwards compatible: the existing 6-arg signature is preserved; we
-- simply look for `subtype` (preferred) or `is_cancellation = true` in
-- p_metadata when stamping crm_daily_log_events.activity_subtype.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_daily_log_add_manual(
    p_org_id uuid,
    p_section text,
    p_activity_type text,
    p_description text,
    p_occurred_at timestamptz DEFAULT now(),
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_user uuid := auth.uid();
    v_id uuid;
    v_section text := lower(p_section);
    v_subtype text;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NOT public.is_org_member(p_org_id) THEN
        RAISE EXCEPTION 'Not a member of org %', p_org_id USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF v_section NOT IN (
        'lead_communication','linkedin_activity','pipeline','deals_closed',
        'activities','content_creation','special_projects'
    ) THEN
        RAISE EXCEPTION 'Invalid section: %', p_section USING ERRCODE = 'invalid_parameter_value';
    END IF;

    IF p_activity_type IS NULL OR length(trim(both ' ' FROM p_activity_type)) = 0 THEN
        RAISE EXCEPTION 'activity_type is required' USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- Derive activity_subtype from metadata. Preferred shape:
    --   metadata.subtype = '<text>'
    -- Backward shorthand:
    --   metadata.is_cancellation = true → subtype 'cancellation'
    v_subtype := NULLIF(trim(both ' ' FROM (p_metadata->>'subtype')), '');
    IF v_subtype IS NULL
       AND COALESCE((p_metadata->>'is_cancellation')::boolean, false) THEN
        v_subtype := 'cancellation';
    END IF;

    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date, source, source_id,
        section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at
    ) VALUES (
        p_org_id, v_user,
        COALESCE(p_occurred_at, now())::date,
        'manual', NULL,
        v_section, lower(p_activity_type), v_subtype,
        p_description,
        COALESCE(p_metadata, '{}'::jsonb),
        true,
        COALESCE(p_occurred_at, now())
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$function$;

COMMENT ON FUNCTION public.crm_daily_log_add_manual(uuid, text, text, text, timestamptz, jsonb) IS
    'Section 11 / Round 6: manual Daily Log entry. Honors metadata.subtype or '
    'metadata.is_cancellation=true so cancellation-call rows render with the '
    'red cancellation chip in the accordion.';

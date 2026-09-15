CREATE TABLE IF NOT EXISTS public.crm_daily_log_corrections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    event_id uuid NOT NULL,
    original_user_id uuid,
    correction_type text NOT NULL CHECK (correction_type IN ('edit','delete')),
    before_image jsonb NOT NULL,
    after_image jsonb,
    reason text NOT NULL,
    corrected_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    corrected_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dl_corrections_org_date ON public.crm_daily_log_corrections(org_id, corrected_at DESC);
CREATE INDEX IF NOT EXISTS idx_dl_corrections_event ON public.crm_daily_log_corrections(event_id);
ALTER TABLE public.crm_daily_log_corrections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dl_corrections_select_admin ON public.crm_daily_log_corrections;
DROP POLICY IF EXISTS dl_corrections_service ON public.crm_daily_log_corrections;
CREATE POLICY dl_corrections_select_admin ON public.crm_daily_log_corrections
    FOR SELECT TO authenticated USING (public.is_org_admin(org_id));
CREATE POLICY dl_corrections_service ON public.crm_daily_log_corrections
    FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.crm_daily_log_corrections TO authenticated;
GRANT ALL ON public.crm_daily_log_corrections TO service_role;

CREATE OR REPLACE FUNCTION public.crm_daily_log_admin_edit(
    p_event_id uuid, p_patch jsonb, p_reason text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_admin uuid := auth.uid();
    v_event public.crm_daily_log_events%ROWTYPE;
    v_before jsonb;
    v_after jsonb;
BEGIN
    IF v_admin IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'insufficient_privilege'; END IF;
    IF p_reason IS NULL OR length(trim(both ' ' FROM p_reason)) < 3 THEN
        RAISE EXCEPTION 'A reason is required for admin corrections' USING ERRCODE = 'invalid_parameter_value';
    END IF;
    SELECT * INTO v_event FROM public.crm_daily_log_events WHERE id = p_event_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'event % not found', p_event_id USING ERRCODE = 'no_data_found'; END IF;
    IF NOT (public.is_org_admin(v_event.org_id) OR public.has_org_permission(v_event.org_id, 'settings.admin')) THEN
        RAISE EXCEPTION 'Admin privileges required' USING ERRCODE = 'insufficient_privilege';
    END IF;
    v_before := to_jsonb(v_event);
    UPDATE public.crm_daily_log_events
       SET description = COALESCE(p_patch ->> 'description', v_event.description),
           metadata = COALESCE(CASE WHEN p_patch ? 'metadata' THEN p_patch -> 'metadata' ELSE v_event.metadata END, '{}'::jsonb)
                      || jsonb_build_object('admin_corrected', true, 'admin_correction_reason', p_reason),
           section = COALESCE(p_patch ->> 'section', v_event.section),
           activity_type = COALESCE(p_patch ->> 'activity_type', v_event.activity_type),
           activity_subtype = CASE WHEN p_patch ? 'activity_subtype' THEN p_patch ->> 'activity_subtype' ELSE v_event.activity_subtype END
     WHERE id = p_event_id;
    SELECT to_jsonb(e) INTO v_after FROM public.crm_daily_log_events e WHERE e.id = p_event_id;
    INSERT INTO public.crm_daily_log_corrections (
        org_id, event_id, original_user_id, correction_type, before_image, after_image, reason, corrected_by, corrected_at
    ) VALUES (
        v_event.org_id, p_event_id, v_event.user_id, 'edit', v_before, v_after, p_reason, v_admin, now()
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_daily_log_admin_edit(uuid, jsonb, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_daily_log_admin_delete(
    p_event_id uuid, p_reason text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_admin uuid := auth.uid();
    v_event public.crm_daily_log_events%ROWTYPE;
BEGIN
    IF v_admin IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'insufficient_privilege'; END IF;
    IF p_reason IS NULL OR length(trim(both ' ' FROM p_reason)) < 3 THEN
        RAISE EXCEPTION 'A reason is required for admin corrections' USING ERRCODE = 'invalid_parameter_value';
    END IF;
    SELECT * INTO v_event FROM public.crm_daily_log_events WHERE id = p_event_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'event % not found', p_event_id USING ERRCODE = 'no_data_found'; END IF;
    IF NOT (public.is_org_admin(v_event.org_id) OR public.has_org_permission(v_event.org_id, 'settings.admin')) THEN
        RAISE EXCEPTION 'Admin privileges required' USING ERRCODE = 'insufficient_privilege';
    END IF;
    INSERT INTO public.crm_daily_log_corrections (
        org_id, event_id, original_user_id, correction_type, before_image, after_image, reason, corrected_by, corrected_at
    ) VALUES (
        v_event.org_id, p_event_id, v_event.user_id, 'delete', to_jsonb(v_event), NULL, p_reason, v_admin, now()
    );
    DELETE FROM public.crm_daily_log_events WHERE id = p_event_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_daily_log_admin_delete(uuid, text) TO authenticated;;

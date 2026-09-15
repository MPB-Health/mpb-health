CREATE OR REPLACE FUNCTION public.crm_dl_emit_from_lead_profile_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user uuid := auth.uid();
    v_changed boolean := false;
    v_changes jsonb := '{}'::jsonb;
BEGIN
    IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
    IF v_user IS NULL THEN RETURN NEW; END IF;
    IF NEW.first_name IS DISTINCT FROM OLD.first_name THEN v_changes := v_changes || jsonb_build_object('first_name', jsonb_build_object('old', OLD.first_name, 'new', NEW.first_name)); v_changed := true; END IF;
    IF NEW.last_name IS DISTINCT FROM OLD.last_name THEN v_changes := v_changes || jsonb_build_object('last_name', jsonb_build_object('old', OLD.last_name, 'new', NEW.last_name)); v_changed := true; END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN v_changes := v_changes || jsonb_build_object('email', jsonb_build_object('old', OLD.email, 'new', NEW.email)); v_changed := true; END IF;
    IF NEW.phone IS DISTINCT FROM OLD.phone THEN v_changes := v_changes || jsonb_build_object('phone', jsonb_build_object('old', OLD.phone, 'new', NEW.phone)); v_changed := true; END IF;
    IF NEW.do_not_contact IS DISTINCT FROM OLD.do_not_contact THEN v_changes := v_changes || jsonb_build_object('do_not_contact', jsonb_build_object('old', OLD.do_not_contact, 'new', NEW.do_not_contact)); v_changed := true; END IF;
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN v_changes := v_changes || jsonb_build_object('assigned_to', jsonb_build_object('old', OLD.assigned_to, 'new', NEW.assigned_to)); v_changed := true; END IF;
    IF NEW.workflow_subsection IS DISTINCT FROM OLD.workflow_subsection THEN v_changes := v_changes || jsonb_build_object('workflow_subsection', jsonb_build_object('old', OLD.workflow_subsection, 'new', NEW.workflow_subsection)); v_changed := true; END IF;
    IF NEW.lead_source IS DISTINCT FROM OLD.lead_source THEN v_changes := v_changes || jsonb_build_object('lead_source', jsonb_build_object('old', OLD.lead_source, 'new', NEW.lead_source)); v_changed := true; END IF;
    IF NEW.plan_type IS DISTINCT FROM OLD.plan_type THEN v_changes := v_changes || jsonb_build_object('plan_type', jsonb_build_object('old', OLD.plan_type, 'new', NEW.plan_type)); v_changed := true; END IF;
    IF NOT v_changed THEN RETURN NEW; END IF;
    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date, source, source_id, section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at
    ) VALUES (
        NEW.org_id, v_user, current_date, 'crm_activities', NEW.id,
        'pipeline', 'profile_edit', NULL,
        COALESCE(NULLIF(trim(both ' ' FROM COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), ''), 'Lead profile updated'),
        jsonb_build_object('lead_id', NEW.id, 'changes', v_changes),
        false, now()
    );
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_dl_emit_from_lead_profile_edit ON public.lead_submissions;
CREATE TRIGGER trg_dl_emit_from_lead_profile_edit
    AFTER UPDATE ON public.lead_submissions
    FOR EACH ROW EXECUTE FUNCTION public.crm_dl_emit_from_lead_profile_edit();
COMMENT ON FUNCTION public.crm_dl_emit_from_lead_profile_edit() IS 'CRM rebuild Section 8 - emits a daily-log event when a rep saves a lead profile change. Skips cascaded trigger writes and system bumps.';;

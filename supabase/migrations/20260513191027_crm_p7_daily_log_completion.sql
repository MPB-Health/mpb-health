-- task complete trigger
CREATE OR REPLACE FUNCTION public.crm_dl_emit_from_task_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid;
    v_completed_at timestamptz;
    v_just_completed boolean;
BEGIN
    v_just_completed :=
        (NEW.status = 'completed' AND COALESCE(OLD.status, '') <> 'completed')
        OR (NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL);
    IF NOT v_just_completed THEN RETURN NEW; END IF;
    v_user_id := COALESCE(NEW.assigned_to, NEW.created_by);
    IF v_user_id IS NULL OR v_user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN RETURN NEW; END IF;
    v_completed_at := COALESCE(NEW.completed_at, now());
    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date, source, source_id, section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at
    ) VALUES (
        NEW.org_id, v_user_id, v_completed_at::date, 'crm_activities', NEW.id,
        'pipeline', 'task', 'completed', COALESCE(NEW.title, 'Task completed'),
        jsonb_build_object('lead_id', NEW.lead_id, 'priority', NEW.priority, 'due_date', NEW.due_date, 'task_id', NEW.id),
        false, v_completed_at
    );
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_dl_emit_from_task_complete ON public.lead_tasks;
CREATE TRIGGER trg_dl_emit_from_task_complete
    AFTER UPDATE ON public.lead_tasks
    FOR EACH ROW EXECUTE FUNCTION public.crm_dl_emit_from_task_complete();
COMMENT ON FUNCTION public.crm_dl_emit_from_task_complete() IS
    'CRM rebuild Section 8 - auto-captures task completion into crm_daily_log_events. Fires on lead_tasks UPDATE when status transitions to completed.';;

-- ============================================================================
-- CRM Rebuild — Section 8 closeout (Round 4 Adjustments — Daily Log Auto-Pop)
-- ----------------------------------------------------------------------------
-- Phase 4 shipped the auto-capture spine. This migration closes the remaining
-- Section 8 bullets:
--
--   1. Task completion auto-capture
--      Trigger on lead_tasks UPDATE → emits a daily-log event when status
--      transitions to 'completed' (or completed_at flips from null to set).
--
--   2. Lead profile edit auto-capture
--      Trigger on lead_submissions UPDATE → emits an event when an
--      authenticated rep edits a meaningful business field. Skips system
--      bumps (last_touched_at, stage_changed_at, etc.) and skips trigger-
--      cascaded updates via pg_trigger_depth().
--
--   3. "Leads worked today" derived count
--      crm_count_leads_worked(p_org_id, p_user_id, p_date) RPC returns the
--      number of distinct lead_ids that received a rep-initiated event on
--      a given day. Implements Section 8's "derived automatically from
--      distinct lead IDs touched that day" rule.
--
--   4. Manual entry RPC
--      crm_daily_log_add_manual(...) lets reps log off-CRM activity
--      (in-person meetings, personal-cell calls, networking events) into
--      the same crm_daily_log_events stream with manual = true. Returns
--      the new event id.
--
--   5. Auto-row immutability for reps
--      Tightens RLS on crm_daily_log_events: reps may only update/delete
--      rows where manual = true AND user_id = auth.uid(). Auto rows
--      (manual = false) are read-only for everyone except service_role and
--      the admin-correction RPC.
--
--   6. Admin correction audit trail
--      crm_daily_log_corrections table records every admin override (edit
--      or delete) on an auto row, including before-image. RPCs:
--        crm_daily_log_admin_edit(event_id, patch jsonb, reason)
--        crm_daily_log_admin_delete(event_id, reason)
--      Both gated by is_org_admin() OR settings.admin permission.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Task completion auto-capture
-- ---------------------------------------------------------------------------

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
    -- Detect transition into "completed". Two shapes are accepted because
    -- different parts of the app set status, completed_at, or both.
    v_just_completed :=
        (NEW.status = 'completed' AND COALESCE(OLD.status, '') <> 'completed')
        OR (NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL);

    IF NOT v_just_completed THEN
        RETURN NEW;
    END IF;

    -- Attribute completion to the rep that completed the task. Fall back
    -- through assigned_to → created_by, but skip if neither exists so we
    -- never write a system row into a rep's daily log.
    v_user_id := COALESCE(NEW.assigned_to, NEW.created_by);
    IF v_user_id IS NULL OR v_user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
        RETURN NEW;
    END IF;

    v_completed_at := COALESCE(NEW.completed_at, now());

    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date,
        source, source_id,
        section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at
    ) VALUES (
        NEW.org_id,
        v_user_id,
        v_completed_at::date,
        'crm_activities',  -- bucketed under the activity stream so the
                            -- daily log query path stays uniform
        NEW.id,
        'pipeline',
        'task',
        'completed',
        COALESCE(NEW.title, 'Task completed'),
        jsonb_build_object(
            'lead_id', NEW.lead_id,
            'priority', NEW.priority,
            'due_date', NEW.due_date,
            'task_id', NEW.id
        ),
        false,
        v_completed_at
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dl_emit_from_task_complete ON public.lead_tasks;
CREATE TRIGGER trg_dl_emit_from_task_complete
    AFTER UPDATE ON public.lead_tasks
    FOR EACH ROW EXECUTE FUNCTION public.crm_dl_emit_from_task_complete();

COMMENT ON FUNCTION public.crm_dl_emit_from_task_complete() IS
    'CRM rebuild Section 8 — auto-captures task completion into '
    'crm_daily_log_events. Fires on lead_tasks UPDATE when status '
    'transitions to completed.';


-- ---------------------------------------------------------------------------
-- 2. Lead profile edit auto-capture
-- ---------------------------------------------------------------------------
-- Spec: "Lead profile edit → logged on save."
--
-- We classify a row as "rep-edited" when ALL of the following hold:
--   • the change is not happening inside another trigger (pg_trigger_depth=0)
--   • auth.uid() is set (rules out service-role / cron updates)
--   • at least one business-field column actually changed
-- The business-field allowlist excludes the system columns the platform
-- bumps (last_touched_at, stage_changed_at, engagement_detected_at,
-- updated_at, application_started_at, opt_out_*) so a stage transition
-- emitting other triggers doesn't double-count as a profile edit.

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
    -- Skip cascaded trigger writes (e.g. last_touched_at bump from
    -- crm_lead_bump_last_touched, stage transitions, etc).
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    -- Skip background / system writes (no auth context).
    IF v_user IS NULL THEN
        RETURN NEW;
    END IF;

    -- Business-field diff. We don't enumerate every column; instead we
    -- compare a fixed allowlist that maps to "user-meaningful profile data".
    -- Adding columns is cheap (just append to the IF chain).
    IF NEW.first_name IS DISTINCT FROM OLD.first_name THEN
        v_changes := v_changes || jsonb_build_object('first_name', jsonb_build_object('old', OLD.first_name, 'new', NEW.first_name));
        v_changed := true;
    END IF;
    IF NEW.last_name IS DISTINCT FROM OLD.last_name THEN
        v_changes := v_changes || jsonb_build_object('last_name', jsonb_build_object('old', OLD.last_name, 'new', NEW.last_name));
        v_changed := true;
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        v_changes := v_changes || jsonb_build_object('email', jsonb_build_object('old', OLD.email, 'new', NEW.email));
        v_changed := true;
    END IF;
    IF NEW.phone IS DISTINCT FROM OLD.phone THEN
        v_changes := v_changes || jsonb_build_object('phone', jsonb_build_object('old', OLD.phone, 'new', NEW.phone));
        v_changed := true;
    END IF;
    IF NEW.do_not_contact IS DISTINCT FROM OLD.do_not_contact THEN
        v_changes := v_changes || jsonb_build_object('do_not_contact', jsonb_build_object('old', OLD.do_not_contact, 'new', NEW.do_not_contact));
        v_changed := true;
    END IF;
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
        v_changes := v_changes || jsonb_build_object('assigned_to', jsonb_build_object('old', OLD.assigned_to, 'new', NEW.assigned_to));
        v_changed := true;
    END IF;
    IF NEW.workflow_subsection IS DISTINCT FROM OLD.workflow_subsection THEN
        v_changes := v_changes || jsonb_build_object('workflow_subsection', jsonb_build_object('old', OLD.workflow_subsection, 'new', NEW.workflow_subsection));
        v_changed := true;
    END IF;
    IF NEW.lead_source IS DISTINCT FROM OLD.lead_source THEN
        v_changes := v_changes || jsonb_build_object('lead_source', jsonb_build_object('old', OLD.lead_source, 'new', NEW.lead_source));
        v_changed := true;
    END IF;
    IF NEW.plan_type IS DISTINCT FROM OLD.plan_type THEN
        v_changes := v_changes || jsonb_build_object('plan_type', jsonb_build_object('old', OLD.plan_type, 'new', NEW.plan_type));
        v_changed := true;
    END IF;

    IF NOT v_changed THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date,
        source, source_id,
        section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at
    ) VALUES (
        NEW.org_id,
        v_user,
        current_date,
        'crm_activities',
        NEW.id,
        'pipeline',
        'profile_edit',
        NULL,
        COALESCE(
            NULLIF(trim(both ' ' FROM COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), ''),
            'Lead profile updated'
        ),
        jsonb_build_object(
            'lead_id', NEW.id,
            'changes', v_changes
        ),
        false,
        now()
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dl_emit_from_lead_profile_edit ON public.lead_submissions;
CREATE TRIGGER trg_dl_emit_from_lead_profile_edit
    AFTER UPDATE ON public.lead_submissions
    FOR EACH ROW EXECUTE FUNCTION public.crm_dl_emit_from_lead_profile_edit();

COMMENT ON FUNCTION public.crm_dl_emit_from_lead_profile_edit() IS
    'CRM rebuild Section 8 — emits a daily-log event when a rep saves a '
    'lead profile change. Skips cascaded trigger writes and system bumps.';


-- ---------------------------------------------------------------------------
-- 3. "Leads worked today" derived count
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_count_leads_worked(
    p_org_id uuid,
    p_user_id uuid,
    p_date date
) RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT COUNT(DISTINCT (e.metadata ->> 'lead_id'))::integer
      FROM public.crm_daily_log_events e
     WHERE e.org_id = p_org_id
       AND e.user_id = p_user_id
       AND e.log_date = p_date
       AND (e.metadata ->> 'lead_id') IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.crm_count_leads_worked(uuid, uuid, date) TO authenticated, service_role;

COMMENT ON FUNCTION public.crm_count_leads_worked(uuid, uuid, date) IS
    'CRM rebuild Section 8 — distinct lead ids touched by a rep on a given '
    'day. Mirrors Section 6/7 Last Touched scope (rep-initiated activity).';


-- ---------------------------------------------------------------------------
-- 4. Manual entry RPC
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_daily_log_add_manual(
    p_org_id uuid,
    p_section text,
    p_activity_type text,
    p_description text,
    p_occurred_at timestamptz DEFAULT now(),
    p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user uuid := auth.uid();
    v_id uuid;
    v_section text := lower(p_section);
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NOT public.is_org_member(p_org_id) THEN
        RAISE EXCEPTION 'Not a member of org %', p_org_id USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF v_section NOT IN (
        'lead_communication','linkedin_activity','pipeline',
        'deals_closed','activities','content_creation','special_projects'
    ) THEN
        RAISE EXCEPTION 'Invalid section: %', p_section USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF p_activity_type IS NULL OR length(trim(both ' ' FROM p_activity_type)) = 0 THEN
        RAISE EXCEPTION 'activity_type is required' USING ERRCODE = 'invalid_parameter_value';
    END IF;

    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date,
        source, source_id,
        section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at
    ) VALUES (
        p_org_id,
        v_user,
        COALESCE(p_occurred_at, now())::date,
        'manual',
        NULL,
        v_section,
        lower(p_activity_type),
        NULL,
        p_description,
        COALESCE(p_metadata, '{}'::jsonb),
        true,
        COALESCE(p_occurred_at, now())
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_daily_log_add_manual(uuid, text, text, text, timestamptz, jsonb) TO authenticated;

COMMENT ON FUNCTION public.crm_daily_log_add_manual(uuid, text, text, text, timestamptz, jsonb) IS
    'CRM rebuild Section 8 — rep manual entry for off-CRM activity '
    '(in-person meetings, personal-cell calls, networking events). '
    'Writes to crm_daily_log_events with manual=true.';


-- ---------------------------------------------------------------------------
-- 5. Tighten RLS so reps can only edit/delete manual rows they own
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS daily_log_events_update_self ON public.crm_daily_log_events;
DROP POLICY IF EXISTS daily_log_events_delete_self ON public.crm_daily_log_events;
DROP POLICY IF EXISTS daily_log_events_insert_self ON public.crm_daily_log_events;

-- INSERT: reps may insert manual rows for themselves. Auto rows are written
-- by SECURITY DEFINER triggers (running as service_role internally) so the
-- service-role policy already covers those paths.
CREATE POLICY daily_log_events_insert_self ON public.crm_daily_log_events
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_org_member(org_id)
        AND user_id = auth.uid()
        AND manual = true
    );

-- UPDATE: only the row's owner, only manual rows. Auto rows are read-only.
CREATE POLICY daily_log_events_update_self ON public.crm_daily_log_events
    FOR UPDATE TO authenticated
    USING (
        public.is_org_member(org_id)
        AND user_id = auth.uid()
        AND manual = true
    )
    WITH CHECK (
        public.is_org_member(org_id)
        AND user_id = auth.uid()
        AND manual = true
    );

-- DELETE: same — reps can only delete their own manual rows.
CREATE POLICY daily_log_events_delete_self ON public.crm_daily_log_events
    FOR DELETE TO authenticated
    USING (
        public.is_org_member(org_id)
        AND user_id = auth.uid()
        AND manual = true
    );


-- ---------------------------------------------------------------------------
-- 6. Admin correction audit trail
-- ---------------------------------------------------------------------------
-- When an admin needs to correct or delete an auto-row (e.g. wrong
-- attribution from a bad webhook payload), we store the before/after image
-- in crm_daily_log_corrections so we have a tamper-evident record. The
-- correction RPCs are SECURITY DEFINER and gated by is_org_admin() or
-- settings.admin.

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

CREATE INDEX IF NOT EXISTS idx_dl_corrections_org_date
    ON public.crm_daily_log_corrections(org_id, corrected_at DESC);
CREATE INDEX IF NOT EXISTS idx_dl_corrections_event
    ON public.crm_daily_log_corrections(event_id);

ALTER TABLE public.crm_daily_log_corrections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dl_corrections_select_admin ON public.crm_daily_log_corrections;
DROP POLICY IF EXISTS dl_corrections_service ON public.crm_daily_log_corrections;

-- Audit trail is admin-only. Reps don't see corrections to their own rows
-- (admins handle that conversation off-system); the row in
-- crm_daily_log_events is what reps see.
CREATE POLICY dl_corrections_select_admin ON public.crm_daily_log_corrections
    FOR SELECT TO authenticated
    USING (public.is_org_admin(org_id));

CREATE POLICY dl_corrections_service ON public.crm_daily_log_corrections
    FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON public.crm_daily_log_corrections TO authenticated;
GRANT ALL ON public.crm_daily_log_corrections TO service_role;


CREATE OR REPLACE FUNCTION public.crm_daily_log_admin_edit(
    p_event_id uuid,
    p_patch jsonb,
    p_reason text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin uuid := auth.uid();
    v_event public.crm_daily_log_events%ROWTYPE;
    v_before jsonb;
    v_after jsonb;
    v_new_description text;
    v_new_metadata jsonb;
    v_new_section text;
    v_new_activity_type text;
    v_new_activity_subtype text;
BEGIN
    IF v_admin IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF p_reason IS NULL OR length(trim(both ' ' FROM p_reason)) < 3 THEN
        RAISE EXCEPTION 'A reason is required for admin corrections' USING ERRCODE = 'invalid_parameter_value';
    END IF;

    SELECT * INTO v_event FROM public.crm_daily_log_events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'event % not found', p_event_id USING ERRCODE = 'no_data_found';
    END IF;

    IF NOT (public.is_org_admin(v_event.org_id)
            OR public.has_org_permission(v_event.org_id, 'settings.admin')) THEN
        RAISE EXCEPTION 'Admin privileges required' USING ERRCODE = 'insufficient_privilege';
    END IF;

    v_before := to_jsonb(v_event);

    -- Patch keys we accept; everything else is ignored on purpose.
    v_new_description := COALESCE(p_patch ->> 'description', v_event.description);
    v_new_metadata := CASE
        WHEN p_patch ? 'metadata' THEN p_patch -> 'metadata'
        ELSE v_event.metadata
    END;
    v_new_section := COALESCE(p_patch ->> 'section', v_event.section);
    v_new_activity_type := COALESCE(p_patch ->> 'activity_type', v_event.activity_type);
    v_new_activity_subtype := CASE
        WHEN p_patch ? 'activity_subtype' THEN p_patch ->> 'activity_subtype'
        ELSE v_event.activity_subtype
    END;

    UPDATE public.crm_daily_log_events
       SET description = v_new_description,
           metadata = COALESCE(v_new_metadata, '{}'::jsonb)
                      || jsonb_build_object('admin_corrected', true,
                                            'admin_correction_reason', p_reason),
           section = v_new_section,
           activity_type = v_new_activity_type,
           activity_subtype = v_new_activity_subtype
     WHERE id = p_event_id;

    SELECT to_jsonb(e) INTO v_after FROM public.crm_daily_log_events e WHERE e.id = p_event_id;

    INSERT INTO public.crm_daily_log_corrections (
        org_id, event_id, original_user_id, correction_type,
        before_image, after_image, reason, corrected_by, corrected_at
    ) VALUES (
        v_event.org_id, p_event_id, v_event.user_id, 'edit',
        v_before, v_after, p_reason, v_admin, now()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_daily_log_admin_edit(uuid, jsonb, text) TO authenticated;


CREATE OR REPLACE FUNCTION public.crm_daily_log_admin_delete(
    p_event_id uuid,
    p_reason text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_admin uuid := auth.uid();
    v_event public.crm_daily_log_events%ROWTYPE;
BEGIN
    IF v_admin IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF p_reason IS NULL OR length(trim(both ' ' FROM p_reason)) < 3 THEN
        RAISE EXCEPTION 'A reason is required for admin corrections' USING ERRCODE = 'invalid_parameter_value';
    END IF;

    SELECT * INTO v_event FROM public.crm_daily_log_events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'event % not found', p_event_id USING ERRCODE = 'no_data_found';
    END IF;

    IF NOT (public.is_org_admin(v_event.org_id)
            OR public.has_org_permission(v_event.org_id, 'settings.admin')) THEN
        RAISE EXCEPTION 'Admin privileges required' USING ERRCODE = 'insufficient_privilege';
    END IF;

    INSERT INTO public.crm_daily_log_corrections (
        org_id, event_id, original_user_id, correction_type,
        before_image, after_image, reason, corrected_by, corrected_at
    ) VALUES (
        v_event.org_id, p_event_id, v_event.user_id, 'delete',
        to_jsonb(v_event), NULL, p_reason, v_admin, now()
    );

    DELETE FROM public.crm_daily_log_events WHERE id = p_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_daily_log_admin_delete(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.crm_daily_log_admin_edit(uuid, jsonb, text) IS
    'CRM rebuild Section 8 — admin correction on an auto/manual daily-log row. '
    'Writes a before/after image to crm_daily_log_corrections.';
COMMENT ON FUNCTION public.crm_daily_log_admin_delete(uuid, text) IS
    'CRM rebuild Section 8 — admin deletion of a daily-log row. '
    'Records the deletion in crm_daily_log_corrections with full before-image.';

COMMIT;

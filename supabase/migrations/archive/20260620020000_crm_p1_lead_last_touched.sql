-- ============================================================================
-- CRM rebuild — Phase 1: Last Touched + SLA scan + Mark Lost RPC
--
-- Section 6 (Round 3): "Last Touched" auto-updates on rep-initiated activity
-- (call logged, email sent, SMS sent, note added, task completed, profile-edit
-- save). Section 7 Addendum confirms: inbound events (lead reply, calendar
-- booking, link click) do NOT bump Last Touched — those go on the activity
-- timeline only.
--
-- Section 1 / Round 2 also adds the 24-hour SLA, with the clock starting at
-- entry into the Quoted stage (lead has a quote and is awaiting rep pickup).
--
-- Section 6 Lead Profile: "Mark as Lost" manual override button —
-- crm_mark_lead_lost RPC sets stage=lost + subsection=do_not_contact +
-- inserts an activity row in one transaction.
-- ============================================================================

BEGIN;
-- ----------------------------------------------------------------------------
-- 1. last_touched_at column on lead_submissions (rep-initiated only)
-- ----------------------------------------------------------------------------

ALTER TABLE public.lead_submissions
    ADD COLUMN IF NOT EXISTS last_touched_at timestamptz;
COMMENT ON COLUMN public.lead_submissions.last_touched_at IS
    'Bumped on rep-initiated activity only (Section 6 + Round 3 Addendum). Inbound events (replies, link clicks) do NOT bump this.';
CREATE INDEX IF NOT EXISTS idx_lead_submissions_last_touched
    ON public.lead_submissions (org_id, last_touched_at DESC NULLS LAST);
-- Backfill: best-effort, use last_contacted_at if available
UPDATE public.lead_submissions
SET last_touched_at = COALESCE(last_touched_at, last_contacted_at, updated_at)
WHERE last_touched_at IS NULL;
-- ----------------------------------------------------------------------------
-- 2. Function + trigger: bump last_touched_at when rep-initiated crm_activity
--    is inserted (call_complete / email_send / sms_send / note / task_complete
--    / profile_edit). Inbound replies / calendar bookings / link clicks are
--    OUT of scope per Section 7 Addendum.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_lead_bump_last_touched()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lead_id uuid;
    v_kind    text;
    v_inbound boolean;
BEGIN
    -- Only consider activities tied to a lead
    v_lead_id := COALESCE(NEW.lead_id, NULL);
    IF v_lead_id IS NULL THEN
        RETURN NEW;
    END IF;

    v_kind := COALESCE(lower(NEW.activity_type), '');
    v_inbound := COALESCE((NEW.metadata ->> 'direction'), '') = 'inbound'
                 OR COALESCE((NEW.metadata ->> 'is_inbound')::boolean, false);

    -- Inbound replies / link clicks / calendar bookings → do NOT bump
    IF v_inbound OR v_kind IN ('reply_received','link_click','calendar_booking','engagement_signal') THEN
        RETURN NEW;
    END IF;

    -- Rep-initiated kinds we count
    IF v_kind IN (
        'call','call_complete','call_logged','outbound_call',
        'email','email_sent','email_send','outbound_email',
        'sms','sms_sent','outbound_sms','text','text_sent',
        'note','note_added',
        'task_complete','task_completed','task_done',
        'profile_edit','profile_update','lead_update',
        'meeting','meeting_held'
    ) THEN
        UPDATE public.lead_submissions
           SET last_touched_at = COALESCE(NEW.created_at, now()),
               updated_at      = now()
         WHERE id = v_lead_id;
    END IF;

    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_crm_activities_bump_last_touched ON public.crm_activities;
CREATE TRIGGER trg_crm_activities_bump_last_touched
    AFTER INSERT ON public.crm_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_lead_bump_last_touched();
REVOKE ALL ON FUNCTION public.crm_lead_bump_last_touched() FROM PUBLIC;
-- ----------------------------------------------------------------------------
-- 3. SLA scan — Quoted >24h with no rep pickup → flag for alert
--
--    Returns the set of breaches; the actual notification fan-out lives in
--    the crm-scheduled-jobs Edge Function (Phase 3).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_check_quoted_sla(
    p_org_id     uuid,
    p_sla_hours  integer DEFAULT 24
)
RETURNS TABLE (
    lead_id          uuid,
    org_id           uuid,
    assigned_to      uuid,
    quoted_at        timestamptz,
    hours_in_quoted  numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        ls.id            AS lead_id,
        ls.org_id        AS org_id,
        ls.assigned_to   AS assigned_to,
        ls.quote_cadence_started_at AS quoted_at,
        EXTRACT(EPOCH FROM (now() - ls.quote_cadence_started_at)) / 3600.0
            AS hours_in_quoted
      FROM public.lead_submissions ls
     WHERE ls.org_id = p_org_id
       AND ls.pipeline_stage = 'quoted'
       AND ls.quote_cadence_started_at IS NOT NULL
       AND ls.quote_cadence_started_at <= now() - (p_sla_hours || ' hours')::interval
       AND COALESCE(ls.do_not_contact, false) = false
$$;
REVOKE ALL ON FUNCTION public.crm_check_quoted_sla(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_check_quoted_sla(uuid, integer)
    TO authenticated, service_role;
COMMENT ON FUNCTION public.crm_check_quoted_sla IS
    'Round 2 24-hour SLA scan: returns leads stuck in Quoted past the SLA. Edge Function fans out alerts.';
-- ----------------------------------------------------------------------------
-- 4. Mark-as-Lost RPC (manual rep override per Section 6)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_mark_lead_lost(
    p_lead_id uuid,
    p_reason  text DEFAULT 'rep_marked_lost'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org uuid;
BEGIN
    SELECT org_id INTO v_org FROM public.lead_submissions WHERE id = p_lead_id;
    IF v_org IS NULL OR NOT public.is_org_member(v_org) THEN
        RAISE EXCEPTION 'not_found_or_denied';
    END IF;

    UPDATE public.lead_submissions
    SET
        pipeline_stage         = 'lost',
        workflow_subsection    = 'do_not_contact',
        do_not_contact         = true,
        lost_reason            = COALESCE(p_reason, lost_reason),
        opt_out_reason         = COALESCE(p_reason, opt_out_reason),
        opt_out_detected_at    = COALESCE(opt_out_detected_at, now()),
        last_opt_out_signal_at = now(),
        stage_changed_at       = now(),
        last_touched_at        = now(),  -- counts as a rep-initiated change
        updated_at             = now()
    WHERE id = p_lead_id;

    INSERT INTO public.crm_activities (
        org_id, lead_id, activity_type, status, subject, description,
        metadata, created_by, created_at
    )
    VALUES (
        v_org, p_lead_id, 'lead_marked_lost', 'completed',
        'Manually marked as Lost',
        COALESCE(p_reason, 'rep marked lead as lost'),
        jsonb_build_object('reason', p_reason, 'route', 'manual_override'),
        auth.uid(), now()
    );
END;
$$;
REVOKE ALL ON FUNCTION public.crm_mark_lead_lost(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_mark_lead_lost(uuid, text)
    TO authenticated, service_role;
COMMIT;

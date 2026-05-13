-- ============================================================================
-- CRM rebuild — Phase 6 follow-up
-- Section 5 / Round 2 — Quoted → Working auto-advance
-- ============================================================================
-- Round 2 reordered the pipeline so Quoted is Stage 2 (lead arrives with
-- a quote) and Working is Stage 3 (rep is actively engaging). The
-- transition fires on the FIRST rep-initiated touch after the round-
-- robin step has assigned the lead. Subsequent touches do not retrigger
-- because the lead is no longer in 'quoted' on the second pass.
--
-- Inbound activities and engagement signals are intentionally skipped:
--   • inbound replies / calendar bookings / link clicks drive
--     Working → Engaged via crm_register_engagement_signal, not this
--     transition.
--   • a Quoted lead that replies before any rep-initiated touch should
--     jump straight to Engaged (handled by crm_register_engagement_signal
--     which already maps quoted → engaged).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_lead_quoted_to_working_advance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_kind text;
    v_inbound boolean;
    v_lead public.lead_submissions%ROWTYPE;
BEGIN
    IF NEW.lead_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.created_by IS NULL OR NEW.created_by = '00000000-0000-0000-0000-000000000000'::uuid THEN
        RETURN NEW;
    END IF;

    v_kind := COALESCE(lower(NEW.activity_type), '');
    v_inbound := COALESCE((NEW.metadata ->> 'direction'), '') = 'inbound'
                 OR COALESCE((NEW.metadata ->> 'is_inbound')::boolean, false)
                 OR NEW.call_type = 'inbound';

    IF v_inbound OR v_kind IN (
        'reply_received', 'link_click', 'calendar_booking',
        'engagement_signal', 'other'
    ) THEN
        RETURN NEW;
    END IF;

    IF v_kind NOT IN (
        'call', 'call_complete', 'call_logged', 'outbound_call',
        'email', 'email_sent', 'email_send', 'outbound_email',
        'sms', 'sms_sent', 'outbound_sms', 'text', 'text_sent',
        'note', 'note_added',
        'task_complete', 'task_completed', 'task_done',
        'meeting', 'meeting_held'
    ) THEN
        RETURN NEW;
    END IF;

    SELECT * INTO v_lead FROM public.lead_submissions WHERE id = NEW.lead_id;
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Only fire if (a) lead is currently in 'quoted', AND (b) the round-
    -- robin step has assigned the lead to a rep.
    IF v_lead.pipeline_stage = 'quoted' AND v_lead.assigned_to IS NOT NULL THEN
        UPDATE public.lead_submissions
           SET pipeline_stage = 'working',
               stage_changed_at = now(),
               updated_at = now()
         WHERE id = NEW.lead_id
           AND pipeline_stage = 'quoted';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_lead_quoted_to_working ON public.crm_activities;
CREATE TRIGGER trg_crm_lead_quoted_to_working
    AFTER INSERT ON public.crm_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_lead_quoted_to_working_advance();

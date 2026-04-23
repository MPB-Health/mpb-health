-- ============================================================================
-- CRM 2026 Upgrade — Phase 2: Lead Lifecycle Wiring
--
-- Closes the "automation is dead code" gap from UPGRADE-PLAN-2026.md.
-- After this migration every INSERT into lead_submissions triggers, in order:
--   1. Round-robin assignment (respects existing assigned_to when set)
--   2. Initial Contact task creation with a business-hour-aware due_date
--   3. Default cadence enrollment
--
-- Also:
--   • Fixes the lead_notifications schema mismatch that made SLAService.escalate
--     silently fail (added user_id + notification_type + message columns).
--   • Adds timezone-aware business hour math as a SQL function.
--   • Seeds a default 24h → 3d → 7d → 14d → nurture cadence for every org that
--     doesn't already have one.
--   • Adds an auto-pause trigger that pauses active cadences on stage change
--     to won/lost.
--   • Best-effort pg_cron job that calls the sla-breach-scan Edge Function
--     every 15 minutes. Skips silently if pg_cron / pg_net aren't available —
--     operator can configure Supabase Cron manually in that case.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Fix lead_notifications schema
-- ----------------------------------------------------------------------------

ALTER TABLE public.lead_notifications
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS notification_type text,
    ADD COLUMN IF NOT EXISTS message text;

CREATE INDEX IF NOT EXISTS idx_lead_notifications_user_id
    ON public.lead_notifications(user_id, acknowledged_at)
    WHERE acknowledged_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_lead_notifications_type
    ON public.lead_notifications(notification_type, notified_at DESC);

-- ----------------------------------------------------------------------------
-- 2. Timezone-aware business hour deadline calculator
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_calc_business_hour_deadline(
    p_start timestamptz,
    p_hours numeric,
    p_bh_start time,
    p_bh_end time,
    p_business_days int[],  -- 0=Sunday through 6=Saturday
    p_timezone text
)
RETURNS timestamptz
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_cursor  timestamp;  -- naive timestamp in org timezone
    v_bh_len  numeric;
    v_remaining numeric;
    v_bh_start_min numeric;
    v_bh_end_min numeric;
    v_iter int := 0;
    v_dow int;
    v_cur_min numeric;
    v_left_today numeric;
BEGIN
    IF p_hours <= 0 THEN
        RETURN p_start;
    END IF;

    -- Convert the start instant into the org's local wall clock
    v_cursor := (p_start AT TIME ZONE COALESCE(p_timezone, 'UTC'));

    v_bh_start_min := EXTRACT(HOUR FROM p_bh_start) * 60 + EXTRACT(MINUTE FROM p_bh_start);
    v_bh_end_min   := EXTRACT(HOUR FROM p_bh_end)   * 60 + EXTRACT(MINUTE FROM p_bh_end);
    v_bh_len       := v_bh_end_min - v_bh_start_min;

    IF v_bh_len <= 0 THEN
        -- Degenerate config — fall back to wall-clock hours
        RETURN p_start + (p_hours || ' hours')::interval;
    END IF;

    v_remaining := p_hours * 60;

    WHILE v_remaining > 0 AND v_iter < 1000 LOOP
        v_iter := v_iter + 1;
        v_dow := EXTRACT(DOW FROM v_cursor)::int;

        IF NOT (v_dow = ANY (p_business_days)) THEN
            v_cursor := date_trunc('day', v_cursor) + interval '1 day'
                      + make_interval(mins => v_bh_start_min::int);
            CONTINUE;
        END IF;

        v_cur_min := EXTRACT(HOUR FROM v_cursor) * 60 + EXTRACT(MINUTE FROM v_cursor);

        IF v_cur_min < v_bh_start_min THEN
            v_cursor := date_trunc('day', v_cursor)
                      + make_interval(mins => v_bh_start_min::int);
            CONTINUE;
        END IF;

        IF v_cur_min >= v_bh_end_min THEN
            v_cursor := date_trunc('day', v_cursor) + interval '1 day'
                      + make_interval(mins => v_bh_start_min::int);
            CONTINUE;
        END IF;

        v_left_today := v_bh_end_min - v_cur_min;
        IF v_remaining <= v_left_today THEN
            v_cursor := v_cursor + make_interval(mins => v_remaining::int);
            v_remaining := 0;
        ELSE
            v_remaining := v_remaining - v_left_today;
            v_cursor := date_trunc('day', v_cursor) + interval '1 day'
                      + make_interval(mins => v_bh_start_min::int);
        END IF;
    END LOOP;

    -- Reinterpret as an instant in the org's timezone
    RETURN v_cursor AT TIME ZONE COALESCE(p_timezone, 'UTC');
END;
$$;

COMMENT ON FUNCTION public.crm_calc_business_hour_deadline(timestamptz, numeric, time, time, int[], text) IS
  'Returns the absolute deadline for p_hours of business-hours work starting at p_start, respecting the orgs bh window and business_days in the given timezone. Replaces the naive JS implementation in SLAService.';

-- ----------------------------------------------------------------------------
-- 3. Default cadence seed for every org missing one
-- ----------------------------------------------------------------------------

-- 2026 spec default: 24h → 3d → 7d → 14d → nurture. The "nurture" step is a
-- long-tail follow-up; we encode it as 30d so the cadence keeps generating
-- next_action_at values.
INSERT INTO public.crm_follow_up_cadences (
    org_id, pipeline_stage_id, name, steps, is_default, is_active, created_at, updated_at
)
SELECT
    o.id,
    NULL::uuid,  -- global (not tied to a pipeline stage)
    'Sales Plan 2026 — Default',
    jsonb_build_array(
        jsonb_build_object('step', 1, 'delay_hours', 24,  'channel', 'call',     'label', 'First follow-up call'),
        jsonb_build_object('step', 2, 'delay_hours', 72,  'channel', 'email',    'label', 'Day-3 check-in email'),
        jsonb_build_object('step', 3, 'delay_hours', 168, 'channel', 'call',     'label', 'Week-1 follow-up call'),
        jsonb_build_object('step', 4, 'delay_hours', 336, 'channel', 'linkedin', 'label', 'Week-2 LinkedIn touch'),
        jsonb_build_object('step', 5, 'delay_hours', 720, 'channel', 'email',    'label', 'Nurture — value content')
    ),
    true,
    true,
    now(),
    now()
FROM public.orgs o
WHERE NOT EXISTS (
    SELECT 1 FROM public.crm_follow_up_cadences c
    WHERE c.org_id = o.id AND c.is_default = true
)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Seed SLA config for every org missing one (24 business hours, Mon-Fri)
-- ----------------------------------------------------------------------------

INSERT INTO public.crm_sla_config (
    org_id, sla_hours, business_hours_start, business_hours_end,
    business_days, timezone, escalation_to, escalation_email, is_active
)
SELECT
    o.id,
    24,
    '09:00'::time,
    '17:00'::time,
    ARRAY[1,2,3,4,5]::int[],  -- Monday through Friday
    'America/New_York',
    '{}'::uuid[],
    true,
    true
FROM public.orgs o
WHERE NOT EXISTS (SELECT 1 FROM public.crm_sla_config c WHERE c.org_id = o.id)
ON CONFLICT (org_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Trigger: after insert on lead_submissions → assign + create task + enroll
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_lead_after_insert_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rr            RECORD;
    v_sla           RECORD;
    v_cad           RECORD;
    v_pool          jsonb;
    v_pool_len      int;
    v_pos           int;
    v_candidate     jsonb;
    v_attempts      int := 0;
    v_was_skip      boolean := false;
    v_chosen_id     uuid := NULL;
    v_new_pos       int := -1;
    v_deadline      timestamptz;
    v_task_id       uuid;
    v_step          jsonb;
    v_delay_hours   numeric;
BEGIN
    -- ------------------------------------------------------------------
    -- Round-robin: only when caller didn't set assigned_to
    -- ------------------------------------------------------------------
    IF NEW.assigned_to IS NULL AND NEW.org_id IS NOT NULL THEN
        SELECT * INTO v_rr
        FROM public.crm_round_robin_config
        WHERE org_id = NEW.org_id AND is_active = true
        LIMIT 1;

        IF FOUND THEN
            v_pool := v_rr.pool_members;
            v_pool_len := COALESCE(jsonb_array_length(v_pool), 0);

            IF v_pool_len > 0 THEN
                v_pos := COALESCE(v_rr.current_position, -1);
                LOOP
                    EXIT WHEN v_attempts >= v_pool_len;
                    v_attempts := v_attempts + 1;
                    v_pos := (v_pos + 1) % v_pool_len;
                    v_candidate := v_pool -> v_pos;

                    IF (v_candidate ->> 'is_active')::boolean = true
                       AND COALESCE((v_candidate ->> 'is_paused')::boolean, false) = false THEN
                        v_chosen_id := (v_candidate ->> 'user_id')::uuid;
                        v_new_pos := v_pos;
                        EXIT;
                    END IF;
                    v_was_skip := true;
                END LOOP;

                IF v_chosen_id IS NOT NULL THEN
                    NEW.assigned_to := v_chosen_id;

                    UPDATE public.crm_round_robin_config
                       SET current_position = v_new_pos
                     WHERE id = v_rr.id;

                    INSERT INTO public.crm_round_robin_audit
                        (org_id, lead_id, assigned_to, position_at_assignment, was_skip)
                    VALUES
                        (NEW.org_id, NEW.id, v_chosen_id, v_new_pos, v_was_skip);
                END IF;
            END IF;
        END IF;
    END IF;

    -- ------------------------------------------------------------------
    -- Initial Contact task (SLA)
    -- ------------------------------------------------------------------
    SELECT * INTO v_sla
    FROM public.crm_sla_config
    WHERE org_id = NEW.org_id AND is_active = true
    LIMIT 1;

    IF FOUND THEN
        v_deadline := public.crm_calc_business_hour_deadline(
            NEW.created_at,
            v_sla.sla_hours,
            v_sla.business_hours_start,
            v_sla.business_hours_end,
            v_sla.business_days,
            v_sla.timezone
        );

        INSERT INTO public.lead_tasks (
            lead_id, title, description, task_type, due_date, priority,
            assigned_to, completed, created_by
        ) VALUES (
            NEW.id,
            'Initial Contact — ' || TRIM(COALESCE(NEW.first_name,'') || ' ' || COALESCE(NEW.last_name,'')),
            'SLA: Make initial contact within ' || v_sla.sla_hours || ' business hours.',
            'call',
            v_deadline,
            'high',
            NEW.assigned_to,
            false,
            NEW.assigned_to
        )
        RETURNING id INTO v_task_id;

        -- Update next_followup_at for dashboard display
        NEW.next_followup_at := v_deadline;
    END IF;

    -- ------------------------------------------------------------------
    -- Cadence enrollment (default cadence)
    -- ------------------------------------------------------------------
    SELECT * INTO v_cad
    FROM public.crm_follow_up_cadences
    WHERE org_id = NEW.org_id AND is_default = true AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;

    IF FOUND AND jsonb_array_length(v_cad.steps) > 0 THEN
        v_step := v_cad.steps -> 0;
        v_delay_hours := COALESCE((v_step ->> 'delay_hours')::numeric, 24);

        INSERT INTO public.crm_lead_cadence_state (
            lead_id, cadence_id, org_id, current_step,
            next_action_at, paused, paused_reason, completed_at
        ) VALUES (
            NEW.id, v_cad.id, NEW.org_id, 0,
            NEW.created_at + (v_delay_hours || ' hours')::interval,
            false, NULL, NULL
        )
        ON CONFLICT (lead_id, cadence_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_submissions_automation ON public.lead_submissions;
CREATE TRIGGER trg_lead_submissions_automation
    BEFORE INSERT ON public.lead_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_lead_after_insert_automation();

-- Note: BEFORE trigger so the NEW.assigned_to and NEW.next_followup_at writes
-- are persisted into the row we're inserting (no second UPDATE required).
-- Audit / task / cadence rows are SECURITY DEFINER inserts that still fire.

-- ----------------------------------------------------------------------------
-- 6. Auto-pause cadence on stage transition to won/lost
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_lead_stage_cadence_pause()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
        IF NEW.pipeline_stage IN ('won','lost') THEN
            UPDATE public.crm_lead_cadence_state
               SET paused = true,
                   paused_reason = 'stage_' || NEW.pipeline_stage
             WHERE lead_id = NEW.id
               AND paused = false
               AND completed_at IS NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_submissions_cadence_pause ON public.lead_submissions;
CREATE TRIGGER trg_lead_submissions_cadence_pause
    AFTER UPDATE OF pipeline_stage ON public.lead_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_lead_stage_cadence_pause();

-- ----------------------------------------------------------------------------
-- 6b. Auto-pause cadence on reply / meeting (last_contacted_at transition)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_lead_contact_cadence_pause()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (OLD.last_contacted_at IS NULL AND NEW.last_contacted_at IS NOT NULL)
       OR (NEW.last_contacted_at IS NOT NULL
           AND NEW.last_contacted_at IS DISTINCT FROM OLD.last_contacted_at) THEN
        UPDATE public.crm_lead_cadence_state
           SET paused = true,
               paused_reason = 'lead_contacted'
         WHERE lead_id = NEW.id
           AND paused = false
           AND completed_at IS NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_submissions_contact_cadence_pause ON public.lead_submissions;
CREATE TRIGGER trg_lead_submissions_contact_cadence_pause
    AFTER UPDATE OF last_contacted_at ON public.lead_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_lead_contact_cadence_pause();

-- When a meeting activity is logged we also pause the cadence. This matches
-- the Sales Plan 2026 rule "cadence pauses on reply, meeting booked, or
-- Won/Lost stage change." The caller is whatever service logged the activity
-- (meeting-scheduled webhook, QuickLog, etc.).
CREATE OR REPLACE FUNCTION public.crm_activity_cadence_pause()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.activity_type IN ('meeting', 'presentation') AND NEW.lead_id IS NOT NULL THEN
        UPDATE public.crm_lead_cadence_state
           SET paused = true,
               paused_reason = 'activity_' || NEW.activity_type
         WHERE lead_id = NEW.lead_id
           AND paused = false
           AND completed_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_activities_cadence_pause ON public.lead_activities;
CREATE TRIGGER trg_lead_activities_cadence_pause
    AFTER INSERT ON public.lead_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_activity_cadence_pause();

-- ----------------------------------------------------------------------------
-- 7. Best-effort pg_cron job for sla-breach-scan
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron')
       AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'crm-sla-breach-scan',
            '*/15 * * * *',
            $cmd$
              SELECT
                CASE WHEN current_setting('app.supabase_service_role_key', true) IS NULL THEN NULL
                ELSE net.http_post(
                  url := current_setting('app.supabase_functions_url', true) || '/sla-breach-scan',
                  headers := jsonb_build_object(
                    'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true),
                    'Content-Type', 'application/json'
                  ),
                  body := '{}'::jsonb
                ) END
            $cmd$
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron scheduling skipped (extension not enabled or net helper missing): %', SQLERRM;
END
$$;

COMMIT;

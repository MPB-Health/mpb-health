-- ============================================================================
-- CRM rebuild — Phase 6 — Doc-alignment patch (Changes-to-the-CRM v2026-05-13)
-- ============================================================================
-- Closes the gaps surfaced by the second-revision spec doc:
--
-- 1. Section 7 — `crm_register_engagement_signal` no longer bumps
--    `last_touched_at`. Inbound events are excluded from Last Touched
--    per the Round 3 Addendum.
--
-- 2. Section 11 — Cancellation Calls become a distinct activity_subtype
--    inside Lead Communication. The trigger flags subtype `cancellation`
--    when the activity has `call_outcome = 'cancellation'` or its
--    metadata is tagged accordingly.
--
-- 3. Section 12 — Performance Lag scan now (a) excludes Special Projects
--    rows from the rep_count, (b) walks back exactly 5 business days
--    (Mon–Fri only) instead of 5 calendar days, and (c) excludes reps
--    with <5 business days of activity from baseline + lag eval.
--
-- 4. Section 5 — Day-30 Nurture aging job. Working/Engaged leads with no
--    engagement signal AND no opt-out signal for 30 days move to Nurture.
--    Wrapped as `crm_age_to_nurture(p_org_id)` so the
--    `crm-scheduled-jobs` edge function can call it daily.
--
-- 5. Section 1 — Concierge handoff log. Won — Enrolled now writes a row
--    into `crm_concierge_handoff_log` so Concierge has a queue to work
--    from instead of a silent timestamp.
--
-- 6. Section 2e — Pipeline movement view + stalled-in-stage RPC. Powers
--    the new Reports skeleton.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Engagement signal — drop the last_touched_at bump (Section 7 fix)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_register_engagement_signal(
    p_lead_id uuid,
    p_signal_type text DEFAULT 'reply'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_lead public.lead_submissions%ROWTYPE;
BEGIN
    SELECT * INTO v_lead FROM public.lead_submissions WHERE id = p_lead_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'lead % not found', p_lead_id USING ERRCODE = 'no_data_found';
    END IF;

    UPDATE public.crm_lead_cadence_state s
       SET paused = true,
           paused_reason = COALESCE(s.paused_reason, 'engagement_detected:' || p_signal_type),
           updated_at = now()
      FROM public.crm_follow_up_cadences c
     WHERE s.cadence_id = c.id
       AND s.lead_id = p_lead_id
       AND s.paused = false
       AND s.completed_at IS NULL
       AND c.halt_on_engagement = true;

    -- Per Section 7 + Round 3 Addendum: inbound events do NOT bump
    -- last_touched_at. The activity timeline records the inbound; the
    -- "rep moved on this lead" clock only ticks on rep-initiated work.
    UPDATE public.lead_submissions
       SET engagement_detected_at = COALESCE(engagement_detected_at, now()),
           pipeline_stage = CASE
               WHEN pipeline_stage IN ('quoted', 'working') THEN 'engaged'
               ELSE pipeline_stage
           END,
           stage_changed_at = CASE
               WHEN pipeline_stage IN ('quoted', 'working') THEN now()
               ELSE stage_changed_at
           END,
           updated_at = now()
     WHERE id = p_lead_id;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'crm_activities'
    ) THEN
        INSERT INTO public.crm_activities (
            org_id, lead_id, activity_type, subject, description,
            created_by, created_at, updated_at
        ) VALUES (
            v_lead.org_id, p_lead_id, 'other',
            'Engagement signal: ' || p_signal_type,
            'Cadence halted by halt_on_engagement; lead routed to engaged.',
            COALESCE(v_lead.assigned_to, '00000000-0000-0000-0000-000000000000'::uuid),
            now(), now()
        );
    END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Cancellation Calls — distinct subtype on the daily-log event
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_dl_emit_from_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_subtype text;
    v_section text;
    v_lead_stage text;
BEGIN
    IF NEW.created_by IS NULL OR NEW.created_by = '00000000-0000-0000-0000-000000000000'::uuid THEN
        RETURN NEW;
    END IF;

    -- Section 8 — inbound calls are logged but excluded from rep activity
    -- counts so they don't inflate the Daily Log totals.
    IF NEW.call_type = 'inbound' THEN
        RETURN NEW;
    END IF;

    -- Section 11 — Cancellation Calls
    -- Auto-classify a call as "cancellation" when:
    --   • call_outcome = 'cancellation' (rep-marked)
    --   • metadata.is_cancellation = true (explicit flag)
    --   • the linked lead is currently 'lost' or moving toward it
    v_subtype := NULL;
    IF NEW.activity_type = 'call' THEN
        IF NEW.call_outcome = 'cancellation'
           OR COALESCE((NEW.metadata ->> 'is_cancellation')::boolean, false) THEN
            v_subtype := 'cancellation';
        END IF;
        IF v_subtype IS NULL AND NEW.lead_id IS NOT NULL THEN
            SELECT pipeline_stage INTO v_lead_stage
              FROM public.lead_submissions WHERE id = NEW.lead_id;
            IF v_lead_stage = 'lost' THEN
                v_subtype := 'cancellation';
            END IF;
        END IF;
        IF v_subtype IS NULL AND NEW.call_outcome = 'callback_requested' THEN
            v_subtype := 'callback_requested';
        END IF;
    END IF;

    v_section := public.crm_classify_log_section(NEW.activity_type, 'crm_activities');

    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date,
        source, source_id,
        section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at
    ) VALUES (
        NEW.org_id,
        NEW.created_by,
        COALESCE(NEW.completed_at, NEW.created_at)::date,
        'crm_activities',
        NEW.id,
        v_section,
        NEW.activity_type,
        v_subtype,
        NEW.subject,
        jsonb_build_object(
            'call_outcome', NEW.call_outcome,
            'call_duration_seconds', NEW.call_duration_seconds,
            'lead_id', NEW.lead_id,
            'related_to_type', NEW.related_to_type,
            'related_to_id', NEW.related_to_id,
            'is_cancellation', (v_subtype = 'cancellation')
        ),
        false,
        COALESCE(NEW.completed_at, NEW.created_at)
    );
    RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Performance Lag scan — Mon–Fri window + Special Projects exclusion +
--    new-hire exclusion (Section 12)
-- ----------------------------------------------------------------------------

-- Returns the date `n` business days back from `from_date`, inclusive.
-- e.g. 5 business days back from a Monday returns the previous Monday.
CREATE OR REPLACE FUNCTION public.crm_business_days_back(from_date date, n integer)
RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    d date := from_date;
    counted int := 0;
BEGIN
    WHILE counted < n LOOP
        d := d - 1;
        IF EXTRACT(ISODOW FROM d) < 6 THEN
            counted := counted + 1;
        END IF;
    END LOOP;
    RETURN d;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_scan_performance_lag(p_org_id uuid)
RETURNS TABLE(
    user_id uuid,
    window_start date,
    window_end date,
    rep_count integer,
    team_avg numeric,
    top_performer_count integer,
    alert_fired boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_today date := current_date;
    -- Round to most recent business day so a Monday morning scan still
    -- evaluates the prior Mon–Fri window.
    v_window_end date :=
        CASE EXTRACT(ISODOW FROM v_today)::int
            WHEN 6 THEN v_today - 1     -- Sat → Fri
            WHEN 7 THEN v_today - 2     -- Sun → Fri
            ELSE v_today
        END;
    v_window_start date := public.crm_business_days_back(v_window_end + 1, 5);
    v_threshold numeric := 0.80;
    v_quiet_period interval := interval '7 days';
    rec record;
    v_rep_count int;
    v_team_avg numeric;
    v_top_count int;
    v_quiet_until timestamptz;
    v_should_fire boolean;
    v_min_business_days int := 5;
BEGIN
    FOR rec IN
        SELECT m.user_id
          FROM public.org_memberships m
         WHERE m.org_id = p_org_id
           AND m.status = 'active'
           AND m.role IN ('rep', 'admin', 'manager', 'owner', 'agent')
    LOOP
        -- New-hire exclusion (Section 12): need at least 5 distinct
        -- business days of any activity before lag-eval applies.
        IF (
            SELECT COUNT(DISTINCT log_date)
              FROM public.crm_daily_log_events
             WHERE org_id = p_org_id
               AND user_id = rec.user_id
               AND section <> 'special_projects'
               AND EXTRACT(ISODOW FROM log_date) < 6
        ) < v_min_business_days THEN
            CONTINUE;
        END IF;

        -- Section 12: Special Projects time does NOT count toward the
        -- activity score.
        SELECT COALESCE(COUNT(*), 0) INTO v_rep_count
          FROM public.crm_daily_log_events e
         WHERE e.org_id = p_org_id
           AND e.user_id = rec.user_id
           AND e.section <> 'special_projects'
           AND e.log_date BETWEEN v_window_start AND v_window_end;

        SELECT COALESCE(AVG(cnt), 0) INTO v_team_avg
          FROM (
            SELECT COUNT(*) AS cnt
              FROM public.crm_daily_log_events e2
             WHERE e2.org_id = p_org_id
               AND e2.user_id <> rec.user_id
               AND e2.section <> 'special_projects'
               AND e2.log_date BETWEEN v_window_start AND v_window_end
             GROUP BY e2.user_id
          ) sub;

        SELECT COALESCE(MAX(cnt), 0) INTO v_top_count
          FROM (
            SELECT COUNT(*) AS cnt
              FROM public.crm_daily_log_events e3
             WHERE e3.org_id = p_org_id
               AND e3.section <> 'special_projects'
               AND e3.log_date BETWEEN v_window_start AND v_window_end
             GROUP BY e3.user_id
          ) tops;

        v_should_fire := (v_team_avg > 0)
                         AND (v_rep_count::numeric < v_team_avg * v_threshold);

        IF v_should_fire THEN
            IF EXISTS (
                SELECT 1
                  FROM public.crm_performance_alert_log a
                 WHERE a.org_id = p_org_id
                   AND a.user_id = rec.user_id
                   AND a.quiet_until > now()
            ) THEN
                v_should_fire := false;
            ELSE
                v_quiet_until := now() + v_quiet_period;
                INSERT INTO public.crm_performance_alert_log (
                    org_id, user_id,
                    window_start, window_end,
                    rep_count, team_avg, top_performer_count,
                    fired_at, quiet_until, payload
                ) VALUES (
                    p_org_id, rec.user_id,
                    v_window_start, v_window_end,
                    v_rep_count, v_team_avg, v_top_count,
                    now(), v_quiet_until,
                    jsonb_build_object(
                        'threshold_pct', 80,
                        'window_business_days', 5,
                        'quiet_days', 7,
                        'baseline_kind', 'team_avg_excl_self',
                        'metric', 'activity_count_excl_special_projects'
                    )
                );
            END IF;
        END IF;

        user_id := rec.user_id;
        window_start := v_window_start;
        window_end := v_window_end;
        rep_count := v_rep_count;
        team_avg := v_team_avg;
        top_performer_count := v_top_count;
        alert_fired := v_should_fire;
        RETURN NEXT;
    END LOOP;
    RETURN;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Day-30 Nurture aging (Section 5 / Round 2)
-- ----------------------------------------------------------------------------
-- Working / Engaged leads with no engagement signal AND no opt-out for
-- the past 30 days transition to Nurture (Stage 7) and route to the
-- Nurture Leads subsection.
CREATE OR REPLACE FUNCTION public.crm_age_to_nurture(p_org_id uuid)
RETURNS TABLE(lead_id uuid, prior_stage text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    WITH targets AS (
        SELECT id, pipeline_stage
          FROM public.lead_submissions
         WHERE org_id = p_org_id
           AND pipeline_stage IN ('working', 'engaged')
           AND COALESCE(do_not_contact, false) = false
           AND COALESCE(opt_out_detected_at, '-infinity'::timestamptz) < (now() - interval '90 days')
           AND engagement_detected_at IS NULL
           AND COALESCE(stage_changed_at, created_at) < (now() - interval '30 days')
    ),
    updated AS (
        UPDATE public.lead_submissions ls
           SET pipeline_stage = 'nurture',
               workflow_subsection = 'nurture',
               stage_changed_at = now(),
               updated_at = now()
          FROM targets t
         WHERE ls.id = t.id
        RETURNING ls.id, t.pipeline_stage AS prior_stage
    )
    SELECT u.id, u.prior_stage FROM updated u;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_age_to_nurture(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_age_to_nurture(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. Concierge handoff log (Section 1)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_concierge_handoff_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    lead_id uuid NOT NULL REFERENCES public.lead_submissions(id) ON DELETE CASCADE,
    handoff_at timestamptz NOT NULL DEFAULT now(),
    received_at timestamptz,
    received_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    notes text,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_concierge_handoff_org ON public.crm_concierge_handoff_log(org_id, handoff_at DESC);
CREATE INDEX IF NOT EXISTS idx_concierge_handoff_lead ON public.crm_concierge_handoff_log(lead_id);

ALTER TABLE public.crm_concierge_handoff_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS concierge_handoff_select ON public.crm_concierge_handoff_log;
DROP POLICY IF EXISTS concierge_handoff_insert ON public.crm_concierge_handoff_log;
DROP POLICY IF EXISTS concierge_handoff_update ON public.crm_concierge_handoff_log;
DROP POLICY IF EXISTS concierge_handoff_service ON public.crm_concierge_handoff_log;

CREATE POLICY concierge_handoff_select ON public.crm_concierge_handoff_log
    FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY concierge_handoff_insert ON public.crm_concierge_handoff_log
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(org_id));
CREATE POLICY concierge_handoff_update ON public.crm_concierge_handoff_log
    FOR UPDATE TO authenticated
    USING (public.is_org_member(org_id))
    WITH CHECK (public.is_org_member(org_id));
CREATE POLICY concierge_handoff_service ON public.crm_concierge_handoff_log
    FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.crm_concierge_handoff_log TO authenticated;
GRANT ALL ON public.crm_concierge_handoff_log TO service_role;

-- Trigger: every transition into 'won' inserts a concierge handoff row.
CREATE OR REPLACE FUNCTION public.crm_concierge_handoff_emit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.pipeline_stage = 'won'
       AND COALESCE(OLD.pipeline_stage, '') <> 'won' THEN
        INSERT INTO public.crm_concierge_handoff_log (
            org_id, lead_id, handoff_at, payload
        ) VALUES (
            NEW.org_id, NEW.id, now(),
            jsonb_build_object(
                'prior_stage', OLD.pipeline_stage,
                'assigned_to', NEW.assigned_to,
                'enrollment_approved_at', NEW.enrollment_approved_at
            )
        )
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_concierge_handoff ON public.lead_submissions;
CREATE TRIGGER trg_crm_concierge_handoff
    AFTER UPDATE OF pipeline_stage ON public.lead_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_concierge_handoff_emit();

-- ----------------------------------------------------------------------------
-- 6. Reports skeleton — Pipeline movement view + stalled-in-stage RPC
-- ----------------------------------------------------------------------------

-- Pipeline movement view: per-stage counts plus 7-day delta for the
-- Reports → Pipeline Movement page.
CREATE OR REPLACE VIEW public.crm_v_pipeline_movement AS
SELECT
    ls.org_id,
    ls.pipeline_stage,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE ls.created_at >= now() - interval '7 days') AS new_last_7d,
    COUNT(*) FILTER (WHERE ls.stage_changed_at >= now() - interval '7 days') AS advanced_last_7d,
    COUNT(*) FILTER (WHERE ls.pipeline_stage = 'won' AND ls.stage_changed_at >= now() - interval '7 days') AS won_last_7d,
    COUNT(*) FILTER (WHERE ls.pipeline_stage = 'lost' AND ls.stage_changed_at >= now() - interval '7 days') AS lost_last_7d,
    COUNT(*) FILTER (WHERE ls.pipeline_stage = 'nurture' AND ls.stage_changed_at >= now() - interval '7 days') AS nurtured_last_7d
FROM public.lead_submissions ls
GROUP BY ls.org_id, ls.pipeline_stage;

GRANT SELECT ON public.crm_v_pipeline_movement TO authenticated, service_role;

-- Stalled-in-stage alerts: leads that have been in a non-terminal stage
-- longer than the per-stage SLA hours.
CREATE OR REPLACE FUNCTION public.crm_scan_stalled_in_stage(p_org_id uuid)
RETURNS TABLE(
    lead_id uuid,
    pipeline_stage text,
    stage_changed_at timestamptz,
    hours_in_stage numeric,
    sla_hours integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    WITH stage_sla AS (
        SELECT * FROM (VALUES
            ('new', 1),                 -- round-robin should fire fast
            ('quoted', 24),             -- 24h SLA per Round 2
            ('working', 168),           -- 7 days
            ('engaged', 168),           -- 7 days
            ('application_in_progress', 240) -- 10 days
        ) AS s(stage, hours)
    )
    SELECT
        ls.id AS lead_id,
        ls.pipeline_stage,
        ls.stage_changed_at,
        EXTRACT(EPOCH FROM (now() - COALESCE(ls.stage_changed_at, ls.created_at))) / 3600.0 AS hours_in_stage,
        ss.hours::int AS sla_hours
      FROM public.lead_submissions ls
      JOIN stage_sla ss ON ss.stage = ls.pipeline_stage
     WHERE ls.org_id = p_org_id
       AND COALESCE(ls.do_not_contact, false) = false
       AND COALESCE(ls.stage_changed_at, ls.created_at) < (now() - (ss.hours || ' hours')::interval)
$$;

-- Application started tracking — needed for the Application drop-off
-- report (Section 2e). Stamped on entry into 'application_in_progress'.
ALTER TABLE public.lead_submissions
    ADD COLUMN IF NOT EXISTS application_started_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_lead_submissions_app_started
    ON public.lead_submissions(application_started_at)
    WHERE application_started_at IS NOT NULL;

-- Backfill: any lead currently / previously in app stage gets stamped
-- with stage_changed_at as a best-effort starting point.
UPDATE public.lead_submissions
   SET application_started_at = COALESCE(stage_changed_at, created_at)
 WHERE pipeline_stage = 'application_in_progress'
   AND application_started_at IS NULL;

-- Trigger: stamp on first entry into application_in_progress.
CREATE OR REPLACE FUNCTION public.crm_lead_app_started_stamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.pipeline_stage = 'application_in_progress'
       AND COALESCE(OLD.pipeline_stage, '') <> 'application_in_progress'
       AND NEW.application_started_at IS NULL THEN
        NEW.application_started_at := now();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_lead_app_started ON public.lead_submissions;
CREATE TRIGGER trg_crm_lead_app_started
    BEFORE UPDATE OF pipeline_stage ON public.lead_submissions
    FOR EACH ROW EXECUTE FUNCTION public.crm_lead_app_started_stamp();

-- Application drop-off helper — Stage 5 → withdrawn with no Won transition.
CREATE OR REPLACE VIEW public.crm_v_application_dropoff AS
SELECT
    ls.org_id,
    DATE_TRUNC('week', ls.application_started_at) AS week_starting,
    COUNT(*) FILTER (WHERE ls.pipeline_stage = 'application_in_progress') AS app_in_progress,
    COUNT(*) FILTER (WHERE ls.pipeline_stage = 'lost') AS app_to_lost,
    COUNT(*) FILTER (WHERE ls.pipeline_stage = 'won') AS app_to_won,
    COUNT(*) FILTER (WHERE ls.pipeline_stage = 'nurture') AS app_to_nurture
FROM public.lead_submissions ls
WHERE ls.application_started_at IS NOT NULL
GROUP BY ls.org_id, DATE_TRUNC('week', ls.application_started_at);

GRANT SELECT ON public.crm_v_application_dropoff TO authenticated, service_role;

-- Conversion-by-source view.
CREATE OR REPLACE VIEW public.crm_v_conversion_by_source AS
SELECT
    ls.org_id,
    COALESCE(ls.lead_source, 'unknown') AS lead_source,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE ls.pipeline_stage = 'won') AS won,
    COUNT(*) FILTER (WHERE ls.pipeline_stage = 'lost') AS lost,
    COUNT(*) FILTER (WHERE ls.pipeline_stage = 'nurture') AS nurtured,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE ls.pipeline_stage = 'won')::numeric
              / NULLIF(COUNT(*), 0),
        1
    ) AS win_rate_pct
FROM public.lead_submissions ls
GROUP BY ls.org_id, ls.lead_source;

GRANT SELECT ON public.crm_v_conversion_by_source TO authenticated, service_role;

COMMIT;

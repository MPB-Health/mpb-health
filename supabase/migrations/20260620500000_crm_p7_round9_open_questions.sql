-- ============================================================================
-- CRM rebuild — Phase 7 / Round 9 (Open Questions resolved + flexibility)
-- ============================================================================
-- Spec ("Items to Confirm Before Build"):
--
--   1. Daily Log accordion: single-expand (one section at a time) or
--      multi-expand (any number open)? Default assumption: multi-expand.
--   2. Cancellation Calls placement: confirmed under Lead Communication.
--   3. Special Projects: own top-level section (vs nested under Lead
--      Communication or Activities). Implementer assumption: own section.
--   4. Performance metric definition.
--   5. Performance baseline — average / median / top-performer.
--   6. Performance trigger window — 7-day rolling vs weekly snapshot vs
--      30-day rolling.
--
-- Implementer decisions shipped to date and confirmed in this round:
--
--   1. Accordion = multi-expand (default). This migration ALSO ships a
--      per-org `crm_daily_log_ui_config.accordion_mode` toggle so an
--      admin can flip to single-expand without code changes.
--   2. Cancellation Calls remain under Lead Communication — no change.
--   3. Special Projects remains its own top-level section — no change.
--   4. Performance metric default = `activity_count` (rows in
--      crm_daily_log_events excluding Special Projects). Configurable
--      via the new `crm_performance_lag_config.metric_kind` field with
--      alternates `leads_worked` and `time_logged_minutes` ready to
--      flip on.
--   5. Performance baseline default = `team_avg_excl_self`. Configurable
--      via `baseline_kind` with alternates `team_median_excl_self` and
--      `top_performer_pct` (with `top_performer_pct_target` knob).
--   6. Performance window default = 7-day rolling. Configurable via
--      `window_kind` (`rolling` vs `snapshot_weekly`) and the existing
--      `window_days` knob (already supports 30 for the alternate).
--
-- This migration is purely additive — every default-row update keeps the
-- shipped behaviour the same as Round 8.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. crm_daily_log_ui_config — per-org Daily Log UI knobs (accordion mode)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_daily_log_ui_config (
    org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    accordion_mode text NOT NULL DEFAULT 'multi',
    default_collapsed boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT crm_daily_log_ui_config_accordion_chk CHECK (accordion_mode IN ('single','multi'))
);

ALTER TABLE public.crm_daily_log_ui_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_daily_log_ui_config_select ON public.crm_daily_log_ui_config;
CREATE POLICY crm_daily_log_ui_config_select ON public.crm_daily_log_ui_config
    FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_daily_log_ui_config_modify ON public.crm_daily_log_ui_config;
CREATE POLICY crm_daily_log_ui_config_modify ON public.crm_daily_log_ui_config
    FOR ALL USING (public.is_org_admin(org_id))
              WITH CHECK (public.is_org_admin(org_id));

CREATE OR REPLACE FUNCTION public.crm_daily_log_ui_config_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_crm_daily_log_ui_config_touch ON public.crm_daily_log_ui_config;
CREATE TRIGGER trg_crm_daily_log_ui_config_touch
    BEFORE UPDATE ON public.crm_daily_log_ui_config
    FOR EACH ROW EXECUTE FUNCTION public.crm_daily_log_ui_config_touch_updated_at();

INSERT INTO public.crm_daily_log_ui_config (org_id)
SELECT id FROM public.organizations
ON CONFLICT (org_id) DO NOTHING;

-- New-org seed
CREATE OR REPLACE FUNCTION public.crm_daily_log_ui_config_seed_org()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $function$
BEGIN
    INSERT INTO public.crm_daily_log_ui_config (org_id) VALUES (NEW.id) ON CONFLICT (org_id) DO NOTHING;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_crm_daily_log_ui_config_seed_org ON public.organizations;
CREATE TRIGGER trg_crm_daily_log_ui_config_seed_org
    AFTER INSERT ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.crm_daily_log_ui_config_seed_org();

COMMENT ON TABLE public.crm_daily_log_ui_config IS
    'Round 9: per-org Daily Log UI knobs. accordion_mode defaults to ''multi'' per the implementer decision; flip to ''single'' for one-section-at-a-time behaviour.';

-- ---------------------------------------------------------------------------
-- 2. Extend crm_performance_lag_config with metric / baseline / window kinds
-- ---------------------------------------------------------------------------

ALTER TABLE public.crm_performance_lag_config
    ADD COLUMN IF NOT EXISTS metric_kind text NOT NULL DEFAULT 'activity_count',
    ADD COLUMN IF NOT EXISTS baseline_kind text NOT NULL DEFAULT 'team_avg_excl_self',
    ADD COLUMN IF NOT EXISTS top_performer_pct_target integer NOT NULL DEFAULT 80,
    ADD COLUMN IF NOT EXISTS window_kind text NOT NULL DEFAULT 'rolling';

DO $$
BEGIN
    -- CHECK constraints (idempotent — drop first if present from a prior run).
    BEGIN
        ALTER TABLE public.crm_performance_lag_config
            DROP CONSTRAINT IF EXISTS crm_performance_lag_config_metric_chk,
            DROP CONSTRAINT IF EXISTS crm_performance_lag_config_baseline_chk,
            DROP CONSTRAINT IF EXISTS crm_performance_lag_config_top_target_chk,
            DROP CONSTRAINT IF EXISTS crm_performance_lag_config_window_kind_chk;
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;

    ALTER TABLE public.crm_performance_lag_config
        ADD CONSTRAINT crm_performance_lag_config_metric_chk
            CHECK (metric_kind IN ('activity_count','leads_worked','time_logged_minutes')),
        ADD CONSTRAINT crm_performance_lag_config_baseline_chk
            CHECK (baseline_kind IN ('team_avg_excl_self','team_median_excl_self','top_performer_pct')),
        ADD CONSTRAINT crm_performance_lag_config_top_target_chk
            CHECK (top_performer_pct_target BETWEEN 5 AND 100),
        ADD CONSTRAINT crm_performance_lag_config_window_kind_chk
            CHECK (window_kind IN ('rolling','snapshot_weekly'));
END$$;

COMMENT ON COLUMN public.crm_performance_lag_config.metric_kind IS
    'Round 9: performance metric definition. activity_count (default) = rows in crm_daily_log_events; leads_worked = distinct leads touched; time_logged_minutes = SUM of activity duration (calls + special projects time when included).';
COMMENT ON COLUMN public.crm_performance_lag_config.baseline_kind IS
    'Round 9: baseline shape. team_avg_excl_self (default) = mean of peer counts; team_median_excl_self = median of peer counts; top_performer_pct = MAX peer count, with the alert firing when the rep is below top_performer_pct_target % of it.';
COMMENT ON COLUMN public.crm_performance_lag_config.top_performer_pct_target IS
    'Round 9: only used when baseline_kind = top_performer_pct. Alert fires when rep_count < (top_performer_count * top_performer_pct_target / 100) * (1 - threshold_pct/100).';
COMMENT ON COLUMN public.crm_performance_lag_config.window_kind IS
    'Round 9: rolling (default — last window_days calendar days) vs snapshot_weekly (the previous full Mon–Sun week).';

-- ---------------------------------------------------------------------------
-- 3. crm_scan_performance_lag rewrite — honor metric / baseline / window kinds
-- ---------------------------------------------------------------------------

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
AS $function$
DECLARE
    v_today date := current_date;
    v_window_start date;
    v_window_end date;
    v_threshold numeric;
    v_quiet_period interval;
    v_config public.crm_performance_lag_config%ROWTYPE;
    rec record;
    v_rep_count int;
    v_team_avg numeric;
    v_team_median numeric;
    v_top_count int;
    v_baseline numeric;
    v_baseline_label text;
    v_quiet_until timestamptz;
    v_should_fire boolean;
    v_alert_id uuid;
    v_section_filter text;
BEGIN
    SELECT * INTO v_config FROM public.crm_performance_lag_config WHERE org_id = p_org_id;
    IF NOT FOUND THEN
        INSERT INTO public.crm_performance_lag_config (org_id) VALUES (p_org_id) RETURNING * INTO v_config;
    END IF;
    IF NOT v_config.is_enabled THEN RETURN; END IF;

    v_threshold := 1 - (v_config.threshold_pct::numeric / 100);
    v_quiet_period := make_interval(days => v_config.quiet_period_days);
    v_section_filter := CASE WHEN v_config.exclude_special_projects THEN 'special_projects' ELSE NULL END;

    -- Resolve window per window_kind.
    IF v_config.window_kind = 'snapshot_weekly' THEN
        -- Previous full Mon–Sun week. ISODOW: Mon=1..Sun=7.
        v_window_end := v_today - EXTRACT(ISODOW FROM v_today)::int;
        v_window_start := v_window_end - 6;
    ELSE
        v_window_end := v_today;
        v_window_start := v_window_end - (v_config.window_days - 1);
    END IF;

    FOR rec IN
        SELECT m.user_id FROM public.org_memberships m
         WHERE m.org_id = p_org_id AND m.status = 'active'
           AND m.role IN ('rep','admin','manager','owner','agent')
    LOOP
        -- New-hire grace
        IF (
            SELECT COUNT(DISTINCT log_date) FROM public.crm_daily_log_events
             WHERE org_id = p_org_id AND user_id = rec.user_id
               AND (v_section_filter IS NULL OR section <> v_section_filter)
        ) < v_config.min_business_days_in_system THEN
            CONTINUE;
        END IF;

        -- Per-rep metric
        v_rep_count := public.crm_perflag_metric_for_user(
            p_org_id, rec.user_id, v_window_start, v_window_end,
            v_config.metric_kind, v_section_filter
        );

        -- Peer counts (everyone except this rep)
        WITH peer AS (
            SELECT public.crm_perflag_metric_for_user(
                p_org_id, m2.user_id, v_window_start, v_window_end,
                v_config.metric_kind, v_section_filter
            ) AS cnt
              FROM public.org_memberships m2
             WHERE m2.org_id = p_org_id AND m2.status = 'active'
               AND m2.role IN ('rep','admin','manager','owner','agent')
               AND m2.user_id <> rec.user_id
        )
        SELECT
            COALESCE(AVG(cnt), 0)                     AS avg_cnt,
            COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY cnt), 0) AS med_cnt,
            COALESCE(MAX(cnt), 0)                     AS max_cnt
          INTO v_team_avg, v_team_median, v_top_count
          FROM peer;

        -- Pick the active baseline for the alert decision.
        IF v_config.baseline_kind = 'team_median_excl_self' THEN
            v_baseline := v_team_median;
            v_baseline_label := 'team_median_excl_self';
        ELSIF v_config.baseline_kind = 'top_performer_pct' THEN
            v_baseline := v_top_count::numeric * (v_config.top_performer_pct_target::numeric / 100);
            v_baseline_label := 'top_performer_pct';
        ELSE
            v_baseline := v_team_avg;
            v_baseline_label := 'team_avg_excl_self';
        END IF;

        v_should_fire := (v_baseline > 0)
                         AND (v_rep_count::numeric < v_baseline * v_threshold);

        IF v_should_fire THEN
            IF EXISTS (
                SELECT 1 FROM public.crm_performance_alert_log a
                 WHERE a.org_id = p_org_id AND a.user_id = rec.user_id AND a.quiet_until > now()
            ) THEN
                v_should_fire := false;
            ELSE
                v_quiet_until := now() + v_quiet_period;
                INSERT INTO public.crm_performance_alert_log (
                    org_id, user_id, window_start, window_end,
                    rep_count, team_avg, top_performer_count,
                    fired_at, quiet_until, payload
                ) VALUES (
                    p_org_id, rec.user_id, v_window_start, v_window_end,
                    v_rep_count, v_team_avg, v_top_count, now(), v_quiet_until,
                    jsonb_build_object(
                        'threshold_pct', v_config.threshold_pct,
                        'window_days', v_config.window_days,
                        'window_kind', v_config.window_kind,
                        'cadence', v_config.cadence,
                        'quiet_days', v_config.quiet_period_days,
                        'baseline_kind', v_baseline_label,
                        'baseline_value', v_baseline,
                        'team_median', v_team_median,
                        'top_performer_pct_target', v_config.top_performer_pct_target,
                        'metric_kind', v_config.metric_kind,
                        'metric', CASE
                            WHEN v_config.metric_kind = 'leads_worked' THEN 'leads_worked_excl_special_projects'
                            WHEN v_config.metric_kind = 'time_logged_minutes' THEN 'time_logged_minutes_total'
                            WHEN v_config.exclude_special_projects THEN 'activity_count_excl_special_projects'
                            ELSE 'activity_count_total'
                        END
                    )
                ) RETURNING id INTO v_alert_id;

                PERFORM public.crm_dispatch_performance_lag_notification(p_org_id, v_alert_id);
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
$function$;

COMMENT ON FUNCTION public.crm_scan_performance_lag(uuid) IS
    'Round 9: per-org Performance Lag scan with metric_kind / baseline_kind / window_kind. Calls crm_dispatch_performance_lag_notification on alert fire.';

-- ---------------------------------------------------------------------------
-- 4. Helper — compute the metric for one rep over the window
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_perflag_metric_for_user(
    p_org_id uuid,
    p_user_id uuid,
    p_window_start date,
    p_window_end date,
    p_metric_kind text,
    p_section_filter text -- 'special_projects' to exclude, NULL for all
)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $function$
    SELECT CASE p_metric_kind
        WHEN 'leads_worked' THEN
            (SELECT COUNT(DISTINCT (e.metadata ->> 'lead_id'))
               FROM public.crm_daily_log_events e
              WHERE e.org_id = p_org_id
                AND e.user_id = p_user_id
                AND (p_section_filter IS NULL OR e.section <> p_section_filter)
                AND (e.metadata ? 'lead_id')
                AND e.log_date BETWEEN p_window_start AND p_window_end)::int
        WHEN 'time_logged_minutes' THEN
            COALESCE(
                (SELECT SUM(time_minutes)::int
                   FROM public.crm_special_projects sp
                  WHERE sp.org_id = p_org_id AND sp.user_id = p_user_id
                    AND sp.log_date BETWEEN p_window_start AND p_window_end),
                0
            )
            +
            COALESCE(
                (SELECT SUM(COALESCE((e.metadata ->> 'call_duration_seconds')::int, 0))::int / 60
                   FROM public.crm_daily_log_events e
                  WHERE e.org_id = p_org_id AND e.user_id = p_user_id
                    AND e.activity_type = 'call'
                    AND e.log_date BETWEEN p_window_start AND p_window_end),
                0
            )
        ELSE
            (SELECT COUNT(*)
               FROM public.crm_daily_log_events e
              WHERE e.org_id = p_org_id
                AND e.user_id = p_user_id
                AND (p_section_filter IS NULL OR e.section <> p_section_filter)
                AND e.log_date BETWEEN p_window_start AND p_window_end)::int
    END;
$function$;

COMMENT ON FUNCTION public.crm_perflag_metric_for_user(uuid, uuid, date, date, text, text) IS
    'Round 9: shared metric extractor used by the Performance Lag scan. Returns the integer score for one rep over the window per metric_kind.';

COMMIT;

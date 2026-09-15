-- ============================================================================
-- CRM Round 10 — crm_scan_performance_lag honors spec_locked
-- ============================================================================
-- When `crm_performance_lag_config.spec_locked = true` (default), the
-- scan overrides the configurable knobs with the Section 12 / Round 6
-- Addendum spec values:
--
--   metric_kind                 := 'activity_count'
--   baseline_kind               := 'team_avg_excl_self'
--   window_kind                 := 'rolling'
--   exclude_special_projects    := true
--
-- All other config (threshold_pct, window_days, cadence, audience,
-- channels, quiet_period_days, min_business_days_in_system) remains
-- admin-configurable in either mode — the lock only covers the items
-- the spec explicitly froze.
-- ============================================================================

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
    v_metric_kind text;
    v_baseline_kind text;
    v_window_kind text;
    v_exclude_special_projects boolean;
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

    -- Section 12 / Round 6 Addendum lock: when spec_locked is true,
    -- enforce the spec values for the items the spec froze. Everything
    -- else stays admin-configurable.
    IF v_config.spec_locked THEN
        v_metric_kind := 'activity_count';
        v_baseline_kind := 'team_avg_excl_self';
        v_window_kind := 'rolling';
        v_exclude_special_projects := true;
    ELSE
        v_metric_kind := v_config.metric_kind;
        v_baseline_kind := v_config.baseline_kind;
        v_window_kind := v_config.window_kind;
        v_exclude_special_projects := v_config.exclude_special_projects;
    END IF;

    v_threshold := 1 - (v_config.threshold_pct::numeric / 100);
    v_quiet_period := make_interval(days => v_config.quiet_period_days);
    v_section_filter := CASE WHEN v_exclude_special_projects THEN 'special_projects' ELSE NULL END;

    IF v_window_kind = 'snapshot_weekly' THEN
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
        IF (
            SELECT COUNT(DISTINCT log_date) FROM public.crm_daily_log_events
             WHERE org_id = p_org_id AND user_id = rec.user_id
               AND (v_section_filter IS NULL OR section <> v_section_filter)
        ) < v_config.min_business_days_in_system THEN
            CONTINUE;
        END IF;

        v_rep_count := public.crm_perflag_metric_for_user(
            p_org_id, rec.user_id, v_window_start, v_window_end,
            v_metric_kind, v_section_filter
        );

        WITH peer AS (
            SELECT public.crm_perflag_metric_for_user(
                p_org_id, m2.user_id, v_window_start, v_window_end,
                v_metric_kind, v_section_filter
            ) AS cnt
              FROM public.org_memberships m2
             WHERE m2.org_id = p_org_id AND m2.status = 'active'
               AND m2.role IN ('rep','admin','manager','owner','agent')
               AND m2.user_id <> rec.user_id
        )
        SELECT
            COALESCE(AVG(cnt), 0),
            COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY cnt), 0),
            COALESCE(MAX(cnt), 0)
          INTO v_team_avg, v_team_median, v_top_count
          FROM peer;

        IF v_baseline_kind = 'team_median_excl_self' THEN
            v_baseline := v_team_median;
            v_baseline_label := 'team_median_excl_self';
        ELSIF v_baseline_kind = 'top_performer_pct' THEN
            v_baseline := v_top_count::numeric * (v_config.top_performer_pct_target::numeric / 100);
            v_baseline_label := 'top_performer_pct';
        ELSE
            v_baseline := v_team_avg;
            v_baseline_label := 'team_avg_excl_self';
        END IF;

        v_should_fire := (v_baseline > 0) AND (v_rep_count::numeric < v_baseline * v_threshold);

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
                        'spec_locked', v_config.spec_locked,
                        'threshold_pct', v_config.threshold_pct,
                        'window_days', v_config.window_days,
                        'window_kind', v_window_kind,
                        'cadence', v_config.cadence,
                        'quiet_days', v_config.quiet_period_days,
                        'baseline_kind', v_baseline_label,
                        'baseline_value', v_baseline,
                        'team_median', v_team_median,
                        'top_performer_pct_target', v_config.top_performer_pct_target,
                        'metric_kind', v_metric_kind,
                        'exclude_special_projects', v_exclude_special_projects,
                        'metric', CASE
                            WHEN v_metric_kind = 'leads_worked' THEN 'leads_worked_excl_special_projects'
                            WHEN v_metric_kind = 'time_logged_minutes' THEN 'time_logged_minutes_total'
                            WHEN v_exclude_special_projects THEN 'activity_count_excl_special_projects'
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
    'Round 10 / Section 12: per-org Performance Lag scan. Honors spec_locked by overriding metric_kind, baseline_kind, window_kind, and exclude_special_projects with the Round 6 Addendum spec values.';

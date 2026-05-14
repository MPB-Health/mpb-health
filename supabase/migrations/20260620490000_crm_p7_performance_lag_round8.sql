-- ============================================================================
-- CRM rebuild — Phase 7 / Round 8 (Performance Lag notifications + config)
-- ============================================================================
-- Spec ("Reports — Performance Lag Alert"):
--
--   Trigger
--     - Build a lag-detection alert: fire when a team member's performance
--       falls 20% or more below the rest of the team.
--     - Notify both the affected rep and the admin.
--     - Notification channels: in-app notification + email; both default-on
--       (configurable in Settings).
--     - Default trigger cadence: daily check against a rolling 7-day window
--       (configurable in Settings).
--
-- Builds on Round 6 (`crm_scan_performance_lag` already implements the 20%
-- threshold + new-hire / Special Projects exclusions). This round delivers:
--
--   1. `crm_performance_lag_config` (new) — per-org settings: enabled,
--      threshold_pct, window_days, cadence, notify_rep, notify_admins,
--      email_channel, inapp_channel, quiet_period_days. One row per org,
--      seeded with the spec defaults.
--   2. `crm_performance_alert_log.notification_dispatched_at` — stamped
--      when notifications fire so a re-run of the scan never re-notifies
--      for the same alert.
--   3. `crm_dispatch_performance_lag_notification(p_org_id, p_alert_id)` —
--      writes notifications rows for the affected rep and every active
--      org admin/owner, honouring the per-org channel toggles. Sets
--      `channels` so the email subsystem picks them up.
--   4. Rewrites `crm_scan_performance_lag(p_org_id)` to:
--        - read the config row (creating one with defaults if missing);
--        - exit early when `is_enabled = false`;
--        - use a configurable rolling **calendar-day** window (default 7
--          per spec; Round 6's 5-business-day window remains available
--          by setting window_days=5);
--        - apply the configurable threshold (default 20% = 0.80x);
--        - call the dispatcher inline so notifications fan out
--          immediately on alert fire;
--        - keep new-hire exclusion + Special Projects exclusion rules
--          from Round 6.
--   5. Auto-seed a default config row when an org is created (trigger).
--   6. Schedule a daily pg_cron job invoking the existing
--      `crm-scheduled-jobs` edge function with `{ "job":
--      "performance_lag_scan" }`.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. crm_performance_lag_config
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_performance_lag_config (
    org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    is_enabled boolean NOT NULL DEFAULT true,
    threshold_pct integer NOT NULL DEFAULT 20,
    window_days integer NOT NULL DEFAULT 7,
    cadence text NOT NULL DEFAULT 'daily',
    notify_rep boolean NOT NULL DEFAULT true,
    notify_admins boolean NOT NULL DEFAULT true,
    email_channel boolean NOT NULL DEFAULT true,
    inapp_channel boolean NOT NULL DEFAULT true,
    quiet_period_days integer NOT NULL DEFAULT 7,
    min_business_days_in_system integer NOT NULL DEFAULT 5,
    exclude_special_projects boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT crm_performance_lag_config_threshold_chk CHECK (threshold_pct BETWEEN 5 AND 90),
    CONSTRAINT crm_performance_lag_config_window_chk CHECK (window_days BETWEEN 1 AND 90),
    CONSTRAINT crm_performance_lag_config_quiet_chk CHECK (quiet_period_days BETWEEN 0 AND 30),
    CONSTRAINT crm_performance_lag_config_min_business_days_chk CHECK (min_business_days_in_system BETWEEN 0 AND 30),
    CONSTRAINT crm_performance_lag_config_cadence_chk CHECK (cadence IN ('daily','weekday','weekly'))
);

ALTER TABLE public.crm_performance_lag_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_performance_lag_config_select ON public.crm_performance_lag_config;
CREATE POLICY crm_performance_lag_config_select ON public.crm_performance_lag_config
    FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_performance_lag_config_modify ON public.crm_performance_lag_config;
CREATE POLICY crm_performance_lag_config_modify ON public.crm_performance_lag_config
    FOR ALL USING (public.is_org_admin(org_id))
              WITH CHECK (public.is_org_admin(org_id));

CREATE OR REPLACE FUNCTION public.crm_performance_lag_config_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_performance_lag_config_touch ON public.crm_performance_lag_config;
CREATE TRIGGER trg_crm_performance_lag_config_touch
    BEFORE UPDATE ON public.crm_performance_lag_config
    FOR EACH ROW EXECUTE FUNCTION public.crm_performance_lag_config_touch_updated_at();

COMMENT ON TABLE public.crm_performance_lag_config IS
    'Round 8: per-org Performance Lag Alert config. One row per org. Defaults are spec-correct (20% threshold, 7-day rolling, daily cadence, in-app + email both on, both rep + admins notified). RLS: members read; admins write.';

-- Seed default rows for every existing org so the scan can always read a
-- config without a fallback path.
INSERT INTO public.crm_performance_lag_config (org_id)
SELECT id FROM public.organizations
ON CONFLICT (org_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. notification_dispatched_at on alert log
-- ---------------------------------------------------------------------------

ALTER TABLE public.crm_performance_alert_log
    ADD COLUMN IF NOT EXISTS notification_dispatched_at timestamptz;

CREATE INDEX IF NOT EXISTS crm_performance_alert_log_dispatch_idx
    ON public.crm_performance_alert_log(org_id, notification_dispatched_at);

COMMENT ON COLUMN public.crm_performance_alert_log.notification_dispatched_at IS
    'Round 8: timestamp the dispatcher sent in-app + email notifications for this alert. NULL = not yet dispatched.';

-- ---------------------------------------------------------------------------
-- 3. Auto-seed default config when a new org is created
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_performance_lag_config_seed_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    INSERT INTO public.crm_performance_lag_config (org_id)
    VALUES (NEW.id)
    ON CONFLICT (org_id) DO NOTHING;
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_crm_performance_lag_config_seed_org ON public.organizations;
CREATE TRIGGER trg_crm_performance_lag_config_seed_org
    AFTER INSERT ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.crm_performance_lag_config_seed_org();

-- ---------------------------------------------------------------------------
-- 4. Notification dispatcher
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_dispatch_performance_lag_notification(
    p_org_id uuid,
    p_alert_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_alert public.crm_performance_alert_log%ROWTYPE;
    v_config public.crm_performance_lag_config%ROWTYPE;
    v_channels text[];
    v_admin record;
    v_title text;
    v_body_rep text;
    v_body_admin text;
    v_action_url text := '/sales-daily-logs';
    v_metadata jsonb;
    v_pct integer;
BEGIN
    SELECT * INTO v_alert
      FROM public.crm_performance_alert_log
     WHERE id = p_alert_id AND org_id = p_org_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'alert % not found in org %', p_alert_id, p_org_id;
    END IF;

    -- Already dispatched? Don't double-fire.
    IF v_alert.notification_dispatched_at IS NOT NULL THEN
        RETURN;
    END IF;

    SELECT * INTO v_config
      FROM public.crm_performance_lag_config
     WHERE org_id = p_org_id;
    IF NOT FOUND THEN
        -- Insert defaults so subsequent runs work, but still proceed.
        INSERT INTO public.crm_performance_lag_config (org_id) VALUES (p_org_id)
        RETURNING * INTO v_config;
    END IF;

    -- Build channel list per config.
    v_channels := ARRAY[]::text[];
    IF v_config.inapp_channel THEN
        v_channels := array_append(v_channels, 'in_app');
    END IF;
    IF v_config.email_channel THEN
        v_channels := array_append(v_channels, 'email');
    END IF;

    -- If both channels are off, just stamp dispatched and exit so we
    -- don't log silent rows.
    IF cardinality(v_channels) = 0 THEN
        UPDATE public.crm_performance_alert_log
           SET notification_dispatched_at = now()
         WHERE id = p_alert_id;
        RETURN;
    END IF;

    -- Compute pct-behind for the message body.
    IF v_alert.team_avg > 0 THEN
        v_pct := GREATEST(
            0,
            (100 - ROUND((v_alert.rep_count::numeric / v_alert.team_avg) * 100))::integer
        );
    ELSE
        v_pct := 0;
    END IF;

    v_title := 'Performance lag alert';
    v_body_rep := 'Your activity over the last ' ||
        (v_alert.window_end - v_alert.window_start + 1) ||
        ' days is ~' || v_pct || '% below the team average. Open the Daily Log to see the breakdown.';
    v_body_admin := 'A team member is ~' || v_pct ||
        '% below the team average over the last ' ||
        (v_alert.window_end - v_alert.window_start + 1) ||
        ' days. Open the Daily Log Admin View for the per-rep breakdown.';

    v_metadata := jsonb_build_object(
        'alert_id', p_alert_id,
        'window_start', v_alert.window_start,
        'window_end', v_alert.window_end,
        'rep_count', v_alert.rep_count,
        'team_avg', v_alert.team_avg,
        'top_performer_count', v_alert.top_performer_count,
        'percent_behind', v_pct,
        'config', jsonb_build_object(
            'threshold_pct', v_config.threshold_pct,
            'window_days', v_config.window_days
        )
    );

    -- 1. Notify the affected rep.
    IF v_config.notify_rep THEN
        INSERT INTO public.notifications (
            org_id, user_id, title, body, icon, action_url, action_label,
            priority, category, channels, metadata
        ) VALUES (
            p_org_id, v_alert.user_id,
            v_title, v_body_rep, 'alert-triangle',
            v_action_url, 'Open Daily Log',
            'high', 'performance_lag', v_channels, v_metadata
        );
    END IF;

    -- 2. Notify every active org admin / owner.
    IF v_config.notify_admins THEN
        FOR v_admin IN
            SELECT m.user_id
              FROM public.org_memberships m
             WHERE m.org_id = p_org_id
               AND m.status = 'active'
               AND m.role IN ('admin', 'owner')
               AND m.user_id IS DISTINCT FROM v_alert.user_id
        LOOP
            INSERT INTO public.notifications (
                org_id, user_id, title, body, icon, action_url, action_label,
                priority, category, channels, metadata
            ) VALUES (
                p_org_id, v_admin.user_id,
                v_title, v_body_admin, 'alert-triangle',
                v_action_url || '?view=admin', 'Open Daily Log Admin View',
                'high', 'performance_lag', v_channels,
                v_metadata || jsonb_build_object('rep_user_id', v_alert.user_id)
            );
        END LOOP;
    END IF;

    UPDATE public.crm_performance_alert_log
       SET notification_dispatched_at = now()
     WHERE id = p_alert_id;
END;
$function$;

COMMENT ON FUNCTION public.crm_dispatch_performance_lag_notification(uuid, uuid) IS
    'Round 8: fan out a Performance Lag alert to the affected rep + every active admin/owner per the per-org config. Honors notify_rep / notify_admins / inapp_channel / email_channel toggles. Idempotent — only dispatches once per alert (notification_dispatched_at gate).';

-- ---------------------------------------------------------------------------
-- 5. Rebuild crm_scan_performance_lag with config + dispatch
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
    v_window_end date := v_today;
    v_threshold numeric;
    v_quiet_period interval;
    v_config public.crm_performance_lag_config%ROWTYPE;
    rec record;
    v_rep_count int;
    v_team_avg numeric;
    v_top_count int;
    v_quiet_until timestamptz;
    v_should_fire boolean;
    v_alert_id uuid;
    v_section_filter text;
BEGIN
    -- Read the per-org config (or seed with defaults if missing).
    SELECT * INTO v_config
      FROM public.crm_performance_lag_config
     WHERE org_id = p_org_id;
    IF NOT FOUND THEN
        INSERT INTO public.crm_performance_lag_config (org_id) VALUES (p_org_id)
        RETURNING * INTO v_config;
    END IF;

    -- Hard-disabled — return empty set.
    IF NOT v_config.is_enabled THEN
        RETURN;
    END IF;

    -- Derived params.
    v_threshold := 1 - (v_config.threshold_pct::numeric / 100);
    v_quiet_period := make_interval(days => v_config.quiet_period_days);
    v_window_start := v_window_end - (v_config.window_days - 1);
    v_section_filter := CASE
        WHEN v_config.exclude_special_projects THEN 'special_projects'
        ELSE NULL
    END;

    FOR rec IN
        SELECT m.user_id
          FROM public.org_memberships m
         WHERE m.org_id = p_org_id
           AND m.status = 'active'
           AND m.role IN ('rep', 'admin', 'manager', 'owner', 'agent')
    LOOP
        -- New-hire exclusion: need at least N distinct days of activity
        -- in the system before the rep is eligible. Round 6 used
        -- business days; Round 8 uses calendar days for parity with
        -- the rolling-7 window default.
        IF (
            SELECT COUNT(DISTINCT log_date)
              FROM public.crm_daily_log_events
             WHERE org_id = p_org_id
               AND user_id = rec.user_id
               AND (v_section_filter IS NULL OR section <> v_section_filter)
        ) < v_config.min_business_days_in_system THEN
            CONTINUE;
        END IF;

        SELECT COALESCE(COUNT(*), 0) INTO v_rep_count
          FROM public.crm_daily_log_events e
         WHERE e.org_id = p_org_id
           AND e.user_id = rec.user_id
           AND (v_section_filter IS NULL OR e.section <> v_section_filter)
           AND e.log_date BETWEEN v_window_start AND v_window_end;

        SELECT COALESCE(AVG(cnt), 0) INTO v_team_avg
          FROM (
            SELECT COUNT(*) AS cnt
              FROM public.crm_daily_log_events e2
             WHERE e2.org_id = p_org_id
               AND e2.user_id <> rec.user_id
               AND (v_section_filter IS NULL OR e2.section <> v_section_filter)
               AND e2.log_date BETWEEN v_window_start AND v_window_end
             GROUP BY e2.user_id
          ) sub;

        SELECT COALESCE(MAX(cnt), 0) INTO v_top_count
          FROM (
            SELECT COUNT(*) AS cnt
              FROM public.crm_daily_log_events e3
             WHERE e3.org_id = p_org_id
               AND (v_section_filter IS NULL OR e3.section <> v_section_filter)
               AND e3.log_date BETWEEN v_window_start AND v_window_end
             GROUP BY e3.user_id
          ) tops;

        v_should_fire := (v_team_avg > 0)
                         AND (v_rep_count::numeric < v_team_avg * v_threshold);

        IF v_should_fire THEN
            -- Quiet period: skip if a previous alert is still hot.
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
                        'threshold_pct', v_config.threshold_pct,
                        'window_days', v_config.window_days,
                        'cadence', v_config.cadence,
                        'quiet_days', v_config.quiet_period_days,
                        'baseline_kind', 'team_avg_excl_self',
                        'metric', CASE
                            WHEN v_config.exclude_special_projects
                            THEN 'activity_count_excl_special_projects'
                            ELSE 'activity_count_total'
                        END
                    )
                ) RETURNING id INTO v_alert_id;

                -- Fan out notifications immediately.
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
    'Round 8: per-org Performance Lag scan. Reads crm_performance_lag_config for threshold / window_days / quiet_period / new-hire min / Special Projects exclusion. Fan-outs to crm_dispatch_performance_lag_notification on alert fire.';

-- ---------------------------------------------------------------------------
-- 6. Daily cron schedule
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    -- pg_cron may not be present in some envs; skip silently if so.
    PERFORM 1 FROM pg_extension WHERE extname = 'pg_cron';
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Drop any prior schedule before re-registering.
    PERFORM cron.unschedule(jobid)
      FROM cron.job WHERE jobname = 'crm-performance-lag-scan';

    PERFORM cron.schedule(
        'crm-performance-lag-scan',
        '30 13 * * *', -- 13:30 UTC daily (~9:30 ET / 8:30 CT). Edge function decides per-org cadence.
        $sql$
          SELECT net.http_post(
            url := 'https://dtmnkzllidaiqyheguhl.supabase.co/functions/v1/crm-scheduled-jobs',
            headers := jsonb_build_object(
              'Authorization', 'Bearer ' || (
                SELECT decrypted_secret FROM vault.decrypted_secrets
                WHERE name = 'supabase_service_role_key' LIMIT 1
              ),
              'Content-Type', 'application/json'
            ),
            body := jsonb_build_object('job', 'performance_lag_scan')
          )
        $sql$
    );
END$$;

COMMIT;

-- ============================================================================
-- CRM rebuild — Phase 7 / Round 11 (Section 12 lock — Baseline + Window)
-- ============================================================================
-- Source spec (verbatim):
--
--   Performance Lag Alert — Baseline (Team Average + Top Performer)
--     • Primary baseline: team average activity count, excluding the rep
--       being evaluated.
--     • Lag fires when the rep's activity count is < 80% of that team
--       average over the trigger window.
--     • Alert payload must show both numbers: the rep's count, the team
--       average (their comparison baseline), AND the top performer's
--       count for the same window.
--     • Top performer is displayed for context / aspiration; it does NOT
--       change the trigger threshold.
--
--   Performance Lag Alert — Trigger Window (5-Day Work Week, Mon–Fri)
--     • Trigger window: rolling 5 business days (Mon–Fri only); weekend
--       days excluded entirely.
--     • Daily check runs each business-day morning (or EOD —
--       implementer's call; default morning) and recomputes against the
--       last 5 business days.
--     • Weekend days do not trigger alerts and do not count in the
--       comparison window.
--     • Newly hired reps with < 5 business days of activity are excluded
--       from both baseline calculation and lag evaluation until they hit
--       the 5-day floor.
--
-- This migration extends the spec lock model from Round 10:
--
--   When `crm_performance_lag_config.spec_locked = true`:
--       window_kind                  := 'rolling'
--       window_days                  := 5
--       business_days_only           := true
--       threshold_pct                := 20         (= < 80% of baseline)
--       baseline_kind                := 'team_avg_excl_self'
--       metric_kind                  := 'activity_count'
--       exclude_special_projects     := true
--       min_business_days_in_system  := 5
--
-- The configurable knobs from Round 9 stay around for operational
-- override (admin must toggle off `spec_locked` first).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Add business_days_only flag (default true; spec-locked).
-- ---------------------------------------------------------------------------

ALTER TABLE public.crm_performance_lag_config
    ADD COLUMN IF NOT EXISTS business_days_only boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.crm_performance_lag_config.business_days_only IS
    'Section 12 / Round 11 (2026-05-13): when true, the rolling window counts back N BUSINESS days (Mon–Fri only) and the scan no-ops on weekends. Spec-locked to TRUE.';

-- ---------------------------------------------------------------------------
-- 2. Lock the spec defaults more aggressively.
-- ---------------------------------------------------------------------------
-- Round 8 seeded these with values that match the spec, but we re-assert
-- them here so an org that previously saved a custom value goes back to
-- spec when the lock is on. We DO NOT touch rows where spec_locked has
-- been turned off — those orgs explicitly asked for an override.

UPDATE public.crm_performance_lag_config
   SET window_days = 5,
       threshold_pct = 20,
       business_days_only = true,
       min_business_days_in_system = GREATEST(min_business_days_in_system, 5)
 WHERE spec_locked = true;

-- ---------------------------------------------------------------------------
-- 3. Helper: business_days_back(p_today, p_n)
-- ---------------------------------------------------------------------------
-- Returns the (start_date, end_date) covering the last N business days
-- (Mon=1 .. Fri=5) ending on p_today (or the most recent business day on
-- or before p_today). Weekends are excluded from the window entirely.

CREATE OR REPLACE FUNCTION public.crm_perflag_business_day_window(
    p_today date,
    p_n integer
)
RETURNS TABLE(window_start date, window_end date)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $function$
    WITH end_date AS (
        SELECT CASE
            WHEN EXTRACT(ISODOW FROM p_today)::int <= 5 THEN p_today
            ELSE p_today - (EXTRACT(ISODOW FROM p_today)::int - 5)
        END AS d
    ),
    candidate_days AS (
        SELECT d::date AS day
          FROM generate_series((SELECT d FROM end_date) - 30, (SELECT d FROM end_date), INTERVAL '1 day') AS d
         WHERE EXTRACT(ISODOW FROM d)::int <= 5
         ORDER BY d DESC
         LIMIT p_n
    )
    SELECT MIN(day) AS window_start, MAX(day) AS window_end FROM candidate_days;
$function$;

COMMENT ON FUNCTION public.crm_perflag_business_day_window(date, integer) IS
    'Section 12 / Round 11: returns the (start,end) date pair covering the last N BUSINESS days (Mon–Fri) ending on p_today (or the most recent weekday on or before p_today).';

COMMIT;

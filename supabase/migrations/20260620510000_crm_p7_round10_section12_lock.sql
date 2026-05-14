-- ============================================================================
-- CRM rebuild — Phase 7 / Round 10 (Section 12 — Round 6 Addendum spec lock)
-- ============================================================================
-- Source spec (verbatim from the Round 6 Addendum, dated 2026-05-13):
--
--   Daily Log — Accordion Behavior
--     • Multi-Expand — rep can have any number of Daily Log sections open
--       simultaneously.
--     • Section open/closed state persists per user across sessions.
--
--   Special Projects — Confirmed
--     • Own top-level Daily Log section — confirmed.
--     • Each entry requires: project name (free text), time spent, notes —
--       confirmed per Section 11.
--     • Time spent feeds per-rep and per-project rollups in Reports.
--
--   Performance Lag Alert — Metric
--     • Performance metric is activity counts — total touches across all
--       auto- and manual-logged activity types: Calls, Texts, Emails,
--       Cancellation Calls, LinkedIn touches, Pipeline actions, Deals
--       Closed, Activities, Content Creation entries.
--     • Special Projects time does NOT count toward the activity score.
--     • Each activity = 1 count; no weighting between activity types.
--
-- The Round 9 schema introduced configurable knobs (metric_kind,
-- baseline_kind, window_kind, accordion_mode, etc.) so admins could
-- experiment. Section 12 LOCKS those knobs to the spec values. We keep
-- the columns (so an org-by-org override remains possible if a future
-- spec round opens them again), but introduce a `spec_locked boolean`
-- guard that the scan / UI consult; when locked, the spec values are
-- enforced regardless of what the columns currently hold.
--
-- The migration also closes the "notes are required" gap on
-- crm_special_projects (was nullable in Round 7) and re-asserts the
-- per-rep & per-project rollups feed Reports. The Section 12 banner UI
-- is shipped from the React side and reads `spec_locked` so admins see
-- a clear "spec-locked" state.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Spec-lock flags
-- ---------------------------------------------------------------------------

ALTER TABLE public.crm_performance_lag_config
    ADD COLUMN IF NOT EXISTS spec_locked boolean NOT NULL DEFAULT true;

ALTER TABLE public.crm_daily_log_ui_config
    ADD COLUMN IF NOT EXISTS spec_locked boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.crm_performance_lag_config.spec_locked IS
    'Section 12 / Round 6 Addendum (2026-05-13): when true, the scan ignores metric_kind / baseline_kind / window_kind and uses the spec-locked values (activity_count, team_avg_excl_self, rolling 7-day, exclude_special_projects=true). Default true.';

COMMENT ON COLUMN public.crm_daily_log_ui_config.spec_locked IS
    'Section 12 / Round 6 Addendum (2026-05-13): when true, the Daily Log accordion is forced to multi-expand and starts fully collapsed regardless of accordion_mode / default_collapsed columns. Default true.';

-- All existing rows inherit the default (true) so behaviour matches the
-- locked spec without any admin action.

-- ---------------------------------------------------------------------------
-- 2. crm_special_projects.notes — required per spec
-- ---------------------------------------------------------------------------
-- Section 11 + Section 12 confirm: notes are a required field on every
-- special-projects entry. The column was nullable through Round 7. Since
-- the table is currently empty (verified before migration), we can flip
-- to NOT NULL + a length check without a backfill.

ALTER TABLE public.crm_special_projects
    ALTER COLUMN notes SET NOT NULL,
    ALTER COLUMN notes SET DEFAULT '';

ALTER TABLE public.crm_special_projects
    DROP CONSTRAINT IF EXISTS crm_special_projects_notes_min_chk;

ALTER TABLE public.crm_special_projects
    ADD CONSTRAINT crm_special_projects_notes_min_chk
        CHECK (length(btrim(notes)) >= 1);

COMMENT ON COLUMN public.crm_special_projects.notes IS
    'Section 12 / Round 10: required free-text field. Spec: "Each entry requires: project name (free text), time spent, notes." DB enforces non-empty trimmed length.';

-- ---------------------------------------------------------------------------
-- 3. Re-assert per-project rollup view (defensive; identical shape).
-- ---------------------------------------------------------------------------
-- crm_v_special_project_rollup already exists from Round 7 and feeds the
-- per-rep AND per-project Reports rollups. We're not changing its
-- definition here — just leaving a comment so future readers see the
-- Section 12 reference without grepping.

COMMENT ON VIEW public.crm_v_special_project_rollup IS
    'Section 12 / Round 10 confirmed: feeds per-rep AND per-project rollups in Reports. Aggregates crm_special_projects per (org_id, user_id, project_label, project_type_id, log_date).';

COMMIT;

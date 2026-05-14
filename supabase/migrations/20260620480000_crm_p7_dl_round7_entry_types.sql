-- ============================================================================
-- CRM rebuild — Phase 7 / Round 7 (Daily Log new entry types)
-- ============================================================================
-- Spec ("Daily Log — New Entry Types"):
--
-- Cancellation Calls (under Lead Communication)
--   - Distinct entry type inside Lead Communication.
--   - Auto-capture: route a logged call to Cancellation Calls when the
--     linked record (Lead or Member) is moving to Lost, is a
--     cancellation, or the rep tags the call as a cancellation.
--   - Cancellation Calls count separately from regular Calls in all
--     reports (Daily Log, Weekly, Monthly, Activity Analytics — Sec 2/3/4).
--
-- Special Projects
--   - Top-level Daily Log section (already shipped).
--   - Each entry: project name (free text or pick-list), time spent
--     (minutes or HH:MM), optional notes.
--   - Time spent feeds time-tracking reports — per-rep totals, per-
--     project rollups.
--   - Reports view: Special Projects breakdown (project × rep × time
--     over date range).
--   - Manual entry only — no auto-capture path.
--
-- This migration delivers:
--   1. crm_special_project_types — org-scoped pick-list of project
--      names (e.g. "Carrier escalation", "Internal training",
--      "Vendor demo"). Free-text remains the fallback path.
--   2. crm_special_projects.project_type_id FK so rep entries can be
--      keyed to a canonical type. Existing rows keep their free-text
--      project_name.
--   3. crm_v_special_project_rollup — view aggregating
--      time_minutes per (project, rep, log_date) with the canonical
--      project label resolved from the pick-list when present.
--   4. crm_v_call_breakdown — view aggregating Daily Log call rows
--      with regular vs cancellation buckets, joined to user_id +
--      log_date, so reports surface the split per spec.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. crm_special_project_types — org-scoped pick-list
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_special_project_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 100,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT crm_special_project_types_name_chk CHECK (length(trim(both ' ' FROM name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_special_project_types_org_name_uq
    ON public.crm_special_project_types(org_id, lower(name));

CREATE INDEX IF NOT EXISTS crm_special_project_types_org_active_idx
    ON public.crm_special_project_types(org_id, is_active);

ALTER TABLE public.crm_special_project_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_special_project_types_select ON public.crm_special_project_types;
CREATE POLICY crm_special_project_types_select ON public.crm_special_project_types
    FOR SELECT USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_special_project_types_insert ON public.crm_special_project_types;
CREATE POLICY crm_special_project_types_insert ON public.crm_special_project_types
    FOR INSERT WITH CHECK (public.is_org_admin(org_id));

DROP POLICY IF EXISTS crm_special_project_types_update ON public.crm_special_project_types;
CREATE POLICY crm_special_project_types_update ON public.crm_special_project_types
    FOR UPDATE USING (public.is_org_admin(org_id))
                 WITH CHECK (public.is_org_admin(org_id));

DROP POLICY IF EXISTS crm_special_project_types_delete ON public.crm_special_project_types;
CREATE POLICY crm_special_project_types_delete ON public.crm_special_project_types
    FOR DELETE USING (public.is_org_admin(org_id));

CREATE OR REPLACE FUNCTION public.crm_special_project_types_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_special_project_types_touch ON public.crm_special_project_types;
CREATE TRIGGER trg_crm_special_project_types_touch
    BEFORE UPDATE ON public.crm_special_project_types
    FOR EACH ROW EXECUTE FUNCTION public.crm_special_project_types_touch_updated_at();

COMMENT ON TABLE public.crm_special_project_types IS
    'Round 7: org-scoped pick-list of Special Project types reps can pick from. Free-text project_name on crm_special_projects remains the fallback.';

-- ---------------------------------------------------------------------------
-- 2. crm_special_projects.project_type_id FK
-- ---------------------------------------------------------------------------

ALTER TABLE public.crm_special_projects
    ADD COLUMN IF NOT EXISTS project_type_id uuid REFERENCES public.crm_special_project_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS crm_special_projects_type_idx
    ON public.crm_special_projects(project_type_id);

COMMENT ON COLUMN public.crm_special_projects.project_type_id IS
    'Round 7: optional FK to crm_special_project_types. Free-text project_name remains for ad-hoc entries.';

-- ---------------------------------------------------------------------------
-- 3. crm_v_special_project_rollup — project × rep × time spent
-- ---------------------------------------------------------------------------
-- Coalesces the canonical pick-list name when present, falling back to
-- the rep's free-text project_name. Consumers filter by org_id, log_date
-- range, user_id, and project_label.

CREATE OR REPLACE VIEW public.crm_v_special_project_rollup AS
SELECT
    sp.org_id,
    sp.user_id,
    COALESCE(t.name, sp.project_name)              AS project_label,
    sp.project_type_id,
    sp.log_date,
    SUM(sp.time_minutes)::int                      AS total_minutes,
    COUNT(*)::int                                  AS entry_count
  FROM public.crm_special_projects sp
  LEFT JOIN public.crm_special_project_types t ON t.id = sp.project_type_id
 GROUP BY sp.org_id, sp.user_id, COALESCE(t.name, sp.project_name),
          sp.project_type_id, sp.log_date;

COMMENT ON VIEW public.crm_v_special_project_rollup IS
    'Round 7: per-rep × per-project × per-day rollup of Special Projects time. Filter by org_id + log_date range to drive the Reports breakdown panel.';

-- ---------------------------------------------------------------------------
-- 4. crm_v_call_breakdown — regular vs cancellation call counts per
--    rep × day, derived from crm_daily_log_events.
-- ---------------------------------------------------------------------------
-- Cancellation rows are flagged via activity_subtype = 'cancellation'
-- (set by either the auto-detect trigger crm_dl_emit_from_activity or
-- the manual entry RPC's metadata.subtype passthrough).

CREATE OR REPLACE VIEW public.crm_v_call_breakdown AS
SELECT
    e.org_id,
    e.user_id,
    e.log_date,
    COUNT(*) FILTER (WHERE e.activity_subtype IS DISTINCT FROM 'cancellation')::int AS regular_calls,
    COUNT(*) FILTER (WHERE e.activity_subtype = 'cancellation')::int                AS cancellation_calls,
    COUNT(*)::int                                                                    AS total_calls
  FROM public.crm_daily_log_events e
 WHERE e.activity_type = 'call'
 GROUP BY e.org_id, e.user_id, e.log_date;

COMMENT ON VIEW public.crm_v_call_breakdown IS
    'Round 7: per-rep × per-day call-count breakdown — regular vs cancellation. Drives the Daily Log / Weekly / Monthly report split per Sections 2/3/4.';

COMMIT;

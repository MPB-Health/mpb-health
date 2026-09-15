-- ============================================================================
-- CRM rebuild — Leads list default sort fix
--
-- Problem: the Leads list defaulted to `last_touched_at DESC NULLS LAST`, but
-- per Phase 1 (migration 20260620020000_crm_p1_lead_last_touched.sql) that
-- column is only bumped on rep-initiated activity. A freshly-created lead
-- therefore has `last_touched_at = NULL` and lands at the bottom of the list,
-- which is why users had to use the "Recent Leads" dashboard widget to find
-- new submissions.
--
-- Fix: add an indexed `last_activity_at` generated column equal to
-- `COALESCE(last_touched_at, created_at)`. The Leads list (and any other
-- consumer that wants "most-recent first") uses this column as its default
-- sort key, so:
--
--   • Brand-new leads surface at the top by their `created_at`
--   • Leads that have been worked surface by their `last_touched_at`
--   • The "Last Touched" column display + the strict "Last Touched" sort
--     (click the column header) keep their original, rep-initiated semantics
-- ============================================================================

BEGIN;

ALTER TABLE public.lead_submissions
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz
    GENERATED ALWAYS AS (COALESCE(last_touched_at, created_at)) STORED;

COMMENT ON COLUMN public.lead_submissions.last_activity_at IS
  'Generated: COALESCE(last_touched_at, created_at). Used as the Leads list default sort so new leads with no rep-initiated touch yet still surface at the top by their created_at. Strict "Last Touched" semantics live on last_touched_at.';

CREATE INDEX IF NOT EXISTS idx_lead_submissions_last_activity
  ON public.lead_submissions (org_id, last_activity_at DESC NULLS LAST);

COMMIT;

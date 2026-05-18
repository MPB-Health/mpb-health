-- ============================================================================
-- CRM rebuild — tag the 230 org_id-backfill cohort
--
-- Companion to migration 20260620600000_crm_lead_intake_default_org.sql, which
-- backfilled `org_id = '00000000-0000-4000-a000-000000000001'` on every lead
-- that landed via `submit_public_lead` between 2026-01-27 21:10:55 (the first
-- NULL-org submission) and 2026-05-18 (the cutover deploy).
--
-- This migration adds the tag `backfill_2026_05_18_org` to that same cohort so
-- reps can:
--   • Filter the Leads list to "only show the recovered cohort" while they
--     work through the backlog (Section 6 tag filter).
--   • Build a saved view for "Untouched recovered website leads" without
--     having to guess at created_at boundaries.
--
-- Cohort boundary verified against 20260620600000_crm_lead_intake_default_org:
--   • org_id IS NULL → 230 rows
--   • created_at >= '2026-01-27 21:10:55+00' AND <= '2026-05-18 17:44:07+00'
--     → same 230 rows (clean partition; canonical-org leads stop at 16:56:04 +
--     null-org leads start at 21:10:55 on the same day)
-- ============================================================================

BEGIN;
WITH tagged AS (
    UPDATE public.lead_submissions ls
       SET tags       = (
              SELECT ARRAY(
                  SELECT DISTINCT t
                  FROM unnest(COALESCE(ls.tags, ARRAY[]::text[]) || ARRAY['backfill_2026_05_18_org']) AS t
              )
           ),
           updated_at = now()
     WHERE ls.org_id    = '00000000-0000-4000-a000-000000000001'
       AND ls.created_at >= '2026-01-27 21:10:55+00'::timestamptz
       AND NOT ('backfill_2026_05_18_org' = ANY(COALESCE(ls.tags, ARRAY[]::text[])))
    RETURNING ls.id
)
INSERT INTO public.audit_logs (
    user_id, user_email, action, entity_type, entity_id,
    old_values, new_values, created_at
)
SELECT
    NULL,
    'system:migration',
    'crm.intake.tag_backfill_cohort',
    'lead_submissions',
    'bulk:' || (SELECT count(*)::text FROM tagged),
    jsonb_build_object('tag_added', 'backfill_2026_05_18_org'),
    jsonb_build_object(
        'rows', (SELECT count(*) FROM tagged),
        'cohort_filter', 'org_id = MPB Health AND created_at >= 2026-01-27 21:10:55+00',
        'companion_migration', '20260620600000_crm_lead_intake_default_org.sql'
    ),
    now()
WHERE EXISTS (SELECT 1 FROM tagged);

COMMIT;

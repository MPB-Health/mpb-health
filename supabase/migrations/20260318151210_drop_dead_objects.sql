-- ============================================================
-- Drop Dead Objects — Pass 2 Migration Consolidation
-- ============================================================
-- Applied to production (dtmnkzllidaiqyheguhl) via MCP apply_migration
-- on 2026-03-18, recorded as version '20260318151210'.
--
-- Removes tables and functions confirmed to have:
--   • 0 rows (tables)
--   • 0 code references across the entire monorepo (both)
--   • No dependents other than the FK cluster handled below
--
-- All DROPs are IF EXISTS — safe to replay after a baseline dump
-- that already excludes these objects.
-- ============================================================

-- ── Tables ──────────────────────────────────────────────────
-- Drop FK-dependent children of specialized_solutions first
DROP TABLE IF EXISTS public.solution_benefits CASCADE;
DROP TABLE IF EXISTS public.solution_features CASCADE;
DROP TABLE IF EXISTS public.solution_testimonials CASCADE;

-- Drop remaining orphaned tables
DROP TABLE IF EXISTS public.specialized_solutions CASCADE;
DROP TABLE IF EXISTS public.content_calendar CASCADE;
DROP TABLE IF EXISTS public.medication_reminders CASCADE;
DROP TABLE IF EXISTS public.member_import_logs CASCADE;
DROP TABLE IF EXISTS public.provider_reviews CASCADE;
-- pharmacies: had FK from prescriptions.pharmacy_id — CASCADE handles it
DROP TABLE IF EXISTS public.pharmacies CASCADE;

-- ── Functions ───────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.setup_catherine_superadmin_profile();
DROP FUNCTION IF EXISTS public.setup_superadmin_profile();
DROP FUNCTION IF EXISTS public.setup_test_advisor_profile();
DROP FUNCTION IF EXISTS public.get_trending_keywords();
DROP FUNCTION IF EXISTS public.render_email_signature(uuid);
DROP FUNCTION IF EXISTS public.share_note_with_role(uuid, text);
DROP FUNCTION IF EXISTS public.get_sops_by_category(text);

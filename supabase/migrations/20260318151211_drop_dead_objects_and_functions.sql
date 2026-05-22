-- ============================================================
-- CORRECTIVE MIGRATION: Drop confirmed dead objects
-- Identified via full codebase audit on 2026-03-18
-- Zero code references verified across apps/, packages/, supabase/functions/
-- FK dependencies handled in correct drop order
-- ============================================================

-- -------------------------------------------------------
-- DEAD TABLES: solution_* cluster (FK-linked, drop children first)
-- solution_benefits/features/testimonials all FK → specialized_solutions
-- All 4 tables have zero code references
-- -------------------------------------------------------
DROP TABLE IF EXISTS public.solution_benefits;
DROP TABLE IF EXISTS public.solution_features;
DROP TABLE IF EXISTS public.solution_testimonials;
DROP TABLE IF EXISTS public.specialized_solutions;

-- -------------------------------------------------------
-- DEAD TABLES: independent, zero rows, zero references
-- -------------------------------------------------------
DROP TABLE IF EXISTS public.content_calendar;
DROP TABLE IF EXISTS public.medication_reminders;
DROP TABLE IF EXISTS public.member_import_logs;
DROP TABLE IF EXISTS public.provider_reviews;

-- pharmacies: zero rows, zero pharmacy_id usage in prescriptions
-- CASCADE removes the FK constraint from prescriptions.pharmacy_id
DROP TABLE IF EXISTS public.pharmacies CASCADE;

-- -------------------------------------------------------
-- DEAD FUNCTIONS: one-shot migration helpers (already ran)
-- -------------------------------------------------------
DROP FUNCTION IF EXISTS public.setup_catherine_superadmin_profile();
DROP FUNCTION IF EXISTS public.setup_superadmin_profile();
DROP FUNCTION IF EXISTS public.setup_test_advisor_profile();

-- -------------------------------------------------------
-- DEAD FUNCTIONS: no callers in any app/package/function
-- -------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_trending_keywords();
DROP FUNCTION IF EXISTS public.render_email_signature(uuid);
DROP FUNCTION IF EXISTS public.share_note_with_role(uuid, text);
DROP FUNCTION IF EXISTS public.get_sops_by_category(text);;

-- ============================================================================
-- CRM rebuild — Phase 1: deprecate the unused legacy `public.leads` table
--
-- The CRM app reads/writes `public.lead_submissions` (via packages/crm-core
-- LeadService); `public.leads` was created in baseline migrations but is no
-- longer touched by application code. Live row count: 0.
--
-- Pre-existing problems on `public.leads` (audit summary):
--   - Three RLS policies named "view/update/delete" but ALL stored as SELECT
--     command in pg_policy → silent privilege drift.
--   - No INSERT policy → table is effectively read-only via RLS.
--
-- Per the plan we rename the table to `_deprecated_leads`. Renaming (vs.
-- dropping) keeps the data + history if any rolls in unexpectedly, and gives
-- one cycle of tombstone visibility before a future migration drops it.
-- ============================================================================

BEGIN;
-- ----------------------------------------------------------------------------
-- 1. Belt + suspenders: capture row count for the audit log
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_count bigint;
BEGIN
    IF EXISTS (
        SELECT 1
          FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'leads'
    ) THEN
        EXECUTE 'SELECT COUNT(*) FROM public.leads' INTO v_count;
        RAISE NOTICE 'crm_p1_legacy_leads_deprecate: deprecating public.leads (% rows)', v_count;
    ELSE
        RAISE NOTICE 'crm_p1_legacy_leads_deprecate: public.leads already absent — nothing to do';
    END IF;
END
$$;
-- ----------------------------------------------------------------------------
-- 2. Drop the broken/incomplete RLS policies (no-op if absent)
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'leads'
    ) THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can view leads in their org" ON public.leads';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update leads in their org" ON public.leads';
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete leads in their org" ON public.leads';
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert leads in their org" ON public.leads';
    END IF;
END
$$;
-- ----------------------------------------------------------------------------
-- 3. Rename table + dependent indexes/sequences/constraints to _deprecated_*
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'leads'
    ) THEN
        EXECUTE 'ALTER TABLE public.leads RENAME TO _deprecated_leads';

        -- Add a comment so anyone poking around can see the why
        EXECUTE $cmt$
            COMMENT ON TABLE public._deprecated_leads IS
                'Legacy table — superseded by public.lead_submissions on 2026-06-20.
                 RLS was misconfigured (all policies stored as SELECT, no INSERT
                 policy). Will be dropped in a follow-up migration after a
                 grace cycle. Do not write here.'
        $cmt$;
    END IF;
END
$$;
-- ----------------------------------------------------------------------------
-- 4. Lock down the deprecated table — revoke all + RLS deny-by-default
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = '_deprecated_leads'
    ) THEN
        EXECUTE 'ALTER TABLE public._deprecated_leads ENABLE ROW LEVEL SECURITY';
        EXECUTE 'REVOKE ALL ON public._deprecated_leads FROM PUBLIC';
        EXECUTE 'REVOKE ALL ON public._deprecated_leads FROM authenticated';
        EXECUTE 'REVOKE ALL ON public._deprecated_leads FROM anon';
        -- Service role keeps access for any unwind work
    END IF;
END
$$;
COMMIT;

-- ============================================================================
-- Phase 0.B — Drop the deprecated orgs table (irreversible).
--
-- Target deploy: 2026-05-24 06:00 ET, after 7-day soak of Phase 0.A.
--
-- Preconditions to verify before running:
--   * Phase 0.A has been live for ≥ 7 days.
--   * Application error rates are at baseline (no spikes in 5xx).
--   * Supabase logs show zero new "permission denied for table orgs" errors.
--   * Code audit (./04-code-audit.sh) returns zero hits for writes to `orgs`.
--   * All portals smoke-tested on a recent deploy.
-- ============================================================================

BEGIN;

SET LOCAL lock_timeout      = '5s';
SET LOCAL statement_timeout = '5min';
SET LOCAL search_path       = public;

SELECT pg_advisory_xact_lock(86753092);

-- ----------------------------------------------------------------------------
-- STEP 1: Preflight — Phase 0.A must be in effect.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_orgs_view int;
  v_orgs_dep  int;
BEGIN
  SELECT count(*) INTO v_orgs_view FROM information_schema.views
   WHERE table_schema='public' AND table_name='orgs';
  SELECT count(*) INTO v_orgs_dep  FROM information_schema.tables
   WHERE table_schema='public' AND table_name='orgs_deprecated' AND table_type='BASE TABLE';

  IF v_orgs_view <> 1 THEN
    RAISE EXCEPTION 'precondition: public.orgs view missing — Phase 0.A may not have run';
  END IF;
  IF v_orgs_dep <> 1 THEN
    RAISE EXCEPTION 'precondition: public.orgs_deprecated missing — Phase 0.A may not have run';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 2: Drop the compat view first (no longer needed).
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.orgs;

-- ----------------------------------------------------------------------------
-- STEP 3: Drop the deprecated table and any residual policies.
-- ----------------------------------------------------------------------------
DROP TABLE public.orgs_deprecated CASCADE;

-- ----------------------------------------------------------------------------
-- STEP 4: Drop phase0 helper functions that are now redundant. The phase0
-- helpers remain canonical; champion's are alias wrappers. Nothing to drop.
-- ----------------------------------------------------------------------------

COMMIT;

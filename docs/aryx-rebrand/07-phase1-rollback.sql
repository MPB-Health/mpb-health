-- ============================================================================
-- Phase 1 Rollback — Undo seed and schema-hardening from migration 06.
-- Run ONLY if Phase 1 caused an issue and Phase 2 has not yet shipped.
-- ============================================================================

BEGIN;

SET LOCAL lock_timeout      = '5s';
SET LOCAL statement_timeout = '2min';
SET LOCAL search_path       = public;

SELECT pg_advisory_xact_lock(86753093);

-- Delete the seeded rows. Cascades to nothing because nothing else FKs to them.
DELETE FROM public.org_module_licenses
WHERE org_id = '00000000-0000-4000-a000-000000000001';

DELETE FROM public.org_feature_overrides
WHERE org_id = '00000000-0000-4000-a000-000000000001'
  AND reason LIKE 'Platform owner — Phase 1%';

-- Only delete subscription row if the table exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'organization_subscriptions'
  ) THEN
    EXECUTE 'DELETE FROM public.organization_subscriptions WHERE org_id = ''00000000-0000-4000-a000-000000000001''';
  END IF;
END $$;

DELETE FROM public.white_label_configs
WHERE org_id = '00000000-0000-4000-a000-000000000001';

-- Optional: drop the FK constraints added by Phase 1 step 2. (Keep them if
-- you only want to undo the seed; they're harmless schema hardening.)
-- ----------------------------------------------------------------------------
-- ALTER TABLE public.white_label_configs         DROP CONSTRAINT IF EXISTS white_label_configs_org_id_fkey;
-- ALTER TABLE public.white_label_email_templates DROP CONSTRAINT IF EXISTS white_label_email_templates_org_id_fkey;
-- ALTER TABLE public.org_module_licenses         DROP CONSTRAINT IF EXISTS org_module_licenses_org_id_fkey;
-- ALTER TABLE public.org_feature_overrides       DROP CONSTRAINT IF EXISTS org_feature_overrides_org_id_fkey;

DO $$
DECLARE
  v_wlc int; v_sub int := 0; v_lic int; v_ovr int;
BEGIN
  SELECT count(*) INTO v_wlc FROM public.white_label_configs   WHERE org_id = '00000000-0000-4000-a000-000000000001';
  SELECT count(*) INTO v_lic FROM public.org_module_licenses   WHERE org_id = '00000000-0000-4000-a000-000000000001';
  SELECT count(*) INTO v_ovr FROM public.org_feature_overrides WHERE org_id = '00000000-0000-4000-a000-000000000001' AND reason LIKE 'Platform owner — Phase 1%';
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'organization_subscriptions'
  ) THEN
    EXECUTE 'SELECT count(*) FROM public.organization_subscriptions WHERE org_id = ''00000000-0000-4000-a000-000000000001''' INTO v_sub;
  END IF;
  IF v_wlc + v_sub + v_lic + v_ovr <> 0 THEN
    RAISE EXCEPTION 'rollback: residual rows — wlc=%, sub=%, lic=%, ovr=%', v_wlc, v_sub, v_lic, v_ovr;
  END IF;
  RAISE NOTICE 'Phase 1 rollback OK — all mpb seed rows removed.';
END $$;

COMMIT;

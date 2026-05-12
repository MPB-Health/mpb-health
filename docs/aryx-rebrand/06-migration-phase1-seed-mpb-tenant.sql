-- ============================================================================
-- Phase 1 — Seed MPB Health as a Fully Provisioned Tenant.
--
-- Target deploy: 2026-05-20 10:00 ET (Wed, mid-soak).
-- Prereq:        Phase 0.A successfully deployed; mpb org id is
--                '00000000-0000-4000-a000-000000000001'.
--
-- What this does:
--   * Adds missing FK constraints on org_id columns of white_label /
--     licensing tables (schema hardening — should've existed from day 1).
--   * Inserts/upserts mpb's white_label_configs row reproducing the
--     current visible brand (blue palette + green accent + Inter font +
--     canonical logos).
--   * Activates all 8 product modules for mpb via activate_module_for_org().
--   * Inserts org_feature_overrides rows force-enabling every plan-tier-
--     gated feature for mpb (platform owner has all features).
--   * Conditionally seeds organization_subscriptions IFF the table exists
--     (prod is missing it as of 2026-05-12; tracked separately).
--
-- Safety:
--   * Single transaction. Rollback = abort.
--   * No schema changes on hot CRM tables. No data on hot tables touched.
--   * NO application code reads these tables today — Phase 2 wires them up.
--     If something here is wrong, mpb users see no change.
--   * Fully reversible via 07-phase1-rollback.sql.
-- ============================================================================

BEGIN;

SET LOCAL lock_timeout      = '5s';
SET LOCAL statement_timeout = '5min';
SET LOCAL search_path       = public;

SELECT pg_advisory_xact_lock(86753093);

-- ----------------------------------------------------------------------------
-- STEP 1: Preflight assertions
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_mpb_id          uuid;
  v_modules_present int;
  v_features_present int;
  v_subscription_tables_present boolean;
BEGIN
  SELECT id INTO v_mpb_id FROM public.organizations WHERE slug = 'mpb-health';
  IF v_mpb_id IS DISTINCT FROM '00000000-0000-4000-a000-000000000001' THEN
    RAISE EXCEPTION 'precondition: mpb org id is % (expected 00000000-…-001 — did Phase 0.A run?)', v_mpb_id;
  END IF;

  SELECT count(*) INTO v_modules_present
  FROM public.product_modules
  WHERE slug IN ('crm','admin-command-center','advisor-portal','champion-ems',
                 'itsts','orbit','white-label-mobile','app-admin')
    AND is_active = true;
  IF v_modules_present <> 8 THEN
    RAISE EXCEPTION 'precondition: expected 8 active product_modules, found %', v_modules_present;
  END IF;

  -- We need feature_flags seeded for the override step.
  SELECT count(*) INTO v_features_present
  FROM public.feature_flags
  WHERE slug IN (
    'crm.studio','crm.email_sequences','crm.ai_insights','crm.forecasting','crm.cpq',
    'advisor.ai_assistant','itsts.ai_replies','orbit.automation','mobile.custom_domain',
    'platform.api_access','platform.sso','platform.audit_logs','platform.white_label_branding'
  );
  IF v_features_present <> 13 THEN
    RAISE EXCEPTION 'precondition: expected 13 plan-tier-gated feature_flags, found %', v_features_present;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'activate_module_for_org' AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'precondition: activate_module_for_org() helper missing';
  END IF;

  -- Check whether the subscription tables are present in this environment.
  -- Prod is missing them as of 2026-05-12; if they're present (e.g., a
  -- restored env), we'll seed an enterprise subscription. Otherwise we'll
  -- skip that step and rely on org_feature_overrides for feature gating.
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('subscription_plans','organization_subscriptions')
    GROUP BY () HAVING count(*) = 2
  ) INTO v_subscription_tables_present;

  RAISE NOTICE 'STEP 1: preflight OK (subscription_tables_present=%)', v_subscription_tables_present;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 2: Schema hardening — add missing FK constraints on org_id columns
-- (NOT VALID + VALIDATE so existing rows aren't re-scanned during the lock).
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT 'white_label_configs'         AS tbl UNION ALL
    SELECT 'white_label_email_templates'        UNION ALL
    SELECT 'org_module_licenses'                UNION ALL
    SELECT 'org_feature_overrides'
  LOOP
    -- Only add the FK if it doesn't already exist
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints   tc
      JOIN information_schema.key_column_usage         kcu ON kcu.constraint_name = tc.constraint_name
      JOIN information_schema.constraint_column_usage  ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name   = r.tbl
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'org_id'
        AND ccu.table_schema = 'public'
        AND ccu.table_name   = 'organizations'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID',
        r.tbl, r.tbl || '_org_id_fkey'
      );
      EXECUTE format('ALTER TABLE public.%I VALIDATE CONSTRAINT %I', r.tbl, r.tbl || '_org_id_fkey');
      RAISE NOTICE 'STEP 2: FK added on %.org_id', r.tbl;
    ELSE
      RAISE NOTICE 'STEP 2: FK already exists on %.org_id (skip)', r.tbl;
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 3: Seed mpb's white_label_configs row.
-- ----------------------------------------------------------------------------
INSERT INTO public.white_label_configs (
  org_id,
  company_name,
  logo_url,
  logo_dark_url,
  favicon_url,
  primary_color,
  secondary_color,
  accent_color,
  background_color,
  text_color,
  header_color,
  sidebar_color,
  font_family,
  heading_font_family,
  show_powered_by,
  custom_login_page,
  custom_email_templates,
  meta_title,
  meta_description,
  og_image_url,
  support_email,
  support_url,
  terms_url,
  privacy_url,
  is_active
) VALUES (
  '00000000-0000-4000-a000-000000000001',
  'MPB Health',
  'https://mpb.health/assets/MPB-Health-No-background.png?v=2',
  'https://mpb.health/assets/MPB-Health-No-background.png?v=2',
  'https://mpb.health/favicon.ico',
  '#0A4E8E',
  '#0C71C3',
  '#A4CC43',
  '#FFFFFF',
  '#0E2D41',
  '#0A4E8E',
  '#FFFFFF',
  'Inter',
  'Inter',
  false,
  true,
  true,
  'MPB Health',
  'Affordable Health Sharing for Families & Individuals',
  'https://mpb.health/assets/MPB-Health-No-background.png?v=2',
  'support@mpb.health',
  'https://mpb.health/support',
  'https://mpb.health/terms',
  'https://mpb.health/privacy',
  true
)
ON CONFLICT (org_id) DO UPDATE SET
  company_name           = EXCLUDED.company_name,
  logo_url               = EXCLUDED.logo_url,
  logo_dark_url          = EXCLUDED.logo_dark_url,
  favicon_url            = EXCLUDED.favicon_url,
  primary_color          = EXCLUDED.primary_color,
  secondary_color        = EXCLUDED.secondary_color,
  accent_color           = EXCLUDED.accent_color,
  background_color       = EXCLUDED.background_color,
  text_color             = EXCLUDED.text_color,
  header_color           = EXCLUDED.header_color,
  sidebar_color          = EXCLUDED.sidebar_color,
  font_family            = EXCLUDED.font_family,
  heading_font_family    = EXCLUDED.heading_font_family,
  show_powered_by        = EXCLUDED.show_powered_by,
  custom_login_page      = EXCLUDED.custom_login_page,
  custom_email_templates = EXCLUDED.custom_email_templates,
  meta_title             = EXCLUDED.meta_title,
  meta_description       = EXCLUDED.meta_description,
  og_image_url           = EXCLUDED.og_image_url,
  support_email          = EXCLUDED.support_email,
  support_url            = EXCLUDED.support_url,
  terms_url              = EXCLUDED.terms_url,
  privacy_url            = EXCLUDED.privacy_url,
  is_active              = EXCLUDED.is_active,
  updated_at             = now();

-- ----------------------------------------------------------------------------
-- STEP 4: Conditionally seed mpb's organization_subscriptions row.
-- Prod is missing the subscription_plans / organization_subscriptions tables
-- (champion_billing migration is in schema_migrations but its effects aren't
-- in the DB — tracked separately). If present, seed enterprise tier; if
-- absent, skip and rely on step 5b feature overrides for plan-tier-gated
-- feature access.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subscription_plans'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'organization_subscriptions'
  ) THEN
    RAISE NOTICE 'STEP 4: subscription tables absent — skipping subscription seed (feature overrides in step 5b cover plan-tier gating)';
    RETURN;
  END IF;

  EXECUTE $sql$
    INSERT INTO public.organization_subscriptions (
      org_id, plan_id, status, billing_cycle,
      current_period_start, current_period_end, discount_percent, custom_limits
    )
    SELECT
      '00000000-0000-4000-a000-000000000001', sp.id, 'active', 'yearly',
      now(), '2030-01-01T00:00:00Z'::timestamptz, 100.00,
      '{"max_users": null, "max_leads": null, "max_messages_per_month": null}'::jsonb
    FROM public.subscription_plans sp
    WHERE sp.slug = 'enterprise'
    ON CONFLICT (org_id) DO UPDATE SET
      plan_id            = EXCLUDED.plan_id,
      status             = EXCLUDED.status,
      billing_cycle      = EXCLUDED.billing_cycle,
      current_period_end = EXCLUDED.current_period_end,
      discount_percent   = EXCLUDED.discount_percent,
      custom_limits      = EXCLUDED.custom_limits,
      updated_at         = now()
  $sql$;
  RAISE NOTICE 'STEP 4: organization_subscriptions seeded (enterprise tier)';
END $$;

-- ----------------------------------------------------------------------------
-- STEP 5: Activate all 8 product modules for mpb.
-- activate_module_for_org() is idempotent (ON CONFLICT (org_id, module_id) DO UPDATE).
-- ----------------------------------------------------------------------------
SELECT public.activate_module_for_org(
  '00000000-0000-4000-a000-000000000001'::uuid,
  'crm',
  'core_included'
);
SELECT public.activate_module_for_org(
  '00000000-0000-4000-a000-000000000001'::uuid,
  'admin-command-center',
  'core_included'
);
SELECT public.activate_module_for_org(
  '00000000-0000-4000-a000-000000000001'::uuid,
  'advisor-portal',
  'core_included'
);
SELECT public.activate_module_for_org(
  '00000000-0000-4000-a000-000000000001'::uuid,
  'champion-ems',
  'custom'
);
SELECT public.activate_module_for_org(
  '00000000-0000-4000-a000-000000000001'::uuid,
  'itsts',
  'custom'
);
SELECT public.activate_module_for_org(
  '00000000-0000-4000-a000-000000000001'::uuid,
  'orbit',
  'custom'
);
SELECT public.activate_module_for_org(
  '00000000-0000-4000-a000-000000000001'::uuid,
  'white-label-mobile',
  'custom'
);
SELECT public.activate_module_for_org(
  '00000000-0000-4000-a000-000000000001'::uuid,
  'app-admin',
  'custom'
);

-- Annotate why these custom-source rows exist for the platform owner.
UPDATE public.org_module_licenses
SET notes = 'Platform owner — module granted as part of Phase 1 mpb-as-tenant seed (2026-05-20).'
WHERE org_id = '00000000-0000-4000-a000-000000000001'
  AND notes IS NULL;

-- ----------------------------------------------------------------------------
-- STEP 5b: Force-enable plan-tier-gated features for mpb via overrides.
-- Without an enterprise subscription record, org_has_feature() would gate
-- these to enabled_by_default = false. The override is the documented
-- escape hatch and takes precedence over plan-tier resolution.
-- ----------------------------------------------------------------------------
INSERT INTO public.org_feature_overrides (org_id, feature_id, enabled, reason)
SELECT
  '00000000-0000-4000-a000-000000000001',
  ff.id,
  true,
  'Platform owner — Phase 1 force-enable (2026-05-20). Revoke if mpb gets a proper enterprise subscription row.'
FROM public.feature_flags ff
WHERE ff.slug IN (
  'crm.studio','crm.email_sequences','crm.ai_insights','crm.forecasting','crm.cpq',
  'advisor.ai_assistant','itsts.ai_replies','orbit.automation','mobile.custom_domain',
  'platform.api_access','platform.sso','platform.audit_logs','platform.white_label_branding'
)
ON CONFLICT (org_id, feature_id) DO UPDATE SET
  enabled    = EXCLUDED.enabled,
  reason     = EXCLUDED.reason,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- STEP 6: Verification
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_wlc_rows  int;
  v_sub_rows  int := -1;  -- -1 sentinel = table absent
  v_lic_rows  int;
  v_ovr_rows  int;
  v_modules   text[];
BEGIN
  SELECT count(*) INTO v_wlc_rows
  FROM public.white_label_configs
  WHERE org_id = '00000000-0000-4000-a000-000000000001';

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'organization_subscriptions'
  ) THEN
    EXECUTE 'SELECT count(*) FROM public.organization_subscriptions WHERE org_id = ''00000000-0000-4000-a000-000000000001'''
    INTO v_sub_rows;
  END IF;

  SELECT count(*), array_agg(pm.slug ORDER BY pm.sort_order)
  INTO v_lic_rows, v_modules
  FROM public.org_module_licenses oml
  JOIN public.product_modules     pm ON pm.id = oml.module_id
  WHERE oml.org_id = '00000000-0000-4000-a000-000000000001'
    AND oml.status = 'active';

  SELECT count(*) INTO v_ovr_rows
  FROM public.org_feature_overrides
  WHERE org_id = '00000000-0000-4000-a000-000000000001'
    AND enabled = true;

  IF v_wlc_rows <> 1 THEN RAISE EXCEPTION 'verify: white_label_configs rows=% (expected 1)', v_wlc_rows; END IF;
  IF v_lic_rows <> 8 THEN RAISE EXCEPTION 'verify: org_module_licenses active rows=% (expected 8); modules=%', v_lic_rows, v_modules; END IF;
  IF v_ovr_rows < 13 THEN RAISE EXCEPTION 'verify: org_feature_overrides rows=% (expected at least 13)', v_ovr_rows; END IF;

  RAISE NOTICE 'STEP 6: verification OK — Phase 1 complete. mpb tenant fully provisioned.';
  RAISE NOTICE '  white_label_configs:               1 row';
  IF v_sub_rows = -1 THEN
    RAISE NOTICE '  organization_subscriptions:        SKIPPED (table absent in this environment)';
  ELSE
    RAISE NOTICE '  organization_subscriptions:        % row (enterprise)', v_sub_rows;
  END IF;
  RAISE NOTICE '  org_module_licenses (active):      % rows: %', v_lic_rows, v_modules;
  RAISE NOTICE '  org_feature_overrides (enabled):   % rows', v_ovr_rows;
END $$;

COMMIT;

-- ============================================================================
-- Phase 1 Preflight — READ ONLY
-- Confirms Phase 0.A succeeded and Phase 1 inserts will not conflict.
-- Run within 1 hour of Phase 1 deploy.
-- ============================================================================

\echo '== Q1: Phase 0.A landed — organizations.mpb row uses canonical UUID'
SELECT id, name, slug, subscription_tier, subscription_status
FROM public.organizations
WHERE slug = 'mpb-health';
-- Expected: 1 row with id = '00000000-0000-4000-a000-000000000001'

\echo '== Q2: orgs base table is gone (replaced by compat view during soak)'
SELECT table_type, count(*)
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('orgs','orgs_deprecated')
GROUP BY table_type;
-- Expected: orgs_deprecated as BASE TABLE (1), orgs as VIEW (1)

\echo '== Q3: white_label_configs has NO row for mpb yet'
SELECT count(*) AS existing_rows
FROM public.white_label_configs
WHERE org_id = '00000000-0000-4000-a000-000000000001';
-- Expected: 0

\echo '== Q4: organization_subscriptions has NO row for mpb yet'
SELECT count(*) AS existing_rows
FROM public.organization_subscriptions
WHERE org_id = '00000000-0000-4000-a000-000000000001';
-- Expected: 0 (or 1 if previously seeded; we treat that case via ON CONFLICT)

\echo '== Q5: enterprise plan exists and is usable'
SELECT id, slug, name, tier, is_active
FROM public.subscription_plans
WHERE slug = 'enterprise';
-- Expected: 1 row, tier='enterprise', is_active=true

\echo '== Q6: all 8 product_modules exist'
SELECT count(*) AS modules_found
FROM public.product_modules
WHERE slug IN ('crm','admin-command-center','advisor-portal','champion-ems',
               'itsts','orbit','white-label-mobile','app-admin');
-- Expected: 8

\echo '== Q7: org_module_licenses has NO rows for mpb yet'
SELECT count(*) AS existing_rows
FROM public.org_module_licenses
WHERE org_id = '00000000-0000-4000-a000-000000000001';
-- Expected: 0 (or up to 8 — handled idempotently by activate_module_for_org)

\echo '== Q8: missing FK constraints on org_id columns of white-label / licensing tables'
SELECT t.table_name, t.column_name,
       CASE WHEN fk.constraint_name IS NOT NULL THEN 'has FK' ELSE 'NO FK' END AS state
FROM (
  VALUES ('white_label_configs','org_id'),
         ('white_label_email_templates','org_id'),
         ('org_module_licenses','org_id'),
         ('org_feature_overrides','org_id')
) AS t(table_name, column_name)
LEFT JOIN (
  SELECT tc.table_name, kcu.column_name, tc.constraint_name
  FROM information_schema.table_constraints   tc
  JOIN information_schema.key_column_usage         kcu ON kcu.constraint_name = tc.constraint_name
  JOIN information_schema.constraint_column_usage  ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_schema = 'public'
    AND ccu.table_name   = 'organizations'
    AND ccu.column_name  = 'id'
) fk ON fk.table_name = t.table_name AND fk.column_name = t.column_name;
-- Expected: 4 rows, all marked 'NO FK' (Phase 1 will add them)

\echo '== Q9: helper function activate_module_for_org exists'
SELECT proname FROM pg_proc
WHERE proname = 'activate_module_for_org'
  AND pronamespace = 'public'::regnamespace;
-- Expected: 1 row

-- ============================================================================
-- Expected outcomes:
-- Q1: organizations.mpb row exists with canonical UUID 00000000-…-001.
-- Q2: orgs_deprecated table + orgs view both present.
-- Q3, Q4: zero rows (or Phase 1 has already run — ON CONFLICT handles re-runs).
-- Q5: enterprise plan exists and is active.
-- Q6: 8 modules exist.
-- Q7: zero rows.
-- Q8: 4 'NO FK' entries — Phase 1 adds these constraints.
-- Q9: helper function present.
-- ============================================================================

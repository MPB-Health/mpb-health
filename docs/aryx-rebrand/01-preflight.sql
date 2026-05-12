-- ============================================================================
-- Phase 0 Preflight — READ ONLY
-- Run against PRODUCTION before scheduling Phase 0.A.
-- Every assertion in §"Expected outcomes" must hold. If not, STOP and revise.
-- ============================================================================

\echo '== Q1: Row counts in both org tables (expect orgs=1, organizations=1)'
SELECT 'orgs'          AS tbl, count(*) AS n FROM public.orgs
UNION ALL
SELECT 'organizations',         count(*)     FROM public.organizations;

\echo '== Q2: Slug values (expect mpb-health in both, no duplicates within each)'
SELECT 'orgs'          AS tbl, slug, count(*) FROM public.orgs          GROUP BY slug
UNION ALL
SELECT 'organizations',         slug, count(*) FROM public.organizations GROUP BY slug;

\echo '== Q3: org_memberships FK target (expect references_table = orgs)'
SELECT tc.constraint_name,
       ccu.table_name  AS references_table,
       ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage         kcu ON kcu.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage  ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name   = 'org_memberships'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'org_id';

\echo '== Q4: Row counts in champion-side tables (expect mostly 0 or low)'
SELECT 'org_invites'                AS t, count(*) FROM public.org_invites
UNION ALL SELECT 'white_label_configs',         count(*) FROM public.white_label_configs
UNION ALL SELECT 'white_label_email_templates', count(*) FROM public.white_label_email_templates
UNION ALL SELECT 'org_module_licenses',         count(*) FROM public.org_module_licenses
UNION ALL SELECT 'product_modules',             count(*) FROM public.product_modules
UNION ALL SELECT 'feature_flags',               count(*) FROM public.feature_flags
UNION ALL SELECT 'org_feature_overrides',       count(*) FROM public.org_feature_overrides
UNION ALL SELECT 'organization_subscriptions',  count(*) FROM public.organization_subscriptions
UNION ALL SELECT 'billing_events',              count(*) FROM public.billing_events
UNION ALL SELECT 'audit_logs',                  count(*) FROM public.audit_logs
ORDER BY 1;

\echo '== Q5: Distinct org_ids in CRM tables (expect 1 per table)'
SELECT 'crm_accounts'         AS t, count(DISTINCT org_id) AS n_orgs FROM public.crm_accounts
UNION ALL SELECT 'crm_contacts',               count(DISTINCT org_id) FROM public.crm_contacts
UNION ALL SELECT 'crm_deals',                  count(DISTINCT org_id) FROM public.crm_deals
UNION ALL SELECT 'crm_quotes',                 count(DISTINCT org_id) FROM public.crm_quotes
UNION ALL SELECT 'crm_invoices',               count(DISTINCT org_id) FROM public.crm_invoices
UNION ALL SELECT 'crm_pipeline_stages',        count(DISTINCT org_id) FROM public.crm_pipeline_stages
UNION ALL SELECT 'zoho_lead_submissions',      count(DISTINCT org_id) FROM public.zoho_lead_submissions
UNION ALL SELECT 'lead_activities',            count(DISTINCT org_id) FROM public.lead_activities
UNION ALL SELECT 'lead_tasks',                 count(DISTINCT org_id) FROM public.lead_tasks
UNION ALL SELECT 'lead_notifications',         count(DISTINCT org_id) FROM public.lead_notifications
ORDER BY 1;

\echo '== Q6: Role + status distribution in org_memberships'
SELECT role, status, count(*) AS n
FROM public.org_memberships
GROUP BY role, status
ORDER BY n DESC;

\echo '== Q7: Any CRM rows with unexpected org_id (expect 0)?'
WITH t(name) AS (VALUES
  ('crm_accounts'),('crm_contacts'),('crm_deals'),('crm_quotes'),('crm_invoices'),
  ('crm_pipeline_stages'),('zoho_lead_submissions'),('lead_activities'),
  ('lead_tasks'),('lead_notifications')
)
SELECT t.name,
       (SELECT count(*) FROM public.crm_accounts WHERE org_id IS DISTINCT FROM '00000000-0000-4000-a000-000000000001') AS bad
FROM t LIMIT 1;
-- (expand manually for each table if you want per-table breakdown)

\echo '== Q8: NULL org_id leaks across all CRM tables (expect 0)'
SELECT 'crm_accounts'    AS t, count(*) FROM public.crm_accounts    WHERE org_id IS NULL
UNION ALL SELECT 'crm_contacts',  count(*) FROM public.crm_contacts  WHERE org_id IS NULL
UNION ALL SELECT 'crm_deals',     count(*) FROM public.crm_deals     WHERE org_id IS NULL
UNION ALL SELECT 'crm_quotes',    count(*) FROM public.crm_quotes    WHERE org_id IS NULL
UNION ALL SELECT 'crm_invoices',  count(*) FROM public.crm_invoices  WHERE org_id IS NULL
UNION ALL SELECT 'crm_pipeline_stages',   count(*) FROM public.crm_pipeline_stages   WHERE org_id IS NULL
UNION ALL SELECT 'zoho_lead_submissions', count(*) FROM public.zoho_lead_submissions WHERE org_id IS NULL
UNION ALL SELECT 'lead_activities',       count(*) FROM public.lead_activities       WHERE org_id IS NULL
UNION ALL SELECT 'lead_tasks',            count(*) FROM public.lead_tasks            WHERE org_id IS NULL
UNION ALL SELECT 'lead_notifications',    count(*) FROM public.lead_notifications    WHERE org_id IS NULL
ORDER BY 1;

\echo '== Q9: Inventory of every FK pointing at public.orgs (will retarget)'
SELECT tc.table_name,
       kcu.column_name,
       tc.constraint_name,
       rc.delete_rule,
       rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage         kcu ON kcu.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage  ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints  rc  ON rc.constraint_name  = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'public'
  AND ccu.table_name   = 'orgs'
  AND ccu.column_name  = 'id'
ORDER BY tc.table_name;

\echo '== Q10: Inventory of every FK pointing at public.organizations (will add ON UPDATE CASCADE)'
SELECT tc.table_name,
       kcu.column_name,
       tc.constraint_name,
       rc.delete_rule,
       rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage         kcu ON kcu.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage  ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints  rc  ON rc.constraint_name  = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'public'
  AND ccu.table_name   = 'organizations'
  AND ccu.column_name  = 'id'
ORDER BY tc.table_name;

\echo '== Q11: Tables with org_id column AND no RLS enabled (will need policies in 0.A bundle)'
SELECT c.table_name
FROM information_schema.columns c
JOIN pg_class pgc ON pgc.relname = c.table_name
JOIN pg_namespace ns ON ns.oid = pgc.relnamespace AND ns.nspname = c.table_schema
WHERE c.table_schema = 'public'
  AND c.column_name  = 'org_id'
  AND pgc.relkind    = 'r'
  AND pgc.relrowsecurity = false
ORDER BY c.table_name;

\echo '== Q12: Anything that depends on the orphan a0000000-...-001 UUID?'
SELECT 'organizations.id' AS where_, count(*) AS n FROM public.organizations WHERE id = 'a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'org_invites.org_id',                count(*) FROM public.org_invites                WHERE org_id = 'a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'white_label_configs.org_id',        count(*) FROM public.white_label_configs        WHERE org_id = 'a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'org_module_licenses.org_id',        count(*) FROM public.org_module_licenses        WHERE org_id = 'a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'organization_subscriptions.org_id', count(*) FROM public.organization_subscriptions WHERE org_id = 'a0000000-0000-0000-0000-000000000001'
ORDER BY 1;

-- ============================================================================
-- Expected outcomes — every assertion must hold
-- ============================================================================
-- Q1:  orgs=1, organizations=1
-- Q2:  one row each, both slug='mpb-health'
-- Q3:  references_table='orgs'
-- Q4:  all near-zero (single-digit at most)
-- Q5:  every CRM table reports n_orgs=1
-- Q6:  roles are subset of {owner, admin, manager, agent, member}; no 'advisor'
-- Q7+Q8: zero rows
-- Q9:  list of FKs to retarget (Phase 0.A step 6) — expect ~22+ entries
-- Q10: list of FKs to make ON UPDATE CASCADE (Phase 0.A step 3) — expect ~25+ entries
-- Q11: list of tables to add RLS to (Phase 0.A step 10) — review before bundling
-- Q12: confirm orphan UUID dependencies are absorbable in step 5
-- ============================================================================

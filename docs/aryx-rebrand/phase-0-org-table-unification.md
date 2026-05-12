# Phase 0 — Org Table Unification

**Status:** Draft for review. No SQL yet. Read-only investigation complete.
**Author:** assisted draft, 2026-05-12.
**Goal:** consolidate `public.orgs` and `public.organizations` into a single tenant table so that licensing, branding, and new-tenant onboarding can be built on a sound foundation. mpb health must continue running without interruption.

---

## 1. The defect we're fixing

Two `org` tables exist in production:

| | `public.orgs` | `public.organizations` |
|---|---|---|
| Created by | `20260128000000_phase0_security_tenancy_hardening.sql` | `20260128211500_champion_organizations.sql` |
| MPB id | `00000000-0000-4000-a000-000000000001` | `a0000000-0000-0000-0000-000000000001` |
| Slug | `mpb-health` | `mpb-health` (collision — same value, two tables) |
| Role enum | `owner / admin / manager / agent / member` | `owner / admin / manager / advisor` |
| Tracks branding? | `logo_url` only | `brand_config jsonb`, `logo_url` (jsonb-nested) |
| Tracks subscription? | no | `subscription_tier`, `subscription_status`, `trial_ends_at` |
| Tracks limits? | no | `max_users`, `max_contacts`, `max_sequences` |
| What FKs here? | `org_memberships` (the only membership table), 22 CRM-side tables (`crm_accounts`, `crm_contacts`, `crm_deals`, `crm_quotes`, `crm_invoices`, lead/task tables, …) | 23 champion-side tables (`org_invites`, audit_logs, billing, priority_os, engagement_inbox, compliance_ai, automation, analytics, settings, …) plus `white_label_configs`, `org_module_licenses`, `feature_flags`, `org_feature_overrides`, `organization_subscriptions` |
| Helper functions | `auth_uid`, `current_user_org_ids`, `is_org_member`, `is_org_admin`, `is_org_role`, `has_org_permission`, `user_org_role` | `get_user_org_ids`, `get_user_primary_org_id`, `user_has_org_access`, `user_has_org_role` |

Critically, **`org_memberships` only exists once** (both migrations use `CREATE TABLE IF NOT EXISTS`; phase0 ran first because of timestamp order — `…128000000` < `…128211500`). It FKs to `public.orgs`. The champion migrations *attempted* to backfill memberships into the `organizations` table but the guard in `20260128300002_champion_add_org_ids.sql` at lines 470–511 explicitly skips the backfill when it detects this FK mismatch, logging `'Skipping membership creation - schema mismatch or missing tables'`.

**Consequence**: the champion-side tables (priority_os, engagement_inbox, compliance_ai, automation, billing, settings, analytics, white_label_configs, licensing tables) have no membership-validated users in `org_memberships` pointing at the right org. Their RLS likely blocks all reads for anyone who isn't `service_role`, or the apps are accessing them with `service_role` and skipping RLS entirely. Either way, this means **champion-side production data volume is likely near-zero** — which makes the consolidation much easier than it looks at first.

This must be verified with a row-count pre-flight before committing. See §3.

---

## 2. Survivor choice

**Recommendation: keep `organizations`, drop `orgs`.**

Rationale:
- `organizations` already carries the columns required for white-label / SaaS licensing: `brand_config`, `subscription_tier`, `subscription_status`, `trial_ends_at`, `max_users`, `max_contacts`, `max_sequences`.
- `white_label_configs`, `org_module_licenses`, `feature_flags`, `org_feature_overrides`, `organization_subscriptions`, `org_invites` all FK to `organizations` — these are the tables we **want** to activate, so retargeting them backwards into `orgs` would be a step away from where we're going.
- `org_invites` is a real feature (token-based onboarding) we want to keep. It FKs to `organizations`.
- `orgs.settings jsonb` and `orgs.logo_url` have analogues in `organizations.settings jsonb` and `organizations.brand_config.logoUrl`. No data loss.

The cost: every table currently FK'd to `orgs(id)` (org_memberships + ~22 CRM tables) must be retargeted, and every row in those tables that has `org_id = '00000000-…-001'` must be updated to `org_id = 'a0000000-…-001'`. This is the bulk of the migration.

---

## 3. Pre-flight checks (read-only, run before designing the cutover)

Before touching anything, run these to confirm assumptions. **Do not proceed to §4 until the user has reviewed the output of every one of these.**

```sql
-- Q1: Row counts in both org tables (expect ~1 each)
SELECT 'orgs' AS tbl, count(*) FROM public.orgs
UNION ALL
SELECT 'organizations', count(*) FROM public.organizations;

-- Q2: Slug collisions (expect 1 row with slug='mpb-health' in each)
SELECT 'orgs' AS tbl, slug, count(*) FROM public.orgs GROUP BY slug
UNION ALL
SELECT 'organizations', slug, count(*) FROM public.organizations GROUP BY slug;

-- Q3: org_memberships FK target (confirm it points at orgs, not organizations)
SELECT tc.constraint_name, ccu.table_name AS references_table, ccu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'org_memberships' AND tc.constraint_type = 'FOREIGN KEY';

-- Q4: Row counts in champion-side tables (expect mostly zero or very low)
SELECT 'org_invites' AS t, count(*) FROM public.org_invites
UNION ALL SELECT 'white_label_configs', count(*) FROM public.white_label_configs
UNION ALL SELECT 'org_module_licenses', count(*) FROM public.org_module_licenses
UNION ALL SELECT 'organization_subscriptions', count(*) FROM public.organization_subscriptions
-- add the remaining ~19 champion tables here
;

-- Q5: Distinct org_ids in each CRM table (expect 1: '00000000-…-001')
SELECT 'crm_accounts' AS t, count(DISTINCT org_id) AS n_orgs FROM public.crm_accounts
UNION ALL SELECT 'crm_contacts', count(DISTINCT org_id) FROM public.crm_contacts
UNION ALL SELECT 'crm_deals',    count(DISTINCT org_id) FROM public.crm_deals
UNION ALL SELECT 'crm_quotes',   count(DISTINCT org_id) FROM public.crm_quotes
UNION ALL SELECT 'crm_invoices', count(DISTINCT org_id) FROM public.crm_invoices
-- add the rest of the 22 tables here
;

-- Q6: Role distribution in org_memberships (expect mostly 'owner'/'admin'/'agent'/'member';
-- any 'advisor' rows indicate someone was inserted using the champion enum and need remapping)
SELECT role, status, count(*) FROM public.org_memberships GROUP BY role, status ORDER BY count(*) DESC;

-- Q7: Any rows in CRM tables with org_id that ISN'T '00000000-…-001'?
-- (would mean partial multi-tenancy already exists and we need to handle it)
SELECT 'crm_accounts' AS t, org_id, count(*) FROM public.crm_accounts WHERE org_id IS DISTINCT FROM '00000000-0000-4000-a000-000000000001' GROUP BY org_id
-- repeat for other CRM tables
;

-- Q8: NULL org_id leaks (rows that shouldn't exist post-phase0 backfill)
SELECT 'crm_accounts' AS t, count(*) FROM public.crm_accounts WHERE org_id IS NULL
-- repeat for others
;
```

**Expected outcomes if assumptions hold:**
- Q1: orgs=1, organizations=1
- Q4: all near-zero
- Q5: every CRM table has `n_orgs = 1`
- Q6: no `advisor` rows in org_memberships
- Q7/Q8: zero rows

**If any of these are surprising, stop and revise the plan.**

---

## 4. The migration design

### 4.1 Survivor row strategy

The phase0 mpb UUID `00000000-0000-4000-a000-000000000001` is referenced by tens of thousands of CRM rows. The champion mpb UUID `a0000000-0000-0000-0000-000000000001` is referenced by a handful of license/config rows (per Q4 expectations).

**Choice: make `organizations` adopt the orgs UUID.** Two ways:

**Option A — Move data forward, keep orgs UUID as canonical.**
1. Update `public.organizations` row with slug `mpb-health` to set `id = '00000000-0000-4000-a000-000000000001'`. This requires:
   - Adding `ON UPDATE CASCADE` to every FK pointing at `organizations(id)` (or temporarily dropping/recreating those FKs), since most champion-side FKs do not have it.
   - Or: temporarily disabling triggers, doing the update, fixing FK children.
2. Re-FK every CRM table from `orgs(id)` to `organizations(id)` (no row data changes — the UUID is already correct).
3. Drop `orgs`.

**Pro:** zero data changes to CRM rows (the heavy tables).
**Con:** changing a PK on a live table is risky; ON UPDATE CASCADE has to be added everywhere first.

**Option B — Update CRM rows to use the champion UUID.**
1. Add new FK constraint on every CRM table referencing `organizations(id)` instead of `orgs(id)` (as `NOT VALID` initially).
2. Batch-update every CRM row: `UPDATE … SET org_id = 'a0000000-…-001' WHERE org_id = '00000000-…-001'` in chunks of 10k.
3. `VALIDATE CONSTRAINT` to mark FK valid.
4. Drop old FK to `orgs(id)`.
5. Drop `orgs`.

**Pro:** standard online-migration pattern; well understood; no PK changes.
**Con:** touches every row in every CRM table (estimated tens of thousands across 22 tables).

**Recommendation: Option A.** The CRM tables are the larger surface; touching their data is the bigger risk. The champion side has few rows (per Q4), so adding ON UPDATE CASCADE and doing a single PK update is safer than mass row updates on hot tables. We should sanity-check the champion-side FK count first (estimate ~25 FKs to add ON UPDATE CASCADE to), but if it's manageable, A wins.

### 4.2 Role-enum unification

Phase0 uses `('owner','admin','manager','agent','member')`. Champion uses `('owner','admin','manager','advisor')`. `org_memberships` currently uses the phase0 check constraint (since phase0 ran first).

**Decision needed**: do we map `agent ↔ advisor` (semantic merge), or keep both?

Recommendation: **keep both, treat them as synonyms during a deprecation window.** Change the check constraint to `('owner','admin','manager','agent','advisor','member')`. Helper functions like `is_org_admin` already only check `('owner','admin')` so they're unaffected. Any RLS or code that checks `role = 'agent'` continues to work; future champion-aware code can use `'advisor'` without rejection.

This avoids needing to rewrite the phase0 backfill (super_admin → owner, admin → admin, advisor → agent, member → member) or invalidating any historic data.

### 4.3 Helper-function unification

Phase0's set is used by RLS policies on `orgs`, `org_memberships`, `permissions`, `role_permissions`, `audit_events`, and 5 CRM tables.

Champion's set (`get_user_org_ids`, `get_user_primary_org_id`, `user_has_org_access`, `user_has_org_role`) is used by champion table RLS policies.

**Strategy:** keep both function sets, redefine champion's set as thin wrappers over phase0's. Specifically:
- `get_user_org_ids()` → `SELECT current_user_org_ids()`
- `user_has_org_access(p_org_id)` → `SELECT is_org_member(p_org_id)`
- `user_has_org_role(p_org_id, p_role)` → `SELECT is_org_role(p_org_id, p_role)` (note: also adapts to the role synonym handling)

This avoids touching the dozens of RLS policies that reference these functions. Mark champion's set as deprecated in comments.

### 4.4 RLS on champion tables that lack policies

The RLS audit flagged that some champion_automation tables have `org_id` columns but lack RLS policies (`ai_automation_rules`, `automation_execution_log`). This is a Phase-0 cleanup item, not blocking, but should ship in the same migration so the system is consistent after cutover. Add standard `is_org_member(org_id)` SELECT/INSERT/UPDATE policies and `is_org_admin(org_id)` for DELETE.

### 4.5 Data migration steps (Option A)

A single migration file, run in a transaction. (If transaction proves too long, split into a sequenced pair.)

```
-- Step 1: Lock briefly, capture state
SELECT pg_advisory_xact_lock(8675309);  -- prevent concurrent migration

-- Step 2: Verify pre-flight assumptions (raise exception if violated)
DO $$ BEGIN
  IF (SELECT count(*) FROM organizations WHERE slug = 'mpb-health') != 1 THEN
    RAISE EXCEPTION 'precondition failed: organizations.mpb-health row count != 1';
  END IF;
  IF (SELECT count(*) FROM orgs WHERE slug = 'mpb-health') != 1 THEN
    RAISE EXCEPTION 'precondition failed: orgs.mpb-health row count != 1';
  END IF;
  -- Add asserts for: org_memberships FK target, role distribution, etc.
END $$;

-- Step 3: Add ON UPDATE CASCADE to every FK pointing at organizations(id)
-- (drop and recreate each FK constraint with ON UPDATE CASCADE)
-- Generated dynamically from information_schema, or hand-listed for all ~25 constraints.

-- Step 4: Update organizations.id to adopt orgs.id (the canonical CRM UUID)
UPDATE organizations
SET id = '00000000-0000-4000-a000-000000000001'
WHERE id = 'a0000000-0000-0000-0000-000000000001';
-- (cascades to all FK children due to step 3)

-- Step 5: Merge fields from orgs.mpb-health into organizations.mpb-health
UPDATE organizations o
SET name = src.name,
    settings = o.settings || src.settings,           -- jsonb merge
    brand_config = jsonb_set(
      o.brand_config,
      '{logoUrl}',
      to_jsonb(src.logo_url),
      true
    )
FROM (SELECT name, settings, logo_url FROM orgs WHERE slug = 'mpb-health') src
WHERE o.slug = 'mpb-health';

-- Step 6: Drop FKs from CRM tables to orgs, recreate pointing at organizations
-- For each of the ~22 CRM tables:
--   ALTER TABLE x DROP CONSTRAINT x_org_id_fkey;
--   ALTER TABLE x ADD CONSTRAINT x_org_id_fkey
--     FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Step 7: Drop FK from org_memberships to orgs, recreate pointing at organizations
ALTER TABLE org_memberships DROP CONSTRAINT org_memberships_org_id_fkey;
ALTER TABLE org_memberships ADD CONSTRAINT org_memberships_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Step 8: Unify role enum
ALTER TABLE org_memberships DROP CONSTRAINT org_memberships_role_check;
ALTER TABLE org_memberships ADD CONSTRAINT org_memberships_role_check
  CHECK (role IN ('owner','admin','manager','agent','advisor','member'));

-- Step 9: Move RLS policies from orgs to organizations (they already exist there with similar logic;
-- audit for differences and pick the stricter version)

-- Step 10: Redefine champion helper functions as wrappers over phase0 helpers

-- Step 11: Add RLS to champion_automation tables missing policies
--   (ai_automation_rules, automation_execution_log — confirmed from RLS audit)

-- Step 12: Drop the orgs table
DROP TABLE public.orgs CASCADE;
-- (CASCADE drops policies and the seed; all FKs already moved in step 6)
```

Total estimated duration on prod: **5–15 seconds of writes**, no long locks if FKs are added/dropped with explicit `ALTER` (PG takes brief access-exclusive lock per table — fine for small/medium CRM tables; verify with `pg_locks` monitoring during a Supabase branch dry-run).

### 4.6 Code-side changes required after migration

After the migration ships, the codebase has to stop referencing `orgs` anywhere. Audit:
- Migrations: no future migration may FK to `orgs` (it's dropped).
- Helper functions: phase0's set continues to work; champion's set re-routes.
- TypeScript types: regenerate via `pnpm run db:generate` and check for any direct references to an `orgs` table in `packages/database/src/types/database.ts` and downstream.
- Application code: grep across `apps/*/src` and `packages/*/src` for `from('orgs')`, `.orgs(`, `"orgs"`, `'orgs'`. Recommend doing this audit in a follow-up commit *before* the migration ships, so deploy = atomic.

---

## 5. Rollback strategy

Rolling back after the `orgs` table is dropped is hard. So we make the migration **two-phase** in production:

**Phase 0.A (reversible, ships first):**
- Steps 1–11 of §4.5. The `orgs` table is renamed `orgs_deprecated` instead of dropped, and a redirect-view is created: `CREATE VIEW orgs AS SELECT id, name, slug, domain, logo_url, settings, status, created_at, updated_at FROM organizations`. RLS policies on the view get inherited.
- Application code and tests run for ~7 days against this state.
- Rollback path: drop the view, rename `orgs_deprecated` back to `orgs`, re-fail FKs. Possible but ugly; doable in <1 hour.

**Phase 0.B (irreversible, ships after soak):**
- `DROP TABLE orgs_deprecated CASCADE`.

This bisects the risk: the dangerous part (changing PKs and FKs) ships first and is observable for a week; the irreversible part is a one-line cleanup.

---

## 6. Verification plan

**Dry run** — on a Supabase branch DB:
1. Clone production schema + data to a branch.
2. Apply migration.
3. Run a smoke test suite covering: login, CRM read/write, advisor portal navigation, concierge log entry, admin module-management page, audit event creation.
4. Verify `org_memberships.org_id` resolves correctly for every active user.
5. Verify `is_org_member(org_id)` returns true for every existing member.
6. Verify no orphaned rows (CRM rows with `org_id` not in `organizations`).

**Production cutover** — staged Sunday off-peak window:
1. Take a logical backup of `public` schema + `auth`.
2. Apply Phase 0.A.
3. Hit each portal's health endpoint and a representative CRM read.
4. Watch error rates in Vercel + Supabase logs for 30 min.
5. Hold for 7 days, then apply Phase 0.B.

**Acceptance criteria:**
- Zero increase in 5xx rates post-cutover.
- Zero new "permission denied" errors in Supabase logs.
- Every active session continues working without re-auth.

---

## 7. Open questions for the user before writing SQL

1. **Survivor confirmed?** Keep `organizations`, drop `orgs` — agree?
2. **Migration option** — go with **Option A** (change PK on `organizations`, no CRM row updates) or **Option B** (update CRM rows to champion UUID)?
3. **Role enum** — agree on the superset approach (keep both `agent` and `advisor`)?
4. **Two-phase rollout?** Phase 0.A reversible + 7-day soak + Phase 0.B drop, vs. one shot drop?
5. **Champion table RLS gaps** — does it bother you to ship them in the same migration, or split into a follow-up?
6. **Cutover window** — what's the right time for the production migration? Sunday early-AM US? A specific maintenance window?
7. **`a0000000-…-001` orphan row** — Q4 of pre-flight will confirm what data depends on it. If anything non-trivial, we add an explicit data-merge step into §4.5 between steps 4 and 5.

Once those are answered, I can draft the actual `2026XXXX_unify_org_tables.sql` migration file plus a companion script that generates the FK list dynamically from `information_schema` (to avoid hand-listing 22+ CRM tables and 25+ champion FKs and getting one wrong).

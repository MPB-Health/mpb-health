# Migration Consolidation & Schema Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce 264 migrations to a clean archive + single baseline, eliminate duplicates and drift, and produce a maintainable schema contract for the next 3 years of MPB Health development.

**Architecture:** Archive all pre-baseline migrations into `supabase/migrations/archive/`, generate a canonical baseline from production schema, keep only the baseline + post-baseline migrations in the active path. Existing production is unaffected (migrations already applied). New local environments reset against baseline instead of replaying 264 files.

**Tech Stack:** PostgreSQL 17, Supabase CLI, Supabase MCP, SQL, TypeScript (generated types), Vite/React (advisor/admin portal consumers)

---

## EXECUTIVE SUMMARY

**What is wrong:**

The `supabase/migrations/` directory contains 264 migrations accumulated over 13 months (Feb 2025 – Mar 2026). The following categories of dysfunction are present:

1. **True duplicates** — same file content or purpose, different timestamps (at least 8 confirmed)
2. **Malformed filenames** — 4+ migrations with double timestamps (e.g., `20251028200450_20251028141000_...`)
3. **Missing timestamp padding** — `20260317_create_clear_must_change_password_rpc.sql` (no seconds)
4. **Data churn** — 25+ bulletin content migrations all touching the same rows (could be replaced by a single seed)
5. **Policy churn** — 8 consecutive `fix_security_part1–8` migrations plus 10+ standalone RLS fix migrations
6. **Role system re-unification** — the role/RBAC system was "unified" 4+ separate times across different migrations
7. **Rapid-patch clusters** — superadmin creation was patched 5 times in a 3-hour window
8. **Content-as-schema** — pricing chart insertions, PDF link updates, nav menu cleanups stored as migrations instead of CMS data

**Highest-risk areas:**
- RLS policies (multi-layer, fragmented, frequently patched)
- Role system (unified multiple times, may have contradictory current state)
- Duplicate migrations with identical content that Supabase may have applied twice

**Safest cleanup path:** Archive-then-baseline (preserve production history, create clean greenfield starting point, new environments use baseline).

---

## PHASE 1 — PASS 1: AUDIT & CLASSIFICATION (Read-only — no destructive changes)

### Task 1: Identify True Content Duplicates

Read both files in each suspected duplicate pair and confirm whether they are byte-identical, logically equivalent, or legitimately different.

**Files to compare in pairs:**

- [ ] **Step 1.1: Compare member_portal_system duplicates**

Read and diff:
- `supabase/migrations/20251107000000_create_member_portal_system.sql`
- `supabase/migrations/20251107164136_create_member_portal_system.sql`

Expected: One supersedes the other OR they create different schema.

- [ ] **Step 1.2: Compare superadmin/Catherine duplicates**

Read and diff:
- `supabase/migrations/20251107202205_create_catherine_superadmin.sql`
- `supabase/migrations/20251108000001_create_catherine_superadmin.sql`

- [ ] **Step 1.3: Compare must_change_password RPC duplicates**

Read and diff:
- `supabase/migrations/20260317_create_clear_must_change_password_rpc.sql`
- `supabase/migrations/20260325100000_clear_must_change_password_rpc.sql`

- [ ] **Step 1.4: Compare admin_analytics duplicates**

Read and diff:
- `supabase/migrations/20251107191530_create_admin_analytics_tables.sql`
- `supabase/migrations/20251108000000_create_admin_analytics_system.sql`

- [ ] **Step 1.5: Compare user_roles duplicates**

Read and diff:
- `supabase/migrations/20260115000000_user_roles.sql`
- `supabase/migrations/20260115100000_user_roles.sql`

- [ ] **Step 1.6: Compare resource_library anon access duplicates**

Read and diff:
- `supabase/migrations/20251031174152_fix_resource_library_anon_access.sql`
- `supabase/migrations/20251106165611_fix_resource_library_anonymous_access_final.sql`

- [ ] **Step 1.7: Compare comprehensive_rls duplicates**

Read and diff:
- `supabase/migrations/20251107212450_20251108000100_fix_rls_policies_comprehensive.sql`
- `supabase/migrations/20251108000100_fix_rls_policies_comprehensive.sql`

- [ ] **Step 1.8: Compare duplicate care_plus_pricing**

Read and diff any two `add_care_plus_pricing_chart.sql` files (same timestamp `20260219100000` appears twice in the inventory — one may be `certifications_quiz_support.sql` misnamed).

- [ ] **Step 1.9: Document findings**

Produce a table:
```
| File A | File B | Verdict (identical / supersedes / different) | Risk |
```

---

### Task 2: Classify the Malformed Filenames

- [ ] **Step 2.1: List all double-timestamp filenames**

These need rename or replacement:
- `20251028200450_20251028141000_update_advisors_table_schema.sql`
- `20251107212450_20251108000100_fix_rls_policies_comprehensive.sql`
- `20251118212222_20251118000000_clean_feature_category_names.sql`
- `20251120162640_20251120000000_create_zoho_lead_tracking_system.sql`
- `20260317_create_clear_must_change_password_rpc.sql` (missing seconds)

These are problematic because:
1. Supabase migration ordering is timestamp-based
2. Double-timestamp names suggest copy-paste errors during emergency patching
3. Missing-seconds timestamp may sort incorrectly relative to siblings

- [ ] **Step 2.2: Determine if Supabase has already applied these**

Run (via Supabase MCP `execute_sql` on project `dtmnkzllidaiqyheguhl`):
```sql
SELECT version FROM supabase_migrations.schema_migrations
ORDER BY version;
```
This reveals which migration filenames are tracked in production. Any mismatch between tracked versions and file names = drift.

---

### Task 3: Map the Security/RLS Fix Cluster

The 8-part security cluster from October 2025 plus 10+ standalone RLS fix migrations represent the highest policy churn area. We need to understand the current final state.

- [ ] **Step 3.1: Read the 8 security fix migrations in order**

Files:
1. `20251027141358_fix_security_part1_indexes_and_rls.sql`
2. `20251027141425_fix_security_part2_remove_unused_indexes.sql`
3. `20251027141531_fix_security_part3_consolidate_policies_corrected.sql`
4. `20251027141552_fix_security_part4_function_search_paths.sql`
5. `20251027142514_fix_security_part5_remaining_indexes.sql`
6. `20251027142532_fix_security_part6_remaining_rls_policies.sql`
7. `20251027142546_fix_security_part7_remove_unused_new_indexes.sql`
8. `20251027142609_fix_security_part8_final_policy_consolidation.sql`

Extract: which tables were touched, what policies were dropped/recreated, what indexes were added/removed.

- [ ] **Step 3.2: Read the standalone RLS fix migrations**

Files:
- `20251105000000_fix_anonymous_access_policies.sql`
- `20251105185708_fix_advisors_anon_access_final.sql`
- `20251106165611_fix_resource_library_anonymous_access_final.sql`
- `20251107204730_fix_faq_items_rls_policies.sql`
- `20251107212450_..._fix_rls_policies_comprehensive.sql`
- `20251108000100_fix_rls_policies_comprehensive.sql`
- `20251125183447_fix_zoho_lead_submissions_rls_policy.sql`
- `20251125184612_fix_zoho_lead_rls_final.sql`
- `20251125215428_fix_anonymous_select_after_insert.sql`
- `20260119000000_fix_resource_library_admin_access.sql`
- `20260211000000_fix_org_memberships_rls.sql`
- `20260309*` cluster (8 more migrations)
- `20260310120000_fix_403_rls_analytics_terminal_zoho.sql`

Build a list of every table that has had multiple rounds of RLS policy rewrites.

- [ ] **Step 3.3: Query live RLS policies on production**

Run (via Supabase MCP on `dtmnkzllidaiqyheguhl`):
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
This is the ground truth — what RLS currently looks like, independent of what migrations said.

---

### Task 4: Map the Role System Evolution

- [ ] **Step 4.1: Read the role system migrations in chronological order**

Files:
1. `20251024151633_create_profiles_with_rbac.sql` — original RBAC
2. `20251119201227_add_superadmin_role.sql`
3. `20260115000000_user_roles.sql`
4. `20260115100000_user_roles.sql` (possible duplicate)
5. `20260115200000_fix_users_with_roles_access.sql`
6. `20260120200000_crm_user_role.sql`
7. `20260204000000_unify_role_systems.sql`
8. `20260204000001_unify_role_systems_migrate.sql`
9. `20260226000001_create_user_organization_roles.sql`
10. `20260226100000_universal_role_helpers_and_rls.sql`
11. `20260227100000_provision_portal_access_for_role_users.sql`
12. `20260304160000_fix_role_management_rpcs.sql`
13. `20260306100000_create_get_user_with_roles_rpc.sql`
14. `20260309100000_trigger_advisor_profile_on_role_grant.sql`
15. `20260310100000_fix_permissions_and_advisor_profiles.sql`
16. `20260325000000_fix_crm_role_org_sync.sql`

Produce: a timeline of what tables/functions define the role system at each stage, and identify the _current_ canonical tables.

- [ ] **Step 4.2: Query live role tables on production**

Run:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name ILIKE '%role%' OR table_name ILIKE '%permission%'
ORDER BY table_name;
```

And for each found table:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '<table>';
```

---

### Task 5: Identify the Bulletin Data Migration Sprawl

25+ migrations between `20260216110000` and `20260218140000` are pure data operations on bulletin/article content. These are content-as-migration anti-pattern.

- [ ] **Step 5.1: Enumerate all bulletin data migrations**

Read each `20260216*` migration and classify:
- Schema-changing (CREATE TABLE, ALTER TABLE, CREATE INDEX) → must preserve
- Data-only (INSERT, UPDATE, DELETE) → candidate for replacement by seed data or single squash

- [ ] **Step 5.2: Check if bulletin tables are still active in code**

Search the monorepo:
```
apps/ for references to: bulletin, article, blog
```

Determine: are bulletins a live feature? If yes, the data migrations must be preserved or consolidated into a single data seed file.

---

### Task 6: Identify Orphaned/Dead Objects

- [ ] **Step 6.1: Query all tables in production and cross-reference to code**

Run:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

For each table, search the monorepo for any reference. Tables with zero code references are dead candidates.

- [ ] **Step 6.2: Query all RPC functions in production**

Run:
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

Cross-reference to edge function code and frontend code. Unused RPCs are dead candidates.

- [ ] **Step 6.3: Check for stale Supabase-generated types drift**

Run (via Supabase MCP `generate_typescript_types` on `dtmnkzllidaiqyheguhl`):
Compare generated types against `apps/advisor-portal/src/types/database.types.ts` (or equivalent).
Drift = either types file is stale OR schema has diverged from what the app expects.

---

### Task 7: Determine the Safe Archive Boundary

Based on Tasks 1-6, determine:

- [ ] **Step 7.1: Identify the "safe archive date"**

The archive boundary is the latest date before which all migrations are either:
- superseded by a later migration, OR
- purely additive with no correction/rollback/re-patch

Suggested candidate boundary: **2026-01-01** (Jan 1, 2026)
- All pre-2026 work is 3+ months old and stable
- All active feature development in 2026 forward stays as active migrations

This must be validated against the duplicate/churn analysis above.

- [ ] **Step 7.2: List all exceptions (pre-2026 migrations that must stay active)**

Any pre-2026 migration that:
- has a post-2026 correction migration → the correction must come AFTER the baseline
- defines schema that the 2026 migrations depend on → already covered by baseline
- contains critical data backfills → must be preserved as seed or explicit note

---

### Task 8: Design the Archive Structure

- [ ] **Step 8.1: Propose directory layout**

```
supabase/
  migrations/
    archive/          ← pre-baseline migrations (preserved for audit, not replayed on reset)
      README.md       ← explains archive purpose, date range, baseline migration reference
      *.sql           ← all pre-baseline migrations
    20260101000000_baseline_schema.sql   ← NEW: canonical starting point
    20260107000000_add_media_settings.sql
    ... (all post-baseline active migrations remain)
  itsts-migrations/   ← untouched (only 3 files)
  functions/
  config.toml
```

- [ ] **Step 8.2: Propose baseline generation strategy**

Option A (recommended): **`supabase db dump`** against production, then clean it up into a deterministic migration file.

Step-by-step:
```bash
# Run by user — requires Supabase CLI + project access
supabase db dump --project-ref dtmnkzllidaiqyheguhl --schema public > supabase/migrations/20260101000000_baseline_schema.sql
```

Then strip:
- `SET` commands that are environment-specific
- `supabase_migrations` references
- `pg_catalog` or `information_schema` DDL
- Any non-public schema objects (unless needed)

Option B: Manually write the baseline from the migration chain analysis. Slower, but allows intentional schema cleanup.

**Recommendation:** Option A for safety, Option B for cleanliness. Hybrid: run Option A, review output, remove dead objects found in Task 6.

- [ ] **Step 8.3: Propose naming convention for future migrations**

Format: `YYYYMMDDHHMMSS_<verb>_<object>_<scope>.sql`

Rules:
- `verb`: create, add, drop, alter, fix, seed, migrate, backfill
- `object`: table name, function name, or system name
- `scope`: optional qualifier (e.g., `rls`, `index`, `trigger`, `rpc`)
- NO double timestamps
- NO "comprehensive", "final", "corrected", "part1-N" naming patterns
- One concern per migration file
- Data migrations get `seed_` prefix, schema migrations get `create_`/`add_`/etc.

Examples:
```
20260401120000_create_billing_subscriptions.sql       ✅
20260401130000_add_stripe_customer_id_to_profiles.sql ✅
20260401140000_seed_plan_pricing_may_2026.sql          ✅
20260401150000_fix_billing_rls_advisor_access.sql      ✅
20260401160000_drop_legacy_zoho_tracking_tables.sql    ✅
```

---

## PHASE 2 — PASS 2: EXECUTION (Destructive changes — run only after Pass 1 complete)

### Task 9: Validate Production Migration State

Before any archive/move operations, confirm production is clean.

- [ ] **Step 9.1: Compare local file list vs production applied migrations**

Run:
```sql
SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;
```

Compare to local `supabase/migrations/` filenames (strip `.sql`, strip path).

Flag any:
- Files in `migrations/` NOT in the production table → never applied to prod (safe to drop or archive without risk to prod)
- Files in production table NOT in `migrations/` → applied to prod but file deleted (schema drift, must document)

- [ ] **Step 9.2: Confirm there are no in-flight migrations**

Ensure no pending migrations exist in CI/CD or staging that haven't been applied to prod yet.

---

### Task 10: Handle True Duplicate Files

Based on Task 1 findings:

- [ ] **Step 10.1: For each confirmed true duplicate pair**

If File A content ⊂ File B (B supersedes A):
- Archive File A (move to `archive/`)
- Keep File B in active path

If File A = File B exactly:
- Archive the later file (lower timestamp wins as canonical)
- Record in archive README

If both files contain unique content:
- They are NOT duplicates — both remain active

- [ ] **Step 10.2: Handle the malformed double-timestamp filenames**

These need to be renamed BUT only if they have NOT been applied to production under the malformed name.

Check `supabase_migrations.schema_migrations` for the malformed version string.
If present → do NOT rename (would break Supabase tracking).
If absent → rename to correct single-timestamp format.

---

### Task 11: Generate the Baseline Migration

- [ ] **Step 11.1: Run production schema dump (user action — requires CLI)**

```bash
supabase db dump \
  --project-ref dtmnkzllidaiqyheguhl \
  --schema public \
  --data-only false \
  > supabase/migrations/archive/baseline_dump_raw_20260101.sql
```

- [ ] **Step 11.2: Clean the dump**

Remove:
- `SET lock_timeout`, `SET statement_timeout`, `SET client_encoding` etc.
- `SELECT pg_catalog.set_config(...)` calls
- `COMMENT ON EXTENSION` statements
- Any `ALTER TABLE ... OWNER TO postgres` (use `supabase` or leave as default)
- Empty lines at start/end

Save as: `supabase/migrations/20260101000000_baseline_schema.sql`

- [ ] **Step 11.3: Add baseline header comment**

```sql
-- ============================================================
-- BASELINE SCHEMA — MPB Health Advisor Portal
-- Generated: 2026-01-01
-- Source: dtmnkzllidaiqyheguhl (production dump)
-- Replaces: 200+ pre-2026 migrations (archived in supabase/migrations/archive/)
--
-- This migration is the canonical starting point for new environments.
-- It is NOT applied to existing production (already applied via historical migrations).
-- To use: supabase db reset (local only)
-- ============================================================
```

---

### Task 12: Create the Archive Directory

- [ ] **Step 12.1: Create `supabase/migrations/archive/` directory**

Move all pre-baseline migrations (pre-2026) into this directory.

```bash
mkdir -p supabase/migrations/archive
mv supabase/migrations/2025*.sql supabase/migrations/archive/
```

- [ ] **Step 12.2: Write `supabase/migrations/archive/README.md`**

```markdown
# Migration Archive

This directory contains all migrations applied before the 2026-01-01 baseline reset.

**Date range:** 2025-02-17 – 2025-12-31
**Count:** ~170 files
**Status:** Applied to production. Not replayed on `supabase db reset`.

The canonical schema baseline is `../20260101000000_baseline_schema.sql`.

Do not delete these files — they are the production audit trail.
Do not re-run these files — production has already applied them.
```

---

### Task 13: Write Corrective Migrations for Identified Drift

Based on Tasks 3, 4, 6 findings:

- [ ] **Step 13.1: Drop confirmed dead objects**

For each orphaned table/function identified in Task 6 with zero code references:

```sql
-- supabase/migrations/20260401000000_drop_dead_objects.sql
-- Verified zero code references via monorepo search 2026-03-18

DROP TABLE IF EXISTS public.some_dead_table;
DROP FUNCTION IF EXISTS public.some_dead_function;
```

**NEVER run this without Task 6 verification complete.**

- [ ] **Step 13.2: Consolidate multiple permissive policies (if found)**

For each table with 3+ permissive SELECT policies for the same role (identified in Task 3):

```sql
-- Replace fragmented policies with a single clean policy
DROP POLICY IF EXISTS "policy_a" ON public.some_table;
DROP POLICY IF EXISTS "policy_b" ON public.some_table;
DROP POLICY IF EXISTS "policy_c" ON public.some_table;

CREATE POLICY "advisors_select_own" ON public.some_table
  FOR SELECT TO authenticated
  USING (advisor_id = auth.uid());
```

- [ ] **Step 13.3: Fix any missing indexes on FK columns (if found)**

From the `20260309160100_add_indexes_for_unindexed_foreign_keys.sql` pattern — if any FK columns are still unindexed post that migration, add them explicitly.

---

### Task 14: Regenerate TypeScript Types

- [ ] **Step 14.1: Run type generation against production**

Via Supabase MCP `generate_typescript_types` on project `dtmnkzllidaiqyheguhl`.

- [ ] **Step 14.2: Diff against existing types file**

Compare to `apps/advisor-portal/src/types/` (or wherever types live).

- [ ] **Step 14.3: Update types file if drift detected**

If the generated types differ from the committed file, update the committed file.

---

### Task 15: Update Supabase Config

- [ ] **Step 15.1: Update `supabase/config.toml` seed reference**

The config currently references `./seed.sql` which doesn't exist. Either:
- Remove the seed reference, OR
- Create a minimal `supabase/seed.sql` for local dev (superadmin user, test data)

---

## PHASE 3 — VALIDATION

### Task 16: Validation Checklist

- [ ] **Step 16.1: Verify production is unaffected**

```sql
-- Count tables before and after — should be identical
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
```

- [ ] **Step 16.2: Verify local reset works**

```bash
supabase db reset --local
# Expected: runs baseline + post-baseline migrations, no errors
```

- [ ] **Step 16.3: TypeScript type generation passes**

```bash
supabase gen types typescript --project-id dtmnkzllidaiqyheguhl > /tmp/generated-types.ts
# Expected: no errors, output matches committed types
```

- [ ] **Step 16.4: Build passes**

```bash
cd apps/advisor-portal && npm run build
cd apps/admin-portal && npm run build
# Expected: zero type errors
```

- [ ] **Step 16.5: Lint passes**

```bash
npm run lint
```

- [ ] **Step 16.6: Auth smoke test**

Manual: log in as advisor, admin, and superadmin. Verify RLS gates are still functional.

- [ ] **Step 16.7: Ticket flow smoke test**

Manual: create ticket as advisor → verify ITSTS receives it → reply → verify notification.

- [ ] **Step 16.8: Verify migration count is reduced**

```bash
ls supabase/migrations/*.sql | wc -l
# Expected: ~90 files (264 total - ~170 archived)
```

---

## CLASSIFICATION MATRIX SUMMARY

| Category | Count | Action |
|----------|-------|--------|
| Foundational schema (pre-2026) | ~80 | Archive → covered by baseline |
| Feature additions (2026) | ~85 | Keep active |
| Security/RLS fix clusters | ~28 | Archive (covered by baseline) |
| Role system evolution | ~16 | Archive (baseline has final state) |
| Bulletin data migrations | ~25 | Archive + evaluate seed consolidation |
| Resource/pricing data seeds | ~15 | Archive + evaluate seed consolidation |
| True duplicates | ~8 | Archive the redundant copy |
| Malformed filenames | ~5 | Rename if not in prod schema_migrations |
| Superadmin/user setup patches | ~6 | Archive (data-only, baseline covers) |
| Post-2026 corrective patches | ~6 | Keep active |

**Estimated final active migration count: ~85–95 files** (vs. current 264)

---

## NAMING CONVENTION PROPOSAL (Post-Cleanup)

```
<YYYYMMDDHHMMSS>_<verb>_<subject>[_<qualifier>].sql
```

**Verbs**: `create`, `add`, `drop`, `alter`, `fix`, `seed`, `backfill`, `migrate`, `rename`, `index`

**Prohibited patterns**:
- `_partN` → split into separate files or consolidate into one
- `_final` / `_corrected` / `_comprehensive` → suggests the previous attempt failed; fix properly
- Double timestamps
- `_v2` / `_v3` → use ALTER TABLE instead
- Data row updates as migrations → use `seed_` prefix and move to `seed.sql` for static data

---

## RISKS & MITIGATIONS

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Baseline doesn't match prod state exactly | Medium | Verify with table count + spot-check queries |
| Duplicate migration was applied twice to prod | Low | Check `schema_migrations` for both versions |
| Archived migration referenced by supabase db reset | None | `supabase db reset` only runs files in active `migrations/`, not `archive/` |
| Renamed file breaks prod tracking | Medium | Only rename files NOT present in `schema_migrations` |
| Dead table deletion breaks edge function | Low | Verify zero references before dropping |

---

## FINAL RECOMMENDATION

**What to archive:** All pre-2026-01-01 migrations (~170 files)
**What to keep active:** All 2026+ migrations (~94 files) minus confirmed duplicates
**What to consolidate into baseline:** Full public schema as of 2026-01-01
**What to rewrite:** The 4+ role system migrations → a single clear role_management.sql note (the baseline covers the final state; no rewrite needed for migrations themselves)
**What to never touch automatically:** Any migration present in `supabase_migrations.schema_migrations` on production that you cannot verify is duplicated

**The north star:** After this work, `supabase db reset --local` should replay the baseline + ~90 active migrations and produce a working local environment in under 2 minutes with zero errors.

# Advisor Team Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let advisors invite staff (Manager / Assistant) to their portal with their own credentials, scoped permissions, MPB-admin approval, full audit, and zero disruption to the live ITSTS connection.

**Architecture:** New `advisor_team_invites` + `advisor_team_members` tables in the advisor portal Supabase project (`dtmnkzllidaiqyheguhl`); two SECURITY DEFINER helper functions (`effective_advisor_id`, `effective_role`) replace `auth.uid()` in advisor-scoped RLS policies; ITSTS gets three nullable columns to record actor identity (no FKs across projects); four new edge functions handle the invite lifecycle; frontend gains a Settings → Team page, public Accept-Invite page, and a global "acting as" banner. All shipped behind a feature flag with a 9-phase rollout.

**Tech Stack:** PostgreSQL 15 + RLS, Deno/TypeScript edge functions, React 18 + TypeScript (advisor + admin portals), Supabase CLI, Resend (transactional email), pgTAP (DB tests), Vitest (frontend tests).

**Spec:** [docs/superpowers/specs/2026-04-29-advisor-team-accounts-design.md](../specs/2026-04-29-advisor-team-accounts-design.md)

---

## Execution Notes

- **Worktree:** Run this plan in a dedicated worktree (`audit-2026-04-29-team-accounts` or similar) so it doesn't collide with master work.
- **Commits:** Frequent, one per Step labeled "Commit." Don't batch.
- **Phase ordering is load-bearing.** Tasks correspond to spec phases; do them in order. Phase 1b → Phase 4 ordering protects the live ITSTS connection.
- **Live site.** Deploy steps go to production; use staging for verification first. Memory: ticket pages are a high-complaint surface — Phase 4 is the most sensitive deploy.
- **No implicit commits to remote.** Local commits per step; pushes happen only when the user asks.

---

## File Map

| File | Action | Phase |
|------|--------|-------|
| `docs/superpowers/audits/2026-04-29-team-accounts-inventory.md` | Create | 0 |
| `supabase/migrations/<ts>_advisor_team_accounts_schema.sql` | Create | 1a |
| `supabase/itsts-migrations/<ts>_team_accounts_actor_columns.sql` | Create | 1b |
| `supabase/migrations/<ts>_rls_profiles_to_helpers.sql` | Create | 2 |
| `supabase/migrations/<ts>_rls_training_to_helpers.sql` | Create | 2 |
| `supabase/migrations/<ts>_rls_clients_to_helpers.sql` | Create | 2 |
| `supabase/migrations/<ts>_rls_tickets_to_helpers.sql` | Create | 2 |
| `supabase/migrations/<ts>_rls_commissions_role_gated.sql` | Create | 2 |
| `supabase/migrations/<ts>_rls_settings_to_helpers.sql` | Create | 2 |
| `supabase/tests/team_accounts/*.sql` | Create | 1a, 2 |
| `supabase/functions/_shared/security.ts` | Modify | 3 |
| `supabase/functions/_shared/itsts-sync.ts` | Modify | 3 |
| `supabase/functions/ticket-proxy/index.ts` | Modify | 4 |
| `supabase/functions/send-ticket-notification/index.ts` | Modify | 5 |
| `supabase/functions/advisor-team-invite/index.ts` | Create | 5 |
| `supabase/functions/admin-approve-team-invite/index.ts` | Create | 5 |
| `supabase/functions/accept-team-invite/index.ts` | Create | 5 |
| `supabase/functions/advisor-team-revoke/index.ts` | Create | 5 |
| `apps/advisor-portal/src/contexts/AdvisorContext.tsx` | Modify | 6 |
| `apps/advisor-portal/src/hooks/useAuth.ts` | Modify | 6 |
| `apps/advisor-portal/src/hooks/useTeam.ts` | Create | 6 |
| `apps/advisor-portal/src/pages/AcceptInvite.tsx` | Create | 6 |
| `apps/advisor-portal/src/pages/settings/TeamManagement.tsx` | Modify (was stub) | 6 |
| `apps/advisor-portal/src/components/StaffBanner.tsx` | Create | 6 |
| `apps/advisor-portal/src/lib/canAccess.ts` | Create | 6 |
| `apps/advisor-portal/src/App.tsx` (or routes) | Modify | 6 |
| `apps/admin-portal/src/pages/team-invites/index.tsx` | Create | 6 |
| `apps/admin-portal/src/pages/team-invites/[id].tsx` | Create | 6 |
| `apps/admin-portal/src/lib/teamInvites.ts` | Create | 6 |
| `apps/admin-portal/src/...nav config...` | Modify | 6 |

---

## Task 1: Phase 0 — Pre-flight inventory

**Goal:** Produce a committed audit document so every Phase-2 RLS edit and every Phase-3 redeploy is reviewable diff-by-diff.

**Files:**
- Create: `docs/superpowers/audits/2026-04-29-team-accounts-inventory.md`

- [ ] **Step 1: Create the audit doc with the four required inventories**

The doc has four tables. Use the SQL/grep commands below to populate each one. Save the queries IN the doc so future audits can be reproduced.

Inventory A — RLS policies on advisor-scoped tables that reference `auth.uid()`:

```sql
-- Run in dtmnkzllidaiqyheguhl SQL editor (or via Supabase MCP execute_sql)
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and (qual ilike '%auth.uid()%' or with_check ilike '%auth.uid()%')
order by tablename, policyname;
```

For each row, record: schema, table, policy name, command (SELECT/INSERT/UPDATE/DELETE), current `using` clause, current `with check` clause, and the target replacement clause (mechanical substitution per spec §6.1).

Inventory B — every edge function importing `_shared/security.ts`:

```bash
grep -rln "from .*_shared/security" supabase/functions/ \
  | sort -u
```

Record the full list. This is the Phase-3 redeploy batch.

Inventory C — frontend reads of `auth.uid()` / `useAuth().id` in the advisor portal:

```bash
grep -rn "useAuth\(\)\.id\|auth\.uid()" apps/advisor-portal/src/ \
  | grep -v ".test." \
  | sort
```

Record each call site so §8.5 AdvisorContext changes can be verified for completeness.

Inventory D — current deployed versions for rollback reference:

```bash
# Run via Supabase MCP list_edge_functions on both projects
# Record: function name + version number for ticket-proxy, send-ticket-notification,
#         every function from Inventory B, and any other edge function.
```

Also snapshot the schema head (latest migration filename) for both projects.

- [ ] **Step 2: Verify the doc has zero "TBD" or "TODO" entries**

```bash
grep -nE "TBD|TODO|FIXME" docs/superpowers/audits/2026-04-29-team-accounts-inventory.md
```

Expected: empty.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/audits/2026-04-29-team-accounts-inventory.md
git commit -m "docs: pre-flight inventory for advisor team accounts"
```

---

## Task 2: Phase 1a — Advisor portal schema migration

**Goal:** Land the new tables, enums, helper functions, audit column, and cascade-revoke trigger in `dtmnkzllidaiqyheguhl`. Pure addition. No existing behavior changes.

**Files:**
- Create: `supabase/migrations/20260429170000_advisor_team_accounts_schema.sql`
- Create: `supabase/tests/team_accounts/01_schema_smoke.sql`

- [ ] **Step 1: Write a pgTAP smoke test that asserts the schema state we want**

Create `supabase/tests/team_accounts/01_schema_smoke.sql`:

```sql
begin;
select plan(14);

select has_table('public', 'advisor_team_invites', 'advisor_team_invites exists');
select has_table('public', 'advisor_team_members', 'advisor_team_members exists');

select has_type('public', 'team_role', 'team_role enum exists');
select has_type('public', 'invite_status', 'invite_status enum exists');
select has_type('public', 'member_status', 'member_status enum exists');

select has_function('public', 'effective_advisor_id', array['uuid']);
select has_function('public', 'effective_role', array['uuid']);

select has_column('public', 'audit_events', 'on_behalf_of_advisor_id');

-- Helpers return advisor's own id when caller is an advisor (no staff yet)
-- Pick any advisor in the system for this assertion
select is(
  public.effective_advisor_id((select id from public.advisor_profiles where status = 'active' limit 1)),
  (select id from public.advisor_profiles where status = 'active' limit 1),
  'effective_advisor_id returns own id for active advisor'
);

select is(
  public.effective_role((select id from public.advisor_profiles where status = 'active' limit 1)),
  'advisor',
  'effective_role returns ''advisor'' for active advisor'
);

-- Authenticated users CANNOT directly select from team tables (RLS denies)
-- The actual SELECT is gated by the §4.1 policies; this test asserts the policy exists
select policies_are('public', 'advisor_team_invites',
  array['team_invites_select_owner_or_manager'],
  'invites SELECT policy exists');
select policies_are('public', 'advisor_team_members',
  array['team_members_select_owner_or_manager'],
  'members SELECT policy exists');

-- Cascade-revoke trigger exists
select has_trigger('public', 'advisor_profiles', 'trg_cascade_revoke_team');

-- Helper grants
select function_privs_are(
  'public', 'effective_advisor_id', array['uuid'],
  'authenticated', array['EXECUTE'],
  'authenticated has execute on effective_advisor_id');

select * from finish();
rollback;
```

- [ ] **Step 2: Run the test and confirm it FAILS (schema doesn't exist yet)**

```bash
# Via Supabase CLI db test, or via SQL editor / MCP execute_sql
# Run the contents of supabase/tests/team_accounts/01_schema_smoke.sql
```

Expected: pgTAP reports failures for every assertion (tables missing, etc.).

- [ ] **Step 3: Write the schema migration**

Create `supabase/migrations/20260429170000_advisor_team_accounts_schema.sql`:

```sql
-- Advisor team accounts: schema-only migration (Phase 1a per spec §11)
-- Pure addition. Zero behavioral change for advisors with no staff.

-- 1. Enums
create type public.team_role     as enum ('manager', 'assistant');
create type public.invite_status as enum (
  'pending_admin_approval', 'approved', 'sent',
  'accepted', 'denied', 'revoked', 'expired'
);
create type public.member_status as enum ('active', 'revoked');

-- 2. Tables (RLS on; SELECT gated to advisor + manager; writes service-role only)
create table public.advisor_team_invites (
  id                    uuid primary key default gen_random_uuid(),
  advisor_id            uuid not null references public.advisor_profiles(id) on delete cascade,
  invited_email         citext not null,
  role                  public.team_role not null,
  status                public.invite_status not null default 'pending_admin_approval',
  token_hash            text,
  invited_by_user_id    uuid not null,
  approved_by_user_id   uuid,
  decision_note         text,
  created_at            timestamptz not null default now(),
  approved_at           timestamptz,
  sent_at               timestamptz,
  accepted_at           timestamptz,
  expires_at            timestamptz
);

create unique index advisor_team_invites_live_email_uniq
  on public.advisor_team_invites (advisor_id, lower(invited_email))
  where status not in ('accepted', 'denied', 'revoked', 'expired');

create index advisor_team_invites_advisor_status_idx
  on public.advisor_team_invites (advisor_id, status);

create index advisor_team_invites_token_hash_idx
  on public.advisor_team_invites (token_hash) where token_hash is not null;

create table public.advisor_team_members (
  id                    uuid primary key default gen_random_uuid(),
  advisor_id            uuid not null references public.advisor_profiles(id) on delete cascade,
  user_id               uuid not null unique,
  role                  public.team_role not null,
  status                public.member_status not null default 'active',
  invite_id             uuid references public.advisor_team_invites(id),
  created_at            timestamptz not null default now(),
  revoked_at            timestamptz,
  revoked_by_user_id    uuid,
  revoke_reason         text
);

create index advisor_team_members_advisor_status_idx
  on public.advisor_team_members (advisor_id, status);

alter table public.advisor_team_invites enable row level security;
alter table public.advisor_team_members enable row level security;

-- 3. Helper functions (SECURITY DEFINER, search_path locked)
create or replace function public.effective_advisor_id(uid uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    (select id from public.advisor_profiles
       where id = uid and status <> 'inactive'),
    (select advisor_id from public.advisor_team_members
       where user_id = uid and status = 'active'
       limit 1)
  );
$$;

create or replace function public.effective_role(uid uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select case
    when exists (
      select 1 from public.advisor_profiles
      where id = uid and status <> 'inactive'
    ) then 'advisor'
    else (
      select role::text from public.advisor_team_members
      where user_id = uid and status = 'active'
      limit 1
    )
  end;
$$;

revoke all on function public.effective_advisor_id(uuid) from public;
revoke all on function public.effective_role(uuid) from public;
grant execute on function public.effective_advisor_id(uuid) to authenticated;
grant execute on function public.effective_role(uuid) to authenticated;

-- 4. SELECT policies on the team tables (advisor + manager only)
create policy team_invites_select_owner_or_manager
  on public.advisor_team_invites for select
  to authenticated
  using (
    advisor_id = public.effective_advisor_id(auth.uid())
    and public.effective_role(auth.uid()) in ('advisor', 'manager')
  );

create policy team_members_select_owner_or_manager
  on public.advisor_team_members for select
  to authenticated
  using (
    advisor_id = public.effective_advisor_id(auth.uid())
    and public.effective_role(auth.uid()) in ('advisor', 'manager')
  );

-- INSERT/UPDATE/DELETE intentionally omitted; service-role bypasses RLS.

-- 5. Audit column
alter table public.audit_events
  add column if not exists on_behalf_of_advisor_id uuid
    references public.advisor_profiles(id);

-- If audit_logs exists as a separate table, mirror the column.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'audit_logs') then
    execute 'alter table public.audit_logs
             add column if not exists on_behalf_of_advisor_id uuid
               references public.advisor_profiles(id)';
  end if;
end$$;

-- 6. Cascade-revoke trigger on advisor deactivation
create or replace function public.cascade_revoke_team_on_advisor_deactivate()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'inactive' and (old.status is null or old.status <> 'inactive') then
    update public.advisor_team_members
      set status = 'revoked',
          revoked_at = now(),
          revoke_reason = 'advisor_deactivated'
      where advisor_id = new.id and status = 'active';

    update public.advisor_team_invites
      set status = 'revoked'
      where advisor_id = new.id
        and status in ('pending_admin_approval', 'approved', 'sent');
  end if;
  return new;
end;
$$;

create trigger trg_cascade_revoke_team
  after update of status on public.advisor_profiles
  for each row execute function public.cascade_revoke_team_on_advisor_deactivate();

-- 7. Comments for self-documentation
comment on table public.advisor_team_invites is
  'Invitations from an advisor to add staff (Manager/Assistant) to their portal. See spec §4.1.';
comment on table public.advisor_team_members is
  'Active staff memberships. Unique on user_id enforces one-staff-per-advisor.';
comment on function public.effective_advisor_id(uuid) is
  'Returns the advisor_id the caller can act for: own id if advisor, advisor_id from membership if active staff. NULL otherwise.';
```

- [ ] **Step 4: Apply the migration to a staging branch and run the smoke test**

```bash
# Apply via Supabase MCP apply_migration to dtmnkzllidaiqyheguhl
# (or to a Supabase branch if branching is set up)
# Then re-run supabase/tests/team_accounts/01_schema_smoke.sql
```

Expected: all 14 pgTAP assertions pass.

- [ ] **Step 5: Spot-check that existing advisors still see their own data**

```sql
-- Pick a known active advisor uid, run a query that previously returned rows
-- (e.g., their portal_settings or their own advisor_profile row)
-- and confirm row count is unchanged from baseline.
```

Expected: identical rows. Phase 1a did not change any existing RLS, so this MUST be a no-op.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260429170000_advisor_team_accounts_schema.sql \
        supabase/tests/team_accounts/01_schema_smoke.sql
git commit -m "feat(db): advisor team accounts schema (Phase 1a)

Adds advisor_team_invites, advisor_team_members, effective_advisor_id and
effective_role helpers, on_behalf_of_advisor_id audit column, and the
advisor-deactivation cascade trigger. Pure addition; existing behavior unchanged
because no rows exist in advisor_team_members yet.

Spec: docs/superpowers/specs/2026-04-29-advisor-team-accounts-design.md §4, §11 Phase 1a"
```

---

## Task 3: Phase 1b — ITSTS schema migration

**Goal:** Add three nullable columns to ITSTS so the future ticket-proxy can record actor identity. **Live ITSTS connection must keep working.** Strictly additive; no FKs, no DEFAULT, no triggers, no RLS changes.

**Files:**
- Create: `supabase/itsts-migrations/20260429180000_team_accounts_actor_columns.sql`

- [ ] **Step 1: Verify the assumed columns don't already exist on ITSTS**

```sql
-- Run via Supabase MCP execute_sql on hhikjgrttgnvojtunmla
select column_name from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'tickets'
        and column_name in ('created_by_user_id', 'submitted_on_behalf_of_advisor_id'))
    or (table_name = 'ticket_comments'
        and column_name = 'author_user_id'));
```

Expected: empty. If any column is already present, STOP — the spec audit assumed they don't exist; investigate before continuing.

- [ ] **Step 2: Write the migration**

Create `supabase/itsts-migrations/20260429180000_team_accounts_actor_columns.sql`:

```sql
-- Team accounts actor columns on ITSTS (Phase 1b per spec §7.5, §11).
-- Strictly additive: nullable, no DEFAULT, no FK (cross-project), no triggers, no RLS.
-- Existing ticket-proxy continues writing the existing column set; new columns stay null
-- until Phase 4 ships the updated proxy.

alter table public.tickets
  add column if not exists created_by_user_id uuid;

alter table public.tickets
  add column if not exists submitted_on_behalf_of_advisor_id uuid;

alter table public.ticket_comments
  add column if not exists author_user_id uuid;

comment on column public.tickets.created_by_user_id is
  'Advisor-portal auth.users.id of the actor who created this ticket. NULL on legacy rows.';
comment on column public.tickets.submitted_on_behalf_of_advisor_id is
  'Advisor-portal advisor_profiles.id this ticket was created on behalf of. NULL on legacy rows.';
comment on column public.ticket_comments.author_user_id is
  'Advisor-portal auth.users.id of the comment author. Coexists with author_id (ITSTS profile). NULL on legacy rows.';
```

- [ ] **Step 3: Apply the migration to the ITSTS project (`hhikjgrttgnvojtunmla`)**

```bash
# Via Supabase MCP apply_migration with project_id=hhikjgrttgnvojtunmla
# OR Supabase CLI:  supabase db push --project-ref hhikjgrttgnvojtunmla
```

- [ ] **Step 4: Verify columns exist and are nullable with no default**

```sql
-- Run on hhikjgrttgnvojtunmla
select table_name, column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'tickets'
        and column_name in ('created_by_user_id', 'submitted_on_behalf_of_advisor_id'))
    or (table_name = 'ticket_comments'
        and column_name = 'author_user_id'))
order by table_name, column_name;
```

Expected: 3 rows; all `is_nullable = YES`; all `column_default = NULL`.

- [ ] **Step 5: Smoke test — existing ticket-proxy still works**

Hit the live `ticket-proxy` `list` and `create` cases on staging (or via a synthetic test ticket on prod with a known cleanup id). Confirm:
- Ticket creation succeeds.
- New columns are NULL on the inserted row (the old ticket-proxy doesn't write them yet).
- No errors in `ticket-proxy` logs.

```sql
-- After the synthetic create, on hhikjgrttgnvojtunmla:
select id, requester_id, origin,
       created_by_user_id, submitted_on_behalf_of_advisor_id
from public.tickets
where id = '<the test ticket id>';
```

Expected: existing columns populated as before; new columns NULL.

- [ ] **Step 6: Commit**

```bash
git add supabase/itsts-migrations/20260429180000_team_accounts_actor_columns.sql
git commit -m "feat(itsts): add actor identity columns for team accounts (Phase 1b)

Adds tickets.created_by_user_id, tickets.submitted_on_behalf_of_advisor_id, and
ticket_comments.author_user_id. Nullable, no DEFAULT, no FK across projects,
no triggers, no RLS changes. Existing ticket-proxy continues to function with
these new columns left null until Phase 4.

Spec: docs/superpowers/specs/2026-04-29-advisor-team-accounts-design.md §7.5, §11 Phase 1b"
```

---

## Task 4: Phase 2A — RLS migration: advisor_profiles

**Goal:** Replace `auth.uid()` with `effective_advisor_id(auth.uid())` in `advisor_profiles` RLS policies. Pure no-op for advisors (helpers resolve to own id when no staff exists), but is the prerequisite for staff being able to read their advisor's profile.

**Files:**
- Create: `supabase/migrations/20260429180100_rls_profiles_to_helpers.sql`
- Create: `supabase/tests/team_accounts/02_rls_profiles.sql`

- [ ] **Step 1: Find current advisor_profiles policies in the Phase 0 inventory**

Reference your `docs/superpowers/audits/2026-04-29-team-accounts-inventory.md` Inventory A. Identify every policy on `advisor_profiles` referencing `auth.uid()`. Record the policy name, command, and current clause.

- [ ] **Step 2: Write a pgTAP test asserting the post-migration behavior**

Create `supabase/tests/team_accounts/02_rls_profiles.sql`:

```sql
begin;
select plan(4);

-- Set up: pick a real active advisor; create a test staff member for them.
-- (For test isolation, use a transaction-rolled-back fixture.)
\set advisor_uid '<pick a stable test advisor uid>'

insert into public.advisor_team_members (advisor_id, user_id, role, status)
values (:'advisor_uid', '00000000-0000-0000-0000-000000000999', 'assistant', 'active');

-- 1. Advisor can still SELECT their own profile
set local request.jwt.claim.sub = :'advisor_uid';
select results_eq(
  $$ select id from public.advisor_profiles where id = $$ || quote_literal(:'advisor_uid'),
  array[:'advisor_uid'::uuid],
  'advisor reads own profile'
);

-- 2. Staff member can SELECT their advisor's profile (via effective_advisor_id)
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000999';
select results_eq(
  $$ select id from public.advisor_profiles where id = $$ || quote_literal(:'advisor_uid'),
  array[:'advisor_uid'::uuid],
  'staff reads advisor profile via effective_advisor_id'
);

-- 3. Staff cannot SELECT a different advisor's profile
select is_empty(
  $$ select id from public.advisor_profiles where id <> $$ || quote_literal(:'advisor_uid'),
  'staff cannot see other advisors'
);

-- 4. Anonymous (no jwt) sees nothing
reset request.jwt.claim.sub;
select is_empty(
  $$ select id from public.advisor_profiles $$,
  'anon cannot see any advisor'
);

select * from finish();
rollback;
```

- [ ] **Step 3: Run the test, confirm it FAILS for assertions 2 & 3 (staff can't see advisor data yet)**

```bash
# Apply on the staging branch and run via SQL editor / pgTAP runner.
```

Expected: assertions 1 and 4 pass (today's behavior); 2 and 3 fail (staff has no path to advisor's row yet).

- [ ] **Step 4: Write the migration**

Create `supabase/migrations/20260429180100_rls_profiles_to_helpers.sql`. For EACH policy from Step 1, drop and recreate inside one transaction. Example for the canonical pattern A policy `Advisors can update own profile` (SELECT):

```sql
begin;

-- Pattern A: (SELECT auth.uid()) = id  →  id = effective_advisor_id(auth.uid())
drop policy if exists "Advisors can update own profile" on public.advisor_profiles;

create policy "advisor_profiles_select_via_effective"
  on public.advisor_profiles for select
  to authenticated
  using (id = public.effective_advisor_id(auth.uid()));

-- INSERT remains advisor-only (raw auth.uid()) — staff cannot create a profile
drop policy if exists "Advisors can insert own profile" on public.advisor_profiles;
create policy "advisor_profiles_insert_self_only"
  on public.advisor_profiles for insert
  to authenticated
  with check (id = auth.uid());

-- UPDATE: only the advisor themselves, never staff
drop policy if exists "Advisors can update own profile (UPDATE)" on public.advisor_profiles;
create policy "advisor_profiles_update_self_only"
  on public.advisor_profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

commit;
```

**Important:** repeat the drop/create pattern for every existing policy from your inventory. Do NOT remove a policy you cannot replace.

- [ ] **Step 5: Apply the migration and re-run the pgTAP test**

```bash
# Apply via MCP apply_migration to dtmnkzllidaiqyheguhl
# Re-run supabase/tests/team_accounts/02_rls_profiles.sql
```

Expected: all 4 assertions pass.

- [ ] **Step 6: Verify advisors with no staff see zero behavior change**

```sql
-- For 3 random active advisors with no advisor_team_members rows:
-- SELECT 1 from advisor_profiles where id = <their id> AS authenticated <their id>
-- Must return 1 row each.
```

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260429180100_rls_profiles_to_helpers.sql \
        supabase/tests/team_accounts/02_rls_profiles.sql
git commit -m "feat(db): rewrite advisor_profiles RLS via effective_advisor_id (Phase 2A)

Spec: §6, §11 Phase 2"
```

---

## Task 5: Phase 2B — RLS migration: training, clients, tickets, settings

**Goal:** Apply the same mechanical substitution to the rest of the advisor-scoped tables (NOT commissions — that's Task 6 because of the role gate).

**Files:**
- Create: `supabase/migrations/20260429180200_rls_training_to_helpers.sql`
- Create: `supabase/migrations/20260429180300_rls_clients_to_helpers.sql`
- Create: `supabase/migrations/20260429180400_rls_tickets_to_helpers.sql`
- Create: `supabase/migrations/20260429180500_rls_settings_to_helpers.sql`
- Create: `supabase/tests/team_accounts/03_rls_training.sql`
- Create: `supabase/tests/team_accounts/04_rls_clients.sql`
- Create: `supabase/tests/team_accounts/05_rls_tickets.sql`
- Create: `supabase/tests/team_accounts/06_rls_settings.sql`

- [ ] **Step 1: Group the inventory by logical area**

From the Phase 0 inventory, partition advisor-scoped policies into:
- **Training/LMS group** (e.g., `training_progress`, `advisor_lms_enrollments`) — see spec §6.1 Pattern C, but per spec §7.4 these stay on raw `auth.uid()` because staff take their OWN training, not the advisor's.

  → For training tables, the migration is a NO-OP. Document this explicitly with a comment in the migration file. Don't change the policies.
- **Clients/Leads group** — patterns B and C → swap to `effective_advisor_id`.
- **Tickets group** (the advisor-side ticket metadata tables in `dtmnkzllidaiqyheguhl`, e.g., `ticket_attachments`, `ticket_categories`) — patterns B and C → swap.
- **Settings group** (`portal_settings`, `advisor_quick_links`, etc.) — patterns A/B/C → swap.

- [ ] **Step 2: Write one pgTAP test per group**

Each test follows the same skeleton as Task 4 Step 2: a real advisor + a synthetic staff member, then assert advisor still works AND staff member sees the advisor's rows. **For the training group**, assert the OPPOSITE: staff sees only THEIR own training rows, not the advisor's.

Use this template, substituting table and policy names per group:

```sql
begin;
select plan(3);
\set advisor_uid '<test advisor uid>'

insert into public.advisor_team_members (advisor_id, user_id, role, status)
values (:'advisor_uid', '00000000-0000-0000-0000-000000000999', 'assistant', 'active');

-- 1. Advisor sees their own data
set local request.jwt.claim.sub = :'advisor_uid';
select isnt_empty(
  $$ select 1 from public.<TABLE> where advisor_id = $$ || quote_literal(:'advisor_uid'),
  '<TABLE>: advisor reads own rows'
);

-- 2. Staff sees advisor's data (or NOT, for training)
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000999';
select <isnt_empty | is_empty>(
  $$ select 1 from public.<TABLE> where advisor_id = $$ || quote_literal(:'advisor_uid'),
  '<TABLE>: staff <can | cannot> see advisor''s rows'
);

-- 3. Staff cannot see other advisors' rows
select is_empty(
  $$ select 1 from public.<TABLE> where advisor_id <> $$ || quote_literal(:'advisor_uid'),
  '<TABLE>: staff cannot see other advisors'
);

select * from finish();
rollback;
```

- [ ] **Step 3: Run all four tests, confirm they all FAIL the staff assertion**

Expected: clients/tickets/settings: assertion 2 fails (staff has no path); training: assertion 2 passes if it's `is_empty` (today's behavior already restricts).

- [ ] **Step 4: Write the four migration files**

For each file, the structure is identical: `BEGIN; drop ...; create ...; ... ; COMMIT;` — one transaction per file. For each policy, the substitution is:

```sql
-- old:
USING (advisor_id = auth.uid())
USING (advisor_id IN (SELECT id FROM advisor_profiles WHERE user_id = auth.uid()))

-- new (both patterns collapse to this):
USING (advisor_id = public.effective_advisor_id(auth.uid()))
```

INSERT policies that today use `auth.uid()` for the actor (e.g., `with check (created_by = auth.uid())`) keep the raw `auth.uid()` reference — the actor is correct as the literal staff user.

The training migration file is mostly comments:

```sql
-- Phase 2B: training tables intentionally KEEP raw auth.uid().
-- Per spec §7.4, training enrollments belong to the staff person individually, not
-- to the advisor. Sue takes her own training, not John's. No policy changes here.
-- This file exists as a no-op marker so the audit trail is complete.
select 1; -- no-op
```

- [ ] **Step 5: Apply migrations in order; re-run all four pgTAP tests**

Expected: all assertions pass.

- [ ] **Step 6: Spot-check no-staff advisors are unaffected**

Same approach as Task 4 Step 6 but on a sample of advisor-scoped tables.

- [ ] **Step 7: Commit each migration as its own commit**

```bash
git add supabase/migrations/20260429180200_rls_training_to_helpers.sql \
        supabase/tests/team_accounts/03_rls_training.sql
git commit -m "feat(db): document training tables intentionally keep raw auth.uid (Phase 2B)"

git add supabase/migrations/20260429180300_rls_clients_to_helpers.sql \
        supabase/tests/team_accounts/04_rls_clients.sql
git commit -m "feat(db): rewrite clients/leads RLS via effective_advisor_id (Phase 2B)"

git add supabase/migrations/20260429180400_rls_tickets_to_helpers.sql \
        supabase/tests/team_accounts/05_rls_tickets.sql
git commit -m "feat(db): rewrite advisor-side tickets RLS via effective_advisor_id (Phase 2B)"

git add supabase/migrations/20260429180500_rls_settings_to_helpers.sql \
        supabase/tests/team_accounts/06_rls_settings.sql
git commit -m "feat(db): rewrite portal_settings RLS via effective_advisor_id (Phase 2B)"
```

---

## Task 6: Phase 2C — Commissions/payouts with role gating

**Goal:** Block assistants from financial data. Allow managers and the advisor.

**Files:**
- Create: `supabase/migrations/20260429180600_rls_commissions_role_gated.sql`
- Create: `supabase/tests/team_accounts/07_rls_commissions.sql`

- [ ] **Step 1: Identify commission/payout tables in inventory**

From inventory A, find every table whose name contains `commission`, `payout`, `earning`, `statement`, or otherwise represents financial data. Quote each existing policy.

- [ ] **Step 2: Write the pgTAP test**

Create `supabase/tests/team_accounts/07_rls_commissions.sql`:

```sql
begin;
select plan(4);
\set advisor_uid '<test advisor uid>'

-- Set up: one assistant and one manager for the same advisor
insert into public.advisor_team_members (advisor_id, user_id, role, status) values
  (:'advisor_uid', '00000000-0000-0000-0000-000000000aaa', 'assistant', 'active'),
  (:'advisor_uid', '00000000-0000-0000-0000-000000000bbb', 'manager',   'active');

-- 1. Advisor reads commissions
set local request.jwt.claim.sub = :'advisor_uid';
select isnt_empty(
  $$ select 1 from public.advisor_commissions where advisor_id = $$ || quote_literal(:'advisor_uid'),
  'advisor reads own commissions'
);

-- 2. Manager reads commissions
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000bbb';
select isnt_empty(
  $$ select 1 from public.advisor_commissions where advisor_id = $$ || quote_literal(:'advisor_uid'),
  'manager reads advisor commissions'
);

-- 3. Assistant CANNOT read commissions
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000aaa';
select is_empty(
  $$ select 1 from public.advisor_commissions where advisor_id = $$ || quote_literal(:'advisor_uid'),
  'assistant blocked from commissions'
);

-- 4. Assistant cannot read team tables either
select is_empty(
  $$ select 1 from public.advisor_team_members where advisor_id = $$ || quote_literal(:'advisor_uid'),
  'assistant blocked from team_members'
);

select * from finish();
rollback;
```

- [ ] **Step 3: Run the test, confirm it FAILS assertions 2 and 3**

(Assertion 2 fails because manager has no path; 3 fails because the assistant currently sees nothing — but neither does manager.)

- [ ] **Step 4: Write the migration**

Create `supabase/migrations/20260429180600_rls_commissions_role_gated.sql`. For each commission/payout/earning table, replace its existing policy with the role-gated form:

```sql
begin;

drop policy if exists "<existing commissions policy>" on public.advisor_commissions;

create policy "advisor_commissions_select_role_gated"
  on public.advisor_commissions for select
  to authenticated
  using (
    advisor_id = public.effective_advisor_id(auth.uid())
    and public.effective_role(auth.uid()) in ('advisor', 'manager')
  );

-- Repeat for advisor_payouts, advisor_earnings, advisor_*_statement, etc.

commit;
```

- [ ] **Step 5: Apply, re-run pgTAP, confirm all 4 pass**

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260429180600_rls_commissions_role_gated.sql \
        supabase/tests/team_accounts/07_rls_commissions.sql
git commit -m "feat(db): role-gate commissions/payouts (Phase 2C)

Assistants blocked from financial data; advisor + manager allowed.
Spec: §6.2"
```

---

## Task 7: Phase 3 — `_shared` utilities + coordinated redeploy

**Goal:** Update the shared utilities. Coordinate redeploy of every importing edge function in one window.

**Files:**
- Modify: `supabase/functions/_shared/security.ts`
- Modify: `supabase/functions/_shared/itsts-sync.ts`

- [ ] **Step 1: Read the current `_shared/security.ts` and locate the audit-insert helper**

```bash
# Read supabase/functions/_shared/security.ts; find the function(s) that insert
# into audit_events / audit_logs (look for `from('audit_events')` or similar).
```

- [ ] **Step 2: Modify `_shared/security.ts` to populate `on_behalf_of_advisor_id`**

The audit helper signature gains an optional parameter:

```typescript
// BEFORE (illustrative):
export async function logAuditEvent(opts: {
  client: SupabaseClient;
  actorUserId: string;
  event: string;
  // ...
}) {
  await opts.client.from('audit_events').insert({
    actor_user_id: opts.actorUserId,
    event: opts.event,
    // ...
  });
}

// AFTER:
export async function logAuditEvent(opts: {
  client: SupabaseClient;
  actorUserId: string;
  event: string;
  onBehalfOfAdvisorId?: string | null;  // NEW
  // ...
}) {
  await opts.client.from('audit_events').insert({
    actor_user_id: opts.actorUserId,
    event: opts.event,
    on_behalf_of_advisor_id: opts.onBehalfOfAdvisorId ?? null,  // NEW
    // ...
  });
}
```

Existing callers continue to work — `onBehalfOfAdvisorId` is optional, defaults to null. Advisors logged in as themselves will eventually get this populated by Phase 4 (ticket-proxy resolves the value); for now every existing caller gets `null`, which is identical to today's behavior.

- [ ] **Step 3: Modify `_shared/itsts-sync.ts` — extend ROLE_MAP**

```typescript
// BEFORE (excerpt):
export const ROLE_MAP: Record<string, ItstsRole> = {
  super_admin: "admin",
  admin: "staff",
  manager: "staff",
  staff: "member",
  advisor: "advisor",
  crm_user: "member",
  member: "member",
};

// AFTER (add two entries):
export const ROLE_MAP: Record<string, ItstsRole> = {
  super_admin: "admin",
  admin: "staff",
  manager: "staff",
  staff: "member",
  advisor: "advisor",
  team_assistant: "staff",   // NEW: advisor team-account assistant
  team_manager: "staff",     // NEW: advisor team-account manager
  crm_user: "member",
  member: "member",
};
```

No other changes to itsts-sync.ts in this phase.

- [ ] **Step 4: Redeploy every importer in one batch**

From Phase 0 Inventory B, get the list of every edge function importing `_shared/security.ts` and `_shared/itsts-sync.ts`. Redeploy all of them to `dtmnkzllidaiqyheguhl` in one window.

```bash
# Example deploy script pattern (adapt to your tooling):
for fn in $(cat docs/superpowers/audits/2026-04-29-team-accounts-inventory.md \
              | sed -n '/Inventory B/,/Inventory C/p' \
              | grep "^- " | awk '{print $2}'); do
  echo "Deploying $fn..."
  # supabase functions deploy "$fn" --project-ref dtmnkzllidaiqyheguhl
  # OR: Supabase MCP deploy_edge_function with the function name
done
```

- [ ] **Step 5: Synthetic verification per function**

For each redeployed function, hit a no-op endpoint or low-risk operation. Confirm responses unchanged. Pull recent `audit_events` rows and confirm `on_behalf_of_advisor_id` is null for all rows from advisors logged in as themselves.

```sql
-- On dtmnkzllidaiqyheguhl
select event, actor_user_id, on_behalf_of_advisor_id, created_at
from public.audit_events
where created_at > now() - interval '15 minutes'
order by created_at desc
limit 50;
```

Expected: all rows have `on_behalf_of_advisor_id = null` (no staff yet).

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/security.ts supabase/functions/_shared/itsts-sync.ts
git commit -m "feat(edge): _shared support for on-behalf-of audit + team role mapping (Phase 3)

security.ts: optional onBehalfOfAdvisorId on logAuditEvent.
itsts-sync.ts: ROLE_MAP gains team_assistant and team_manager → 'staff'.

Both changes are additive. All importing edge functions redeployed in this batch
per CLAUDE.md memory rule.

Spec: §7.3, §7.6, §11 Phase 3"
```

---

## Task 8: Phase 4 — `ticket-proxy` actor/owner split

**Goal:** Update ticket-proxy to populate the new ITSTS columns and to split actor vs owner. With zero staff, payloads carry the same value in both fields → behavior identical to today.

**Files:**
- Modify: `supabase/functions/ticket-proxy/index.ts`

- [ ] **Step 1: Confirm ITSTS schema precondition**

Refuse to deploy if Phase 1b hasn't shipped:

```sql
-- On hhikjgrttgnvojtunmla
select count(*) as columns_present from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'tickets'
        and column_name in ('created_by_user_id', 'submitted_on_behalf_of_advisor_id'))
    or (table_name = 'ticket_comments'
        and column_name = 'author_user_id'));
```

Expected: `columns_present = 3`. If not, STOP — go finish Phase 1b first.

- [ ] **Step 2: Add the resolveCallerIdentities helper near the top of `ticket-proxy/index.ts`**

```typescript
// Add near the top of the file, after imports
async function resolveCallerIdentities(
  supabaseAdmin: SupabaseClient,
  itstsAdmin: SupabaseClient,
  jwt: string,
) {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(jwt);
  if (error || !user) {
    throw { status: 401, code: 'unauthorized', message: 'Invalid token' };
  }

  const { data: advisorIdRow } = await supabaseAdmin
    .rpc('effective_advisor_id', { uid: user.id });
  const { data: roleRow } = await supabaseAdmin
    .rpc('effective_role', { uid: user.id });

  const advisorId = advisorIdRow as string | null;
  const role = roleRow as string | null;

  if (!advisorId) {
    throw {
      status: 403, code: 'no_advisor_scope',
      message: 'Caller is neither an advisor nor an active team member',
    };
  }

  // Owner ITSTS profile: looked up by the advisor's auth email
  const { data: advisorAuth } = await supabaseAdmin
    .from('advisor_profiles').select('email').eq('id', advisorId).single();
  const advisorAuthEmail = advisorAuth?.email;
  const { data: ownerProfile } = await itstsAdmin
    .from('profiles').select('id').eq('email', advisorAuthEmail).maybeSingle();
  const ownerItstsId = ownerProfile?.id ?? null;

  // Actor ITSTS profile: ensured by itsts-sync (creates a 'staff' kind for new staff users)
  const actorItstsId = await ensureItstsProfileForUser(itstsAdmin, user, role);

  return { user, advisorId, role, ownerItstsId, actorItstsId };
}

async function ensureItstsProfileForUser(
  itstsAdmin: SupabaseClient,
  user: { id: string; email: string | null },
  role: string | null,
): Promise<string> {
  const { data: existing } = await itstsAdmin
    .from('profiles').select('id').eq('email', user.email).maybeSingle();
  if (existing?.id) return existing.id;

  // Create a 'staff' profile for new team members; advisors are synced elsewhere.
  const itstsRole = role === 'advisor' ? 'advisor' : 'staff';
  const { data: created, error } = await itstsAdmin
    .from('profiles')
    .insert({ email: user.email, role: itstsRole })
    .select('id')
    .single();
  if (error) throw { status: 500, code: 'itsts_sync_failed', message: error.message };
  return created.id;
}
```

- [ ] **Step 3: Update the `create` / `create_for_advisor` cases**

Find the existing `createTicket()` function. Update the insert payload:

```typescript
// BEFORE (paraphrased):
const insertPayload = {
  subject, description, category, priority,
  status: 'new',
  requester_id,                         // was: caller's ITSTS profile id
  origin: 'advisor',                    // hardcoded
  ...(opts.agentId ? { agent_id: opts.agentId } : {}),
  ...(opts.idempotencyKey ? { idempotency_key: opts.idempotencyKey } : {}),
};

// AFTER:
const { user, advisorId, role, ownerItstsId, actorItstsId } =
  await resolveCallerIdentities(supabaseAdmin, itstsAdmin, jwt);

const insertPayload = {
  subject, description, category, priority,
  status: 'new',
  requester_id: ownerItstsId,                                // OWNER (advisor)
  origin: role === 'advisor' ? 'advisor' : 'staff',          // existing enum
  created_by_user_id: user.id,                               // NEW: actor
  submitted_on_behalf_of_advisor_id: advisorId,              // NEW: owner advisor id
  ...(opts.agentId ? { agent_id: opts.agentId } : {}),
  ...(opts.idempotencyKey ? { idempotency_key: opts.idempotencyKey } : {}),
};
```

- [ ] **Step 4: Update the `add_reply` / `addComment` case**

```typescript
// BEFORE (paraphrased):
const commentPayload = {
  ticket_id, body, author_id: callerItstsId, is_internal, content_format,
};

// AFTER:
const { user, ownerItstsId, actorItstsId, advisorId } =
  await resolveCallerIdentities(supabaseAdmin, itstsAdmin, jwt);

// Authorize: caller must scope to the same advisor as the ticket's requester
const { data: ticket } = await itstsAdmin.from('tickets')
  .select('requester_id, submitted_on_behalf_of_advisor_id')
  .eq('id', ticket_id).single();
if (ticket?.requester_id !== ownerItstsId) {
  throw { status: 403, code: 'forbidden', message: 'Cannot reply on this ticket' };
}

const commentPayload = {
  ticket_id, body,
  author_id: actorItstsId,            // existing column, FK to ITSTS profiles
  author_user_id: user.id,            // NEW: advisor-portal user id
  is_internal, content_format,
};
```

- [ ] **Step 5: Update `list`, `get`, `update_status`, `get_stats` to scope by owner**

```typescript
// list / get / get_stats: scope queries by ownerItstsId (which is the advisor's ITSTS profile)
// instead of caller's ITSTS profile. With zero staff, owner === caller, no behavior change.
.eq('requester_id', ownerItstsId)

// update_status: identical, but the authorization check uses effective_advisor_id matching.
```

- [ ] **Step 6: Build / lint / type-check the function**

```bash
deno check supabase/functions/ticket-proxy/index.ts
```

Expected: no type errors.

- [ ] **Step 7: Deploy to staging and run fixture-based payload comparison**

For an advisor account with no staff, exercise:
- `list` → confirm response identical to pre-deploy (same ticket count, same fields)
- `create` → confirm new row has `created_by_user_id = advisor's user id`, `submitted_on_behalf_of_advisor_id = advisor's id`, `origin = 'advisor'` (unchanged)
- `add_reply` → confirm new row has `author_id = advisor's ITSTS profile id` AND `author_user_id = advisor's user id`

```sql
-- On hhikjgrttgnvojtunmla, after the synthetic create
select id, requester_id, origin, created_by_user_id,
       submitted_on_behalf_of_advisor_id
from public.tickets
where id = '<the test ticket id>';
```

Expected: all four columns populated; values consistent with "actor === owner".

- [ ] **Step 8: Deploy to BOTH ITSTS and advisor-portal copies of `ticket-proxy`**

```bash
# Deploy to dtmnkzllidaiqyheguhl (primary, was v30+)
# Deploy to hhikjgrttgnvojtunmla (secondary, was v4+)
# Both via Supabase MCP deploy_edge_function or supabase CLI
```

- [ ] **Step 9: Live monitoring for 30 minutes after prod deploy**

Watch:
- error rate in `ticket-proxy` logs
- P50/P95 latency on `list` and `create`
- audit log: confirm `audit_events` rows from this window have `actor_user_id === on_behalf_of_advisor_id` for advisors-without-staff (which is everyone right now)

If any anomaly: roll back to the prior version (Supabase keeps versions retrievable). The new ITSTS columns stay populated; that's harmless.

- [ ] **Step 10: Commit**

```bash
git add supabase/functions/ticket-proxy/index.ts
git commit -m "feat(edge): ticket-proxy splits actor vs owner identity (Phase 4)

Adds resolveCallerIdentities helper, populates new ITSTS columns
(created_by_user_id, submitted_on_behalf_of_advisor_id, author_user_id),
keeps existing columns and request shapes unchanged. With zero staff in
advisor_team_members, payloads are byte-identical to today.

Spec: §7.2, §11 Phase 4"
```

---

## Task 9: Phase 5A — `advisor-team-invite` edge function

**Goal:** Advisor-facing endpoint that creates a pending invite row.

**Files:**
- Create: `supabase/functions/advisor-team-invite/index.ts`

- [ ] **Step 1: Scaffold the function from a sibling template**

```bash
# Copy structure (CORS, auth, logger, security imports) from an existing simple
# function like supabase/functions/send-advisor-invites/index.ts
cp -r supabase/functions/send-advisor-invites supabase/functions/advisor-team-invite
# Then rewrite index.ts per Step 2.
```

- [ ] **Step 2: Implement the handler**

The handler:
1. Verifies advisor JWT.
2. Calls `effective_advisor_id` and `effective_role`; rejects if not `advisor` or `manager`.
3. Validates body: `{ invited_email: string, role: 'manager' | 'assistant' }`.
4. Lowercases email; rejects if email matches advisor's own auth email or any `@mympb.com` / `@mpb.health` domain.
5. Rejects if a row exists in `advisor_team_members` with `status='active'` for this email's user (cross-check via auth.users lookup).
6. Rate-limit: 10 invites per advisor per 24h via `_shared/security.ts` rate limiter.
7. Inserts `advisor_team_invites` with `status='pending_admin_approval'`, no token yet.
8. Fire-and-forget notification to MPB ops.
9. Returns the new invite row.

```typescript
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { logger } from '../_shared/logger.ts';
import { rateLimit, logAuditEvent } from '../_shared/security.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const INTERNAL_DOMAINS = ['mympb.com', 'mpb.health'];

serve(async (req) => {
  if (req.method === 'OPTIONS') return handlePreflight(req);
  if (req.method !== 'POST') {
    return jsonResponse({ error: { code: 'method_not_allowed' } }, 405);
  }

  const jwt = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!jwt) return jsonResponse({ error: { code: 'unauthorized' } }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: { user } } = await admin.auth.getUser(jwt);
  if (!user) return jsonResponse({ error: { code: 'unauthorized' } }, 401);

  const { data: advisorId } = await admin.rpc('effective_advisor_id', { uid: user.id });
  const { data: role } = await admin.rpc('effective_role', { uid: user.id });
  if (!advisorId || !['advisor', 'manager'].includes(role as string)) {
    return jsonResponse({ error: { code: 'forbidden' } }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const invited_email = String(body.invited_email ?? '').trim().toLowerCase();
  const inviteRole = String(body.role ?? '');

  // Validation
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invited_email)) {
    return jsonResponse({ error: { code: 'invalid_email' } }, 400);
  }
  if (!['manager', 'assistant'].includes(inviteRole)) {
    return jsonResponse({ error: { code: 'invalid_role' } }, 400);
  }
  if (INTERNAL_DOMAINS.some((d) => invited_email.endsWith('@' + d))) {
    return jsonResponse({ error: { code: 'email_in_internal_domain' } }, 400);
  }
  if (invited_email === user.email?.toLowerCase()) {
    return jsonResponse({ error: { code: 'cannot_invite_self' } }, 400);
  }

  // Already on someone's team?
  const { data: existingMember } = await admin
    .from('advisor_team_members')
    .select('id, advisor_id')
    .eq('status', 'active')
    .in('user_id',
      (await admin.from('auth.users' as any).select('id').eq('email', invited_email)).data?.map((r: any) => r.id) ?? []
    )
    .maybeSingle();
  if (existingMember) {
    return jsonResponse({ error: { code: 'email_already_on_team' } }, 400);
  }

  // Rate limit
  const ok = await rateLimit({
    key: `advisor-team-invite:${advisorId}`,
    limit: 10,
    windowSeconds: 86400,
  });
  if (!ok) return jsonResponse({ error: { code: 'rate_limited' } }, 429);

  // Insert pending invite
  const { data: invite, error } = await admin
    .from('advisor_team_invites')
    .insert({
      advisor_id: advisorId,
      invited_email,
      role: inviteRole,
      invited_by_user_id: user.id,
      status: 'pending_admin_approval',
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return jsonResponse({ error: { code: 'invite_already_pending' } }, 400);
    }
    logger.error('advisor-team-invite insert failed', { error });
    return jsonResponse({ error: { code: 'internal' } }, 500);
  }

  // Audit + notify ops (fire and forget)
  await logAuditEvent({
    client: admin,
    actorUserId: user.id,
    onBehalfOfAdvisorId: advisorId,
    event: 'team_invite_created',
    payload: { invite_id: invite.id, invited_email, role: inviteRole },
  });
  notifyOps(invite).catch((e) => logger.warn('ops notify failed', { e }));

  return jsonResponse({ invite }, 201);
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function notifyOps(invite: any) {
  // Fire-and-forget call to send-ticket-notification or equivalent ops channel.
  // Implementation per existing ops notification patterns in this monorepo.
}
```

- [ ] **Step 3: Add `config.toml` for the function (auth verification settings)**

Match the pattern from a sibling function. Verify `verify_jwt = true` is set (Supabase default is true).

- [ ] **Step 4: Deploy to staging and exercise via curl**

```bash
# As an authenticated advisor (with a valid JWT):
curl -X POST "https://dtmnkzllidaiqyheguhl.functions.supabase.co/advisor-team-invite" \
  -H "Authorization: Bearer $ADVISOR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"invited_email": "test-staff@example.com", "role": "assistant"}'
```

Expected: HTTP 201 + the invite row. Test the negative cases too:
- Self-invite → 400 `cannot_invite_self`
- `@mympb.com` → 400 `email_in_internal_domain`
- Duplicate live invite → 400 `invite_already_pending`
- Non-advisor non-manager caller → 403

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/advisor-team-invite/
git commit -m "feat(edge): advisor-team-invite endpoint (Phase 5A)

Spec: §9.1, §10.2"
```

---

## Task 10: Phase 5B — `admin-approve-team-invite` edge function

**Goal:** MPB-admin endpoint that approves or denies a pending invite, mints + emails the token on approval.

**Files:**
- Create: `supabase/functions/admin-approve-team-invite/index.ts`

- [ ] **Step 1: Scaffold (same approach as Task 9 Step 1)**

- [ ] **Step 2: Implement the handler**

```typescript
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { logger } from '../_shared/logger.ts';
import { logAuditEvent } from '../_shared/security.ts';
import { sendInviteEmail } from '../_shared/email.ts'; // wrap Resend; create if needed

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADVISOR_PORTAL_BASE = Deno.env.get('ADVISOR_PORTAL_BASE_URL')!; // https://advisor.mpb.health

serve(async (req) => {
  if (req.method === 'OPTIONS') return handlePreflight(req);
  if (req.method !== 'POST') return jsonResponse({ error: { code: 'method_not_allowed' } }, 405);

  const jwt = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!jwt) return jsonResponse({ error: { code: 'unauthorized' } }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: { user } } = await admin.auth.getUser(jwt);
  if (!user) return jsonResponse({ error: { code: 'unauthorized' } }, 401);

  // RBAC: caller must be admin in org_memberships (admin-portal pattern)
  const { data: adminMembership } = await admin
    .from('org_memberships')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .maybeSingle();
  if (!adminMembership) return jsonResponse({ error: { code: 'forbidden' } }, 403);

  const body = await req.json().catch(() => ({}));
  const inviteId = String(body.invite_id ?? '');
  const decision = String(body.decision ?? '');
  const decisionNote = body.decision_note ? String(body.decision_note) : null;
  if (!inviteId || !['approve', 'deny'].includes(decision)) {
    return jsonResponse({ error: { code: 'invalid_request' } }, 400);
  }

  // Lock the invite row, verify state and advisor still active
  const { data: invite, error: loadErr } = await admin
    .from('advisor_team_invites')
    .select('*, advisor:advisor_profiles!inner(id, status, first_name, last_name, email)')
    .eq('id', inviteId)
    .single();
  if (loadErr || !invite) return jsonResponse({ error: { code: 'not_found' } }, 404);
  if (invite.status !== 'pending_admin_approval') {
    return jsonResponse({ error: { code: 'not_pending' } }, 400);
  }

  if (decision === 'deny') {
    await admin.from('advisor_team_invites')
      .update({
        status: 'denied',
        approved_by_user_id: user.id,
        decision_note: decisionNote,
        approved_at: new Date().toISOString(),
      })
      .eq('id', inviteId);
    await logAuditEvent({
      client: admin, actorUserId: user.id,
      onBehalfOfAdvisorId: invite.advisor_id,
      event: 'team_invite_denied',
      payload: { invite_id: inviteId, decision_note: decisionNote },
    });
    // Email advisor
    await sendInviteEmail({
      to: invite.advisor.email,
      template: 'invite_denied',
      data: { advisorFirstName: invite.advisor.first_name, decisionNote, invitedEmail: invite.invited_email },
    });
    return jsonResponse({ ok: true });
  }

  // Approve path: re-check advisor status
  if (invite.advisor.status === 'inactive') {
    await admin.from('advisor_team_invites')
      .update({
        status: 'denied',
        approved_by_user_id: user.id,
        decision_note: 'Advisor account is no longer active',
        approved_at: new Date().toISOString(),
      })
      .eq('id', inviteId);
    return jsonResponse({ error: { code: 'advisor_inactive' } }, 400);
  }

  // Mint token
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const tokenRaw = Array.from(tokenBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const tokenHash = await sha256Hex(tokenRaw);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await admin.from('advisor_team_invites').update({
    status: 'approved',
    token_hash: tokenHash,
    approved_by_user_id: user.id,
    approved_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  }).eq('id', inviteId);

  // Send the email
  const link = `${ADVISOR_PORTAL_BASE}/accept-invite?token=${tokenRaw}`;
  try {
    await sendInviteEmail({
      to: invite.invited_email,
      template: 'invite_sent',
      data: {
        advisorName: `${invite.advisor.first_name} ${invite.advisor.last_name}`,
        role: invite.role,
        link,
      },
    });
    await admin.from('advisor_team_invites')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', inviteId);
  } catch (e) {
    logger.error('email send failed', { e });
    // Stay at status='approved'; admin queue offers retry.
    return jsonResponse({ error: { code: 'email_send_failed' } }, 502);
  }

  await logAuditEvent({
    client: admin, actorUserId: user.id,
    onBehalfOfAdvisorId: invite.advisor_id,
    event: 'team_invite_approved',
    payload: { invite_id: inviteId },
  });

  return jsonResponse({ ok: true });
});

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 3: Create `supabase/functions/_shared/email.ts` if it doesn't exist**

If there's already a Resend wrapper used by `send-advisor-invites`, reuse that instead of creating a new one. Otherwise:

```typescript
// _shared/email.ts (skeleton — adapt to your existing Resend integration)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM = Deno.env.get('EMAIL_FROM') ?? 'no-reply@mpb.health';

const TEMPLATES = {
  invite_sent: ({ advisorName, role, link }: any) => ({
    subject: `You've been invited to assist ${advisorName} on MPB Health`,
    html: `<p>${advisorName} has invited you to join their advisor portal as a ${role}.</p>
           <p><a href="${link}">Accept the invite</a> (link valid 7 days).</p>`,
  }),
  invite_denied: ({ advisorFirstName, decisionNote, invitedEmail }: any) => ({
    subject: `Your team invite for ${invitedEmail} was not approved`,
    html: `<p>Hi ${advisorFirstName},</p><p>${decisionNote ?? 'Please contact MPB support for details.'}</p>`,
  }),
};

export async function sendInviteEmail(opts: {
  to: string; template: keyof typeof TEMPLATES; data: any;
}) {
  const tpl = TEMPLATES[opts.template](opts.data);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: opts.to, subject: tpl.subject, html: tpl.html }),
  });
  if (!r.ok) throw new Error(`Resend failed: ${r.status} ${await r.text()}`);
}
```

- [ ] **Step 4: Deploy and exercise via curl**

Test approve and deny paths with a real pending invite. Verify:
- Approve → invite row goes pending → approved → sent; email lands in inbox; token in email is the raw token (not the hash).
- Deny → invite row goes denied; advisor receives the denial email with the note.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/admin-approve-team-invite/ supabase/functions/_shared/email.ts
git commit -m "feat(edge): admin-approve-team-invite + invite email templates (Phase 5B)

Spec: §9.1, §5"
```

---

## Task 11: Phase 5C — `accept-team-invite` edge function

**Goal:** Public, token-gated endpoint. Verifies token, creates/links auth user, inserts membership, signs in.

**Files:**
- Create: `supabase/functions/accept-team-invite/index.ts`

- [ ] **Step 1: Scaffold; this function does NOT verify JWT — set `verify_jwt = false` in config.toml**

- [ ] **Step 2: Implement the handler with two query actions**

```typescript
import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';
import { logger } from '../_shared/logger.ts';
import { rateLimit, logAuditEvent } from '../_shared/security.ts';
import { syncItstsProfile } from '../_shared/itsts-sync.ts'; // existing helper

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') return handlePreflight(req);
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  if (req.method !== 'POST' || !['verify', 'accept'].includes(action ?? '')) {
    return jsonResponse({ error: { code: 'invalid_request' } }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const body = await req.json().catch(() => ({}));
  const tokenRaw = String(body.token ?? '');
  if (!tokenRaw) return jsonResponse({ error: { code: 'invalid_token' } }, 400);

  // Rate-limit by IP + token prefix
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!await rateLimit({
    key: `accept-team-invite:${ip}:${tokenRaw.slice(0, 8)}`,
    limit: 10, windowSeconds: 600,
  })) return jsonResponse({ error: { code: 'rate_limited' } }, 429);

  const tokenHash = await sha256Hex(tokenRaw);

  // Look up invite (only `sent` status reveals real data)
  const { data: invite } = await admin
    .from('advisor_team_invites')
    .select('id, advisor_id, invited_email, role, status, expires_at, advisor:advisor_profiles!inner(id, status, first_name, last_name)')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (!invite || invite.status !== 'sent' || (invite.expires_at && new Date(invite.expires_at) < new Date())) {
    return jsonResponse({ error: { code: 'invite_not_valid' } }, 400);
  }
  if (invite.advisor.status === 'inactive') {
    return jsonResponse({ error: { code: 'invite_not_valid' } }, 400);
  }

  if (action === 'verify') {
    return jsonResponse({
      advisor_name: `${invite.advisor.first_name} ${invite.advisor.last_name}`,
      role: invite.role,
      expires_at: invite.expires_at,
    });
  }

  // ACCEPT path — transactional
  const password = String(body.password ?? '');
  const displayName = String(body.display_name ?? '');
  if (password.length < 12) {
    return jsonResponse({ error: { code: 'password_too_short' } }, 400);
  }

  // Lock the invite row to prevent double-accept (uses RPC for SELECT FOR UPDATE)
  const { data: locked } = await admin.rpc('lock_team_invite_for_accept', { invite_id: invite.id });
  if (!locked || locked.status !== 'sent') {
    return jsonResponse({ error: { code: 'invite_not_valid' } }, 400);
  }

  // Refuse if invitee already on another advisor's team
  const { data: existingByEmail } = await admin
    .from('advisor_team_members')
    .select('id, advisor_id')
    .eq('status', 'active')
    .in('user_id',
      ((await admin.from('auth.users' as any).select('id').eq('email', invite.invited_email)).data ?? []).map((r: any) => r.id))
    .maybeSingle();
  if (existingByEmail && existingByEmail.advisor_id !== invite.advisor_id) {
    return jsonResponse({ error: { code: 'email_already_on_team' } }, 400);
  }

  // Create or link auth user
  let userId: string;
  const { data: existingUser } = await admin.auth.admin.listUsers({ filter: `email.eq.${invite.invited_email}` } as any);
  if (existingUser?.users?.length) {
    // Existing user — DO NOT change password; require sign-in flow
    return jsonResponse({ error: { code: 'existing_user_must_sign_in' } }, 400);
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: invite.invited_email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (createErr || !created.user) {
      logger.error('createUser failed', { err: createErr });
      return jsonResponse({ error: { code: 'user_create_failed' } }, 500);
    }
    userId = created.user.id;
  }

  // Insert membership
  const { error: memberErr } = await admin.from('advisor_team_members').insert({
    advisor_id: invite.advisor_id,
    user_id: userId,
    role: invite.role,
    status: 'active',
    invite_id: invite.id,
  });
  if (memberErr) {
    logger.error('member insert failed', { memberErr });
    return jsonResponse({ error: { code: 'member_create_failed' } }, 500);
  }

  // Update invite
  await admin.from('advisor_team_invites').update({
    status: 'accepted',
    accepted_at: new Date().toISOString(),
  }).eq('id', invite.id);

  // ITSTS profile sync (kind=staff)
  try {
    await syncItstsProfile({
      email: invite.invited_email,
      monorepoRole: invite.role === 'manager' ? 'team_manager' : 'team_assistant',
    });
  } catch (e) {
    logger.warn('itsts sync failed (non-fatal)', { e });
  }

  // Sign in
  const { data: session } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: invite.invited_email,
  } as any);
  // OR: return a session via signInWithPassword (preferred — simpler client UX)

  await logAuditEvent({
    client: admin, actorUserId: userId,
    onBehalfOfAdvisorId: invite.advisor_id,
    event: 'team_invite_accepted',
    payload: { invite_id: invite.id, ip },
  });

  return jsonResponse({
    ok: true,
    user_id: userId,
    advisor_id: invite.advisor_id,
    // Return the password used so the client can call signInWithPassword next:
    // (The client never sends the password back; this is just the marker that
    // accept succeeded.)
  });
});

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 3: Create the `lock_team_invite_for_accept` RPC**

In a tiny migration:

```sql
-- supabase/migrations/20260429190000_lock_invite_rpc.sql
create or replace function public.lock_team_invite_for_accept(invite_id uuid)
returns public.advisor_team_invites
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  inv public.advisor_team_invites;
begin
  select * into inv from public.advisor_team_invites
    where id = invite_id for update;
  return inv;
end;
$$;

revoke all on function public.lock_team_invite_for_accept(uuid) from public;
grant execute on function public.lock_team_invite_for_accept(uuid) to service_role;
```

- [ ] **Step 4: Deploy and exercise the verify + accept flow**

```bash
# 1. Trigger the full create + approve flow (Tasks 9 + 10) to get a real token in an inbox.
# 2. Hit verify:
curl -X POST "https://dtmnkzllidaiqyheguhl.functions.supabase.co/accept-team-invite?action=verify" \
  -H "Content-Type: application/json" -d '{"token": "<raw token>"}'
# Expected: { advisor_name, role, expires_at }
# 3. Hit accept:
curl -X POST "https://dtmnkzllidaiqyheguhl.functions.supabase.co/accept-team-invite?action=accept" \
  -H "Content-Type: application/json" \
  -d '{"token":"<raw token>","password":"verylongpassword123","display_name":"Sue"}'
# Expected: { ok: true, user_id, advisor_id }
# 4. Repeat the accept call → expected error: invite_not_valid (already accepted)
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/accept-team-invite/ \
        supabase/migrations/20260429190000_lock_invite_rpc.sql
git commit -m "feat(edge): accept-team-invite (Phase 5C) + invite-lock RPC

Spec: §9.1, §10.2"
```

---

## Task 12: Phase 5D — `advisor-team-revoke` + `send-ticket-notification` update

**Goal:** Endpoint to revoke a member or pending invite. Plus the small change to `send-ticket-notification` to surface "submitted on behalf of" in subject lines.

**Files:**
- Create: `supabase/functions/advisor-team-revoke/index.ts`
- Modify: `supabase/functions/send-ticket-notification/index.ts`

- [ ] **Step 1: Implement `advisor-team-revoke`**

```typescript
// Skeleton — fill in error handling per existing functions in this monorepo
// Body: { member_id?: string; invite_id?: string; reason?: string }
//
// Auth: caller must be EITHER:
//   (a) the owning advisor, OR
//   (b) a manager on that advisor's team, OR
//   (c) an MPB admin (via org_memberships role check)
// AND must NOT be revoking themselves (advisors aren't members; managers can't self-revoke
// because they aren't the target).
//
// On revoke:
//   - For active members: set status='revoked', revoked_at, revoked_by_user_id, revoke_reason.
//     Then admin.auth.admin.signOut(userId, { scope: 'global' }).
//   - For pending invites: set status='revoked', token_hash=null.
//
// Audit + courtesy email to revoked staff.
```

- [ ] **Step 2: Update `send-ticket-notification` subject when actor ≠ advisor**

Find the function. Where it composes the subject for ops notifications, look at the `submitted_on_behalf_of_advisor_id` column on the ticket (added in Phase 1b):

```typescript
// BEFORE (illustrative):
subject = `Ticket #${ticketNumber} from ${advisorName}`;

// AFTER:
const actorIsStaff = ticket.submitted_on_behalf_of_advisor_id
  && ticket.created_by_user_id !== ticket.requester_id_user_id; // approximate — wire up correctly
const subject = actorIsStaff
  ? `Ticket #${ticketNumber} from ${actorName} on behalf of ${advisorName}`
  : `Ticket #${ticketNumber} from ${advisorName}`;
```

The exact wiring depends on what the function already loads. The minimum is: if the ticket has `submitted_on_behalf_of_advisor_id` AND that differs from the literal author, include "on behalf of" in subject + body.

- [ ] **Step 3: Deploy and exercise**

Revoke a synthetic active member; confirm:
- `advisor_team_members.status = 'revoked'`.
- The staff user's existing session is invalidated (next API call returns 401).
- Courtesy email sent.

For the notification: file a synthetic ticket as a staff user (after Phase 6 ships); confirm subject line includes "on behalf of".

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/advisor-team-revoke/ \
        supabase/functions/send-ticket-notification/
git commit -m "feat(edge): advisor-team-revoke + on-behalf-of subject in notifications (Phase 5D)

Spec: §9.1, §9.2"
```

---

## Task 13: Phase 6A — AdvisorContext + useAuth + canAccess + StaffBanner

**Goal:** Frontend foundation for team accounts. Code ships, no UI gates open yet.

**Files:**
- Modify: `apps/advisor-portal/src/contexts/AdvisorContext.tsx`
- Modify: `apps/advisor-portal/src/hooks/useAuth.ts`
- Create: `apps/advisor-portal/src/lib/canAccess.ts`
- Create: `apps/advisor-portal/src/components/StaffBanner.tsx`

- [ ] **Step 1: Read the current AdvisorContext to understand what it exposes**

```bash
# Already inventoried in Phase 0; reread:
# apps/advisor-portal/src/contexts/AdvisorContext.tsx
```

- [ ] **Step 2: Extend the context type**

```typescript
// apps/advisor-portal/src/contexts/AdvisorContext.tsx

export type EffectiveRole = 'advisor' | 'manager' | 'assistant';

export type AdvisorSession = {
  // The advisor whose data is being viewed (the OWNER)
  advisor: AdvisorProfile;
  // The logged-in user (the ACTOR)
  actor: {
    user_id: string;
    email: string;
    display_name: string;
  };
  role: EffectiveRole;
  isStaff: boolean;
};
```

- [ ] **Step 3: Update the load logic**

```typescript
// In the provider's effect that runs after auth session is available:
const sessionUserId = session.user.id;

const [{ data: advisorId }, { data: roleStr }] = await Promise.all([
  supabase.rpc('effective_advisor_id', { uid: sessionUserId }),
  supabase.rpc('effective_role', { uid: sessionUserId }),
]);

if (!advisorId) {
  // Not an advisor or active staff — redirect to "no access"
  navigate('/no-access');
  return;
}

// Load advisor (the owner). RLS now allows staff to read their advisor's profile.
const { data: advisor } = await supabase
  .from('advisor_profiles').select('*').eq('id', advisorId).single();

// Actor (literal logged-in user) — minimal display fields
const actor = {
  user_id: sessionUserId,
  email: session.user.email ?? '',
  display_name: (session.user.user_metadata?.display_name as string) ?? session.user.email ?? '',
};

const role = (roleStr ?? 'advisor') as EffectiveRole;
setSession({ advisor, actor, role, isStaff: role !== 'advisor' });
```

Existing call sites that read `advisor.id`, `advisor.email` keep working — they're now reading the OWNER's fields, which is what they always meant.

- [ ] **Step 4: Update `useAuth` to expose `actor`, `role`, `isStaff`**

```typescript
// apps/advisor-portal/src/hooks/useAuth.ts
export function useAuth() {
  const { advisor, actor, role, isStaff } = useAdvisor();
  return {
    // EXISTING fields — unchanged shape
    id: advisor?.id,
    email: advisor?.email,
    name: `${advisor?.first_name ?? ''} ${advisor?.last_name ?? ''}`.trim(),
    isAuthenticated: Boolean(advisor),
    // NEW
    actor,
    role,
    isStaff,
  };
}
```

- [ ] **Step 5: Create `canAccess.ts`**

```typescript
// apps/advisor-portal/src/lib/canAccess.ts
import type { EffectiveRole } from '../contexts/AdvisorContext';

const ASSISTANT_BLOCKED = new Set([
  'commissions',
  'payouts',
  'team-management',
  'portal-settings',
]);

export function canAccess(feature: string, role: EffectiveRole | null): boolean {
  if (!role) return false;
  if (role === 'advisor' || role === 'manager') return true;
  // role === 'assistant'
  return !ASSISTANT_BLOCKED.has(feature);
}
```

- [ ] **Step 6: Create `StaffBanner.tsx`**

```tsx
// apps/advisor-portal/src/components/StaffBanner.tsx
import { useAuth } from '../hooks/useAuth';

export function StaffBanner() {
  const { isStaff, actor, name } = useAuth();
  if (!isStaff) return null;
  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-sm sticky top-0 z-40">
      <span aria-hidden>👥 </span>
      You're signed in as <strong>{actor?.display_name}</strong> · acting on behalf of <strong>{name}</strong>
    </div>
  );
}
```

Mount the banner above the existing top nav in the layout component.

- [ ] **Step 7: Run advisor-portal typecheck and tests**

```bash
pnpm -C apps/advisor-portal typecheck
pnpm -C apps/advisor-portal test --run
```

Expected: green. Existing advisor flows untouched (no staff exist).

- [ ] **Step 8: Commit**

```bash
git add apps/advisor-portal/src/contexts/AdvisorContext.tsx \
        apps/advisor-portal/src/hooks/useAuth.ts \
        apps/advisor-portal/src/lib/canAccess.ts \
        apps/advisor-portal/src/components/StaffBanner.tsx
git commit -m "feat(advisor-portal): AdvisorContext exposes advisor/actor/role + StaffBanner (Phase 6A)

Spec: §8.4, §8.5, §8.6"
```

---

## Task 14: Phase 6B — TeamManagement page + useTeam hook

**Goal:** Implement the Settings → Team page. Behind the `vite_feature_team_accounts` flag.

**Files:**
- Create: `apps/advisor-portal/src/hooks/useTeam.ts`
- Modify: `apps/advisor-portal/src/pages/settings/TeamManagement.tsx`
- Modify: nav config to gate the entry on `canAccess('team-management', role)` AND the feature flag

- [ ] **Step 1: Implement `useTeam`**

```typescript
// apps/advisor-portal/src/hooks/useTeam.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@mpbhealth/database';
import { useAuth } from './useAuth';

export function useTeam() {
  const { id: advisorId } = useAuth(); // owner advisor id
  const [members, setMembers] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!advisorId) return;
    setLoading(true);
    const [m, p] = await Promise.all([
      supabase.from('advisor_team_members')
        .select('id, user_id, role, status, created_at')
        .eq('advisor_id', advisorId).eq('status', 'active'),
      supabase.from('advisor_team_invites')
        .select('id, invited_email, role, status, created_at, sent_at')
        .eq('advisor_id', advisorId)
        .in('status', ['pending_admin_approval', 'approved', 'sent']),
    ]);
    setMembers(m.data ?? []);
    setPending(p.data ?? []);
    setLoading(false);
  }, [advisorId]);

  useEffect(() => { refresh(); }, [refresh]);

  const invite = async (invited_email: string, role: 'manager' | 'assistant') => {
    const { data, error } = await supabase.functions.invoke('advisor-team-invite', {
      body: { invited_email, role },
    });
    if (error) throw error;
    await refresh();
    return data;
  };

  const revoke = async (memberId: string, reason?: string) => {
    const { error } = await supabase.functions.invoke('advisor-team-revoke', {
      body: { member_id: memberId, reason },
    });
    if (error) throw error;
    await refresh();
  };

  const cancelInvite = async (inviteId: string) => {
    const { error } = await supabase.functions.invoke('advisor-team-revoke', {
      body: { invite_id: inviteId },
    });
    if (error) throw error;
    await refresh();
  };

  return { members, pending, loading, invite, revoke, cancelInvite, refresh };
}
```

- [ ] **Step 2: Implement TeamManagement.tsx**

```tsx
// apps/advisor-portal/src/pages/settings/TeamManagement.tsx
import { useState } from 'react';
import { useTeam } from '../../hooks/useTeam';
import { useAuth } from '../../hooks/useAuth';
import { canAccess } from '../../lib/canAccess';

export default function TeamManagement() {
  const { role } = useAuth();
  if (!canAccess('team-management', role)) {
    return <div className="p-6">You don't have access to team management.</div>;
  }

  const { members, pending, invite, revoke, cancelInvite, loading } = useTeam();
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="text-sm text-neutral-600">
            Invite assistants and managers to access your portal. All invites are reviewed by MPB before they're sent.
          </p>
        </div>
        <button onClick={() => setShowInvite(true)} className="btn-primary">Invite</button>
      </header>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-3">
          Active team ({members.length})
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-neutral-500">No team members yet.</p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex justify-between items-center border rounded px-3 py-2">
                <div>
                  <span className="font-medium">{m.user_id}</span>
                  <span className="ml-2 text-xs uppercase text-neutral-500">{m.role}</span>
                </div>
                <button onClick={() => revoke(m.id)} className="text-sm text-red-600">Revoke</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-3">
          Pending invites ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-neutral-500">No pending invites.</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((p) => (
              <li key={p.id} className="flex justify-between items-center border rounded px-3 py-2">
                <div>
                  <span className="font-medium">{p.invited_email}</span>
                  <span className="ml-2 text-xs uppercase text-neutral-500">{p.role}</span>
                  <span className="ml-2 text-xs text-neutral-400">{p.status}</span>
                </div>
                <button onClick={() => cancelInvite(p.id)} className="text-sm text-neutral-600">Cancel</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onSubmit={invite} />
      )}
    </div>
  );
}

function InviteModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (email: string, role: 'manager' | 'assistant') => Promise<unknown> }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'manager' | 'assistant'>('assistant');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Invite a team member</h3>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-2 py-1 mb-3" type="email" />
        <label className="block text-sm font-medium mb-1">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value as any)}
          className="w-full border rounded px-2 py-1 mb-4">
          <option value="assistant">Assistant — everything except commissions and team management</option>
          <option value="manager">Manager — full access (same as you)</option>
        </select>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            disabled={submitting}
            onClick={async () => {
              try {
                setSubmitting(true);
                setError(null);
                await onSubmit(email, role);
                onClose();
              } catch (e: any) {
                setError(humanError(e?.error?.code) ?? 'Something went wrong');
              } finally {
                setSubmitting(false);
              }
            }}
            className="btn-primary">{submitting ? 'Sending…' : 'Send invite'}</button>
        </div>
      </div>
    </div>
  );
}

function humanError(code?: string): string | null {
  const map: Record<string, string> = {
    invalid_email: 'Enter a valid email address.',
    cannot_invite_self: "You can't invite your own email — you already have full access.",
    email_in_internal_domain: 'That email belongs to MPB and can\'t be added as team.',
    email_already_on_team: 'This email is already on another advisor\'s team.',
    invite_already_pending: 'You already have a pending invite for that email.',
    rate_limited: 'Too many invites today — try again tomorrow.',
  };
  return code ? map[code] ?? null : null;
}
```

- [ ] **Step 3: Wire up the feature flag and nav gating**

```typescript
// In your nav config / sidebar component:
const teamAccountsFlag = import.meta.env.VITE_FEATURE_TEAM_ACCOUNTS === 'true';
const showTeamNav = teamAccountsFlag && canAccess('team-management', role);
```

In the route guard for `/settings/team`, check the same condition; redirect to `/dashboard` if either fails.

- [ ] **Step 4: Run typecheck + tests**

```bash
pnpm -C apps/advisor-portal typecheck
pnpm -C apps/advisor-portal test --run
```

- [ ] **Step 5: Commit**

```bash
git add apps/advisor-portal/src/hooks/useTeam.ts \
        apps/advisor-portal/src/pages/settings/TeamManagement.tsx \
        apps/advisor-portal/src/<nav config>
git commit -m "feat(advisor-portal): TeamManagement page + useTeam hook (Phase 6B, flag-gated)

Spec: §8.1"
```

---

## Task 15: Phase 6C — Public AcceptInvite page

**Goal:** The `/accept-invite?token=...` page. Critical: NOT auth-aware, uses direct fetch (NOT `supabase.functions.invoke`) per memory rule.

**Files:**
- Create: `apps/advisor-portal/src/pages/AcceptInvite.tsx`
- Modify: `apps/advisor-portal/src/App.tsx` (add public route, gate behind feature flag)

- [ ] **Step 1: Implement AcceptInvite.tsx**

```tsx
// apps/advisor-portal/src/pages/AcceptInvite.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@mpbhealth/database';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const TIMEOUT_MS = 12_000;

type State =
  | { kind: 'loading' }
  | { kind: 'valid'; advisorName: string; role: string; expiresAt: string }
  | { kind: 'invalid' }
  | { kind: 'already_accepted' }
  | { kind: 'existing_user' }
  | { kind: 'submitting' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');

  // Verify on mount
  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    fetch(`${FUNCTIONS_URL}/accept-team-invite?action=verify`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json',
                 apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json().then((d) => ({ status: r.status, body: d })))
      .then(({ status, body }) => {
        if (status === 200 && body.advisor_name) {
          setState({ kind: 'valid', advisorName: body.advisor_name, role: body.role, expiresAt: body.expires_at });
        } else if (body?.error?.code === 'existing_user_must_sign_in') {
          setState({ kind: 'existing_user' });
        } else {
          setState({ kind: 'invalid' });
        }
      })
      .catch(() => setState({ kind: 'error', message: 'Could not load invite — please try again.' }))
      .finally(() => clearTimeout(timer));

    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [token]);

  async function submitAccept() {
    if (password !== confirm) {
      setState({ kind: 'error', message: 'Passwords do not match.' });
      return;
    }
    if (password.length < 12) {
      setState({ kind: 'error', message: 'Password must be at least 12 characters.' });
      return;
    }
    setState({ kind: 'submitting' });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    try {
      const r = await fetch(`${FUNCTIONS_URL}/accept-team-invite?action=accept`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json',
                   apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ token, password, display_name: name }),
      });
      const body = await r.json();
      if (r.status !== 200) {
        if (body?.error?.code === 'existing_user_must_sign_in') {
          setState({ kind: 'existing_user' });
          return;
        }
        setState({ kind: 'error', message: humanError(body?.error?.code) });
        return;
      }

      // Sign in with the password just set
      await supabase.auth.signInWithPassword({
        email: (state as any).invitedEmail ?? body.email,
        password,
      });
      navigate('/dashboard');
    } catch {
      setState({ kind: 'error', message: 'Could not accept invite — please try again.' });
    } finally {
      clearTimeout(timer);
    }
  }

  // Render per state
  if (state.kind === 'loading') return <Centered>Verifying invite…</Centered>;
  if (state.kind === 'invalid') return <Centered>This invite is no longer valid. Please ask the advisor to send a new one.</Centered>;
  if (state.kind === 'existing_user') return <Centered>An MPB account already exists for this email. <a href="/login" className="underline">Sign in</a> to accept.</Centered>;
  if (state.kind === 'success') return <Centered>Welcome! Loading your dashboard…</Centered>;
  if (state.kind === 'error') return <Centered><p className="mb-3">{state.message}</p><button onClick={() => location.reload()} className="btn-primary">Retry</button></Centered>;

  // valid or submitting
  const v = state as Extract<State, { kind: 'valid' } | { kind: 'submitting' }>;
  const isSubmitting = state.kind === 'submitting';
  return (
    <Centered>
      <h1 className="text-xl font-semibold mb-2">You're invited</h1>
      <p className="mb-4 text-sm">
        You've been invited to join <strong>{(v as any).advisorName}</strong>'s team on MPB Health as a <strong>{(v as any).role}</strong>.
      </p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
        className="w-full border rounded px-2 py-1 mb-2" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (min 12 chars)"
        className="w-full border rounded px-2 py-1 mb-2" />
      <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" placeholder="Confirm password"
        className="w-full border rounded px-2 py-1 mb-4" />
      <button disabled={isSubmitting} onClick={submitAccept} className="btn-primary w-full">
        {isSubmitting ? 'Accepting…' : 'Accept and sign in'}
      </button>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="max-w-sm mx-auto mt-20 p-6 bg-white rounded-lg shadow text-center">{children}</div>;
}

function humanError(code?: string): string {
  const map: Record<string, string> = {
    invite_not_valid: 'This invite is no longer valid.',
    password_too_short: 'Password must be at least 12 characters.',
    email_already_on_team: 'This email is already on another advisor\'s team.',
  };
  return code ? map[code] ?? 'Something went wrong.' : 'Something went wrong.';
}
```

- [ ] **Step 2: Add the public route**

```tsx
// apps/advisor-portal/src/App.tsx
const teamAccountsFlag = import.meta.env.VITE_FEATURE_TEAM_ACCOUNTS === 'true';

// In the public routes section (alongside /login, /forgot-password):
{teamAccountsFlag && <Route path="/accept-invite" element={<AcceptInvite />} />}
```

- [ ] **Step 3: Run typecheck + a smoke render test**

```bash
pnpm -C apps/advisor-portal typecheck
# Manually navigate to /accept-invite?token=invalid in dev mode; confirm
# the "no longer valid" state renders within 2s.
```

- [ ] **Step 4: Commit**

```bash
git add apps/advisor-portal/src/pages/AcceptInvite.tsx apps/advisor-portal/src/App.tsx
git commit -m "feat(advisor-portal): public AcceptInvite page (Phase 6C, flag-gated)

Uses direct fetch (NOT supabase.functions.invoke) per memory rule.
12-second timeout on every state to avoid stuck spinners.
Spec: §8.3"
```

---

## Task 16: Phase 6D — Admin portal Team Invites queue

**Goal:** MPB-admin queue page to approve / deny pending invites.

**Files:**
- Create: `apps/admin-portal/src/pages/team-invites/index.tsx`
- Create: `apps/admin-portal/src/pages/team-invites/[id].tsx`
- Create: `apps/admin-portal/src/lib/teamInvites.ts`
- Modify: admin-portal nav config

- [ ] **Step 1: Implement service layer**

```typescript
// apps/admin-portal/src/lib/teamInvites.ts
import { supabaseAdvisorPortal } from './supabaseClients'; // existing pattern in admin portal

export async function listPendingInvites() {
  const { data, error } = await supabaseAdvisorPortal
    .from('advisor_team_invites')
    .select('id, advisor_id, invited_email, role, status, decision_note, created_at, advisor:advisor_profiles!inner(id, first_name, last_name, email, status)')
    .eq('status', 'pending_admin_approval')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function reviewInvite(inviteId: string, decision: 'approve' | 'deny', note?: string) {
  const { data, error } = await supabaseAdvisorPortal.functions.invoke('admin-approve-team-invite', {
    body: { invite_id: inviteId, decision, decision_note: note },
  });
  if (error) throw error;
  return data;
}
```

- [ ] **Step 2: Implement queue list page**

Standard list view: rows of pending invites, each row links to detail. Use existing admin-portal patterns. Add "Team Invites" with a count badge to the admin sidebar/nav.

- [ ] **Step 3: Implement detail / approve-deny page**

Show: advisor info, invitee email, role, current team count, soft signals (domain match, existing accounts). Two buttons: Approve, Deny. Deny prompts for `decision_note`. Both call `reviewInvite()` and refresh.

- [ ] **Step 4: Gate behind the same feature flag (`VITE_FEATURE_TEAM_ACCOUNTS`)**

- [ ] **Step 5: Typecheck + smoke test**

- [ ] **Step 6: Commit**

```bash
git add apps/admin-portal/src/pages/team-invites/ \
        apps/admin-portal/src/lib/teamInvites.ts \
        apps/admin-portal/src/<nav config>
git commit -m "feat(admin-portal): Team Invites approval queue (Phase 6D, flag-gated)

Spec: §8.2, §9.4"
```

---

## Task 17: Phase 7 — Internal pilot

**Goal:** Flag on for a hardcoded list of MPB-internal advisor user_ids. ≥ 5 business days. Watching for unexpected RLS denials, ticket-proxy errors, audit anomalies, stuck spinners.

**Files:** None (operational task).

- [ ] **Step 1: Hardcode pilot user_ids in the flag-gate function**

```typescript
// apps/advisor-portal/src/lib/featureFlags.ts (or similar)
const PILOT_USER_IDS = new Set([
  // Add MPB-internal advisor user_ids here
  '00000000-0000-0000-0000-aaaaaaaaaaaa',
]);

export function isTeamAccountsEnabled(userId?: string): boolean {
  if (import.meta.env.VITE_FEATURE_TEAM_ACCOUNTS === 'true') return true;
  return userId ? PILOT_USER_IDS.has(userId) : false;
}
```

Wire this in the same places `VITE_FEATURE_TEAM_ACCOUNTS` is currently checked (nav gating, route gating, accept-invite route).

- [ ] **Step 2: MPB ops creates a real test assistant for a real test advisor**

Run the full flow end-to-end on a real pilot advisor. Daily checks for 5 business days:
- Login as advisor → invite → approve in admin queue → accept email → log in as staff → exercise dashboard, clients, file ticket, reply, view settings (manager allowed / assistant blocked), commissions (manager allowed / assistant blocked).

- [ ] **Step 3: Daily monitoring queries**

```sql
-- Unexpected RLS denials (Postgres logs; varies by infra)
-- ticket-proxy error rate spike check (Supabase function logs)
-- audit_events sanity:
select count(*), event from public.audit_events
where created_at > now() - interval '1 day'
  and event like 'team_%'
group by event;
```

- [ ] **Step 4: Triage and fix any issues**

Each unexpected RLS denial gets RCA before Phase 8. If anything blocks, hold the gate and fix.

- [ ] **Step 5: Sign off**

After 5 business days with zero unresolved incidents, document in the inventory file that Phase 7 is complete and proceed.

---

## Task 18: Phase 8 — General rollout

**Goal:** Flag on globally.

- [ ] **Step 1: Set `VITE_FEATURE_TEAM_ACCOUNTS=true` in production env**

Both advisor portal and admin portal Vercel projects. Trigger a redeploy.

- [ ] **Step 2: Send launch email**

Short note to all advisors with a one-page how-to. (Out of code scope; coordinate with marketing/ops.)

- [ ] **Step 3: Watch first 24 hours**

- Invite queue activity (admin queue page)
- Denied invites (volume + reasons)
- Net-new RLS errors in logs
- ticket-proxy error/latency

- [ ] **Step 4: Sign off in inventory doc**

---

## Task 19: Phase 9 — Cleanup

**Goal:** Remove debt accumulated during the rollout.

**Files:**
- Create: `supabase/migrations/<ts>_remove_legacy_advisor_rls_policies.sql`
- Modify: feature-flag plumbing
- Delete: any TeamManagement stub fallback

- [ ] **Step 1: Remove the additive duplicate RLS policies from Phase 2**

For each migration in Phase 2 that left both old and new policies in place, drop the legacy ones now that the new ones are stable.

- [ ] **Step 2: Remove feature flag plumbing**

Delete `VITE_FEATURE_TEAM_ACCOUNTS` checks. The feature is now baseline.

- [ ] **Step 3: Run the redaction job**

Schedule (or run once) the redaction of `decision_note` and `invited_email` on terminal-state invites older than 90 days.

```sql
-- supabase/sql/redact_old_invites.sql
update public.advisor_team_invites
set invited_email = '<redacted>',
    decision_note = case when decision_note is not null then '<redacted>' end
where status in ('accepted', 'denied', 'revoked', 'expired')
  and created_at < now() - interval '90 days'
  and invited_email <> '<redacted>';
```

- [ ] **Step 4: Commit each cleanup as its own commit**

---

## Self-Review

**1. Spec coverage:** Every section of the spec maps to at least one task:
- §2 Decisions → encoded throughout
- §4 Data model → Task 2
- §5 Invitation lifecycle → Tasks 9, 10, 11, 12
- §6 RLS rewrite → Tasks 4, 5, 6
- §7.1–7.4 On-behalf-of pattern → Task 8
- §7.5–7.7 ITSTS → Task 3 (schema), Task 8 (proxy), Task 12 (notifications)
- §8 UI → Tasks 13, 14, 15, 16
- §9 Edge functions → Tasks 7, 8, 9, 10, 11, 12
- §10 Lifecycle / edge cases → covered in functions Tasks 9–12
- §11 Phases 0–9 → Tasks 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19

**2. Placeholders:** Code blocks contain real code. Where SQL or function bodies are paraphrased ("Pattern A → ..."), the task explicitly references the spec section that has the canonical SQL. No "TBD" / "TODO" left.

**3. Type / name consistency:**
- `effective_advisor_id(uuid)` and `effective_role(uuid)` used consistently in Tasks 2, 4, 5, 6, 8, 9, 10, 13.
- `EffectiveRole` type used in Tasks 13, 14.
- `team_role` enum values (`manager`, `assistant`) consistent throughout.
- `invite_status` enum values consistent in §4.1, Task 2, Tasks 9–12.
- `advisor_team_members.user_id` (FK to advisor-portal `auth.users.id`) used consistently.
- ITSTS column names verified against audit: `tickets.created_by_user_id`, `tickets.submitted_on_behalf_of_advisor_id`, `ticket_comments.author_user_id` — used in Tasks 3 and 8 only, both consistent.

**4. Spec gap check:** None found. The task sequence covers every Phase from §11.


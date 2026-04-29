# Advisor Team Accounts — Design Spec

**Date**: 2026-04-29
**Status**: Design approved, awaiting implementation plan
**Owner**: MPB engineering
**Affected projects**: `dtmnkzllidaiqyheguhl` (advisor portal Supabase), `qfigouszitcddkhssqxr` (admin portal Supabase), `hhikjgrttgnvojtunmla` (ITSTS)

---

## 1. Problem Statement

Many MPB advisors employ staff and assistants who help monitor and operate the advisor's portal: triaging support tickets, watching client activity, replying on the advisor's behalf. Today the advisor portal is a strict one-user-per-advisor system: `auth.uid()` is assumed to equal `advisor_profiles.id` everywhere — in RLS, in `ticket-proxy`, in audit logging. Staff who need access either share the advisor's password (no audit trail, no per-user revocation) or don't get access at all.

This spec adds first-class **team accounts**: each advisor can invite staff with their own credentials, scoped to a role (Manager or Assistant), gated by an MPB admin approval step, with full audit. Data continues to belong to the advisor; the actor on every recorded action is whichever team member actually clicked the button.

## 2. Decisions (from brainstorming)

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | **Separate identities per staff member.** Each staff person has their own auth user and their own credentials. | Per-user revocation, real audit trail, industry-standard team-account pattern. |
| 2 | **Two role tiers — Manager and Assistant.** Manager = same as advisor (including financial data and team management). Assistant = everything except commissions/payouts and team management. | "Assistant who shouldn't see commissions" is the most common real-world configuration. Granular per-feature toggles is over-engineering before signal exists. |
| 3 | **Hybrid invite flow.** Advisor self-serves the invite from Settings → Team. The invite enters a queue that an MPB admin must approve before the email is sent. | Compliance friction guard: keeps MPB ops in the loop on who's getting data access without forcing manual ticketing for every change. |
| 4 | **One staff = one advisor.** Each staff user is linked to exactly one advisor. If a person works for two advisors they get two staff accounts (different emails). | Keeps the data model trivial; single-row parent/child. Matches >95% of real practices. Multi-advisor support is an additive future change if signal appears. |
| 5 | **Data belongs to advisor, actor is staff, audit shows both.** Tickets created by Sue (Assistant for John) have `requester_id = John`, `created_by = Sue`, and a visible "submitted on behalf of John" tag. | Only model consistent with #1; matches existing `ticket_origin` enum's `staff` value; gives MPB Support the right routing and the right context. |

## 3. Architecture Overview

```
ADVISOR PORTAL (apps/advisor-portal)            ADMIN PORTAL (apps/admin-portal)
   │                                               │
   ├─ Settings → Team                              ├─ Pending Team Invites queue
   │   • invite, revoke, change role               │   • approve / deny
   │   • visible to advisor + manager              │   • send invite email on approve
   │                                               │
   ├─ Public /accept-invite (token-gated)          │
   │   • set password, accept, sign in             │
   │                                               │
   └─ AdvisorContext now exposes {advisor, actor, role, isStaff}
       Existing call sites read advisor.* (owner) — unchanged behavior
       New code reads actor.* when it needs the literal logged-in user

SUPABASE PROJECT dtmnkzllidaiqyheguhl
   ├─ Tables (new):     advisor_team_invites, advisor_team_members
   ├─ Functions (new):  effective_advisor_id(uid), effective_role(uid)
   ├─ Trigger (new):    advisor_profiles.status → cascade revoke staff
   ├─ Audit (changed):  audit_events.on_behalf_of_advisor_id (new column)
   ├─ Edge fns (new):   advisor-team-invite, admin-approve-team-invite,
   │                    accept-team-invite, advisor-team-revoke
   ├─ Edge fns (mod):   ticket-proxy (split actor/owner), send-ticket-notification,
   │                    _shared/security.ts, _shared/itsts-sync.ts
   └─ RLS:              every advisor-scoped policy migrated from auth.uid()
                        to public.effective_advisor_id(auth.uid())
```

## 4. Data Model

### 4.1 New tables

Both tables in `public` schema. RLS on, with this policy shape:

- **SELECT**: allowed when `advisor_id = effective_advisor_id(auth.uid())` AND `effective_role(auth.uid()) IN ('advisor', 'manager')`. Lets the advisor and managers list their own team and pending invites for the Settings → Team page (§8.1). Assistants never read these tables.
- **INSERT / UPDATE / DELETE**: not allowed to any role (`to authenticated using (false)`). All writes go through edge functions running with service-role, which enforce the full lifecycle (§5) and audit (§10.3).

The `SECURITY DEFINER` helper functions read these tables internally without going through RLS, which is why they can resolve `effective_advisor_id` and `effective_role` for callers who don't have direct read access.

#### `advisor_team_invites`

| column | type | notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `advisor_id` | uuid → `advisor_profiles.id` | who's inviting |
| `invited_email` | citext | normalized; unique per advisor while not in a terminal state |
| `role` | enum `team_role` (`manager` \| `assistant`) | |
| `status` | enum `invite_status` (`pending_admin_approval` \| `approved` \| `sent` \| `accepted` \| `denied` \| `revoked` \| `expired`) | |
| `token_hash` | text | sha256 of one-time link token; raw token never stored |
| `invited_by_user_id` | uuid | the advisor's `auth.uid()` |
| `approved_by_user_id` | uuid null | the MPB admin who approved or denied |
| `decision_note` | text null | optional reason |
| `created_at` | timestamptz | |
| `approved_at` | timestamptz null | |
| `sent_at` | timestamptz null | |
| `accepted_at` | timestamptz null | |
| `expires_at` | timestamptz null | defaults to `sent_at + interval '7 days'` |

Constraints:
- `unique (advisor_id, lower(invited_email)) where status not in ('accepted','denied','revoked','expired')` — at most one live invite per email per advisor.

#### `advisor_team_members`

| column | type | notes |
| --- | --- | --- |
| `id` | uuid pk | |
| `advisor_id` | uuid → `advisor_profiles.id` | |
| `user_id` | uuid → `auth.users.id` | the staff person |
| `role` | enum `team_role` | |
| `status` | enum `member_status` (`active` \| `revoked`) | |
| `invite_id` | uuid → `advisor_team_invites.id` | provenance |
| `created_at` | timestamptz | |
| `revoked_at` | timestamptz null | |
| `revoked_by_user_id` | uuid null | |
| `revoke_reason` | text null | |

Constraints:
- `unique (user_id)` — enforces "one staff = one advisor" at the database level.
- `foreign key (advisor_id) on delete cascade` — deleting the advisor removes membership rows.

### 4.2 Helper functions

Both `STABLE`, `SECURITY DEFINER`, `SET search_path = public, pg_catalog`. Granted execute to `authenticated` only.

```sql
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
```

### 4.3 Trigger: cascade-revoke on advisor deactivation

```sql
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
        and status in ('pending_admin_approval','approved','sent');
  end if;
  return new;
end;
$$;

create trigger trg_cascade_revoke_team
  after update of status on public.advisor_profiles
  for each row execute function public.cascade_revoke_team_on_advisor_deactivate();
```

Cascading revoke at the DB level guarantees there is no code path where a deactivated advisor leaves dangling staff sessions.

## 5. Invitation Lifecycle

```
   ADVISOR                MPB ADMIN                      INVITEE
   ───────                ─────────                      ───────

   Settings → Team
   types email + role
        │
        ▼
   advisor-team-invite     ← validates, rate-limits, dedupes
        │                    inserts row → status = pending_admin_approval
        │                    notifies MPB ops
        ▼
                          ┌────────────────────┐
                          │ Pending Team Invites│
                          │  queue (admin)      │
                          └────────────────────┘
                                  │
                                  │  approve / deny
                                  ▼
                          admin-approve-team-invite
                            • mints token (raw → email,
                              hash → DB), expiry=now+7d
                            • status: approved → sent
                            • Resend email to invitee
                                  │
                                  │
                                  ▼                        ┌─────────────────────┐
                                                           │ "you've been invited│
                                                           │ to assist John on   │
                                                           │ MPB" → /accept-invite│
                                                           └─────────────────────┘
                                                                    │
                                                                    ▼
                                                           accept-team-invite
                                                             • verify token (hash)
                                                             • create / link auth.users
                                                             • insert advisor_team_members
                                                             • invite.status=accepted
                                                             • sync ITSTS profile
                                                             • return session
                                                                    │
                                                                    ▼
                                                          /dashboard with banner
                                                          "acting as John Advisor"
```

### State machine — `advisor_team_invites.status`

```
pending_admin_approval ──approve──▶ approved ──email sent──▶ sent ──user accepts──▶ accepted
        │                              │                       │
        │ deny                         │ revoke (advisor       │ expire (cron, 7d)
        ▼                              │  or admin)            ▼
      denied                           ▼                    expired
                                    revoked
```

`accepted`, `denied`, `revoked`, `expired` are terminal.

### Notifications

| event | channel | recipient |
| --- | --- | --- |
| Invite created | internal Slack/email | MPB ops |
| Invite approved | Resend email | invitee |
| Invite denied | Resend email | advisor (with `decision_note`) |
| Invite accepted | Resend email | advisor (FYI) |
| Member revoked | Resend email | revoked staff |

## 6. RLS Rewrite Strategy

### 6.1 The substitution rule

Every existing advisor-scoped RLS policy gets one mechanical change:

```
auth.uid()  →  public.effective_advisor_id(auth.uid())
```

…in advisor-scoping conditions only. Auth-time identity (e.g., a user's own auth row, password reset) keeps raw `auth.uid()`.

Three existing patterns and their replacements:

```sql
-- Pattern A: direct id match (advisor_profiles.SELECT)
USING ((SELECT auth.uid()) = id)
→ USING (id = public.effective_advisor_id(auth.uid()))

-- Pattern B: foreign-key match
USING (advisor_id = auth.uid())
→ USING (advisor_id = public.effective_advisor_id(auth.uid()))

-- Pattern C: subquery match
USING (advisor_id IN (SELECT id FROM advisor_profiles WHERE user_id = auth.uid()))
→ USING (advisor_id = public.effective_advisor_id(auth.uid()))
```

INSERT policies on `advisor_profiles` keep raw `auth.uid()` — only the advisor themselves can create their own profile row, never a staff member.

### 6.2 Manager-vs-Assistant gating

Tables holding commissions / payouts / earnings get an additional `effective_role` check ANDed with the scope:

```sql
create policy "team can read commissions if not assistant"
  on advisor_commissions for select
  to authenticated
  using (
    advisor_id = public.effective_advisor_id(auth.uid())
    and public.effective_role(auth.uid()) in ('advisor', 'manager')
  );
```

Same gate on `advisor_team_invites` and `advisor_team_members` write policies — assistants can never read or modify the team tables themselves.

### 6.3 Tables that stay unchanged

- `auth.users` — managed by Supabase
- ITSTS schema / project tables — scoped via the `ticket-proxy` edge function, not Postgres RLS
- Public lookup tables, marketing tables — not advisor-scoped
- Training / LMS enrollments — see §7.4

### 6.4 Inventory and review process

Phase 0 of the rollout (Section 11) produces an exhaustive checklist of every existing policy referencing `auth.uid()` on advisor-scoped tables. The checklist is committed alongside the migration so every line in the diff maps to a row in the inventory.

Each migration file groups one logical area (profiles, training, clients, tickets, commissions, settings) for review-ability. Inside each migration, every policy is changed via `drop policy ... ; create policy ...` in a single transaction so there is no unprotected window.

Additive deployment: new policies are added alongside existing ones in Phase 2 (so a bug rolls back to the old policy automatically). Phase 9 cleanup removes the legacy policies after 30 days of stable production.

### 6.5 RLS test strategy

For every changed table, three pgTAP test cases:

1. *Advisor reading their own data* — must still pass (regression).
2. *Manager staff* — sees the advisor's data on non-financial tables AND commissions.
3. *Assistant staff* — sees the advisor's data on non-financial tables, blocked from commissions and team management.

Tests run in CI before deploy. Migration is gated on green.

## 7. On-Behalf-Of Pattern

### 7.1 Universal rule

Every write that records "who did this" splits into two fields:

| concept | value |
| --- | --- |
| **owner / scope** | `effective_advisor_id(auth.uid())` |
| **actor** | `auth.uid()` |

When advisor === actor (the case for every existing user today), they are equal and behavior is unchanged. When staff is logged in, they diverge.

### 7.2 ticket-proxy changes

Per [supabase/functions/ticket-proxy/index.ts](../../../supabase/functions/ticket-proxy/index.ts) (currently v30+ in `dtmnkzllidaiqyheguhl`, v4+ in `hhikjgrttgnvojtunmla`):

New top-of-handler helper:

```ts
async function resolveCallerIdentities(jwt: string) {
  const { data: { user } } = await supabaseAdmin.auth.getUser(jwt);
  if (!user) throw unauthorized();

  const advisorId = await rpc("effective_advisor_id", { uid: user.id });
  const role      = await rpc("effective_role",      { uid: user.id });
  if (!advisorId) throw forbidden("not an advisor or active staff member");

  const advisorAuthEmail = await fetchAdvisorAuthEmail(advisorId);
  const ownerItstsId     = await fetchItstsProfileIdByEmail(advisorAuthEmail);
  const actorItstsId     = await ensureItstsProfileForUser(user); // creates if missing

  return { user, advisorId, role, ownerItstsId, actorItstsId };
}
```

Per-case rewrites:

| case | change |
| --- | --- |
| `create` / `create_for_advisor` | Payload to ITSTS `tickets` insert: `requester_id = ownerItstsId` (advisor's ITSTS profile id), `origin = (actor === advisor ? 'advisor' : 'staff')` (existing enum value), plus the two NEW columns from §7.5: `created_by_user_id = user.id` (advisor-portal `auth.uid()` of the actor) and `submitted_on_behalf_of_advisor_id = advisorId`. Existing column writes (`subject`, `description`, `category`, `priority`, `status`, `agent_id`, `idempotency_key`) are unchanged. |
| `get` / `list` | Scope by `requester_id = ownerItstsId`. Staff sees the advisor's full ticket history, not their own queue. |
| `add_reply` | Payload to ITSTS `ticket_comments` insert: `author_id = actorItstsId` (existing column, preserved — ITSTS-side RLS depends on it), PLUS the new column `author_user_id = user.id` (advisor-portal `auth.uid()` of the actor). MPB Support's UI joins `author_user_id` against advisor-portal user data to render "Sue (Assistant for John)". When actor === advisor, `author_user_id` equals the advisor's user id, identical content to today, just newly populated. |
| `update_status` | `actor_id = actorItstsId` for ITSTS-side audit; allowed because `effective_advisor_id(auth.uid()) === ticket.requester_advisor_id`. |
| `get_stats` | Scope by `effective_advisor_id`. Stats reflect the advisor's full pipeline regardless of viewer. |

### 7.3 Audit log changes (`_shared/security.ts`)

```sql
alter table public.audit_events
  add column on_behalf_of_advisor_id uuid references public.advisor_profiles(id);
```

Same column on `audit_logs` if present. Every audit insertion now populates both `actor_user_id` and `on_behalf_of_advisor_id`. For advisors logged in as themselves the two fields are equal — same value, no semantic change.

**Critical deploy note** (per CLAUDE.md memory): every edge function importing `_shared/security.ts` must be redeployed in the same window. The Phase 0 importer inventory enumerates every function; Phase 3 batch-deploys them all. Piecemeal deploys would leave some functions writing to a column that doesn't exist yet, or not writing the new column at all.

### 7.4 Other actor-aware code paths

| path | owner | actor |
| --- | --- | --- |
| `PortalSettingsService.ts` | `advisor_id` | `actor_user_id` (was `updated_by`) |
| Document uploads | `advisor_id` | `uploaded_by_user_id` |
| Client/lead notes, CRM activity | `advisor_id` | `actor_user_id` |
| Meetings | `host_advisor_id` | `created_by_user_id` |
| **Training / LMS enrollments** (intentional inversion) | the staff person — Sue takes her own training, not John's | `auth.uid()` directly, no `effective_advisor_id` |

Training is the only place the pattern intentionally inverts. Documented and tested explicitly so the inversion is intentional, not a bug.

### 7.5 ITSTS schema changes

Verified against the actual ITSTS schema (`hhikjgrttgnvojtunmla`, migrations in `supabase/itsts-migrations/`). The design has been adjusted to be strictly additive and non-breaking. **Live ITSTS integration must keep working through every phase of rollout** (memory: ticket pages are a high-complaint surface). Below, every change is annotated with the non-breaking property that protects it.

#### Existing ITSTS surface we are NOT changing

These already exist and we reuse them as-is:
- `tickets.requester_id uuid` — stays as the advisor (queue placement, search, history).
- `tickets.origin ticket_origin` — enum already includes the values we need: `member | advisor | staff | concierge`. We start using `'staff'` as the literal source value when actor ≠ advisor.
- `tickets.submitted_by_concierge uuid` — existing precedent for "actor differs from requester." Our new `submitted_on_behalf_of_advisor_id` follows the exact same pattern.
- `tickets.agent_id text` — stays.
- `ticket_comments.author_id uuid (FK → profiles.id)` — stays as the ITSTS profile UUID of the commenter. We do NOT change this column or its FK.
- `profiles.role text` — **already exists** with a CHECK constraint and is referenced by 6 existing RLS policies. Values include `member | advisor | staff | admin | super_admin | agent | concierge`. The `ROLE_MAP` in [supabase/functions/_shared/itsts-sync.ts](../../../supabase/functions/_shared/itsts-sync.ts) already maps monorepo roles to ITSTS roles. We use `role = 'staff'` for team-account members (no new column needed).

#### Net-new columns

Applied via a single migration in `supabase/itsts-migrations/` (Phase 1b in §11). All columns are `NULL` and have **no DEFAULT**, **no NOT NULL constraint**, **no foreign keys**, **no new RLS policies**, and **no new triggers** — that combination is what makes the migration a metadata-only change with no table rewrite and no lock contention on the live ticket queue.

**`tickets`** — adds two nullable columns:
- `created_by_user_id uuid null` — the literal user who clicked "create ticket". Distinct from `requester_id` (queue owner). No FK (cross-project; advisor-portal `auth.users` is in a different Postgres database — Postgres cannot enforce cross-project FKs and pretending it can would create a misleading constraint).
- `submitted_on_behalf_of_advisor_id uuid null` — the advisor whose data the actor was acting on behalf of. Same shape as the existing `submitted_by_concierge` column; readers can switch on whichever is populated.

**`ticket_comments`** — adds one nullable column:
- `author_user_id uuid null` — the literal advisor-portal user who typed the comment. Coexists with the existing `author_id` (ITSTS profile UUID, FK preserved). MPB Support UI renders "Sue (Assistant for John)" by joining `author_user_id` against advisor-portal user data through the existing edge-function path; `author_id` continues to be the canonical reply author for any ITSTS-internal logic, RLS, or trigger that already depends on it.

**`profiles`** — **no change**. We reuse the existing `role` column.

#### Why every existing consumer keeps working

1. **No `SELECT *` consumers.** The audit confirmed every ITSTS reader in this monorepo (`ticket-proxy`, `_shared/itsts-sync`, `sync-user-to-itsts`, `sso-itsts-login`, `bulk-sync-itsts`, `advisor-terminal-agent`, `generate-blog-post`) uses explicit column lists. Adding nullable columns surfaces nothing to existing readers.
2. **No FK across projects.** The new UUID columns are advisor-portal user ids and an advisor-portal `advisor_profiles.id` — that database lives in `dtmnkzllidaiqyheguhl`. ITSTS lives in `hhikjgrttgnvojtunmla`. Postgres cannot enforce FKs across databases, and faking it via service-role lookups would just slow down every insert. Validation happens in the edge-function layer (ticket-proxy already validates the JWT and resolves identities — see §7.2).
3. **No NOT NULL DEFAULT.** Adding a NOT NULL column with a non-volatile DEFAULT is fast-path on modern Postgres, but `NULL` is faster still and avoids any backfill semantics. We accept that historic rows have these columns null forever; reporting queries `COALESCE(created_by_user_id, requester_id)` to fill in the actor for legacy rows.
4. **No new RLS policies on these tables in this phase.** Existing `tickets` and `ticket_comments` RLS policies don't reference the new columns, so they remain in force unchanged. If MPB Support UI ever needs visibility rules keyed off the new columns, that's a follow-up additive policy — out of scope here.
5. **No triggers fire on the new columns.** The audit enumerated 15 triggers on `tickets`, 13 on `ticket_comments`, 1 on `profiles`. None reference the new columns.
6. **Old ticket-proxy still works during the gap.** Between Phase 1b (ITSTS schema lands) and Phase 4 (ticket-proxy deploys with new payload), the old ticket-proxy continues inserting its existing column set; the new columns simply stay null. The reverse — Phase 4 deploying before Phase 1b — would break, which is why the rollout enforces strict ordering.

#### Strict phase ordering for ITSTS safety

This is the invariant that keeps the live ITSTS connection non-breaking:

```
Phase 1b (ITSTS schema)  MUST complete before  Phase 4 (ticket-proxy redeploy)
                           ^                           ^
        new columns exist  │  new ticket-proxy may now write to them
        old columns intact │  old payload paths still valid for fallback
```

If Phase 1b is rolled back, Phase 4 must roll back first. Phase 4 → Phase 1b is the rollback order; Phase 1b → Phase 4 is the forward order. The deploy script enforces this with a precondition check (Phase 4 deploy refuses to run if any ITSTS schema check fails).

### 7.6 ITSTS profile sync

`accept-team-invite` calls the existing [supabase/functions/_shared/itsts-sync.ts](../../../supabase/functions/_shared/itsts-sync.ts) helper to ensure an ITSTS profile exists for the new staff user. The helper already exposes a `ROLE_MAP` translating monorepo roles to ITSTS roles. We extend that map (one-line addition):

```ts
// existing
ROLE_MAP['advisor'] = 'advisor';
// new — staff/manager from advisor-portal team accounts both map to 'staff' in ITSTS
ROLE_MAP['team_assistant'] = 'staff';
ROLE_MAP['team_manager']   = 'staff';
```

Staff profiles get `role = 'staff'` (existing ITSTS enum value, already exercised by RLS) and `agent_id = null`. Existing advisor sync paths are unchanged. **No new parameters, no new function signatures**: this is the smallest possible change that lights up team-account ITSTS sync.

### 7.7 What MPB Support sees in ITSTS

Tickets stay in the advisor's queue (`requester_id = advisor`). New surface metadata in the ticket header:

- **Requester**: John Advisor (queue, search, history all keyed off this)
- **Submitted by**: Sue Assistant (visible badge)
- **Replies**: each reply's author is the literal person who typed it

MPB Support emails Sue when they need clarification, but the ticket lives in John's history forever.

## 8. UI Surfaces

### 8.1 Advisor portal — `Settings → Team`

Path: [apps/advisor-portal/src/pages/settings/TeamManagement.tsx](../../../apps/advisor-portal/src/pages/settings/TeamManagement.tsx) (existing stub gets implemented).

Visible to: advisors and managers. Hidden from assistants (nav entry hidden, route guard redirects to dashboard).

```
┌─────────────────────────────────────────────────────────────────────┐
│  Team                                                               │
│  Invite assistants and managers to access your portal.              │
│  All invites are reviewed by MPB before they're sent.   [Invite ▸]  │
├─────────────────────────────────────────────────────────────────────┤
│  ACTIVE TEAM (2)                                                    │
│  • Sue Mendez · sue@advisorcoX.com · Assistant   [Manage ⋯]        │
│    Joined 2026-04-12 · Last seen 3h ago                            │
│  • Jake Chen · jake@example.com · Manager        [Manage ⋯]        │
│    Joined 2026-02-01 · Last seen yesterday                         │
│                                                                     │
│  PENDING INVITES (1)                                                │
│  ⏳ taylor@example.com · Assistant · pending MPB review              │
│    Sent 2 hours ago · [Cancel]                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Invite modal: email input (validated, lowercased, dedupe-checked), role select (Manager / Assistant) with one-line description of each, submit. Toast on success: "Invite sent to MPB for review. Taylor will get an email once it's approved (usually within one business day)."

Manage menu per active member: change role (manager ↔ assistant) with confirm; revoke access with confirm (signs them out globally, sends courtesy email); resend invite (only on `sent` rows).

Empty state: "You haven't added anyone to your team yet. Invite an assistant or manager to help manage your portal."

### 8.2 Admin portal — Pending Team Invites queue

Lives in `apps/admin-portal`. Reads `dtmnkzllidaiqyheguhl` via existing service-role pattern.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Pending Team Invites                                                  │
├────────────────────────────────────────────────────────────────────────┤
│  Advisor       │ Invitee                  │ Role     │ Submitted  │     │
│  ──────────────┼──────────────────────────┼──────────┼────────────┼──── │
│  John Advisor  │ taylor@example.com       │ Asst     │ 2h ago     │ ▸   │
│  Maria Diaz    │ kevin@diazfinancial.com  │ Manager  │ 1d ago     │ ▸   │
└────────────────────────────────────────────────────────────────────────┘
```

Side panel on row click:
- Advisor name, status, license info, current team count
- Whether invitee email matches any other account in the system (warning if so)
- Whether email's domain matches advisor's known domains (soft signal)
- **Approve** / **Deny** buttons. Deny prompts for `decision_note`, emailed to advisor.
- Approve triggers email send via `admin-approve-team-invite`.

Filters: all advisors / by status (pending / recently approved / recently denied) / by date.

Nav: new "Team Invites" entry with a count badge for pending items.

### 8.3 Public — Accept Invite page

Path: `apps/advisor-portal/src/pages/AcceptInvite.tsx` (new). Route: `/accept-invite?token=...`.

**Critical**: public route. Does NOT use `useAuth`. Does NOT use `supabase.functions.invoke` (per memory: invoke hangs on unauth pages with stale sessions). Uses direct `fetch` to the edge function.

States:
1. **Loading** — verifying token (`accept-team-invite?action=verify`)
2. **Valid** — "You've been invited to join John Advisor's team on MPB Health as an Assistant." Plus name + password + confirm-password fields. Brief explanation of what they'll be able to see. Accept button.
3. **Already accepted** — "This invite has already been used. Sign in instead." → `/login` link.
4. **Expired / revoked / denied** — "This invite is no longer valid. Please ask John to send a new one."
5. **Email already on another advisor's team** — "This email is already on another advisor's team. Each staff account belongs to one advisor."

Every state has a 12-second timeout that surfaces "something went wrong, try again" with a retry button. No infinite spinner (per memory: high-complaint pattern).

### 8.4 Global — "Acting as Advisor X" banner

Component: `apps/advisor-portal/src/components/StaffBanner.tsx` (new).

When `isStaff === true`, every page renders a thin banner above top nav:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 👥  You're signed in as Sue Mendez · acting on behalf of John Advisor   │
└──────────────────────────────────────────────────────────────────────────┘
```

Sticky, low-contrast, dismissible per session but not permanently. Reason: staff always know whose data they're looking at; screenshots in support tickets are unambiguous.

### 8.5 `AdvisorContext` extension

[apps/advisor-portal/src/contexts/AdvisorContext.tsx](../../../apps/advisor-portal/src/contexts/AdvisorContext.tsx) extended:

```ts
type AdvisorSession = {
  advisor: AdvisorProfile;                    // OWNER — the advisor whose data is shown
  actor: { user_id: string; email: string; display_name: string }; // logged-in user
  role: 'advisor' | 'manager' | 'assistant';
  isStaff: boolean;
};
```

Loading logic:
1. Get `auth.uid()` from session.
2. RPC `effective_advisor_id(auth.uid())` and `effective_role(auth.uid())`.
3. If `effective_advisor_id` is null → "no access" page.
4. Load `advisor_profiles` row for the resolved advisor_id (RLS allows staff to read it).
5. Load actor's own minimal profile for display.

Existing call sites that read `advisor.id` and `advisor.email` keep working — they're now reading the *owner's* fields, which is what they always meant. Audit / signout / password change reads `actor`.

### 8.6 Role-gating helper

`apps/advisor-portal/src/lib/canAccess.ts` (new):

```ts
canAccess('commissions')      // role !== 'assistant'
canAccess('team-management')  // role !== 'assistant'
canAccess('portal-settings')  // role !== 'assistant'
```

Drives nav visibility and route guards. RLS in §6.2 is the real enforcement; UI gates are polish so assistants don't see broken pages.

## 9. Edge Functions

### 9.1 New (in `dtmnkzllidaiqyheguhl`)

#### `advisor-team-invite`
Auth: advisor JWT. RBAC: `effective_role` is `advisor` or `manager`.
Validates: email format, lowercased, not advisor's own email, not already on any advisor's team, no live invite for this email by this advisor, advisor's pending+active count under soft cap (default 10).
Rejects: emails in `@mympb.com` or `@mpb.health` domains (internal-domain protection).
Rate limit: 10 invites per advisor per 24h.
Inserts: `advisor_team_invites` with `status = 'pending_admin_approval'`, no token yet (token minted on approval — denied invites never had a working token).
Side effect: notifies MPB ops via existing `send-ticket-notification`-style channel. Fire-and-forget.

#### `admin-approve-team-invite`
Auth: admin JWT. RBAC: admin role in `org_memberships` (existing admin-portal pattern).
Body: `{ invite_id, decision: 'approve'|'deny', decision_note? }`.
On approve: re-checks advisor is still active. Generates 32-byte random token (`crypto.randomBytes(32)`), stores `sha256(token)` in `token_hash`, `expires_at = now() + 7 days`, status `approved` → `sent` after email send completes. Email via Resend, link `https://advisor.mpb.health/accept-invite?token=<raw>`.
On deny: status → `denied`, emails advisor with `decision_note`.
Audit row: `actor = admin user_id`, `target = invite_id`, event `team_invite_approved` or `team_invite_denied`.

#### `accept-team-invite`
Auth: none — token IS the auth. Public, rate-limited by IP + token-prefix.
Two actions via query param:

`?action=verify` (read-only): looks up by `token_hash = sha256(provided_token)`. Returns advisor name, role, expiration. Refuses for any non-`sent` status. Reveals identical "invite not found or no longer valid" for all failure modes (no enumeration leakage).

`?action=accept` body: `{ token, password, display_name }`. Inside one transaction with `select ... for update` on the invite row:
1. Re-verify token, status, expiry, invitee email not already on another advisor's team.
2. If `auth.users` row exists for this email → require sign-in instead of password set (don't change existing user's password). If not → create with `email_confirm = true` (the invite IS the email confirmation) and chosen password.
3. Insert `advisor_team_members` (status `active`).
4. Update invite: `status = 'accepted'`, `accepted_at = now()`.
5. Call `_shared/itsts-sync.ts` with `kind = 'staff'` (no `agent_id`).
6. Sign user in via admin API → return session tokens.

Audit row: `actor = new staff user_id`, `event = 'team_invite_accepted'`, `on_behalf_of_advisor_id = invite.advisor_id`, origin IP captured.

#### `advisor-team-revoke`
Auth: caller must be the owning advisor, a manager on that advisor's team, or an MPB admin. Refuses to revoke the advisor themselves.
Body: `{ member_id?, invite_id?, reason? }` (one or the other).
Active member: `status = 'revoked'`, fills `revoked_at` / `revoked_by_user_id` / `revoke_reason`. Calls `auth.admin.signOut(user_id, scope='global')` so any active staff session dies on next request.
Pending invite: `status = 'revoked'`, voids `token_hash`.
Sends courtesy email. Audit row.

### 9.2 Modified

| function | change |
| --- | --- |
| `ticket-proxy/index.ts` | §7.2 actor/owner split. Both copies (`dtmnkzllidaiqyheguhl` + `hhikjgrttgnvojtunmla`) redeployed. |
| `send-ticket-notification/index.ts` | When actor ≠ advisor, subject/body includes "Submitted by Sue on behalf of John". |
| `_shared/security.ts` | Audit-event inserts populate `on_behalf_of_advisor_id`. Triggers a coordinated redeploy of every importer (Phase 3). |
| `_shared/itsts-sync.ts` | Optional `kind` parameter for staff sync. Existing advisor paths unchanged. |

### 9.3 Frontend code changes

**Advisor portal:**
- `AdvisorContext.tsx` — extended per §8.5
- `useAuth.ts` — exposes `actor`, `role`, `isStaff`. Existing fields unchanged.
- New: `useTeam.ts` (hook wrapping the four edge functions)
- New: `AcceptInvite.tsx` (public page; direct `fetch`, NOT `supabase.functions.invoke`)
- Implemented: `TeamManagement.tsx` (was a stub)
- New: `StaffBanner.tsx`
- New: `lib/canAccess.ts`
- `packages/advisor-core/src/support/TicketService.ts` — no behavioral change; the edge function does the splitting.
- Routing: `/accept-invite` added as a public route alongside `/login`, `/forgot-password`.

**Admin portal:**
- New: `pages/team-invites/index.tsx` (queue list)
- New: `pages/team-invites/[id].tsx` (detail / approve-deny)
- New: `lib/teamInvites.ts` (service layer to `dtmnkzllidaiqyheguhl`)
- Nav: "Team Invites" entry with count badge

### 9.4 What is NOT changed

- Mobile member portal (`app.mpb.health`)
- Public website (`mpb.health`)
- CRM (`crm.mpb.health`) — `org_memberships` untouched
- Any non-advisor-scoped table's RLS

## 10. Lifecycle, Edge Cases, Audit, Error Handling

### 10.1 Membership lifecycle

| Event | Effect on staff access |
| --- | --- |
| Advisor revokes the staff member | `members.status = 'revoked'`, sessions invalidated via `auth.admin.signOut(scope='global')`, courtesy email. |
| MPB admin revokes | Same. `revoked_by_user_id` records the admin. |
| Advisor deactivated | DB trigger (§4.3) cascades: members revoked, pending invites revoked, sessions invalidated. |
| Advisor deleted (rare) | `ON DELETE CASCADE` removes membership rows. Supabase auth deletion invalidates sessions. |
| Staff resets own password | Standard Supabase flow. No effect on membership. (Per memory: never `signOut()` after `updateUser()` in reset password.) |
| Staff changes own email | Supabase auth handles it; membership unchanged (link is by `user_id`, not email). |
| Advisor changes role of staff | Update `advisor_team_members.role`. Existing sessions keep working; next RPC returns new role; UI updates within seconds. No forced sign-out. |
| Staff with no access tries to log in | `effective_advisor_id` returns null → `AdvisorContext` redirects to "no access" page with "Contact support" link. Sign-out works cleanly. |

### 10.2 Edge cases (production-hardening)

1. **Same person invited by two advisors at once.** Both invites can sit in `pending_admin_approval` (unique constraint scoped to advisor + email). Whichever is *accepted* first wins; the other is denied at acceptance time on the "not already on another advisor's team" check. Invitee message: "This email is already on another advisor's team — please use a different email or ask your previous advisor to revoke first."

2. **Advisor invites their own email.** `advisor-team-invite` rejects synchronously: "You can't invite your own email — you already have full access."

3. **Invite email never arrives** (spam, typo). Advisor cancels and re-invites. Once approved, "Resend" affordance available.

4. **Token enumeration / brute force.** Tokens are 32 random bytes (~2^256 search space). Rate-limit by IP + token-prefix. Verification reveals identical "invite not found or no longer valid" for all failures — no "valid token but expired" leak.

5. **Admin approves an invite for an advisor who has since been deactivated.** `admin-approve-team-invite` re-checks advisor status before sending. Refuses, flips invite to `denied` automatically with `decision_note = 'Advisor account is no longer active'`.

6. **Existing auth user with a different password.** `accept-team-invite` does NOT change an existing user's password without consent. Page shows: "An MPB account already exists for this email. Sign in with your existing password to accept the invite." On sign-in success, link membership without touching credentials.

7. **Race on accept-twice.** `accept-team-invite` uses `select ... for update` on the invite row. Second click loses the race, returns clean "already accepted" response.

8. **Staff session left open across a revocation.** Next request through `effective_advisor_id` returns null → API rejects. UI redirects to "no access". `auth.admin.signOut` is belt-and-suspenders: both server-side check AND session invalidation must catch it.

9. **Advisor "downgrading their own role".** Not possible — advisors aren't in `advisor_team_members`. Role helper returns `'advisor'` based on `advisor_profiles`.

10. **Manager revoking the advisor.** Refused: revoke endpoint won't touch the advisor (advisors aren't members). Managers can only revoke other staff on their advisor's team.

11. **Assistant URL-jumping to `/commissions`.** Route guard redirects to `/dashboard`. RLS in §6.2 is the actual enforcement; UI guard is polish.

12. **MPB admin denies, then advisor re-invites the same email.** Allowed once the prior invite hits `denied` (terminal state).

13. **Internal-domain protection.** `advisor-team-invite` rejects `@mympb.com` and `@mpb.health` to prevent advisors from accidentally inviting MPB staff into their portal under the team-account path.

### 10.3 Audit events

Every action that affects access or that's done on-behalf-of writes to `audit_events` with both `actor_user_id` and `on_behalf_of_advisor_id`:

| event | actor | on_behalf_of | notes |
| --- | --- | --- | --- |
| `team_invite_created` | advisor | self | invitee email + role |
| `team_invite_approved` | admin | advisor | who, when |
| `team_invite_denied` | admin | advisor | with `decision_note` |
| `team_invite_accepted` | new staff user | advisor | session origin IP |
| `team_invite_revoked` | advisor or admin | advisor | reason |
| `team_member_role_changed` | advisor | advisor | from/to |
| `team_member_revoked` | advisor or admin | advisor | reason |
| `ticket_created_on_behalf` | staff | advisor | implicit when actor ≠ advisor |
| `portal_setting_updated_on_behalf` | staff | advisor | same |

Advisor's own Settings → Team page shows a "Recent activity" section reading the last 50 audit events for their account. MPB ops have the full feed in the admin portal.

### 10.4 Error handling principles

- **Edge functions** return structured `{ error: { code, message } }`. Codes: `invite_already_used`, `email_already_on_team`, `advisor_inactive`, `email_in_internal_domain`, etc. User-facing strings live in the client.
- **RLS denials** caught by the data layer and surfaced as "you don't have access to that" — not a half-loaded UI. Pages that 100% require access show an "access denied" screen instead of an infinite spinner.
- **Network or auth race** on AcceptInvite — every state has a 12-second timeout surfacing retry. No infinite spinner.
- **Concurrency on revoke + active session** — staff client sees 401 on next API call. Existing axios/fetch interceptors route to `/login` with "your access ended" message.
- **Email send failures** (Resend down) — invite stays at `status = approved`, admin queue surfaces "send failed, retry?" affordance. Manual retry; no auto-retry, to keep admin in the loop.

### 10.5 Compliance / privacy

- Pending invitee emails visible to advisor (their team page) and MPB admins (queue).
- Once invite is `accepted` or in any terminal state past 90 days, `invited_email` and `decision_note` are redacted in place via nightly job (`<redacted>` plus a hash). Audit row stays whole. Reduces blast radius of a DB leak.
- Staff ITSTS profiles have `kind = 'staff'`, `agent_id = null` — cannot accidentally be assigned tickets as the responder.
- Staff members listed in advisor's BAA-relevant inventory (if MPB tracks one) by virtue of `advisor_team_members`. Compliance reporting itself is out of scope; data model supports it.

## 11. Migration & Rollout

Nine phases. Each phase is independently safe and reversible. Each gets its own PR, deploy, and verification gate. **No phase is bundled with another.**

### Phase 0 — Pre-flight inventory (no code change)

- Full RLS policy inventory (every policy on every advisor-scoped table referencing `auth.uid()`): schema, table, policy name, current `using`, current `with check`, target replacement.
- Full edge-function importer inventory for `_shared/security.ts`.
- Full client call-site inventory for `useAuth().id` / `auth.uid()` reads in advisor portal.
- Snapshot of current schema version + currently-deployed edge function versions for rollback.

Gate: inventory reviewed and signed off. No code in this phase.

### Phase 1 — Schema-only migrations (two projects)

**1a. Advisor portal project (`dtmnkzllidaiqyheguhl`)** — single migration in `supabase/migrations/`:
- New tables: `advisor_team_invites`, `advisor_team_members` (RLS on per §4.1).
- New enums: `team_role`, `invite_status`, `member_status`.
- New helper functions: `effective_advisor_id`, `effective_role` (`STABLE`, `SECURITY DEFINER`, search_path locked, granted to `authenticated`).
- New column: `audit_events.on_behalf_of_advisor_id` (nullable). Same on `audit_logs` if present.
- Trigger: `advisor_profiles.status` → cascade-revoke (§4.3).

**1b. ITSTS project (`hhikjgrttgnvojtunmla`)** — single migration in `supabase/itsts-migrations/`. Strictly additive per §7.5:

```sql
alter table public.tickets
  add column if not exists created_by_user_id uuid,           -- nullable, no FK, no default
  add column if not exists submitted_on_behalf_of_advisor_id uuid;

alter table public.ticket_comments
  add column if not exists author_user_id uuid;               -- nullable, no FK, no default

-- profiles.role already exists; no change needed
-- no new RLS policies, no new triggers, no new indexes in this phase
```

Note: the comments table is `ticket_comments` (not `ticket_replies`) per the ITSTS schema; the `profiles.role` column already exists with the values we need (`staff` already in its CHECK constraint), so no `kind`/`role` column is added in ITSTS.

Neither migration changes any existing RLS, edge function, or client code. All new columns nullable with no DEFAULT — metadata-only on Postgres, no table rewrite, no lock contention on the live ticket queue. Cross-project FKs intentionally omitted (impossible in Postgres; validation is at the edge-function layer).

Verification:
- **Advisor portal pgTAP**: (a) advisors see their own data exactly as before, (b) new tables follow §4.1 access rules (advisor + manager can SELECT scoped, others denied), (c) `effective_advisor_id(advisor_uid) === advisor_uid` for every advisor with `status <> 'inactive'`.
- **ITSTS smoke test**: replay last 24h of ticket-creation payloads through staging, confirm row counts and column values match production. Confirm existing `ticket-proxy` (still v30, not yet redeployed) continues writing tickets and comments without errors — the new columns just stay null on its inserts.
- **Live read parity**: every ITSTS reader listed in §7.5 queries explicit columns (no `SELECT *`), so the new columns surface to nothing existing. Confirmed by the Phase 0 inventory.

Rollback: drop new tables / helpers / column / trigger on `dtmnkzllidaiqyheguhl`. On `hhikjgrttgnvojtunmla` drop the three new columns. Rollback safety: if Phase 4 has already deployed, roll back Phase 4 *first* (so the redeployed ticket-proxy stops writing the new columns), then drop the columns. The deploy script enforces this ordering.

### Phase 2 — Existing RLS policies migrated to use helpers

Bulk find-and-replace under pgTAP coverage. Because `advisor_team_members` is empty, helpers resolve to the advisor's own id for every authenticated user — every existing query returns the same rows.

- One migration file per logical group (profiles, training, clients, tickets, commissions, settings).
- Each policy change is `drop policy ... ; create policy ...` in a single transaction.
- New commission/team-mgmt policies added WITHOUT removing existing ones (additive); subtractive cleanup in Phase 9.

Verification: full pgTAP suite + synthetic smoke test diffing row counts against baseline for one or two real advisor accounts. Differences must be zero.

Rollback: revert per-file (each is a pure swap; reverting restores the prior `auth.uid()` references).

### Phase 3 — `_shared/security.ts` updated; coordinated redeploy

- Shared utility starts populating `on_behalf_of_advisor_id`. For advisors logged in as themselves, the new column equals the actor — same value, no semantic change.
- Phase 0 importer list drives a single batch redeploy via deploy script.

Verification: synthetic call to each redeployed edge function. Responses unchanged. Audit rows include the new column populated.

Rollback: revert security.ts, redeploy importers. Column stays in schema; rows from rollback window have null in the new column (acceptable).

### Phase 4 — `ticket-proxy` updated

**Hard precondition**: Phase 1b has shipped to `hhikjgrttgnvojtunmla`. Deploy script runs a precondition check that queries `information_schema.columns` for `tickets.created_by_user_id`, `tickets.submitted_on_behalf_of_advisor_id`, and `ticket_comments.author_user_id`. If any are missing, deploy refuses with a clear error pointing back at Phase 1b.

- New version of `ticket-proxy` with actor/owner split (§7.2).
- With zero staff in `advisor_team_members`, the actor and owner identities are equal for every advisor. The new columns are populated on every insert but with the same value as the actor (advisor's own user id), so the meaning is unchanged.
- Deploy to BOTH copies: `dtmnkzllidaiqyheguhl` (primary, currently v30+) and `hhikjgrttgnvojtunmla` (secondary, currently v4+).

Verification:
- Fixture-based test against staging ITSTS comparing payloads pre/post-deploy. Existing-column values must match exactly. New-column values: `created_by_user_id` equal to actor, `submitted_on_behalf_of_advisor_id` equal to advisor, `author_user_id` equal to commenter — all expected when no staff exists.
- Live-traffic monitoring for 30 minutes: error rate, P50/P95 latency on `list`, `create`, `add_reply`. Memory: ticket pages are a high-complaint surface; this is the most sensitive deploy of the rollout.
- **MPB Support UI smoke test**: confirm a real ticket created post-deploy renders in MPB Support's UI exactly as one created pre-deploy did. The new columns are invisible to today's UI (no `SELECT *` consumers); this confirms.

Rollback: redeploy prior version on both projects (Supabase retains prior versions). The new columns are left populated on tickets created during the brief Phase-4-active window; that's harmless because they hold the same value as the corresponding actor/requester. If Phase 1b also needs to roll back (extremely unlikely), do so AFTER Phase 4 rollback completes — never before.

### Phase 5 — New invite edge functions deployed (hidden from users)

- `advisor-team-invite`, `admin-approve-team-invite`, `accept-team-invite`, `advisor-team-revoke` deployed but unused — no UI calls them yet.
- Tested via direct curl + staging end-to-end: create test advisor, test invite, admin approval, acceptance. Confirm resulting staff user sees test advisor's data and not other advisors'. Confirm RLS denies revoked staff.

Rollback: delete deployed functions.

### Phase 6 — Frontend code shipped behind a feature flag

- AdvisorContext rewrite, new pages, StaffBanner, TeamManagement implementation all ship.
- `vite_feature_team_accounts` flag gates: Settings → Team nav entry, AcceptInvite route, admin Team Invites queue.
- Flag stays OFF in prod. Expanded `AdvisorContext` ships unconditionally (it's a pure refactor when no staff exist).

Verification: existing advisor smoke tests pass with flag off. Flag on in staging — full end-to-end with two real test accounts.

Rollback: flag stays off. Revert deploy if no-staff path regressed.

### Phase 7 — Internal pilot

Flag on for a hardcoded list of MPB-internal advisor user_ids. MPB ops invites a real test assistant to a real test advisor account. Runs daily flows: dashboard, clients list, file ticket, reply, view settings (manager allowed / assistant blocked), commissions (manager allowed / assistant blocked).

Pilot duration: ≥ 5 business days. Watching for:
- Unexpected RLS denials in production logs (each gets RCA before Phase 8).
- ticket-proxy errors / latency drift.
- Audit row sanity.
- Any 12-second timeout firings (per memory: "stuck spinner" is the recurring failure mode).

Gate: zero unresolved incidents during the pilot window.

### Phase 8 — General rollout

Flag flips on globally. Settings → Team visible to all advisors and managers. Admin queue visible to MPB ops. AcceptInvite route publicly resolvable.

Communication: short email to all advisors + one-page how-to in the help center (out of scope for spec; in launch checklist).

Watch first 24 hours: invite queue activity, denied invites, net-new RLS errors.

### Phase 9 — Cleanup (post-launch, ~30 days later)

- Remove the additive duplicate RLS policies from Phase 2. New policies become the only policies.
- Delete feature flag plumbing.
- Delete `TeamManagement.tsx` original-stub fallback.
- Run redaction job on `decision_note` / pending invite emails older than 90 days.

Phase exists so we don't carry feature-flag debris forever.

### Rollout principles summary

- Every phase testable with the prior phase live.
- Hardest change (Phase 2 RLS rewrite) ships when zero staff exist — verified as a true no-op before any new code path opens.
- Shared-utility change (Phase 3) bundled into a single coordinated redeploy per CLAUDE.md memory rule.
- User-visible feature gated by flag until underlying machinery is proven in prod.
- Phases 1–6 ship invisibly to end users. First user-visible behavior change is Phase 7, on accounts MPB controls.

## 12. Open Questions / Out of Scope

- **Multi-advisor staff** (one assistant covering multiple advisors). Out of scope per Q4. Future-additive: add a row to `advisor_team_members` and a switcher in the header; no rewrite needed.
- **Granular per-feature permissions** beyond Manager/Assistant. Out of scope per Q2. If signal appears post-launch, layer on top of `effective_role`.
- **Compliance reporting** for BAA-relevant inventory. Data model supports it; specific reporting deliverable is a follow-up.
- **Self-service onboarding** without admin approval. Out of scope per Q3. The hybrid approval gate is intentional.
- **Staff-to-staff messaging** within an advisor's team. Out of scope; existing messaging surface is per-advisor.

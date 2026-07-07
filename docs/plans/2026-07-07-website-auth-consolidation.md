# Website auth consolidation — plan

**Date:** 2026-07-07
**Origin:** Architecture review candidate 1 ("collapse the website's forked auth stack"), design settled by interview.
**Decision record:** `docs/adr/0001-no-forked-auth-security-modules.md`

## Problem

`apps/website/src/lib/` carries forked copies of security-critical modules whose
canonical versions live in `packages/auth` and `packages/utils`. The forks have
drifted in both directions, so fixes to the packages silently never reach the
client-facing website login, and website-only changes never reach the portals.

Measured drift (2026-07-07, `diff` line counts):

| File | Website-only | Package-only | Triage |
|---|---|---|---|
| `mfaService.ts` | 1 | 1 | import-only — mechanical swap |
| `rateLimitService.ts` | 2 | 2 | import-only — mechanical swap |
| `securityEventService.ts` | 1 | 488 | website strictly behind (never got webhook alerting) |
| `passwordSecurityService.ts` | 23 | 202 | package substantially ahead |
| `sanitizer.ts` | 45 | 367 | package substantially ahead |
| `secureAuthService.ts` | 34 | 42 | **two-way divergence — reconcile** |
| `userRolesService.ts` | 58 | 31 | **two-way divergence — reconcile** |
| `safeStorage.ts` | 190 | 66 | **two-way divergence — reconcile** |
| `safeJson.ts` | 87 | 18 | **two-way divergence — reconcile** |

Helpful fact: `apps/website/src/lib/supabase.ts` is already a re-export of
`@mpbhealth/database` — there is no client-singleton obstacle. Call-site blast
radius outside `lib/` is small (1–3 importing files per module).

## Decisions (settled in design interview)

1. **Package wins by default.** Website-only lines are individually reviewed and
   either ported into the package or dropped as junk. No website-only behavior
   survives in `apps/website/src/lib`. (ADR-0001.)
2. **Scope covers services *and* components**, staged: lib files first
   (Stage 1), contexts/guards second (Stage 2). Website is client-facing —
   stages ship separately with soak between them.
3. **Behavior deltas adopted outright, no fences.** The website gains the
   package's newer password policy and security-event webhook alerting — the
   same behavior every portal already runs. Care comes from verification, not
   divergence.
4. **Stage 0 first**: revive CI on `main` and fix the `packages/auth` typecheck
   error, so every subsequent PR has a real gate.
5. **Tests are a must**, scoped to what we touch: a test file per reconciled
   module pinning the standardized behavior and every consciously
   ported/dropped delta. Pure-logic seams only; no Supabase-mocking heroics.
6. **Website role knowledge stays in the website** as a small adapter
   (~50 lines) over the generic `packages/auth` context/guards — the package
   does not learn website concepts like `canAccessAdminPortal`.
7. **One PR per stage**, preview verification, soak window, explicit approval
   before each production-affecting merge.

---

## Production change playbook sections

### Discovery (done, read-only)

- Drift measured per file (table above).
- Import sites counted per module.
- `lib/supabase.ts` confirmed as a re-export.
- Git history confirms shared commits touched both copies of
  `secureAuthService`; package gained later work the forks lack.

Remaining pre-flight (read-only, before PR 1 merge):

- [ ] `SELECT id, name, channel_type, min_severity, enabled FROM security_alert_webhooks;`
      against prod — determines whether webhook alerting is a no-op or live on day one.
- [ ] Read the password-policy delta and write the member-facing implication in
      one sentence (expected: stricter rules apply only at password set/change).

### Risk classification

**Tier 1+. PROD WRITE RISK: NO** (no schema, data, or RLS changes; no new
tables). The risk is **behavioral**: live client-facing auth flows (login,
password reset, MFA) change implementation. Handled via preview verification,
staged merges, and watch windows.

### Proposed design

**Stage 0 — make the safety net real (PR 0)**

1. Retarget `.github/workflows/{ci,db,security}.yml` from `branches: [master]`
   to `[main]` (one line each).
2. Fix `packages/auth/src/services/ssoService.ts(47)` — `openInNewTab` missing
   on `PortalInfo`.
3. Exit criterion: typecheck + build green in CI for `website`, `auth`,
   `utils` paths. Other pre-existing red (crm-core tests, dependency audit) is
   out of scope — visible, not blocking this plan.

**Stage 1 — the nine lib files (PR 1)**

Order of work:

1. Mechanical swaps first: `mfaService`, `rateLimitService` — delete fork,
   import from `@mpbhealth/auth`.
2. Package-ahead adoptions: `securityEventService`, `passwordSecurityService`,
   `sanitizer` — review the small website-only remainder (1–45 lines), port or
   drop, delete fork.
3. Two-way reconciliations: `secureAuthService`, `userRolesService`,
   `safeStorage`, `safeJson` — line-by-line review; website-only deltas ported
   into the package behind the existing interface (or explicit options) or
   dropped with a note in the PR description.
4. Tests: one test file per reconciled module in its package, pinning
   standardized behavior + each ported delta.
5. Update the 1–3 call sites per module; delete `apps/website/src/lib` copies.
6. Exit criterion: `rg` finds no imports of the deleted files; diff shows
   `apps/website/src/lib` has zero auth/security modules; CI green.

**Stage 2 — contexts and guards (PR 2, starts after Stage 1 soak)**

1. Build the website-side role-mapper adapter: derives `isAdmin`, `isAdvisor`,
   `canAccessAdminPortal` from the shared `packages/auth` context.
2. Replace website `AuthContext.tsx`, `ProtectedRoute.tsx`, `RouteGuard.tsx`
   with the shared equivalents + adapter.
3. Login pages (`UnifiedLoginPage`, `SecureLoginPage`): consolidate onto the
   shared components; keep website look-and-feel via props, not forks.
4. Tests for the adapter's role derivations.
5. Exit criterion: forked context/guards deleted; route gating verified for
   member portal, embedded CMS, and admin redirects; CI green.

### Dry-run plan

- Each PR builds and typechecks in CI (Stage 0 makes this real).
- Full app build of `website` locally per PR: `pnpm build:website`.
- Stage 1/2 verified on **Vercel preview deployments** before merge — this is
  the rehearsal environment; no production writes occur before merge.

### Pilot plan

The staging *is* the pilot: Stage 1 (services, lower blast radius) merges and
soaks before Stage 2 (routing/guards, higher blast radius) begins. Within
Stage 1, mechanical swaps land as the first commits so the riskier
reconciliations sit on a verified base.

### Verification plan

Preview checklist per client-facing PR (run on the Vercel preview URL, signed
off by Carlos before merge):

- [ ] Member login (email/password) succeeds; bad password rejected
- [ ] Password reset end-to-end (email → token → new password under new policy)
- [ ] MFA enrollment + verification
- [ ] Rate-limit lockout after repeated failures + recovery after window
- [ ] (Stage 2) Member portal routes gated correctly for member/anon
- [ ] (Stage 2) Embedded CMS reachable only for admin roles; `/forbidden`
      redirect works
- [ ] (Stage 2) Session persistence across refresh; logout clears session

Post-merge watch window (each stage): login error rates / auth-related
security events monitored for 3 days before the next stage starts.

### Rollback plan

- Every stage is a single revertable merge commit; `git revert` restores the
  forks verbatim (no data or schema to unwind).
- Vercel: instant rollback to the previous deployment if user-facing breakage
  appears before a revert lands.
- No migrations, no RLS changes, no irreversible steps anywhere in the plan.

### Approval gate

- PR 0: merge on green CI (repo-internal, no user-facing change) — still gets
  explicit approval since it changes deploy-adjacent workflow config.
- PR 1: merge only after preview checklist signed off by Carlos.
- PR 2: merge only after preview checklist signed off by Carlos, and only
  after Stage 1's watch window closes clean.

---

## Out of scope (explicitly)

- All CRM surfaces (`apps/crm`, `crm-core`, CRM edge functions, CRM CI jobs) —
  per decision 2026-07-07, no CRM deletions right now.
- The other architecture-review candidates (edge-function authz seam, audit
  unification, AdvisorContext split, …) — separate plans.
- Pre-existing CI red outside this plan's paths (crm-core tests, dependency
  audit findings, security-headers job).

# Phase 3 — Verification, regression shield, release readiness

Use this checklist after Phase 2 **and** Phase 2b changes are merged. It is intentionally **actionable**; adjust owners and environments to your process.

**Deliverables (this phase):**

- [Verification report](./verification-phase3-report.md) — matrix, risks, release judgment  
- [Instrumentation](./instrumentation-phase3.md) — `mpb:portal-diag` events and thresholds  
- [Engineering guardrails](./engineering-guardrails.md) — ongoing standards  
- Run CRM unit tests: `pnpm test:crm` (from repo root)

## 1. Automated verification

| Check | Command / action |
|--------|------------------|
| Monorepo install | `pnpm install` |
| CRM typecheck | `pnpm --filter @mpbhealth/crm typecheck` |
| Auth package typecheck | `pnpm --filter @mpbhealth/auth typecheck` (or `cd packages/auth && pnpm typecheck`) |
| CRM build | `pnpm --filter @mpbhealth/crm build` |
| Lint (if CI parity) | `pnpm --filter @mpbhealth/crm lint` |

## 2. Database & RPC

- [ ] Apply migrations through **staging** then **production**: `supabase db push` (or equivalent).
- [ ] Confirm **`get_my_org_permissions_snapshot`** exists and **`authenticated`** can execute it.
- [ ] Smoke: sign in → CRM → **Network** tab shows **one** RPC call for permissions (or fallback PostgREST when RPC disabled).
- [ ] Confirm **`idx_role_permissions_org_role`** exists (`\d+ role_permissions` in psql or Supabase dashboard).

## 3. Permission & org correctness (manual)

- [ ] Switch org in CRM → **no** stale data from previous org (query keys include `orgId`).
- [ ] User with **no membership** in org → expected deny / empty permission set (no crash).
- [ ] **PermissionGate** / **can()** behavior matches pre-change (owners/admins still bypass per Phase 2 rules).
- [ ] **orgRole** in UI matches role from snapshot (spot-check one role).

## 4. CRM shell behavior

- [ ] Dashboard loads after org ready (no infinite spinner).
- [ ] **Refresh** actions (e.g. after creating lead/task) still **invalidate** the right queries.
- [ ] **Realtime** lead path: debounced invalidation does not flood the network (watch tab).
- [ ] Components using **`useCRMService()`** only (if any) do not break when queries refetch.

## 5. Regression shielding

- [ ] **E2E / smoke** (Playwright or manual): login → CRM dashboard → open one lead → one task view.
- [ ] **Advisor / Admin** portals: quick smoke if shared auth or packages changed.
- [ ] **Feature branch** or **canary** deploy before full rollout if policy allows.

## 6. Instrumentation (recommended)

- [ ] **Application Insights** (or equivalent): track **RPC** `get_my_org_permissions_snapshot` duration and **error rate**; **PostgREST** fallback count.
- [ ] **Postgres**: enable `pg_stat_statements` on staging; sample top queries by **total time** after realistic load.
- [ ] Document **baseline** after Phase 3 so future tuning is evidence-based.

## 7. Release readiness

- [ ] Changelog / internal notes for **CRM** + **auth** + **Supabase** migrations.
- [ ] Rollback plan: migration rollback script or forward-fix; RPC removal is safe (fallback path remains).
- [ ] Stakeholder sign-off on **permission** and **multi-tenant** behavior.

---

**References:** See [`stabilization-phase2.md`](./stabilization-phase2.md) and [`stabilization-phase2b.md`](./stabilization-phase2b.md).

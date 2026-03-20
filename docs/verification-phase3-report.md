# Phase 3 — Verification report

**Date:** 2026-03-20  
**Scope:** Advisor Portal, CRM, Admin Portal — stability, permissions, TanStack Query, instrumentation.

This report is **evidence-based where automation exists** and **explicitly marks manual QA** where human or staging access is required. Code changes alone are **not** treated as proof of UX.

---

## 1. Summary matrix

| Track | Automated evidence | Manual QA status | Notes |
|-------|-------------------|------------------|--------|
| **A. CRM** | Vitest: query keys + org prefix; portal diagnostic unit test; `pnpm --filter @mpbhealth/crm typecheck` pass | **Required** — route shell, dashboard, leads, tasks, calendar, modals, slow network | Use [`instrumentation-phase3.md`](./instrumentation-phase3.md) + DevTools Network |
| **B. Admin** | No new automated UI tests this pass | **Required** — metrics, routes, modals | Relies on Phase 2 `AdminContext` / `withTimeout` patterns |
| **C. Advisor** | Existing Playwright auth specs only | **Required** — nav, bulletin, degraded network | `playwright.config.ts` defaults to production URL — use env for staging |
| **D. Permissions** | RPC + fallback in `permissionService`; OrgContext emits `permission_load` | **Required** — owner/admin bypass, deny vs error, org switch | Batched RPC: `get_my_org_permissions_snapshot` |
| **E. Query system** | CRM: DEV query storm hook; tests for key prefixes | **Required** — bursty realtime, mutation → invalidation | Realtime debounce in `CRMContext` |
| **F. Performance** | No production APM attached in-repo | **Required** — measure in staging with same build | Before/after **not** claimed here without traces |

---

## 2. CRM — files & automated checks

| Item | Pass? | Evidence |
|------|-------|----------|
| Stable query keys | Pass | `apps/crm/src/__tests__/crmQueryKeys.test.ts` |
| Portal diagnostics | Pass | `apps/crm/src/__tests__/portalDiagnostics.test.ts` |
| Typecheck | Pass | `tsc --noEmit` for `@mpbhealth/crm` |
| Permission timing events | Implemented | `OrgContext.tsx` → `emitPortalDiagnostic` |
| Modal timing events | Implemented | `Modal.tsx` → first rAF after open |
| Query refetch storm (dev) | Implemented | `crmQueryDiagnostics.ts` + `CRMProvider` |

**Remaining concern:** Full **lead create → list update without manual refresh** should be confirmed manually (invalidation calls `refreshLeads` / query invalidation from `AddLeadModal`).

---

## 3. Instrumentation report

See **[instrumentation-phase3.md](./instrumentation-phase3.md)** for the full list of events, thresholds, and APM handoff notes.

---

## 4. Test report

| Test | Location | Purpose |
|------|-----------|---------|
| `crmQueryKeys` | `apps/crm/src/__tests__/crmQueryKeys.test.ts` | Tenant isolation + invalidation prefix |
| `portalDiagnostics` | `apps/crm/src/__tests__/portalDiagnostics.test.ts` | CustomEvent contract |
| CRM shell (optional E2E) | `tests/e2e/smoke/crm-shell.spec.ts` | Loads page without JS errors when `E2E_CRM_URL` set |

**Gaps (recommended Phase 3+):**

- Integration test: `QueryClient` + `invalidateQueries` after a mocked mutation.
- Playwright: authenticated flows (needs test users / secrets).
- Admin / Advisor: same `emitPortalDiagnostic` pattern if product wants parity.

---

## 5. Performance comparison

**Not measured in this repository run.** Baseline and after metrics require:

- Staging deployment with migrations applied
- Application Insights or equivalent (permission duration, route transitions)
- Optional: Lighthouse / Web Vitals on CRM shell

**Documented expectation (Phase 2b):** fewer chained permission HTTP calls when RPC is deployed; TanStack Query dedupes parallel observers for the same key.

---

## 6. Risk register (ranked)

| Severity | Risk | Mitigation |
|----------|------|------------|
| High | Manual QA not run on a real environment | Execute [`stabilization-phase3-checklist.md`](./stabilization-phase3-checklist.md) on staging |
| Medium | `useCRM()` still merges query data — rerenders possible | Prefer `useCRMService()` + narrow queries in hot subtrees |
| Medium | Permission RPC down → PostgREST fallback (more round trips) | Monitor RPC error rate; alert on fallback spike |
| Low | Query storm heuristic false positives in dev | Tune thresholds; storms are dev-only console warnings |

---

## 7. Release readiness judgment

**Conditionally ready for internal QA.**

Rationale: automated **typecheck**, **unit tests**, and **instrumentation** are in place; **behavioral** acceptance (freezes, modals, permissions, save-without-refresh) **requires** a staffed pass on staging with Network + `mpb:portal-diag` listeners. **Not** asserted: production performance numbers or full three-portal sign-off.

---

## 8. Long-term guardrails

See **[engineering-guardrails.md](./engineering-guardrails.md)**.

---

## 9. References

- [stabilization-phase2.md](./stabilization-phase2.md)
- [stabilization-phase2b.md](./stabilization-phase2b.md)
- [stabilization-phase3-checklist.md](./stabilization-phase3-checklist.md)

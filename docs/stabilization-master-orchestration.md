# MPB Health Monorepo — Master Stabilization Program (Phases 2 + 2b + 3)

**Purpose:** Single controlled execution document for agents and engineers. Run **Stage A → B → C** in order. Do not skip ahead.

**Operator instruction (read first):** Execute this program in order. Do not skip Stage A to jump into architecture refactors. Do not stop after code changes; **Stage C verification is mandatory.** Prefer incremental, low-regression improvements that reduce user-facing freeze behavior first, then structural improvements, then verification and release judgment.

**Recommended Stage B order (within Phase 2b) for fastest meaningful gains:** (1) permission batching endpoint → (2) selective TanStack Query migration → (3) CRMContext split → (4) backend tuning **with traces**, not guesses.

**Existing implementation docs in this repo:**

| Stage | Primary references |
|-------|-------------------|
| A (Phase 2) | [`stabilization-phase2.md`](./stabilization-phase2.md) |
| B (Phase 2b) | [`stabilization-phase2b.md`](./stabilization-phase2b.md) |
| C (Phase 3) | [`verification-phase3-report.md`](./verification-phase3-report.md), [`stabilization-phase3-checklist.md`](./stabilization-phase3-checklist.md), [`instrumentation-phase3.md`](./instrumentation-phase3.md), [`engineering-guardrails.md`](./engineering-guardrails.md) |

---

## Role

You are acting as a principal monorepo architect, React performance engineer, TanStack Query migration lead, backend performance engineer, QA architect, and release-readiness lead.

**Applications in scope:** Advisor Portal, CRM, Admin Portal.

**Context:** Phase 1 (Audit Hawk) identified high-signal instability sources. This document governs **three execution layers** in one program:

- **Stage A** = Phase 2 — Localized stabilization  
- **Stage B** = Phase 2b — Deep architecture remediation  
- **Stage C** = Phase 3 — Verification, regression shielding, release readiness  

**Mission:** Eliminate major causes of: frozen pages; blank/stuck permission states; hanging modals; forced manual refresh; render churn; refresh storms; inconsistent server-state; slow permission paths; evidence-free backend guesses; silent regressions.

---

## Global non-negotiable rules

1. Preserve business logic.  
2. Preserve auth, org, tenant, role, and permission correctness.  
3. Preserve RLS safety and security boundaries.  
4. Keep changes typed, maintainable, monorepo-safe, and production-grade.  
5. Prefer incremental, high-confidence remediation over uncontrolled rewrites.  
6. Do not rewrite the whole CRM or monorepo in one pass.  
7. Every async flow must resolve to visible success, visible error, or recoverable retry.  
8. No permission/loading gate may silently return null in a way that mimics a freeze.  
9. No provider should emit unstable values without strong reason.  
10. No backend tuning should be guessed when evidence can be gathered.  
11. Any new DB/RPC/Edge work must be fully documented.  
12. Any new query/state architecture must include clear invalidation, retry, and failure semantics.  
13. **Verification is mandatory; code changes alone do not count as success.**

---

## Confirmed Phase 1 findings (inform all stages)

- CRM PermissionGate returned null while permissions load (address in A1).  
- CRMContext mega-context → broad rerenders (address in B1/B2).  
- ThemeProvider new value object every render (A3).  
- CRM AuthProvider new value object every render (A4).  
- AdminContext unstable callbacks / memo (A2).  
- `withTimeout` does not cancel underlying work (A9; document semantics).  
- Permission UX harsh / under-surfaced on failure (A6).  
- Initial CRM load batching four parallel paths (A5).  
- Realtime lead events fan out refreshes (A7).  
- Modal scroll lock duplicated (A8).  
- CRM vs Advisor TanStack Query inconsistency (B2).  
- Overlapping role-loading patterns (B3).  
- Reload behaviors feel like crashes (A5–A9, C).

---

# STAGE A — PHASE 2: Localized stabilization

**Objective:** Highest-confidence, minimal blast-radius fixes first.

### Goals

- Remove blank/frozen-feeling permission states  
- Reduce provider-driven rerender churn  
- Reduce initial-load pressure  
- Coalesce refresh storms  
- Improve modal lifecycle  
- Improve visible recovery  

### Workstreams

| ID | Topic | Requirements |
|----|--------|----------------|
| **A1** | PermissionGate | No `return null` for loading; explicit loading UI; shell where feasible; distinguish deny vs transient failure; retry; preserve enforcement. |
| **A2** | AdminContext | `useCallback` on handlers; `useMemo` on value; preserve metrics/live updates. |
| **A3** | ThemeProvider | Memoize value; stabilize callbacks. |
| **A4** | CRM AuthProvider | Memoize value; stable `signIn`/`signOut`. |
| **A5** | CRM initial load | Progressive critical vs secondary; visible loading/failure; avoid long blocked shell. |
| **A6** | Permission UX | Failures/timeouts visible; not confused with deny; owner/admin bypass. |
| **A7** | Refresh storms | Debounce/coalesce realtime → dashboard/leads (etc.). |
| **A8** | Modals/overlays | Centralized/ref-counted scroll lock; EmailComposer Escape/discard. |
| **A9** | Timeouts | Audit `withTimeout`; stale guards; explicit timeout semantics. |

### Stage A deliverables

1. Exact files changed  
2. Code patches  
3. Stabilization notes per fix  
4. Deferred work for Stage B  
5. Any DB changes + migrations/CLI  

### Stage A acceptance criteria

CRM routes not blank during permission load; reduced churn in Admin/CRM; progressive CRM shell; failure ≠ deny; fewer realtime storms; reliable modals; no auth/permission regression.

---

# STAGE B — PHASE 2b: Deep architecture remediation

**Objective:** Structural patterns that still cause systemic churn after A.

### Goals

- Reduce CRM global server-state churn  
- Consistent query-based server state where high value  
- Batch/simplify permission loading  
- Tune backend with **evidence**  

### Workstreams

| ID | Topic | Requirements |
|----|--------|--------------|
| **B1** | CRMContext split | Services vs churning server-state; narrower hooks; compatibility. |
| **B2** | TanStack Query (selective) | Dashboard, recent leads, tasks, calendar, activities if justified; keys; staleTime/gcTime/retry; invalidation; coalesced realtime invalidation. |
| **B3** | Permission batching | Single path (RPC preferred); membership, role, permissions; RLS; failure states; docs. |
| **B4** | Backend tuning | Traces/EXPLAIN/pg_stat_statements; indexes; no guesswork on hot paths. |

### Stage B deliverables

1. Architecture summary  
2. File list  
3. Patches  
4. DB: migrations, indexes, RPCs, CLI  
5. Query migration report  
6. Permission batching report  
7. Performance tuning report (evidence + fixes)  
8. Deferred to Stage C  

### Stage B acceptance criteria

CRMContext not sole choke point for migrated slices; Query dedupe + invalidation; common path not chained PostgREST-only; faster/clearer permission UX; evidence-backed DB changes; no auth/org regressions.

---

# STAGE C — PHASE 3: Verification & release readiness

**Objective:** Prove stability; add guardrails.

### Verification tracks

- **C1** CRM — shell, permissions, dashboard, leads, tasks, calendar, activities, CRUD, modals, realtime, slow/fail network, save without refresh  
- **C2** Admin — providers, metrics, routes, modals, slow backend, live updates  
- **C3** Advisor — access, nav, bulletin, SW, degraded network  
- **C4** Permissions — RPC, edge cases, bypass, deny vs failure, retry, cache, RLS  
- **C5** Query — keys, invalidation, dedupe, focus/reconnect, storms, post-mutation state  
- **C6** Performance — measurable UX timings (where tooling exists)  
- **C7** Regression shield — instrumentation, smoke tests, key unit tests  

### Stage C deliverables

1. Verification report (per app/flow: pass/fail, evidence, files, concerns)  
2. Instrumentation report (telemetry, logs, thresholds)  
3. Test report (added/updated/gaps)  
4. Performance comparison (where measurable)  
5. Risk register (ranked)  
6. Release readiness judgment (one of: not ready | conditional internal QA | controlled rollout | full production confidence)  
7. Long-term guardrails (see [`engineering-guardrails.md`](./engineering-guardrails.md))  

### Stage C acceptance criteria

No frozen major routes without visible state; loading ≠ deny; migrated areas not mega-context-only; Query stable; RPC secure; tuning evidence-backed; common saves need no manual refresh; instrumentation in place; **clear release recommendation**.

---

## Required output format (for agent responses)

When reporting completion, use clearly separated sections:

**Stage A:** Findings & fixes | Files changed | Patches | Deferred to B  

**Stage B:** Architecture summary | Files | Patches | DB deliverables | Query report | Permission report | Performance report | Deferred  

**Stage C:** Verification | Instrumentation | Tests | Performance comparison | Risks | Release judgment | Guardrails  

---

## Execution style

**Do:** User-perceived responsiveness; correctness; security; documented transitional architecture; diagnosable system.  

**Do not:** Hide uncertainty; assume perf without proof; over-rewrite; collapse deny and load-failure; claim done without verification.

---

## Quick links

- Operator briefing (1 page): [`stabilization-operator-briefing.md`](./stabilization-operator-briefing.md)  
- Internal execution SOP: [`stabilization-execution-sop.md`](./stabilization-execution-sop.md)  
- **Stage checkpoint template (mandatory reporting format):** [`stabilization-stage-checkpoint-template.md`](./stabilization-stage-checkpoint-template.md)

## Progress reporting

Each engineer (or each PR batch) should complete the **stage checkpoint** after A, B, and C: what/why/files/symptom/verification/regression/deferred. See the template above.

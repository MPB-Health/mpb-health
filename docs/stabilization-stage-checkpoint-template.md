# Stabilization program — stage checkpoint template

Use this **at the end of Stage A, Stage B, and Stage C** so progress is reported in a **fixed structure**. Prevents vague “cleanup” narratives and preserves auditability.

**Related:** [`stabilization-master-orchestration.md`](./stabilization-master-orchestration.md) · [`stabilization-operator-briefing.md`](./stabilization-operator-briefing.md) · [`stabilization-execution-sop.md`](./stabilization-execution-sop.md)

---

## Rules (before broad execution)

| Rule | Meaning |
|------|--------|
| **No feature expansion during Stage A** | Stabilization only; product scope changes require explicit exception. |
| **All fixes cite exact files changed** | List paths in the checkpoint; PR description should mirror. |
| **All async UX changes show visible loading / error / retry** | No silent nulls that feel like a freeze. |
| **Any provider or context change includes a rerender-risk note** | Who re-subscribes; what identity changed; mitigation if any. |
| **Stage C is a release gate, not a suggestion** | No “done” without verification evidence per program criteria. |

---

## Checkpoint — copy/paste per engineer (or one per PR batch)

**Stage:** ☐ A (Phase 2) ☐ B (Phase 2b) ☐ C (Phase 3)  
**Author:**  
**Date:**  
**Branch / PR:**

### 1. Summary

**What was changed** (concrete, not “improved stability”):

**Why it was changed** (link to symptom, audit finding, or ticket):

**User symptom addressed** (what the user would have noticed before):

---

### 2. Files touched

List **exact paths** (add lines if many):

- `path/to/file.ext` — one-line purpose of edit  
- …

---

### 3. Provider / context / query changes (if any)

**Rerender-risk note:** (N/A if not applicable)

- Subscribers affected:  
- Value identity / memoization:  
- Mitigation:  

---

### 4. Async UX (if any)

For each new or changed async path:

| Flow | Loading | Error | Retry |
|------|---------|-------|-------|
| | visible how? | visible how? | affordance? |

---

### 5. Regression risk

**Risk level:** ☐ Low ☐ Medium ☐ High  

**What could break:** (auth, tenants, permissions, RLS, routes, modals)

**Mitigation / review focus:**

---

### 6. Verification evidence

**Automated:** (commands run, e.g. `pnpm typecheck`, `pnpm test:crm`, tests added)

**Manual / staging:** (screens, Network tab, `mpb:portal-diag`, checklist row — or **explicit** “not yet run”)

**Evidence links / notes:**

---

### 7. Deferred items

What was **intentionally** left for the next stage or a follow-up ticket:

-  

---

### 8. Sign-off (optional)

**Reviewer:**  
**Date:**  

---

## Stage-specific hints

### Stage A checkpoint

- Call out PermissionGate/loading UX, provider memoization, debounced realtime, modal/scroll lock, `withTimeout` semantics.  
- **Deferred to B** should list anything structural (CRMContext split, Query migration) not done here.

### Stage B checkpoint

- Call out query keys, RPC/migrations, invalidation strategy, CRMContext split boundaries.  
- **Performance:** cite evidence (EXPLAIN, traces) or mark “deferred to evidence gathering.”

### Stage C checkpoint

- Map work to **C1–C7** verification tracks where possible.  
- **Release readiness** must align with [`verification-phase3-report.md`](./verification-phase3-report.md) / team judgment.  
- List **gaps** (e.g. no authenticated E2E yet) explicitly.

---

## Aggregated report (for leads / program review)

After each stage closes, the lead may merge individual checkpoints into one table:

| PR / author | Symptom | Files (count) | Risk | Verified | Deferred |
|-------------|---------|---------------|------|----------|----------|
| | | | | | |

This keeps the stabilization initiative **traceable** and **release-gated**.

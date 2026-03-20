# Operator briefing — Stabilization program (A → B → C)

**Audience:** Tech lead, EM, or engineer kicking off a stabilization sprint.

## What this is

A **three-stage** program to fix freeze-like UX, permission confusion, and structural data-loading problems across **Advisor, CRM, and Admin** without a big-bang rewrite.

## Rules of engagement

1. **Order matters:** Stage A (localized fixes) → Stage B (architecture) → Stage C (verification). No skipping to “refactor CRM” first.  
2. **Verification is not optional:** Shipping code without Stage C evidence is not program completion.  
3. **Stage B leverage:** If you must sequence 2b work: **permission batching → TanStack Query slices → CRMContext split → DB tuning with traces.**

## What “done” looks like

- Users see **loading or error**, not blank shells, during permission and critical fetches.  
- **Deny** and **load failure** are different UX paths where it matters.  
- CRM **shell data** uses **TanStack Query** for the migrated slices; **invalidation** replaces blind refresh where possible.  
- **One RPC (or equivalent)** for the common permission path when deployed.  
- **Instrumentation + checklist + release judgment** documented (see Phase 3 docs).

## Where to read details

| Question | Document |
|----------|-----------|
| Full agent prompt + workstreams | [`stabilization-master-orchestration.md`](./stabilization-master-orchestration.md) |
| Phase 2 shipped patterns | [`stabilization-phase2.md`](./stabilization-phase2.md) |
| Phase 2b architecture + RPC | [`stabilization-phase2b.md`](./stabilization-phase2b.md) |
| QA checklist + release | [`stabilization-phase3-checklist.md`](./stabilization-phase3-checklist.md), [`verification-phase3-report.md`](./verification-phase3-report.md) |
| Engineering standards | [`engineering-guardrails.md`](./engineering-guardrails.md) |

## One-line pitch for stakeholders

“We fix perceived freezes and permission confusion first, then move server state onto a predictable caching layer with batched permissions, then **prove** it in staging with instrumentation—not just code review.”

## Reporting checkpoints

Use the same structure after each stage: **[`stabilization-stage-checkpoint-template.md`](./stabilization-stage-checkpoint-template.md)** (what, why, files, symptom, risk, verification, deferred). Leads can roll those into a single program table for review.

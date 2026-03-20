# Internal execution SOP — Stabilization program

**Version:** 1.0 · **Applies to:** MPB Health monorepo (Advisor, CRM, Admin)

## 1. When to use

Spikes in “frozen page,” blank CRM, permission confusion, modal/scroll issues, or refresh storms—after Phase 1 audit findings are acknowledged.

## 2. Execution sequence (mandatory)

| Step | Stage | Exit criterion |
|------|--------|----------------|
| 1 | **A — Phase 2** | Localized fixes merged; Phase 2 doc updated; no open P0 permission/shell regressions |
| 2 | **B — Phase 2b** | CRM Query slices + service split + RPC + migrations applied in non-prod first |
| 3 | **C — Phase 3** | Checklist executed; verification report + release judgment recorded |

**Do not** merge large B changes before A stabilizes auth/permission UX unless risk-approved.

## 3. Roles (minimum)

- **Implementer:** code + migrations.  
- **Reviewer:** security (RLS, RPC), React context/query boundaries.  
- **QA:** Stage C manual passes on **staging** with Network tab + `mpb:portal-diag` where applicable.

## 4. Definition of Ready (before B)

- Stage A acceptance criteria met.  
- Supabase migration path agreed (branch / preview DB).  
- Query key convention documented (`crmQueryKeys` pattern).

## 5. Definition of Done (program)

- [`verification-phase3-report.md`](./verification-phase3-report.md) updated with evidence or explicit manual QA sign-off.  
- [`engineering-guardrails.md`](./engineering-guardrails.md) acknowledged for new features.  
- Release readiness state recorded (not only “merged to main”).
- Each stage **checkpoint** completed per [`stabilization-stage-checkpoint-template.md`](./stabilization-stage-checkpoint-template.md) (files cited, verification evidence, rerender risk).

## 6. Escalation

- **Auth/permission ambiguity** → stop; clarify product rule (deny vs retry) before UI changes.  
- **DB tuning without traces** → defer; add APM or `pg_stat_statements` task.  
- **Scope creep** (“rewrite CRM”) → split follow-up epic; do not expand Stage B in-place.

## 7. Reference prompt

Full workstreams and output format: [`stabilization-master-orchestration.md`](./stabilization-master-orchestration.md).

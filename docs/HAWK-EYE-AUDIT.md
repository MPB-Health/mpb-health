# Hawk-Eye Audit Checklist

A structured framework for auditing the Advisor Portal (and similar apps) for loading issues, auth problems, and performance bottlenecks.

## Document Contents

### Phase 1 — Reconnaissance
Project structure, stack, dependencies, env, and build config.

### Phase 2 — Page Loading
Routing, Suspense, data loading, waterfalls, assets, server/middleware, redirects.

### Phase 3 — Login / Auth
Auth flow, session persistence, profile lookup, RLS, intermittent failures.

### Phase 4 — Code Cleanup
Dead code, consistency, error handling, security, dependency pruning.

### Phase 5 — Performance
Slow queries, assets, memory leaks, caching, re-renders.

### Phase 6 — Database
Schema, indexes, RLS, connections, triggers.

### Phase 7 — Logging & Observability
Client/server logging, Supabase logs, monitoring, traceability.

## Structured Output Report Template

- **Severity legend:** Critical / High / Medium / Low / Info
- **Tables:** Login/auth findings, page-loading findings
- **Prioritized action items**
- **Metadata:** Audit date, scope, auditor

## Advisor Portal Quick Reference

| Area | Path |
|------|------|
| Auth | `apps/advisor-portal/src/hooks/useAuth.ts`, `useAdvisorAuth.ts`, `contexts/AdvisorContext.tsx` |
| Routing | `apps/advisor-portal/src/App.tsx`, `layouts/MainLayout.tsx` |
| Supabase | `packages/database`, `packages/advisor-core` |
| Server / Edge | `supabase/functions/` |
| Profile / RLS | `advisor_profiles` table, `packages/advisor-core/src/profile/ProfileService.ts` |

## Related Docs

- [Hawk-Eye Findings Report](./HAWK-EYE-FINDINGS-REPORT.md) — Latest audit findings
- Auth troubleshooting (internal)
- Edge Function errors (internal)
- Operational procedures (internal)
- Security controls (internal)

---

## How to Use

- **Manual audit:** Work through each phase, checking items against the codebase.
- **AI agent:** Use this document as a prompt: "Run the Hawk-Eye audit on the advisor-portal using the framework in docs/HAWK-EYE-AUDIT.md and produce a findings report."

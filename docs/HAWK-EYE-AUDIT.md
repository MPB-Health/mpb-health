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
| Auth | `src/hooks/useAuth.ts`, `src/hooks/useAdvisorAuth.ts`, `src/contexts/AdvisorContext.tsx` |
| Routing | `src/App.tsx`, `src/layouts/MainLayout.tsx` |
| Supabase | `packages/database`, `packages/advisor-core` |
| Server / Edge | `supabase/functions/` |
| Profile / RLS | `advisor_profiles` table, `packages/advisor-core/src/profile/ProfileService.ts` |

## Related Docs

- Auth Troubleshooting
- Edge Function Errors
- Operational Procedures
- Security Controls

---

Use this as a manual checklist or as a prompt for an AI agent auditing the codebase.

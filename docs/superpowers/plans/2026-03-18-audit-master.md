# MPB Health Monorepo — Master Audit Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Identify and fix every critical mismatch across the MPB Health monorepo that can cause build failures, runtime errors, auth breakage, broken integrations, or data contract violations in production.

**Architecture:** 4 apps (advisor-portal, admin-portal, crm, website) + 14 shared packages + 44 edge functions + 264 migrations across 2 Supabase projects. Each sub-plan is an independent, parallelizable audit stream targeting a specific subsystem.

**Tech Stack:** Vite/React 18, TypeScript 5.5, pnpm workspaces, Turbo 2, Supabase (dtmnkzllidaiqyheguhl + hhikjgrttgnvojtunmla), Edge Functions (Deno), Vercel deployments, tsup builds.

---

## Scope: 4 Independent Sub-Plans (run in parallel)

| Sub-Plan | File | Focus |
|----------|------|-------|
| **1 — Infrastructure & Config** | `2026-03-18-audit-1-infra-config.md` | Workspace deps, tsconfig, path aliases, build pipeline, env vars, CI/CD |
| **2 — Auth, Domain & Security** | `2026-03-18-audit-2-auth-domain.md` | Auth redirects, middleware, CORS, CSP, session handling, domain drift |
| **3 — Data Layer & Edge Functions** | `2026-03-18-audit-3-data-layer.md` | Supabase schema, RLS, queries, migrations, edge functions, ticket-proxy |
| **4 — Frontend Contract & Notifications** | `2026-03-18-audit-4-frontend-integration.md` | API payload contracts, notification system, realtime, advisor/admin UX flows |

## Execution Order

Sub-plans 1–4 are independent and can execute in parallel. However:
- Sub-plan 3 fixes (SQL migrations) should land before sub-plan 4 fixes that depend on schema
- Sub-plan 2 fixes (auth/CORS) should land before validating sub-plan 4 notification flows
- **CRITICAL:** If any `_shared/` file (`cors.ts`, `security.ts`, `logger.ts`, `itsts-sync.ts`, `svix.ts`) is modified during Sub-plan 3, ALL edge functions that import it must be redeployed before running Sub-plan 4 validation (Task 7). Edge functions bundle their own copy of `_shared/` at deploy time — a stale bundle will produce CORS/auth failures in end-to-end tests even after the code fix is committed.

## Success Criteria

The audit is complete when:
- [ ] All 4 sub-plans fully executed
- [ ] Zero TypeScript errors: `pnpm -r typecheck`
- [ ] Zero lint errors: `pnpm -r lint`
- [ ] All apps build: `pnpm -r build`
- [ ] Auth flows validated (advisor login → reset → redirect)
- [ ] ticket-proxy create + reply + list confirmed working
- [ ] Notifications reach advisor inbox from admin reply
- [ ] No duplicate dependency warnings in pnpm install
- [ ] CORS preflight passes on all edge functions from all allowed origins

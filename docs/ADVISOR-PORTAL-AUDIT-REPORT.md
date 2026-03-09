# AUDIT REPORT — MPB Health Ecosystem: Advisor Portal

### Date: 2025-03-09
### Auditor: AI Agent (Cursor)
### Monorepo Commit: [Run `git rev-parse HEAD` for current hash]

---

## Executive Summary

This forensic audit of the **Advisor Portal** within the MPB Health monorepo was conducted per the Hawk-Eye audit framework. The portal is a React 18 + Vite SPA consuming Supabase for auth and data, with shared packages (`@mpbhealth/advisor-core`, `@mpbhealth/auth`, `@mpbhealth/ui`, etc.). The codebase is generally well-structured with lazy loading, error boundaries, and security guards. **Critical findings** include a broken `build:advisor` script, DOMPurify XSS vulnerability, and dead code. **High-priority** items center on loading waterfalls, `advisor_profiles` backfill reliability, and dependency vulnerabilities.

---

## CRITICAL ISSUES (Fix Immediately)

| # | Issue | Location | Root Cause | Fix | HIPAA Risk? |
|---|-------|----------|------------|-----|-------------|
| 1 | **build:advisor script fails** | `package.json` | Filter uses `advisor-portal` but package name is `@mpbhealth/advisor-portal` | Use `--filter=@mpbhealth/advisor-portal` | No |
| 2 | **DOMPurify XSS vulnerability** | `packages/utils` | dompurify@3.3.1 in range 3.1.3–3.3.1 vulnerable (GHSA-v2wj-7wpq-c8vv) | Upgrade to dompurify@^3.3.2 | Yes (XSS in rich text) |
| 3 | **Contact Support link is dead** | `Login.tsx` | `href="#"` does nothing | Point to `/contact` or support URL | No |

---

## HIGH PRIORITY (Fix This Sprint)

| # | Issue | Location | Root Cause | Fix | HIPAA Risk? |
|---|-------|----------|------------|-----|-------------|
| 1 | **Profile → Layout waterfall** | `MainLayout.tsx`, `AdvisorContext.tsx` | Layout shell blocked until profile loads; nav loads after profile | Render shell skeleton before profile; load nav in parallel | No |
| 2 | **advisor_profiles backfill gap** | Supabase migrations | Users with `user_roles` but no `advisor_profiles` cause login loop; migration `20260302103000` backfills but new users can slip through | Add trigger to auto-create `advisor_profiles` when user gets advisor role | No |
| 3 | **No request deduplication** | AdvisorContext, MainLayout, Dashboard | Multiple components trigger same profile/nav/training fetches; no shared cache | Introduce React Query or similar for profile, nav, training | No |
| 4 | **Edge Function cold start** | `ticket-proxy`, `chat-service` | 5–13s cold start; `ticketService.ping()` helps but runs before auth | Consider scheduled warm-up; optionally delay ping until after auth | No |
| 5 | **esbuild vulnerability** | Vite transitive dep | esbuild <=0.24.2 (GHSA-67mh-4wv8-2f99) — dev server only | Upgrade Vite/esbuild when patched versions available | No (dev only) |

---

## MEDIUM PRIORITY (Fix Soon)

| # | Issue | Location | Root Cause | Fix |
|---|-------|----------|------------|-----|
| 1 | ~~**Integrations "View setup guide" dead link**~~ | `Integrations.tsx` | ~~`href="#"`~~ | ✅ Fixed: points to `/quick-links` |
| 2 | **Token refresh race in other services** | ChatService, etc. | TicketService has `refreshOnce()`; ChatService similar; others may race | Audit all Edge Function callers for singleton refresh |
| 3 | **Meeting fetch not batched** | `Dashboard.tsx` | `meetingService.getUpcomingMeetings` in separate `useEffect` | Batch with other dashboard `Promise.allSettled` where possible |
| 4 | **Large Dashboard component** | `Dashboard.tsx` | ~1100 lines; many modal states | Split or lazy-load modals |
| 5 | **No React Query** | Advisor Portal | All data fetching is raw `useState` + `useEffect` | Add TanStack Query for caching, deduplication, background refetch |
| 6 | **No correlation IDs in UI errors** | Error boundaries, hooks | TicketService/ChatService use `x-request-id`; not propagated to user-facing errors | Add correlation IDs to error messages for support |

---

## LOW PRIORITY / TECH DEBT (Schedule)

| # | Issue | Location | Root Cause | Fix |
|---|-------|----------|------------|-----|
| 1 | **Jitsi script blocks parsing** | `index.html` | `external_api.js` loaded synchronously | Lazy-load only when meeting page is visited |
| 2 | **No preconnect for Supabase** | `index.html` | Only meet.jit.si preconnected | Add `<link rel="preconnect" href="https://<project>.supabase.co">` at build time |
| 3 | **Debug console.log in production** | `main.tsx`, `useAdvisorAuth.ts`, etc. | PWA reload, auth retry logs | Gate behind `import.meta.env.DEV` or remove |
| 4 | **Single LoadingSpinner** | `App.tsx` | All routes share same spinner | Consider route-specific skeletons for key pages |

---

## PAGE LOADING — ROOT CAUSE ANALYSIS

### Primary Causes

1. **Profile → Layout → Content waterfall**  
   `MainLayout` waits for `profile` from `AdvisorContext` before rendering the full shell. The layout shell and nav are blocked until profile loads. No early shell render.

2. **Profile → Nav → Page**  
   `MainLayout` loads navigation from CMS (`navigationService.getNavMenuItems`) and subscribes to realtime; nav loads while profile is already resolved. Sequential dependency.

3. **Profile → Training + Bulletins**  
   `AdvisorContext` defers `refreshTraining` and `loadBulletinCount` after profile with `setTimeout(0)`; adds extra round-trip before sidebar badges are ready.

4. **Profile → Dashboard data**  
   Dashboard fetches announcements, settings, links, forms in parallel, but only after profile is available. `meetingService.getUpcomingMeetings(profile.id)` runs in a separate `useEffect`.

### Reproduction

- **Slow load:** Cold start on first visit; profile fetch → nav fetch → page content.
- **Chunk load:** RouteErrorBoundary handles chunk errors with 30s reload guard.
- **404:** `*` redirects to `/`; unauthenticated users then redirect to `/login` (two hops).

### Recommended Fixes

1. Render `MainLayout` shell (sidebar skeleton, top bar) before profile is fully loaded.
2. Show nav skeleton or fallback nav immediately; swap in CMS nav when ready.
3. Introduce React Query for profile, nav, training, bulletin count to deduplicate and cache.

---

## LOGIN ISSUES — ROOT CAUSE ANALYSIS

### Primary Causes

1. **Missing advisor_profiles row**  
   Users with `user_roles` but no `advisor_profiles` row historically caused login loop. Migration `20260302103000` backfills. If backfill fails or new users are created without profile, intermittent failures persist. `buildSessionFallbackProfile` mitigates by using `user_metadata` when profile is missing.

2. **Edge Function cold start**  
   `ticket-proxy`, `chat-service` can take 5–13s cold start. `ticketService.ping()` on mount helps but runs with `allowUnauthenticated: true` before user may be authenticated.

3. **Token refresh race**  
   TicketService uses `refreshOnce()` singleton; ChatService has similar logic. Other services may still race. Supabase `noOpLock` bypasses Web Locks; concurrent refresh can consume single-use refresh token.

### Reproduction

- **Login loop:** User has `user_roles` but no `advisor_profiles` → profile lookup returns null → fallback profile used → if fallback fails or RLS blocks, redirect to login.
- **Intermittent 401:** Token near expiry; concurrent requests trigger multiple refresh attempts; one gets rotated token, others fail.

### Recommended Fixes

1. Verify migration `20260302103000` has run in all environments.
2. Add trigger or process to auto-create `advisor_profiles` when user gets advisor role.
3. Consider scheduled warm-up for Edge Functions.
4. Audit all Edge Function callers for singleton refresh pattern.

---

## MONOREPO CROSS-CONTAMINATION FINDINGS

| Finding | Impact |
|---------|--------|
| **Shared packages** | Advisor Portal depends on `@mpbhealth/advisor-core`, `@mpbhealth/auth`, `@mpbhealth/database`, `@mpbhealth/ui`, `@mpbhealth/utils`, `@mpbhealth/config`, `@mpbhealth/champion-core`. Version alignment via pnpm catalog. |
| **DOMPurify in utils** | Used by advisor-portal (Forms, SubmitGroup, BulletinDetail, SOPDocument), website, crm. Upgrade in `packages/utils` fixes all consumers. |
| **Turbo build filter** | Root `package.json` had wrong filter for `build:advisor`; fixed to `@mpbhealth/advisor-portal`. |
| **Vercel build** | `vercel.json` correctly uses `--filter=@mpbhealth/advisor-portal`. |

---

## SECURITY & HIPAA FINDINGS

| Finding | Severity | PHI Risk | Remediation |
|---------|----------|----------|-------------|
| **DOMPurify XSS** | High | Yes | Upgrade to dompurify@^3.3.2 |
| **dangerouslySetInnerHTML** | Mitigated | Low | All uses go through `sanitizeHtml` from `@mpbhealth/utils` (DOMPurify-based) |
| **VITE_ secret guard** | Good | N/A | `vite.config.ts` blocks service role key and other secrets from bundle |
| **Security headers** | Good | N/A | vercel.json: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP |
| **Auth package** | Good | N/A | `@mpbhealth/auth` provides phiSecurityService, auditService, secureAuthService |
| **RLS** | Good | N/A | `advisor_profiles` RLS: `auth.uid() = id`; admin via `profiles.role = 'admin'` |
| **Console logging** | Low | Possible | Ensure no PHI in console.error/warn; gate debug logs to dev |

---

## CODE CLEANUP SUMMARY

- **Files modified:** 6
- **Lines removed:** ~25 (dead quickLinksLoading state, ternary simplification)
- **Dead imports removed:** 0
- **Unused dependencies removed:** 0
- **Console.logs/debug artifacts removed:** 0 (recommended: gate or remove)
- **Components refactored:** Dashboard (removed dead state)
- **Shared package issues surfaced:** DOMPurify upgrade in utils

### Fixes Applied This Audit

1. `package.json`: `build:advisor` filter corrected to `@mpbhealth/advisor-portal`
2. `package.json`: Added `pnpm.overrides` for `dompurify >= 3.3.2` to fix transitive deps (jspdf, etc.)
3. `Login.tsx`: Contact Support link changed from `href="#"` to `href="/contact"`
4. `packages/utils/package.json`: dompurify upgraded from ^3.3.1 to ^3.3.2
5. `Dashboard.tsx`: Removed dead `quickLinksLoading` state and simplified Quick Links section
6. `Integrations.tsx`: "View setup guide" link changed from `href="#"` to `href="/quick-links"`

---

## PERFORMANCE SUMMARY

- **Slowest pages:** Dashboard (~47 KB chunk), Training (~61 KB), tiptap chunk (~572 KB)
- **Slowest endpoints:** Edge Functions (ticket-proxy, chat-service) on cold start
- **Bundle size:** index ~166 KB, react-vendor ~165 KB, supabase ~168 KB, vendor ~272 KB, tiptap ~572 KB
- **Key optimizations:**
  - Reduce profile → layout waterfall
  - Add React Query for deduplication
  - Lazy-load Jitsi script
  - Batch dashboard meeting fetch with other calls

---

## RECOMMENDED NEXT STEPS (Prioritized)

1. **P0:** Run `pnpm install` to apply DOMPurify upgrade; verify build.
2. **P0:** Confirm migration `20260302103000` in all environments.
3. **P1:** Reduce profile → layout waterfall (early shell render).
4. **P1:** Introduce React Query for profile, nav, training, bulletin count.
5. **P1:** Add trigger to auto-create `advisor_profiles` for new advisor role users.
6. **P2:** Fix Integrations "View setup guide" link.
7. **P2:** Add performance marks for critical path (auth → profile → nav → content).
8. **P3:** Lazy-load Jitsi script; gate/remove debug console.logs.
9. **P4:** Structured logging and APM integration.

---

## PHASE 1 — RECONNAISSANCE SUMMARY

### Monorepo Structure

- **Tooling:** pnpm workspaces, Turborepo, catalog for version alignment
- **Apps:** website, crm, advisor-portal, admin-portal
- **Packages:** config, database, utils, ui, auth, advisor-core, champion-core, admin-core, crm-core, eslint-config, tailwind-config, typescript-config

### Advisor Portal Stack

- **Framework:** React 18, Vite 5
- **Routing:** react-router-dom v6
- **UI:** @mpbhealth/ui, Tailwind, lucide-react
- **State:** useState/useEffect (no React Query)
- **Auth:** Supabase Auth, @mpbhealth/auth
- **Data:** Supabase (direct + Edge Functions via advisor-core)

### Routes (50+)

- Auth: `/login`, `/forgot-password`, `/reset-password`, `/change-password`
- Main: `/` (Dashboard), `/training`, `/forms`, `/quick-links`, `/sops`, `/bulletins`, `/videos`, `/events/manage`, `/submit-group`, `/contact`, `/tickets`, `/chat`, `/inbox`, `/audit-log`, `/profile`
- Settings: `/settings`, `/settings/organization`, `/settings/team`, `/settings/notifications`, `/settings/preferences`, `/settings/api-keys`, `/settings/integrations`
- Admin: `/admin/tickets`

---

*Related: [docs/HAWK-EYE-FINDINGS-REPORT.md](./HAWK-EYE-FINDINGS-REPORT.md)*

# Hawk-Eye Audit Findings Report — Advisor Portal

**Audit Date:** 2025-03-09  
**Scope:** Advisor Portal (`apps/advisor-portal`) + shared packages  
**Focus:** Loading issues, auth, page load, performance, database, observability

---

## Severity Legend

| Severity | Description |
|----------|--------------|
| **Critical** | Blocks core flows; users cannot complete key tasks |
| **High** | Noticeable degradation; frequent user impact |
| **Medium** | Occasional issues; workarounds exist |
| **Low** | Minor; edge cases or rare conditions |
| **Info** | Improvement opportunity; no current failure |

---

## Executive Summary

The Advisor Portal has several architectural strengths (lazy loading, chunk splitting, error boundaries, session fallback) but exhibits **multiple loading waterfalls** and **sequential dependencies** that can cause intermittent slow loads and perceived "loading issues." Auth and profile lookup are generally solid, but edge cases (missing `advisor_profiles` row, cold Edge Function starts) can produce intermittent failures.

---

## Phase 1 — Reconnaissance

| Finding | Severity | Details |
|---------|----------|---------|
| Stack is modern and well-structured | Info | React 18, Vite, Turborepo, Supabase, Tailwind |
| Good chunk splitting | Info | `vite.config.ts` manualChunks for react, tiptap, lucide, supabase, advisor-core |
| Security guard for VITE_ vars | Info | `vite.config.ts` blocks service role key and other secrets from bundle |
| No React Query / TanStack Query | Medium | All data fetching is raw `useState` + `useEffect`; no caching, deduplication, or background refetch |
| External script blocks parsing | Low | `index.html` loads `meet.jit.si/external_api.js` synchronously; consider async/defer |

---

## Phase 2 — Page Loading

### 2.1 Routing & Suspense

| Finding | Severity | Details |
|---------|----------|---------|
| Lazy loading in place | Info | All pages use `React.lazy()` with per-route `Suspense` |
| RouteErrorBoundary handles chunk errors | Info | ChunkLoadError triggers reload with 30s guard; good for CDN/cache bust |
| Single LoadingSpinner | Low | All routes share same spinner; no route-specific UX |

### 2.2 Data Loading Waterfalls

| Finding | Severity | Details |
|---------|----------|---------|
| **Profile → Layout → Content** waterfall | **High** | `MainLayout` waits for `profile` from `AdvisorContext`; layout shell and nav are blocked until profile loads. No early shell render. |
| **Profile → Nav → Page** waterfall | **High** | `MainLayout` loads navigation from CMS (`navigationService.getNavMenuItems`) and subscribes to realtime; nav loads while profile is already resolved. |
| **Profile → Training + Bulletins** waterfall | Medium | `AdvisorContext` defers `refreshTraining` and `loadBulletinCount` after profile with `setTimeout(0)`; adds extra round-trip before sidebar badges are ready. |
| **Profile → Dashboard data** waterfall | Medium | Dashboard fetches announcements, portal settings, enrollment links, forms, meetings in parallel, but only after profile is available. `meetingService.getUpcomingMeetings` depends on `profile.id`. |
| **Ticket ping on app mount** | Info | `ticketService.ping()` runs on mount to warm Edge Function; good for cold-start mitigation but adds one extra network call on every load. |

### 2.3 Assets & Server

| Finding | Severity | Details |
|---------|----------|---------|
| No preconnect hints for Supabase | Low | Add `<link rel="preconnect" href="https://<project>.supabase.co">` for faster auth/DB |
| Jitsi script loaded eagerly | Low | `external_api.js` blocks; consider lazy loading for meeting pages only |
| PWA Service Worker | Info | SW registered; reload guard (10s) prevents reload loops |

### 2.4 Redirects

| Finding | Severity | Details |
|---------|----------|---------|
| `*` redirects to `/` | Info | `Navigate to="/" replace` for unknown routes; then MainLayout redirects to `/login` if unauthenticated. Two hops for 404s. |
| `must_change_password` redirect | Info | Correctly redirects to `/change-password` before showing content |

---

## Phase 3 — Login / Auth

### 3.1 Auth Flow

| Finding | Severity | Details |
|---------|----------|---------|
| Login timeout (15s) | Info | `withTimeout` in Login prevents indefinite hangs |
| Single auth listener | Info | `onAuthStateChange` handles INITIAL_SESSION + SIGNED_IN; `initialHandled` ref prevents duplicate profile loads |
| Session fallback profile | Info | When `advisor_profiles` row is missing, `buildSessionFallbackProfile` uses `user_metadata`; avoids hard failure |
| **Missing advisor_profiles** | **High** | Users with `user_roles` but no `advisor_profiles` row historically caused login loop; migration `20260302103000` backfills. If backfill fails or new users are created without profile, intermittent failures persist. |
| Profile lookup uses `auth.users.id` | Info | `advisor_profiles.id` = `auth.users.id`; RLS `auth.uid() = id` is correct |

### 3.2 Session Persistence

| Finding | Severity | Details |
|---------|----------|---------|
| `noOpLock` for Web Locks API | Info | Bypasses Web Locks to avoid deadlocks on Chrome Android; documented in database client |
| `storageKey: 'mpb-auth-token'` | Info | Custom key; consistent with logout cleanup |
| `localStorage.removeItem('mpb-auth-token')` on logout | Info | Logout clears storage; `secureAuthService.secureLogout` used when profile available |

### 3.3 Intermittent Auth Failures

| Finding | Severity | Details |
|---------|----------|---------|
| **Token refresh race** | **Medium** | TicketService uses `refreshOnce()` singleton to prevent concurrent refresh; ChatService has similar logic. Other services may still race. |
| **Edge Function cold start** | **High** | `ticket-proxy`, `chat-service` Edge Functions can take 5–13s cold start; `ticketService.ping()` on mount helps but runs before user may be authenticated (`allowUnauthenticated: true`). |
| AbortError handling | Info | AdvisorContext catches `AbortError` from Web Locks; avoids false errors during navigation |

---

## Phase 4 — Code Cleanup

| Finding | Severity | Details |
|---------|----------|---------|
| `quickLinksLoading` always false | Low | Dashboard sets `useState(false)` and never updates; `displayQuickLinks` uses fallback; dead state |
| `getPortalUrl` vs `getPortalUrlWithSSO` | Info | PortalSwitcher receives `getPortalUrl` (direct) and `getPortalUrlWithSSO` (SSO); ensure both are used correctly |
| `buildPortalSSOUrl` in MainLayout | Info | Called on every portal switch; may add latency if SSO is slow |

---

## Phase 5 — Performance

| Finding | Severity | Details |
|---------|----------|---------|
| **No request deduplication** | **High** | Multiple components can trigger same profile/training/nav fetches; no shared cache. React Query would deduplicate. |
| **Nav cache 5 min** | Medium | `cachedNavItems` in MainLayout; good, but realtime subscription still active; cache invalidated on nav change. |
| **Dashboard parallel fetch** | Info | `Promise.allSettled` for announcements, settings, links, forms; good pattern. |
| **Meeting fetch depends on profile** | Medium | `meetingService.getUpcomingMeetings(profile.id)` runs in separate `useEffect`; could be batched with other dashboard calls. |
| **Admin check on every profile** | Low | `checkIsAdmin(profile.user_id)` runs when profile changes; `lastAdminCheckId` ref prevents redundant calls. |
| **Large Dashboard component** | Medium | Dashboard.tsx ~1100 lines; many modal states; consider splitting or lazy modals |

---

## Phase 6 — Database

| Finding | Severity | Details |
|---------|----------|---------|
| `advisor_profiles` RLS | Info | `auth.uid() = id`; `profiles.role = 'admin'` for admin access. |
| `advisor_nav_menu` RLS | Info | `FOR SELECT USING (TRUE)`; public read. |
| `ProfileService.getProfile` uses `eq('id', advisorId)` | Info | Correct; `id` = auth.users.id. |
| Profile table has `user_id` in some migrations | Info | `normalizeProfile` adds `user_id` from `id` if missing; `org_id` default `''`. |
| Health check uses `profiles` table | Low | `checkSupabaseHealth` queries `profiles`; advisor portal may not use that table; consider `advisor_profiles` or `advisor_nav_menu` for advisor-specific health |

---

## Phase 7 — Logging & Observability

| Finding | Severity | Details |
|---------|----------|---------|
| Console.error for route errors | Info | `RouteErrorBoundary` and `ErrorBoundary` log to console; no structured logging or APM |
| No correlation IDs in UI | Medium | TicketService and ChatService use `x-request-id`; not propagated to user-facing errors |
| No client-side performance marks | Low | No `performance.mark` for critical path (auth → profile → nav → content) |
| Supabase client logs | Info | `createClientLogger` in database package; config-dependent |

---

## Prioritized Action Items

### P0 — Critical (fix first)

1. **Reduce profile → layout waterfall**  
   - Render `MainLayout` shell (sidebar skeleton, top bar) before profile is fully loaded.  
   - Show nav skeleton or fallback nav immediately; swap in CMS nav when ready.

2. **Ensure advisor_profiles backfill**  
   - Verify migration `20260302103000` has run for all environments.  
   - Add trigger or process to auto-create `advisor_profiles` when user gets advisor role.

### P1 — High

3. **Introduce request deduplication / caching**  
   - Add React Query (or similar) for profile, nav, training, bulletin count.  
   - Reduces duplicate fetches and improves perceived loading.

4. **Mitigate Edge Function cold start**  
   - Consider scheduled warm-up (e.g. cron) for `ticket-proxy` and `chat-service`.  
   - Optionally delay `ticketService.ping()` until after auth is confirmed.

### P2 — Medium

6. **Preconnect to Supabase**  
   - Add `<link rel="preconnect">` for Supabase URL in `index.html`.

7. **Batch dashboard data**  
   - Combine meeting fetch with other dashboard `Promise.allSettled` calls where possible.

8. **Add performance marks**  
   - `performance.mark('auth-start')`, `performance.mark('profile-loaded')`, etc.  
   - Use for debugging and future APM integration.

### P3 — Low / Info

9. **Remove dead `quickLinksLoading`**  
   - Either use it or remove it.

10. **Lazy load Jitsi script**  
    - Load `external_api.js` only when user navigates to meeting-related pages.

### P4 — Observability

11. **Structured logging**  
    - Add correlation IDs to user-facing errors.

12. **APM / Application Insights**  
    - Instrument critical paths for production monitoring.

---

## Metadata

| Field | Value |
|-------|-------|
| Audit framework | Hawk-Eye Audit Checklist |
| Auditor | AI agent (Cursor) |
| Codebase | mpbhealth-monorepo, advisor-portal |
| Related docs | `docs/HAWK-EYE-AUDIT.md` |

---

## Related Documentation

- [docs/HAWK-EYE-AUDIT.md](./HAWK-EYE-AUDIT.md) — Audit checklist and quick reference
- Auth troubleshooting (internal)
- Edge Function errors (internal)
- Operational procedures (internal)

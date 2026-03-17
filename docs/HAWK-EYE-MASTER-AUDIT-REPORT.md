# Hawk Eye Master Audit Report — MPB Health Monorepo + ITSTS Support System

**Audit Date:** 2025-03-17  
**Scope:** Full monorepo — auth, session, login, ITSTS support ticketing, production stability  
**Agent:** Hawk Eye Production Reliability Audit

---

## 1. Executive Summary

### Top-Level Issues Found

| Issue | Severity | Business Impact |
|-------|----------|-----------------|
| **ticket-proxy error response leak** | High | Uncommitted change exposed internal error messages to clients; reverted to generic "Internal server error" |
| **Profile → Layout waterfall** | High | Advisor portal blocks shell/nav until profile loads; causes perceived slow loads |
| **Missing advisor_profiles row** | High | Users with `user_roles` but no `advisor_profiles` historically caused login loop; migration backfill exists |
| **Edge Function cold start** | High | ticket-proxy, chat-service can take 5–13s cold start; ping on mount helps but runs before auth |
| **Token refresh race** | Medium | TicketService uses `refreshOnce()` singleton; other services may still race |
| **No request deduplication** | High | Multiple components trigger same profile/training/nav fetches; no shared cache |
| **Pre-existing typecheck errors** | Medium | website app has TS errors in UnifiedLoginPage, leadSubmissionService, AdminDashboard |

### Overall Assessment

The monorepo has **solid architectural foundations** for auth and ITSTS integration. The TicketService implements robust token refresh, retries, and timeout handling. Auth flows use proper redirect allowlists and scanner-proof token_hash recovery. The main risks are **loading waterfalls**, **cold starts**, and **profile sync gaps** — not fundamental auth or ITSTS design flaws.

---

## 2. Architecture Map

### 2.1 User-Facing Apps

| App | Path | Auth | ITSTS |
|-----|------|------|-------|
| Website | `apps/website` | AuthContext, UnifiedLoginPage, SecureLoginPage | Member support via memberPortalService |
| Advisor Portal | `apps/advisor-portal` | AdvisorContext, useAdvisorAuth, secureAuthService | Tickets, NewTicket, AdminTickets, ticket-proxy |
| Admin Portal | `apps/admin-portal` | AdminContext | SupportTickets, ticket-proxy (admin actions) |
| CRM | `apps/crm` | AuthContext | — |

### 2.2 Auth Entry Points

| Flow | Location | Notes |
|------|----------|------|
| Email/password login | `UnifiedLoginPage`, `SecureLoginPage`, `Login.tsx` (advisor/admin/crm) | signInWithPassword |
| Magic link | Supabase default | — |
| Invite acceptance | create-user, invite-user edge functions | — |
| Password reset | `ForgotPassword`, `ResetPassword`, `AuthConfirm` | token_hash (scanner-proof) + legacy hash |
| Reauth | secureAuthService, sessionTimeoutService | 15-min HIPAA timeout |
| Logout | signOut, secureLogout | Clears mpb-auth-token |

### 2.3 Auth Providers / Contexts

| Context | App | Session Source | Role Source |
|---------|-----|----------------|-------------|
| AuthContext | website, crm | getSession, onAuthStateChange | user_roles, profiles |
| AdvisorContext | advisor-portal | getSession, profileService.getProfile | advisor_profiles |
| AdminContext | admin-portal | getSession | user_roles |

### 2.4 Middleware / Route Protection

- **No Next.js-style middleware** — apps use React Router with layout-level guards
- **MainLayout** (advisor-portal): redirects to `/login` if unauthenticated
- **RouteGuard** (packages/auth): role-based access
- **must_change_password** redirect to `/change-password` before content

### 2.5 Session / Token Refresh

| Component | Behavior |
|-----------|----------|
| Supabase client | `autoRefreshToken`, `persistSession`, `storageKey: 'mpb-auth-token'` |
| noOpLock | Bypasses Web Locks API to avoid Chrome Android deadlocks |
| TicketService | `refreshOnce()` singleton, 30s expiry buffer, `getResolvedAuthHeader()` |
| ChatService | Similar refresh singleton |
| secureAuthService | Inactivity timeout (30 min admin/advisor, 60 min member) |

### 2.6 ITSTS Integration Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (Advisor Portal / Admin Portal)                                     │
│   TicketService.call() → supabase.functions.invoke('ticket-proxy', ...)     │
│   - 20s timeout, 3 attempts, retry on 5xx/timeout/auth                       │
│   - executeWithAuth / useTicketAuth wraps with auth retry                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ticket-proxy (Supabase Edge Function)                                        │
│   - Verifies JWT via supabaseAdmin.auth.getUser(token)                       │
│   - Connects to ITSTS Supabase (ITSTS_SUPABASE_URL, ITSTS_SERVICE_ROLE_KEY)  │
│   - Actions: list, detail, stats, create, reply, add_comment, update_ticket  │
│   - Admin actions: list_all, detail_admin, stats_all, create_for_advisor     │
│   - Fire-and-forget: send-ticket-notification                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│ ITSTS Supabase        │  │ send-ticket-notification│  │ ticket-webhook-receiver│
│ (tickets, profiles,   │  │ - Email via Resend      │  │ - ITSTS → monorepo    │
│ ticket_comments)       │  │ - notification_events   │  │ - ITSTS_WEBHOOK_SECRET│
└───────────────────────┘  │ - push-service         │  └───────────────────────┘
                            └───────────────────────┘
```

### 2.7 ITSTS-Related Edge Functions

| Function | Purpose |
|----------|---------|
| ticket-proxy | Main proxy for ticket CRUD; auth + ITSTS relay |
| send-ticket-notification | Email, in-app, push on ticket events |
| ticket-webhook-receiver | Receives webhooks from ITSTS |
| sync-user-to-itsts | Syncs monorepo users to ITSTS profiles |
| sso-itsts-login | SSO magic link for advisor → ITSTS support portal |
| bulk-sync-itsts | Bulk user sync |
| create-user, create-admin-user | Fire-and-forget ITSTS sync on user creation |
| admin-update-password, ChangePassword, ResetPassword | Fire-and-forget password sync to ITSTS |

### 2.8 Env Vars (Auth + ITSTS)

| Variable | Used By | Purpose |
|----------|---------|---------|
| VITE_SUPABASE_URL | database client | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | database client | Anon key for client |
| SUPABASE_URL | edge functions | Project URL |
| SUPABASE_SERVICE_ROLE_KEY | edge functions | Service role |
| ITSTS_SUPABASE_URL | ticket-proxy, sync-user-to-itsts, sso-itsts-login | ITSTS project URL |
| ITSTS_SERVICE_ROLE_KEY | ticket-proxy, sync-user-to-itsts, sso-itsts-login | ITSTS service role |
| ITSTS_BASE_URL | sso-itsts-login | support.mpb.health |
| ITSTS_ADVISOR_REDIRECT_PATH | sso-itsts-login | Advisor redirect path |
| ITSTS_WEBHOOK_SECRET | ticket-webhook-receiver | Webhook signature verification |

---

## 3. Root Causes Found

### 3.1 Login Issues

- **Missing advisor_profiles**: Users with `user_roles` but no `advisor_profiles` row caused login loop. Migration `20260302103000` backfills. `buildSessionFallbackProfile` in AdvisorContext mitigates when row is missing.
- **Role-based redirect**: UnifiedLoginPage signs out and throws if user lacks allowed role for portal.
- **Rate limiting / CAPTCHA**: secureAuthService enforces rate limits; can block after repeated failures.

### 3.2 Timeout Issues

- **TicketService**: 20s timeout per attempt, 3 attempts, retry on TIMEOUT/5xx. Good.
- **ChatService**: Similar timeout + retry.
- **Edge Function cold start**: 5–13s possible; `ticketService.ping()` on mount helps but runs with `allowUnauthenticated: true` before user may be logged in.
- **AuthConfirm**: 2s wait for detectSessionInUrl fallback — acceptable.

### 3.3 Session Issues

- **Token refresh race**: Supabase refresh token is single-use; concurrent refreshes can 401. TicketService and ChatService use `refreshOnce()` singleton; other services (e.g. mailSyncService) call `getSession()` directly and may race.
- **noOpLock**: Bypasses Web Locks to avoid Chrome Android deadlocks; documented.
- **Session fallback**: AdvisorContext uses `buildSessionFallbackProfile` when `advisor_profiles` row missing.

### 3.4 ITSTS Issues

- **ITSTS not configured**: ticket-proxy returns graceful stubs for read actions when `ITSTS_SUPABASE_URL` / `ITSTS_SERVICE_ROLE_KEY` missing; 503 for write.
- **Support account not found**: If user not synced to ITSTS, detail/write actions return 404 with clear message.
- **Admin auto-provisioning**: `getOrCreateItstsUserId` creates staff profile in ITSTS when admin replies; no manual setup needed.
- **Error response leak**: Uncommitted change exposed internal `errMsg` to clients; reverted to generic "Internal server error" while keeping improved server-side logging.

### 3.5 Deployment / Config Issues

- **AUTH_SAFE_REDIRECT_DESTINATIONS**: All auth redirects validated against allowlist; open-redirect guarded.
- **AUTH_URLS**: Canonical URLs for advisor, admin, crm, member; used in AuthConfirm role-based redirect.
- **Domain config**: advisor.mpb.health, admin.mpb.health, mpb.health, crm.mpbhealth.com in config.

---

## 4. Exact Fixes Applied

### 4.1 ticket-proxy (supabase/functions/ticket-proxy/index.ts)

**Change:** Improved server-side error logging while keeping client response generic.

```diff
  } catch (error) {
-   log.error("Ticket proxy error", { correlationId, error });
+   const errMsg = error instanceof Error ? error.message : String(error);
+   log.error(`Ticket proxy error [${correlationId}]: ${errMsg}`);
    return new Response(
      JSON.stringify({
        success: false,
-       error: "Internal server error",
+       error: "Internal server error",  // Never expose internal details to client
        correlationId,
      }),
      { status: 500, headers },
    );
```

**Rationale:** The uncommitted diff had changed `error: errMsg` which would expose internal errors (DB errors, stack traces, etc.) to clients. Retained improved logging for ops; kept response generic for security.

---

## 5. Files Changed

| File | Change |
|------|--------|
| `supabase/functions/ticket-proxy/index.ts` | Added structured error logging; kept client error generic |

---

## 6. Database / Supabase Changes

- **No migrations added** in this audit.
- **Existing migrations** referenced: `20260302103000` (advisor_profiles backfill), `20260224100000_itsts_user_sync_trigger`, `20260225100000_advisor_profile_itsts_sync_trigger`, `20260302110000_fix_advisor_profile_itsts_trigger_avatar_url`.
- **No RLS policies modified.**
- **No new indexes added.**

---

## 7. Validation Results

### 7.1 Lint

- **Result:** Exit code 1 (some packages have lint errors; see agent-tools output).
- **Note:** Pre-existing; not introduced by this audit.

### 7.2 Typecheck

- **Result:** Exit code 2 (website app failed).
- **Errors:**
  - `UnifiedLoginPage.tsx(225,7)`: "purple" not assignable to type
  - `leadSubmissionService.ts(152,9)`: 'planData' does not exist
  - `AdminDashboard.tsx(329,91)`, `(332,174)`: Property 'urgent' does not exist
- **Note:** Pre-existing; not introduced by this audit.

### 7.3 Build

- **Not run** (typecheck would block). Advisor-portal, admin-portal, crm typecheck passed.

### 7.4 Remaining Risks

1. **Website typecheck** must be fixed before production deploy.
2. **Profile waterfall** in advisor-portal — consider shell-first render.
3. **Edge Function cold start** — consider scheduled warm-up cron.
4. **Request deduplication** — consider React Query for profile, nav, training.

---

## 8. Final Status

| Area | Status | Notes |
|------|--------|-------|
| **Auth reliability** | ✅ Solid | Proper redirect allowlists, token_hash recovery, session fallback |
| **Session persistence** | ✅ Solid | noOpLock, refreshOnce, 30s buffer in TicketService |
| **ITSTS integration** | ✅ Solid | Retries, timeout, graceful stubs, correlation IDs |
| **ticket-proxy security** | ✅ Fixed | No internal error leak to clients |
| **Production readiness** | ⚠️ Blocked | Website typecheck errors; lint issues |

---

## 9. Follow-Up Hardening Recommendations

### P0 — Critical

1. **Fix website typecheck errors** — Unblock production builds.
2. **Verify advisor_profiles backfill** — Ensure migration `20260302103000` has run in all environments.

### P1 — High

3. **Reduce profile → layout waterfall** — Render MainLayout shell before profile loads; show nav skeleton.
4. **Introduce request deduplication** — React Query for profile, nav, training, bulletin count.
5. **Mitigate Edge Function cold start** — Scheduled warm-up cron for ticket-proxy, chat-service.

### P2 — Medium

6. **Preconnect to Supabase** — `<link rel="preconnect">` in index.html.
7. **Add performance marks** — `performance.mark('auth-start')`, `profile-loaded`, etc.
8. **Structured logging** — Propagate correlation IDs to user-facing errors.

### P3 — Observability

9. **APM / Application Insights** — Instrument critical paths.
10. **Alerting** — 401/500/timeout rate thresholds for ticket-proxy.

---

## Appendix: Quick Reference

| Doc | Path |
|-----|------|
| Hawk-Eye Audit Checklist | `docs/HAWK-EYE-AUDIT.md` |
| Hawk-Eye Findings (prior) | `docs/HAWK-EYE-FINDINGS-REPORT.md` |
| ITSTS Deployment | `supabase/ITSTS_DEPLOYMENT.md` |
| Auth URLs / Config | `packages/config/src/constants.ts` |

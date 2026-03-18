# Audit Sub-Plan 2: Auth, Domain & Security

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Find and fix every auth redirect mismatch, domain inconsistency, CORS gap, CSP failure, middleware bug, session handling issue, and callback URL conflict across all MPB Health apps.

**Architecture:** Auth backed by `@mpbhealth/auth` package (Supabase JWT + custom roles). Each app has its own auth entry point. Password reset, SSO, and MFA flows span multiple apps and domains. CORS enforced in edge function `_shared/cors.ts`.

**Tech Stack:** Supabase Auth (GoTrue), `@mpbhealth/auth` package, `@mpbhealth/database` client, Supabase edge functions, Vercel headers, React Router v6 (all apps use Vite SPA routing).

---

## Domains

| App | Production Domain | Auth Callback Should Use |
|-----|------------------|--------------------------|
| Advisor Portal | `advisor.mpb.health` | `https://advisor.mpb.health/auth/callback` |
| Admin Portal | `admin.mpb.health` | `https://admin.mpb.health/auth/callback` |
| CRM | `crm.mpb.health` | `https://crm.mpb.health/auth/callback` |
| Website | `app.mpb.health` or `mpb.health` | `https://app.mpb.health/auth/callback` |
| ITSTS (internal) | Supabase dashboard only | n/a |

**Note:** `mpbhealth.com` domains exist in CORS allowlist for backwards-compat only — NEVER use in email links or redirects.

---

## Files in Scope

- `packages/auth/src/` — all auth service, hook, and component files
- `packages/config/src/` — domain constants, AUTH_URLS, PORTALS
- `apps/advisor-portal/src/contexts/AuthContext.tsx` (or equivalent)
- `apps/advisor-portal/src/App.tsx` — route/guard structure
- `apps/advisor-portal/src/pages/` — login, reset, callback pages
- `apps/admin-portal/src/` — same structure
- `apps/crm/src/` — same structure
- `apps/website/src/` — same structure
- `supabase/functions/_shared/cors.ts` — CORS allowlist
- `supabase/functions/_shared/security.ts` — JWT verification
- `supabase/AUTH_REDIRECT_URLS.md` — documented redirect config
- `apps/*/vercel.json` — CSP and security headers
- Edge functions: `advisor-forgot-password`, `admin-update-password`, `portal-sso`, `sso-itsts-login`

---

## Task 1: Audit Auth Redirect URLs

- [ ] **Step 1: Read AUTH_REDIRECT_URLS.md**

```bash
cat supabase/AUTH_REDIRECT_URLS.md
```

Note all redirect_to values documented.

- [ ] **Step 2: Search all code for hardcoded redirect_to values**

```bash
grep -r 'redirect_to\|redirectTo\|redirect_url' --include="*.ts" --include="*.tsx" apps/ packages/auth/src/ supabase/functions/
```

For each occurrence, verify:
1. Domain matches the correct app domain (not `mpbhealth.com`)
2. Path is a valid route in that app's router
3. Is not hardcoded to `localhost` (production breakage)
4. Is not pointing to a domain that belongs to a different app

- [ ] **Step 3: Search for localhost hardcodes**

```bash
grep -r 'localhost:5175\|localhost:5176\|localhost:5173' apps/ packages/ supabase/functions/ --include="*.ts" --include="*.tsx"
```

Any localhost in non-dev-specific code is a production bug. Fix by using `getPortalUrl()` from `@mpbhealth/config` or `import.meta.env.VITE_APP_URL`.

- [ ] **Step 4: Check password reset redirect**

```bash
grep -r 'resetPasswordForEmail\|forgotPassword\|reset.*password' --include="*.ts" --include="*.tsx" apps/ packages/ supabase/functions/
```

The `resetPasswordForEmail` call MUST have:
```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${PORTAL_URL}/auth/reset-password`
})
```

Where `PORTAL_URL` is the correct portal's domain. Verify the edge function `advisor-forgot-password` sends to `advisor.mpb.health`, not `mpbhealth.com` or a wrong domain.

- [ ] **Step 5: Fix any wrong redirect URLs**

In `@mpbhealth/config`, verify `AUTH_URLS` exports:
```typescript
export const AUTH_URLS = {
  advisor: {
    callback: 'https://advisor.mpb.health/auth/callback',
    resetPassword: 'https://advisor.mpb.health/auth/reset-password',
  },
  admin: {
    callback: 'https://admin.mpb.health/auth/callback',
    resetPassword: 'https://admin.mpb.health/auth/reset-password',
  },
  crm: {
    callback: 'https://crm.mpb.health/auth/callback',
    resetPassword: 'https://crm.mpb.health/auth/reset-password',
  },
}
```

Update any callers to use these constants instead of hardcoded strings.

- [ ] **Step 6: Update edge function `advisor-forgot-password`**

Read the function, verify it uses the correct redirect domain:
```bash
cat supabase/functions/advisor-forgot-password/index.ts
```

Fix if wrong, then redeploy if changed.

- [ ] **Step 7: Audit `admin-update-password` for must_change_password flag**

When an admin resets an advisor's password, the advisor should be forced to change it on next login. Verify the edge function sets the flag:

```bash
cat supabase/functions/admin-update-password/index.ts
```

It must call the `clear_must_change_password` RPC (or equivalent) with the flag set to `true` after resetting the password. If this step is missing, advisors will never be prompted to change their admin-assigned temporary passwords — a security gap.

Expected behavior:
```typescript
// After updating password...
await supabase.rpc('set_must_change_password', { target_user_id: userId, value: true })
```

If the flag-setting is missing, add it and redeploy `admin-update-password`.

- [ ] **Step 7: Commit**

```bash
git add packages/config/src/ supabase/functions/advisor-forgot-password/
git commit -m "fix(auth): align all password reset redirect URLs to correct portal domains"
```

---

## Task 2: Audit CORS Allowlist

- [ ] **Step 1: Read _shared/cors.ts**

```bash
cat supabase/functions/_shared/cors.ts
```

Check the allowlist includes:
- `https://advisor.mpb.health`
- `https://admin.mpb.health`
- `https://crm.mpb.health`
- `https://app.mpb.health`
- `https://mpb.health`
- Dynamic Vercel preview pattern (e.g., `*.vercel.app` or project-specific previews)
- Local dev origins (`http://localhost:5173`, `http://localhost:5175`, `http://localhost:5176`)

Does NOT need: `mpbhealth.com` (legacy compat only — check if removing it breaks anything)

- [ ] **Step 2: Test CORS against each production origin**

For each production origin, simulate a preflight:
```bash
curl -I -X OPTIONS https://dtmnkzllidaiqyheguhl.supabase.co/functions/v1/ticket-proxy \
  -H "Origin: https://advisor.mpb.health" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Expected: `Access-Control-Allow-Origin: https://advisor.mpb.health`
Failure: `Access-Control-Allow-Origin` missing or `*` (overly permissive).

- [ ] **Step 3: Check Vercel preview URL pattern**

Advisor portal Vercel project name determines the preview URL pattern. Verify the regex in `cors.ts` matches actual preview URLs:

```typescript
// Example pattern — verify this matches YOUR actual Vercel project
const VERCEL_PREVIEW_PATTERN = /^https:\/\/advisor-portal-[a-z0-9-]+-mpbhealth\.vercel\.app$/
```

Get actual preview URL pattern from Vercel deployment history if unclear.

- [ ] **Step 4: Fix allowlist gaps**

If an origin is missing, add it to the allowlist in `cors.ts`. Then redeploy ALL edge functions that import `_shared/cors.ts`:

```bash
# List all functions that import cors.ts
grep -r 'cors' supabase/functions/*/index.ts | grep -v _shared | cut -d: -f1
```

Redeploy each affected function.

- [ ] **Step 5: Check for wildcard CORS that should be restricted**

```bash
grep -r '"Access-Control-Allow-Origin": "\*"' supabase/functions/
```

Any edge function returning `*` for CORS when it handles authenticated requests is a security issue. Replace with origin validation via `cors.ts`.

- [ ] **Step 6: Commit cors.ts fix and list functions to redeploy**

```bash
git add supabase/functions/_shared/cors.ts
git commit -m "fix(security): update CORS allowlist to include all active portal domains and preview patterns"
```

---

## Task 3: Audit Auth Middleware / Route Guards

- [ ] **Step 1: Find all route guard implementations**

```bash
grep -r 'ProtectedRoute\|RouteGuard\|useAuth\|isAuthenticated\|requireAuth' --include="*.tsx" apps/
```

For each app, map the route protection pattern:
- Which routes are protected?
- Which are public (login, reset-password, forgot-password, callback)?
- Is `/auth/callback` UNPROTECTED? (It must be — if it's behind a guard, Supabase redirects fail)

- [ ] **Step 2: Verify /auth/callback is public in all apps**

```bash
grep -r 'callback\|/auth/callback\|auth\/callback' --include="*.tsx" apps/*/src/App.tsx apps/*/src/routes*
```

The callback route must NOT be wrapped in `<ProtectedRoute>`. Verify for all 4 apps.

- [ ] **Step 3: Check session refresh logic**

In `@mpbhealth/database`, find `refreshSessionOnce` and `invokeWithResolvedAuth`:

```bash
cat packages/database/src/auth/helper.ts 2>/dev/null || grep -r 'refreshSessionOnce' packages/database/src/
```

Verify:
1. Session refresh is called before any authenticated fetch
2. There is a timeout (not infinite retry)
3. On failure, user is redirected to login (not stuck in spinner — recurring complaint)

- [ ] **Step 4: Fix stuck/spinner issue from auth race conditions**

Per existing feedback: ticket pages get stuck in infinite spinner due to auth race conditions. Check advisor portal's ticket list and ticket detail pages:

```bash
cat apps/advisor-portal/src/pages/TicketList.tsx 2>/dev/null
cat apps/advisor-portal/src/pages/TicketDetail.tsx 2>/dev/null
```

Ensure every async auth+fetch sequence has:
```typescript
// Add timeout to any session-dependent fetch
const timeout = setTimeout(() => {
  if (isLoading) {
    setError('Request timed out. Please refresh.')
  }
}, 10000)
```

And never use `supabase.functions.invoke()` on unauthenticated pages (per existing memory feedback).

- [ ] **Step 5: Audit session timeout behavior across apps**

```bash
grep -r 'useSessionTimeout\|sessionTimeout\|SESSION_TIMEOUT' --include="*.ts" --include="*.tsx" apps/ packages/auth/src/
```

Verify:
1. Timeout is consistent (same value) across all apps
2. On timeout, user is redirected to login (not just local state cleared)
3. Supabase refresh token is invalidated on logout

- [ ] **Step 6: Check must_change_password redirect flow**

Per memory: `clear_must_change_password` RPC was added. The advisor portal has two related pages: `ChangePassword.tsx` AND `ResetPassword.tsx` — both must be audited.

```bash
grep -r 'must_change_password\|mustChangePassword' --include="*.ts" --include="*.tsx" apps/ packages/
```

Then read both pages explicitly:
```bash
cat apps/advisor-portal/src/pages/ChangePassword.tsx
cat apps/advisor-portal/src/pages/ResetPassword.tsx
```

Trace the full chain:
1. On login, check `must_change_password` flag from profile
2. Redirect to the correct page (is it `ChangePassword.tsx` or `ResetPassword.tsx`?)
3. That page must call `clear_must_change_password` RPC on success
4. Then redirect to dashboard

**Common failure mode:** The redirect points to one route, but the `clear_must_change_password` RPC call lives in the OTHER file, so the flag is never cleared. Verify the matching is correct.

If any step is missing or the redirect is to the wrong page → user stuck in a redirect loop or flag never cleared.

- [ ] **Step 7: Commit**

```bash
git add apps/ packages/auth/src/
git commit -m "fix(auth): harden route guards, session timeout, and must_change_password flow"
```

---

## Task 4: Audit SSO & Cross-System Auth

- [ ] **Step 1: Read SSO edge functions**

```bash
cat supabase/functions/portal-sso/index.ts
cat supabase/functions/sso-itsts-login/index.ts
cat supabase/functions/sync-user-to-itsts/index.ts
```

For each, verify:
1. JWT is verified against the correct project (`dtmnkzllidaiqyheguhl`)
2. ITSTS credentials are passed via env vars, not hardcoded
3. Redirect after SSO goes to the correct portal domain
4. Error responses return proper JSON with status codes (not bare strings)

- [ ] **Step 2: Verify ITSTS sync integration**

```bash
cat supabase/functions/_shared/itsts-sync.ts
```

Check:
1. `syncUserToITSTS` handles network errors gracefully (ITSTS down ≠ auth failure)
2. User data written to ITSTS matches the schema in `hhikjgrttgnvojtunmla`
3. `agent_id` is correctly fetched from ITSTS `profiles.agent_id` before ticket creation

- [ ] **Step 3: Check for ghost sessions across subdomains**

Supabase sessions are stored in localStorage per origin. An advisor logged into `advisor.mpb.health` has a DIFFERENT session storage from `admin.mpb.health`. Verify:

1. No code assumes a shared session across subdomains
2. `@mpbhealth/auth` uses `storage_key` scoped to the app name (avoids collisions)

```bash
grep -r 'storage_key\|storageKey\|localStorage.*supabase' packages/database/src/ packages/auth/src/
```

- [ ] **Step 4: Fix session storage key scoping**

If all apps use the same default key (`sb-dtmnkzllidaiqyheguhl-auth-token`), a user logged out of one app may have stale sessions from another app "leak" in. Add app-specific storage keys:

In each app's Supabase client initialization:
```typescript
createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'mpbh-advisor-auth', // unique per app
  }
})
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/ packages/database/src/ apps/*/src/
git commit -m "fix(auth): scope session storage keys per app and harden SSO flows"
```

---

## Task 5: Audit CSP Headers for Auth Flows

- [ ] **Step 1: Check each app's CSP form-action directive**

Password reset and OAuth flows require `form-action` to allow Supabase auth endpoints:

```bash
grep -r 'Content-Security-Policy' apps/*/vercel.json vercel.json
```

Verify `form-action` allows:
- `'self'`
- `https://*.supabase.co` (for auth form submissions)

- [ ] **Step 2: Check frame-ancestors for embedded widgets**

If any app allows iFrame embedding (unlikely given DENY), verify. Otherwise confirm `frame-ancestors 'none'` is set.

- [ ] **Step 3: Check connect-src for Supabase realtime**

Realtime WebSocket connections require `wss://` in CSP:

```
connect-src 'self' https://*.supabase.co wss://*.supabase.co
```

Missing `wss://` = realtime subscriptions silently fail (notification system breaks).

- [ ] **Step 4: Fix CSP in all vercel.json files**

For each app, ensure the CSP header includes:
```
connect-src 'self'
  https://dtmnkzllidaiqyheguhl.supabase.co
  wss://dtmnkzllidaiqyheguhl.supabase.co
  https://hhikjgrttgnvojtunmla.supabase.co
  https://vitals.vercel-insights.com;
```

- [ ] **Step 5: Commit**

```bash
git add apps/*/vercel.json vercel.json
git commit -m "fix(security): add wss:// Supabase realtime to CSP connect-src in all apps"
```

---

## Validation

- [ ] Test advisor password reset end-to-end: request → email → link → change → redirect to dashboard
- [ ] Test advisor login → dashboard (no spinner, no stuck state)
- [ ] Test `must_change_password` flow: login → redirect to change-password → change → dashboard
- [ ] CORS preflight check: `curl -I -X OPTIONS <edge-function-url> -H "Origin: https://advisor.mpb.health"`
- [ ] Realtime test: open advisor notification panel, trigger a ticket reply from admin, verify it appears without page refresh
- [ ] Test logout clears session and redirects to login
- [ ] Verify no console errors about CSP violations in browser devtools

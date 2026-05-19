# Advisor Portal — PWA / Service Worker Audit

**Scope:** `advisor.mpb.health` console reports (May 2026)  
**Goal:** Prevent `/submit-group` (and other SPA routes) returning **503 Offline** from the service worker, and reduce misleading PWA console noise.

---

## Console messages reviewed

| Message | Severity | Root cause | Action |
|---------|----------|------------|--------|
| `[SW] Service worker loaded` | Info | `sw.js` logs on every SW activation | Benign; SW required for PWA |
| `[PWA] Service Worker registered: …` | Info | `registerServiceWorker.ts` after `register('/sw.js')` | Log gated to **dev** only |
| `Banner not shown: beforeinstallprompt… preventDefault()` | Warning | Chrome when `preventDefault()` is called without an immediate `prompt()` | **Fixed:** only `preventDefault()` when install banner is eligible (not dismissed / not installed / not standalone) |
| `Failed to load resource: /submit-group` **503** | **Error** | SW `networkWithCacheFallback` handled some SPA GETs; on network failure returned `503 Offline` instead of `index.html` | **Fixed** (see below) |

---

## Root cause: `/submit-group` 503

The advisor app is a **Vite SPA**. All routes (`/submit-group`, `/sops/…`, etc.) are served by Vercel as `index.html` via `vercel.json` rewrites.

The service worker (`apps/advisor-portal/public/sw.js`) intercepts GET requests. Previously:

1. Only `request.mode === 'navigate'` used `navigationStrategy` (SPA shell fallback).
2. Other GETs to paths like `/submit-group` (prefetch, prerender, or edge cases) used `networkWithCacheFallback`.
3. On timeout or offline, that strategy returned **`new Response('Offline', { status: 503 })`** with no `index.html` fallback.

Users saw a red **503** in DevTools for `/submit-group` even though the app could have loaded from cache.

### Fixes applied (cache v14)

1. **`isSpaDocumentRequest()`** — Treat same-origin paths without a static file extension as SPA document loads (not only `navigate` mode).
2. **`navigationStrategy()`** — On any non-OK origin response or network error, fall back to cached `/index.html` or a **fresh** `/index.html` fetch before returning 503.
3. **`CACHE_VERSION` bumped to 14** — Forces clients to drop stale SW/caches on next visit.

---

## PWA install banner

Custom install UI (`PWAInstallPrompt` + `usePWA`) intentionally defers `prompt()` until the user chooses **Install** (after ~30s). Calling `preventDefault()` on `beforeinstallprompt` is required to suppress Chrome’s default mini-infobar.

If the user has dismissed install or already uses standalone mode, we **no longer** call `preventDefault()`, which avoids the Chrome “Banner not shown…” warning in those cases.

---

## Prevention checklist (deploy / QA)

After each advisor-portal deploy:

1. **Hard refresh** on production → Application → Service Workers → confirm `sw.js` cache version **v14+**.
2. Open **`/submit-group`** directly in a new tab → must load (no 503).
3. Open **`/sops/advisor-toolkit`** (nested SPA route) → must load.
4. DevTools → Network → document request for `/submit-group` → status **200** (from network or SW shell).
5. Optional offline test: load app once online, go offline, navigate to `/submit-group` → should show app shell or `offline.html`, not bare `503`.
6. PWA: if install was dismissed, console should **not** spam install-banner warnings on every page.

---

## Files

| File | Role |
|------|------|
| `apps/advisor-portal/public/sw.js` | Fetch routing, SPA fallback, cache version |
| `apps/advisor-portal/src/registerServiceWorker.ts` | Register SW in prod only |
| `apps/advisor-portal/src/hooks/usePWA.ts` | Install prompt + `beforeinstallprompt` |
| `apps/advisor-portal/src/components/pwa/PWAInstallPrompt.tsx` | Custom install / update / offline UI |
| `apps/advisor-portal/vercel.json` | SPA rewrites to `index.html` |

---

## Not in scope (separate issues)

- **Supabase / edge 503** on API calls (`/rest/v1/…`) — handled per-service with retries; distinct from document `/submit-group` 503.
- **Cognito embed** on Submit Group page — third-party; failures show in Network tab as cognitoforms.com, not `/submit-group`.

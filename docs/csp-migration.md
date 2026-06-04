# CSP hardening — removing `script-src 'unsafe-inline'`

**Goal:** remove `'unsafe-inline'` from the `script-src` directive across all apps so an injected inline `<script>` can no longer execute (CSP becomes a real XSS backstop). Inline scripts we *do* ship are allowed by **SHA-256 hash** instead.

**Status: Phase 2 (ENFORCED) — this branch.** `'unsafe-inline'` has been removed from the enforced `script-src` (and `script-src-elem`) for **all apps** — crm, advisor-portal, staff-hub, admin-portal, website, **and concierge-portal** — with the validated inline-script hashes in place; the Report-Only header is removed. Validated two ways before enforcing: (1) every inline script in each app's built `dist/index.html` matches a CSP hash, and (2) the Phase 1 Report-Only preview console was confirmed clean of `script-src` violations.

**concierge-portal is now enforced too** — its preview-console was verified clean across all directives (2026-06-04) and its audited policy moved from Report-Only into the enforced CSP unchanged.

### concierge-portal CSP audit (2026-06-04)
Audited every external origin concierge actually uses. Result: **the cloned-from-staff-hub policy is correct and complete — no edits needed.** Findings:
- **connect-src:** Supabase only — REST + Edge Functions (`advisor-forgot-password`) + realtime `wss://` (App.tsx subscriptions). Covered by `*.supabase.co` + `wss://*.supabase.co`. No other API base (`.env.example` has only `VITE_SUPABASE_URL`).
- **frame-src:** no iframes/embeds anywhere — `'self'` (+ harmless vercel.live) is sufficient.
- **script-src:** only the theme-bootstrap inline script (hash `HSOW…`, build-validated) — no external script hosts in `index.html`.
- **style-src/font-src:** Google Fonts (`fonts.googleapis.com`/`gstatic`) are pulled only by the shared `@mpbhealth/ui` ARYX auth shell on-demand — already allow-listed.
- `app.mpb.health` is a top-level nav `<a>` (not `connect-src`); `frame-ancestors 'none'` is correct (standalone portal).

**Conclusion:** concierge is safe to enforce with its current Report-Only policy unchanged, after the same preview-console gate as the other apps (checking all directives, since concierge's runtime was not validated during Phase 2).

_The sections below describe the Phase 1 (Report-Only) mechanism; Phase 2 keeps the same validated hashes but moves them from the Report-Only header into the enforced `Content-Security-Policy`._

## What this PR does
For every app it adds a **`Content-Security-Policy-Report-Only`** header alongside the existing **`Content-Security-Policy`**:
- The enforced CSP is **unchanged** (still `script-src 'self' 'unsafe-inline' …`) — so production behavior is identical.
- The Report-Only CSP has `script-src` (and `script-src-elem` where present) with **`'unsafe-inline'` removed** and the **hashes of our real inline scripts added**. The browser *reports* violations of this policy to the console but does **not** block anything.
- `style-src 'unsafe-inline'` is intentionally **kept** (Tailwind / inline styles); tightening styles is out of scope for this pass.

### Inline-script hashes (computed from each app's `index.html`)
| App | Inline scripts hashed |
|---|---|
| crm, advisor-portal, staff-hub, concierge-portal | theme-bootstrap (`mpb-theme`) |
| admin-portal | theme-bootstrap + `gtag` init + chunk-reload handler |
| website | `$zoho` init + third-party loader (+ 3 JSON-LD data blocks) |

`concierge-portal` had **no CSP at all** — its Report-Only policy is **cloned from staff-hub** as a starting baseline. Validate its `connect-src`/`frame-src` against concierge's actual needs before enforcing.

## ⚠️ Important caveat — hashes are computed from source
The hashes are SHA-256 of the inline-script text **as written in `index.html`**. If the build (Vite/HTML processing) changes the inline-script bytes (whitespace, minification), the **served** hash will differ and the Report-Only policy will log a violation. That is exactly what Report-Only is for: it surfaces the mismatch **without breaking anything**.

## Phase 2 — enforce (separate PR, after validation)
1. Deploy this PR to a **preview**. Open each app and watch DevTools **Console** for
   `[Report Only] Refused to execute inline script … Content-Security-Policy-Report-Only` messages.
2. For any reported inline script, copy the **hash from the report** (the browser prints the expected `sha256-…`) into the policy. Re-deploy until the Report-Only console is **clean** for `script-src`.
3. Then copy the validated Report-Only `script-src` into the enforced **`Content-Security-Policy`** (dropping `'unsafe-inline'`) and **delete** the `Content-Security-Policy-Report-Only` header.
4. (Optional, recommended) Add a `report-to` / `report-uri` endpoint (Vercel/Sentry CSP reporting) so violations are collected automatically instead of via manual console checks.

## Why not nonces?
These are statically-hosted Vite SPAs (CSP set as a static header in `vercel.json`). Per-request nonces require server-side HTML injection, which static hosting doesn't do. **Hashes** are the correct mechanism for static inline scripts.

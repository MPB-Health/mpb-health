# CSP hardening — removing `script-src 'unsafe-inline'`

**Goal:** remove `'unsafe-inline'` from the `script-src` directive across all apps so an injected inline `<script>` can no longer execute (CSP becomes a real XSS backstop). Inline scripts we *do* ship are allowed by **SHA-256 hash** instead.

**Status: Phase 1 (Report-Only) — this PR.** No runtime behavior changes; nothing is blocked yet.

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

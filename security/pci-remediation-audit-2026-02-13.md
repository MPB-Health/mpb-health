# PCI Remediation Audit - 2026-02-13

## Scope
- Target host: `mpb.health` (current deployment on A2 VPS).
- Goal: remediate fail-driving PCI findings in repo-controlled code/config and separate infra/vendor tasks.

## Finding-to-Owner Mapping

| Finding | Severity | Owner | Status | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| `X-XSS-Protection Header` (deprecated value) | Medium | Code + Deployment Config | Remediated in repo | Response header is absent or explicitly `X-XSS-Protection: 0` across public routes. |
| `Misconfigured HTTP Caching` (deprecated pragma pattern) | Medium | Code + Deployment Config | Remediated in repo | HTML responses use modern `Cache-Control`/`Expires`; deprecated `Pragma` not emitted by app config. |
| `Information leakage via HTML/JavaScript comments` (Cognito-hosted script) | Medium | Code + Vendor | Mitigated in repo | Public pages no longer inject Cognito script embeds (`seamless.js`/`iframe.js`) from app code. Remaining vendor-side scripts must be reviewed by Cognito. |
| `SSL Certificate is Not Trusted (External Scan)` on `:3343` | High | Infrastructure | Open | Service on `:3343` is disabled, firewalled, or served with valid certificate chain matching host/SAN. |
| `SSL Certificate Common Name Does Not Validate` on `:3343` | Medium | Infrastructure | Open | Certificate CN/SAN matches target hostname(s), or port is removed from exposure. |
| `UDP Source Port Pass Firewall` | Medium | Infrastructure/Network | Open | Edge firewall blocks unexpected UDP source-port behavior per scanner recommendation. |

## Repo Changes Applied
- Hardened Apache config in `apps/website/.htaccess`:
  - Removed `Pragma` cache header directives.
  - Set `X-XSS-Protection` to `0`.
  - Removed Cognito script domains and `unsafe-eval` from CSP script policy.
- Updated website Vercel headers in `apps/website/vercel.json`:
  - Removed `unsafe-eval` and Cognito script/style/font/connect sources from CSP.
  - Added `X-XSS-Protection: 0` for parity with A2 remediation intent.
- Added root Vercel security headers in `vercel.json` for migration readiness.
- Updated `apps/website/index.html` CSP meta to remove `unsafe-eval` and Cognito script/style/font/connect allowances.
- Refactored Cognito embeds to iframe-only:
  - `apps/website/src/config/forms.config.ts`
  - `apps/website/src/components/forms/FormEmbed.tsx`
  - `apps/website/src/pages/GetAQuote.tsx`
  - legacy form pages in `apps/website/src/pages/*` no longer inject `iframe.js`.
- Removed residual script-based embed references:
  - `apps/website/src/lib/cognitoFormsService.ts` (script injection path deprecated/no-op)
  - `apps/website/src/pages/admin/FormsManager.tsx` placeholder now iframe-only example.

## Deployment Verification Checklist
- `X-XSS-Protection` header check:
  - Expect `0` or absent on `https://mpb.health/` and `https://mpb.health:5443/`.
- Cache header check for HTML:
  - Expect `Cache-Control: no-cache, no-store, must-revalidate` and no `Pragma`.
- CSP check:
  - Ensure no `unsafe-eval` in `script-src`.
  - Ensure Cognito script hosts are not required by public pages after iframe-only migration.
- Route spot checks:
  - `/`, `/get-a-quote`, `/employee-removal`, `/list-bill-setup`, `/refer-a-friend`.

## Pre-Deploy Live Header Snapshot (2026-02-13)
- Checked `https://mpb.health/`, `https://mpb.health:5443/`, and `https://mpb.health:5443/get-a-quote`.
- Current live still reports:
  - `x-xss-protection: 1; mode=block`
  - `pragma: no-cache`
  - CSP still includes `unsafe-eval` and Cognito script domains.
- Interpretation: scan-observed behavior matches current production prior to deploying this package.

## Deployment Artifact
- A2 dist-root package: `security/deploy-packages/mpbhealth-website-a2-20260213-141039.zip`
- Layout verified:
  - web root files at archive root
  - single `.htaccess` in archive root

## Remaining Non-Code Actions
1. Close or remediate TLS service on `:3343` with host-valid certificate.
2. Apply firewall controls for UDP source-port finding.
3. Open vendor ticket with Cognito Forms referencing scanner evidence for comment leakage in third-party asset.

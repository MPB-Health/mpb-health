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

### Finding 1 & 2: TLS Certificate Mismatch on :3343 (HIGH) + SSL CN Mismatch (MEDIUM)

**Root cause:** PCI scanner resolved `mpb.health` to old QUIC Cloud CDN edge IP `45.63.67.181`.
That edge node serves a `*.quic.cloud` wildcard certificate on ports 3343 and 3443, which does
not match `mpb.health`. Current DNS points to A2 VPS IP `209.208.26.218` where port 3343 is
already closed.

**Remediation options (pick one):**

| Option | Action | Where |
| --- | --- | --- |
| A (recommended) | Disable QUIC Cloud CDN in A2 cPanel / LiteSpeed admin | A2 Hosting cPanel > LiteSpeed Cache > CDN |
| B | Contact QUIC Cloud support to issue proper cert or close 3343/3443 | QUIC Cloud support ticket |
| C | Ensure DNS stays on current A2 IP (or Vercel after migration) and request PCI re-scan | DNS provider + Sysnet re-scan |

**Verification after fix:**
```
curl -kIv --resolve "mpb.health:3343:45.63.67.181" "https://mpb.health:3343/"
# Should get "Connection refused" or timeout
```

### Finding 3: UDP Source Port Pass Firewall (MEDIUM)

**Root cause:** Scanner detected UDP packets passing through firewall on QUIC Cloud edge IP
`45.63.67.181`. This is a CDN/hosting-level firewall issue.

**Remediation:**
- Disabling QUIC Cloud (Option A above) eliminates this finding.
- If keeping QUIC Cloud: open A2 Hosting support ticket requesting edge firewall hardening.
- After Vercel migration: finding disappears as old IP leaves scope.

### Finding 4: Information Leakage via Cognito JS Comments (MEDIUM)

**Root cause:** Scanner crawled `https://static.cognitoforms.com/form/modern/159.bfdfdfe1779a5668c6d7.js`
(loaded from Cognito Forms embed) and found debug comments from a Microsoft Ajax compatibility shim.
This is third-party hosted code outside our control.

**What was already done:**
- All Cognito embeds converted from script-based (`seamless.js`/`iframe.js`) to pure iframe embeds.
- CSP no longer allows Cognito script domains in `script-src`.
- Pages no longer directly load Cognito JS into page context.

**Remediation after deploy:**
1. Deploy the updated ZIP to A2 VPS and request PCI re-scan.
2. If scanner still flags (by crawling inside iframe):
   - File PCI dispute/exception with Sysnet noting:
     - JS file is on third-party domain (`static.cognitoforms.com`), outside our control.
     - Loaded only via sandboxed iframe, not as first-party script.
     - "debug" comment is in Microsoft Ajax compatibility shim, contains no sensitive data.
   - Open ticket with Cognito Forms requesting they strip source comments from production JS.

### Summary Action Checklist

- [ ] Log into A2 cPanel and disable QUIC Cloud CDN
- [ ] Verify port 3343 no longer responds on old IP
- [ ] Deploy `security/deploy-packages/mpbhealth-website-a2-20260213-141039.zip` to A2 web root
- [ ] Verify new headers with `curl -I https://mpb.health/`
- [ ] Request PCI re-scan from Sysnet
- [ ] If Cognito comment finding persists: file dispute with Sysnet + ticket with Cognito Forms
- [ ] Next week: migrate DNS to Vercel, all QUIC Cloud findings become moot

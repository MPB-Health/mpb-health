# Security Posture Audit — SOC 2 & HIPAA Compliance

**Date:** July 2026  
**Scope:** mpbhealth-monorepo (apps, packages, supabase, CI/CD, infrastructure config)  
**Auditor:** Automated code-level review  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Security Measures](#2-current-security-measures-already-in-place)
3. [Critical Vulnerabilities](#3-critical-vulnerabilities-found)
4. [Missing SOC 2 Controls](#4-missing-soc-2-controls)
5. [Missing HIPAA Safeguards](#5-missing-hipaa-safeguards)
6. [Recommendations with File Paths](#6-specific-recommendations-with-file-paths)
7. [Risk Matrix](#7-risk-matrix-summary)

---

## 1. Executive Summary

The monorepo demonstrates a **strong security foundation** with HIPAA-oriented controls that exceed what most early-stage health-tech platforms implement. Multi-factor authentication, rate limiting, session timeout, audit logging with hash-chain integrity, PHI access logging with 7-year retention, DOMPurify-based sanitization, and comprehensive security headers are all present. A CI security pipeline (gitleaks + `pnpm audit`) is in place.

However, several **gaps** remain that would be flagged in a formal SOC 2 Type II or HIPAA audit:

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 7 |
| Medium | 9 |
| Low / Informational | 6 |

The two critical items are (a) the `email-tracking` edge function's open redirect and (b) the absence of documented encryption-at-rest controls for PHI columns beyond Supabase's default disk encryption.

---

## 2. Current Security Measures Already in Place

### 2.1 Authentication & Session Management ✅

| Control | Implementation | File(s) |
|---------|---------------|---------|
| **Multi-Factor Authentication** | TOTP enrollment, backup codes (10), trusted devices (30 days) | `packages/auth/src/services/mfaService.ts` |
| **Rate Limiting** | 5 attempts/email, 10/IP, 15-min lockout, progressive delays (0→300 s) | `packages/auth/src/services/rateLimitService.ts` |
| **CAPTCHA** | Cloudflare Turnstile required after 3 failures | `packages/auth/src/services/rateLimitService.ts`, `supabase/functions/verify-captcha/` |
| **Password Policy** | Min 12 chars, max 128, upper/lower/digit/special, 8 unique chars, keyboard pattern detection, common-word blacklist, user-info check | `packages/auth/src/services/passwordSecurityService.ts` |
| **Password History** | Last 5 passwords cannot be reused, 90-day max age | `packages/auth/src/services/passwordSecurityService.ts` |
| **Session Timeout** | HIPAA-compliant 15-minute inactivity timeout with 2-minute warning | `packages/auth/src/services/sessionTimeoutService.ts` |
| **Refresh Token Rotation** | Enabled in Supabase config, 10 s reuse interval | `supabase/config.toml` (line ~147) |
| **JWT Expiry** | 3600 seconds (1 hour) | `supabase/config.toml` |

### 2.2 Authorization & Access Control ✅

| Control | Implementation | File(s) |
|---------|---------------|---------|
| **Role-Based Access Control** | 5 roles: super_admin, admin, advisor, member, crm_user | `packages/auth/src/services/userRolesService.ts` |
| **Granular Permissions** | `permissions` + `role_permissions` tables, permission cache (2-min TTL) | `packages/auth/src/services/permissionService.ts` |
| **Route Guards** | `RouteGuard` component checks roles; redirects to `/forbidden` | `packages/auth/src/components/RouteGuard.tsx` |
| **Row-Level Security** | RLS enabled on all user-facing tables with `auth.uid()` checks | Multiple migration files |
| **Multi-tenancy** | `orgs`, `org_memberships` with org-scoped RLS policies | `supabase/migrations/20260128000000_phase0_security_hardening.sql` |
| **Edge Function Auth** | Admin functions (create-user, admin-toggle-role) verify JWT + super_admin role | `supabase/functions/create-user/`, `admin-toggle-role/` |

### 2.3 Audit Logging & Monitoring ✅

| Control | Implementation | File(s) |
|---------|---------------|---------|
| **Security Event Logging** | Login successes/failures, MFA events, password changes, account locks, PHI access, suspicious activity, admin actions | `packages/auth/src/services/securityEventService.ts` |
| **Hash-Chain Integrity** | SHA-256 chain on `auth_security_events` for tamper detection | `packages/auth/src/services/securityEventService.ts` |
| **Business Audit Trail** | Org-scoped `audit_events`: before/after JSON diffs, actor metadata (user_id, email, role, IP, user-agent, request_id) | `packages/auth/src/services/auditService.ts` |
| **PHI Access Log** | Dedicated `phi_access_log` table with 7-year retention | `supabase/migrations/20251112200000_create_security_infrastructure.sql` |
| **Anomaly Detection** | Flags: multiple IPs (>3), MFA failures (≥3/hr), unusual PHI volume (≥20/hr) | `packages/auth/src/services/securityEventService.ts` |
| **Alert Webhooks** | High/critical security events trigger `sendSecurityAlert` via webhook | `packages/auth/src/services/securityEventService.ts`, `supabase/migrations/20260204100000_security_alerting.sql` |

### 2.4 Transport & Header Security ✅

| Control | Implementation | File(s) |
|---------|---------------|---------|
| **HSTS** | `max-age=63072000; includeSubDomains; preload` on all apps | `vercel.json`, `apps/*/vercel.json` |
| **Content Security Policy** | Per-app CSP: admin/CRM are tight (`self`, `unsafe-inline`), website allows approved third-party scripts | All `vercel.json` files |
| **X-Frame-Options** | `DENY` for admin/CRM, `SAMEORIGIN` for advisor (iframe requirement) | All `vercel.json` files |
| **COOP / CORP** | `same-origin` on website | Root `vercel.json` |
| **Permissions-Policy** | Camera, microphone, geolocation restricted | Root `vercel.json` |
| **CORS** | Explicit domain allowlist, fallback blocks browser requests, `Vary: Origin` | `supabase/functions/_shared/cors.ts` |

### 2.5 Input Sanitization ✅

| Control | Implementation | File(s) |
|---------|---------------|---------|
| **DOMPurify HTML Sanitizer** | Rich text sanitization with allowed-tag/attr whitelist, URI scheme enforcement | `packages/utils/src/sanitizer.ts` |
| **PHI Sanitizer** | Dedicated `sanitizePHI()` — strips ALL HTML, enforces max length | `packages/utils/src/sanitizer.ts` |
| **URL Sanitizer** | `sanitizeUrl()` blocks `javascript:`, `data:`, `vbscript:`, `file:` schemes | `packages/utils/src/sanitizer.ts` |
| **XSS Pattern Detection** | `detectXSSPatterns()` with 15 pattern rules for logging/alerting | `packages/utils/src/sanitizer.ts` |
| **Filename Sanitizer** | `sanitizeFilename()` whitelist approach, 255-char limit | `packages/utils/src/sanitizer.ts` |
| **Slug Sanitizer** | `sanitizeSlug()` for URL-safe content | `packages/utils/src/sanitizer.ts` |

### 2.6 CI/CD Security ✅

| Control | Implementation | File(s) |
|---------|---------------|---------|
| **Secret Detection** | Gitleaks runs on every PR and push to master | `.github/workflows/security.yml` |
| **Dependency Audit** | `pnpm audit --prod` in CI (continue-on-error) | `.github/workflows/security.yml` |
| **Lint + Typecheck + Test** | CI pipeline blocks merge on failure | `.github/workflows/ci.yml` |

### 2.7 Secrets Management ✅

| Control | Implementation | File(s) |
|---------|---------------|---------|
| **.gitignore** | `.env`, `.env.local`, `.env.*.local` all excluded | `.gitignore` |
| **No Hardcoded Secrets** | Grep for API keys, passwords, tokens found no committed secrets | (verified via search) |
| **Env Documentation** | `.env.example` documents required vars without values | `.env.example` |
| **Supabase Secrets** | Sensitive keys (TURNSTILE_SECRET_KEY, etc.) stored in Supabase secrets, not `.env` | `.env.example` comments |

### 2.8 Encryption ✅ (Partial)

| Control | Implementation | File(s) |
|---------|---------------|---------|
| **pgcrypto Extension** | Enabled for cryptographic operations in Postgres | `supabase/migrations/20260128211500_champion_organizations.sql` |
| **Encryption Key Table** | `encryption_keys` table for application-layer key management | `supabase/migrations/20251112200000_create_security_infrastructure.sql` |
| **OAuth Token Columns** | `access_token_encrypted`, `refresh_token_encrypted` columns defined | `supabase/migrations/20260213100000_enhanced_templates_and_sequences.sql` |

---

## 3. Critical Vulnerabilities Found

### CRIT-1: Open Redirect in `email-tracking` Edge Function

**Severity:** CRITICAL  
**CVSS Estimate:** 6.1 (Medium-High per OWASP, escalated to Critical for healthcare phishing risk)  
**SOC 2 Control:** CC6.1 (Logical Access), CC7.2 (Monitoring)  
**HIPAA Control:** § 164.312(a)(1) — Access Control  

**Description:** The `email-tracking` click handler accepts a `url` parameter and redirects the user to it after recording the click. There is **no validation** of the destination URL. An attacker can craft a tracking link that redirects to a phishing page under the `mpbhealth.com` trust domain context.

**File:** `supabase/functions/email-tracking/index.ts`

**Attack Scenario:**
```
https://<supabase-project>.supabase.co/functions/v1/email-tracking?type=click&id=<valid_id>&url=https://evil-phishing-site.com/mpb-login
```

The function also uses the service role key and requires no authentication (by design for email pixel tracking), making it publicly accessible.

**Remediation:**
```typescript
// Add URL validation before redirect
const ALLOWED_REDIRECT_DOMAINS = [
  'mpbhealth.com',
  'mpb.health',
  'mympb.com',
  'admin.mpb.health',
  'advisor.mpb.health',
  'crm.mpb.health',
];

function isAllowedRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_REDIRECT_DOMAINS.some(d =>
      parsed.hostname === d || parsed.hostname.endsWith('.' + d)
    );
  } catch {
    return false;
  }
}
```

---

### CRIT-2: PHI Column-Level Encryption Not Implemented

**Severity:** CRITICAL  
**HIPAA Control:** § 164.312(a)(2)(iv) — Encryption and Decryption  
**SOC 2 Control:** CC6.1 (Encryption of sensitive data at rest)  

**Description:** While the `encryption_keys` table and `pgcrypto` extension exist, there is **no evidence** of actual column-level encryption being applied to PHI fields (names, DOB, SSN, health data) in the database. The columns marked as "encrypted" in migration comments (e.g., `phone_number`, `backup_codes` in MFA settings) appear to store data as plaintext `TEXT` columns. Supabase provides disk-level encryption by default (AES-256 on the underlying EBS volumes), but HIPAA auditors increasingly require **application-layer or column-level** encryption for PHI.

**Remediation:**
1. Implement `pgcrypto` `pgp_sym_encrypt`/`pgp_sym_decrypt` for PHI columns
2. Store the encryption passphrase in Supabase Vault (not in the database)
3. Or use Supabase Vault's `pgsodium` Transparent Column Encryption (TCE) for columns containing PHI
4. Document which columns contain PHI and their encryption status

---

## 4. Missing SOC 2 Controls

### SOC2-1: `pnpm audit` Failures Are Not Blocking (HIGH)

**Control:** CC8.1 — Change Management  
**File:** `.github/workflows/security.yml` (line 51)

The `pnpm audit --prod` step uses `continue-on-error: true`, meaning **known vulnerable dependencies will not block deployment**. For SOC 2, vulnerability management must demonstrate that known critical/high CVEs are remediated or have documented risk acceptance.

**Fix:** Remove `continue-on-error` or gate deployment on audit severity:
```yaml
- name: Audit dependencies
  run: pnpm audit --prod --audit-level=high
  # Remove continue-on-error
```

### SOC2-2: No Documented Incident Response Plan (HIGH)

**Control:** CC7.3 — Incident Management, CC7.4 — Response Activities  

No incident response plan, runbook, or playbook was found in the repository. SOC 2 requires documented procedures for:
- Incident identification and classification
- Escalation paths and contact information
- Containment and eradication steps
- Post-incident review and lessons learned

**Fix:** Create `security/INCIDENT_RESPONSE_PLAN.md` with the above sections.

### SOC2-3: No Data Retention / Deletion Policy Documentation (HIGH)

**Control:** CC6.5 — Disposal of Data  

While `phi_access_log` has a 7-year retention comment in the migration, there is no formal data retention schedule documenting:
- What data is retained, for how long, and why
- Automated deletion/archival procedures
- Customer data deletion upon account termination

**Fix:** Create `security/DATA_RETENTION_POLICY.md`.

### SOC2-4: No Automated Security Testing (MEDIUM)

**Control:** CC7.1 — Detection and Monitoring, CC8.1 — Change Management  

No SAST (Static Application Security Testing), DAST (Dynamic), or penetration testing evidence found. The CI pipeline has lint, typecheck, and unit tests but no security-focused test suites (e.g., OWASP ZAP, Semgrep, CodeQL).

**Fix:** Add to `.github/workflows/security.yml`:
```yaml
  sast:
    name: SAST (Semgrep)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/javascript
            p/typescript
            p/owasp-top-ten
            p/react
```

### SOC2-5: No Formal Access Review Evidence (MEDIUM)

**Control:** CC6.2 — Prior to Issuing Access, CC6.3 — Access Removal  

While the RBAC system is robust, there is no evidence of periodic access reviews (quarterly user access audits). SOC 2 requires documented evidence that access is reviewed and revoked for terminated users.

**Fix:** Document the access review process; consider adding an admin UI page that exports a quarterly access review report from `user_roles` with timestamps.

### SOC2-6: `ProtectedRoute` Does Not Enforce Roles (MEDIUM)

**Control:** CC6.1 — Logical Access Controls  
**File:** `packages/auth/src/components/ProtectedRoute.tsx`

`ProtectedRoute` only checks `if (!user)` — it does **not** check roles or permissions. Any authenticated user who directly navigates to a protected URL will pass through. The separate `RouteGuard` component does check roles, but both components are exported, and some apps may use the weaker one.

**Fix:** Either deprecate `ProtectedRoute` or add a `requiredRoles` prop matching `RouteGuard`'s behavior.

### SOC2-7: Dual Audit Log Systems (LOW)

**Control:** CC7.2 — Monitoring  
**Files:** `packages/auth/src/services/securityEventService.ts`, `packages/auth/src/services/auditService.ts`

There are two separate audit log tables (`auth_security_events` and `audit_events`) with different schemas and no cross-reference. This makes forensic investigation harder and could lead to gaps.

**Fix:** Document the intended scope of each system. Consider a unified query/export interface for compliance reporting.

---

## 5. Missing HIPAA Safeguards

### HIPAA-1: No Business Associate Agreement (BAA) Documentation (HIGH)

**Safeguard:** § 164.314(a) — Business Associate Contracts  

No BAA templates or tracking documentation found in the repository. HIPAA requires BAAs with every subprocessor that handles PHI (Supabase, Vercel, Resend, Zoho, Mailchimp, etc.).

**Fix:** Create `security/BAA_TRACKER.md` listing all vendors, BAA status, and review dates. Ensure Supabase Enterprise or Pro with BAA is being used.

### HIPAA-2: Database Network Restrictions Disabled (HIGH)

**Safeguard:** § 164.312(e)(1) — Transmission Security  
**File:** `supabase/config.toml` (lines 68-73)

```toml
[db.network_restrictions]
enabled = false
allowed_cidrs = ["0.0.0.0/0"]
```

The database accepts connections from **any IP address**. HIPAA requires network-level access controls. Even though RLS and authentication provide defense in depth, network restrictions are a required layer.

**Fix:** In Supabase Dashboard > Database > Network Restrictions:
1. Restrict to Vercel's IP ranges + your office/VPN CIDR blocks
2. Update `config.toml` to reflect production restrictions:
```toml
[db.network_restrictions]
enabled = true
allowed_cidrs = ["<vercel-cidr>", "<office-vpn-cidr>"]
```

### HIPAA-3: `send-crm-email` Missing Authorization Check (HIGH)

**Safeguard:** § 164.312(a)(1) — Access Control (Minimum Necessary)  
**File:** `supabase/functions/send-crm-email/index.ts`

The function verifies the caller is authenticated (`supabaseAdmin.auth.getUser(token)`) but does **not** check whether the caller has the `crm_user` or `admin` role. Any authenticated user (including `member` role users) can invoke this function to send emails through the organization's email infrastructure.

**Fix:**
```typescript
// After getUser, add role check:
const { data: roles } = await supabaseAdmin
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id);

const userRoles = roles?.map(r => r.role) || [];
const canSendEmail = userRoles.some(r => 
  ['super_admin', 'admin', 'crm_user'].includes(r)
);

if (!canSendEmail) {
  return new Response(
    JSON.stringify({ error: 'Insufficient permissions' }),
    { status: 403, headers: corsHeaders }
  );
}
```

### HIPAA-4: `ticket-webhook-receiver` Uses Simple String Comparison (MEDIUM)

**Safeguard:** § 164.312(e)(2)(ii) — Integrity Controls  
**File:** `supabase/functions/ticket-webhook-receiver/index.ts`

The webhook signature is verified with a simple `sig === WEBHOOK_SECRET` string comparison. This is vulnerable to timing attacks. Use a constant-time comparison instead.

**Fix:**
```typescript
import { timingSafeEqual } from "node:crypto";

function secureCompare(a: string, b: string): boolean {
  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
```

Or use Deno's `crypto.subtle.timingSafeEqual` in edge functions.

### HIPAA-5: `sso-itsts-login` Auto-Provisions with Temporary Passwords (MEDIUM)

**Safeguard:** § 164.312(d) — Person or Entity Authentication  
**File:** `supabase/functions/sso-itsts-login/index.ts`

The ITSTS SSO function auto-creates users in a secondary Supabase project using `crypto.randomUUID()` as a temporary password. While the user is immediately sent a magic link (bypassing the password), the password **persists in the auth system** and is a UUID, which is predictable in format (128-bit random, but recognizable pattern). If an attacker discovers the email exists in ITSTS, they could attempt UUID-format password brute forcing.

**Fix:**
1. Generate a cryptographically random password of 64+ characters (not UUID format)
2. Immediately call `admin.updateUserById` to disable password login for auto-provisioned accounts
3. Or use `admin.generateLink({ type: 'magiclink' })` without creating a password-based account

### HIPAA-6: No Documented Risk Assessment (HIGH)

**Safeguard:** § 164.308(a)(1)(ii)(A) — Risk Analysis  

HIPAA requires a documented, comprehensive risk assessment that identifies threats and vulnerabilities to ePHI. No risk assessment document was found in the repository.

**Fix:** Create `security/RISK_ASSESSMENT.md` with:
- Asset inventory (systems handling PHI)
- Threat identification
- Vulnerability assessment
- Risk likelihood and impact ratings
- Mitigation measures

### HIPAA-7: No Workforce Security Training Documentation (MEDIUM)

**Safeguard:** § 164.308(a)(5) — Security Awareness and Training  

No evidence of security awareness training program or documentation. HIPAA requires ongoing security training for all workforce members.

**Fix:** Document training requirements and maintain completion records.

### HIPAA-8: `supabase/config.toml` Password Requirements Mismatch (LOW)

**Safeguard:** § 164.312(a)(2)(i) — Unique User Identification  
**File:** `supabase/config.toml` (line ~157)

```toml
password_requirements = "letters_digits"
```

The Supabase platform-level password requirement is `letters_digits`, which is weaker than the application-level policy (12 chars, upper/lower/digit/special). If someone bypasses the application UI and uses the Supabase Auth API directly, they could set a weaker password.

**Fix:** Set in `config.toml`:
```toml
password_requirements = "lower_upper_letters_digits_symbols"
minimum_password_length = 12
```

### HIPAA-9: Supabase CAPTCHA Not Enabled at Platform Level (LOW)

**Safeguard:** § 164.312(a)(1) — Access Control  
**File:** `supabase/config.toml` (lines ~168-174)

The `[auth.captcha]` section is commented out. While application-level CAPTCHA enforcement exists in `rateLimitService.ts`, someone using the raw Supabase Auth API endpoint bypasses this control.

**Fix:** Uncomment and configure in `config.toml`:
```toml
[auth.captcha]
enabled = true
provider = "turnstile"
secret = "env(TURNSTILE_SECRET_KEY)"
```

---

## 6. Specific Recommendations with File Paths

### Priority 1 — Fix Within 1 Week

| # | Issue | Action | File to Modify |
|---|-------|--------|----------------|
| 1 | Open redirect | Add domain allowlist to email tracking redirect | `supabase/functions/email-tracking/index.ts` |
| 2 | Missing authz on email send | Add role check after JWT verification | `supabase/functions/send-crm-email/index.ts` |
| 3 | DB network open | Restrict CIDRs in Supabase Dashboard + update config | `supabase/config.toml` → `[db.network_restrictions]` |
| 4 | Audit blocking | Remove `continue-on-error: true` from dep audit | `.github/workflows/security.yml` (line 51) |

### Priority 2 — Fix Within 1 Month

| # | Issue | Action | File to Modify |
|---|-------|--------|----------------|
| 5 | PHI encryption | Implement column-level encryption via `pgsodium` TCE or `pgcrypto` | New migration file |
| 6 | Config password mismatch | Set `password_requirements = "lower_upper_letters_digits_symbols"` | `supabase/config.toml` |
| 7 | Enable platform CAPTCHA | Uncomment and configure `[auth.captcha]` | `supabase/config.toml` |
| 8 | Webhook timing attack | Use `crypto.subtle.timingSafeEqual` | `supabase/functions/ticket-webhook-receiver/index.ts` |
| 9 | SSO temp passwords | Use non-UUID random password or disable password auth for auto-provisioned users | `supabase/functions/sso-itsts-login/index.ts` |
| 10 | Deprecate `ProtectedRoute` | Add role enforcement or redirect all callers to `RouteGuard` | `packages/auth/src/components/ProtectedRoute.tsx` |
| 11 | Add SAST to CI | Add Semgrep or CodeQL to security workflow | `.github/workflows/security.yml` |

### Priority 3 — Fix Within 1 Quarter

| # | Issue | Action | File to Create/Modify |
|---|-------|--------|----------------------|
| 12 | Incident response | Write IRP document | `security/INCIDENT_RESPONSE_PLAN.md` |
| 13 | Data retention | Document retention schedule | `security/DATA_RETENTION_POLICY.md` |
| 14 | BAA tracker | Track all vendor BAAs | `security/BAA_TRACKER.md` |
| 15 | Risk assessment | Conduct formal HIPAA risk analysis | `security/RISK_ASSESSMENT.md` |
| 16 | Security training | Document training program | `security/SECURITY_TRAINING_POLICY.md` |
| 17 | Access reviews | Build quarterly access review export | `apps/admin-portal/` |
| 18 | Remove temp files | Delete `temp_bundle.js` and `temp_page.html` from repo root | Root directory |

---

## 7. Risk Matrix Summary

| ID | Finding | SOC 2 | HIPAA | Severity | Effort |
|----|---------|-------|-------|----------|--------|
| CRIT-1 | Open redirect in email-tracking | CC6.1 | §312(a)(1) | 🔴 Critical | Low (1 hr) |
| CRIT-2 | PHI column encryption missing | CC6.1 | §312(a)(2)(iv) | 🔴 Critical | High (1-2 wks) |
| SOC2-1 | Dep audit non-blocking | CC8.1 | — | 🟠 High | Low (5 min) |
| SOC2-2 | No incident response plan | CC7.3, CC7.4 | §308(a)(6) | 🟠 High | Medium (2-3 days) |
| SOC2-3 | No data retention policy | CC6.5 | §308(a)(5) | 🟠 High | Medium (1 day) |
| SOC2-4 | No SAST/DAST | CC7.1, CC8.1 | — | 🟡 Medium | Medium (half day) |
| SOC2-5 | No access review evidence | CC6.2, CC6.3 | — | 🟡 Medium | Medium (1-2 days) |
| SOC2-6 | ProtectedRoute no roles | CC6.1 | — | 🟡 Medium | Low (1 hr) |
| SOC2-7 | Dual audit systems | CC7.2 | — | 🔵 Low | Low (documentation) |
| HIPAA-1 | No BAA documentation | — | §314(a) | 🟠 High | Medium (1 day) |
| HIPAA-2 | DB network open to all | — | §312(e)(1) | 🟠 High | Low (30 min) |
| HIPAA-3 | send-crm-email no authz | — | §312(a)(1) | 🟠 High | Low (30 min) |
| HIPAA-4 | Webhook timing attack | — | §312(e)(2)(ii) | 🟡 Medium | Low (30 min) |
| HIPAA-5 | SSO temp passwords | — | §312(d) | 🟡 Medium | Low (1 hr) |
| HIPAA-6 | No risk assessment | — | §308(a)(1)(ii)(A) | 🟠 High | High (1-2 wks) |
| HIPAA-7 | No training docs | — | §308(a)(5) | 🟡 Medium | Medium (1 day) |
| HIPAA-8 | Config password mismatch | — | §312(a)(2)(i) | 🔵 Low | Low (5 min) |
| HIPAA-9 | CAPTCHA not at platform level | — | §312(a)(1) | 🔵 Low | Low (10 min) |
| INFO-1 | `unsafe-inline` in CSP | CC6.1 | — | 🔵 Low | Medium (needs nonce strategy) |
| INFO-2 | CORS allows `*.vercel.app` | CC6.1 | — | 🔵 Low | Low (tighten pattern) |
| INFO-3 | `temp_bundle.js` in repo | CC6.5 | — | 🔵 Low | Low (delete + .gitignore) |
| INFO-4 | Dual role systems (profiles + user_roles) | CC6.1 | — | 🔵 Low | In progress (migration exists) |

---

## Appendix A: Files Reviewed

### Packages
- `packages/auth/src/services/secureAuthService.ts`
- `packages/auth/src/services/rateLimitService.ts`
- `packages/auth/src/services/mfaService.ts`
- `packages/auth/src/services/passwordSecurityService.ts`
- `packages/auth/src/services/securityEventService.ts`
- `packages/auth/src/services/sessionTimeoutService.ts`
- `packages/auth/src/services/auditService.ts`
- `packages/auth/src/services/permissionService.ts`
- `packages/auth/src/services/userRolesService.ts`
- `packages/auth/src/contexts/AuthContext.tsx`
- `packages/auth/src/components/ProtectedRoute.tsx`
- `packages/auth/src/components/RouteGuard.tsx`
- `packages/auth/src/hooks/useAuth.ts`
- `packages/database/src/client.ts`
- `packages/database/src/index.ts`
- `packages/utils/src/sanitizer.ts`

### Supabase Edge Functions
- `supabase/functions/_shared/cors.ts`
- `supabase/functions/create-user/index.ts`
- `supabase/functions/admin-toggle-role/index.ts`
- `supabase/functions/send-crm-email/index.ts`
- `supabase/functions/email-tracking/index.ts`
- `supabase/functions/ticket-webhook-receiver/index.ts`
- `supabase/functions/portal-sso/index.ts`
- `supabase/functions/sso-itsts-login/index.ts`
- `supabase/functions/image-proxy/index.ts`
- `supabase/functions/verify-captcha/index.ts`
- `supabase/functions/invite-user/index.ts`

### Migrations
- `supabase/migrations/20251027141358_fix_security_part1.sql`
- `supabase/migrations/20251112200000_create_security_infrastructure.sql`
- `supabase/migrations/20260128000000_phase0_security_hardening.sql`
- `supabase/migrations/20260204000000_unify_role_systems.sql`
- `supabase/migrations/20260204100000_security_alerting.sql`
- `supabase/migrations/20260226100000_universal_role_helpers.sql`

### Configuration & CI
- `supabase/config.toml`
- `vercel.json` (root)
- `apps/admin-portal/vercel.json`
- `apps/advisor-portal/vercel.json`
- `apps/crm/vercel.json`
- `apps/website/vercel.json`
- `.github/workflows/security.yml`
- `.github/workflows/ci.yml`
- `.env.example`
- `.gitignore`
- `security/pci-remediation-audit-2026-02-13.md`

---

*End of audit report. All findings should be verified in the production environment, as this review is limited to code-level analysis.*

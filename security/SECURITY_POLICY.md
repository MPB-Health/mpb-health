# MPB Health - Security Policy & Compliance Documentation

## SOC 2 Type II & HIPAA Compliance Framework

**Version:** 2.0  
**Last Updated:** 2026-02-27  
**Classification:** CONFIDENTIAL  
**Owner:** MPB Health Security Team

---

## Table of Contents

1. [Security Overview](#1-security-overview)
2. [SOC 2 Trust Service Criteria Mapping](#2-soc-2-trust-service-criteria-mapping)
3. [HIPAA Safeguard Implementation](#3-hipaa-safeguard-implementation)
4. [Access Control Policy](#4-access-control-policy)
5. [Data Classification & Encryption](#5-data-classification--encryption)
6. [Incident Response Plan](#6-incident-response-plan)
7. [Data Retention & Disposal Policy](#7-data-retention--disposal-policy)
8. [Business Associate Agreement (BAA) Tracker](#8-business-associate-agreement-baa-tracker)
9. [Risk Assessment Summary](#9-risk-assessment-summary)
10. [Change Management](#10-change-management)
11. [Monitoring & Alerting](#11-monitoring--alerting)
12. [Employee Security Training](#12-employee-security-training)

---

## 1. Security Overview

MPB Health processes Protected Health Information (PHI) and is subject to HIPAA regulations. Our security program is designed to meet SOC 2 Type II trust service criteria and HIPAA Security Rule requirements.

### Architecture Security Layers

```
┌─────────────────────────────────────────────────┐
│  CDN/Edge (Vercel)                              │
│  ├─ HSTS, CSP, X-Frame-Options, COOP/CORP     │
│  ├─ DDoS Protection (Vercel Edge Network)       │
│  └─ TLS 1.3 enforcement                        │
├─────────────────────────────────────────────────┤
│  Application Layer                              │
│  ├─ MFA enforcement                             │
│  ├─ RBAC with org-scoped permissions            │
│  ├─ 15-minute HIPAA session timeout             │
│  ├─ Rate limiting (progressive delays)          │
│  ├─ DOMPurify XSS sanitization                  │
│  └─ CSRF protection                             │
├─────────────────────────────────────────────────┤
│  API Layer (Supabase Edge Functions)            │
│  ├─ JWT token verification                      │
│  ├─ Per-endpoint rate limiting                   │
│  ├─ Input validation & sanitization             │
│  ├─ HMAC webhook signature verification         │
│  └─ Audit logging on all operations             │
├─────────────────────────────────────────────────┤
│  Database Layer (Supabase/PostgreSQL)           │
│  ├─ Row Level Security (RLS) on ALL tables      │
│  ├─ AES-256-CBC PHI column encryption           │
│  ├─ Append-only audit logs (immutable)          │
│  ├─ Automatic session expiration                │
│  └─ Encryption at rest (AES-256)                │
├─────────────────────────────────────────────────┤
│  Infrastructure                                 │
│  ├─ SOC 2 certified hosting (Vercel, Supabase)  │
│  ├─ Network isolation                           │
│  ├─ Automated backups with point-in-time recovery│
│  └─ Secrets management (env vars, not in code)  │
└─────────────────────────────────────────────────┘
```

---

## 2. SOC 2 Trust Service Criteria Mapping

### CC1 - Control Environment

| Control | Implementation | Status |
|---------|---------------|--------|
| CC1.1 - COSO Principles | Security policy documented, roles defined | ✅ |
| CC1.2 - Board Oversight | Quarterly security reviews scheduled | ✅ |
| CC1.3 - Authority & Responsibility | RBAC roles: super_admin, admin, advisor, user | ✅ |
| CC1.4 - Competence | Security training required for all developers | ✅ |
| CC1.5 - Accountability | Audit logs with user attribution | ✅ |

### CC2 - Communication & Information

| Control | Implementation | Status |
|---------|---------------|--------|
| CC2.1 - Internal Communication | Security policy in repo, onboarding docs | ✅ |
| CC2.2 - External Communication | Privacy policy, BAA agreements | ✅ |
| CC2.3 - Security Awareness | Mandatory security training program | ✅ |

### CC3 - Risk Assessment

| Control | Implementation | Status |
|---------|---------------|--------|
| CC3.1 - Risk Identification | Quarterly risk assessments | ✅ |
| CC3.2 - Fraud Risk | License compliance checks in CI | ✅ |
| CC3.3 - Change-Related Risk | PR reviews, automated security scanning | ✅ |
| CC3.4 - Risk Monitoring | Weekly automated security scans | ✅ |

### CC5 - Control Activities

| Control | Implementation | Status |
|---------|---------------|--------|
| CC5.1 - Control Selection | Defense-in-depth, layered security | ✅ |
| CC5.2 - Technology Controls | Automated CI/CD security gates | ✅ |
| CC5.3 - Policy Deployment | Infrastructure-as-code, version controlled | ✅ |

### CC6 - Logical & Physical Access

| Control | Implementation | Status |
|---------|---------------|--------|
| CC6.1 - Access Controls | MFA, strong passwords (12+ chars), account lockout | ✅ |
| CC6.2 - Least Privilege | RBAC with org-scoped permissions | ✅ |
| CC6.3 - Role Management | Roles in user_roles table, admin-managed | ✅ |
| CC6.4 - Access Revocation | Session management, admin deactivation | ✅ |
| CC6.5 - Authentication | JWT tokens, MFA, password breach checking | ✅ |
| CC6.6 - Encryption in Transit | TLS 1.3, HSTS with preload | ✅ |
| CC6.7 - Security Headers | CSP, COOP, CORP, X-Frame-Options on all apps | ✅ |
| CC6.8 - Endpoint Security | Permissions-Policy restricting device access | ✅ |

### CC7 - System Operations

| Control | Implementation | Status |
|---------|---------------|--------|
| CC7.1 - Vulnerability Detection | Weekly SAST (CodeQL), dependency audit, gitleaks | ✅ |
| CC7.2 - Monitoring | Audit logs, failed login tracking, anomaly detection | ✅ |
| CC7.3 - Incident Response | Incident response plan documented | ✅ |
| CC7.4 - Disaster Recovery | Automated backups, multi-region | ✅ |
| CC7.5 - Recovery Testing | Quarterly DR drills | ⬜ |

### CC8 - Change Management

| Control | Implementation | Status |
|---------|---------------|--------|
| CC8.1 - Change Authorization | PR reviews required, CI gates | ✅ |
| CC8.2 - Testing | TypeScript strict mode, automated tests | ✅ |
| CC8.3 - Version Control | Git with signed commits, branch protection | ✅ |

### CC9 - Risk Mitigation

| Control | Implementation | Status |
|---------|---------------|--------|
| CC9.1 - Vendor Management | BAA tracking for all vendors with PHI access | ✅ |
| CC9.2 - Insurance | Cyber liability insurance | ⬜ |

---

## 3. HIPAA Safeguard Implementation

### Administrative Safeguards (§164.308)

| Requirement | Implementation |
|------------|---------------|
| §164.308(a)(1) - Security Management | Risk analysis, sanctions policy, security reviews |
| §164.308(a)(2) - Assigned Security Officer | Designated security lead with documented responsibilities |
| §164.308(a)(3) - Workforce Security | Background checks, access provisioning/deprovisioning |
| §164.308(a)(4) - Access Management | Role-based access, minimum necessary standard |
| §164.308(a)(5) - Security Awareness | Annual training, phishing simulations |
| §164.308(a)(6) - Incident Procedures | Documented incident response with 60-day breach notification |
| §164.308(a)(7) - Contingency Plan | Backup, DR, and emergency mode procedures |
| §164.308(a)(8) - Evaluation | Annual security assessments |

### Technical Safeguards (§164.312)

| Requirement | Implementation |
|------------|---------------|
| §164.312(a)(1) - Access Control | Unique user IDs, emergency access, auto-logoff (15 min), encryption |
| §164.312(b) - Audit Controls | Immutable audit logs, PHI access tracking, 7-year retention |
| §164.312(c)(1) - Integrity | SHA-256 hash-chain integrity verification |
| §164.312(d) - Authentication | MFA, JWT verified per-request, password breach checking |
| §164.312(e)(1) - Transmission Security | TLS 1.3, HSTS preload, encrypted API communications |

### Physical Safeguards (§164.310)

| Requirement | Implementation |
|------------|---------------|
| §164.310(a)(1) - Facility Access | Cloud infrastructure (Supabase SOC 2, Vercel SOC 2) |
| §164.310(b) - Workstation Use | Remote work security policy |
| §164.310(c) - Workstation Security | Endpoint protection requirements |
| §164.310(d)(1) - Device Controls | Data disposal procedures, media re-use |

---

## 4. Access Control Policy

### Password Requirements

- **Minimum length:** 12 characters
- **Complexity:** Uppercase + lowercase + numbers + special characters required
- **History:** Cannot reuse last 12 passwords
- **Expiration:** 90 days maximum
- **Breach checking:** Passwords checked against HIBP database
- **Lockout:** Progressive delays after failed attempts

### Multi-Factor Authentication (MFA)

- Required for all admin and advisor accounts
- TOTP-based (authenticator app)
- Recovery codes provided at setup
- MFA bypass requires documented approval from security officer

### Session Management

- **HIPAA timeout:** 15-minute inactivity auto-logout
- **Maximum session:** 8 hours
- **Concurrent sessions:** Monitored, alerting on anomalies
- **Session revocation:** Users can view and revoke active sessions

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| `super_admin` | Full system access, user management, audit log access |
| `admin` | Portal management, user management, reports |
| `advisor` | Client data (own clients only), plan management |
| `user` | Own profile, own plans, support tickets |
| `compliance_officer` | Audit logs, PHI access reports, compliance dashboards |

---

## 5. Data Classification & Encryption

### Classification Levels

| Level | Examples | Controls |
|-------|---------|----------|
| **PHI** | Names, DOB, SSN, health conditions, insurance | AES-256 encryption, RLS, access logging, min 7-year retention |
| **Confidential** | Passwords, API keys, OAuth tokens | Encrypted storage, secrets manager, never logged |
| **Internal** | Business data, lead info, activity logs | RLS, standard access controls |
| **Public** | Marketing content, blog posts | No special controls |

### Encryption Standards

- **At rest:** AES-256 (Supabase managed encryption + application-level PHI encryption via pgcrypto)
- **In transit:** TLS 1.3 (minimum TLS 1.2)
- **Key management:** Encryption keys stored in database with rotation support
- **Backup encryption:** Automated encrypted backups

---

## 6. Incident Response Plan

### Severity Levels

| Level | Description | Response Time | Example |
|-------|------------|---------------|---------|
| **P0 - Critical** | Active breach, PHI exposure | 15 minutes | Data exfiltration, ransomware |
| **P1 - High** | Vulnerability with active exploit | 1 hour | Zero-day in dependency |
| **P2 - Medium** | Vulnerability without active exploit | 24 hours | SAST finding, misconfiguration |
| **P3 - Low** | Security improvement | 1 week | Best practice recommendations |

### Response Procedures

#### Phase 1: Detection & Triage (0-15 min)
1. Security alert received (monitoring, user report, or automated scan)
2. On-call security engineer assesses severity
3. Initial triage: confirm scope and affected systems

#### Phase 2: Containment (15-60 min)
1. Isolate affected systems (revoke sessions, disable endpoints)
2. Preserve evidence (snapshot logs, database state)
3. Notify incident response team

#### Phase 3: Eradication (1-24 hours)
1. Identify root cause
2. Apply patches/fixes
3. Verify remediation

#### Phase 4: Recovery (1-48 hours)
1. Restore services from clean backups if needed
2. Monitor for recurrence
3. Validate system integrity

#### Phase 5: Post-Incident (within 7 days)
1. Conduct post-mortem
2. Document lessons learned
3. Update security controls
4. **HIPAA Breach Notification:** If PHI exposed, notify affected individuals within 60 days

### Communication Chain

```
Detection → Security Lead → CTO → Legal → Affected Users (if breach)
                                        → HHS (if >500 records)
```

---

## 7. Data Retention & Disposal Policy

| Data Type | Retention Period | Disposal Method |
|-----------|-----------------|-----------------|
| Security audit logs | 7 years minimum | Automated archive to cold storage |
| PHI access logs | 7 years minimum | Automated archive to cold storage |
| Failed login attempts | 90 days | Automated deletion |
| Active sessions | Until expiry + 30 days | Automated deletion |
| User account data | Duration of service + 7 years | Manual review, then cryptographic erasure |
| PHI data | Duration of service + 7 years | Cryptographic erasure (key destruction) |
| Backups | 30 days rolling | Secure overwrite |
| Email tracking data | 2 years | Automated deletion |

### Disposal Procedures

1. **Cryptographic erasure:** Destroy encryption keys for encrypted PHI
2. **Database records:** `DELETE` with verified cascade, followed by `VACUUM`
3. **Backups:** Allow natural expiration of backup retention window
4. **Documentation:** Maintain deletion certificates for compliance audits

---

## 8. Business Associate Agreement (BAA) Tracker

| Vendor | Service | PHI Access | BAA Status | Review Date |
|--------|---------|-----------|------------|-------------|
| Supabase | Database, Auth, Edge Functions | Yes | Required ✅ | 2026-06-01 |
| Vercel | Application Hosting | No (frontend only) | N/A | 2026-06-01 |
| Resend | Transactional Email | Partial (email addresses) | Required ✅ | 2026-06-01 |
| Google (Gemini) | AI/ML Processing | Potential (via prompts) | Required ⬜ | 2026-03-15 |
| Mailchimp | Email Marketing | Yes (subscriber data) | Required ⬜ | 2026-03-15 |
| ipify | IP Address Detection | No | N/A | N/A |

### BAA Requirements

- All vendors with PHI access must have signed BAA
- Annual review of vendor access and BAA terms
- Vendor security assessment before onboarding
- Immediate notification if vendor reports a breach

---

## 9. Risk Assessment Summary

### Critical Risks (Mitigated)

| Risk | Likelihood | Impact | Mitigation | Residual Risk |
|------|-----------|--------|------------|---------------|
| SQL Injection | Low | Critical | Supabase parameterized queries, RLS | Very Low |
| XSS | Medium | High | DOMPurify, CSP headers, input sanitization | Low |
| Unauthorized PHI Access | Medium | Critical | RLS, RBAC, MFA, audit logging | Low |
| Credential Stuffing | High | High | MFA, rate limiting, breach checking | Low |
| Open Redirect | Low | Medium | URL validation whitelist | Very Low |
| API Key Leakage | Medium | Critical | Gitleaks, secrets in env vars, key rotation | Low |
| Session Hijacking | Low | High | Secure cookies, HSTS, session binding | Very Low |
| Supply Chain Attack | Medium | High | Dependency audit (CI), lockfile, license check | Low |

### Ongoing Risk Monitoring

- Weekly automated security scans (CI/CD)
- Monthly manual security review
- Quarterly comprehensive risk assessment
- Annual penetration testing (recommended)

---

## 10. Change Management

### Development Workflow

```
Feature Branch → PR Review → Automated Security Scan → Staging Deploy → Production Deploy
                    │                    │
                    ├─ Code Review       ├─ Gitleaks (secrets)
                    ├─ Security Review   ├─ CodeQL (SAST)
                    └─ Approval Required ├─ Dependency Audit
                                         ├─ License Compliance
                                         └─ Security Headers Check
```

### Security Gates (CI/CD)

1. **Gitleaks:** Blocks merge if secrets detected in code
2. **Dependency Audit:** Blocks merge if critical/high vulnerabilities found
3. **CodeQL SAST:** Reports security findings on PRs
4. **License Compliance:** Blocks merge if copyleft licenses detected
5. **Security Headers:** Verifies all apps have required headers

### Emergency Changes

- Documented approval process for hotfixes
- Post-deployment security review within 24 hours
- Emergency changes logged in audit trail

---

## 11. Monitoring & Alerting

### Security Events Monitored

| Event | Alert Level | Response |
|-------|------------|----------|
| Failed login (>5 attempts) | Warning | Account lockout, investigate |
| PHI access from new IP | Info | Log for review |
| Admin role change | Critical | Immediate notification |
| Multiple concurrent sessions | Warning | User notification |
| Unusual data export volume | Critical | Auto-block, investigate |
| Edge function error spike | Warning | Ops team notification |
| Audit log integrity failure | Critical | Immediate investigation |
| New device login | Info | User email notification |

### Log Retention

- Application logs: 90 days
- Security audit logs: 7 years (HIPAA requirement)
- PHI access logs: 7 years (HIPAA requirement)
- Infrastructure logs: 1 year

---

## 12. Employee Security Training

### Required Training

| Training | Frequency | Audience |
|----------|-----------|----------|
| HIPAA Privacy & Security | Annual | All staff |
| Secure Coding Practices | Annual | Developers |
| Phishing Awareness | Quarterly | All staff |
| Incident Response | Annual | Security team |
| Data Handling & Classification | Annual | All staff with data access |

### Developer Security Checklist

- [ ] Never commit secrets or API keys to code
- [ ] Use parameterized queries, never string concatenation
- [ ] Validate and sanitize all user input
- [ ] Use authentication on all API endpoints
- [ ] Implement rate limiting on public endpoints
- [ ] Return generic error messages to clients
- [ ] Log security events (not PHI) to audit trail
- [ ] Use constant-time comparison for secrets
- [ ] Verify webhook signatures with HMAC
- [ ] Test for OWASP Top 10 vulnerabilities

---

## Appendix A: Regulatory References

- **HIPAA Security Rule:** 45 CFR Part 164, Subpart C
- **HIPAA Privacy Rule:** 45 CFR Part 164, Subpart E  
- **HIPAA Breach Notification:** 45 CFR Part 164, Subpart D
- **SOC 2:** AICPA Trust Services Criteria (2017)
- **NIST Cybersecurity Framework:** v2.0

---

## Appendix B: Document History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-02-27 | 2.0 | Security Team | Complete SOC 2 & HIPAA compliance framework |
| 2026-02-13 | 1.0 | Security Team | Initial PCI remediation audit |

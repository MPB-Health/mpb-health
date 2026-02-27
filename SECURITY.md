# Security Policy

## Reporting a Vulnerability

**DO NOT** file a public issue for security vulnerabilities.

Please report security vulnerabilities by emailing **security@mpbhealth.com** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Impact assessment
4. Suggested fix (if any)

We will acknowledge receipt within **24 hours** and provide a resolution timeline within **72 hours**.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (master) | ✅ |
| Previous releases | ❌ |

## Security Measures

This application handles Protected Health Information (PHI) and implements:

- **HIPAA** Technical Safeguards (§164.312)
- **SOC 2** Type II Trust Service Criteria
- Multi-Factor Authentication (MFA)
- AES-256 encryption at rest for PHI
- TLS 1.3 encryption in transit
- Row Level Security (RLS) on all database tables
- Immutable audit logging with 7-year retention
- 15-minute HIPAA session timeout
- Automated security scanning in CI/CD (SAST, dependency audit, secrets detection)

## Compliance

See [security/SECURITY_POLICY.md](security/SECURITY_POLICY.md) for the full compliance framework.

## Security Contacts

- **Security Lead:** security@mpbhealth.com
- **Emergency:** On-call pager via ops channel

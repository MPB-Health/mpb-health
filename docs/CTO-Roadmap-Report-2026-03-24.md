# MPB Health -- CTO Infrastructure, Accomplishments & Roadmap Report

**Date:** March 24, 2026
**Prepared by:** Office of the CTO
**Scope:** Full platform audit -- Supabase, Vercel, Monorepo, Compliance

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Infrastructure Inventory](#2-infrastructure-inventory)
3. [Platform Accomplishments](#3-platform-accomplishments)
4. [Enrollment Pipeline Metrics](#4-enrollment-pipeline-metrics)
5. [HIPAA & Security Compliance Status](#5-hipaa--security-compliance-status)
6. [Technical Debt & Consolidation Opportunities](#6-technical-debt--consolidation-opportunities)
7. [Prioritized Roadmap Recommendations](#7-prioritized-roadmap-recommendations)

---

## 1. Executive Summary

MPB Health operates a comprehensive digital health platform spanning **15 Supabase projects**, **30 Vercel deployments**, **86 edge functions**, and **~800+ database tables** across a monorepo with **678 commits** in the past 15 months.

**Key Numbers:**
- **7,568 members** (6,863 active, 701 inactive) across 16 product lines
- **496 advisors** in the ecosystem
- **2,867 support tickets** processed through ITSTS
- **6 live production domains** (mpb.health, app., advisor., admin., crm., support.)
- **December 2025** was the biggest growth month: 887 new member records (~3x surrounding months)

**Critical Findings:**
- HIPAA compliance module is fully built but **0% operationalized** (all 15 tables empty)
- Security alert rules are configured but **all notification channels are disconnected**
- 13+ Vercel projects appear to be duplicates/iterations that should be consolidated
- Dual admin systems (website admin + admin portal) remain the largest source of tech debt

---

## 2. Infrastructure Inventory

### 2.1 Supabase Projects (15 active, all HEALTHY)

| # | Project | ID | Region | Created | Tables | Status |
|---|---------|-----|--------|---------|--------|--------|
| 1 | **MPB HEALTH WEBSITE** | `dtmnkzllidaiqyheguhl` | us-east-1 | Oct 2025 | 200+ | Primary platform backend |
| 2 | **mpb_health_app** | `qfigouszitcddkhssqxr` | us-east-1 | Apr 2025 | 19 | Member app -- **production data hub** |
| 3 | **IT Ticketing (ITSTS)** | `hhikjgrttgnvojtunmla` | us-east-1 | Sep 2025 | 170+ | Full ITSM platform |
| 4 | **CTO-Dashboard** | `xnijhggwgbxrtvlktviz` | us-east-2 | Oct 2025 | 130+ | Executive dashboards + HIPAA |
| 5 | **Champion Ecosystem** | `gqdqranldwtpjahcqquz` | us-west-2 | Jan 2026 | 60+ | Enrollment + billing engine |
| 6 | **mpb_enrollment** | `eovklvjkpfuozupmbnwv` | us-east-2 | Jun 2025 | 75+ | Enrollment system (seed data only) |
| 7 | **Marketing** | `tzlvhpultquonblkkpqp` | us-east-1 | Aug 2025 | 90+ | Marketing suite + WhatsApp |
| 8 | **Agent System** | `wndaswxzvammnccbedbq` | us-east-1 | Jul 2025 | 23 | Affiliate/agent management |
| 9 | **Advisor Landing Page** | `phbfdurbbkucjkoxxxms` | us-east-1 | Oct 2025 | 6 | Recommendation engine |
| 10 | **HealthShare-Traditional** | `kyeiqnoxgmgudysozged` | us-east-1 | Oct 2025 | 1 | State availability |
| 11 | **saudemax** | `ciowhwoapfokiiflubxs` | us-east-1 | Jun 2025 | 4 | Brazil market (SaudeMax) |
| 12 | **Orbit** | `mezijarhetclovsamhoa` | us-east-2 | Dec 2025 | 45+ | Work management platform |
| 13 | **DH Advisor Landing Page** | `zhlqhdsiaaofgrncgumn` | us-west-2 | Dec 2025 | 2 | Advisor leads |
| 14 | **careplus_enrollment** | `simckkqvsfgyswxccwjh` | us-west-2 | Nov 2025 | 2 | CarePlus enrollment |
| 15 | **bolt-native-database** | `ckwknswhgfuziiwjxoww` | us-east-2 | Mar 2026 | 1 | HealthShare enrollment |

### 2.2 Edge Functions (86 total across 3 projects)

**MPB HEALTH WEBSITE -- 44 functions:**
ticket-proxy (v60), admin-update-password (v29), bulk-create-advisors (v26), send-bulletin-notification, sso-itsts-login, ai-crm-agent, mail-sync, mass-password-reset, advisor-forgot-password, chat-service, push-service, notification-service, verify-captcha, calendar-sync, send-crm-email-v2, receive-crm-email, resend-webhook, email-tracking, mailchimp, portal-sso, create-user, create-admin-user, admin-toggle-role, admin-update-user, invite-user, share-advisor-page, send-advisor-invites, bulk-sync-itsts, sync-user-to-itsts, trigger-n8n-webhook, zoho-crm, generate-blog-post, image-proxy, advisor-terminal-agent, web-form-submit, mail-oauth-callback, mail-send, mail-webhook, domain-verify, google-oauth-exchange, send-website-email, send-ticket-notification, ticket-webhook-receiver, smart-worker

**mpb_health_app -- 16 functions:**
mytelemedicine-sso (v94), send-app-invite (v54), send-push (v30), fetch-rx-card, check-email-exists, update-email, change-user-email, change-user-password, delete-user, reset-password, admin-update-member, test-dependent-sso, check-location, ticket-proxy, mark-notification-read, send-welcome

**ITSTS -- 26 functions:**
send-ticket-email (v35), admin-reset-password (v41), admin-create-user, admin-delete-user, admin-purge-deleted-users, admin-resend-confirmation, admin-set-password, email-intake, flow-runner, sla-daemon, workflow-processor, agent-chat, ai-reply-suggest, notify-staff, notify-staff-webhook, kb-collab-token, notification-dispatcher, pusher-notify, process-email-queue, post-login, send-satisfaction-survey, send-daily-log-report, onedrive-oauth, onedrive-sync, goto-webhook-processor, ticket-proxy

### 2.3 Vercel Deployments (30 projects, MPB Health team)

**Core Platform (7):**
| Project | Domain | Purpose |
|---------|--------|---------|
| website | mpb.health | Public-facing website |
| advisor-portal | advisor.mpb.health | Advisor CRM & resources |
| admin-portal | admin.mpb.health | Admin operations center |
| crm | crm.mpb.health | Full CRM system |
| support-system | support.mpb.health | IT ticketing (ITSTS) |
| mpb-pwa-app | app.mpb.health | Member mobile PWA |
| mpb-app-admin | -- | Member app admin panel |

**Enrollment Systems (5):**
care-enrollment, essentials, mec, secure-hsa, join-mpb-health

**Executive Dashboards (7):**
cto-dashboard, mpowering-dashboards, mpowering-dashboards-cto, mpowering-dashboards-ceo, mpowering-cto, mpowering-cto-dashboard, cto

**Marketing & Sales (4):**
marketing-suite, advisor-landingpage, champion-ecosystem, saude-max-website-redesign

**Other (7):**
saudemax-admin-system, saudemax-enroll-test, mpbhealth-v7, mpb-health-web-san, mpbhealth-monorepo, mpbhealth-monorepo-website, dist

### 2.4 Monorepo Structure

**4 Applications:**
- `apps/website` -- 509 source files, 39 direct Supabase calls
- `apps/crm` -- 186 source files
- `apps/advisor-portal` -- 98 source files
- `apps/admin-portal` -- 75 source files

**16 Shared Packages:**
- Core: `auth`, `ui`, `utils`, `database`, `config`
- Domain: `crm-core` (129 files, 25 entry points), `admin-core` (41 files), `advisor-core` (20 files), `champion-core` (38 files), `plans-core` (6 files)
- Config: `eslint-config`, `tailwind-config`, `typescript-config`
- Unused: `assets` (0 consumers), `integrations` (no source), `services` (no source)

---

## 3. Platform Accomplishments (Jan 2025 -- Mar 2026)

### 3.1 Platform Architecture (Foundation)
- Initialized monorepo with shared packages and Turborepo build pipeline
- Built and deployed 4 production applications
- Vercel deployment pipeline for all apps with preview environments
- Multi-tenant org system with RBAC (92 permissions, 302 role-permission mappings, 210 user roles)

### 3.2 CRM -- Full 8-Phase Build-Out
- **Phase 0:** Security & tenancy hardening (orgs, RBAC, audit, permission guards)
- **Phase 1:** Core modules (CRUD forms, filters, search, AI insights, calendar, settings)
- **Phase 2:** Ecosystem bridges & communication layer
- **Phase 3:** Complete UI/UX overhaul (dark mode, glassmorphism, semantic design tokens)
- **Phase 4:** Automation, reporting, lead scoring, bulk actions
- **Phase 5-6:** Accounts, contacts, deals, campaigns, invoices, products, quotes
- **Phase 7:** CRM Studio (custom modules, fields, layouts, views, validation rules)
- **Phase 8:** CPQ-lite with vendors, purchase orders, sales orders, print views

### 3.3 Advisor Portal
- CMS-driven command center with real-time content sync
- Resource center with CMS-driven quick links and categories
- Training system: 47 modules, 54 SOPs, certifications, LMS integration (27 lessons)
- Achievements and gamification system
- Rich-text ticket editor with image paste/drop support
- Bulletin system with email notification campaigns
- Chat & notification services (push, email, in-app)
- AI-powered advisor terminal agent
- Meeting management with attendees and reminders
- CMS-driven navigation with analytics

### 3.4 IT Ticketing System (ITSTS)
- Full ITSM platform: tickets, SLA policies, workflows, knowledge base
- SSO integration from advisor portal (sso-itsts-login)
- AI reply suggestions for agents
- Email intake & queue processing
- GoTo phone integration with webhooks
- SLA daemon with multi-level escalation rules (9 rules, 5 policies)
- Daily log reports and staff logging system
- Agent chat with quick responses (13 canned responses)
- 2,867 tickets processed, 281 comments, 343 email notifications sent
- Onedrive OAuth sync for file management

### 3.5 Member App (PWA)
- 7,568 members onboarded (6,863 active)
- 3,898 user accounts, 496 advisors
- MyTelemedicine SSO (v94 -- most iterated function across entire platform)
- Rx card fetch for prescription benefits
- Push notifications with device registration
- Location-based services (check-location)
- Notification management (send-push, mark-read, send-welcome)

### 3.6 Enrollment Systems
- Champion Ecosystem with full enrollment + billing + commissions pipeline
- Multi-product enrollment: Essentials, MEC, Secure HSA, CarePlus, HealthShare
- Authorize.Net payment integration with subscription management
- PCI compliance audit logging (payment data access log)
- Legal documents (11) and enrollment contracts (57)
- Multi-org enrollment (Champion Technologies, Champion TPA)
- Promo code system with redemption tracking
- Price change scheduling with audit trail (122 audit entries)

### 3.7 Security & Compliance Infrastructure
- HIPAA compliance module: policies, risks, incidents, BAAs, trainings, PHI access logs
- SOC 2 controls: security audit log (HMAC-protected), access reviews, change management
- Shared security layer (`_shared/security.ts`): rate limiting, auth, RBAC, audit, HMAC verification
- CORS hardening with dynamic Vercel preview pattern
- Production hostname consolidation to `mpb.health`
- Password management: mass reset, admin reset, forgot password, force-change flows
- Script restriction to public hostnames only

### 3.8 Executive Dashboards (CTO/CEO)
- CTO & CEO dashboards with department data uploads
- Sales staging data (115 orders), lead staging (101), cancellation tracking (70)
- Concierge team management (6 members, 25 issue categories, 251 interactions)
- KPI tracking (7 defined), roadmap items, project management (6 projects)
- Technology inventory (10 tracked), quick links
- Notes system with sharing and notifications

### 3.9 Marketing Platform
- Social media management with WhatsApp integration (4 templates, 8 quick replies)
- CRM: 108 contacts, 32 companies, pipeline management
- Social calendar with 33 scheduled posts
- Enrollment sync from marketing to core (32 agent mappings, 108 member mappings)
- Idea bank (9 ideas), report templates (3), podcast guest management (5)
- Content workspace with Notion-style blocks

### 3.10 Orbit (Work Management Platform)
- Monday.com-style boards, workspaces, automation engine
- 155 tools cataloged, 25 integrations, 40 tool categories
- Station widgets, quicklink galaxies, broadcasts
- 6 role templates, ritual tracking for team habits

### 3.11 Infrastructure & DevOps
- Service worker cache versioning for PWA updates
- 5xx SPA fallback for production resilience
- Query caching with configurable timeouts and diagnostics
- Auth race condition fixes (self-healing ticket pages with silent retry)
- Production hostname consolidation (removed phantom `mpbhealth.com`)
- Shared edge function deployment coordination (`_shared/` change = full redeploy)

---

## 4. Enrollment Pipeline Metrics

### 4.1 Member Distribution by Product (Production -- mpb_health_app)

| Product | Members | % of Total |
|---------|---------|------------|
| SECURE HSA | 4,849 | 64.1% |
| CARE PLUS | 1,115 | 14.7% |
| PREMIUM HSA | 661 | 8.7% |
| PREMIUM CARE | 322 | 4.3% |
| MEC+ ESSENTIALS | 243 | 3.2% |
| DIRECT | 188 | 2.5% |
| Sedera Select+ (Modified) | 148 | 2.0% |
| ESSENTIALS | 14 | 0.2% |
| Other (6 products) | 24 | 0.3% |
| **Total** | **7,564** | **100%** |

**Key insight:** SECURE HSA dominates at 64% of the member base. Top 3 products (Secure HSA, Care Plus, Premium HSA) account for 87.5% of all members.

### 4.2 Member Composition

| Metric | Count |
|--------|-------|
| Primary members | 5,199 |
| Dependents | 2,365 |
| Active members | 6,863 (90.7%) |
| Inactive members | 701 (9.3%) |
| Past inactives (historical) | 3,233 |
| Total registered users | 3,904 |
| Advisors | 496 |

### 4.3 Monthly Member Growth (Production)

| Month | New Members | Trend |
|-------|-------------|-------|
| Dec 2025 | **887** | Peak month |
| Jan 2026 | 257 | |
| Feb 2026 | 190 | |
| Mar 2026 | 184 | (month in progress) |
| Nov 2025 | 326 | |
| Oct 2025 | 111 | |
| Sep 2025 | 155 | |
| Aug 2025 | 114 | |
| Jul 2025 | 88 | |
| Jun 2025 | 94 | |
| May 2025 | 81 | |

**December 2025 spike (887 new members)** was ~3x the surrounding months. Post-December enrollment has stabilized at ~190-260/month.

### 4.4 Champion Ecosystem Enrollment Engine

| Metric | Value |
|--------|-------|
| Enrollment logs | 973 |
| Completed enrollments | 628 (64.5%) |
| Started but not completed | 338 (34.7%) |
| Failed | 6 (0.6%) |
| Warning | 1 (0.1%) |
| Tenants | 2 (Champion Technologies, Champion TPA) |
| Products | 2 (SaudeMax, 2 Easy) |

**Note:** The Champion Ecosystem enrollment engine (`gqdqranldwtpjahcqquz`) has its schema fully built out (enrollments, members, billing, commissions, payment profiles) but core data tables are currently empty. The 973 enrollment logs (628 completed) indicate the pipeline is processing but member/billing records may be flowing to a different system or are in staging.

### 4.5 Champion Production Enrollment Data (Separate System)

The older enrollment system on a separate Supabase project shows the production reality:

| Metric | Value |
|--------|-------|
| Active enrollments | 134 |
| Members | 135 |
| Dependents | 151 |
| Billing records | 531 |
| Payment profiles | 170 |
| Payment transactions | 392 |
| Commissions | 438 |
| Commission tiers | 9 |
| Enrollment links | 35 |
| Agents | 35 |
| Enrollment logs | 4,403 |
| Sent emails | 1,020 |
| Sign-in logs | 510 |
| Enrollment contracts | 57 |
| Legal documents | 11 |
| Admin audit log entries | 1,852 |

### 4.6 mpb_enrollment (Test/Staging)

| Metric | Value |
|--------|-------|
| Enrollments | 6 (5 Active, 1 Pending) |
| Billing records | 12 ($2,348 total) |
| Members | 6 |
| Products | HealthShare Plus (3), Essential (2), Premium (1) |
| Tenants | 2 (Champion Technologies, Champion TPA) |

---

## 5. HIPAA & Security Compliance Status

### 5.1 HIPAA Compliance Module -- UNPOPULATED

The HIPAA compliance module on the CTO Dashboard (`xnijhggwgbxrtvlktviz`) has a fully designed schema but **zero data across all 15 HIPAA-specific tables**:

| Table | Rows | Purpose |
|-------|------|---------|
| hipaa_policies | **0** | Policy registry with review tracking |
| hipaa_risks | **0** | Risk register |
| hipaa_incidents | **0** | Security incident tracking |
| hipaa_baas | **0** | Business Associate Agreements |
| hipaa_trainings | **0** | Training programs |
| hipaa_training_attendance | **0** | Completion records |
| hipaa_audits | **0** | Assessment registry |
| hipaa_tasks | **0** | Compliance task assignments |
| hipaa_audit_log | **0** | Activity audit trail |
| hipaa_evidence | **0** | File attachments/evidence |
| hipaa_docs | **0** | Compliance documents |
| hipaa_phi_access | **0** | PHI access tracking |
| hipaa_breach_notifications | **0** | Breach notification compliance |
| hipaa_mitigations | **0** | Risk mitigation actions |
| hipaa_contacts | **0** | Compliance team roster |

**Assessment: The HIPAA module is 100% schema-complete but 0% operationalized.** No policies have been entered, no risk assessments conducted, no training tracked, no BAAs registered, no PHI access logged through this system.

### 5.2 Compliance Settings (Configured but at Defaults)

| Setting | Value | Status |
|---------|-------|--------|
| PHI encryption enabled | `true` | Configured |
| PHI access log retention | 7 years (2,555 days) | Configured |
| Audit log retention | 7 years (2,555 days) | Configured |
| Session timeout | 15 minutes | Configured |
| Session warning | 60 seconds before timeout | Configured |
| Breach risk thresholds | Low: 25, Med: 50, High: 100, Critical: 500 | Configured |
| Policy review frequency | 12 months (critical: 6 months) | Configured |
| Notification email (from) | compliance@mpbhealth.com | Configured |
| n8n webhook (BAA reminder) | **Empty, disabled** | Not connected |
| n8n webhook (incident alert) | **Empty, disabled** | Not connected |
| Incident auto-assignment | **Disabled, no officer** | Not connected |
| Slack webhook | **Empty, disabled** | Not connected |
| PagerDuty routing key | **Empty, disabled** | Not connected |
| Security officer email | **Empty** | Not connected |
| Default reviewers | **Empty array** | Not connected |

**No `updated_by` field has ever been set** -- all settings remain at their initial defaults.

### 5.3 Security Alert Rules (Defined but Non-Functional)

7 security alert rules are **enabled** but have **no delivery channels connected**:

| Rule | Trigger | Severity | Channels (ALL EMPTY) |
|------|---------|----------|----------------------|
| Multiple Failed Login Attempts | 5 failures in 15 min | CRITICAL | Slack, PagerDuty |
| PHI Bulk Export | 100 exports in 60 min | WARNING | Slack |
| After-Hours PHI Access | PHI view/export/modify | WARNING | Slack |
| Administrative Role Change | Any role change | INFO | Slack |
| Emergency Access Invoked | Break-glass access | CRITICAL | Slack, PagerDuty, Email |
| Security Alert Triggered | Alert/access denied | CRITICAL | Slack, PagerDuty |
| Rate Limit Exceeded | Rate limit hit | CRITICAL | Slack, PagerDuty |

**These rules would trigger correctly but alerts have nowhere to go.** All Slack, PagerDuty, and email destinations are empty strings.

### 5.4 Security Audit Log (Active but Minimal)

| Metric | Value |
|--------|-------|
| Total audit log entries | 35 |
| Event types observed | LOGIN, LOGOUT, SESSION_EXPIRED |
| Severity levels observed | INFO only (no WARNING or CRITICAL) |
| Active users | 2 (vrt@mympb.com, catherine@mympb.com) |
| HMAC integrity | All entries have checksums |

All 35 entries are routine login/logout events. No security incidents, failed logins, PHI access events, or role changes have been recorded.

### 5.5 Security Operations Tables

| Table | Rows | Purpose | Status |
|-------|------|---------|--------|
| security_audit_log | 35 | Login/session tracking | Active (minimal) |
| security_alert_rules | 7 | Alert definitions | Configured, channels disconnected |
| access_reviews | **0** | Quarterly access reviews (SOC 2) | Not started |
| change_requests | **0** | Change management (SOC 2) | Not started |
| emergency_access_log | **0** | Break-glass access | Not started |

### 5.6 Main Website Project Security Tables

| Table | Rows | Status |
|-------|------|--------|
| phi_access_log | **0** | Not logging |
| auth_security_events | **0** | Not logging |
| audit_logs | **0** | Not logging |
| security_alert_webhooks | **0** | Not configured |

### 5.7 Compliance Gap Summary

| Area | Schema | Data | Operational | Priority |
|------|--------|------|-------------|----------|
| HIPAA Policy Management | Done | None | No | P1 |
| Risk Assessment | Done | None | No | P1 |
| BAA Registry | Done | None | No | P1 |
| Training Tracking | Done | None | No | P1 |
| PHI Access Logging | Done | None | No | P1 |
| Incident Response | Done | None | No | P1 |
| Breach Notification | Done | None | No | P1 |
| Security Alert Delivery | Done | Configured | **Disconnected** | P0 |
| Security Audit Logging | Done | Active (35) | Minimal | P2 |
| Access Reviews (SOC 2) | Done | None | No | P2 |
| Change Management (SOC 2) | Done | None | No | P2 |
| Session Management | Done | Active | Working | OK |
| PHI Encryption Setting | Done | Enabled | Working | OK |
| Retention Policies | Done | Configured | Working | OK |

---

## 6. Technical Debt & Consolidation Opportunities

### 6.1 Supabase Project Sprawl

**15 Supabase projects is excessive.** Based on actual data volumes:

| Tier | Projects | Rationale |
|------|----------|-----------|
| **Active production** | 3 | `dtmnkzllidaiqyheguhl` (website/advisor/admin), `qfigouszitcddkhssqxr` (member app), `hhikjgrttgnvojtunmla` (ITSTS) |
| **Active with real data** | 3 | `xnijhggwgbxrtvlktviz` (CTO dashboard), `gqdqranldwtpjahcqquz` (Champion), `tzlvhpultquonblkkpqp` (Marketing) |
| **Seed/test data only** | 3 | `eovklvjkpfuozupmbnwv` (mpb_enrollment, 6 rows), `wndaswxzvammnccbedbq` (Agent System, 7 affiliates), `ciowhwoapfokiiflubxs` (SaudeMax) |
| **Minimal/single-table** | 4 | `phbfdurbbkucjkoxxxms`, `kyeiqnoxgmgudysozged`, `zhlqhdsiaaofgrncgumn`, `ckwknswhgfuziiwjxoww` |
| **Standalone platform** | 2 | `mezijarhetclovsamhoa` (Orbit), `simckkqvsfgyswxccwjh` (CarePlus) |

**Recommendation:** Evaluate pausing the 7 minimal/seed-only projects. Each incurs infrastructure cost and operational overhead. The single-table projects (allowed_states, advisor leads) could be tables in the primary project.

### 6.2 Vercel Project Sprawl

**13+ projects appear to be duplicates or iterations:**

| Cluster | Projects | Recommendation |
|---------|----------|----------------|
| Dashboard (7) | mpowering-dashboards, -cto, -ceo, mpowering-cto, -dashboard, cto, cto-dashboard | Consolidate to **1** |
| Website (3) | mpbhealth-monorepo, -website, website | Consolidate to **1** |
| SaudeMax (3) | saudemax-admin-system, saude-max-website-redesign, saudemax-enroll-test | Archive if SaudeMax inactive |

**Potential reduction: 30 projects down to ~17** (delete 13 stale/duplicate projects).

### 6.3 Empty Tables (Speculative Schema)

Across all 15 Supabase projects, a significant number of tables have 0 rows. In the primary project alone (`dtmnkzllidaiqyheguhl`), an estimated 100+ tables are empty. This pattern indicates speculative schema creation during feature development that was never completed.

**Impact:** Cognitive overhead for developers, confusing data model, migration complexity.
**Recommendation:** Audit 0-row tables against actual code references. Tables with no code references should be dropped via migration.

### 6.4 Ghost Packages (Immediate Cleanup)

| Package | Issue | Action |
|---------|-------|--------|
| `packages/integrations/` | No source files, only stale `dist/` | Delete |
| `packages/services/` | No source files, only stale `dist/` | Delete |
| `packages/assets/` | Zero consumer apps import it | Verify and delete |

### 6.5 Single-Consumer Package Anti-Pattern

`champion-core` (38 source files) is consumed **only** by `advisor-portal`. No other app imports it. This could be folded into `advisor-portal/src/` to reduce package count and build complexity.

### 6.6 Dependency Inconsistencies

| Issue | Details |
|-------|---------|
| **Tiptap version divergence** | `advisor-portal` hardcodes `^3.20.4` for 17 Tiptap packages instead of using `catalog:` like the other 3 apps |
| **Duplicate drag-and-drop libs** | `website` imports both `@dnd-kit/core` AND `@hello-pangea/dnd` |
| **crm-core build fragility** | 25 separate entry points in tsup build command (700+ char build line) |

### 6.7 Zoho SalesIQ Error Firehose

The `zoho_salesiq_errors` table has **49,949 rows** -- mostly noise from:
- Health checks firing every 5 minutes per browser tab
- Preview deployments generating `READY_TIMEOUT` errors (Zoho domain whitelisting)
- No retention policy

**Recommendation:** Add pg_cron retention (delete > 7 days), skip logging in dev/preview, rate-limit client-side inserts.

### 6.8 Admin Portal Dual-System Problem

**The single largest source of technical debt:**
- **45 website admin pages** at `apps/website/src/pages/admin/` -- zero RBAC, zero audit logging
- **61 admin-portal pages** at `apps/admin-portal/src/pages/` -- proper RBAC and audit
- Both write to the same Supabase tables with no coordination
- 8 P1 gaps documented in [admin portal audit](project_admin_portal_control_center.md)
- Safe build order ready, Second Pass not yet started

### 6.9 Edge Function Risks

| Issue | Details |
|-------|---------|
| **`_shared/` change blast radius** | Any change to 6 shared files requires redeploying all 42 functions. No automation enforces this. Stale bundles cause production CORS/auth failures. |
| **Dead function: `send-crm-email` v1** | v2 exists and is the active version. v1 has zero code references. |
| **Large monolithic functions** | `ticket-proxy` (1,122 lines, 7 action cases), `mail-sync` (937 lines) |

---

## 7. Prioritized Roadmap Recommendations

### P0 -- Critical (This Week)

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | **Connect security alert channels** -- Configure Slack webhook, PagerDuty routing key, and security officer email in compliance_settings. 7 alert rules are firing into the void. | 1 hour | Security incidents would go undetected today |
| 2 | **Populate HIPAA compliance officer contact** -- Set `security_officer_email` and `incident_auto_assignment.officer_id` | 30 min | Required for incident response chain |

### P1 -- High Priority (Next 2 Weeks)

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 3 | **Operationalize HIPAA module** -- Enter existing policies, register BAAs, log current risk assessments. The schema is ready; it needs data. | 2-3 days | Compliance readiness for audits |
| 4 | **Add zoho_salesiq_errors retention** -- pg_cron job to delete rows > 7 days | 1 hour | Stop unbounded table growth (50K+ rows) |
| 5 | **Delete ghost packages** (integrations, services) | 30 min | Reduce confusion |
| 6 | **Delete 10+ stale Vercel projects** | 1 hour | Reduce sprawl, save team slots |
| 7 | **Delete `send-crm-email` v1 edge function** | 30 min | Remove dead code |

### P2 -- Medium Priority (Next 30 Days)

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 8 | **Execute admin portal Second Pass** -- Migrate 8 P1 capabilities from website admin, add deprecation banners | 1-2 weeks | Eliminate dual-admin risk |
| 9 | **Normalize Tiptap versions** to catalog across all apps | 1 hour | Prevent version drift |
| 10 | **Add `_shared/` change detection** -- CI script that auto-redeploys all edge functions when shared files change | 2-3 hours | Prevent production CORS failures |
| 11 | **Merge champion-core into advisor-portal** | 2 hours | Reduce package count |
| 12 | **Consolidate drag-and-drop libraries** in website | 1-2 hours | Remove duplicate dependency |
| 13 | **Audit and pause minimal Supabase projects** -- 7 candidates with single tables or seed data only | 2 hours | Reduce infrastructure cost |

### P3 -- Long-Term (Next Quarter)

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 14 | **Refactor crm-core build** -- Replace 25 manual entry points with glob-based tsup config or split into sub-packages | 1 week | Build maintainability |
| 15 | **Decompose ticket-proxy** -- Split 1,122-line function into per-action edge functions | 1 week | Reduce deployment blast radius |
| 16 | **Consolidate enrollment systems** -- Three separate enrollment backends (mpb_enrollment, Champion, join-mpb-health) should converge | 2-4 weeks | Operational simplicity |
| 17 | **SOC 2 operational controls** -- Begin quarterly access reviews, change request tracking, emergency access procedures | Ongoing | Audit readiness |
| 18 | **Empty table cleanup** -- Audit 100+ zero-row tables against code references, drop unused tables | 1 week | Schema clarity |

---

## Appendix A: Live Domain Map

| Domain | App | Supabase Project |
|--------|-----|------------------|
| mpb.health | website | dtmnkzllidaiqyheguhl |
| app.mpb.health | mpb-pwa-app | qfigouszitcddkhssqxr |
| advisor.mpb.health | advisor-portal | dtmnkzllidaiqyheguhl |
| admin.mpb.health | admin-portal | qfigouszitcddkhssqxr |
| crm.mpb.health | crm | dtmnkzllidaiqyheguhl |
| support.mpb.health | support-system | hhikjgrttgnvojtunmla |

**Note:** `mpbhealth.com` does not exist and is a phantom domain. Any references to it should be removed.

## Appendix B: Supabase Project ID Quick Reference

| Short Name | Project ID |
|------------|-----------|
| Website/Advisor/CRM | `dtmnkzllidaiqyheguhl` |
| Member App | `qfigouszitcddkhssqxr` |
| ITSTS | `hhikjgrttgnvojtunmla` |
| CTO Dashboard | `xnijhggwgbxrtvlktviz` |
| Champion | `gqdqranldwtpjahcqquz` |
| Enrollment | `eovklvjkpfuozupmbnwv` |
| Marketing | `tzlvhpultquonblkkpqp` |
| Agent System | `wndaswxzvammnccbedbq` |
| Advisor LP | `phbfdurbbkucjkoxxxms` |
| HealthShare | `kyeiqnoxgmgudysozged` |
| SaudeMax | `ciowhwoapfokiiflubxs` |
| Orbit | `mezijarhetclovsamhoa` |
| DH Advisor LP | `zhlqhdsiaaofgrncgumn` |
| CarePlus | `simckkqvsfgyswxccwjh` |
| Bolt/HS Enroll | `ckwknswhgfuziiwjxoww` |

---

*Generated from live platform data on March 24, 2026.*

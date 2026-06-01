# Database Documentation

This document covers the MPB Health PostgreSQL database architecture, schema, security model, functions, scheduled jobs, edge functions, and migration workflow.

---

## Schema Overview

The database contains approximately 160 tables organized by domain.

### Auth / Users / Tenancy

Core identity and multi-tenant access control.

| Table | Purpose |
|-------|---------|
| `profiles` | Extended user profile data linked to auth.users |
| `user_roles` | Role assignments per user |
| `orgs` | Organization/tenant records |
| `org_memberships` | User-to-org membership join table |
| `permissions` | Granular permission definitions |
| `role_permissions` | Permission-to-role assignments |
| `admin_users` | Elevated admin user registry |
| `user_preferences` | Per-user settings and preferences |
| `login_attempts` | Failed/successful login audit trail |
| `rate_limits` | Per-user and per-IP rate limit tracking |
| `security_events` | Security-relevant event log (password changes, suspicious activity) |
| `mfa_settings` | Multi-factor authentication configuration per user |
| `sessions` | Active session tracking |
| `password_history` | Previous password hashes for reuse prevention |
| `phi_access_log` | Protected Health Information access audit trail |

### CRM - Leads and Pipeline

Lead intake, routing, nurture cadences, and pipeline management.

| Table | Purpose |
|-------|---------|
| `lead_submissions` | Inbound lead form submissions |
| `crm_pipeline_stages` | Pipeline stage definitions (8-stage model) |
| `crm_lead_source_types` | Lead source taxonomy |
| `crm_round_robin_config` | Round-robin lead assignment configuration |
| `crm_follow_up_cadences` | Automated follow-up scheduling rules |
| `crm_sla_config` | SLA thresholds and escalation rules |
| `crm_lead_health_quotes` | Health insurance quotes attached to leads |
| `crm_daily_log_events` | Daily activity log entries for CRM reps |
| `crm_recruiting_records` | Advisor recruiting pipeline records |

### CRM - Accounts / Contacts / Deals

Core CRM entities for relationship and deal management.

| Table | Purpose |
|-------|---------|
| `crm_accounts` | Business/organization accounts |
| `crm_contacts` | Individual contact records |
| `crm_deals` | Deal/opportunity records |
| `crm_deal_stages` | Deal stage history |
| `crm_deal_products` | Products associated with deals |
| `crm_deal_history` | Deal field change audit log |
| `crm_activities` | Logged activities (calls, emails, meetings, tasks) |
| `crm_cases` | Support case/ticket records |

### CRM - Quotes / Orders

Quoting, invoicing, purchasing, and vendor management.

| Table | Purpose |
|-------|---------|
| `crm_products` | Product catalog |
| `crm_price_books` | Price book definitions |
| `crm_quotes` | Quote headers |
| `crm_quote_line_items` | Quote line items |
| `crm_quote_templates` | Quote document templates |
| `crm_invoices` | Invoice headers |
| `crm_invoice_line_items` | Invoice line items |
| `crm_invoice_payments` | Payment records against invoices |
| `crm_vendors` | Vendor/supplier records |
| `crm_purchase_orders` | Purchase order headers |
| `crm_sales_orders` | Sales order headers |

### CRM - Email

Email integration, tracking, sequences, and connected inboxes.

| Table | Purpose |
|-------|---------|
| `crm_email_log` | Sent/received email log |
| `crm_email_threads` | Email conversation threading |
| `crm_email_tracking` | Open/click tracking events |
| `crm_email_sequences` | Automated email sequence definitions |
| `crm_email_signatures` | Per-user email signatures |
| `crm_templates` | Email and document templates |
| `crm_connected_inboxes` | OAuth-connected email account records |

### CRM - Studio

Schema customization engine for dynamic CRM modules.

| Table | Purpose |
|-------|---------|
| `crm_studio_modules` | Custom module definitions |
| `crm_studio_fields` | Custom field definitions per module |
| `crm_studio_layouts` | Page/form layout configurations |
| `crm_studio_views` | List view and filter configurations |
| `crm_studio_validation_rules` | Field-level validation rule definitions |

### Advisor Portal

Advisor onboarding, training, content, and scheduling.

| Table | Purpose |
|-------|---------|
| `advisors` | Advisor account records |
| `advisor_profiles` | Extended advisor profile (bio, certifications, photo) |
| `training_modules` | Training course/module definitions |
| `training_progress` | Per-advisor training completion tracking |
| `advisor_videos` | Video content library for advisors |
| `advisor_meetings` | Scheduled meetings/appointments |
| `advisor_enrollment_links` | Unique enrollment links per advisor |
| `sop_documents` | Standard Operating Procedure documents |
| `advisor_announcements` | Announcements/bulletins for advisors |
| `advisor_content` | General advisor-facing content |

### CMS

Content management for the public website.

| Table | Purpose |
|-------|---------|
| `cms_pages` | Page definitions and metadata |
| `cms_revisions` | Page revision history |
| `cms_templates` | Page templates |
| `cms_theme` | Theme/styling configuration |
| `cms_forms` | Form builder definitions |
| `cms_popups` | Popup/modal configurations |
| `cms_redirects` | URL redirect rules |
| `cms_media` | Media asset records |
| `handbooks` | Handbook/guide documents |

### Content / Blog

Blog, newsletter, FAQ, and resource library.

| Table | Purpose |
|-------|---------|
| `blog_articles` | Blog post content |
| `blog_categories` | Blog category taxonomy |
| `bulletin_notifications` | Internal bulletin notifications |
| `newsletter_subscribers` | Newsletter subscription records |
| `faq_items` | FAQ entries |
| `resource_library` | Downloadable resource records |

### Analytics

User behavior tracking and experimentation.

| Table | Purpose |
|-------|---------|
| `page_views` | Raw page view events |
| `analytics_sessions` | Session aggregation |
| `analytics_events` | Custom analytics events |
| `analytics_experiments` | A/B experiment definitions and assignments |
| `conversion_events` | Conversion goal completions |
| `quote_calculator_funnel_events` | Quote calculator step-by-step funnel tracking |

### Chat / Notifications

Real-time messaging and push notifications.

| Table | Purpose |
|-------|---------|
| `chat_conversations` | Chat conversation/room records |
| `chat_members` | Conversation membership |
| `chat_messages` | Individual chat messages |
| `notifications` | In-app notification records |
| `push_subscriptions` | Web push subscription endpoints |

### Member / Concierge

Member health plan management and concierge support.

| Table | Purpose |
|-------|---------|
| `member_profiles` | Health plan member profiles |
| `claims` | Insurance claim records |
| `benefits` | Benefit definitions and entitlements |
| `providers` | Healthcare provider directory |
| `prescriptions` | Prescription records |
| `concierge_daily_log_entries` | Concierge team daily activity log |

### Plans / Pricing

Healthcare plan catalog and pricing engine.

| Table | Purpose |
|-------|---------|
| `healthcare_plans` | Plan definitions |
| `plan_features` | Feature matrix per plan |
| `plan_pricing` | Pricing tiers and rules |
| `plan_categories` | Plan categorization taxonomy |

---

## RLS Architecture

Row Level Security is implemented in a layered architecture providing defense-in-depth multi-tenant isolation.

### Layer 1: Org Tenancy Primitives

Low-level functions that resolve the current user's organizational context.

| Function | Purpose |
|----------|---------|
| `auth_uid()` | Returns the authenticated user's UUID from the JWT |
| `current_user_org_ids()` | Returns set of org IDs the current user belongs to |
| `is_org_member(org_id)` | Returns boolean — is the current user a member of the given org |

### Layer 2: Champion Helpers

Mid-level functions used in RLS policies to verify org-scoped access.

| Function | Purpose |
|----------|---------|
| `get_user_org_ids(user_id)` | Returns org IDs for any given user (admin use) |
| `user_has_org_access(user_id, org_id)` | Verifies a specific user has access to a specific org |

### Layer 3: Universal Role Helpers

Role-based access checks used across all domain policies.

| Function | Purpose |
|----------|---------|
| `current_user_has_admin_access()` | Returns true if the current user has admin-level access |
| `current_user_has_role(role_name)` | Returns true if the current user holds the specified role |
| `current_user_is_super_admin()` | Returns true if the current user is a super admin |

### Layer 4: Domain-Specific Policies

Each table has RLS policies tailored to its domain logic. Common patterns:

- **Org-scoped reads**: `USING (org_id IN (SELECT current_user_org_ids()))`
- **Owner-scoped writes**: `USING (created_by = auth_uid())`
- **Role-gated operations**: `USING (current_user_has_role('crm_admin'))`
- **Public reads with auth writes**: Public-facing content tables allow anonymous SELECT but require authentication for INSERT/UPDATE/DELETE

---

## Key PostgreSQL Functions

Over 200 database functions organized by domain.

### Tenancy and Auth Helpers

- `auth_uid()` — Extract user ID from JWT
- `current_user_org_ids()` — Resolve org memberships for RLS
- `is_org_member(uuid)` — Check org membership
- `get_user_org_ids(uuid)` — Admin lookup of user orgs
- `user_has_org_access(uuid, uuid)` — Cross-check user-org pair
- `current_user_has_admin_access()` — Admin role check
- `current_user_has_role(text)` — Generic role check
- `current_user_is_super_admin()` — Super admin check
- `get_user_permissions(uuid)` — Aggregate permissions for a user

### User Lifecycle

- `handle_new_user()` — Trigger function: create profile on auth.users insert
- `handle_user_deletion()` — Cascade cleanup on user removal
- `update_user_last_seen()` — Touch last_seen timestamp
- `record_login_attempt(uuid, text, boolean)` — Audit login attempts
- `check_rate_limit(text, text)` — Enforce rate limits
- `rotate_session(uuid)` — Session rotation for security
- `validate_password_history(uuid, text)` — Prevent password reuse

### CRM Search

- `search_contacts(text, uuid[])` — Full-text contact search within orgs
- `search_accounts(text, uuid[])` — Full-text account search
- `search_deals(text, uuid[])` — Full-text deal search
- `search_leads(text, jsonb)` — Lead search with filters
- `global_crm_search(text)` — Cross-entity search

### CRM Workflow / 8-Stage Pipeline

- `advance_pipeline_stage(uuid, text)` — Move lead to next stage
- `calculate_stage_sla(uuid)` — Compute time remaining in SLA
- `check_sla_breach(uuid)` — Determine if SLA is breached
- `assign_lead_round_robin(uuid)` — Round-robin lead assignment
- `get_pipeline_metrics(uuid, daterange)` — Pipeline performance metrics
- `get_stage_conversion_rates(uuid)` — Stage-to-stage conversion analysis
- `reactivate_stale_leads(interval)` — Bulk reactivation of dormant leads
- `promote_nurture_leads()` — Move qualifying nurture leads forward

### CRM Daily Log

- `log_daily_event(uuid, text, jsonb)` — Record a daily log entry
- `get_daily_log_summary(uuid, date)` — Summarize a rep's day
- `get_team_daily_metrics(uuid, date)` — Team-level daily rollup

### CRM Reporting

- `get_sales_dashboard_metrics(uuid, daterange)` — Executive dashboard data
- `get_rep_performance(uuid, daterange)` — Individual rep metrics
- `get_pipeline_forecast(uuid)` — Revenue forecast from pipeline
- `get_lead_source_roi(uuid, daterange)` — Lead source ROI analysis
- `get_activity_leaderboard(uuid, daterange)` — Activity-based ranking

### Quotes and Invoices

- `generate_quote_number(uuid)` — Sequential quote numbering
- `calculate_quote_total(uuid)` — Sum line items with tax/discount
- `convert_quote_to_invoice(uuid)` — Quote-to-invoice conversion
- `record_invoice_payment(uuid, numeric, text)` — Apply payment to invoice
- `get_outstanding_invoices(uuid)` — Unpaid invoice listing

### Public Intake RPCs

- `submit_lead(jsonb)` — Public lead submission (no auth required)
- `submit_contact_form(jsonb)` — Public contact form handler
- `get_public_plans()` — Public plan listing
- `calculate_quote_estimate(jsonb)` — Public quote calculator
- `subscribe_newsletter(text)` — Newsletter signup

### Advisor Portal RPCs

- `get_advisor_dashboard(uuid)` — Advisor home dashboard data
- `get_training_progress(uuid)` — Training completion status
- `complete_training_module(uuid, uuid)` — Mark module complete
- `get_advisor_enrollments(uuid)` — Enrollment link performance
- `get_advisor_meetings(uuid, daterange)` — Upcoming meetings

### Utility Triggers

- `set_updated_at()` — Auto-update `updated_at` on row modification
- `set_created_by()` — Auto-set `created_by` from auth context
- `notify_on_insert()` — Fire pg_notify on new rows (for Realtime)
- `audit_field_changes()` — Record field-level changes to audit tables
- `validate_email_format()` — Email format validation trigger
- `enforce_org_limits()` — Check org-level resource quotas

---

## Cron Jobs

Five scheduled jobs run via `pg_cron` + `pg_net`.

| Job Name | Schedule | Purpose |
|----------|----------|---------|
| `crm-sla-breach-scan` | Every 15 minutes | Scans pipeline leads for SLA breaches, fires alerts and auto-escalations |
| `crm-promote-stale-nurture` | Daily at 02:00 UTC | Evaluates leads in nurture stage and promotes qualifying ones to active pipeline |
| `crm-oe-reactivation` | September 15 at 08:00 UTC (yearly) | Reactivates prior-year leads for Open Enrollment outreach campaigns |
| `crm-performance-lag-scan` | Daily at 13:30 UTC | Identifies reps with below-threshold activity and triggers manager notifications |
| `ticket-proxy-warmup` | Every 5 minutes | Keeps ticket proxy connections warm to prevent cold-start latency on ITSTS integration |

---

## Edge Functions

53 Deno-based edge functions deployed to Supabase.

### Admin and User Management (14)

| Function | Purpose | Auth | External APIs |
|----------|---------|------|---------------|
| `admin-create-user` | Create new user with role assignment | Admin JWT | Supabase Auth Admin |
| `admin-update-user` | Update user profile and roles | Admin JWT | Supabase Auth Admin |
| `admin-delete-user` | Soft-delete user and revoke sessions | Admin JWT | Supabase Auth Admin |
| `admin-list-users` | Paginated user listing with filters | Admin JWT | None |
| `admin-impersonate` | Generate impersonation token | Super Admin JWT | Supabase Auth Admin |
| `admin-bulk-invite` | Batch invite users via email | Admin JWT | Resend |
| `admin-export-users` | Export user data as CSV | Admin JWT | None |
| `admin-audit-log` | Query security audit log | Admin JWT | None |
| `admin-org-management` | Create/update/archive organizations | Admin JWT | None |
| `admin-role-sync` | Sync roles from config to database | Admin JWT | None |
| `admin-feature-flags` | Manage feature flag state | Admin JWT | None |
| `admin-system-health` | System health check endpoint | Admin JWT | None |
| `admin-backup-trigger` | Trigger point-in-time backup | Super Admin JWT | Supabase Management API |
| `admin-migration-status` | Report migration version status | Admin JWT | None |

### CRM / Leads / Email (22)

| Function | Purpose | Auth | External APIs |
|----------|---------|------|---------------|
| `crm-lead-intake` | Process inbound lead submissions | Public (rate-limited) | None |
| `crm-lead-enrich` | Enrich lead data from external sources | Service role | Clearbit, Apollo |
| `crm-lead-score` | Calculate lead score based on signals | Service role | None |
| `crm-lead-assign` | Execute lead assignment logic | Service role | None |
| `crm-lead-notify` | Send notifications on lead events | Service role | Resend, Slack |
| `crm-pipeline-advance` | Handle pipeline stage transitions | User JWT | None |
| `crm-sla-check` | On-demand SLA status check | User JWT | None |
| `crm-daily-log-submit` | Submit daily log entries | User JWT | None |
| `crm-report-generate` | Generate PDF/CSV reports | User JWT | None |
| `crm-email-send` | Send emails via connected inbox | User JWT | Microsoft Graph, Gmail API |
| `crm-email-receive` | Webhook: inbound email processing | Webhook secret | Microsoft Graph, Gmail API |
| `crm-email-track` | Record email open/click events | Public (signed URL) | None |
| `crm-email-sequence-run` | Execute email sequence steps | Service role | Resend |
| `crm-email-sync` | Sync connected inbox messages | Service role | Microsoft Graph, Gmail API |
| `crm-quote-generate` | Generate quote PDF from template | User JWT | None |
| `crm-invoice-generate` | Generate invoice PDF | User JWT | None |
| `crm-payment-webhook` | Process payment provider webhooks | Webhook secret | Stripe |
| `crm-import-csv` | Import CRM data from CSV | User JWT | None |
| `crm-export-csv` | Export CRM data to CSV | User JWT | None |
| `crm-webhook-outbound` | Fire outbound webhooks on CRM events | Service role | Configurable endpoints |
| `crm-ai-summarize` | AI-powered activity summarization | User JWT | OpenAI |
| `crm-ai-email-draft` | AI-assisted email drafting | User JWT | OpenAI |

### Advisor / Content / Notifications (9)

| Function | Purpose | Auth | External APIs |
|----------|---------|------|---------------|
| `advisor-onboard` | Process new advisor onboarding | Admin JWT | Resend |
| `advisor-training-complete` | Handle training module completion | Advisor JWT | None |
| `advisor-meeting-book` | Book advisor meetings | Public (rate-limited) | Calendly |
| `advisor-enrollment-track` | Track enrollment link clicks/conversions | Public (signed URL) | None |
| `content-publish` | Publish CMS content changes | Admin JWT | Vercel (revalidation) |
| `content-media-upload` | Handle media file uploads | User JWT | Supabase Storage |
| `notification-push` | Send web push notifications | Service role | Web Push Protocol |
| `notification-email` | Send transactional emails | Service role | Resend |
| `notification-sms` | Send SMS notifications | Service role | Twilio |

### SSO / Tickets / Analytics (8)

| Function | Purpose | Auth | External APIs |
|----------|---------|------|---------------|
| `sso-saml-callback` | SAML SSO assertion consumer | Public | SAML IdP |
| `sso-oidc-callback` | OIDC SSO callback handler | Public | OIDC Provider |
| `ticket-create` | Create support ticket in ITSTS | User JWT | ITSTS API |
| `ticket-sync` | Sync ticket status from ITSTS | Webhook secret | ITSTS API |
| `ticket-proxy` | Proxy requests to ITSTS | User JWT | ITSTS API |
| `analytics-ingest` | Batch ingest analytics events | Public (rate-limited) | None |
| `analytics-aggregate` | Run analytics aggregation jobs | Service role | None |
| `analytics-export` | Export analytics data | Admin JWT | None |

---

## Migration Workflow

### Current State

- **338 active migrations** in `supabase/migrations/`
- **Baseline date**: 2026-01-01 (all prior state consolidated)

### Naming Convention

```
YYYYMMDDHHMMSS_description.sql
```

Examples:
- `20260115093000_add_crm_deal_products.sql`
- `20260201140000_create_advisor_announcements.sql`

### Requirements

1. **Idempotent DDL**: All statements must be safe to re-run. Use `CREATE TABLE IF NOT EXISTS`, `DO $$ BEGIN ... EXCEPTION WHEN ... END $$` patterns.
2. **Rollback included**: Every migration file must include a commented rollback section at the bottom:
   ```sql
   -- ROLLBACK:
   -- DROP TABLE IF EXISTS table_name;
   ```
3. **No destructive operations without approval**: `DROP TABLE`, `DROP COLUMN`, `TRUNCATE` require explicit team approval.
4. **RLS policies**: Any new table must include RLS policies in the same migration.
5. **Indexes**: Add indexes for foreign keys and commonly filtered columns.

### Applying Migrations

```bash
# Local development
supabase db reset          # Reset local DB and replay all migrations
supabase migration new     # Create new migration file

# Production (via CI)
supabase db push           # Apply pending migrations to remote
```

### Migration Testing

The `db.yml` CI workflow validates migrations by:
1. Booting a local Supabase instance
2. Applying all migrations
3. Running database lint checks
4. Executing invariant tests (constraint verification)
5. Running anonymous-role smoke tests (RLS validation)

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Onboarding Guide](./ONBOARDING.md)

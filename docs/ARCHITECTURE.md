# Architecture Overview

> MPB Health Platform -- Enterprise health benefits management

This document describes the architecture of the MPB Health monorepo: how the
system is structured, how data flows between services, and how each layer is
deployed and secured.

---

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [App Topology](#app-topology)
- [Package Dependency Graph](#package-dependency-graph)
- [Data Flow](#data-flow)
- [Auth and Authorization](#auth-and-authorization)
- [Database Architecture](#database-architecture)
- [Edge Functions](#edge-functions)
- [Deployment Pipeline](#deployment-pipeline)
- [Security Model](#security-model)
- [Domain Map](#domain-map)

---

## System Overview

The platform is a **Turborepo + pnpm workspaces** monorepo containing:

- **6 applications** -- React 18 SPAs built with Vite 7 and Tailwind CSS
- **17 shared packages** -- domain logic, UI components, auth, config, utilities
- **Supabase backend** -- PostgreSQL 17 database with Row-Level Security, 200+
  server-side functions, and 53 Deno edge functions
- **Vercel hosting** -- each app deployed as a separate Vercel project with SPA
  rewrites
- **GitHub Actions CI** -- lint, typecheck, security scanning, and database
  migration workflows

All apps consume a shared Supabase project. Business logic lives in shared
`*-core` packages so that it can be reused across portals without duplication.

---

## Architecture Diagram

```
                            +------------------+
                            |   Vercel Edge    |
                            |   (CDN / SPA)    |
                            +--------+---------+
                                     |
         +----------+----------+-----+-----+----------+----------+
         |          |          |           |          |          |
    +----+---+ +----+---+ +---+----+ +----+---+ +----+---+ +----+---+
    |website | |advisor | |admin   | |concierge| |staff  | | crm    |
    |:5173   | |portal  | |portal  | |portal   | |hub    | |:5174   |
    |        | |:5175   | |:5176   | |:5179    | |:5178  | |DEPR.   |
    +----+---+ +----+---+ +---+----+ +----+---+ +----+---+ +--------+
         |          |          |           |          |
         +----------+-----+---+-----------+----------+
                          |
              +-----------+-----------+
              |  Shared Packages      |
              |  (ui, auth, config,   |
              |   *-core, utils, ...) |
              +-----------+-----------+
                          |
              +-----------+-----------+
              |  Supabase Client      |
              |  (@mpbhealth/database)|
              +-----------+-----------+
                          |
              +-----------+-----------+
              |  Supabase Platform    |
              |  +-----------------+  |
              |  | PostgreSQL 17   |  |
              |  | ~160 tables     |  |
              |  | 200+ functions  |  |
              |  | 1000+ RLS       |  |
              |  | 5 pg_cron jobs  |  |
              |  +-----------------+  |
              |  +-----------------+  |
              |  | 53 Edge Funcs   |  |
              |  | (Deno runtime)  |  |
              |  +-----------------+  |
              |  +-----------------+  |
              |  | Supabase Auth   |  |
              |  | Realtime        |  |
              |  | Storage         |  |
              |  +-----------------+  |
              +-----------------------+
                          |
              +-----------+-----------+
              | External Integrations |
              | Resend, Mailchimp,    |
              | Microsoft Graph,      |
              | Gmail, LinkedIn,      |
              | GoTo Connect,         |
              | Calendly, Cloudflare  |
              | Turnstile, Gemini AI  |
              +-----------------------+
```

---

## App Topology

| App | Path | Domain | Port | Status | Description |
|-----|------|--------|------|--------|-------------|
| `website` | `apps/website` | mpb.health | 5173 | Active | Main marketing site with embedded admin CMS |
| `crm` | `apps/crm` | crm.mpb.health | 5174 | **Deprecated** | Legacy CRM (replaced by external aryx-crm repo) |
| `advisor-portal` | `apps/advisor-portal` | advisor.mpb.health | 5175 | Active | Advisor/broker portal with PWA support |
| `admin-portal` | `apps/admin-portal` | admin.mpb.health | 5176 | Active | Staff admin command center |
| `concierge-portal` | `apps/concierge-portal` | concierge.mpb.health | 5179 | Active | Concierge/member services portal |
| `staff-hub` | `apps/staff-hub` | (internal) | 5178 | Active | Internal SSO launcher/hub |

Every app is a **React 18 + Vite 7 SPA** using React Router v6 for client-side
routing and TanStack Query for server-state management. Each app has its own
`vercel.json` with SPA rewrites so that all routes resolve to `index.html`.

### App responsibilities

- **website** -- Public-facing marketing pages, quote request forms, embedded
  CMS for staff content editing. No authentication required for public pages.
- **crm** -- DEPRECATED. Full CRM with lead management, pipeline, email, quoting.
  The domain now points to the external `aryx-crm` repository.
- **advisor-portal** -- Advisor dashboard, training modules, lead management,
  support tickets, chat, video library. Includes PWA manifest and service worker
  for offline capability.
- **admin-portal** -- Internal admin dashboard for user management, enrollment
  tracking, content management, analytics, and system configuration. Has
  granular per-user permission arrays.
- **concierge-portal** -- Member services interface with training resources,
  quick links, and concierge workflows.
- **staff-hub** -- Lightweight SSO launcher that routes authenticated staff to
  the correct portal based on their role.

---

## Package Dependency Graph

```
apps/
  website         --> ui, config, utils, admin-core, database, auth
  advisor-portal  --> ui, config, utils, advisor-core, champion-core, plans-core, database, auth
  admin-portal    --> ui, config, utils, admin-core, plans-core, licensing, database, auth
  concierge-portal --> ui, config, utils, concierge-core, database, auth
  staff-hub       --> ui, config, utils, auth, database
  crm (deprecated)--> ui, config, utils, crm-core, database, auth

packages/
  crm-core        --> database, auth, config, utils
  admin-core      --> database, auth, config, utils
  advisor-core    --> database, auth, config, utils
  champion-core   --> database, auth, config, utils
  concierge-core  --> config, utils
  plans-core      --> database, config, utils
  licensing       --> database, config, utils
  auth            --> database, config
  ui              --> config, utils
  form-embed      --> ui, config
  database        --> config
  utils           --> (leaf)
  config          --> (leaf)
  assets          --> (leaf, static files)
  eslint-config   --> (tooling)
  tailwind-config --> (tooling)
  typescript-config -> (tooling)
```

### Package descriptions

| Package | Purpose |
|---------|---------|
| `database` | Supabase client singleton, auto-generated TypeScript types from the database schema, auth helpers, realtime subscription hooks |
| `auth` | Authentication context provider, MFA enrollment/verification, role and permission guards, SSO integration, session management |
| `config` | Environment variable helpers, company constants, domain mapping, feature flags |
| `ui` | Shared React component library with theme system (light/dark mode), MPB and ARYX branding support |
| `utils` | Formatters (currency, dates, phone), validators, CSV export, HTML sanitization, structured logging, Zod schemas |
| `crm-core` | Full CRM domain layer with 40+ subpath exports covering leads, pipeline stages, email campaigns, quoting, tasks, contacts, and more |
| `admin-core` | Admin/CMS services: user management, enrollment tracking, content publishing, CMS page editing, analytics dashboards |
| `advisor-core` | Advisor domain logic: training modules, lead distribution, chat/messaging, support tickets, video library |
| `champion-core` | "Champion Advisor OS" -- priority routing lanes, engagement scoring, compliance tracking, billing management, gamification/leaderboards |
| `concierge-core` | Concierge static data layer: training resource catalogs, quick-link directories |
| `plans-core` | Health plan management, pricing table CRUD, rate calculation engine |
| `licensing` | Module licensing and feature flag evaluation, white-label tenant configuration, tenant provisioning logic |
| `form-embed` | Embeddable CRM web form component for external sites |
| `assets` | Shared static assets (logos, images) consumed by apps and `ui` |
| `eslint-config` | Shared ESLint configuration presets |
| `tailwind-config` | Shared Tailwind CSS configuration and theme tokens |
| `typescript-config` | Shared `tsconfig.json` base files |

---

## Data Flow

### Typical request lifecycle

```
 Browser (React SPA)
    |
    |  1. User action triggers TanStack Query mutation/query
    v
 Supabase JS Client (@mpbhealth/database)
    |
    |  2a. Direct DB query   |  2b. Edge Function call
    |   (via PostgREST)      |   (via supabase.functions.invoke)
    v                        v
 PostgreSQL                Edge Function (Deno)
    |                        |
    |  3. RLS policies       |  3. Business logic, external API calls
    |     enforced           |     (Resend, Mailchimp, etc.)
    v                        v
 Response rows             JSON response
    |                        |
    +------------------------+
    |
    v
 TanStack Query cache --> React re-render
```

### Realtime data

Selected tables use Supabase Realtime (PostgreSQL logical replication) to push
changes to connected clients. The `database` package provides hooks that
subscribe to realtime channels and update the TanStack Query cache.

### State management

- **Server state** -- TanStack Query with configurable stale times per domain
- **Client state** -- React context for auth, theme, and transient UI state
- **URL state** -- React Router v6 search params for filters, pagination, tabs
- **Persistent local state** -- `localStorage` for user preferences and PWA data

---

## Auth and Authorization

### Authentication

Authentication is handled by **Supabase Auth** using email/password credentials.
The auth flow:

1. User submits credentials to Supabase Auth
2. Supabase returns a JWT with the user's `sub` (user ID)
3. The `@mpbhealth/auth` package stores the session and provides it via React context
4. The JWT is attached to every Supabase client request automatically
5. MFA can be enrolled and verified through the auth package's MFA helpers

### Role model

Global roles are stored in the `user_roles` table and attached to the JWT via
a custom Supabase hook or queried at session start:

| Role | Scope | Description |
|------|-------|-------------|
| `super_admin` | Global | Full system access, all portals |
| `admin` | Global | Staff admin access |
| `advisor` | Global | Advisor portal access |
| `crm_user` | Org-scoped | CRM access within an organization |
| `member` | Global | End-user/member access |
| `concierge` | Global | Concierge portal access |

### Organization-scoped permissions

CRM operations are scoped to organizations via the `orgs` and
`org_memberships` tables. A user's effective permissions within the CRM are
determined by their org membership role.

### Admin portal permissions

The admin portal uses a **per-user permissions array** stored on the user
profile. Each permission corresponds to a feature area (e.g.,
`manage_users`, `edit_content`, `view_analytics`). The admin UI checks these
permissions client-side via guards, and RLS policies enforce them server-side.

### Session management

- Sessions are managed by Supabase Auth with configurable JWT expiry
- The `auth` package handles token refresh, session persistence, and logout
- SSO integration routes through the `staff-hub` app for internal users

---

## Database Architecture

### Overview

- **~160 tables** across domains: users, orgs, CRM, plans, content, analytics
- **200+ PostgreSQL functions** for business logic, triggers, and computed fields
- **1000+ RLS (Row-Level Security) policies** enforcing tenant isolation and
  role-based access at the database level
- **5 pg_cron jobs** for scheduled tasks (cleanup, aggregation, notifications)
- **PostgreSQL 17** on Supabase-managed infrastructure

### Tenancy model

Multi-tenancy is implemented via org-scoping:

```
users
  |-- user_roles (global roles)
  |-- org_memberships (org + role)
        |-- orgs (tenant boundary)
              |-- leads, contacts, policies, ... (org_id FK)
```

Every org-scoped table has an `org_id` foreign key. RLS policies filter rows
by matching the authenticated user's org memberships against the row's `org_id`.

### Key table groups

| Domain | Example tables |
|--------|---------------|
| Identity | `users`, `user_roles`, `user_profiles`, `user_permissions` |
| Organizations | `orgs`, `org_memberships`, `org_settings` |
| CRM | `leads`, `contacts`, `opportunities`, `pipeline_stages`, `tasks`, `email_campaigns` |
| Plans | `plans`, `plan_rates`, `pricing_tables`, `enrollments` |
| Content | `cms_pages`, `cms_blocks`, `training_modules`, `videos` |
| Advisor | `advisor_profiles`, `advisor_leads`, `tickets`, `chat_messages` |
| Analytics | `event_logs`, `dashboard_metrics`, `audit_trail` |
| Licensing | `tenant_licenses`, `feature_flags`, `module_config` |

### Migration workflow

Migrations live in `supabase/migrations/` and are applied via the Supabase CLI:

```bash
supabase migration new <name>      # Create a new migration file
supabase db push                   # Apply pending migrations to remote
supabase db reset                  # Reset local database and replay all migrations
```

All DDL should be **idempotent** (`CREATE IF NOT EXISTS`, `DROP IF EXISTS`
before `CREATE`, etc.) to allow safe re-runs.

---

## Edge Functions

53 Deno-based edge functions deployed on Supabase, organized by domain:

| Category | Functions | Examples |
|----------|-----------|---------|
| User management | Auth lifecycle, profile sync, role assignment | `handle-new-user`, `sync-profile`, `assign-role` |
| CRM / Leads / Email | Lead ingestion, pipeline automation, email send | `ingest-lead`, `advance-pipeline`, `send-email` |
| Advisor portal | Training progress, lead distribution, notifications | `track-training`, `distribute-leads`, `notify-advisor` |
| Content / Notifications | CMS publish, push notifications, announcements | `publish-content`, `send-notification` |
| SSO | Token exchange, session bridging | `sso-callback`, `exchange-token` |
| Analytics | Event collection, report generation | `track-event`, `generate-report` |
| Integrations | Third-party API orchestration | See below |

### External integrations

| Service | Purpose |
|---------|---------|
| Resend | Transactional email delivery |
| Mailchimp | Marketing email lists and campaigns |
| Microsoft Graph | Office 365 calendar and email integration |
| Gmail | Gmail API integration for CRM email sync |
| LinkedIn | Profile enrichment and lead sourcing |
| GoTo Connect | VoIP/telephony integration |
| Calendly | Meeting scheduling |
| Cloudflare Turnstile | Bot protection on public forms |
| Google Gemini AI | AI-assisted content generation and summarization |

Edge functions authenticate inbound requests by verifying the Supabase JWT.
For outbound calls to external APIs, secrets are stored as Supabase Edge
Function secrets and accessed via `Deno.env.get()`.

---

## Deployment Pipeline

### Build system

Turborepo orchestrates builds with dependency-aware caching:

```bash
pnpm turbo build                                  # Build everything
pnpm turbo build --filter=@mpbhealth/website      # Build one app + its deps
```

Each app produces a `dist/` directory containing static assets. Vite handles
bundling, tree-shaking, and code splitting.

### Vercel deployment

Each app is a separate Vercel project linked to the monorepo:

1. Push to `main` triggers Vercel builds for all affected apps
2. Vercel detects the monorepo structure and runs the appropriate build command
3. Each app's `vercel.json` configures SPA rewrites (`"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]`)
4. Preview deployments are created for every pull request branch

### CI/CD workflows (GitHub Actions)

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `.github/workflows/ci.yml` | Push/PR | Lint, typecheck, unit tests, build verification |
| Security | `.github/workflows/security.yml` | Push/PR/schedule | Dependency audit, secret scanning |
| Database | `.github/workflows/db.yml` | Push (supabase/) | Migration validation, type generation |

### Deployment checklist

1. Code passes CI (lint + typecheck + tests)
2. PR review approved
3. Merge to `main`
4. Vercel auto-deploys affected apps
5. Database migrations applied via `supabase db push` (manual or CI)
6. Edge functions deployed via `supabase functions deploy`
7. Post-deploy verification against production

---

## Security Model

### Defense in depth

| Layer | Mechanism |
|-------|-----------|
| Network | Vercel Edge network, HTTPS everywhere, Cloudflare Turnstile on public forms |
| Authentication | Supabase Auth with email/password, MFA support, JWT-based sessions |
| Authorization | Role-based access control (RBAC), org-scoped tenancy, per-user permission arrays |
| Database | 1000+ RLS policies enforce row-level isolation; no direct DB access from clients without RLS |
| API | Edge functions validate JWTs; PostgREST enforces RLS on every query |
| Client | Input sanitization (DOMPurify), Zod schema validation, CSP headers |
| CI | `security.yml` workflow for dependency audits, `dependabot` or manual review |
| Secrets | Supabase Edge Function secrets for API keys; Vercel environment variables for build-time config |

### RLS strategy

Every table accessible via the Supabase client has RLS enabled. Policies follow
a consistent pattern:

- **SELECT**: User can read rows where they are the owner, an org member, or
  have an admin role
- **INSERT**: User can insert rows into their own org (org_id must match
  membership)
- **UPDATE**: User can update rows they own or have explicit permission for
- **DELETE**: Restricted to admins or row owners, depending on the table

### Production change safety

All production-sensitive operations follow the playbook defined in
`.cursor/rules/production-change-playbook.mdc`:

1. Discover (read-only against live system)
2. Design (additive and reversible)
3. Rehearse (rolled-back transaction or staging)
4. Dry-run
5. Pilot on smallest scope
6. Verify with post-rollout watch window
7. Explicit approval before any production write

---

## Domain Map

```
mpb.health                --> apps/website (Vercel)
advisor.mpb.health        --> apps/advisor-portal (Vercel)
admin.mpb.health          --> apps/admin-portal (Vercel)
concierge.mpb.health      --> apps/concierge-portal (Vercel)
crm.mpb.health            --> external aryx-crm repo (DEPRECATED in this monorepo)

*.supabase.co             --> Supabase project (DB, Auth, Edge Functions, Realtime, Storage)
```

All DNS is managed at the domain registrar with CNAME records pointing to
Vercel for app subdomains and Supabase for API endpoints.

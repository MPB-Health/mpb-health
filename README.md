# MPB Health Monorepo

Enterprise health benefits management platform built with React, TypeScript,
Supabase, and Turborepo.

---

## Architecture

This is a **Turborepo + pnpm workspaces** monorepo containing 6 applications,
17 shared packages, a Supabase backend (PostgreSQL + 53 edge functions), and
Vercel deployments.

For a deep dive into the system design, see
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Apps

| App | Path | Domain | Port | Status | Description |
|-----|------|--------|------|--------|-------------|
| website | `apps/website` | mpb.health | 5173 | Active | Main marketing site with embedded admin CMS |
| advisor-portal | `apps/advisor-portal` | advisor.mpb.health | 5175 | Active | Advisor/broker portal with PWA support |
| admin-portal | `apps/admin-portal` | admin.mpb.health | 5176 | Active | Staff admin command center |
| concierge-portal | `apps/concierge-portal` | concierge.mpb.health | 5179 | Active | Concierge/member services portal |
| staff-hub | `apps/staff-hub` | (internal) | 5178 | Active | Internal SSO launcher/hub |
| crm | `apps/crm` | crm.mpb.health | 5174 | Deprecated | Legacy CRM (replaced by external aryx-crm repo) |

---

## Packages

| Package | Path | Description |
|---------|------|-------------|
| `@mpbhealth/database` | `packages/database` | Supabase client, generated types, auth helpers, realtime hooks |
| `@mpbhealth/auth` | `packages/auth` | Authentication context, MFA, roles, permissions, SSO, session management |
| `@mpbhealth/config` | `packages/config` | Environment helpers, company constants, domain map, feature flags |
| `@mpbhealth/ui` | `packages/ui` | Shared React component library, theme system (light/dark), MPB/ARYX branding |
| `@mpbhealth/utils` | `packages/utils` | Formatters, validators, CSV export, sanitization, logging, Zod schemas |
| `@mpbhealth/crm-core` | `packages/crm-core` | Full CRM domain layer (40+ subpath exports): leads, pipeline, email, quotes |
| `@mpbhealth/admin-core` | `packages/admin-core` | Admin/CMS services: users, enrollments, content, CMS, analytics |
| `@mpbhealth/advisor-core` | `packages/advisor-core` | Advisor domain: training, leads, chat, tickets, videos |
| `@mpbhealth/champion-core` | `packages/champion-core` | Champion Advisor OS: priority lanes, engagement, compliance, billing, gamification |
| `@mpbhealth/concierge-core` | `packages/concierge-core` | Concierge static data: training resources, quick links |
| `@mpbhealth/plans-core` | `packages/plans-core` | Plan management, pricing tables, rate engine |
| `@mpbhealth/licensing` | `packages/licensing` | Module licensing, feature flags, white-label, tenant provisioning |
| `@mpbhealth/form-embed` | `packages/form-embed` | Embeddable CRM web form component |
| `@mpbhealth/assets` | `packages/assets` | Shared logos and images |
| `@mpbhealth/eslint-config` | `packages/eslint-config` | Shared ESLint configuration presets |
| `@mpbhealth/tailwind-config` | `packages/tailwind-config` | Shared Tailwind CSS configuration and theme tokens |
| `@mpbhealth/typescript-config` | `packages/typescript-config` | Shared tsconfig base files |

---

## Quick Start

### Prerequisites

- Node.js 20.x
- pnpm 9.x (`corepack enable && corepack prepare pnpm@9 --activate`)
- Supabase CLI (`brew install supabase/tap/supabase`)

### Install and run

```bash
# Clone the repo
git clone git@github.com:your-org/mpbhealth-monorepo.git
cd mpbhealth-monorepo

# Install dependencies
pnpm install

# Copy environment files (set your Supabase URL and anon key)
cp apps/admin-portal/.env.example apps/admin-portal/.env
cp apps/advisor-portal/.env.example apps/advisor-portal/.env

# Start all apps
pnpm dev

# Or start a single app
pnpm dev:website       # port 5173
pnpm dev:advisor       # port 5175
pnpm dev:admin         # port 5176
pnpm dev:concierge     # port 5179
pnpm dev:staff-hub     # port 5178
```

> **Rich ticket messaging** defaults to on in local dev via committed
> `.env.development`. Production builds need `VITE_RICH_TICKET_EDITOR=true` in
> the host/CI environment if you want Tiptap there (see
> `supabase/ITSTS_DEPLOYMENT.md`).

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `pnpm dev` | `turbo run dev` | Start all apps in development mode |
| `pnpm dev:<app>` | `pnpm --filter @mpbhealth/<app> dev` | Start a single app |
| `pnpm build` | `turbo run build` | Build all apps and packages |
| `pnpm build:<app>` | `turbo run build --filter=@mpbhealth/<app>` | Build a single app with dependencies |
| `pnpm lint` | `turbo run lint` | Run ESLint across all packages |
| `pnpm typecheck` | `turbo run typecheck` | Run TypeScript type checking |
| `pnpm test` | `turbo run test` | Run all unit tests (Vitest) |
| `pnpm test:e2e` | `playwright test` | Run Playwright E2E tests |
| `pnpm test:e2e:ui` | `playwright test --ui` | Open Playwright UI mode |
| `pnpm format` | `prettier --write ...` | Format all files with Prettier |
| `pnpm clean` | `turbo run clean` | Remove all build outputs and node_modules |
| `pnpm db:generate` | `supabase gen types ...` | Regenerate TypeScript types from database schema |
| `pnpm db:migrate` | `supabase db push` | Apply pending database migrations |
| `pnpm db:reset` | `supabase db reset` | Reset local database and replay migrations |

---

## Project Structure

```
mpbhealth-monorepo/
|-- apps/
|   |-- website/             # Marketing site + embedded CMS
|   |-- advisor-portal/      # Advisor/broker portal (PWA)
|   |-- admin-portal/        # Staff admin command center
|   |-- concierge-portal/    # Concierge/member services
|   |-- staff-hub/           # Internal SSO launcher
|   |-- crm/                 # DEPRECATED
|-- packages/
|   |-- database/            # Supabase client + generated types
|   |-- auth/                # Auth context, MFA, roles
|   |-- config/              # Env helpers, constants, flags
|   |-- ui/                  # Shared components + theme
|   |-- utils/               # Formatters, validators, schemas
|   |-- crm-core/            # CRM domain (40+ exports)
|   |-- admin-core/          # Admin/CMS services
|   |-- advisor-core/        # Advisor domain
|   |-- champion-core/       # Champion Advisor OS
|   |-- concierge-core/      # Concierge data
|   |-- plans-core/          # Plans + rate engine
|   |-- licensing/           # Licensing, white-label
|   |-- form-embed/          # Embeddable form
|   |-- assets/              # Logos, images
|   |-- eslint-config/       # ESLint presets
|   |-- tailwind-config/     # Tailwind presets
|   |-- typescript-config/   # tsconfig bases
|-- supabase/
|   |-- migrations/          # SQL migration files
|   |-- functions/           # 53 Deno edge functions
|-- .github/workflows/       # CI/CD pipelines
|-- turbo.json               # Turborepo config
|-- pnpm-workspace.yaml      # Workspace definitions
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 7 + Turborepo |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Server State | TanStack Query |
| Forms | React Hook Form + Zod |
| Database | Supabase (PostgreSQL 17) |
| Auth | Supabase Auth (email/password, MFA) |
| Edge Functions | Deno (Supabase Edge Functions) |
| Hosting | Vercel |
| CI/CD | GitHub Actions |
| Testing | Vitest (unit), Playwright (E2E) |
| Package Manager | pnpm 9 + Turborepo |

---

## CI/CD

Three GitHub Actions workflows run on push and pull requests:

| Workflow | File | Purpose |
|----------|------|---------|
| CI | `.github/workflows/ci.yml` | Lint, typecheck, unit tests, build verification |
| Security | `.github/workflows/security.yml` | Dependency audit, secret scanning |
| Database | `.github/workflows/db.yml` | Migration validation, type generation checks |

Vercel handles deployment automatically:
- **Production** -- Merges to `main` trigger builds for all affected apps
- **Preview** -- Every PR branch gets a unique preview URL

---

## Documentation

### Core docs

- [Architecture Overview](docs/ARCHITECTURE.md) -- System design, data flow, auth model, deployment
- [Contributing Guide](CONTRIBUTING.md) -- Dev setup, code standards, PR process

### Audits and reports

- [Hawk-Eye Audit Checklist](docs/HAWK-EYE-AUDIT.md) -- Framework for auditing loading, auth, and performance
- [Hawk-Eye Findings Report](docs/HAWK-EYE-FINDINGS-REPORT.md) -- Advisor Portal audit findings
- [Hawk-Eye Master Audit Report](docs/HAWK-EYE-MASTER-AUDIT-REPORT.md) -- Comprehensive audit report
- [Advisor Portal Audit Report](docs/ADVISOR-PORTAL-AUDIT-REPORT.md) -- Advisor Portal deep audit
- [Advisor PWA/SW Audit](docs/ADVISOR-PWA-SW-AUDIT.md) -- Service worker and PWA audit
- [Portal Stabilization Audit](docs/portal-stabilization-audit.md) -- Portal stability assessment

### Engineering

- [Engineering Guardrails](docs/engineering-guardrails.md) -- Development constraints and standards
- [CTO Roadmap Report](docs/CTO-Roadmap-Report-2026-03-24.md) -- Technical roadmap

### Stabilization

- [Stabilization Master Orchestration](docs/stabilization-master-orchestration.md) -- Overall stabilization plan
- [Stabilization Execution SOP](docs/stabilization-execution-sop.md) -- Step-by-step execution guide
- [Stabilization Phase 2](docs/stabilization-phase2.md) -- Phase 2 details
- [Stabilization Phase 2b](docs/stabilization-phase2b.md) -- Phase 2b continuation
- [Stabilization Phase 3 Checklist](docs/stabilization-phase3-checklist.md) -- Phase 3 items
- [Verification Phase 3 Report](docs/verification-phase3-report.md) -- Phase 3 verification
- [Instrumentation Phase 3](docs/instrumentation-phase3.md) -- Observability instrumentation

### Planning

- [ARYX Rebrand](docs/aryx-rebrand/README.md) -- White-label rebrand planning
- [Rich Text Tickets/Chat Upgrade](docs/plans/rich-text-tickets-chat-upgrade-plan.md) -- Tiptap upgrade plan
- [Advisor Team Accounts](docs/superpowers/plans/2026-04-29-advisor-team-accounts.md) -- Team account design

### CRM

- [CRM Spec Alignment Audit](docs/crm/spec-alignment-audit.md) -- CRM specification audit
- [CRM Changelog](apps/crm/docs/CHANGELOG-2026.md) -- 2026 changelog
- [CRM Release Notes](apps/crm/docs/RELEASE-NOTES-2026.md) -- 2026 release notes

### Internal references

- [Production Change Playbook](.cursor/rules/production-change-playbook.mdc) -- Required protocol for production-sensitive changes

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development guide, including
setup instructions, code standards, database migration workflow, testing, and
the PR process.

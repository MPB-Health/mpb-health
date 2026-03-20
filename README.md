# MPB Health Monorepo

Enterprise health benefits management platform built with React, TypeScript, Supabase, and Turborepo.

## Apps

| App | Domain | Description |
|-----|--------|-------------|
| `website` | www.mpb.health | Main marketing website |
| `crm` | crm.mpb.health | CRM application (Zoho replacement) |
| `advisor-portal` | advisors.mpb.health | Advisor command center |
| `admin-portal` | admin.mpb.health | Staff admin portal |

## Packages

| Package | Description |
|---------|-------------|
| `@mpbhealth/ui` | Shared React components |
| `@mpbhealth/database` | Supabase client and types |
| `@mpbhealth/auth` | Authentication services |
| `@mpbhealth/crm-core` | CRM business logic |
| `@mpbhealth/integrations` | External API integrations |
| `@mpbhealth/services` | Shared business services |
| `@mpbhealth/utils` | Utility functions |
| `@mpbhealth/config` | Shared configuration |

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Installation

```bash
# Install dependencies
pnpm install
```

**Admin Portal & Advisor Portal:** copy `apps/admin-portal/.env.example` and `apps/advisor-portal/.env.example` to `.env` in each app and add your Supabase URL and anon key. Rich ticket messaging defaults to **on** in local dev via committed `.env.development`; production builds need `VITE_RICH_TICKET_EDITOR=true` in the host/CI environment if you want Tiptap there (see `supabase/ITSTS_DEPLOYMENT.md`).

```bash
# Start all apps in development
pnpm dev

# Start specific app
pnpm dev:website
pnpm dev:crm
pnpm dev:advisor
pnpm dev:admin
```

### Building

```bash
# Build all apps and packages
pnpm build

# Build specific app
pnpm build:website
```

### Testing

```bash
pnpm test
pnpm lint
pnpm typecheck
```

## Project Structure

```
mpbhealth-monorepo/
├── apps/
│   ├── website/           # Main marketing site
│   ├── crm/               # CRM Application
│   ├── advisor-portal/    # Advisor Portal
│   └── admin-portal/      # Admin Portal
├── packages/
│   ├── ui/                # Shared components
│   ├── database/          # Supabase client
│   ├── auth/              # Auth services
│   └── ...
├── supabase/
│   ├── migrations/        # Database migrations
│   └── functions/         # Edge functions
└── turbo.json
```

## Documentation

- [Hawk-Eye Audit Checklist](docs/HAWK-EYE-AUDIT.md) — Framework for auditing loading, auth, and performance
- [Hawk-Eye Findings Report](docs/HAWK-EYE-FINDINGS-REPORT.md) — Advisor Portal audit findings (Mar 2025)

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite + Turborepo
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Forms:** React Hook Form + Zod
- **State:** React Query

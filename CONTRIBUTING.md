# Contributing to MPB Health

Thank you for contributing to the MPB Health platform. This guide covers
everything you need to get started, write quality code, and ship changes safely.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Adding a New Feature](#adding-a-new-feature)
- [Database Changes](#database-changes)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Deployment](#deployment)
- [Production Change Playbook](#production-change-playbook)

---

## Prerequisites

Install these before cloning the repo:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20.x | [nodejs.org](https://nodejs.org/) or `nvm install 20` |
| pnpm | 9.x | `corepack enable && corepack prepare pnpm@9 --activate` |
| Supabase CLI | Latest | `brew install supabase/tap/supabase` or [docs](https://supabase.com/docs/guides/cli) |
| Git | 2.x+ | Pre-installed on most systems |

Optional but recommended:

- **VS Code / Cursor** with the ESLint, Prettier, and Tailwind CSS IntelliSense extensions
- **Docker** (required if running Supabase locally via `supabase start`)

---

## Getting Started

### 1. Clone the repository

```bash
git clone git@github.com:your-org/mpbhealth-monorepo.git
cd mpbhealth-monorepo
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Each app that connects to Supabase needs a `.env` file. Start from the
examples:

```bash
cp apps/admin-portal/.env.example apps/admin-portal/.env
cp apps/advisor-portal/.env.example apps/advisor-portal/.env
```

At minimum, set these variables in each `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Note:** Local dev overrides are committed in `.env.development` files where
> applicable. Production builds require environment variables set in Vercel or
> your CI host.

### 4. Start a dev server

```bash
# Start all apps concurrently
pnpm dev

# Start a single app
pnpm dev:website       # port 5173
pnpm dev:advisor       # port 5175
pnpm dev:admin         # port 5176
pnpm dev:concierge     # port 5179
pnpm dev:staff-hub     # port 5178
```

### 5. Verify the setup

Open the app URL in your browser (e.g., `http://localhost:5176` for admin
portal). If you see the login screen, you are good to go.

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
|   |-- crm/                 # DEPRECATED -- see aryx-crm repo
|-- packages/
|   |-- database/            # Supabase client, types, realtime hooks
|   |-- auth/                # Auth context, MFA, roles, sessions
|   |-- config/              # Env helpers, constants, feature flags
|   |-- ui/                  # Shared component library + theme
|   |-- utils/               # Formatters, validators, Zod schemas
|   |-- crm-core/            # CRM domain layer (40+ exports)
|   |-- admin-core/          # Admin/CMS services
|   |-- advisor-core/        # Advisor domain logic
|   |-- champion-core/       # Champion Advisor OS
|   |-- concierge-core/      # Concierge static data
|   |-- plans-core/          # Plan management + rate engine
|   |-- licensing/           # Module licensing, white-label
|   |-- form-embed/          # Embeddable CRM form component
|   |-- assets/              # Shared logos/images
|   |-- eslint-config/       # ESLint presets
|   |-- tailwind-config/     # Tailwind presets
|   |-- typescript-config/   # tsconfig base files
|-- supabase/
|   |-- migrations/          # SQL migration files
|   |-- functions/           # 53 Deno edge functions
|-- .github/workflows/       # CI/CD (ci.yml, security.yml, db.yml)
|-- turbo.json               # Turborepo task config
|-- pnpm-workspace.yaml      # Workspace definitions
```

---

## Development Workflow

### Branch naming

Use descriptive branch names with a category prefix:

```
feat/advisor-training-modules
fix/admin-enrollment-count
chore/upgrade-tanstack-query
refactor/crm-core-pipeline
docs/architecture-overview
```

### Commit conventions

Write clear, imperative-mood commit messages. Prefix with the affected scope
when it helps:

```
feat(advisor-portal): add training completion badges
fix(database): handle null org_id in RLS policy
chore: upgrade vite to 7.x across all apps
refactor(crm-core): consolidate lead status helpers
```

### Working with the monorepo

Turborepo handles dependency ordering automatically. If you change a shared
package, all dependent apps will rebuild:

```bash
# Build a single app and its package dependencies
pnpm turbo build --filter=@mpbhealth/admin-portal

# Run lint only on packages that changed since main
pnpm turbo lint --filter=...[main]
```

---

## Code Standards

### TypeScript

- **Strict mode** is enabled in all packages (`strict: true` in tsconfig)
- Use explicit return types on exported functions
- Prefer `interface` over `type` for object shapes
- Use `unknown` over `any`; if `any` is unavoidable, add a comment explaining why

### ESLint

Shared config lives in `packages/eslint-config`. Key rules:

- No unused variables or imports
- Consistent import ordering
- React hooks rules enforced
- No explicit `any` without override comment

Run the linter:

```bash
pnpm lint
```

### Prettier

Formatting is handled by Prettier. Format all files:

```bash
pnpm format
```

Configure your editor to format on save using the repo's Prettier config.

### Tailwind CSS

- Use Tailwind utility classes; avoid custom CSS files unless necessary
- Shared theme tokens are in `packages/tailwind-config`
- Use the `cn()` utility from `@mpbhealth/ui` for conditional class merging

### File organization

- Group by feature, not by file type (e.g., `features/training/` not
  `components/`, `hooks/`, `utils/` at the top level)
- Co-locate tests with source files (`MyComponent.test.tsx` next to
  `MyComponent.tsx`)
- Barrel exports (`index.ts`) in each package for clean import paths

---

## Adding a New Feature

Use this checklist when building a new feature:

- [ ] **Design** -- Document the feature scope and affected packages/apps
- [ ] **Types** -- Add/update TypeScript types in the relevant `*-core` package
  or `database` package
- [ ] **Database** -- Create a migration if new tables or columns are needed
  (see [Database Changes](#database-changes))
- [ ] **Domain logic** -- Implement business logic in the appropriate `*-core`
  package, not in the app
- [ ] **UI components** -- Build reusable components in `@mpbhealth/ui`; app-
  specific components stay in the app
- [ ] **Integration** -- Wire up the feature in the target app using TanStack
  Query for data fetching
- [ ] **Auth/permissions** -- Add role guards or permission checks if the
  feature is access-controlled
- [ ] **Edge function** -- If server-side logic is needed beyond what RLS and
  PostgREST provide, add a Supabase Edge Function
- [ ] **Tests** -- Write unit tests for domain logic; add E2E tests for
  critical user flows
- [ ] **Lint and typecheck** -- Run `pnpm lint && pnpm typecheck` before
  pushing

---

## Database Changes

### Creating a migration

```bash
# Generate a timestamped migration file
supabase migration new descriptive_name

# Edit the generated file in supabase/migrations/
```

### Migration rules

1. **Idempotent DDL** -- Use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ...
   ADD COLUMN IF NOT EXISTS`, `DROP FUNCTION IF EXISTS` before `CREATE
   FUNCTION`, etc.
2. **No destructive changes without a plan** -- Never `DROP TABLE` or `DROP
   COLUMN` without a migration that first verifies the column/table is unused
3. **RLS policies** -- Every new table must have RLS enabled and at least
   SELECT/INSERT/UPDATE policies
4. **Indexes** -- Add indexes for foreign keys and columns used in WHERE clauses
   or ORDER BY
5. **Rollback** -- Write a corresponding rollback strategy (comment block at
   the top of the migration file or a separate down migration)

### Applying migrations

```bash
# Apply to remote Supabase project
pnpm db:migrate         # runs: supabase db push

# Reset local database (replays all migrations from scratch)
pnpm db:reset           # runs: supabase db reset

# Regenerate TypeScript types after schema changes
pnpm db:generate
```

### Type generation

After any schema change, regenerate the database types so that TypeScript
catches mismatches at compile time:

```bash
pnpm db:generate
```

This updates `packages/database/src/types/database.ts`. Commit the regenerated
file with your migration.

---

## Testing

### Unit tests (Vitest)

Unit tests use Vitest and live alongside source files:

```bash
# Run all unit tests
pnpm test

# Run tests for a specific package
pnpm test:unit:crm-core
```

Guidelines:
- Test domain logic in `*-core` packages, not UI integration
- Mock the Supabase client for database calls
- Use Zod schemas for test data factories where possible

### End-to-end tests (Playwright)

E2E tests live in the repo root and use Playwright:

```bash
# Run all E2E tests
pnpm test:e2e

# Run with the Playwright UI
pnpm test:e2e:ui

# Run a specific project
pnpm test:e2e:crm
```

Guidelines:
- Test critical user flows (login, form submission, navigation)
- Use page object models for maintainability
- Tag tests with `@smoke` for the minimum set that should pass on every PR

---

## Pull Request Process

### Before opening a PR

1. Rebase on the latest `main` to minimize merge conflicts
2. Run the full check suite locally:

   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```

3. Write a clear PR description:
   - **What** changed and **why**
   - Screenshots or recordings for UI changes
   - Link to the relevant issue or ticket
   - Note any database migrations or edge function changes

### Review expectations

- At least one approval required before merge
- CI must pass (lint, typecheck, tests, security scan)
- Database migrations are reviewed with extra scrutiny
- Production-sensitive changes follow the
  [Production Change Playbook](#production-change-playbook)

### Merge strategy

- **Squash and merge** for feature branches (clean history on `main`)
- Delete the branch after merge

---

## Deployment

### Vercel (apps)

Each app is a separate Vercel project. Deployment is automatic:

- **Push to `main`** triggers a production deployment for all affected apps
- **Push to a PR branch** creates a preview deployment with a unique URL

Manual deployment is rarely needed, but if required:

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy a specific app
cd apps/admin-portal && vercel --prod
```

### Supabase (database and edge functions)

Database migrations and edge functions are deployed separately from the
frontend apps:

```bash
# Push pending migrations to the remote Supabase project
supabase db push

# Deploy a specific edge function
supabase functions deploy function-name

# Deploy all edge functions
supabase functions deploy
```

The `db.yml` GitHub Actions workflow validates migrations on push to the
`supabase/` directory.

### Environment variables

- **Build-time** (prefixed with `VITE_`): Set in Vercel project settings
- **Runtime (edge functions)**: Set via `supabase secrets set KEY=value`
- **Local dev**: Set in `.env` files (not committed; use `.env.example` as
  template)

---

## Production Change Playbook

Any change that touches production data, auth, billing, PHI/PII, schema,
RLS policies, integrations, or live user flows must follow the production
change playbook.

The full playbook is defined in
[`.cursor/rules/production-change-playbook.mdc`](.cursor/rules/production-change-playbook.mdc)
and requires:

1. **Discover** -- Read-only investigation against the live system
2. **Risk Classification** -- Tier 0 (read-only/additive) vs Tier 1+ (full ceremony)
3. **Design** -- Additive and reversible changes
4. **Rehearse** -- Rolled-back transaction or staging environment
5. **Dry-run** -- Verify expected affected-row counts
6. **Pilot** -- Apply to the smallest possible scope
7. **Verify** -- Post-rollout watch window with evidence
8. **Approval Gate** -- Explicit approval before any production write

When in doubt, treat the change as Tier 1+ and follow the full ceremony.

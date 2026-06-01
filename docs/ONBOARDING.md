# Developer Onboarding Guide

This guide walks new developers through setting up the MPB Health monorepo, understanding the codebase structure, and performing common development tasks.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20.x | Required by `engines` field in root package.json |
| pnpm | 9.15.4+ | Required by `packageManager` field; do not use npm or yarn |
| Supabase CLI | Latest | Required for local database development |
| Git | 2.x+ | Standard version control |

### Installing Prerequisites

```bash
# Node.js (via nvm)
nvm install 20
nvm use 20

# pnpm
corepack enable
corepack prepare pnpm@9.15.4 --activate

# Supabase CLI
brew install supabase/tap/supabase

# Verify installations
node --version    # v20.x.x
pnpm --version   # 9.15.4+
supabase --version
```

---

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone git@github.com:mpbhealth/mpbhealth-monorepo.git
cd mpbhealth-monorepo
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all workspace dependencies across apps and packages. The `pnpm-workspace.yaml` file defines the workspace structure.

### 3. Environment Setup

Each app requires its own `.env` file. Copy from the example templates:

```bash
# For the website
cp apps/website/.env.example apps/website/.env

# For the advisor portal
cp apps/advisor-portal/.env.example apps/advisor-portal/.env

# For the admin portal
cp apps/admin-portal/.env.example apps/admin-portal/.env

# For the concierge portal
cp apps/concierge-portal/.env.example apps/concierge-portal/.env
```

**Minimum required variables** (for any app):

```env
VITE_SUPABASE_URL=https://knelbprqqbjggqfqvfmc.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**Where to get these values:**
- `VITE_SUPABASE_URL` — From the Supabase project dashboard under Settings > API
- `VITE_SUPABASE_ANON_KEY` — From the same page; this is the public `anon` key (safe for client-side use)
- Ask a team lead for access to the Supabase project if you do not have it

### 4. Start Development Servers

```bash
# Start all apps simultaneously
pnpm dev

# Or start individual apps
pnpm dev:website      # localhost:5173
pnpm dev:advisor      # localhost:5175
pnpm dev:admin        # localhost:5176
pnpm dev:concierge    # localhost:5179
pnpm dev:staff-hub    # localhost:5178
```

### 5. Access the Applications

| App | URL |
|-----|-----|
| Website | http://localhost:5173 |
| Advisor Portal | http://localhost:5175 |
| Admin Portal | http://localhost:5176 |
| Staff Hub | http://localhost:5178 |
| Concierge Portal | http://localhost:5179 |

---

## Understanding the Codebase

### Monorepo Layout

```
mpbhealth-monorepo/
├── apps/                    # Deployable applications
│   ├── website/             # Public marketing site (mpb.health)
│   ├── advisor-portal/      # Advisor-facing portal
│   ├── admin-portal/        # Internal admin dashboard
│   ├── concierge-portal/    # Concierge team portal
│   ├── staff-hub/           # Internal staff tools
│   └── crm/                 # DEPRECATED — external CRM
├── packages/                # Shared libraries
│   ├── ui/                  # Shared React components
│   ├── auth/                # Authentication context and hooks
│   ├── database/            # Supabase client, types, and query helpers
│   └── types/               # Shared TypeScript type definitions
├── supabase/                # Database and edge functions
│   ├── migrations/          # 338 SQL migration files
│   ├── functions/           # 53 Deno edge functions
│   ├── seed.sql             # Development seed data
│   └── config.toml          # Local Supabase configuration
├── scripts/                 # Build and utility scripts
├── docs/                    # Documentation
└── turbo.json               # Turborepo pipeline configuration
```

### How Packages Are Consumed

Shared packages use the `workspace:*` protocol in `package.json`:

```json
{
  "dependencies": {
    "@mpbhealth/ui": "workspace:*",
    "@mpbhealth/auth": "workspace:*",
    "@mpbhealth/database": "workspace:*",
    "@mpbhealth/types": "workspace:*"
  }
}
```

This means packages are always resolved from the local workspace (never from a registry). Changes to a package are immediately available to all consuming apps during development.

### How Routing Works

Each app uses **React Router** for client-side routing. The pattern is consistent across apps:

```
apps/<app>/src/
├── routes/              # Route components (one file per route)
├── layouts/             # Layout wrappers (sidebar, header, auth guard)
├── App.tsx              # Router definition and route tree
└── main.tsx             # Entry point (renders App)
```

Routes are defined declaratively in `App.tsx` using React Router's `createBrowserRouter` or `<Routes>` component.

### How Auth Works

Authentication flows through these layers:

1. **Supabase Auth** — Handles signup, login, password reset, OAuth, MFA
2. **`@mpbhealth/auth` package** — Provides React context (`AuthProvider`) and hooks (`useAuth`, `useUser`, `useSession`)
3. **Route guards** — Layout components check auth state and redirect unauthenticated users
4. **RLS** — Database queries automatically scoped to the authenticated user's permissions

```
Browser → AuthProvider (session listener) → Supabase Auth → JWT
       → API calls include JWT → Supabase RLS evaluates policies
```

### How Data Flows

1. **`@mpbhealth/database`** — Exports a configured Supabase client with TypeScript types
2. **Components call queries** — Using the Supabase client directly or via custom hooks
3. **RLS enforces access** — Every query passes through Row Level Security policies
4. **Real-time subscriptions** — Optional real-time listeners for live updates

```
Component → useQuery/supabase.from('table').select()
         → Supabase REST API (with JWT)
         → PostgreSQL + RLS policies
         → Filtered results returned
```

---

## Common Tasks

### Adding a New Page/Route

1. Create a route component in `apps/<app>/src/routes/`:
   ```tsx
   export default function NewPage() {
     return <div>New Page</div>;
   }
   ```

2. Register the route in `apps/<app>/src/App.tsx`:
   ```tsx
   <Route path="/new-page" element={<NewPage />} />
   ```

3. Add navigation link if needed (sidebar, nav menu).

### Creating a New Shared Component

1. Create the component in `packages/ui/src/components/`:
   ```tsx
   // packages/ui/src/components/MyComponent.tsx
   export function MyComponent({ title }: { title: string }) {
     return <div>{title}</div>;
   }
   ```

2. Export from the package barrel file (`packages/ui/src/index.ts`):
   ```tsx
   export { MyComponent } from './components/MyComponent';
   ```

3. Use in any app:
   ```tsx
   import { MyComponent } from '@mpbhealth/ui';
   ```

### Adding a Database Migration

```bash
# Generate a new migration file
supabase migration new add_feature_table

# Edit the generated file in supabase/migrations/
# Include: CREATE TABLE, RLS policies, indexes, rollback comment

# Test locally
supabase db reset

# Verify
supabase db lint
```

### Creating a New Edge Function

```bash
# Scaffold a new function
supabase functions new my-function

# Edit supabase/functions/my-function/index.ts

# Test locally
supabase functions serve my-function

# Deploy
supabase functions deploy my-function
```

### Running Tests

```bash
# All tests
pnpm test

# Tests for a specific app
pnpm turbo test --filter=@mpbhealth/website

# Watch mode (during development)
pnpm turbo test --filter=@mpbhealth/website -- --watch
```

### Checking Bundle Size

```bash
# Build and analyze
pnpm turbo build --filter=@mpbhealth/<app>

# CRM-specific bundle check
node apps/crm/check-bundle-size.mjs
```

---

## Architecture Quick Reference

For deeper understanding of the system architecture, refer to:

- **[Architecture Overview](./ARCHITECTURE.md)** — System design, app boundaries, package responsibilities, and data flow diagrams
- **[Database Documentation](./DATABASE.md)** — Schema, RLS, functions, cron jobs, edge functions, and migration workflow
- **[Deployment Guide](./DEPLOYMENT.md)** — Vercel config, CI/CD, environment variables, and infrastructure details

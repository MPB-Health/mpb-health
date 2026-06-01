# Deployment and Infrastructure

This document covers the deployment platform, domain routing, build pipeline, CI/CD workflows, environment configuration, and infrastructure tooling for the MPB Health monorepo.

---

## Platform

All applications are deployed as **Vite single-page applications (SPAs) on Vercel**. There are no Docker containers, no Kubernetes, and no self-hosted infrastructure. The backend is entirely Supabase (managed Postgres + Edge Functions + Auth + Storage + Realtime).

---

## Domain Map

| App | Production Domain | Dev Port | Notes |
|-----|-------------------|----------|-------|
| `website` | mpb.health | 5173 | Public marketing site |
| `crm` | crm.mpb.health | 5174 | DEPRECATED — migrated to external CRM |
| `advisor-portal` | advisor.mpb.health | 5175 | Advisor-facing portal |
| `admin-portal` | admin.mpb.health | 5176 | Internal admin dashboard |
| `concierge-portal` | concierge.mpb.health | 5179 | Concierge team portal |
| `staff-hub` | (no production domain documented) | 5178 | Internal staff tools |

### Additional Domains

| Domain | Purpose |
|--------|---------|
| app.mpb.health | Mobile PWA (member-facing) |
| support.mpb.health | ITSTS support ticket portal |
| training.mpb.health | Training content delivery |

---

## Vercel Configuration

Each app directory contains a `vercel.json` with a standard configuration structure:

```json
{
  "installCommand": "cd ../.. && pnpm install",
  "buildCommand": "pnpm turbo build --filter=@mpbhealth/<app-name>",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

Key points:
- `installCommand` runs from the monorepo root to ensure all workspace dependencies resolve
- `buildCommand` uses Turborepo filtering to build only the target app and its dependencies
- The SPA rewrite ensures all routes fall through to `index.html` for client-side routing
- Security headers are applied globally to all responses

---

## Build Pipeline

### Turborepo Configuration

Turborepo orchestrates the build graph across all apps and packages.

**Pipeline tasks:**

| Task | Depends On | Description |
|------|-----------|-------------|
| `build` | `^build` | Production build (depends on upstream package builds) |
| `dev` | — | Development server |
| `lint` | — | ESLint checks |
| `typecheck` | — | TypeScript type checking |
| `test` | — | Unit/integration tests |
| `clean` | — | Remove build artifacts |

**Configuration:**
- Concurrency: 14 (parallel task execution limit)
- Cache: Local + Remote (Vercel Remote Cache)
- Inputs: Automatically inferred from imports

### Build Order

```
packages/types       (no deps)
packages/database    (depends on types)
packages/auth        (depends on database, types)
packages/ui          (depends on types)
apps/*               (depends on packages/*)
```

---

## CI/CD (GitHub Actions)

### ci.yml — Primary CI

Runs on every pull request and push to main.

**Jobs:**
1. **Lint** — Run ESLint across all packages and apps
2. **Typecheck** — Run TypeScript compiler in `--noEmit` mode
3. **Test** — Run Vitest unit and integration tests
4. **E2E** — Run Playwright tests (CRM smoke suite)
5. **Build** — Full production build of all apps

### security.yml — Security Scanning

Runs on pull requests and on a weekly schedule.

**Jobs:**
1. **Secret Detection** — Gitleaks scan for accidentally committed secrets
2. **Dependency Audit** — `pnpm audit` for known vulnerabilities
3. **CodeQL SAST** — Static analysis for security vulnerabilities
4. **License Compliance** — Verify all dependencies use approved licenses
5. **Security Headers Check** — Validate Vercel security header configuration

### db.yml — Database Validation

Runs on pull requests that modify `supabase/` directory.

**Jobs:**
1. **Supabase Local Boot** — Start local Supabase stack
2. **Database Lint** — Schema linting and best-practice checks
3. **Invariant Tests** — Verify constraints, indexes, and RLS policies exist
4. **Anon Smoke Tests** — Query as anonymous role to verify RLS isolation

---

## Environment Variables

### Vite Frontend Variables (VITE_ prefix)

These are embedded in the client bundle at build time and are publicly visible.

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase project API URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public API key | Yes |
| `VITE_APP_URL` | Canonical app URL for the current environment | Yes |
| `VITE_SUPPORT_EMAIL` | Support email displayed in UI | No |
| `VITE_ANALYTICS_ID` | Analytics tracking ID | No |
| `VITE_SENTRY_DSN` | Sentry error reporting DSN | No |
| `VITE_FEATURE_FLAGS` | JSON feature flag overrides | No |

### Node / CLI / CI Variables

Used in build scripts, CI workflows, and tooling. Never exposed to the browser.

| Variable | Purpose | Required |
|----------|---------|----------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI authentication | CI only |
| `SUPABASE_PROJECT_REF` | Target Supabase project reference | CI only |
| `SUPABASE_DB_PASSWORD` | Database password for direct connections | CI only |
| `VERCEL_TOKEN` | Vercel API token for deployments | CI only |
| `TURBO_TOKEN` | Turborepo remote cache token | CI only |
| `TURBO_TEAM` | Turborepo team slug | CI only |
| `RESEND_API_KEY` | Resend email service API key | Edge functions |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Edge functions |
| `STRIPE_SECRET_KEY` | Stripe payment processing key | Edge functions |
| `TWILIO_AUTH_TOKEN` | Twilio SMS service token | Edge functions |

### Supabase Edge Function Secrets

Set via `supabase secrets set` and available to all edge functions at runtime.

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Transactional email delivery |
| `OPENAI_API_KEY` | AI summarization and email drafting |
| `STRIPE_SECRET_KEY` | Payment webhook verification and charges |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | Twilio API authentication |
| `SLACK_WEBHOOK_URL` | Slack notification delivery |
| `ITSTS_API_KEY` | ITSTS ticket system integration |
| `CALENDLY_API_KEY` | Calendly meeting scheduling |
| `MICROSOFT_CLIENT_SECRET` | Microsoft Graph API (email sync) |
| `GOOGLE_CLIENT_SECRET` | Gmail API (email sync) |
| `CORS_EXTRA_ORIGINS` | Comma-separated extra origins appended to the edge-function CORS allowlist at runtime |

### Edge Function CORS Allowlist

All edge functions share `supabase/functions/_shared/cors.ts`, which reflects the
request `Origin` only when it is allowed; otherwise it falls back to the first
allowed origin (so the browser blocks the response). Allowed origins come from
three places:

1. **Hardcoded list** — the `*.mpb.health` production hosts.
2. **Regex patterns** — any `*.aryxcloud.com` subdomain (white-label portals),
   `mpbhealth*.vercel.app` previews, and localhost/loopback dev ports.
3. **`CORS_EXTRA_ORIGINS` secret** — an exact-match, comma-separated list added at
   runtime *without redeploying functions*.

Because the allowlist is evaluated at module load, **changing `CORS_EXTRA_ORIGINS`
recycles the function workers and takes effect within ~30s with no redeploy** —
the safe way to grant a new origin across the whole fleet. The `*.aryxcloud.com`
regex is the durable backstop baked into the code; the secret currently enumerates
the ARYX portal origins so functions deployed before the regex was added also
honor them. To grant a new origin everywhere instantly:

```bash
supabase secrets set CORS_EXTRA_ORIGINS="https://admin.aryxcloud.com,https://crm.aryxcloud.com,..." --project-ref <ref>
```

### Forbidden VITE_ Variables

These must NEVER be prefixed with `VITE_` as they would be exposed in the client bundle:

- `SUPABASE_SERVICE_ROLE_KEY` — Full database access, bypasses RLS
- `OPENAI_API_KEY` — Billed API key
- `STRIPE_SECRET_KEY` — Payment processing key
- `RESEND_API_KEY` — Email sending key
- Any `*_SECRET*` or `*_AUTH_TOKEN` variable

---

## Supabase Infrastructure

### Project Details

| Property | Value |
|----------|-------|
| Project | mpbhealth.v7 |
| PostgreSQL Version | 17 |
| Legacy Reference | `dtmnkzllidaiqyheguhl` |
| Active Reference (ARYX) | `knelbprqqbjggqfqvfmc` |
| Region | US East |

### Edge Functions

- **Runtime**: Deno
- **Count**: 53 functions
- **Deployment**: `supabase functions deploy <function-name>`
- **Local development**: `supabase functions serve`

### Cron and Background Jobs

- **Engine**: `pg_cron` extension + `pg_net` for HTTP calls
- **Job count**: 5 scheduled jobs (see DATABASE.md for details)
- **Monitoring**: Jobs log to `cron.job_run_details`

### Storage

- **Limit**: 200 MiB per project
- **Buckets**: media (public), documents (private), exports (private, TTL)
- **Policies**: RLS-based access control per bucket

---

## Scripts

### Root-Level Scripts

| Script | Purpose |
|--------|---------|
| `scripts/dev-website.sh` | Start website dev server with env setup |
| `scripts/export-diagram-pngs.mjs` | Export architecture diagrams as PNG |
| `scripts/check-email.mjs` | Verify email delivery configuration |
| `scripts/apply-migrations-temp.mjs` | Temporary migration application script |

### Cutover Tooling

Located in `scripts/cutover/` — tooling for the legacy-to-ARYX Supabase project migration:

- Data export/import utilities
- Schema comparison tools
- RLS policy verification
- Connection string migration helpers

### App-Local Scripts

| Script | App | Purpose |
|--------|-----|---------|
| `prerender-seo.mjs` | website | Generate pre-rendered HTML for SEO-critical pages |
| `prerender-html.mjs` | website | Static HTML generation for landing pages |
| `optimize-images.mjs` | website | Image compression and format conversion |
| `check-bundle-size.mjs` | crm | Bundle size regression checking |

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Database Documentation](./DATABASE.md)
- [Onboarding Guide](./ONBOARDING.md)

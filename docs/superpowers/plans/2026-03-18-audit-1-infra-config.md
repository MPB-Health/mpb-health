# Audit Sub-Plan 1: Infrastructure & Config

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Find and fix all workspace dependency mismatches, TypeScript config drift, path alias failures, build pipeline gaps, and environment variable inconsistencies across the monorepo.

**Architecture:** Each finding is recorded as a comment block at the top of the relevant file (or in a findings scratch file). Each fix is a targeted edit. No refactors unless the fix requires it.

**Tech Stack:** pnpm workspaces, Turbo 2.8.11, tsup, TypeScript 5.5.3, Vite 5.4.21, ESLint, pnpm-workspace.yaml catalog.

---

## Files in Scope

- `pnpm-workspace.yaml` — version catalog
- `turbo.json` — task pipeline
- `package.json` (root)
- `apps/*/package.json` — app dependency declarations
- `packages/*/package.json` — all 16 packages: auth, database, ui, utils, config, crm-core, plans-core, admin-core, advisor-core, champion-core, assets, eslint-config, tailwind-config, typescript-config, **integrations**, **services**
- `apps/*/tsconfig.json` — per-app TypeScript config
- `packages/*/tsconfig.json` — per-package TypeScript config
- `tsconfig.json` (root) — base config
- `packages/typescript-config/*.json` — shareable TS bases
- `apps/*/vite.config.ts` — Vite alias configs
- `.github/workflows/ci.yml` — CI pipeline
- `.github/workflows/security.yml` — Security scan
- `apps/*/vercel.json` — per-app Vercel configs
- `vercel.json` (root) — website Vercel config

---

## Task 1: Map All Internal Package References

**Files:**
- Read: `pnpm-workspace.yaml`
- Read: `apps/*/package.json` (all 4)
- Read: `packages/*/package.json` (all 14)

- [ ] **Step 1: Read pnpm-workspace.yaml catalog**

```bash
cat pnpm-workspace.yaml
```

Record all pinned versions and catalog entries.

- [ ] **Step 2: Extract all internal @mpbhealth/* references from apps**

```bash
grep -r '"@mpbhealth/' apps/*/package.json
```

For each reference, verify:
1. The referenced package exists in `packages/`
2. The version range matches what's in the catalog
3. The package has a valid `main`/`exports` field

- [ ] **Step 3: Extract all internal @mpbhealth/* references from packages**

```bash
grep -r '"@mpbhealth/' packages/*/package.json
```

Check for circular dependencies (A → B → A). Draw a simple dep graph mentally.

- [ ] **Step 4: Verify all packages have correct build outputs**

For each built package (auth, database, ui, utils, config, crm-core, plans-core):

```bash
ls packages/auth/dist/ 2>/dev/null || echo "MISSING DIST: auth"
ls packages/database/dist/ 2>/dev/null || echo "MISSING DIST: database"
ls packages/ui/dist/ 2>/dev/null || echo "MISSING DIST: ui"
ls packages/utils/dist/ 2>/dev/null || echo "MISSING DIST: utils"
ls packages/config/dist/ 2>/dev/null || echo "MISSING DIST: config"
ls packages/crm-core/dist/ 2>/dev/null || echo "MISSING DIST: crm-core"
ls packages/plans-core/dist/ 2>/dev/null || echo "MISSING DIST: plans-core"
```

- [ ] **Step 5: Fix any missing dist/ by running the build**

```bash
pnpm --filter @mpbhealth/auth build
pnpm --filter @mpbhealth/database build
# etc for any that are missing
```

- [ ] **Step 6: Check for duplicate dependency versions that could cause runtime conflicts**

```bash
pnpm why react | head -40
pnpm why @supabase/supabase-js | head -40
pnpm why zod | head -40
```

Any package appearing at two different versions is a mismatch. Fix by aligning to catalog version.

- [ ] **Step 7: Commit findings**

```bash
git add -A
git commit -m "audit(infra): document internal package reference map"
```

---

## Task 2: Audit TypeScript Config Inheritance Chain

**Files:**
- Read: `packages/typescript-config/` (all files)
- Read: `tsconfig.json` (root)
- Read: `apps/advisor-portal/tsconfig.json`
- Read: `apps/admin-portal/tsconfig.json`
- Read: `apps/crm/tsconfig.json`
- Read: `apps/website/tsconfig.json`
- Read: `packages/auth/tsconfig.json`
- Read: `packages/database/tsconfig.json`
- Read: `packages/ui/tsconfig.json`

- [ ] **Step 1: Read all typescript-config base files**

```bash
ls packages/typescript-config/
cat packages/typescript-config/*.json
```

Map which bases exist (e.g., `base.json`, `react.json`, `dom.json`, `esm.json`).

- [ ] **Step 2: Read each app's tsconfig and verify extends chain**

For each app, check:
1. `extends` points to a file that exists
2. `paths` aliases are consistent with actual package locations
3. `moduleResolution` is `bundler` or `node16` (not `node` which is outdated for ESM)
4. No conflicting `strict` settings

```bash
grep -r '"extends"' apps/*/tsconfig.json packages/*/tsconfig.json
```

- [ ] **Step 3: Check path alias consistency between tsconfig and vite.config.ts**

For each app, the `paths` in `tsconfig.json` must match the `resolve.alias` in `vite.config.ts`.

```bash
grep -A5 '"paths"' apps/advisor-portal/tsconfig.json
grep -A10 'alias' apps/advisor-portal/vite.config.ts

grep -A5 '"paths"' apps/admin-portal/tsconfig.json
grep -A10 'alias' apps/admin-portal/vite.config.ts

grep -A5 '"paths"' apps/crm/tsconfig.json
grep -A10 'alias' apps/crm/vite.config.ts

grep -A5 '"paths"' apps/website/tsconfig.json
grep -A10 'alias' apps/website/vite.config.ts
```

If tsconfig has `"@/*": ["./src/*"]` but vite.config does NOT have the matching alias → TypeScript passes but Vite build fails.

- [ ] **Step 4: Fix any path alias mismatches**

Edit the vite.config.ts to add missing aliases:

```typescript
// vite.config.ts
import path from 'path'
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // add any others found in tsconfig paths
    }
  }
})
```

- [ ] **Step 5: Run typecheck to surface remaining issues**

```bash
# If on Windows with Git Bash, use ripgrep (rg) instead of grep -oP for env var scanning
pnpm -r typecheck 2>&1 | grep -E "error TS|Cannot find"
```

Fix any import errors that surface.

- [ ] **Step 6: Commit fixes**

```bash
git add apps/*/tsconfig.json apps/*/vite.config.ts packages/*/tsconfig.json
git commit -m "fix(infra): align tsconfig paths with vite aliases across all apps"
```

---

## Task 3: Audit Turbo Pipeline for Correctness

**Files:**
- Read: `turbo.json`
- Read: `package.json` (root scripts)

- [ ] **Step 1: Read turbo.json**

```bash
cat turbo.json
```

Check:
1. All tasks listed in root `package.json` scripts have a corresponding turbo task
2. `build` depends on `^build` (package builds before apps)
3. `dev` is set to `persistent: true` and `cache: false`
4. `typecheck` depends on `^build` (packages must be built before typechecking apps)
5. `lint` depends on `^build`
6. `test` has correct dependencies

- [ ] **Step 2: Check for missing turbo tasks**

```bash
grep '"scripts"' -A30 package.json
```

Any script that calls `turbo run X` where X is not defined in turbo.json will fail silently or error. List all missing.

- [ ] **Step 3: Check that package build scripts match turbo expectations**

```bash
grep '"build"' packages/*/package.json
```

Every built package (auth, database, ui, utils, config, crm-core, plans-core) must have a `build` script in its package.json, or turbo's `^build` dependency is broken.

- [ ] **Step 4: Fix any missing build scripts**

For source-only packages (admin-core, advisor-core, champion-core) that turbo tries to build, add a no-op build script:

```json
{
  "scripts": {
    "build": "echo 'source-only package, no build needed'"
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add turbo.json packages/*/package.json
git commit -m "fix(infra): fix turbo pipeline for source-only packages"
```

---

## Task 4: Audit Environment Variable Consistency

**Files:**
- Read: `.env.example` (root)
- Read: `apps/advisor-portal/.env.example` (if exists)
- Read: `apps/admin-portal/.env.example` (if exists)
- Read: `apps/crm/.env.example` (if exists)
- Read: `apps/website/.env.example` (if exists)
- Read: `turbo.json` (env passthrough)
- Read: `.github/workflows/ci.yml` (secret injection)

- [ ] **Step 1: List all VITE_ env vars referenced in each app's source**

```bash
# Use ripgrep (rg) — available via pnpm/npm toolchain, more reliable on Windows/Git Bash
rg -o 'VITE_\w+' apps/advisor-portal/src/ | sort -u
rg -o 'VITE_\w+' apps/admin-portal/src/ | sort -u
rg -o 'VITE_\w+' apps/crm/src/ | sort -u
rg -o 'VITE_\w+' apps/website/src/ | sort -u
# Fallback if rg not available:
# grep -r 'import.meta.env.VITE_' apps/advisor-portal/src/ | grep -oP 'VITE_\w+' | sort -u
```

- [ ] **Step 2: Cross-reference against .env.example files**

For each VITE_ var found in step 1, verify it appears in:
1. The app's `.env.example`
2. The `turbo.json` env passthrough (so Turbo doesn't cache stale values)
3. The CI workflow's build step secrets

Missing from turbo.json env array = caching bug in production builds (wrong env used).
Missing from CI = build failure in CI pipeline.

- [ ] **Step 3: Check turbo.json env passthrough**

```bash
grep -A5 '"env"' turbo.json
```

Any VITE_ variable used in app code but not listed in turbo env → Turbo caches builds ignoring that env change. Add missing vars.

- [ ] **Step 4: Check for env var name drift between packages**

```bash
grep -r 'VITE_SUPABASE_URL\|VITE_SUPABASE_ANON_KEY' packages/*/src/
```

The `@mpbhealth/database` and `@mpbhealth/config` packages reference env vars. Verify the names match across all apps and packages.

- [ ] **Step 5: Produce env var matrix**

Create a table documenting which vars are required per app:

| Variable | advisor-portal | admin-portal | crm | website | Edge Functions |
|----------|---------------|-------------|-----|---------|---------------|
| VITE_SUPABASE_URL | ✓ | ✓ | ✓ | ✓ | — |
| VITE_SUPABASE_ANON_KEY | ✓ | ✓ | ✓ | ✓ | — |
| SUPABASE_SERVICE_ROLE_KEY | — | — | — | — | ✓ |
| ITSTS_SUPABASE_URL | — | — | — | — | ✓ (ticket-proxy) |
| ITSTS_SERVICE_ROLE_KEY | — | — | — | — | ✓ (ticket-proxy) |
| VITE_GA_MEASUREMENT_ID | — | — | — | ✓ | — |
| ... | | | | | |

Add any missing to the relevant `.env.example` files.

- [ ] **Step 6: Add missing env vars to turbo.json**

```json
{
  "globalEnv": [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "VITE_GA_MEASUREMENT_ID",
    "VITE_COGNITO_FORMS_API_KEY"
    // add missing
  ]
}
```

- [ ] **Step 7: Commit**

```bash
git add turbo.json apps/*/.env.example .env.example
git commit -m "fix(infra): add missing env vars to turbo passthrough and .env.examples"
```

---

## Task 5: Audit CI/CD Pipeline

**Files:**
- Read: `.github/workflows/ci.yml`
- Read: `.github/workflows/security.yml`
- Read: `apps/*/vercel.json`
- Read: `vercel.json` (root)

- [ ] **Step 1: Read ci.yml**

```bash
cat .github/workflows/ci.yml
```

Check:
1. Node version matches `.nvmrc` (must be 20.x)
2. pnpm version matches root package.json `packageManager` field
3. Build step injects all required secrets as env vars
4. Jobs run in correct order (lint → typecheck → test → build)
5. `--frozen-lockfile` is used to prevent lockfile drift

- [ ] **Step 2: Check Vercel config per app for CSP gaps**

```bash
cat apps/advisor-portal/vercel.json
cat apps/admin-portal/vercel.json
cat apps/crm/vercel.json
cat vercel.json
```

Verify:
1. Each app has its own CSP header (not just the root)
2. CSP allows the Supabase URL (dtmnkzllidaiqyheguhl.supabase.co)
3. CSP allows Vercel analytics and edge runtime
4. No app is missing `X-Frame-Options: DENY`
5. `Referrer-Policy` is set

- [ ] **Step 3: Check for Vercel rewrites/redirects conflicts**

Each app's vercel.json may define rewrites. Check for conflicts:
- Does admin-portal rewrite `/api/*` to the wrong backend?
- Does advisor-portal have a catch-all that shadows valid routes?

```bash
grep -A5 '"rewrites"\|"redirects"\|"headers"' apps/*/vercel.json vercel.json
```

- [ ] **Step 4: Fix any CSP gaps**

If Supabase realtime or storage URLs are missing from CSP connect-src:

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com; ..."
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/*/vercel.json vercel.json .github/workflows/
git commit -m "fix(infra): align CSP headers and CI pipeline config across all apps"
```

---

## Task 6: Audit ESM/CJS Module Compatibility

**Files:**
- Read: `packages/*/package.json` (exports field)
- Read: `packages/*/tsconfig.json` (module field)

- [ ] **Step 1: Check all built packages for dual ESM/CJS output**

```bash
grep -A10 '"exports"' packages/auth/package.json
grep -A10 '"exports"' packages/database/package.json
grep -A10 '"exports"' packages/ui/package.json
grep -A10 '"exports"' packages/utils/package.json
grep -A10 '"exports"' packages/config/package.json
```

Each built package should have:
```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

If a package only has `"main"` but no `"exports"`, importing it as ESM may break in Vite.

- [ ] **Step 2: Verify tsup config matches package.json exports**

```bash
cat packages/auth/tsup.config.ts 2>/dev/null || cat packages/auth/package.json | grep '"build"'
```

tsup should be configured with `format: ['esm', 'cjs']` and `dts: true`.

- [ ] **Step 3: Fix any package missing dual output**

In the package's `tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
})
```

In `package.json`:
```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

- [ ] **Step 4: Rebuild affected packages**

```bash
pnpm --filter @mpbhealth/auth --filter @mpbhealth/ui --filter @mpbhealth/database build
```

- [ ] **Step 5: Run full typecheck to verify no import regressions**

```bash
pnpm -r typecheck 2>&1 | tail -20
```

- [ ] **Step 6: Commit**

```bash
git add packages/*/package.json packages/*/tsup.config.ts
git commit -m "fix(infra): ensure all built packages output dual ESM/CJS with correct exports field"
```

---

## Validation

- [ ] `pnpm install --frozen-lockfile` — no errors
- [ ] `pnpm -r build` — all packages and apps build
- [ ] `pnpm -r typecheck` — zero TS errors
- [ ] `pnpm -r lint` — zero lint errors
- [ ] Verify dist/ exists in all built packages
- [ ] Verify no duplicate `react` in bundle: `pnpm why react`

# apps/crm — DEPRECATED (2026-05-28)

> **This package is the legacy MPB CRM. It has been retired.**
> The active CRM is the standalone [aryx-crm](https://github.com/MPB-Health/aryx-crm) repo, deployed on the Vercel project `aryx-crm` and serving both:
> - `https://crm.mpb.health` — MPB tenant (full read-write)
> - `https://crm.aryx.pro` — ARYX SaaS tenant selector

## What changed (MPB → ARYX single-CRM consolidation)

As of **2026-05-28**, the MPB CRM has been consolidated onto the ARYX CRM
platform. The cutover:

1. Mirrored all MPB data (lead_submissions, lead_tasks, auth.users, etc.) into
   the ARYX Supabase project (`knelbprqqbjggqfqvfmc`) with 0% drift across
   every critical table.
2. Dropped the ARYX read-only RLS policies for the MPB tenant
   (migration `00000000000009_mpb_full_writable.sql` in the aryx-crm repo).
3. Removed app-layer + edge-function read-only gating so MPB is a fully
   writable tenant in ARYX.
4. Re-enabled ARYX pg_cron jobs for MPB
   (migration `00000000000010_cron_include_mpb.sql`).
5. Disabled the legacy → ARYX 5-minute sync pipeline
   (`SYNC_ENABLED=false` GitHub variable on `MPB-Health/aryx-crm`).
6. Moved the `crm.mpb.health` Vercel domain from this project (`crm`) to
   `aryx-crm`, so the same hostname now serves the ARYX app with the MPB
   brand applied via `packages/vendor/ui/brand` host-based detection.
7. Updated the website lead intake (`apps/website/src/lib/leadSubmissionService.ts`)
   to single-write to ARYX instead of the legacy dual-write.

## What stays

- The **legacy Supabase project** (`dtmnkzllidaiqyheguhl`) is **NOT decommissioned
  today**. It continues to host the live data of record for any external
  webhook callers that have not yet been reconfigured to ARYX (Resend, Calendly,
  GoTo Connect, M365/Outlook, Gmail, LinkedIn). The owner will decommission it
  after the webhook providers are all repointed and a safety period elapses.
- The **legacy Vercel project** (`crm`) is **NOT deleted**. The `crm.mpb.health`
  domain has been removed from it; the project still resolves at
  `crm.aryxcloud.com` and its `crm-rho-beryl.vercel.app` URL for emergency
  rollback access. Owner: remove the project once the cutover has stabilized.

## Do not develop here

All new CRM features ship in the [aryx-crm](https://github.com/MPB-Health/aryx-crm)
repo. Bug fixes against this codebase will only be merged for **emergency rollback**
scenarios.

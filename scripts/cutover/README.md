# `scripts/cutover/`

One-shot scripts for the legacy → ARYX Supabase cutover (`dtmnkzllidaiqyheguhl`
→ `knelbprqqbjggqfqvfmc`). Each script is idempotent, defaults to a dry run,
and only mutates state when invoked with `--apply`.

## Setup

Create `.env.cutover` at the repo root (already git-ignored via `.env*.local`
patterns; do NOT commit). Populate the variables required by whichever
provider you're cutting over:

```dotenv
# Calendly
CALENDLY_PERSONAL_ACCESS_TOKEN=eyJraWQ...
CALENDLY_ORGANIZATION_URI=https://api.calendly.com/organizations/AAAAAAAAAAAA
CALENDLY_USER_URI=https://api.calendly.com/users/BBBBBBBBBBBB    # optional
CALENDLY_SIGNING_KEY=                                            # optional

# Microsoft 365 / Graph
MS_GRAPH_TENANT_ID=00000000-0000-0000-0000-000000000000
MS_GRAPH_CLIENT_ID=11111111-1111-1111-1111-111111111111
MS_GRAPH_CLIENT_SECRET=...
MS_WEBHOOK_SECRET=must-match-edge-function-secret

# Gmail / Pub/Sub
GOOGLE_PROJECT_ID=mpb-prod-123456
GOOGLE_PUBSUB_TOPIC=projects/mpb-prod-123456/topics/gmail-events
GOOGLE_SERVICE_ACCOUNT_JSON=/abs/path/to/sa.json   # or inline JSON
GOOGLE_OAUTH_CLIENT_ID=...           # optional, for users.watch refresh
GOOGLE_OAUTH_CLIENT_SECRET=...       # optional

# Watchdog
SUPABASE_ACCESS_TOKEN=sbp_...
WATCHDOG_ALERT_TO=ops@mympb.com,vincent@mympb.com
WATCHDOG_ALERT_THRESHOLD=0
RESEND_API_KEY=re_...                # for watchdog alert emails

# Optional — for scripts that PATCH ARYX rows during cutover
ARYX_SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`tsx` isn't installed at the workspace root — these scripts run via
`npx tsx`, which downloads on demand the first time and caches in
`~/.npm/_npx/`. Same pattern as `scripts/check-user-email.ts`.

```bash
npx tsx scripts/cutover/repoint-calendly.ts          # dry run
npx tsx scripts/cutover/repoint-calendly.ts --apply  # commit
```

## Order of operations

1. **First**: confirm the SLA email path is unblocked.
   - `RESEND_API_KEY` set on ARYX edge functions.
   - `crm_sla_config.escalation_emails` populated for MPB
     (already done — `ops@mympb.com`, `vincent@mympb.com`).
   - Manually trigger the cron and check `resend_configured: true` in the
     response (see [Verification](#verification)).
2. **Second**: cut over the 5 webhook providers, one at a time, watching
   ARYX function logs after each. Suggested order (least → most blast radius):
   1. Resend (UI, instant)
   2. LinkedIn OAuth (UI, breaks new connects only)
   3. GoTo Connect (UI)
   4. Calendly (`repoint-calendly.ts`)
   5. Microsoft Graph (`repoint-graph.ts`)
   6. Gmail (`repoint-gmail.ts`)
3. **Daily, June 11 → July 11**: run `check-legacy-traffic.ts`. Wire it into
   GitHub Actions or local launchd; alerts go to `WATCHDOG_ALERT_TO`.
4. **June 11**: pause legacy Vercel CRM project + Supabase project
   (don't delete; PITR window still useful).
5. **July 11**: hard-delete legacy projects after 30 clean watchdog days.

## Scripts

| Script                       | What it does                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `repoint-calendly.ts`        | Lists every Calendly webhook subscription on your token, deletes those pointing at legacy, recreates against ARYX.              |
| `repoint-graph.ts`           | Same, for Microsoft Graph change-notification subscriptions. Patches `mail_accounts.provider_metadata.subscription_id` on ARYX. |
| `repoint-gmail.ts`           | Rewrites Pub/Sub push endpoints (in-place via `modifyPushConfig`) and re-issues `users.watch` per Gmail account on ARYX.        |
| `check-legacy-traffic.ts`    | Pulls last-24h invocation counts from the Supabase Management API for both projects; alerts on legacy traffic.                  |

All scripts share `_shared/env.ts` and `_shared/log.ts` for env loading and
prefix-formatted logging.

## Verification

After patching the SLA escalation list (already applied) and setting the
Resend key, manually invoke the cron:

```bash
ANON="$(supabase projects api-keys --project-ref knelbprqqbjggqfqvfmc | grep '^anon' | awk '{print $2}')"
curl -sS -X POST \
  https://knelbprqqbjggqfqvfmc.supabase.co/functions/v1/sla-breach-scan \
  -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d '{}'
```

Expected response shape (after Resend key is set):

```json
{
  "success": true,
  "scanned": 12,
  "past_deadline": 0,
  "escalated": 0,
  "emailed": 0,
  "resend_configured": true,
  "email_failures": [],
  "configs_active": 1
}
```

`emailed > 0` will only happen once a lead crosses its 24-business-hour
deadline AND has no prior `sla_breach` notification.

## Watchdog wiring (optional)

GitHub Actions example (drop into `.github/workflows/legacy-watchdog.yml`):

```yaml
name: Legacy traffic watchdog
on:
  schedule:
    - cron: '0 14 * * *'  # daily at 14:00 UTC = 10:00 ET
  workflow_dispatch:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: npx -y tsx scripts/cutover/check-legacy-traffic.ts
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          WATCHDOG_ALERT_TO: ops@mympb.com,vincent@mympb.com
          WATCHDOG_ALERT_THRESHOLD: '0'
```

A non-zero exit code will fail the run and surface in GitHub's UI.

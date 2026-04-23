# CRM 2026 Release Notes

**Release:** Sales Plan 2026 + Reports & Dashboards 2026 operationalization
**Audience:** Leonardo (Lead Manager), Tupac, Adam, and every rep on the CRM team.

---

## What's new

### Every lead has an owner, a deadline, and a next step — from the moment it hits the CRM

- **Round-robin on all intake paths.** Web forms, manual lead creation, spreadsheet imports, and the new on-site community form now all run through the same database trigger. Whoever's next in the pool gets the lead automatically.
- **24-business-hour SLA.** An **Initial Contact** task is auto-created on every new lead with the right due time for your timezone + business hours. If you miss it, Leonardo gets a ticker alert *and* an email 15 minutes after breach.
- **Follow-up cadences run themselves.** Each new lead is enrolled in the Sales Plan 2026 default cadence (24h → 3d → 7d → 14d → 30d). If you log a reply, book a meeting, or mark the deal Won / Lost, the cadence pauses automatically.

### Reports finally match the deck

- **Leonardo / Tupac / Adam are columns, not rows.** Performance, Revenue, Conversion, and Activity reports all show rep-as-column with a Team Total aggregate.
- **Leads Split is in spec order.** LinkedIn → Networking → Referrals → Community → Reactivation → TOTAL Self-Gen → Inhouse (RR) → GRAND TOTAL. Inhouse (RR) is the actual round-robin bucket, not "remainder".
- **Every report has filters.** Rep, Month / YTD, Lead Source, Lead Type, Outside Advisor, and Custom Date Range. Filters respect Lead Manager gating — regular reps are locked to their own data.
- **XLSX exports match the deck headers.** The button is hidden if you don't have `reports.export`.

### Attribution is real, not free-text

- **Referral Partner** + **Outside Advisor** pickers in the lead form bind to actual rows — no more mis-spelled names in reports.
- **Community events** now have a public on-site capture URL (`/forms/community/<event>`). Scan a QR at a booth, submit the form, and the lead is stamped with `community_event_id` and the event's counter goes up. The Outside Advisor Production report finally returns one row per advisor (not the same aggregate copy-pasted to every advisor).

### Reactivation is a 4-year, 4-week arc

- The default lookback is 4 years (configurable all the way back to 6 months).
- The default drip is weekly-themed: Wk1 email → Wk2 phone/text → Wk3 LinkedIn DM → Wk4 value-add email.
- Every reactivation spawns a new lead carrying `reactivation_source_lead_id` so Leads Split correctly counts it in the Reactivation row.

### Milestones + forecasts you can edit live

- Lead Managers can edit quarterly target rows inline on `/milestones`.
- Conservative / Moderate / Aggressive forecasts pull from editable **Avg revenue / sale** inputs so you can stress-test the plan without database access.

### Deals now carry a product line

- **Health Insurance** vs **Medical Cost Sharing**, seeded from an extensible lookup table so we can add new lines without a deploy.
- A database trigger rejects unknown slugs — Revenue by product line finally tells the truth.

### Activities are unified

- `lead_activities` is the single source of truth. Contact notes, deal notes, and rep quick-logs all write here so every report RPC sees them.
- EOD sheet covers all 18 activity types (inbound text, live chat, LinkedIn accepted / shared / short, …).
- LinkedIn content widget tracks per-rep **2 original + 2 shared + 2 shorts = 6/week**.

### Email A/B testing, wired end-to-end

- `sendFromABTest(testId, leadId)` buckets every lead deterministically (same lead → same variant, always).
- Sends, opens, clicks, and replies all increment `variant_{a,b}_sent` / `variant_{a,b}_success`.
- Works on the default Supabase Edge Functions — no external A/B tool.

### Sunbiz at your fingertips

- Any lead with a company name or any account shows a Sunbiz panel with a one-click corporate lookup.

---

## Breaking changes

- **`crm_activities` writes are deprecated.** Contact detail + EOD already write to `lead_activities`. Any remaining writers should migrate before `crm_activities` is dropped in a future phase.
- **`lead_notifications.type` renamed to `notification_type`** (Phase 2 schema fix — the prior column was silently absent on some installs and caused SLA escalations to fail). Existing readers should be updated; the schema migration is additive.
- **Leads now require `lead_source`.** Intake paths default to `inhouse_round_robin` if not specified; anything sending a custom slug must ensure it exists in `crm_lead_source_types`.
- **Reports export button** is gated behind the new `reports.export` permission. Owners / admins / managers get it automatically; everyone else will lose the button until granted.

## Known limitations

- Background Sunbiz enrichment is still manual (click-through lookup). Scraper automation lands in a follow-up phase.
- Playwright e2e has route-mount smoke + per-report smoke + RBAC smoke, but the full seeded-fixture critical path (intake → close → revenue) requires `E2E_CRM_AUTHED=1` and lands next.
- LinkedIn is still a manual logging MVP (no first-party API integration).

## Upgrade path

See [ROLLOUT-2026.md](./ROLLOUT-2026.md) for the full pre-flight, migration order, seed commands, and smoke-test checklist.

## Verification

- `pnpm --filter @mpbhealth/crm-core test` → **21/21 passing**.
- `pnpm --filter @mpbhealth/crm-core build` → clean.
- `pnpm --filter @mpbhealth/crm typecheck` → clean.
- `pnpm --filter @mpbhealth/crm build:verify` → bundle budgets (single JS ≤ 450kB gz, total JS ≤ 1400kB gz, total CSS ≤ 120kB gz) hold.

## Credits

- Sales Plan 2026 + Reports & Dashboards 2026 authored by the MPowering Benefits sales leadership team.
- Spec → implementation plan captured in [UPGRADE-PLAN-2026.md](./UPGRADE-PLAN-2026.md).
- Phase-by-phase history lives in [CHANGELOG-2026.md](./CHANGELOG-2026.md).

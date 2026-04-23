# CRM 2026 Upgrade — Phased Implementation Plan

> Source of truth spec: [CRM-MASTER-PROMPT-2026.md](./CRM-MASTER-PROMPT-2026.md)
> Changelog: [CHANGELOG-2026.md](./CHANGELOG-2026.md)
> Demo script: [DEMO-SCRIPT-2026.md](./DEMO-SCRIPT-2026.md)

## Context snapshot

The repo already contains a substantial prior pass. This is an audit + gap-closing engagement, not greenfield.

### What already exists and works

- **Schema**: `supabase/migrations/20260413100000_crm_sales_plan_2026.sql` (811 lines) + `20260413200000_crm_reporting_2026.sql` + fix migrations (`20260415100000`, `20260415200000`, `20260415500000`). All new tables with RLS and permission seeds exist.
- **Service factories**: `round-robin`, `sla`, `cadence`, `referrals`, `outside-advisors`, `community-events`, `targets`, `milestones`, `social`, `reactivation` services all exist in `packages/crm-core/src/` and are org-scoped registered in `apps/crm/src/contexts/CRMServiceContext.tsx`.
- **Pages**: 8 report pages routed under `/reports/*` with `reports.read` gate in `apps/crm/src/App.tsx`; entity pages for referral partners, outside advisors, community events, milestones.
- **XLSX export helper** `apps/crm/src/lib/xlsxExport.ts` is wired into each 2026 report page.
- **Outbound email open/click tracking** via Edge Functions `send-crm-email-v2` + `email-tracking`.

### What is broken or missing

- **Automation is dead code**: `RoundRobinService.assignNext` is never called on any intake path. `SLAService.createInitialContactTask` is never called. No worker detects SLA breaches. `CadenceService.pauseCadence` is never called. Cadence never enrolls a lead automatically. No UI guard on last-open-task deletion. `SLAService.escalate` writes columns (`user_id`, `type`, `message`) that don't exist on `lead_notifications`.
- **Lead source + `is_self_generated` not populated** on any intake path (web form edge function, `convertSubmission`, `AddLeadModal`, CSV import). `LeadCreateInput` in `packages/crm-core/src/leads/leadTypes.ts` omits both fields. This means the core split driving every 2026 report is unreliable.
- **Reporting formulas drift**: Outside Advisor Production RPC returns the same org-wide counts for every advisor row. `LeadsSplitReport` uses "remainder" for Inhouse instead of the `inhouse_round_robin` source. `PerformanceReport` is rows-per-rep instead of the deck's Leonardo | Tupac | Adam | Team Total columns. `linkedin_message` is the only activity type rolling up to "LinkedIn Messages". YTD is always calendar-year UTC.
- **Filters absent** across all 8 report pages even though `ReportLayout` has filter props.
- **Cross-rep data leak**: `SalesActivityDashboard` lets any user with `reports.read` switch between reps.
- **Reactivation wrong shape**: 90-day filter instead of 4-year lookback; generic email/call cadence instead of Wk1 Email / Wk2 Phone / Wk3 LinkedIn / Wk4 Value.
- **Quick-log + activity pipeline fragmented**: `QuickActionModals` only covers note/call/meeting. `ContactDetail` writes `crm_activities` while reports read `lead_activities` → split brain.
- **No seed** of Leonardo/Tupac/Adam. No "Lead Manager" concept.
- **Missing UIs**: milestone row editor, editable forecast avg-revenue inputs, community on-site capture form, unreferenced sunbiz helper, deal product_line picker.
- **A/B testing is mock only**. LinkedIn DM tracking does not exist. sales@mympb.com not hardwired.
- **Tests**: `packages/crm-core` has zero unit tests. `apps/crm` has two unrelated vitest files. Playwright targets advisor portal; CRM is opt-in smoke only.

## Critical path

The e2e suite must cover: `intake → round-robin → SLA task → cadence → close → revenue report`.

## Phases

### Phase 0 — Safety net & documentation baseline

- Save this plan.
- Scaffold `CHANGELOG-2026.md` and `DEMO-SCRIPT-2026.md`.
- Add `test` script + `vitest.config.ts` to `packages/crm-core`.
- Add CRM Playwright project to `playwright.config.ts`.

### Phase 1 — Foundations: users, Lead Manager role, lead source enforcement, `is_self_generated`

- Seed Leonardo / Tupac / Adam into a demo org (operator runbook for production).
- "Lead Manager" as a permission bundle + `isLeadManager(orgId)` helper in `@mpbhealth/auth`.
- `ALTER TABLE lead_submissions` add `outside_advisor_id`, `referral_partner_id` (both FK, nullable, indexed).
- Trigger that validates `lead_source` against `crm_lead_source_types.slug` and auto-populates `is_self_generated`.
- Extend `LeadCreateInput` / `LeadUpdateInput` with `lead_source`, `is_self_generated?`, `outside_advisor_id?`, `referral_partner_id?`, `reactivation_source_lead_id?`.
- Update all intake paths to require `lead_source`.

### Phase 2 — Lead lifecycle wiring

- Wire `RoundRobinService.assignNext` on every intake path.
- Wire `SLAService.createInitialContactTask` right after assignment.
- Fix `lead_notifications` schema mismatch; fix TZ handling in business-hour math.
- `sla-breach-scan` Edge Function triggered by `pg_cron` every 15 minutes.
- Seed default cadence per org; auto-enroll on lead create; auto-pause on reply, meeting booked, won/lost.
- Last-task UI guard in `TaskService.deleteTask`.

### Phase 3 — Reporting correctness, filters, XLSX column parity

- Rewrite `crm_outside_advisor_production` with correct `outside_advisor_id` grouping.
- Rep-as-column `PerformanceReport` with Team Total.
- Spec-accurate `LeadsSplitReport` row model (Inhouse (RR) from source, not remainder).
- Activate `ReportLayout` filters on all 8 pages (rep, month/YTD, source, type, advisor, custom range).
- Add `fiscal_year_start_month` + `timezone` on orgs; every RPC honors them.
- Unify Avg Deal Size numerator/denominator.
- `reports.export` permission; Lead-Manager gating on rep switcher.
- Annual overview: YTD tables under each chart; PDF export (stretch).
- XLSX header parity tested.

### Phase 4 — Reactivation, entities, targets, milestones, products, sunbiz

- Reactivation: 4-year lookback + segmentation + Wk1/Wk2/Wk3/Wk4 drip cadence.
- Referral attribution picker when source=referrals.
- Outside advisor attribution picker when source=outside_advisors.
- Community on-site capture form at `/forms/community/:eventId`.
- Milestone row editor (phases/targets/actuals) on `/milestones` gated on `targets.manage`.
- Editable avg-revenue inputs on forecast scenarios.
- `crm_product_lines` table (extensible); `product_line` on `crm_deals` with HI + MCS seeded.
- Wire `SunbizLookup` into lead and account detail pages.

### Phase 5 — Activity unification, email tokens, A/B, LinkedIn

- Collapse `crm_activities` into `lead_activities` (add nullable `contact_id`, migrate rows).
- Quick-log buttons on lead & contact detail for every activity type that feeds a report column.
- Persist call direction.
- Spec template tokens: `plan`, `renewal_date`, `industry`, `company`, `meeting_date`.
- `crm_email_ab_tests` table + EmailService variant assignment + tracking → variant metrics.
- LinkedIn MVP: per-rep 6/week widget (2 original + 2 shared + 2 shorts) with correct activity subtypes.
- Connected Inbox: per-org "primary shared inbox" flag; OAuth operator-connects `sales@mympb.com`.

### Phase 6 — Tests, e2e, bundle budget, RBAC hardening

- Unit tests in `@mpbhealth/crm-core` per service.
- SQL-function tests for the 11 reporting RPCs.
- Playwright CRM specs: critical-path, per-report smoke, RBAC cross-rep denial.
- `size-limit` bundle budgets.
- CI split `test` (vitest) + `test:e2e` (Playwright CRM project).
- RBAC audit of every Section A page/mutation.

### Phase 7 — Docs, demo script, release

- Finalize `CHANGELOG-2026.md` with per-phase entries.
- Complete `DEMO-SCRIPT-2026.md` so Leonardo can run the system end-to-end.
- Release notes + rollout checklist.

## Applied decisions

1. **Lead Manager** = permission bundle + `isLeadManager` helper.
2. **Fiscal year** defaults to calendar (Jan–Dec); stored per-org for future change.
3. **sales@mympb.com** = OAuth operator-connects; per-org "primary shared inbox" flag surfaced.
4. **LinkedIn DM tracking** = MVP manual logging + corrected widget only. No external API this pass.
5. **Sunbiz** = MVP (wire existing helper). Scraper deferred.
6. **Activity unification** = proceed (collapse `crm_activities` → `lead_activities` via `contact_id`).
7. **Seeded users** = demo org only; production seeding documented as operator runbook step.

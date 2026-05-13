# CRM Section 9 IA cleanup — removed sidebar entries

Audit reference: `Changes to the CRM.pdf`, Section 9 (Cleanup) + Round 5
Addendum (Today/Dashboard merge) + Round 5 Addendum invoices deferral.

This document tracks every sidebar entry removed in Phase 1 of the CRM
rebuild, where the underlying data lives now, and what (if anything) is
in flight for full retirement of the surviving routes.

| Removed entry | Old route | Status of route handler | Where the data goes now | Owner / next step |
|---|---|---|---|---|
| Quick Rate Leads | `/leads/quick-rate-estimate` | Route still resolves; sidebar link gone. | The Get-a-Quote calculator on the public website is the single source of new "rate estimate" leads. Records continue to land in `lead_submissions` with `lead_source = 'website_quote'` and `pipeline_stage = 'new'`. | P5 — retire the standalone CRM page once the website calculator funnel is fully audited. |
| Reactivation | `/reactivation` → 302 to `/templates` | `/reactivation/legacy` keeps the existing module mounted for cutover. | OE Reactivation cadence (annual Sept-15 push) becomes a master cadence in `crm_follow_up_cadences` named `OE Reactivation — Nurture bulk` (already seeded). Per-lead state lives on `crm_lead_cadence_state`. | P3 — Reactivation cadence lives under Templates → Master Library. |
| Quotes (sidebar entry) | `/quotes` | Route still resolves; sidebar link gone. | Per-lead quote history is the primary source on the Lead Profile (`crm_lead_quote_history` table, rendered by `LeadMpWorkflowPanel`). Quote Print View still works at `/quotes/:id/print`. | P2 — confirm `crm_lead_quote_history` has full coverage; retire `Quotes` listing once Lead Profile section is canonical. |
| Invoices (sidebar entry) | `/invoices` | Route still resolves; sidebar link gone. | Round 5 Addendum: invoice handling is deferred to a future "Members Payment Profile" subsection (NOT in this rebuild). No data migration this cycle. | Future — a Members → Payment Profile subsection will absorb invoice history. |
| Social Media | `/social-media` | Route still resolves; sidebar link gone. | Marketing campaign tracking remains in `Campaigns`. Social-specific posts/ads are deferred. | P5 — drop route handler when the page is officially retired. |
| Ad Campaigns | `/social-media/ads` | Route still resolves; sidebar link gone. | Same — `Campaigns` is the single channel. | P5 — drop route handler. |
| Community Events | `/community-events` (+ `/:id`) | Route still resolves; sidebar link gone. | Community-event-sourced leads still arrive via `/forms/community/:eventId` and land in `lead_submissions`. The internal community-events list is no longer surfaced. | P5 — confirm event capture remains via the public form, retire admin list. |
| Sales Activity | `/sales-activity` | Route still resolves; sidebar link gone. | Per-rep activity tracking moves into the new auto-capturing Daily Log (`crm_rep_daily_log_entries` + `crm_daily_log_events`, P4) and the Activity Detail panel inside the Lead Profile. | P4 — retire `/sales-activity` once Daily Log v2 is live. |
| Studio | `/studio*` | Route still resolves; sidebar link gone. | Custom modules are paused until further notice — keep the data tables but remove from sales-rep-facing surfaces. | Future — keep behind admin flag only. |
| End of Day | `/end-of-day` → 302 to `/sales-daily-logs?mode=multi` | `/end-of-day/legacy` keeps the old page during cutover. | Multi-entry mode tab inside the new Sales Daily Logs page (P4). | P4 — Multi-entry tab replaces the standalone page. |
| Meetings (top-level) | `/meetings` → 302 to `/calendar` | `/meetings/legacy` keeps `MeetingScheduler` mounted for a cycle. | Calendar view (Section 9 — Calendar absorbs Meetings). Two-way Outlook sync ships in P5. | P5 — wire Outlook subscription delete the old MeetingScheduler page. |
| Dashboard (sidebar entry) | `/dashboard` → 302 to `/today` | `/dashboard/legacy` mounts the legacy Dashboard for cycle of cutover. | New merged "Today" page (P2 build). Default authenticated landing route is `/today`. | P2 — merged Today page absorbs unique Dashboard widgets. |

## Routes added in P1

| Route | Renders | Why |
|---|---|---|
| `/members` (and `/members/:id`) | The existing `Contacts` / `ContactDetail` components | Section 9 rename Contacts → Members. Both routes resolve to the same component set so deep links to `/contacts/...` keep working through the rollout. |
| `/recruiting` | `RecruitingList` (P5) | Section 9 + Round 5 Addendum new module. List + detail view, 7 locked stages, dedicated `crm_recruiting_records` table. |
| `/recruiting/:id` | `RecruitingDetail` (P5) | Same — recruit profile with the 5-button action row + Mark Inactive. |

## Notes

- **No row data moved in P1.** All renames + reorganizations are pure
  navigation/IA. Underlying tables (`lead_submissions`, `crm_contacts`,
  `crm_email_sequences`, etc.) are unchanged in this cycle aside from the
  schema additions documented in `crm_p1_*` migrations.
- **Permission keys**: a new `recruiting.read` / `recruiting.write` pair
  guards the recruiting route (granted to owner/admin/manager/agent in
  the default org). Master template management lives behind a new
  `templates.master.manage` (admin-only) — used in P3.
- **Legacy `public.leads` table** has been renamed to
  `public._deprecated_leads` with all access revoked. CRM app code uses
  `lead_submissions` exclusively; no application reads/writes touch the
  legacy table.

## Phase 3 — Templates, cadences, website auto-response

Routes added:

| Route | Renders | Why |
|---|---|---|
| `/templates/master` | `MasterTemplates` | Section 7 admin-only Master Template Library, gated on `templates.master.manage`. Reps don't see this in the sidebar. |
| `/cadences` | `Cadences` | Section 13 multi-channel cadence builder. Lives under Settings → Cadences for admins. |

Schema:

- `crm_master_templates` — admin-controlled email / SMS / phone-script templates.
  RLS: select for any org member; insert/update/delete gated on
  `templates.master.manage`. Versioning is in-place (the row id is stable for
  cadence references; the `version` integer increments on every save).
- `crm_follow_up_cadences` gains `halt_on_engagement`, `halt_on_optout`,
  `description`, and `schema_version`. Step jsonb v2:
  `{ step, channel, template_id, day_offset, send_window, halt_on_engagement, description }`.
- New RPCs:
  - `crm_register_engagement_signal(p_lead_id, p_signal_type)` — pauses
    halt_on_engagement cadences and advances Working/Quoted → Engaged.
  - `crm_enroll_lead_in_cadence(p_lead_id, p_cadence_id)` — idempotent
    enrollment used by the website intake function and the Lead Profile
    "Enroll in cadence" dropdown.

Edge functions:

- `crm-website-lead-intake` — wraps `submit_public_lead`, enrolls the lead in
  the org's Quote Response cadence, sends Email #1 from sales@mympb.com (Round
  7 Addendum: display name "MPB.Health Sales") via `send-crm-email-v2`, and on
  send success advances `new → quoted` with the
  `lead_source_attribution = 'website_auto_response'` tag.
- `receive-crm-email` updated to use the new `crm_detect_opt_out` (data-driven
  keyword detector) and `crm_register_engagement_signal` RPCs. Inbound replies
  with opt-out keywords now route the lead to Lost / DNC; clean replies
  advance Working/Quoted → Engaged and pause the cadence.

Open items / decisions still required:

- **Quote Response cadence content** — the seed migration creates 6 placeholder
  steps (Day 0 / 3 / 7 / 14 / 21 / 30). Admins must paste the verbatim subject
  and body from `Quote Response Email Cadence (Call to Action LinkedIn).docx`
  into the master template editor before the website auto-response goes live.
  Until those templates exist, `crm-website-lead-intake` creates the lead and
  enrolls it in the cadence but skips Email #1 (the response includes
  `auto_response_pending: true`).
- **`#yoursignature` token** currently resolves to a hard-coded MPB Sales
  signature inside `crm-website-lead-intake`. P3 follow-up should source this
  from `email_signatures` (per-org default) so signature edits don't require
  redeploys.

## Phase 4 — Daily Log auto-capture + Performance Lag Alert

Routes:

| Route | Renders | Why |
|---|---|---|
| `/sales-daily-logs` | `DailyLogV2` (P4) | Replaces the localStorage page with a Realtime accordion fed by `crm_daily_log_events`. Sections in spec order, `manual` flag on every row, Special Projects manual entry inline. |
| `/sales-daily-logs/legacy` | `SalesDailyLogs` (legacy) | Kept for one cycle of cutover so reps can compare counters. |

Schema:

- `crm_rep_daily_log_entries` extended with `cancellation_calls`, `pipeline_actions`,
  `deals_closed`, `activities_other`, `content_creation`, `manual_flag`, and
  `section_open_state` (jsonb of which accordion sections are open per rep).
- `crm_daily_log_events` — Realtime-emitted granular events. Filled by triggers on
  `crm_activities`, `crm_email_log` (outbound only), and `crm_special_projects`.
- `crm_special_projects` — manual-only projects (name + minutes + notes).
- `crm_performance_alert_log` — fires from `crm_scan_performance_lag(org_id)`
  RPC. The Daily Log v2 page surfaces the most recent active alert per rep
  in a banner. Cron entry: `crm-scheduled-jobs` `{ "job": "performance_lag_scan" }`.

Functions / RPCs:

- `crm_classify_log_section(activity_type, source)` — maps inputs into the
  Section 11 buckets.
- `crm_daily_log_rollup()` — trigger function that updates the rep's
  `crm_rep_daily_log_entries` row whenever a new event lands.
- `crm_dl_emit_from_activity()` — trigger on `crm_activities` (skips
  inbound calls so they don't inflate rep output).
- `crm_dl_emit_from_email_log()` — trigger on `crm_email_log` for sent /
  delivered outbound only.
- `crm_dl_emit_from_special_project()` — trigger on `crm_special_projects`.
- `crm_scan_performance_lag(p_org_id)` — rolling 5-business-day average,
  80% threshold, 7-day quiet period, returns one row per rep.

See `docs/crm/excel-retirement-checklist.md` for the column-by-column
mapping from `Sales Team Daily Log & Reports.xlsx` to the new tables and
the cutover gates before retiring the spreadsheet.

## Phase 5 — Recruiting clone + Integrations stubs

Schema:

- `crm_recruiting_pipeline_stages` — 7 locked stages (Prospect → Inactive),
  one row per org per stage. RLS gated by `recruiting.read` / `.write`.
- `crm_recruiting_records` — agent-specific fields (`license_number`,
  `npn`, `appointed_carriers`, `agency_affiliation`), reuses the
  Lead-style `workflow_subsection` enum (`working` / `nurture` / `linkedin`
  / `do_not_contact`). RLS gated by `recruiting.read` / `.write`.
- `crm_recruiting_records_touch()` BEFORE UPDATE trigger keeps `updated_at`
  current and stamps `stage_changed_at` on stage transitions.

Frontend:

- `RecruitingList` — clones the Leads list (subsection bar, search, sort
  by `last_touched_at`). Recruit-specific columns: agency, license / NPN.
- `RecruitingDetail` — clones the Lead profile's 5-button action row plus a
  "Mark Inactive" terminal action. Activities log to `crm_activities` with
  `related_to_type = 'recruiting'`, so the Phase 4 daily-log triggers fire
  identically to leads.

Integrations:

- `IntegrationsHub` keeps the existing 3-card UI (Outlook, GoTo Connect,
  LinkedIn) backed by `crm_integration_accounts`. OAuth + sync workers
  ship as dedicated follow-up PRs — see
  `docs/crm/integrations-recruiting-plan.md` for the per-provider scope
  and env requirements.

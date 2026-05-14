# CRM Section 9 IA cleanup — removed sidebar entries

Audit reference: `Changes to the CRM.pdf`, Section 9 (Cleanup) + Round 5
Addendum (Today/Dashboard merge) + Round 5 Addendum invoices deferral.

This document tracks every sidebar entry removed in Phase 1 of the CRM
rebuild, where the underlying data lives now, and what (if anything) is
in flight for full retirement of the surviving routes.

| Removed entry | Old route | Status of route handler | Where the data goes now | Owner / next step |
|---|---|---|---|---|
| Quick Rate Leads | `/leads/quick-rate-estimate` → 302 to `/leads` | `/leads/quick-rate-estimate/legacy` keeps `QuickRateEstimateLeads` mounted for admin audit. | The Get-a-Quote calculator on the public website is the single source of new "rate estimate" leads. Records continue to land in `lead_submissions` with `lead_source = 'website_quote'` and `pipeline_stage = 'new'`. | P5 — retire the standalone CRM page once the website calculator funnel is fully audited. |
| Reactivation | `/reactivation` → 302 to `/templates` | `/reactivation/legacy` keeps the existing module mounted for cutover. | OE Reactivation cadence (annual Sept-15 push) becomes a master cadence in `crm_follow_up_cadences` named `OE Reactivation — Nurture bulk` (already seeded). Per-lead state lives on `crm_lead_cadence_state`. `crm_oe_reactivation_runs` is **empty (0 rows)** — no orphaned data to migrate. | P3 — Reactivation cadence lives under Templates → Master Library. |
| Quotes (sidebar entry) | `/quotes` → 302 to `/today`; `/quotes/:id` → 302 to `/quotes/legacy/:id` | `/quotes/legacy` and `/quotes/legacy/:id` keep `Quotes` / `QuoteDetail` mounted for admin audit. Print routes (`/quotes/:id/print`) bypass MainLayout and stay reachable. | Per-lead quote history is the primary source on the Lead Profile (`crm_lead_quote_history`, rendered by `LeadMpWorkflowPanel`). `crm_quotes`, `crm_quote_line_items`, `crm_quote_templates` are **empty (0 rows each)** — no orphaned data to migrate. | P5 — drop the legacy admin views once Lead Profile is canonical for at least one OE cycle. |
| Invoices (sidebar entry) | `/invoices` → 302 to `/members`; `/invoices/:id` → 302 to `/invoices/legacy/:id` | `/invoices/legacy` and `/invoices/legacy/:id` keep `Invoices` / `InvoiceDetail` mounted for admin audit. Print routes (`/invoices/:id/print`) stay reachable. | Round 5 Addendum: invoice handling is deferred to a future "Members → Payment Profile" subsection (NOT in this rebuild). `invoices`, `crm_invoices`, `crm_invoice_line_items`, `crm_invoice_payments` are **empty (0 rows each)** — no orphaned data to migrate. | Future — a Members → Payment Profile subsection will absorb invoice history. |
| Social Media | `/social-media` → 302 to `/campaigns` | `/social-media/legacy` keeps `SocialMedia` mounted for admin audit. | Marketing campaign tracking remains in `Campaigns`. `crm_social_posts` and `crm_social_platform_connections` are **empty (0 rows each)** — no orphaned data to migrate. | P5 — drop legacy variant when the page is officially retired. |
| Ad Campaigns | `/social-media/ads` → 302 to `/campaigns` | `/social-media/legacy/ads` keeps `SocialMediaAds` mounted for admin audit. | Same — `Campaigns` is the single channel. No backing tables specific to ads have any rows. | P5 — drop legacy variant. |
| Community Events | `/community-events` (+ `/:id`) → 302 to `/today` | `/community-events/legacy` (+ `/legacy/:id`) keeps `CommunityEvents` / `CommunityEventDetail` mounted for admin audit. | Community-event-sourced leads still arrive via `/forms/community/:eventId` and land in `lead_submissions`. `crm_community_events` is **empty (0 rows)** — no orphaned data to migrate. The internal admin list is no longer surfaced. | P5 — confirm event capture remains via the public form, retire admin list. |
| Sales Activity | `/sales-activity` → 302 to `/sales-daily-logs` | `/sales-activity/legacy` keeps `SalesActivityDashboard` mounted for admin audit. | Per-rep activity tracking moves into the new auto-capturing Daily Log (`crm_rep_daily_log_entries` + `crm_daily_log_events`, P4) and the Activity Detail panel inside the Lead Profile. No backing table loss. | P5 — retire `/sales-activity/legacy` once a full quarterly audit confirms parity with Daily Log v2. |
| Studio | `/studio*` → 302 to `/settings` | `/studio/legacy*` keeps `StudioHome` + `CustomModuleList`/`CustomModuleDetail` mounted for admin audit. The dynamic `/custom/:moduleApiName` endpoint stays so any in-flight custom-module records remain reachable. | Custom modules are paused until further notice. `crm_studio_modules` and `crm_studio_fields` are **empty (0 rows each)** — no orphaned data to migrate. | Future — keep behind admin flag only; revisit when the platform reopens custom-module work. |
| End of Day | `/end-of-day` → 302 to `/sales-daily-logs?mode=multi` | `/end-of-day/legacy` keeps the old page during cutover. | Multi-entry mode tab inside the new Sales Daily Logs page (P4). | P4 — Multi-entry tab replaces the standalone page. |
| Meetings (top-level) | `/meetings` → 302 to `/calendar` | `/meetings/legacy` keeps `MeetingScheduler` mounted for a cycle. | Calendar view (Section 9 — Calendar absorbs Meetings). Two-way Outlook sync ships in P5. | P5 — wire Outlook subscription delete the old MeetingScheduler page. |
| Dashboard (sidebar entry) | `/dashboard` → 302 to `/today` | `/dashboard/legacy` mounts the legacy Dashboard for a cycle of cutover. | New merged "Today" page. Default authenticated landing route is `/today`. | P2 — merged Today page absorbs unique Dashboard widgets. |
| Contacts (sidebar entry) | `/contacts` → 302 to `/members`; `/contacts/:id` → 302 to `/members/:id` | `/contacts/legacy` and `/contacts/legacy/:id` keep the old `Contacts` / `ContactDetail` mounted for admin audit. | Section 9 rename: `/members` is the canonical route, served by the same components. The page header, breadcrumbs, sidebar label, command palette, global search results, AI chat context, and `NotificationTicker` deep links all use "Members" / `/members/...` going forward. | P5 — drop the `/contacts/legacy*` redirects after one cutover cycle. |

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

## Round 5 closeout — orphaned-data audit (2026-05-14)

Re-audit performed after Round 5 (Section 9) to satisfy the spec line
> "For each removed section, audit for orphaned data and either migrate
>  to a surviving module or document the loss before removal."

| Removed section | Backing table(s) | Row count | Decision |
|---|---|---|---|
| Quick Rate Leads | none (filtered view of `lead_submissions`) | n/a | No migration; data is on `lead_submissions` already. |
| Reactivation | `crm_oe_reactivation_runs` | 0 | No migration; OE Reactivation is a master cadence. |
| Quotes | `crm_quotes`, `crm_quote_line_items`, `crm_quote_line_item_answers`, `crm_quote_templates`, `crm_lead_quote_history` | 0 each | No migration; per-lead quote history is the canonical surface. |
| Invoices | `invoices`, `crm_invoices`, `crm_invoice_line_items`, `crm_invoice_payments` | 0 each | No migration; deferred to a future Members → Payment Profile subsection. |
| Social Media / Ad Campaigns | `crm_social_posts`, `crm_social_platform_connections` | 0 each | No migration; channel rolls up into `Campaigns`. |
| Community Events | `crm_community_events` | 0 | No migration; capture stays via `/forms/community/:eventId`. |
| Sales Activity | n/a (dashboard view) | n/a | No migration; activity lives in `crm_daily_log_events` + `lead_activities`. |
| Studio | `crm_studio_modules`, `crm_studio_fields`, `crm_studio_layouts`, `crm_studio_validation_rules`, `crm_studio_views` | 0 each | No migration; custom-module work paused. Tables retained for future re-enablement. |

**Net result:** every removed section has either (a) an empty backing
table set, so removal is non-destructive, or (b) no backing tables at
all (it was always a derived view). No data migration scripts are
required for Round 5 cleanup.

### Cutover redirects added in this round

- `/leads/quick-rate-estimate` → `/leads` (legacy at `/leads/quick-rate-estimate/legacy`)
- `/quotes` → `/today`; `/quotes/:id` → `/quotes/legacy/:id` (legacy variants kept)
- `/invoices` → `/members`; `/invoices/:id` → `/invoices/legacy/:id` (legacy variants kept)
- `/social-media` → `/campaigns` (legacy at `/social-media/legacy`)
- `/social-media/ads` → `/campaigns` (legacy at `/social-media/legacy/ads`)
- `/sales-activity` → `/sales-daily-logs` (legacy at `/sales-activity/legacy`)
- `/studio`, `/studio/modules/new`, `/studio/modules/:id/*` → `/settings`
  (legacy at `/studio/legacy*`)
- `/contacts` → `/members`; `/contacts/:id` → `/members/:id`
  (legacy at `/contacts/legacy*`)

Each cutover follows the **redirect primary path → keep `/legacy` for
admin audit during one cutover cycle** pattern already used by
`/community-events`, `/reactivation`, `/end-of-day`, `/dashboard`, and
`/meetings` in earlier rounds. Print routes (`/quotes/:id/print`,
`/invoices/:id/print`) live above the protected `MainLayout` and remain
reachable for any external bookmark.

### In-app rename rollups (Contacts → Members)

The Section 9 rename was finished by updating every rep-facing reference:

- Sidebar label, breadcrumb, page header (`Contacts.tsx` `GradientHeader` →
  "Members"), and "New Contact" CTA → "New Member".
- `Contacts.tsx` row click and modal navigation now hit `/members/:id`.
- `ContactDetail.tsx` "Back to Contacts" button + breadcrumb rewritten to
  "Back to members" / "Members".
- Cross-module deep links from `AccountDetail`, `DealDetail`,
  `CaseDetail`, `QuoteDetail`, and `InvoiceDetail` now target
  `/members/:id`.
- Command Palette (`useCommandPalette` and `CommandPalette` entity-create
  paths), AI Command Bar (`AICommandBar` nav map), Global Search
  (`GlobalSearch` entity config), AI Chat (`AIChatPanel` page-context
  inference), and the `NotificationTicker` notification router all now
  emit "Members" / `/members/...`.
- Page-help registry (`apps/crm/src/help/registry.ts`) keys are aligned —
  `/members` and `/contacts/legacy` both register the existing
  `contactsPageHelp`, while removed-section help entries
  (`/quotes/legacy`, `/invoices/legacy`, `/social-media/legacy`,
  `/sales-activity/legacy`, `/studio/legacy*`, `/community-events/legacy`,
  `/reactivation/legacy`, `/leads/quick-rate-estimate/legacy`) remain
  available so admins auditing the legacy variants still see the
  existing help content.

### Outstanding follow-ups for P5

1. After one full cutover cycle, drop the `/legacy` route registrations
   in `apps/crm/src/App.tsx` and the matching `pages/*` files
   (`Quotes.tsx`, `QuoteDetail.tsx`, `Invoices.tsx`, `InvoiceDetail.tsx`,
   `SocialMedia.tsx`, `SocialMediaAds.tsx`, `SalesActivityDashboard.tsx`,
   `studio/StudioHome.tsx`, `studio/CustomModuleList.tsx`,
   `studio/CustomModuleDetail.tsx`, `QuickRateEstimateLeads.tsx`,
   `Reactivation.tsx`, `MeetingScheduler.tsx`, `CommunityEvents.tsx`,
   `CommunityEventDetail.tsx`, `Dashboard.tsx`, `SalesDailyLogs.tsx`,
   `EndOfDay.tsx`).
2. Once the legacy variants are dropped, remove the empty backing tables
   (or move them to a `_deprecated_` schema) — see the audit table above.
3. Decide on the future of `/custom/:moduleApiName`. The dynamic
   custom-module routes still resolve, but the Studio surface to create /
   edit modules is hidden. If custom modules will not return, retire the
   `/custom/*` routes alongside the legacy Studio variants.

## Round 5 — Recruiting clone parity (Phase 7)

Spec ("New Section — Recruiting" + "Clone From Leads Module"): the new
Recruiting workspace is structurally a clone of Leads but with data,
sends, and cadences kept fully separate from consumer Members and Leads.
The Phase 5 work shipped the section + permission + DB scaffolding; this
round closes the parity gaps the spec calls out by name.

### Schema migrations (this round)

- `supabase/migrations/20260620440000_crm_p7_recruiting_clone_parity.sql`
  - Adds `crm_follow_up_cadences.module_scope` (`'leads'` \| `'recruiting'`),
    backfills existing rows to `'leads'`, indexes
    `(org_id, module_scope, is_active)`.
  - Rebuilds `crm_enroll_lead_in_cadence(p_lead_id, p_cadence_id)` to
    refuse recruiting-scoped cadences with a clear error so a Lead
    Profile dropdown can never enroll a consumer lead in an
    agent-recruitment sequence (matching the LeadMpWorkflowPanel
    client-side filter).
  - Extends `crm_focus_items.entity_type` check constraint to accept
    `'recruiting'` so Pin↔Unpin from the Recruit Profile reuses the
    existing focus_items table.
  - Creates `crm_recruit_cadence_state` empty + RLS-locked, mirroring
    `crm_lead_cadence_state` so the recruit-side scheduled-send worker
    can ship without another schema migration.
- `supabase/migrations/20260620450000_crm_p7_email_log_recruit_attribution.sql`
  - Adds `crm_email_log.recruit_id` (nullable FK to
    `crm_recruiting_records`) + partial index, so sends from the Recruit
    Profile composer or recruiting bulk-send attribute correctly without
    writing into the leads pipeline.

### Edge function updates

- `supabase/functions/send-crm-email/index.ts` and
  `supabase/functions/send-crm-email-v2/index.ts` — accept an optional
  `recruit_id` and persist it on `crm_email_log.recruit_id`. Resend tags
  also include `recruit_id` so any inbound webhook attribution stays
  intact.

### Frontend wiring

- `apps/crm/src/hooks/useFocusItems.ts` — `FocusItem.entity_type` union
  expanded to include `'recruiting'` so `pinItem('recruiting', recruitId)`
  works without TypeScript suppression.
- `apps/crm/src/pages/recruiting/RecruitingDetail.tsx` — Pin↔Unpin
  toggle wired through `useFocusItems`; tab bar (Overview / Email /
  Activity); Email tab mounts `RecruitingProfileEmailTab`; the old
  "ships next iteration" toast is removed.
- `apps/crm/src/components/recruiting/RecruitingProfileEmailTab.tsx` —
  in-profile composer with template insert. Lists Master Library +
  per-rep templates, prefills subject/body with `#firstname` /
  `{{first_name}}` token replacement, sends via `send-crm-email-v2`
  with `recruit_id`, writes `crm_activities` (so Daily Log auto-capture
  fires) and bumps `last_touched_at` + `last_contacted_at`. Reads
  recent recruit-attributed emails from `crm_email_log` filtered by
  `recruit_id`.
- `apps/crm/src/pages/recruiting/RecruitingList.tsx` — row checkboxes,
  shared `BulkActionsToolbar`, CSV export, bulk Mark Inactive, and the
  two new bulk modals.
- `apps/crm/src/components/recruiting/BulkAssignRecruitsModal.tsx` —
  mirrors `BulkAssignModal` but writes to
  `crm_recruiting_records.assigned_to` and uses `useOrgReps`.
- `apps/crm/src/components/recruiting/BulkEmailRecruitsModal.tsx` —
  mirrors `BulkEmailModal` but loops calling `send-crm-email-v2` with
  `recruit_id`. Skips recruits without an email on file with a warning
  banner. Batches 5 sends per second with a progress bar.
- `apps/crm/src/pages/Cadences.tsx` — Leads / Recruiting / All filter,
  scope chip on each cadence card, two separate "New Cadence" buttons
  (one per scope), empty-state copy that switches per filter.
- `apps/crm/src/components/leads/LeadMpWorkflowPanel.tsx` — enrollment
  dropdown filters by `module_scope='leads'` so reps never see
  recruiting cadences in the lead profile.

### Cross-Cutting Cleanup (Round 5)

- `apps/crm/src/help/articles/getting-started.ts` — adds the
  `gs-round5-rebrand` article ("What's new — Section 9 navigation
  refresh") with a full cheat-sheet of renames + redirects + the new
  Recruiting workspace.
- `apps/crm/src/help/articles/recruiting.ts` (new) — registers
  `recruitingPageHelp` for `/recruiting` + `/recruiting/:id` and adds
  `rec-overview` + `rec-bulk-actions` articles.
- `apps/crm/src/help/articles/products-quotes-invoices.ts`,
  `crm-studio.ts`, `campaigns-marketing.ts`, `referral-network.ts` —
  page-help titles re-tagged "(Legacy)" with explanatory descriptions
  pointing at the new canonical surfaces.
- `apps/crm/src/help/articles/accounts-contacts.ts` —
  `contactsPageHelp` retitled "Members" with a rename note;
  `accountsPageHelp` annotated.
- `apps/crm/src/help/types.ts` — `HelpModule` union extended with
  `'recruiting'`.
- `apps/crm/src/help/registry.ts` — registers the Recruiting page help
  + articles into the global registry.

### Verification

- `apply_migration` succeeded against the live project for both
  `20260620440000_crm_p7_recruiting_clone_parity` and
  `20260620450000_crm_p7_email_log_recruit_attribution`.
- `pnpm --filter @mpbhealth/crm exec tsc --noEmit` — clean.
- `ReadLints` on every touched file — no lints.
- Verified post-apply: `crm_follow_up_cadences.module_scope` exists and
  defaults to `'leads'`; `crm_focus_items_entity_type_check` now accepts
  `'recruiting'`; `crm_recruit_cadence_state` table exists.

### Outstanding (next round)

- Recruiting cadence content — admins draft and seed agent-recruitment
  master templates + cadences per spec ("Cadence content (agent-
  recruitment messaging) to be drafted separately — does not reuse the
  Quote-Response cadence").
- Recruiting cadence enrollment runner — recruit equivalent of the
  `crm-cadence-ticker` scheduled job. Schema is ready
  (`crm_recruit_cadence_state`); only the worker is pending.
- Surface recruit-pinned items on the `/today` page focus list (today
  the Pin button works and the row is stored, but the Today page does
  not yet render `entity_type='recruiting'` cards).
- Recruiting subsection list and required-field lock — Section 10
  (Round 5 Addendum) closes the **stage list** lock; subsection / field
  locks remain "future round" per spec.

## Round 5 Addendum (Section 10) — 2026-05-12

Locks the Recruiting pipeline stages and parks Invoices for a future
Members-side build. No new sidebar entries, no UI changes — purely a
schema-level commitment + roadmap tag.

### Recruiting — Pipeline Stages (Locked)

Canonical 7 stages, enforced at the database level by migration
`supabase/migrations/20260620460000_crm_p7_recruiting_pipeline_lock.sql`:

| # | name | display_name | terminal? | color |
|---|---|---|---|---|
| 1 | `prospect`     | Prospect     | no  | `#3B82F6` |
| 2 | `contacted`    | Contacted    | no  | `#6366F1` |
| 3 | `interviewing` | Interviewing | no  | `#8B5CF6` |
| 4 | `contracted`   | Contracted   | no  | `#F59E0B` |
| 5 | `onboarding`   | Onboarding   | no  | `#10B981` |
| 6 | `active`       | Active       | yes | `#22C55E` |
| 7 | `inactive`     | Inactive     | yes | `#EF4444` |

Schema enforcement:

- CHECK `crm_recruiting_pipeline_stages.name` is one of the 7 canonical
  values.
- CHECK `crm_recruiting_pipeline_stages.sort_order` is between 1 and 7.
- CHECK `crm_recruiting_pipeline_stages.is_terminal = (name IN ('active',
  'inactive'))` — terminality cannot be flipped.
- CHECK `crm_recruiting_records.pipeline_stage` is one of the 7
  canonical values.
- BEFORE UPDATE OR DELETE trigger `crm_recruiting_pipeline_lock_guard`
  on `crm_recruiting_pipeline_stages` refuses:
    - DELETE of any seeded stage (P0001).
    - UPDATE that changes `name`, `sort_order`, `is_terminal`,
      `is_active`, or `org_id` (P0001 each).
- `crm_seed_recruiting_pipeline_stages(p_org_id)` rebuilt as an
  idempotent INSERT … ON CONFLICT DO NOTHING so newly created orgs
  always land with exactly the canonical 7 rows. Migration also
  backfills any org currently below 7 rows.

What is NOT locked (intentional):

- Cosmetic columns: `color`, `display_name`, `icon`. Brand teams can
  retheme stage chips without touching the schema.
- Stage definitions and transition triggers themselves — spec defers
  these to a future round drafted in the same style as Section 1
  (consumer pipeline). Current Recruit Profile uses manual stage moves
  via the dropdown.

Negative-test verification (run inside the apply-migration session):
attempted rename of `inactive → evergreen` raised P0001, attempted
DELETE of `inactive` raised P0001, cosmetic re-write of `color` on
`prospect` succeeded.

### Independence from the consumer pipeline

The two pipelines do not share state or transitions, by construction:

- Separate tables: `crm_recruiting_pipeline_stages` vs
  `crm_pipeline_stages`; `crm_recruiting_records` vs `lead_submissions`.
- Separate cadence scope:
  `crm_follow_up_cadences.module_scope IN ('leads','recruiting')`,
  enforced by the `crm_enroll_lead_in_cadence` RPC and the
  Lead-Profile enrollment dropdown filter.
- Separate enrollment audit: `crm_lead_cadence_state` vs
  `crm_recruit_cadence_state`.
- Separate email-log attribution: `crm_email_log.recruit_id` is
  populated only on recruit-sourced sends.
- Separate Pin↔Unpin entity_type: `crm_focus_items.entity_type` accepts
  both `'lead'` and `'recruiting'` but they're distinct rows.

There is no code path that mutates lead state from a recruit action or
vice versa.

### Invoices — Deferred (Future Home: Members → Payment Profile)

| Item | Status | Notes |
|---|---|---|
| Invoices removed from top-level navigation | ✅ **Phase 1 / 7** | `/invoices` → `/members`; `/invoices/:id` → `/invoices/legacy/:id`; legacy admin views at `/invoices/legacy*`; print routes (`/invoices/:id/print`) untouched. |
| Future build: invoicing lives inside the Member profile as a Payment Profile subsection | 🟡 **Roadmap** | Tagged here + in `spec-alignment-audit.md` so it doesn't fall off. NOT in current scope. |
| Data migration | ✅ **Not required** | `invoices`, `crm_invoices`, `crm_invoice_line_items`, `crm_invoice_payments` all verified at 0 rows during the Section 9 orphaned-data audit. Tables remain in place to absorb the future Payment Profile build without another schema migration. |
| Print routes preserved | ✅ | `/invoices/:id/print` and `/quotes/:id/print` live above the protected `MainLayout` and continue to resolve so any external bookmarks / mailers keep working through the deferral. |

When the Members → Payment Profile build is scheduled, the existing
empty backing tables can be wired to a sub-tab on `/members/:id`
without re-creating the schema. The redirect rules in
`apps/crm/src/App.tsx` will at that point be relaxed to either:

1. drop the `/invoices/legacy*` redirects entirely (preferred), or
2. continue redirecting `/invoices*` to the Member-profile sub-tab so
   external links resolve to the new home.

### Verification

- `apply_migration` succeeded for
  `20260620460000_crm_p7_recruiting_pipeline_lock`.
- Negative tests (rename / delete) raise P0001 as expected; cosmetic
  updates pass.
- `pnpm --filter @mpbhealth/crm exec tsc --noEmit` — clean.
- All Round 5 Addendum docs (this file + `spec-alignment-audit.md`)
  cross-reference each other for the closeout.

## Round 6 — Daily Log accordion + Performance Lag (2026-05-13)

Round 6 closes the remaining Section 11 / Section 12 alignment work for
the Daily Log accordion (Phase 7). No sidebar entries change. All
delivery is server-side bucketing fixes + a small frontend default-state
change so the page exactly matches the spec.

### Bucket fixes (migration `20260620470000_crm_p7_dl_section11_alignment.sql`)

| Section | Activity types now routed here | Notes |
|---|---|---|
| Lead Communication | `call`, `email`, `sms`, `text`, `note` | Cancellation calls auto-flagged on `call_outcome='cancellation'`, `metadata.is_cancellation=true`, or lead-stage = `lost`. Header chip in `DailyLogV2.tsx` counts cancellation rows separately. |
| LinkedIn Activity | `linkedin_connection_sent`, `linkedin_connection_accepted`, `linkedin_message`, `linkedin_reply`, `linkedin_profile_view`, `linkedin_engagement`, `linkedin_short` | Spec: "connection requests sent, messages sent, replies, profile views, etc." `linkedin_post` deliberately moved to **Content Creation** (it's a draft, not engagement). |
| Pipeline | `stage_change`, `mark_lost`, `subsection_transfer`, `profile_edit`, `crm_lead_entered` | Strict-spec: stage advances + manual overrides + Mark Lost + subsection transfers only. Meetings / tasks / demos / proposals previously bucketed here have moved to **Activities**. |
| Deals Closed | `quote_sent`, `enrollment_won`, `deals_closed`, `won` | Won → Enrolled transitions for the day. |
| Activities | `meeting`, `task`, `demo`, `proposal_sent`, `presentation`, `live_chat`, `networking_event`, `community_outreach`, `referral_requested` | Catch-all bucket — anything not captured by the other six. Default fallback for unrecognised types also lands here so nothing is dropped silently. |
| Content Creation | `linkedin_post`, `template_created`, `master_template_created`, `signature_created`, `content`, `webinar`, `social` | New auto-emit triggers `trg_dl_emit_from_template_create` (on `crm_templates` + `crm_master_templates`) and `trg_dl_emit_from_signature_create` (on `crm_email_signatures`) emit Content Creation rows when a rep authors a template / signature. |
| Special Projects | source = `crm_special_projects` | Unchanged — manual time-capture entry on the accordion. |

The migration also reclassifies any pre-existing rows in
`crm_daily_log_events` so the accordion buckets line up immediately
after deploy.

### Pipeline event semantics (lead-profile-edit trigger)

`crm_dl_emit_from_lead_profile_edit` (rebuilt) now emits dedicated
events for the four pipeline-relevant cases:

- **`mark_lost`** — `pipeline_stage` transitions into `'lost'`. Carries
  `metadata.previous_stage`. Renders with a red "marked lost" chip in
  the accordion.
- **`stage_change`** — any other `pipeline_stage` transition. Carries
  `metadata.from / metadata.to`. Renders with a blue "stage advance"
  chip; the description reads `"<lead> stage: <from> → <to>"`.
- **`subsection_transfer`** — `workflow_subsection` change (Working ↔
  Nurture ↔ LinkedIn ↔ DNC). Carries `metadata.from / metadata.to`.
  Renders with a blue "transfer" chip.
- **`profile_edit`** — residual catch-all for non-pipeline diffs
  (first/last name, email, phone, DNC flag, owner, lead source, plan
  type). Still bucketed to Pipeline because the spec covers
  lead-profile audit there.

### Frontend (`apps/crm/src/pages/DailyLogV2.tsx`)

- All seven sections now start **collapsed** on every load. The
  per-rep persisted state in `crm_rep_daily_log_entries.section_open_state`
  hydrates after mount so a section reopened during the day stays
  open; the next day starts collapsed again because the row is keyed
  by `log_date`.
- Section descriptions rewritten verbatim from the spec so reps see
  exactly the bucket definitions.
- Row rendering adds badges for `mark_lost`, `stage_change`, and
  `subsection_transfer` so the Pipeline section visually distinguishes
  the four event semantics at a glance.

### Manual entry modal alignment (migration `20260620470001_crm_p7_manual_entry_subtype.sql` + `ManualEntryModal.tsx`)

- `crm_daily_log_add_manual` now reads `metadata.subtype` (preferred)
  or `metadata.is_cancellation = true` (shorthand) and stamps
  `crm_daily_log_events.activity_subtype` so manual cancellation
  calls render with the same red chip as auto-detected ones.
- Modal options rewritten to mirror the strict-spec section contents:
  - **Lead Communication**: Call (off-CRM), **Cancellation call**,
    Email, Text/SMS, Note.
  - **LinkedIn Activity**: Connection request sent, DM, **Reply
    received**, **Profile view**, Post engagement (post drafts moved
    out per spec).
  - **Pipeline**: Manual stage override, Mark as Lost (note only),
    Subsection transfer (note).
  - **Deals Closed**: Enrollment won (manual close), Quote sent
    off-CRM.
  - **Activities**: meetings / demos / presentations / proposals /
    networking / community outreach / referrals.
  - **Content Creation**: **LinkedIn post drafted/published**, Email
    or SMS template created, Content drafted, Webinar, Social post.
- Option keys now disambiguate values that share the same
  `activity_type` (e.g. plain Call vs Cancellation Call) by
  composing `value::subtype`.

### Performance Lag Alert sanity check (Section 12)

Spec calls for "alert when a rep falls 20% behind the team." The
existing `crm_scan_performance_lag(p_org_id)` already implements this
exactly (`v_threshold = 0.80` → 20% behind), with the additional
guards required by Section 12:

- 5 business-day window (Mon–Fri) via `crm_business_days_back`.
- New-hire exclusion (<5 distinct business days of non-special-projects
  activity).
- Special Projects rows excluded from `rep_count`, `team_avg`, and the
  top-performer counter.
- 7-day quiet period after a fired alert.
- Payload exposes `threshold_pct=80`, `window_business_days=5`,
  `quiet_days=7`, `baseline_kind='team_avg_excl_self'`,
  `metric='activity_count_excl_special_projects'`.

The page-level surface in `DailyLogV2.tsx` (`AlertTriangle` panel
keyed off `crm_performance_alert_log`) is unchanged from Phase 6 —
this round only re-validated the threshold and excluded categories
match Section 12 verbatim.

### Verification

- Migrations applied:
  `20260620470000_crm_p7_dl_section11_alignment` and
  `20260620470001_crm_p7_manual_entry_subtype`.
- Classifier matrix tested against all 28 canonical activity types —
  every type lands in the spec-correct section.
- Existing rows reclassified by the migration's `UPDATE` step.
- `pnpm --filter @mpbhealth/crm exec tsc --noEmit` — clean.
- `ReadLints` on `DailyLogV2.tsx` + `ManualEntryModal.tsx` — clean.

### Outstanding (next round)

- Notification fan-out for Performance Lag alerts (in-app + email)
  — DB layer already fires, the user-facing notification is a thin
  follow-up that reads `crm_performance_alert_log` and routes it
  through the existing notifications system.
- LinkedIn activity ingest worker — auto-emit of
  `linkedin_connection_sent` / `linkedin_message` / `linkedin_reply`
  / `linkedin_profile_view` from the LinkedIn integration. The
  classifier already buckets them; only the inbound write path is
  pending.

## Round 7 — Daily Log new entry types (2026-05-14)

Round 7 closes the spec block "Daily Log — New Entry Types" covering
Cancellation Calls and Special Projects. Builds on Round 6 — no new
sidebar entries, no schema rewrites.

### Cancellation Calls — distinct entry type with separate counting

| Spec bullet | Status | Notes |
|---|---|---|
| Distinct entry type inside Lead Communication | ✅ **Phase 6 + Round 6** | `crm_daily_log_events.activity_subtype = 'cancellation'` is the canonical flag. Lead Communication accordion row renders with the red "cancellation" chip + red status dot. |
| Auto-capture rule: route a logged call to Cancellation Calls when the linked record (Lead or Member) is moving to Lost, is a cancellation, or the rep tags the call as a cancellation | ✅ **Phase 6** | `crm_dl_emit_from_activity` trigger fires `activity_subtype = 'cancellation'` when **any** of these conditions hold: `crm_activities.call_outcome = 'cancellation'` (rep tags), `metadata.is_cancellation = true` (explicit flag from any client), or the linked `lead_submissions.pipeline_stage = 'lost'` at time of write (lead moving to Lost). Member-side coverage rides on the `metadata.is_cancellation` / explicit-tag path because `crm_contacts` has no Lost-equivalent stage today. |
| Manual cancellation entry path | ✅ **Round 6** | `ManualEntryModal` exposes a dedicated "Cancellation call" option under Lead Communication that stamps `metadata.subtype = 'cancellation'` + `metadata.is_cancellation = true`; the Round 6 `crm_daily_log_add_manual` RPC reads either field and writes the `activity_subtype` so manual cancellations render with the same chip. |
| Cancellation Calls count separately from regular Calls in **all** reports (Daily Log, Weekly, Monthly, Activity Analytics — Sec 2/3/4) | ✅ **Phase 7 — Round 7** | Migration `20260620480000_crm_p7_dl_round7_entry_types` ships `crm_v_call_breakdown` (per rep × per day × `regular_calls` / `cancellation_calls` / `total_calls`). Daily Log Admin View renders the breakdown via new `CallBreakdownPanel`. Main Reports page (`/reports`) renders a Regular / Cancellation / Total KPI block that follows the page's date range. Header chip on `DailyLogV2` continues to show the per-day count. |

### Special Projects — pick-list, time capture, rollup, breakdown

| Spec bullet | Status | Notes |
|---|---|---|
| Build Special Projects as its own top-level Daily Log section | ✅ **Phase 4 + Round 6** | Section ships in `DailyLogV2.tsx`; spec-correct order (LeadComm → LinkedIn → Pipeline → DealsClosed → Activities → ContentCreation → SpecialProjects). |
| Each entry requires: project name (free text or pick-list) | ✅ **Phase 7 — Round 7** | New `crm_special_project_types` table (org-scoped, RLS-locked: members read; admins insert/update/delete). `crm_special_projects.project_type_id` FK threads the picked id to the entry. The inline form on the Daily Log accordion shows a pick-list dropdown when types exist (with a "Custom — type name below" option) and disables free-text when a type is picked. Admin-only "Manage types" button in the Special Projects breakdown panel opens `ProjectTypesAdminModal` for CRUD on the pick-list. |
| Each entry requires: time spent (minutes or HH:MM) | ✅ **Phase 7 — Round 7** | The form's time input now accepts both `45` (minutes) and `1:30` (HH:MM) via the new `parseTimeToMinutes()` helper in `DailyLogV2.tsx`. Validation rejects negative numbers and out-of-range minutes (≥60) inside the HH:MM form. |
| Each entry requires: optional notes | ✅ **Phase 4** | Notes textarea unchanged. |
| Time spent feeds the time-tracking reports — per-rep totals and per-project rollups | ✅ **Phase 7 — Round 7** | `crm_v_special_project_rollup` view aggregates `time_minutes` per `(org, user, project_label, log_date)` and resolves the canonical pick-list name when present. `SpecialProjectsBreakdown` panel reads from the view and renders both rollups side by side: by-project (label, distinct reps, entries, total time) and by-rep (display name, total time). |
| Reports view: include a Special Projects breakdown (project name × rep × time spent over date range) | ✅ **Phase 7 — Round 7** | `SpecialProjectsBreakdown` panel renders inside the Daily Log Admin View (`?view=admin`) and shares the rep / date-range filters already on the page. Time totals format as `Xh Ym` for readability. |
| Special Projects entries are manual — no auto-capture path (rep logs them as they happen or at EOD) | ✅ **Phase 4** | `crm_classify_log_section` returns `'special_projects'` only when `source = 'crm_special_projects'`. There are no triggers writing into the Special Projects bucket from any other table, by design. Multi-mode (`?mode=multi`) end-of-day backfill flow shares the same form. |

### Schema additions

Migration `20260620480000_crm_p7_dl_round7_entry_types.sql`:

- **`crm_special_project_types`** (new) — id, org_id (FK
  organizations), name, description, is_active, sort_order,
  created_by, created_at, updated_at. Unique `(org_id, lower(name))`.
  RLS: members SELECT; admins INSERT / UPDATE / DELETE.
- **`crm_special_projects.project_type_id`** (new column) — nullable
  FK to `crm_special_project_types(id)`, ON DELETE SET NULL so
  retired pick-list rows don't blow away historical entries.
- **`crm_v_special_project_rollup`** (new view) — `org_id, user_id,
  project_label (coalesced), project_type_id, log_date, total_minutes,
  entry_count`. Inherits RLS via `crm_special_projects` (RLS pass-through).
- **`crm_v_call_breakdown`** (new view) — `org_id, user_id, log_date,
  regular_calls, cancellation_calls, total_calls`. Reads from
  `crm_daily_log_events` filtered to `activity_type = 'call'`.

### Frontend deliverables

- `apps/crm/src/pages/DailyLogV2.tsx`
  - Special Projects inline form: pick-list dropdown, disabled-when-typed
    free-text fallback, HH:MM-aware time input.
  - `parseTimeToMinutes(raw)` helper for both formats.
  - Admin view now renders `<CallBreakdownPanel />` and
    `<SpecialProjectsBreakdown />` above the existing
    rep/date/source filter row.
  - Special Projects manual entry hidden in admin view (admins use
    "Manage types" + breakdown view; logging stays a rep activity).
- `apps/crm/src/components/dailyLog/CallBreakdownPanel.tsx` (new) —
  Round 7 call rollup, regular vs cancellation, by-rep table with
  cancellation %.
- `apps/crm/src/components/dailyLog/SpecialProjectsBreakdown.tsx` (new)
  — by-project + by-rep dual rollup, "Manage types" admin entry.
- `apps/crm/src/components/dailyLog/ProjectTypesAdminModal.tsx` (new)
  — CRUD for pick-list (add, toggle active, delete). Delete keeps
  historical entries intact (FK is ON DELETE SET NULL, free-text name
  retained on each historical row).
- `apps/crm/src/pages/Reports.tsx` — Round 7 KPI block under the key
  metrics row showing Regular / Cancellation / Total call counts for
  the selected date range, fed by `crm_v_call_breakdown`.

### Verification

- Migration `20260620480000_crm_p7_dl_round7_entry_types` applied;
  `crm_special_project_types` (0 rows seeded), view counts confirmed.
- `pnpm --filter @mpbhealth/crm exec tsc --noEmit` — clean.
- `ReadLints` on every touched file — clean.
- Cancellation auto-capture verified in Round 6 already; classifier +
  trigger paths unchanged.

### Outstanding (next round)

- Member-side ("Lost equivalent" status) cancellation auto-capture —
  add a status / cancelled flag to `crm_contacts` so the trigger can
  detect Member cancellations identically to Lead cancellations
  without relying on rep tagging. Spec wording is "Lead **or Member**
  is moving to Lost"; today only Lead-linked + explicit-tag paths fire.
- Weekly + Monthly aggregate report skeletons — both views surface
  the data via `crm_v_call_breakdown` and
  `crm_v_special_project_rollup` already, but a dedicated rep-facing
  Weekly Report email template that fans these counts out is a
  future round.
- Per-project budgets / target hours — admins may want to cap or
  flag projects exceeding a time budget. Schema has room
  (`crm_special_project_types.description`); UI is pending.

## Round 8 — Performance Lag notifications + config (2026-05-14)

Round 8 closes the spec block "Reports — Performance Lag Alert" with
a per-org config table, automatic in-app + email fan-out on alert
fire, and a daily pg_cron schedule that hits the existing
`crm-scheduled-jobs` edge function. Builds on Round 6's threshold
calculation; no behaviour change for the existing baseline-vs-rep
math.

### Spec coverage

| Spec bullet | Status | Notes |
|---|---|---|
| Build a lag-detection alert: fire when a team member's performance falls 20% or more below the rest of the team | ✅ **Phase 6 + Round 8** | `crm_scan_performance_lag` already implemented the 20% threshold. Round 8 makes it configurable via `crm_performance_lag_config.threshold_pct` (default 20, range 5–90). The math is `rep_count < team_avg * (1 - threshold_pct/100)` so 20% maps to `team_avg * 0.80`. |
| Notify both the affected rep and the admin | ✅ **Phase 7 — Round 8** | `crm_dispatch_performance_lag_notification` writes a notifications row for `v_alert.user_id` (the affected rep) and one row per active `org_memberships.role IN ('admin','owner')` (excluding the rep themselves). Both audiences are independently toggleable via `notify_rep` and `notify_admins` (both default `true`). |
| Notification channels: in-app notification + email; both default-on | ✅ **Phase 7 — Round 8** | Channel array on each `notifications` row is built from `inapp_channel` + `email_channel` toggles. Both default `true`. The Notification Center UI reads `category='performance_lag'` rows from `notifications` (in-app surface). Email pickup goes through the existing transactional email pipeline keyed off the `email` channel value. |
| (configurable in Settings) | ✅ **Phase 7 — Round 8** | New "Performance Lag" tab in `Settings.tsx` rendering `PerformanceLagSettings` — exposes every field on `crm_performance_lag_config`. RLS forbids non-admin saves; the page also disables the inputs for non-admins. |
| Default trigger cadence: daily check against a rolling 7-day window | ✅ **Phase 7 — Round 8** | pg_cron job `crm-performance-lag-scan` runs daily at `30 13 * * *` UTC (~9:30 ET). `window_days` defaults to 7 (calendar days). `cadence` defaults to `'daily'` and exposes `'weekday'` / `'weekly'` for future per-org schedulers. |
| (configurable in Settings) | ✅ **Phase 7 — Round 8** | `window_days` (1–90), `quiet_period_days` (0–30), `min_business_days_in_system` (0–30, new-hire grace), `cadence` (daily / weekday / weekly), and `exclude_special_projects` (bool) are all editable from the Performance Lag tab. |

### Schema additions

Migration `20260620490000_crm_p7_performance_lag_round8.sql` (split
into four `apply_migration` calls for diff hygiene):

- **`crm_performance_lag_config`** (new) — single row per org keyed
  by `org_id`. Columns:
  - `is_enabled boolean` (default `true`)
  - `threshold_pct integer` (default 20, CHECK 5..90)
  - `window_days integer` (default 7, CHECK 1..90)
  - `cadence text` (default `'daily'`, CHECK in daily/weekday/weekly)
  - `notify_rep boolean` (default `true`)
  - `notify_admins boolean` (default `true`)
  - `email_channel boolean` (default `true`)
  - `inapp_channel boolean` (default `true`)
  - `quiet_period_days integer` (default 7, CHECK 0..30)
  - `min_business_days_in_system integer` (default 5, CHECK 0..30)
  - `exclude_special_projects boolean` (default `true`)
  - `created_at`, `updated_at`
  - RLS: members SELECT; admins ALL.
  - Touch trigger keeps `updated_at` honest.
  - Default rows seeded for every existing org; new-org trigger
    `trg_crm_performance_lag_config_seed_org` autoseeds going
    forward.
- **`crm_performance_alert_log.notification_dispatched_at`** (new
  column, nullable `timestamptz`) — gates the dispatcher so a
  re-run never re-notifies for the same alert. Indexed on
  `(org_id, notification_dispatched_at)`.
- **`crm_dispatch_performance_lag_notification(p_org_id, p_alert_id)`**
  (new function) — builds channel array, computes `% behind`,
  inserts notifications for rep + every active admin/owner per
  config, stamps `notification_dispatched_at`. Idempotent.
- **`crm_scan_performance_lag(p_org_id)`** (rebuilt) — now reads the
  config (auto-seeds if missing), exits early when `is_enabled =
  false`, uses calendar-day rolling window (`v_window_days`), keeps
  the new-hire / Special Projects exclusion logic, and calls the
  dispatcher inline on alert fire. Returns the same `TABLE()` shape
  as before.
- **pg_cron job `crm-performance-lag-scan`** — daily at `30 13 * * *`
  UTC. Posts `{ "job": "performance_lag_scan" }` to the existing
  `crm-scheduled-jobs` edge function. The function loops over
  every active org and calls `crm_scan_performance_lag(org_id)`,
  which fans out notifications.

### Frontend deliverables

- `apps/crm/src/components/settings/PerformanceLagSettings.tsx` (new)
  — full Settings page tab with three sections (Trigger / Audience /
  Channels). Inline guard rails when both audience or both channels
  are off. Disabled for non-admins.
- `apps/crm/src/pages/Settings.tsx` — `'performanceLag'` tab added
  to `SettingsTab`, tab list, and rendering branch.
- `apps/crm/src/components/NotificationCenter.tsx` — icon map +
  click handler now recognise `performance_lag` notifications and
  honor `action_url` for deep-linking to the Daily Log.
- `packages/crm-core/src/notifications/notificationCenterTypes.ts`
  — `NotificationType` union extended with `'performance_lag'`;
  `UnifiedNotification` adds optional `action_url`.
- `packages/crm-core/src/notifications/notificationCenterService.ts`
  — fourth source in `getNotifications()` pulls
  `notifications` rows where `category='performance_lag'` and
  `is_dismissed=false`; `getUnreadCount()` adds them to the badge;
  `markAsRead('perf-…')` and `markAllAsRead()` now persist back to
  `notifications.is_read`. Built and shipped through `tsup`.

### Verification

- All four migrations applied successfully.
- `crm_performance_lag_config` seeded for every existing org with
  spec defaults verified (`is_enabled=true, threshold_pct=20,
  window_days=7, cadence='daily', notify_rep=true, notify_admins=true,
  email_channel=true, inapp_channel=true, quiet_period_days=7`).
- `cron.job` lists `crm-performance-lag-scan` at `30 13 * * *`.
- `crm_scan_performance_lag` smoke test against an active org returns
  empty (no rep has hit the new-hire grace yet) — expected.
- `pnpm --filter @mpbhealth/crm-core build` clean.
- `pnpm --filter @mpbhealth/crm exec tsc --noEmit` clean.
- `ReadLints` on every touched file — clean.

### Outstanding (next round)

- Email delivery worker for `notifications.channels @> ARRAY['email']`
  — the in-app channel is fully wired. Email today depends on the
  generic transactional email pipeline picking up rows where
  `channels` includes `'email'`; verify the consumer is reading the
  right table and add a delivery log column if a separate dispatch
  table is preferred.
- Per-org cron schedule honoring `cadence` — today the cron is
  daily for everyone; a per-org orchestrator that gates on
  `cadence='weekday'` (skip Sat/Sun) and `cadence='weekly'`
  (Mondays only) is a small follow-up.
- Lag drill-down panel on the Daily Log Admin View linking back to
  the `notifications` row that fired.

---

## Round 9 closeout — Open-Questions decision log

**Source spec ("Items to Confirm Before Build"):**

> 1. Daily Log accordion: single-expand vs multi-expand? Default
>    assumption: multi-expand.
> 2. Cancellation Calls placement: confirmed under Lead Communication.
>    Re-confirm if "communication" meant a different parent.
> 3. Special Projects as own section vs nested under Lead Communication
>    or Activities — implementer assumption: own section. Re-confirm.
> 4. Performance metric definition (above).
> 5. Performance baseline (above) — average / median / top-performer.
> 6. Performance trigger window — 7-day rolling vs weekly snapshot vs
>    30-day rolling.

### Decisions shipped

| #   | Item                                | Default shipped                 | Configurable?                            | Where                                              |
| --- | ----------------------------------- | ------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| 1   | Daily Log accordion mode            | `multi`                         | Yes — `single` or `multi`                | `crm_daily_log_ui_config.accordion_mode`           |
| 1b  | Daily Log default-collapsed on load | `true`                          | Yes                                      | `crm_daily_log_ui_config.default_collapsed`        |
| 2   | Cancellation Calls placement        | Under Lead Communication        | No (matches spec)                        | `crm_classify_log_section` + `ManualEntryModal`    |
| 3   | Special Projects placement          | Top-level section               | No (matches spec)                        | `DailyLogV2.tsx` `SECTIONS` order                  |
| 4   | Performance metric kind             | `activity_count`                | Yes — `leads_worked`, `time_logged_minutes` | `crm_performance_lag_config.metric_kind`        |
| 5   | Performance baseline kind           | `team_avg_excl_self`            | Yes — `team_median_excl_self`, `top_performer_pct` | `crm_performance_lag_config.baseline_kind` |
| 5b  | Top-performer target %              | `80`                            | Yes — only used when baseline is top-performer | `crm_performance_lag_config.top_performer_pct_target` |
| 6   | Performance window kind             | `rolling`, `window_days = 7`    | Yes — `rolling` (any N days) or `snapshot_weekly` (previous Mon–Sun) | `crm_performance_lag_config.window_kind` |

### Schema changes

- **`crm_daily_log_ui_config`** (new table, org-scoped):
  - `org_id uuid PK → organizations(id)`
  - `accordion_mode text NOT NULL DEFAULT 'multi'` (CHECK in
    `'single','multi'`)
  - `default_collapsed boolean NOT NULL DEFAULT true`
  - `created_at`, `updated_at`
  - RLS: members SELECT; admins ALL.
  - Touch trigger updates `updated_at`.
  - Default rows seeded for every existing org; new-org trigger
    `trg_crm_daily_log_ui_config_seed_org` autoseeds going forward.
- **`crm_performance_lag_config`** (extended):
  - `metric_kind text NOT NULL DEFAULT 'activity_count'` (CHECK in
    `'activity_count','leads_worked','time_logged_minutes'`)
  - `baseline_kind text NOT NULL DEFAULT 'team_avg_excl_self'` (CHECK
    in `'team_avg_excl_self','team_median_excl_self','top_performer_pct'`)
  - `top_performer_pct_target integer NOT NULL DEFAULT 80` (CHECK
    5..100)
  - `window_kind text NOT NULL DEFAULT 'rolling'` (CHECK in
    `'rolling','snapshot_weekly'`)
- **`crm_perflag_metric_for_user(p_org_id, p_user_id, p_window_start,
  p_window_end, p_metric_kind, p_section_filter)`** (new function) —
  shared metric extractor; switches on `metric_kind`. Returns an
  integer score. `STABLE`, runs in `public, pg_temp`.
- **`crm_scan_performance_lag(p_org_id)`** (rebuilt) — now resolves
  the window from `window_kind`, calls the shared metric helper for
  the rep and every peer, computes peer mean / median / max in one
  CTE, picks the active baseline per `baseline_kind`, fires when
  `rep_count < baseline × (1 − threshold_pct/100)`. Alert payload now
  includes `baseline_kind`, `baseline_value`, `team_median`,
  `top_performer_pct_target`, `window_kind`, and the metric label so
  the Daily Log Admin lag drill-down can render the actual rule that
  fired.

### Frontend deliverables

- `apps/crm/src/components/settings/PerformanceLagSettings.tsx`
  - New "Metric & baseline" section with `metric_kind`,
    `baseline_kind`, and a conditional `top_performer_pct_target`
    field.
  - Trigger section gains a `window_kind` select; the existing
    `window_days` input is auto-disabled when the snapshot mode is
    chosen.
  - Banner copy now reflects the live metric / baseline / window
    description so admins see the actual rule rendered in plain
    English (e.g. "Fires when a rep's activity count is at least 20%
    below the team average over the rolling 7-day window").
- `apps/crm/src/components/settings/DailyLogUiSettings.tsx` (new) —
  per-org accordion mode + default-collapsed toggle. Disabled for
  non-admins. Default values match the implementer assumption.
- `apps/crm/src/pages/Settings.tsx` — adds `'dailyLogUi'` tab entry
  with `ListChecks` icon, type extension, and rendering branch.
- `apps/crm/src/pages/DailyLogV2.tsx` —
  - Reads `crm_daily_log_ui_config.accordion_mode` via React Query
    (60 s stale time).
  - `toggleSection` honors `single` mode by collapsing peer sections
    when one section opens. `multi` mode keeps the prior behaviour.
  - Updated comments document Round 9's open-question decisions.

### Verification

- All Round 9 migrations applied (3 split migrations: schema +
  helper fn + scan rebuild). `crm_perflag_metric_for_user`,
  `crm_daily_log_ui_config`, and the four new
  `crm_performance_lag_config` columns visible in the live schema.
- `crm_performance_lag_config` rows hold the expected new defaults
  (`metric_kind='activity_count'`, `baseline_kind='team_avg_excl_self'`,
  `top_performer_pct_target=80`, `window_kind='rolling'`) for every
  existing org — no behaviour change vs Round 8 unless an admin
  flips a knob.
- `crm_daily_log_ui_config` rows seeded for every existing org with
  `accordion_mode='multi'`, `default_collapsed=true`.
- `pnpm --filter @mpbhealth/crm exec tsc --noEmit` clean.
- `ReadLints` on every touched file — clean.

### Outstanding (next round)

- Apply weekday/weekly cadence gating in the per-org orchestrator
  so `cadence='weekday'` skips Sat/Sun and `cadence='weekly'`
  evaluates Mondays only — still daily-for-everyone today.
- Lag drill-down panel on the Daily Log Admin View now has the
  payload it needs (baseline kind, baseline value, metric kind);
  building the actual side panel is still pending.
- Email delivery worker for `notifications.channels @> ARRAY['email']`
  remains the same outstanding item carried from Round 8.

---

## Round 10 — Section 12 (Round 6 Addendum) closeout

**Source spec (verbatim, dated 2026-05-13):**

> 12. Round 6 Addendum — Open Questions Resolved — 2026-05-13
> Locks every open question from Section 11. These decisions supersede
> the placeholders in Section 11.
>
> Daily Log — Accordion Behavior
>   • Multi-Expand — rep can have any number of Daily Log sections open
>     simultaneously.
>   • Section open/closed state persists per user across sessions.
>
> Special Projects — Confirmed
>   • Own top-level Daily Log section — confirmed.
>   • Each entry requires: project name (free text), time spent, notes —
>     confirmed per Section 11.
>   • Time spent feeds per-rep and per-project rollups in Reports.
>
> Performance Lag Alert — Metric
>   • Performance metric is activity counts — total touches across all
>     auto- and manual-logged activity types: Calls, Texts, Emails,
>     Cancellation Calls, LinkedIn touches, Pipeline actions, Deals
>     Closed, Activities, Content Creation entries.
>   • Special Projects time does NOT count toward the activity score.
>   • Each activity = 1 count; no weighting between activity types.

### Spec lock matrix

| Spec lock                                  | Locked value                            | DB enforcement                                                   |
| ------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------- |
| Daily Log accordion mode                   | `multi`                                 | `crm_daily_log_ui_config.spec_locked = true` overrides `accordion_mode` in the React reader and forces `multi`. |
| Daily Log open/closed persistence          | per-user, per-day                       | `crm_rep_daily_log_entries.section_open_state` jsonb already in place since Round 6. |
| Special Projects placement                 | own top-level section                   | `DailyLogV2.SECTIONS` order; not flippable.                      |
| Special Projects entry — project name      | required                                | `crm_special_projects.project_name NOT NULL`.                    |
| Special Projects entry — time spent        | required, > 0 minutes                   | `crm_special_projects.time_minutes NOT NULL`; client validates > 0. |
| Special Projects entry — notes             | required (NEW lock)                     | `crm_special_projects.notes NOT NULL` + `length(btrim(notes)) >= 1` CHECK constraint. |
| Special Projects rollups in Reports        | per-rep AND per-project                 | `crm_v_special_project_rollup` view feeds new rollup tiles in Reports. |
| Performance Lag — metric                   | `activity_count`                        | `crm_performance_lag_config.spec_locked = true` overrides `metric_kind`. |
| Performance Lag — baseline                 | `team_avg_excl_self`                    | Same flag overrides `baseline_kind`.                             |
| Performance Lag — window                   | `rolling`                               | Same flag overrides `window_kind`.                               |
| Performance Lag — exclude Special Projects | `true`                                  | Same flag overrides `exclude_special_projects`.                  |

### Schema changes

- **`crm_performance_lag_config.spec_locked boolean NOT NULL DEFAULT
  true`** (new column). When `true`, the scan ignores the configurable
  knobs introduced in Round 9 and uses the Section 12 spec values.
- **`crm_daily_log_ui_config.spec_locked boolean NOT NULL DEFAULT
  true`** (new column). When `true`, the Daily Log accordion is forced
  to multi-expand and starts fully collapsed regardless of column
  values.
- **`crm_special_projects.notes`** — `NOT NULL DEFAULT ''` plus a new
  `crm_special_projects_notes_min_chk CHECK (length(btrim(notes)) >= 1)`
  constraint. Table was empty so no backfill was required.
- **`crm_scan_performance_lag(uuid)` rebuilt** — early in the function
  it consults `spec_locked`. When true, it sets `v_metric_kind`,
  `v_baseline_kind`, `v_window_kind`, and `v_exclude_special_projects`
  to the spec values regardless of what the columns hold. Alert
  payload now includes `spec_locked` and `exclude_special_projects`
  so the future drill-down can show "this alert ran under Section 12
  spec lock" alongside the actual rule that fired.

### Frontend deliverables

- `apps/crm/src/components/settings/PerformanceLagSettings.tsx` — new
  Section 12 banner at the top with a "Spec lock" checkbox. When the
  lock is on (default), the metric / baseline / window / exclude-
  Special-Projects controls render the locked spec values and are
  disabled. The English-language summary in the existing amber banner
  reflects the locked behaviour exactly. The save payload now
  includes `spec_locked`.
- `apps/crm/src/components/settings/DailyLogUiSettings.tsx` — same
  Section 12 banner pattern. When the lock is on, the accordion-mode
  select is forced to `multi` and disabled, and the
  start-fully-collapsed toggle is forced on and disabled. Save
  payload now includes `spec_locked`.
- `apps/crm/src/pages/DailyLogV2.tsx` —
  - `useQuery` for `crm_daily_log_ui_config` now also reads
    `spec_locked` and forces `accordionMode = 'multi'` when locked.
  - Special Projects `handleSaveProject` rejects empty notes with a
    friendly toast before the DB CHECK constraint can fire.
  - Form UI: notes textarea now `required`, label changed to
    "Notes (required) — what did you work on?", and a small caption
    explains all three fields are required per Section 12.
- `apps/crm/src/pages/Reports.tsx` —
  - Pulls `crm_v_special_project_rollup` and `profiles.full_name`
    when the date range or org changes.
  - Renders a new "Special Projects — time rollup" panel between
    the headline KPI grid and the call breakdown panel.
  - Shows three tiles: total time (right side), Per-rep table (left),
    Per-project table (right). Each row shows entries + total time
    formatted as `Hh Mm`.
  - New `formatMinutes()` helper renders 0–59 as `Nm` and everything
    else as `Hh Mm` so admins can read totals at a glance.

### Verification

- 2 new migrations applied cleanly (`20260620510000` schema +
  `20260620510001` scan rebuild). All existing
  `crm_performance_lag_config` and `crm_daily_log_ui_config` rows
  inherit `spec_locked = true` so production behaviour now exactly
  matches the Round 6 Addendum without admin action.
- `crm_special_projects.notes` flipped to `NOT NULL` with the length
  CHECK constraint; verified the table was empty before the flip so no
  backfill was required.
- `crm_scan_performance_lag` smoke test still returns expected output
  (no rep crosses the new-hire grace yet) and now records
  `spec_locked` in the payload.
- `pnpm --filter @mpbhealth/crm exec tsc --noEmit` clean.
- `ReadLints` clean on every touched file.

### Outstanding (next round)

- Lag drill-down side panel on the Admin Daily Log View — payload
  now also exposes `spec_locked`; UI still pending.
- Per-org cron orchestrator gating cadence (carry-over).
- Email delivery worker (carry-over).

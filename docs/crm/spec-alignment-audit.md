# CRM rebuild — Spec-alignment audit (Changes-to-the-CRM 2026-05-13)

This doc maps every section of the v2 spec to the actual implementation
in this monorepo, plus the gaps closed in Phase 6 (`crm_p6_doc_alignment`
migration set, 2026-05-13).

## Section 1 — 8-Stage Pipeline (Round 2 order)

| Stage | Slug | DB row | Routes-to subsection |
|---|---|---|---|
| 1 New | `new` | `crm_pipeline_stages` | `working` |
| 2 Quoted | `quoted` | same | `working` |
| 3 Working | `working` | same | `working` |
| 4 Engaged / Qualifying | `engaged` | same | `working` |
| 5 Application in Progress | `application_in_progress` | same | `working` |
| 6 Won — Enrolled | `won` (terminal) | same | `concierge_handoff` |
| 7 Nurture | `nurture` (terminal) | same | `nurture` |
| 8 Lost | `lost` (terminal) | same | `do_not_contact` |

Transitions:

- 1 → 2 — `crm-website-lead-intake` edge function (Email #1 delivery).
- 2 → 3 — `trg_crm_lead_quoted_to_working` AFTER INSERT trigger on
  `crm_activities`. Fires on the first rep-initiated touch (call /
  email / sms / note / meeting / task complete) once the round-robin
  step has assigned the lead. Inbound activities + engagement signals
  are explicitly skipped — those drive 3 → 4 instead.
- 3 → 4 — `crm_register_engagement_signal` RPC. **Phase 6**: removed the
  `last_touched_at` bump per Section 7 — engagement signals are inbound
  and do not bump rep-side Last Touched.
- 4 → 5 — rep-manual.
- 5 → 6 — `crm_apply_enrollment_won` RPC. **Phase 6**: a transition into
  `won` now writes a row into `crm_concierge_handoff_log` so Concierge
  has a queue to work from instead of a silent timestamp.
- 3 or 4 → 7 — `crm_age_to_nurture(p_org_id)` (new in Phase 6) + cron
  entry in `crm-scheduled-jobs` `{ "job": "age_to_nurture" }`.
- 3, 4 (or 2) → 8 — `crm_apply_lead_opt_out` + `crm_detect_opt_out`.

SLA clock starts at entry to **Quoted** — `crm_check_quoted_sla(org_id, hours)`
reads `quote_cadence_started_at` (matches Round 2 spec).

## Section 2 — Module Feature Requirements

### 2a Today

- `apps/crm/src/pages/Today.tsx` — sort by salesperson dropdown (with
  localStorage persistence), filter applies to lead lists + tasks +
  per-rep widgets, default = "All".
- Per-lead time tracker: `useProfileTimeTracker` hook auto-tracks
  profile-active time; manual entries via the workflow panel.
- Outlook + GoTo Connect + LinkedIn integration cards rendered in
  `IntegrationsHub` (stubs).

### 2b Leads Module

- Sorting: Owner, Last Touched (default), Status — `LeadsList.tsx`.
- Subsections: Working / Nurture / LinkedIn / Do Not Contact, plus the
  All button — visible button bar (Round 3 spec) with localStorage
  persistence.
- Stage→subsection routing: `crm_lead_workflow_subsection_sync` trigger
  reads `crm_pipeline_stages.routes_to_subsection` (data-driven).
- Bulk operations: `BulkActionsToolbar` — mass update, mass assign,
  mass email (CRM-direct via `send-crm-email-v2`), bulk Mark Lost.
- Dashboard layout: Owner | Name | Contact | Task | Last Touched | Date
  Created (matches the new column order spec).

### 2c Lead Profile

- 5-button action row: Note / Call / Email / Text / Task — replaces the
  prior Meeting button per Round 3.
- Quote History: `LeadMpWorkflowPanel` renders `crm_lead_quote_history`
  with multi-entry plan/structure/price/date.
- Time Tracking: `useProfileTimeTracker` + `crm_lead_time_entries`.
- Mark Lost: `crm_mark_lead_lost` RPC, Stage 8 + DNC routing.
- Pin/Unpin: toggle per Round 3.
- Email composer: `LeadProfileEmailTab` — in-profile, no jump-out.

### 2d Templates & Cadences

- Per-rep templates: existing `message_templates` table.
- Master Template Library: `crm_master_templates` (Round 3 Addendum) —
  admin-only, gated by `templates.master.manage`. Page:
  `MasterTemplates.tsx`.
- Multi-channel cadences: `crm_follow_up_cadences` extended with
  `halt_on_engagement`, `halt_on_optout`, `description`,
  `schema_version`. Builder UI: `Cadences.tsx`.
- Phone-call steps: cadence step kind `phone_script` creates a reminder
  task in the rep's Today view (cadence ticker pauses for rep
  acknowledgement).
- Native CRM email send: `send-crm-email-v2` edge function.
- SMS via GoTo Connect: webhook + outbound RPC ship as Phase 5
  follow-up.
- Quote Response cadence imported as 6-step master template + cadence
  scaffold (Round 7).

### 2e Reports & Tracking

- Daily Log v2: `apps/crm/src/pages/DailyLogV2.tsx` —
  `/sales-daily-logs`. Replaces the localStorage page.
- Activity Detail: built on `crm_daily_log_events`.
- Pipeline Reports (Phase 6 / Section 2e roundtrip):
  `apps/crm/src/pages/reports/PipelineReports.tsx` at
  `/reports/pipeline`. Surfaces:
  - Pipeline Movement view (`crm_v_pipeline_movement`)
  - Conversion by Source view (`crm_v_conversion_by_source`)
  - Application Drop-off view (`crm_v_application_dropoff`)
  - Stalled-in-Stage RPC (`crm_scan_stalled_in_stage`)
- Performance Lag Alert: `crm_scan_performance_lag` (Phase 6 fixes
  below) + cron entry `{ "job": "performance_lag_scan" }`.
- Excel retirement plan: `docs/crm/excel-retirement-checklist.md`.

### 2f Integrations

`IntegrationsHub` renders Outlook, GoTo Connect, LinkedIn cards backed by
`crm_integration_accounts`. OAuth + sync workers planned; see
`docs/crm/integrations-recruiting-plan.md` for the per-provider scope.

### 2g Opt-Out Keyword Detector

- `crm_detect_opt_out(body, org_id)` reads `crm_optout_keywords` (data-
  driven). All approved phrases seeded; "not interested" intentionally
  excluded.
- `crm_strip_reply_quoted_and_signature` strips quoted prior messages
  before scanning.
- `receive-crm-email` integrates the new detector.

## Section 5 — Round 2 Stage Order

| Round 2 bullet | Status | Implementation |
|---|---|---|
| Reorder stages to New → Quoted → Working → Engaged → App in Progress → Won → Nurture → Lost | ✅ | `crm_pipeline_stages` seeded + sort_order verified live |
| Auto-advance New → Quoted on quote generation / Email #1 delivery | ✅ | `crm-website-lead-intake` advances on Email #1 send |
| Auto-advance Quoted → Working on first rep-initiated touch | ✅ | `trg_crm_lead_quoted_to_working` AFTER INSERT trigger on `crm_activities` (Phase 6 follow-up) |
| Auto-advance Working → Engaged on engagement signal | ✅ | `crm_register_engagement_signal` RPC — covers both quoted and working starting stages |
| 24-hour SLA clock starts at entry into Quoted | ✅ | `crm_check_quoted_sla` reads `quote_cadence_started_at` |
| Day-30 Nurture rule applies to Working or Engaged with no engagement signal AND no opt-out signal | ✅ | `crm_age_to_nurture(p_org_id)` (Phase 6) — explicitly excludes Quoted |
| Lost-routing rule applies from Quoted, Working, or Engaged on opt-out signal | ✅ | `crm_apply_lead_opt_out` unconditionally sets `pipeline_stage = 'lost'` regardless of starting stage |
| Engaged → Application in Progress remains rep-manual | ✅ | No automation; rep flips stage in the profile |
| Application → Won automatic with manual fallback | ✅ | `crm_apply_enrollment_won` + manual stage select |

## Section 6 — Leads Module (Round 3)

All Round 3 items shipped. See Phase 2 in `section9-removals.md` for the
complete list.

## Section 7 — Round 3 Addendum (Last Touched + Master Template Library)

| Section 7 bullet | Status | Implementation |
|---|---|---|
| Last Touched updates only on rep-initiated activity | ✅ | `crm_lead_bump_last_touched` trigger filters out inbound + engagement signals; **Phase 6** removed the explicit `last_touched_at = now()` write from `crm_register_engagement_signal` |
| Inbound events (lead reply, calendar booking, link click) do not bump Last Touched, but are captured separately on the activity timeline | ✅ | Inbound rows still flow through `crm_activities`/`crm_email_log` and surface in `UnifiedTimeline`; the bump trigger short-circuits on `direction='inbound'`, `engagement_signal`, `reply_received`, `link_click`, `calendar_booking` |
| Build a master template library inside the Templates section | ✅ | `crm_master_templates` table + `MasterTemplates.tsx` page wired under `/templates/master` |
| Master library is admin-view-only — reps do not see it in their Templates view | ✅ | Sidebar entry gated by `templates.master.manage`; `MasterTemplates` page wrapped in `PermissionGate` with the same key |
| Admin can create, edit, archive, and version master templates (email, phone script, SMS) | ✅ | Channel CHECK constraint covers all three; `version` integer + `parent_template_id` enable in-place revisioning; archive/restore via `archived_at` toggle |
| Master library coexists with per-rep template libraries — per-rep libraries remain private | ✅ | `crm_templates` (per-rep) untouched; SELECT RLS on `message_templates` is unchanged from Phase 1 RLS repair |
| Master templates are the source of truth for admin-driven mass sends (mass email from Leads list and future company-wide campaigns) | ✅ | `BulkEmailModal` defaults the picker to Master templates and routes via `EmailService.sendFromMasterTemplate` (`packages/crm-core/src/email/emailService.ts`) — token-merges `#leadname`/`#firstname`/`#lastname`/`{{first_name}}`-style and stamps `master_template_id` on the outbound `crm_email_log` row |
| Per-template usage / "last used" metrics rolled up to the admin view | ✅ | **Phase 7** migration `20260620420000_crm_p7_master_template_send_attribution.sql` adds `crm_email_log.master_template_id`, `crm_master_templates.usage_count` + `last_used_at`, and `crm_master_template_bump_usage(uuid)` RPC. Both `send-crm-email` and `send-crm-email-v2` edge functions accept `master_template_id` and call the bump RPC after a successful Resend dispatch |
| Open question — should reps be able to "pull" a master template into their personal library as a starting point? | ✅ Resolved: **No** | Default assumption confirmed. Reps do not get a copy/import action; the Master Library is admin-edit-only via RLS, and rep-side cadence steps reference master templates by id (not by clone). If reps want a personal version of a master template they can compose a new per-rep template from scratch |

## Section 8 — Daily Log Auto-Population (Round 4)

| Round 4 bullet | Status | Implementation |
|---|---|---|
| GoTo Connect call → logged on call completion (duration captured) | ✅ | `crm_dl_emit_from_activity` on `crm_activities` insert with `activity_type='call'`; `call_duration_seconds` persisted to `metadata`. GoTo provider sync writes the activity row (Phase 5 webhook) |
| CRM-sent email → logged on send | ✅ | `crm_dl_emit_from_email_log` on outbound `crm_email_log` insert |
| GoTo Connect SMS → logged on send | ✅ | Same activity-trigger path; `activity_type='sms'`/`'text'` classified to `lead_communication` |
| Note → logged on save | ✅ | `crm_dl_emit_from_activity`, `activity_type='note'` |
| Task complete → logged on completion | ✅ **Phase 7** | `crm_dl_emit_from_task_complete` AFTER UPDATE on `lead_tasks` — fires when `status` transitions to `'completed'` or `completed_at` flips from null to set |
| Lead profile edit → logged on save | ✅ **Phase 7** | `crm_dl_emit_from_lead_profile_edit` AFTER UPDATE on `lead_submissions` — emits when an authenticated rep changes a business field; skips cascaded trigger writes via `pg_trigger_depth()` and skips system writes via `auth.uid() IS NULL` short-circuit |
| Outlook-synced meeting → logged on calendar event start | ✅ (framework) | Path runs through `crm_dl_emit_from_activity` with `activity_type='meeting'`. Outlook integration in Phase 5 writes the activity row on calendar webhook |
| LinkedIn touch → manual until LinkedIn integration is live | ✅ | Surface present in Daily Log; rep adds via the new "Log manual LinkedIn Activity" button. Auto-capture wires in once Phase 5 LinkedIn integration ships |
| Each auto-logged row feeds Activity Detail and rolls into Daily Log totals | ✅ | `trg_daily_log_rollup` on `crm_daily_log_events` keeps the per-day counters on `crm_rep_daily_log_entries` in sync (`calls_made`, `emails_sent`, `linkedin_touches`, `meetings_held`, plus the Section 11 sub-section counters) |
| "Leads worked" derived from distinct lead IDs touched that day | ✅ **Phase 7** | `crm_count_leads_worked(p_org_id, p_user_id, p_date)` RPC. Daily Log header tile reads it for the current rep / current day |
| Manual entry available for off-CRM activity (in-person meetings, personal-cell calls, networking events, any touch not captured by an integration) | ✅ **Phase 7** | `crm_daily_log_add_manual(p_org_id, p_section, p_activity_type, p_description, p_occurred_at, p_metadata)` RPC + `ManualEntryModal` reachable from the page header and from each non-special-projects section header |
| Manually-entered rows visually flagged (icon, color, "Manual" tag) | ✅ | Amber `manual` chip + dot accent. Auto rows show emerald `auto` chip with lock icon |
| Manual rows: editable by the rep who logged them | ✅ **Phase 7** | RLS: rep can `UPDATE` / `DELETE` only their own rows where `manual = true`. The Daily Log page shows a delete affordance on hover for own manual rows |
| Auto rows: read-only for reps; admin can correct/delete with audit trail | ✅ **Phase 7** | RLS denies UPDATE/DELETE on `manual = false` rows from `authenticated`. Admins use `crm_daily_log_admin_edit(event_id, patch jsonb, reason)` and `crm_daily_log_admin_delete(event_id, reason)`; both write a before/after image to `crm_daily_log_corrections` (admin-only SELECT) |
| Rep's Daily Log view: per-rep, per-day, auto-populated as activity occurs | ✅ | Default route. Realtime subscription on `crm_daily_log_events` filtered by `user_id` redraws on insert/update/delete |
| Today's row updates in real time (push or short-poll) | ✅ | Supabase Realtime channel; counts re-derive from fresh events automatically |
| Admin view: filter by rep, date range, and activity source (auto vs manual) | ✅ **Phase 7** | `?view=admin` query param (gated by `orgRole = 'admin' \| 'owner'`). Filter bar with rep dropdown (powered by `useOrgReps`), from/to date pickers, and source filter (`all` / `auto` / `manual`). Realtime subscription widens to org-wide events |

## Section 9 + Section 10 — Navigation & Recruiting

All Round 5 IA cleanup items shipped. Recruiting clone module
implemented with the locked 7-stage pipeline (`crm_recruiting_pipeline_stages`)
and `crm_recruiting_records`. End-of-Day absorbed into Sales Daily Logs
as `mode=multi` query param — Daily Log v2 page reads it and renders
the multi-entry banner. (Phase 6 update.)

**Phase 7 closeout** (2026-05-14) — orphaned-data audit + cutover
redirects. See `docs/crm/section9-removals.md` for the full audit.

| Section 9 bullet | Status | Where / how |
|---|---|---|
| Remove Quick Rate Leads | ✅ **Phase 7** | `/leads/quick-rate-estimate` redirects to `/leads`; legacy view at `/legacy`. Records continue to land on `lead_submissions`. No backing tables to migrate. |
| Remove Reactivation | ✅ **Phase 1 / 7** | `/reactivation` redirects to `/templates`; OE Reactivation lives as a master cadence. `crm_oe_reactivation_runs` is empty. |
| Remove Quotes | ✅ **Phase 7** | `/quotes` → `/today`; `/quotes/:id` → `/quotes/legacy/:id`. Lead Profile quote history (`crm_lead_quote_history`) is canonical. Backing tables empty. Print routes unchanged. |
| Remove Invoices | ✅ **Phase 7** | `/invoices` → `/members`; `/invoices/:id` → `/invoices/legacy/:id`. Deferred to a future Members → Payment Profile. Backing tables empty. Print routes unchanged. |
| Remove Social Media | ✅ **Phase 7** | `/social-media` → `/campaigns`; legacy at `/social-media/legacy`. `crm_social_posts` + `crm_social_platform_connections` empty. |
| Remove Ad Campaigns | ✅ **Phase 7** | `/social-media/ads` → `/campaigns`; legacy at `/social-media/legacy/ads`. |
| Remove Community Events | ✅ **Phase 1 / 7** | `/community-events` → `/today`; legacy at `/community-events/legacy`. Public form `/forms/community/:eventId` still feeds `lead_submissions`. |
| Remove Sales Activity | ✅ **Phase 7** | `/sales-activity` → `/sales-daily-logs`; legacy at `/sales-activity/legacy`. Activity surfaces in Daily Log v2 + Activity Detail. |
| Remove Studio | ✅ **Phase 7** | `/studio*` → `/settings`; legacy at `/studio/legacy*`. `crm_studio_modules` + `crm_studio_fields` empty. `/custom/:moduleApiName` dynamic routes still resolve. |
| Audit orphaned data per removed section | ✅ **Phase 7** | Every backing table for the removed sections is empty (0 rows): `crm_quotes`, `crm_quote_line_items`, `crm_quote_templates`, `crm_lead_quote_history`, `crm_invoices`, `crm_invoice_line_items`, `crm_invoice_payments`, `invoices`, `crm_social_posts`, `crm_social_platform_connections`, `crm_community_events`, `crm_oe_reactivation_runs`, `crm_studio_modules`, `crm_studio_fields`, `crm_campaigns`, `marketing_campaigns`. No data migration scripts required. |
| Rename Contacts → Members | ✅ **Phase 1 / 7** | Sidebar label, page header (`Contacts.tsx` `GradientHeader`), breadcrumb, "New Contact" CTA, and every cross-module deep link (`AccountDetail`, `DealDetail`, `CaseDetail`, `QuoteDetail`, `InvoiceDetail`) all use "Members" / `/members/...`. Command Palette, AI Command Bar, Global Search, AI Chat, and Notification Ticker emit `/members/...`. Page-help registry registers `/members` and `/contacts/legacy*`. |
| Consolidate Email (Inbox + Email + Signature) | ✅ **Phase 1** | Sidebar `Email` parent with sub-views: Inbox, Sent Emails, Schedules, Sequences, Deliverability, My Templates, Signatures. |
| Consolidate Calendar (move Meetings in) | ✅ **Phase 1** | Single sidebar `Calendar` entry; `/meetings` redirects to `/calendar`; legacy at `/meetings/legacy`. |

## Section 9 — New Section: Recruiting (Round 5 + Round 5 addendum)

Spec ("New Section — Recruiting" + "Clone From Leads Module"): a new
top-level Recruiting workspace dedicated to health insurance agents and
agencies, structurally a clone of Leads but with data, sends, and
cadences kept fully separate from consumer Members and Leads.

| Bullet | Status | Notes |
|---|---|---|
| Top-level Recruiting section | ✅ **Phase 5** | Sidebar entry under "Recruiting"; routes `/recruiting` (list) + `/recruiting/:id` (profile). Backed by `crm_recruiting_records` + `crm_recruiting_pipeline_stages`. |
| Recruiting data fully separate from consumer Members and Leads | ✅ **Phase 5 / 7** | Separate table; `crm_email_log.recruit_id` (Phase 7 migration `20260620450000`) attributes outbound sends to recruits without writing into the leads pipeline. Lead-Profile cadence enrollment (`crm_enroll_lead_in_cadence`) refuses recruiting-scoped cadences with a clear error so a misclick can never crosstalk. |
| Inherit subsection button bar (All / Working / Nurture / LinkedIn / Do Not Contact) | ✅ **Phase 5** | `RecruitingList.tsx` renders the same 5-tab subsection bar used in the Leads list; tab choice is persisted to local storage. |
| Inherit Lead Profile layout, top action row, Pin↔Unpin | ✅ **Phase 7 (Round 5)** | `RecruitingDetail.tsx` ships the five-button row (Note / Call / Email / Text / Task) plus a Pin↔Unpin toggle wired through `useFocusItems`. The `crm_focus_items.entity_type` check constraint was extended to accept `'recruiting'` (migration `20260620440000`). |
| Inherit in-profile email composer with template insert | ✅ **Phase 7 (Round 5)** | `RecruitingProfileEmailTab.tsx` lists Master Library + per-rep templates, prefills subject + body from the picked template (with `#firstname` / `{{first_name}}` token replacement), sends via `send-crm-email-v2` with `recruit_id`, and writes a `crm_activities` row so the Daily Log auto-capture trigger fires. The "Recent emails" panel reads from `crm_email_log` filtered by `recruit_id`. |
| Inherit bulk-assign and mass-email | ✅ **Phase 7 (Round 5)** | `BulkAssignRecruitsModal.tsx` mirrors the Leads `BulkAssignModal` and writes to `crm_recruiting_records.assigned_to`. `BulkEmailRecruitsModal.tsx` mirrors `BulkEmailModal` and loops calling `send-crm-email-v2` with `recruit_id`, batching 5 sends per second with progress UI. The `BulkActionsToolbar` is shared with the Leads list. |
| Inherit per-rep templates and master template library | ✅ **Phase 7 (Round 5)** | Same `templateService` and `crm_master_templates` (channel='email') as the Leads composer. Master sends bump `crm_master_template_bump_usage` so admin-side usage rankings include recruiting. |
| Inherit multi-channel cadence builder — recruiting-specific cadences live here | ✅ **Phase 7 (Round 5) — schema + UI** | `crm_follow_up_cadences.module_scope` (`'leads'` \| `'recruiting'`) added in migration `20260620440000`; `Cadences.tsx` exposes a Leads / Recruiting / All filter and two separate "New Cadence" buttons. `LeadMpWorkflowPanel` filters its enrollment dropdown to leads-scoped cadences only. `crm_recruit_cadence_state` table created empty + RLS-locked so the recruit-side scheduled-send worker can ship without another schema migration. |
| Inherit Daily Log auto-capture (Section 8) for every recruiting activity | ✅ **Phase 4 verified** | `crm_dl_emit_from_activity` emits regardless of `related_to_type` and stores the recruit id + type in metadata. Confirmed by inspection of the deployed function body. Calls, notes, emails, and template-driven sends from the Recruit Profile all land in `crm_daily_log_events` for the rep automatically. |
| Recruiting-specific stage list (Prospect → … → Inactive) | ✅ **Phase 5 + Section 10 Round 5 Addendum** | 7 canonical stages live in `crm_recruiting_pipeline_stages` (`prospect → contacted → interviewing → contracted → onboarding → active → inactive`). Locked by migration `20260620460000`: CHECK constraints on name / sort_order / terminality, BEFORE UPDATE OR DELETE trigger refuses rename / reorder / terminality flip / deactivation / cross-org move, and `crm_recruiting_records.pipeline_stage` carries a matching enum CHECK. Cosmetic columns (`color`, `display_name`, `icon`) remain editable for brand-team retheming. Stage definitions + transition triggers (Section 1-style) are deferred to a future round per spec; manual stage moves via the Recruit Profile dropdown remain available. |
| Recruiting-specific subsection list | ✅ **Phase 5** | Mirrors the Leads subsections; spec says final list is future round. |
| Recruiting-specific required fields (license #, NPN, appointed carriers, agency affiliation) | ✅ **Phase 5** | All present on `crm_recruiting_records`; Create modal collects them; Recruit Profile renders them. |
| Recruiting cadence content (does NOT reuse Quote-Response cadence) | 🟡 **Future round** | Schema is ready (`module_scope='recruiting'`), UI is ready (Recruiting filter on `/cadences`), but no recruiting cadences are seeded yet — admins draft them per spec ("Cadence content (agent-recruitment messaging) to be drafted separately"). |

### Section 10 — Round 5 Addendum (2026-05-12)

| Bullet | Status | Notes |
|---|---|---|
| Lock the Recruiting pipeline at 7 stages, in order | ✅ **Phase 7 — migration `20260620460000`** | CHECK constraints on `crm_recruiting_pipeline_stages.name` (enum of 7), `sort_order` (1..7), and `is_terminal` (forced to match `name IN ('active','inactive')`). BEFORE UPDATE OR DELETE trigger `crm_recruiting_pipeline_lock_guard` refuses any name / sort_order / is_terminal / is_active / org_id mutation and refuses any DELETE. `crm_recruiting_records.pipeline_stage` carries a matching CHECK so no recruit can be parked in a non-canonical stage. |
| Stage definitions and transition triggers (Section 1-style) | 🟡 **Future round** | Spec explicitly defers — current implementation supports manual stage moves only via the Recruit Profile dropdown. No automatic transitions on activity / engagement / SLA exist yet. |
| Recruiting pipeline independent of consumer 8-stage pipeline (no shared state or transitions) | ✅ **By construction** | Separate tables (`crm_recruiting_pipeline_stages` vs `crm_pipeline_stages`), separate cadence scope (`crm_follow_up_cadences.module_scope`), separate enrollment table (`crm_recruit_cadence_state`), separate email log attribution (`crm_email_log.recruit_id`). Lead-side enroll RPC refuses recruiting cadences; LeadMpWorkflowPanel filters its dropdown to leads-scoped only. No code path crosses pipelines. |
| Idempotent seed — every org keeps exactly 7 stages | ✅ **Phase 7** | `crm_seed_recruiting_pipeline_stages(p_org_id)` rewritten to `INSERT … ON CONFLICT DO NOTHING`. Migration also backfills any org currently below 7 rows so the lock guard never trips on a half-seeded org. |
| Invoices remain removed from top-level navigation | ✅ **Phase 1 / 7** | Sidebar entry retired in Section 9; primary `/invoices` redirects to `/members`; `/invoices/:id` redirects to `/invoices/legacy/:id`; legacy admin views preserved at `/invoices/legacy*` for audit; print routes (`/invoices/:id/print`) untouched. |
| Future build: invoicing lives inside the Member profile as a Payment Profile subsection (deferred) | 🟡 **Roadmap** | Tagged in `docs/crm/section9-removals.md` and this audit so it doesn't fall off the roadmap. **Not in current scope** per spec. |
| No data migration work required for invoices now | ✅ **Confirmed empty** | All four backing tables (`invoices`, `crm_invoices`, `crm_invoice_line_items`, `crm_invoice_payments`) verified at 0 rows during the Section 9 orphaned-data audit. Tables remain in place to absorb the future Payment Profile build without another schema migration. |

### Cross-Cutting Cleanup (Round 5)

| Bullet | Status | Notes |
|---|---|---|
| Sweep Sections 1–8 for references to removed / renamed / relocated sections | ✅ **Phase 7 (Round 5)** | This audit doc rewritten; `docs/crm/section9-removals.md` updated; `apps/crm/src/help/articles/*.ts` Page-help blocks for `quotesPageHelp`, `invoicesPageHelp`, `studioPageHelp`, `socialMediaPageHelp`, and `communityEventsPageHelp` re-titled to "(Legacy)" with explanatory descriptions; `contactsPageHelp` retitled "Members" with rename note; `accountsPageHelp` annotated; new "What's new — Section 9 navigation refresh" article added in `getting-started.ts` (id `gs-round5-rebrand`). |
| Update Section 3 / Section 4 to-do lists to reflect new IA | 🟡 **Spec-doc task** | Spec source-of-truth lives in the user-supplied `Changes to the CRM.docx`; per the user's own instruction the assistant does not edit the plan file itself. The implementation here is the actual IA — section9-removals.md + spec-alignment-audit.md are the canonical mapping the rep-facing material now points at. |
| Update rep-facing training material (Section 3 Team Training & Rollout) | ✅ **Phase 7 (Round 5)** | `apps/crm/src/help/articles/getting-started.ts` ships the `gs-round5-rebrand` article (tagged `release-notes`, `navigation`, `members`, `recruiting`, `cadences`, `studio`, `quotes`, `invoices`) so a rep searching "what's new" or hitting Help on any moved page sees the new IA cheat-sheet. New `apps/crm/src/help/articles/recruiting.ts` registers `recruitingPageHelp` for `/recruiting` + `/recruiting/:id` and adds two recruiting articles (`rec-overview`, `rec-bulk-actions`). |

## Section 11 + Section 12 — Daily Log accordion + Performance Lag (Round 6)

Sections present in Daily Log v2 (top-down, exact spec order): Lead
Communication → LinkedIn Activity → Pipeline → Deals Closed →
Activities → Content Creation → Special Projects.

| Spec bullet | Status | Notes |
|---|---|---|
| Accordion pattern, all sections collapsed by default | ✅ **Phase 7 — Round 6 alignment** | `DailyLogV2.tsx` initial `openSections` state is now `false` for every section. The post-mount hydrator reads `crm_rep_daily_log_entries.section_open_state` for the current `log_date` so a rep who reopens a section keeps it open through the day; the next day starts collapsed again because the row is keyed by date. |
| Click expands / collapses (toggle) | ✅ **Phase 4** | `toggleSection` is a pure boolean flip; persists via `crm_rep_daily_log_entries.section_open_state` on every toggle. |
| Section order top→bottom (LeadComm → LinkedIn → Pipeline → DealsClosed → Activities → ContentCreation → SpecialProjects) | ✅ **Phase 7 — Round 6 alignment** | `SECTIONS` array in `DailyLogV2.tsx` matches the spec exactly. Manual entry modal section dropdown follows the same order. |
| Auto-captured activity routes into the matching section automatically | ✅ **Phase 4 + Phase 7 — Round 6 alignment** | `crm_classify_log_section()` rewritten in migration `20260620470000` for strict-spec bucketing. All canonical activity types verified — see classifier matrix below. Existing rows reclassified in-migration. |
| Manual entries (Section 8) and auto entries appear together within a section; manual rows stay visibly flagged | ✅ **Phase 4** | Both row types render in the same `divide-y` list inside each section; manual rows show an amber `manual` chip, auto rows show an emerald `auto` lock chip. |
| Lead Communication content: Calls, Texts, Emails, Cancellation Calls | ✅ **Phase 6 + Phase 7 — Round 6 alignment** | Auto: `call`, `email`, `sms`, `text`, `note` route here; cancellation calls auto-detected on `call_outcome='cancellation'` or `metadata.is_cancellation=true` or lead-stage=`lost`. Manual: dropdown exposes a dedicated "Cancellation call" option that stamps `metadata.subtype='cancellation'` so the row renders with the red cancellation chip. |
| LinkedIn Activity content: connection requests sent, messages sent, replies, profile views (per Section 2 statuses) | ✅ **Phase 7 — Round 6 alignment** | Classifier accepts `linkedin_connection_sent`, `linkedin_connection_accepted`, `linkedin_message`, `linkedin_reply`, `linkedin_profile_view`, `linkedin_engagement`, `linkedin_short`. `linkedin_post` deliberately routed to **Content Creation** per spec (it's a creative draft, not engagement). Manual entry exposes Reply received + Profile view options. |
| Pipeline content: stage advances, manual stage overrides, "Mark as Lost," transfers between subsections | ✅ **Phase 7 — Round 6 alignment** | `crm_dl_emit_from_lead_profile_edit` extended in migration `20260620470000` to track `pipeline_stage` diffs: a transition into `'lost'` emits `activity_type='mark_lost'` (red "marked lost" chip in UI); other stage transitions emit `activity_type='stage_change'` carrying `metadata.from / metadata.to`; `workflow_subsection` diffs emit `activity_type='subsection_transfer'`; residual profile-only edits keep `activity_type='profile_edit'`. Meetings / tasks / demos / proposals previously bucketed as Pipeline now route to Activities per the strict-spec definition. |
| Deals Closed content: leads moved into Won — Enrolled for the day | ✅ **Phase 4** | Classifier routes `quote_sent`, `enrollment_won`, `deals_closed`, `won` here. `crm_apply_enrollment_won` is the canonical write path; the DL trigger fires automatically. |
| Activities content: rep actions not captured by other sections (catch-all) | ✅ **Phase 7 — Round 6 alignment** | Classifier routes `meeting`, `task`, `demo`, `proposal_sent`, `presentation`, `live_chat`, `networking_event`, `community_outreach`, `referral_requested` here. Default fallback for unrecognised activity_type is also `'activities'` so nothing is dropped silently. |
| Content Creation content: emails / templates created, LinkedIn posts | ✅ **Phase 7 — Round 6 alignment** | Classifier routes `linkedin_post`, `template_created`, `master_template_created`, `signature_created`, plus the legacy `content`, `webinar`, `social` types. New triggers `trg_dl_emit_from_template_create` (on `crm_templates` + `crm_master_templates`) and `trg_dl_emit_from_signature_create` (on `crm_email_signatures`) emit Content Creation rows automatically when a rep authors a template or signature. |
| Special Projects content: non-pipeline work with time capture | ✅ **Phase 4** | `crm_special_projects` table + `trg_daily_log_rollup` trigger emit `section='special_projects'` rows carrying `time_minutes`. Inline form on the Daily Log accordion is the rep-side write path. |

**Classifier verification matrix** (run after migration
`20260620470000`):

| activity_type | Section |
|---|---|
| `call`, `email`, `sms`, `text`, `note` | `lead_communication` |
| `linkedin_connection_sent`, `linkedin_message`, `linkedin_reply`, `linkedin_profile_view`, `linkedin_engagement`, `linkedin_short`, `linkedin_connection_accepted` | `linkedin_activity` |
| `stage_change`, `mark_lost`, `subsection_transfer`, `profile_edit`, `crm_lead_entered` | `pipeline` |
| `quote_sent`, `enrollment_won`, `deals_closed`, `won` | `deals_closed` |
| `meeting`, `task`, `demo`, `proposal_sent`, `presentation`, `live_chat`, `networking_event`, `community_outreach`, `referral_requested` | `activities` |
| `linkedin_post`, `template_created`, `master_template_created`, `signature_created`, `content`, `content_creation`, `webinar`, `social` | `content_creation` |
| any source = `crm_special_projects` | `special_projects` |

### Round 7 — New Entry Types (2026-05-14)

| Spec bullet | Status | Notes |
|---|---|---|
| Cancellation Calls — distinct entry type inside Lead Communication | ✅ **Phase 6** | `activity_subtype='cancellation'` flag on call rows, red chip in the accordion. |
| Cancellation Calls — auto-capture rule (Lead/Member moving to Lost, cancellation, rep tag) | ✅ **Phase 6 + Round 6** | `crm_dl_emit_from_activity` covers `call_outcome='cancellation'`, `metadata.is_cancellation=true`, and lead-stage `lost`. Manual path goes through Round 6's `crm_daily_log_add_manual` subtype passthrough. Member-side dedicated status detection deferred (no Lost-equivalent column on `crm_contacts` yet). |
| Cancellation Calls counted separately in **all** reports (Daily Log, Weekly, Monthly, Activity Analytics — Sec 2/3/4) | ✅ **Phase 7 — Round 7** | `crm_v_call_breakdown` view (regular vs cancellation per rep × day) plus the `CallBreakdownPanel` on Daily Log Admin View and a Regular / Cancellation / Total KPI on `/reports`. |
| Special Projects: top-level Daily Log section | ✅ **Phase 4** | Section 7 of the accordion. |
| Special Projects: project name (free text **or** pick-list) | ✅ **Phase 7 — Round 7** | `crm_special_project_types` table + `crm_special_projects.project_type_id` FK. Inline form picks from the list when types exist; admins curate via the contextual "Manage types" modal in the Special Projects breakdown panel. |
| Special Projects: time spent (minutes **or** HH:MM) | ✅ **Phase 7 — Round 7** | `parseTimeToMinutes()` accepts both `45` and `1:30`. Validates negative + out-of-range minutes. |
| Special Projects: optional notes | ✅ **Phase 4** | Unchanged. |
| Special Projects: time-tracking reports — per-rep totals + per-project rollups | ✅ **Phase 7 — Round 7** | `crm_v_special_project_rollup` view, dual-table panel (by-project + by-rep). |
| Special Projects: Reports view — Special Projects breakdown (project × rep × time over date range) | ✅ **Phase 7 — Round 7** | `SpecialProjectsBreakdown` admin component on Daily Log Admin View, fed by the rollup view, sharing the page's rep / date-range filters. |
| Special Projects: manual only — no auto-capture path | ✅ **Phase 4** | Classifier returns `'special_projects'` only when `source='crm_special_projects'`. No triggers write into the bucket from any other table. |

**Performance Lag Alert (Section 12 + Round 8)** —
`crm_scan_performance_lag(p_org_id)` reads
`crm_performance_lag_config` and auto-dispatches notifications via
`crm_dispatch_performance_lag_notification`:

- 20% threshold (`threshold_pct = 20` → multiplier `0.80`) — fires
  when a rep's count is below 80% of the team average (i.e. ≥20%
  behind). Configurable per org (5–90).
- Window: rolling **calendar** days, default 7. Configurable per org
  (1–90). Round 6's 5-business-day window is reachable by setting
  `window_days = 5`.
- Special Projects rows excluded from `rep_count`, `team_avg`,
  and the top performer when `exclude_special_projects = true`
  (default).
- New-hire exclusion: a rep with `< min_business_days_in_system`
  distinct days of non-special-projects activity is skipped (default 5).
- Quiet period: configurable (0–30 days, default 7) after a fired
  alert before re-evaluation.
- Cadence: pg_cron job `crm-performance-lag-scan` runs daily at
  `30 13 * * *` UTC. The `cadence` field on the config row is
  honoured by future per-org schedulers (`daily` / `weekday` /
  `weekly`).
- Notifications: dispatcher fans out a `notifications` row per
  spec — to the affected rep (when `notify_rep`) and to every
  active admin/owner (when `notify_admins`). Channel array built
  from `inapp_channel` + `email_channel`. Both default `true`.
- Notification surfacing: in-app via `NotificationCenter` (reads
  `notifications` filtered by `category='performance_lag'`; counts
  toward unread badge). Email via the existing transactional
  pipeline keyed on `channels @> ARRAY['email']`.
- Idempotency: `crm_performance_alert_log.notification_dispatched_at`
  prevents double-fan-out if the scan re-runs against the same
  alert.

Settings UI: `Settings → Performance Lag` tab
(`PerformanceLagSettings.tsx`) exposes every field on
`crm_performance_lag_config` with admin-only edit gating (RLS-backed).

## Section 13 + Section 14 — Cadence Import + Website Auto-Response

`supabase/functions/crm-website-lead-intake/index.ts`:

- `FROM_ADDRESS = 'sales@mympb.com'`
- `FROM_NAME    = 'MPB.Health Sales'` (Round 7 Addendum 2026-05-13 locked)
- `REPLY_TO     = 'sales@mympb.com'`
- The intake function now passes `from_email: FROM_ADDRESS` through to
  `send-crm-email-v2`, which honors per-send sender overrides (added
  Section 13 Round 7 final wiring, 2026-05-15). Without this, every
  outbound forced the global `CRM_FROM_EMAIL` env value — which would
  have either broken Email #1 (`crm@mpb.health`) or broken every
  rep-driven send if we changed the env var to `sales@mympb.com`.
- `#yoursignature` resolves to the shared MPB Sales signature
  (`'— MPB.Health Sales\\nsales@mympb.com\\nhttps://www.mympb.com'`),
  not a personal rep signature — round-robin assignment may have stamped
  an `assigned_to` synchronously inside the lead-insert trigger, but the
  spec is explicit that Email #1 uses the shared signature regardless.
- Email #1 send fires the New → Quoted transition.
- Cadence enrollment uses the seeded "Quote Response" cadence with
  `halt_on_engagement = true` + `halt_on_optout = true`.
- Lead is tagged `lead_source_attribution = 'website_auto_response'`
  for source attribution per Section 13.
- `apps/website/src/lib/leadSubmissionService.ts` now invokes the edge
  function instead of calling `submit_public_lead` directly. The legacy
  plan-comparison welcome email is reserved as a transitional fallback
  that only fires when the edge function reports
  `auto_response_pending=true` (i.e., the admin has not yet pasted Email
  #1 content from the OneDrive doc). Once the master template is filled
  in, the fallback never triggers and the customer sees exactly Email #1.

**Channel distinction (Section 13 bullet 7).** Only the website
Get-a-Quote form path traverses `crm-website-lead-intake`. Manual rep
entry (`leadService.create` from inside the CRM app), referral imports,
and LinkedIn imports never call this function and therefore never
auto-fire Email #1 — reps enroll those leads into the Quote Response
cadence manually from the lead detail page. The
`lead_source_attribution = 'website_auto_response'` tag is the
queryable separator for lead-source reporting; rep-enrolled cadence
sends are not tagged.

**Touch-point identity (Section 13 bullet 6).** TP#1–#5 are sent by
reps working the cadence task queue from the CRM UI. The composer pulls
the rep's display name and signature; `send-crm-email-v2` falls back to
the env-level `CRM_FROM_EMAIL` for the envelope-from. Reps may override
the per-touch send identity if they have manually claimed the lead
before TP#1 is due — this is the default behavior of the composer, no
extra code path required.

### Round 7 Adjustment — Cadence Import & Website Auto-Response (2026-05-13)

Spec note (verbatim source, 2026-05-13): *"Imports the Quote Response
cadence into the new Templates section as master templates and specifies
the website-lead auto-response: first touch sent from
`sales@mympb.com` using Email #1. Reinforces / supersedes earlier
language in Section 2 / 3 / 4 'Migrate the Quote-Response 5-touch
cadence.'"*

| Spec bullet (Round 7 note) | Status | Implementation pointer |
|---|---|---|
| Import source `Quote Response Email Cadence (Call to Action LinkedIn).docx` in OneDrive `MPowering Benefits/Sales/` | 🟡 **Pending admin paste** | `.docx` not in repo. Admin must paste each email into `crm_master_templates` via the Master Templates page. See "Pre-launch checklist" below. |
| Import all six emails: Email #1 (Day 0) + TP#1–#5 (Day 3 / 7 / 14 / 21 / 30) | ✅ **Cadence scaffold** | `20260620110000_crm_p3_cadence_v2_schema.sql` seeds the 6-step `Quote Response` cadence with the exact `day_offset` values `[0, 3, 7, 14, 21, 30]` and `halt_on_engagement: true` on every step. `template_id` on each step is `null` until the admin paste lands. |
| Import into Master Template Library (Section 7) — admin-view-only — under a "Quote Response" template group | ✅ **Library exists; group = tag** | `crm_master_templates` has a `tags text[]` column for loose grouping (no formal group column by design). Convention: every imported template is tagged `quote_response` (and a step-marker like `email_1` / `tp_1` … `tp_5`). The Master Templates UI filters on the tag chip. |
| Preserve subject lines and body content verbatim from the source doc | 🟡 **Pending paste** | No automated importer — admin pastes subject + body directly into the form. |
| Preserve merge tokens (`#lead name`, `#yoursignature`) and map them to the CRM's token system | ✅ **Already mapped** | `packages/crm-core/src/email/emailService.ts` regex map: `#lead\s*name` (note: matches the space in `#lead name` exactly), `#firstname`, `#lastname`, `#email`, `#phone`, `#yoursignature` (the last is resolved server-side by `send-crm-email-v2` from the sender's `email_signatures` row). No additional code needed; tokens render as-is on paste. |
| Wire the six imported templates as the Quote Response multi-channel cadence (per Section 2 cadence builder) | ✅ **Pre-wired by `step` index** | `crm-cadence-ticker` reads `crm_follow_up_cadences.steps[i].template_id`. Once admin pastes Email #1 and saves, the corresponding step's `template_id` is updated in-place via the Cadences UI (`Cadences.tsx`). |
| Cadence timing: Email #1 Day 0, TP#1 Day 3, TP#2 Day 7, TP#3 Day 14, TP#4 Day 21, TP#5 Day 30 (per Sales Plan 2026) | ✅ **Confirmed in seed** | See `day_offset` values in `20260620110000_crm_p3_cadence_v2_schema.sql` §2 — match the spec exactly. |
| Engagement-signal interrupt: reply OR calendar booking OR tracked-link click halts remaining sends and advances stage | ✅ **Phase 7 — Round 7** | All three producers wired against the existing `crm_register_engagement_signal(p_lead_id, p_signal_type)` RPC. (1) **Reply** — `receive-crm-email` → `p_signal_type='reply'`. (2) **Tracked-link click** — DB trigger `trg_crm_tracking_to_engagement` (migration `20260620510000`) on `crm_email_tracking` fires `p_signal_type='link_click'` for every CLICK row regardless of whether it came from the custom click rewriter (`send-crm-email-v2` → `email-tracking` edge function) or Resend's native click webhook (`resend-webhook`). Both paths converge in one trigger. (3) **Calendar booking** — new edge function `crm-calendar-booking-webhook` accepts Calendly `invitee.created` payloads, verifies the HMAC-SHA256 signature, resolves the lead by invitee email, fires `p_signal_type='calendar_booking'`, logs a `crm_activities` row (`activity_type='meeting'`), and persists the raw booking into `crm_calendar_booking_log` (dedupe key `(provider, external_uri)` — Calendly retries are idempotent). |
| Opt-out interrupt: unsubscribe / hard bounce / opt-out keyword routes the lead to Lost (Section 5) | ✅ | Three independent paths converge on `crm_apply_lead_opt_out` (sets `pipeline_stage='lost'` + DNC + halts cadence). Keyword: `crm_detect_opt_out` (data-driven via `crm_optout_keywords`) called from `receive-crm-email`. Hard bounce: `receive-crm-email` bounce-classification branch. Unsubscribe link: `send-crm-email-v2` injects a one-click List-Unsubscribe header that posts to the unsubscribe edge function which calls the same RPC. |
| Website-lead auto-response: first touch sent from `sales@mympb.com` using Email #1 | ✅ | `crm-website-lead-intake` uses the constants documented above. Reinforces / supersedes the earlier Section 2 / 3 / 4 "Migrate the Quote-Response 5-touch cadence" language. |
| Reinforces / supersedes earlier language in Section 2 / 3 / 4 "Migrate the Quote-Response 5-touch cadence" | ✅ **Documented** | The Round 7 note is now the canonical specification for this cadence. Earlier 5-touch language is superseded — the current cadence is **6 touches** (Email #1 + TP#1–#5 = 6 emails). |

### Pre-launch checklist before website auto-response goes live

1. Get admin access to the source `.docx` in OneDrive
   `MPowering Benefits/Sales/Quote Response Email Cadence (Call to Action LinkedIn).docx`.
2. In the CRM, open **Templates → Master Templates** (admin only, gated
   by `templates.master.manage`).
3. For each of the six emails, click "New master template", pick channel
   = `email`, paste the verbatim subject + body, and tag the row
   `quote_response` plus a step marker (`email_1`, `tp_1`, `tp_2`, `tp_3`,
   `tp_4`, `tp_5`). Keep the `#lead name` / `#yoursignature` tokens
   exactly as they appear in the source — the existing token mapper
   matches them character-for-character (regex `/#lead\s*name/gi` and
   `/#yoursignature/gi`).
4. Open **Cadences → Quote Response**, click each of the 6 steps, and
   bind the step's `template_id` to the matching master template row
   from step 3 (Day 0 → `email_1`, Day 3 → `tp_1`, …, Day 30 → `tp_5`).
5. Smoke-test: submit a Get-a-Quote form on a staging deploy with a
   throwaway address. Verify (a) Email #1 arrives within seconds, (b) the
   lead's `pipeline_stage` flips to `quoted`, (c) `crm_lead_cadence_state`
   shows `current_step=0`, `paused=false`, `next_action_at` ≈ now+3d.
6. Reply to that email from the throwaway address. Verify (a) the lead
   advances to `engaged`, (b) `crm_lead_cadence_state.paused=true` with
   `paused_reason='engagement_detected:reply'`, (c) no further TP emails
   send.

### Engagement-signal coverage (Phase 7 — Round 7, shipped 2026-05-15)

All three producers now feed `crm_register_engagement_signal`:

| Signal | Producer | Notes |
|---|---|---|
| `reply` | `supabase/functions/receive-crm-email/index.ts` | Inbound email parser. Strips quoted history + signature first; opt-out keyword detector runs before the engagement path. |
| `link_click` | DB trigger `trg_crm_tracking_to_engagement` on `public.crm_email_tracking` (migration `20260620510000`) | Fires once per click row regardless of source (custom rewriter or Resend native). Opens are deliberately excluded — too noisy (Microsoft Defender prefetch, image scanners). |
| `calendar_booking` | Three producers, one dedupe table | (1) **Calendly v2** webhook: `supabase/functions/crm-calendar-booking-webhook/index.ts` — HMAC-SHA256 signature verification + 5-minute replay window. (2) **Outlook calendar pull**: `supabase/functions/calendar-sync/index.ts` PULL phase fires the signal during the Microsoft Graph event sync once an attendee email resolves to a lead in the org. (3) **Google Calendar pull**: same hook on the Google PULL phase (free byproduct of the shared `tryFireBookingEngagementSignal` helper). All three converge on `crm_calendar_booking_log` with unique index on `(provider, external_uri)` so retries / re-syncs never double-fire. |

**Deployment checklist for the calendar-booking webhook**:

1. `supabase functions deploy crm-calendar-booking-webhook`
2. Generate / fetch a signing key in Calendly: Integrations → Webhook
   subscriptions → New subscription → URL
   `https://<project>.supabase.co/functions/v1/crm-calendar-booking-webhook`
   → events `invitee.created`, `invitee.canceled` → copy signing key.
3. `supabase secrets set CRM_CALENDLY_WEBHOOK_SIGNING_KEY=<key>`
4. Confirm with the Calendly "Send test event" button — function should
   log "Received invitee.created" and return `200 {received: true, action: ...}`.

**Outlook + Google calendar bookings** are picked up by the existing
`calendar-sync` edge function during its PULL phase (the rep's
`crm_calendar_integrations` row is the OAuth grant — no per-event
webhook required). The shared `tryFireBookingEngagementSignal()` helper
in `calendar-sync/index.ts` runs the same dedupe/match/fire pipeline
the Calendly webhook uses, just sourced from a Microsoft Graph or
Google Calendar event payload.

Inbound-booking heuristic for the sync path:

1. We have not seen `(provider, external_event_id)` before in
   `crm_calendar_booking_log`.
2. Event `start_time` is in the future (or within the last 4 hours —
   live meetings still count; backfills of old events do not).
3. At least one attendee email (lowercased) matches an active
   `lead_submissions.email` row in the rep's org. Preference goes to a
   matched lead currently in `quoted` or `working` (those are the
   stages the signal will actually advance).

When all three are true, fire `crm_register_engagement_signal(lead_id, 'calendar_booking')`,
upsert the booking into `crm_calendar_booking_log`, and continue the
sync. A signal failure is logged but never blocks the primary
`calendar_events` upsert — losing one booking-log row is strictly
better than losing the calendar sync.

False positive note: a rep who manually scheduled an Outlook meeting
with a lead will fire the signal on the first sync. The downstream
behaviour (pause cadence + advance Quoted/Working → Engaged) is the
correct response in that case anyway — the rep is now meeting with the
lead, so cadence sends should stop and the stage should reflect
engagement. This is treated as a feature, not a bug.

## Cron snapshot after Phase 6

| Job | Schedule | Source |
|---|---|---|
| Cadence ticker | every 5 min | Phase 3 — `crm-cadence-ticker` |
| OE reactivation enroll | hourly during enrollment season | Phase 3 — `crm-scheduled-jobs` `oe_reactivation_enroll` |
| Performance lag scan | weekday 09:30 local | Phase 4 — `crm-scheduled-jobs` `performance_lag_scan` |
| **Day-30 Nurture aging** | daily 02:00 local | Phase 6 — `crm-scheduled-jobs` `age_to_nurture` |

## Outstanding follow-ups (intentionally deferred)

- Notification fan-out for Performance Lag Alerts (in-app + email).
  The DB layer fires the alert and stores it; the user-facing
  notification is a thin Phase 7 wrapper that reads
  `crm_performance_alert_log` and sends via the existing
  notifications system.
- Outlook Calendar/Inbox sync workers, GoTo Connect dialer + webhook,
  LinkedIn manual-workflow polish — see
  `docs/crm/integrations-recruiting-plan.md`.
- Quote-Response cadence verbatim content paste — admin task before
  going live with the website auto-response. See Round 7 Adjustment
  block in Section 13 / 14 for the step-by-step paste-and-wire
  checklist. **Until the paste lands**, the website returns
  `auto_response_pending: true` and the legacy plan-comparison welcome
  email fires as a transitional fallback so leads are never met with
  silence; the fallback short-circuits the moment Email #1 is
  configured.
- ~~Engagement-signal callers for `link_click` and `calendar_booking`~~
  ✅ shipped Phase 7 / Round 7. Three calendar producers cover the
  spec: Calendly webhook (`crm-calendar-booking-webhook`), Outlook
  pull (in `calendar-sync`), Google pull (same helper). All converge
  on `crm_calendar_booking_log` and the shared engagement-signal RPC.
- Recruiting cadence enrollment runner — schema is ready
  (`crm_follow_up_cadences.module_scope='recruiting'` and the empty
  `crm_recruit_cadence_state` table), and the in-profile composer +
  bulk-email modals already attribute via `crm_email_log.recruit_id`.
  The actual scheduled-send worker (recruit equivalent of
  `crm-cadence-ticker`) is a future round once admins draft the
  recruiting cadence content per spec.
- Weekly / Monthly aggregate report skeletons (Section 2e) — pipeline
  data already lives in views; UI follow-up.
- Replace the legacy `/sales-daily-logs/legacy` route after one stable
  cycle of side-by-side counters with v2.

---

## Round 9 — Open-Questions decision matrix

The "Items to Confirm Before Build" block listed six PM-level
decisions the implementer made during Phases 11–12. This round
confirms the defaults shipped earlier and adds per-org configurability
so any of them can be flipped without code changes.

| Spec bullet                                              | Default shipped                                        | Configurable via                                           | Behaviour change vs prior rounds |
| -------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- | -------------------------------- |
| 1. Daily Log accordion: single vs multi-expand           | `multi` (matches assumption); fully-collapsed on load   | `crm_daily_log_ui_config.accordion_mode` (`single`/`multi`)| None when default; flips peer-collapse logic when `single` is chosen |
| 2. Cancellation Calls placement                          | Under Lead Communication (matches spec)                 | Not configurable (intentional)                             | None |
| 3. Special Projects placement                            | Top-level section (matches assumption)                  | Not configurable (intentional)                             | None |
| 4. Performance metric definition                         | `activity_count` excluding Special Projects             | `crm_performance_lag_config.metric_kind` with `leads_worked`, `time_logged_minutes` | None when default |
| 5. Performance baseline                                  | `team_avg_excl_self`                                    | `crm_performance_lag_config.baseline_kind` with `team_median_excl_self`, `top_performer_pct` | None when default |
| 6. Performance trigger window                            | Rolling 7-day                                           | `crm_performance_lag_config.window_kind` (`rolling`/`snapshot_weekly`) and existing `window_days` (e.g. 30) | None when default |

### Verification matrix — fire decision per metric × baseline × window

The scan now resolves the alert decision uniformly:

```
fire_alert :=
    (window_score(metric_kind, window_kind, window_days) <
     baseline(baseline_kind, top_performer_pct_target) × (1 − threshold_pct/100))
    AND (rep has min_business_days_in_system distinct days)
    AND (no active quiet_until window)
```

- `window_score` is computed by `crm_perflag_metric_for_user`. For
  `activity_count` it counts events; for `leads_worked` it counts
  distinct `metadata.lead_id` values; for `time_logged_minutes` it
  sums `crm_special_projects.time_minutes` plus call duration in
  minutes. `exclude_special_projects` continues to gate which sections
  feed the count for `activity_count` / `leads_worked`.
- `baseline` is computed per-rep across peers (`user_id <> rec.user_id`).
- `window_kind = 'snapshot_weekly'` resolves the previous full Monday-
  through-Sunday week; `'rolling'` resolves to `[today − window_days +
  1, today]`.
- The alert payload now records `metric_kind`, `baseline_kind`,
  `baseline_value`, `team_median`, `top_performer_pct_target`, and
  `window_kind` so the planned Daily Log Admin lag drill-down can
  render the exact rule in the row card.

### Settings UX

- New "Daily Log UI" tab → `accordion_mode`, `default_collapsed`.
- Existing "Performance Lag" tab gains a "Metric & baseline" section,
  a `window_kind` select, and a banner that re-renders the rule in
  English as admins twiddle knobs (e.g. "Fires when a rep's leads-
  worked count is at least 25% below the top performer × 80% over
  the previous Mon–Sun week").

### Outstanding

- Per-org cron orchestrator that gates daily/weekday/weekly cadences
  (carry-over from Round 8) — already in this section's outstanding
  list above; the Round 9 schema makes the `cadence` knob meaningful
  even before that worker exists.
- Lag drill-down side panel on the Admin Daily Log View — payload is
  ready, UI is not.
- Email delivery worker for `channels @> ARRAY['email']` — carry-over.

---

## Round 13 — Sales vs. Cancellations vs. Leads snapshot (2026-05-15)

Spec source: Round 13 Adjustments image (2026-05-15):

> Adds a single comparative report to the Reports module that surfaces
> Sales (deals closed), Cancellations, and Number of New Leads side by
> side for both the week and the month. Inputs are already captured by
> the system (Sections 2e, 5, 11) — this section wires them into one
> snapshot so admin sees net growth and top-of-funnel volume at a glance.

### Scope

| Spec bullet | Status | Implementation |
|---|---|---|
| Build a "Sales vs. Cancellations vs. Leads" snapshot inside Reports (Section 2e), distinct from the other reports. | ✅ | New page `apps/crm/src/pages/reports/SalesCancellationsLeadsSnapshot.tsx`; route `/reports/sales-cancellations-leads`; sidebar entry under Analytics → Reports. |
| Period selector exposes both Week and Month views — current-to-date side-by-side with the trailing window (7 / 30 days). | ✅ | Page `mode` toggle (`week` / `month`) drives two parallel queries (`current`, `trailing`) computed by `rangesFor(mode)`. The week current is ISO-Monday → now; the month current is `month-start → now`. Trailing windows are exclusive end-of-day so "today's" data still shows in both views. |
| Three primary metrics displayed side-by-side for the selected period — Sales, Cancellations, New Leads. Plus a Net column. | ✅ | Four `MetricTile` cards on top: New Leads, Sales, Cancellations, Net (Sales − Cancellations). Each card shows current value + trailing comparison + delta arrow. |

### Metric definitions & source inputs

| Spec bullet | Status | Implementation |
|---|---|---|
| Sales: count of leads transitioned into Won — Enrolled in the period (Section 5). | ✅ | Migration `20260620550000_crm_p7_round13_sales_cancellations_leads_snapshot.sql` → `crm_sales_cancellations_leads_snapshot` reads `lead_submissions.enrollment_approved_at BETWEEN p_period_start AND p_period_end`. Same timestamp `crm_apply_enrollment_won` writes; same source the Daily Log "Deals Closed" section consumes. |
| Cancellations: count of Cancellation Calls / cancellation events in the period (per Section 11 auto-capture). | ✅ | Reads `crm_daily_log_events WHERE section='lead_communication' AND activity_type='call' AND activity_subtype='cancellation' AND occurred_at BETWEEN range`. The classifier already separates cancellation calls from regular calls (Round 7). |
| Number of New Leads: count of leads created in the period — top-of-funnel across all sources. | ✅ | Reads `lead_submissions.created_at BETWEEN range`. Covers website auto-response, manual entry, LinkedIn import, referral, etc. — every capture path lands on `lead_submissions`. |
| All three inputs roll up automatically; if any returns zero by default, treat as a wiring failure. | ✅ | All three counts ride on existing capture paths; no manual entry surfaced on this report. The footer note tells admins to treat unexpected zeros as a source-pipeline issue and points them at the relevant table. |

### Display & cuts

| Spec bullet | Status | Implementation |
|---|---|---|
| Default view: all-team totals for the selected period. | ✅ | `repFilter = null` (= "All reps") on first render for Lead Managers; non-managers are clamped to themselves per the existing Reports RBAC. |
| Per-rep filter: Adam / Tupac / All (Section 21 roster, matches Section 5 salesperson filter). | ✅ | Standard `useOrgReps` dropdown wrapped in `useIsLeadManager`. Roster reflects the Round 12 Addendum sweep (Leo removed). |
| Per-source cut: segment New Leads + Sales by Section 13 lead source. | ✅ | Migration emits a row per non-zero `crm_lead_source_types.label` bucket; the page merges current + trailing into a single source breakdown table with paired columns. Cancellations are intentionally not segmented by source — they live on the Daily Log event row, not on a lead, so a per-call source attribution would be a fabricated number. The page footer documents this. |
| Net column: Sales − Cancellations for the period. | ✅ | The totals row in the RPC sets `net = sales − cancellations`; the Net `MetricTile` swaps its icon (`TrendingUp` / `TrendingDown`) and color depending on sign. |

### Files touched (Round 13)

- `supabase/migrations/20260620550000_crm_p7_round13_sales_cancellations_leads_snapshot.sql` — `crm_sales_cancellations_leads_snapshot(uuid, timestamptz, timestamptz, uuid)` RPC.
- `apps/crm/src/pages/reports/SalesCancellationsLeadsSnapshot.tsx` — new report page (period toggle, 4 metric tiles, source breakdown table, rep filter, footer source notes).
- `apps/crm/src/App.tsx` — lazy import + `/reports/sales-cancellations-leads` route under the Reports section.
- `apps/crm/src/layouts/MainLayout.tsx` — sidebar entry under Analytics → Reports children, between "Quote Results Returned" and "Daily activity log".
- `apps/crm/src/query/crmQueryKeys.ts` — `reportSalesCancellationsLeads` cache key.

### Outstanding / follow-ups

- XLSX export — the `ReportLayout` shell wraps every other 2026 report and surfaces `Export XLSX`. The new snapshot uses a leaner shell (no month/year picker — period is week/month-relative) so an export wrapper landed in the page itself. Adding the same `exportToXLSX` button is a small follow-up.
- Per-rep totals breakdown — the spec's per-rep filter switches the totals to that rep. A future iteration can render *all* reps as a stacked rows table for direct comparison without flipping the filter.
- Cancellations by source — the Section 11 cancellation-call capture writes the call against the rep + lead; once the lead row carries a corroborated source link from the touch (Round 12 corroboration view extension), we can attribute cancellations back to the lead's source bucket. Until then the spec only asks for source attribution on New Leads and Sales.

## Round 12 Addendum — Roster, Adam goal lock, pro-rated SP exemption (2026-05-14)

Spec source: Round 12 Addendum image (2026-05-14):

> Removes Leo from the sales roster, locks Adam's minimum / ideal targets,
> and converts the Special Projects exemption from binary to pro-rated so
> reps cannot hide behind project time.

### Sales Team Roster — Leo departed

| Spec bullet | Status | Implementation |
|---|---|---|
| Remove Leo from all CRM references; sweep Sections 5/6/17/20 + the rest of the doc. | ✅ | Code-side references swept: `apps/crm/src/components/BulkAssignModal.tsx` comment ("Adam / Leo / Tupac" → generic "select leads → choose owner"), `apps/crm/src/pages/Today.tsx` Section 5 comment, and the lookalike `Leo Test` mock lead in `apps/crm/src/components/pipeline/BatchStageChangeModal.tsx` (renamed to `Sample Prospect`). The active inside-sales roster is now `Adam (part-time)` + `Tupac (full-time)`. The CRM is org-driven via `auth.users` + `useOrgReps`, so there is no other hardcoded roster to sweep. |
| Reassign any leads, tasks, or open cadence enrollments owned by Leo before disabling his account. | 🟡 admin-operational | Not enforced in code — admin task in production. The Round 11 build-blocker note already documents the bulk-assign flow as the surface for this (`apps/crm/src/components/BulkAssignModal.tsx`). |
| Preserve Leo's historical Daily Log / Activity Detail entries for reporting continuity. | ✅ by construction | The Round 12 changes never delete `crm_daily_log_events` or `crm_activities` rows; disabling the user account leaves the rows intact and indexed by `user_id`. |

### Daily Conversation Goal — Adam (locked) + Tupac

| Spec bullet | Status | Implementation |
|---|---|---|
| Adam (PT): minimum 10/day, ideal 13/day. Header chip shows toward IDEAL ("8 / 13 today"). End-of-day alert threshold = MINIMUM (10). Hitting 10–12 fires no alert but is visible in goal progress. | ✅ | Migration `20260620540000_crm_p7_round12_addendum_goals_proration.sql` extends `crm_user_conversation_goal_overrides` with `minimum_target`, `ideal_target`, `work_day_hours`. `crm_count_conversations` v2 returns `effective_minimum / effective_ideal` plus `is_below_minimum / is_at_minimum / is_at_ideal` flags. The Daily Log header chip shows `count / effective_ideal` and switches color: emerald ≥ ideal, blue ≥ minimum < ideal, amber < minimum, slate when exempt. A min/ideal split renders inline (`min N`) when they differ. |
| Tupac (FT): 25/day. Treat as both minimum and ideal — single threshold (alert fires if < 25). Schema-level support for a future split. | ✅ | Org config `full_time_minimum_target` + `full_time_ideal_target` both default to 25, so a single threshold "just works." Future per-user override can break them apart without another migration. |
| End-of-day alert when below MINIMUM. | ✅ | Inline amber banner on `DailyLogV2`'s rep view appears after 14:00 local when `is_below_minimum=true`. Wording explicitly distinguishes minimum from ideal and notes pro-ration when it applied. The scheduled email/notification fan-out is a future cron worker (the inline banner is the immediate UX). |

### Special Projects — pro-rated exemption (replaces Section 20 binary)

| Spec bullet | Status | Implementation |
|---|---|---|
| REPLACE the binary "any SP entry suppresses the alert" rule with a pro-rated reduction. | ✅ | `crm_conversation_goal_config.prorate_special_projects_hours boolean DEFAULT true`. The legacy `exempt_special_projects_days` knob remains callable for orgs that opt back, but the spec default is pro-rate-on. Round 12's binary exemption code path is now the fallback branch. |
| Each rep has a standard work-day length (Tupac = 8h, Adam = 4h — confirm with admin). | ✅ | Schema: org defaults `full_time_work_day_hours = 8.0`, `part_time_default_work_day_hours = 4.0`; per-user override `work_day_hours` for sub-day rep schedules. |
| Effective goal = base goal × (work_day_hours – SP hours today) ÷ work_day_hours. Apply to both minimum and ideal. | ✅ | RPC body computes `v_factor = max(0, work_hours − sp_hours) / work_hours`, then `v_eff_min = floor(v_base_min × v_factor)` and same for ideal. Floor (not round) so a rep can't accidentally have an effective goal one above their base when the math rounds up. The header chip surfaces `pro-rated` and the tooltip shows the formula breakdown. |

### Files touched (Round 12 Addendum)

- `supabase/migrations/20260620540000_crm_p7_round12_addendum_goals_proration.sql` — schema extensions + new `crm_count_conversations` v2.
- `apps/crm/src/pages/DailyLogV2.tsx` — header chip rewritten for min/ideal + pro-ration; new end-of-day alert banner when `is_below_minimum=true` after 14:00.
- `apps/crm/src/components/BulkAssignModal.tsx`, `apps/crm/src/pages/Today.tsx`, `apps/crm/src/components/pipeline/BatchStageChangeModal.tsx` — Leo-roster sweep.

### Outstanding / follow-ups

- Settings → Daily Log UI: surface the new min/ideal/work-day knobs so admins can edit Adam's targets without dropping into SQL.
- Cron worker that fires the actual end-of-day alert (email + in-app notification) at the rep's local 17:00 when `is_below_minimum=true`. The DB has the data; the worker just needs to iterate `crm_count_conversations` for each active rep at the trigger time and write a `notifications` row.
- Confirm Adam's actual shift length with admin (defaulted to 4h per spec; easy override via `crm_user_conversation_goal_overrides.work_day_hours`).

## Round 12 — Daily Log backend, prospect tracking, conversation goals (2026-05-14)

Spec source: Round 12 Adjustments image (2026-05-14):

> Reinforces prospect-name capture and anti-fabrication controls from
> Section 15, adds a searchable concierge-style backend for the Daily
> Log, and introduces per-rep daily conversation goals (25/day full-time,
> scaled for part-time, exempt on Special Projects days).

### Daily Log — backend & searchability

| Spec bullet | Status | Implementation |
|---|---|---|
| Daily Log backend mirrors the concierge log's structure: every entry is a discrete row with timestamp, rep, section (Section 11), activity type, linked record (Lead / Member / Recruiting / Company), notes, source (auto / manual). | ✅ | `crm_daily_log_events` was already row-per-action (Phase 4 / Section 8). Round 12 migration `20260620530000_crm_p7_round12_daily_log_search.sql` adds `prospect_name`, `company_name`, `linked_record_type`, `linked_record_id` columns + backfills them from `metadata.lead_id` / `recruit_id` / `contact_id` / `account_id`. Auto-rows continue to mirror metadata into the new columns via the existing `crm_dl_emit_*` triggers (read-time hydration). |
| Same backing data model as concierge → reporting + audit tooling reuses existing patterns. | ✅ | `crm_v_special_project_rollup`, `crm_v_call_breakdown`, and the new `crm_v_daily_log_corroboration` view all read straight off `crm_daily_log_events` so the reporting pipeline is shared. |
| Full-text search across Daily Log entries (prospect, company, notes, activity type, rep). | ✅ | `crm_daily_log_events.search_tsv` is a `GENERATED ALWAYS … STORED` `tsvector` with weighted terms (A: prospect/company, B: activity type, C: description). GIN index `idx_daily_log_events_search_tsv` powers the lookup. The new `crm_daily_log_search` RPC accepts a free-text `p_q` (`websearch_to_tsquery('english', …)`) plus structured filters and is what the admin Daily Log page calls. The rep dropdown is the Section 4 reps list (`useOrgReps`). |
| Filters: date range, rep, section, activity type, source (auto / manual), linked record. | ✅ | `crm_daily_log_search` accepts `p_from`, `p_to`, `p_user_id`, `p_section`, `p_activity_type`, `p_source`, `p_linked_record_type`, `p_linked_record_id`. The Daily Log Admin View bar in `apps/crm/src/pages/DailyLogV2.tsx` exposes Search / Rep / From / To / Section / Source. Linked-record filter is wired via the RPC and is reachable from the Lead Profile (deep-link follow-up). |
| Admin can pull "every entry mentioning [name / company]" in one query. | ✅ | Admin Daily Log View → search for the name/company; the page calls `crm_daily_log_search` with `p_q` set so reporting + ad-hoc audit share one path. |

### Daily Log — Prospect Name Capture (reinforces Section 15)

| Spec bullet | Status | Implementation |
|---|---|---|
| Every Daily Log entry captures the Person / Company spoken with — REINFORCES Section 15 Round 8. | ✅ | `prospect_name` + `company_name` + `linked_record_type/id` columns on `crm_daily_log_events`. Manual conversation rows must populate the typeahead-resolved record (`crm_daily_log_add_manual_v2` RAISES on missing prospect for conversation activity types). Auto-captured rows hydrate from the linked record via existing triggers + the migration's backfill. |
| Field is typeahead against CRM records — NOT free text — REINFORCES anti-fabrication. | ✅ | New `apps/crm/src/components/dailyLog/ProspectTypeaheadField.tsx` queries `lead_submissions` + `crm_contacts` + `crm_recruiting_records` + `crm_accounts` in parallel (limit 5 each). Manual Entry modal's "Person / Company spoken with" field is bound to this picker; there is no free-text fallback. The "no matches" hint tells reps to add the prospect under Leads first instead of typing a fabricated name. |
| Implementer note: do not re-build; verify Section 15 spec is being followed. | ✅ | The migration is purely additive (no Section 15 schema changed); the typeahead component is new but reuses the existing CRM-record tables. No re-build of Section 15 logic. |

### Anti-Fabrication — Reinforcement

| Spec bullet | Status | Implementation |
|---|---|---|
| Cross-check manual entries against auto-captured activity (Section 8 / 15): if a rep claims a conversation with X but no GoTo call, SMS, email, or meeting touches X that day, flag the row for admin review. | ✅ | `crm_v_daily_log_corroboration` view returns `effective_corroborated boolean` for every row. False = admin-visible amber chip ("uncorroborated") on the Daily Log Admin View row, plus a banner counting how many in the current filter set are flagged. |
| Pattern detection: if a rep repeatedly logs un-corroborated conversations, raise a persistent flag on the rep record (admin-visible only). | ✅ | `crm_rep_anti_fabrication_flags` table (admin-only RLS). `crm_scan_anti_fabrication_flags(p_org_id, p_window_days, p_threshold)` RPC rolls the corroboration view over a 30-day window (default ≥5 uncorroborated rows triggers a persistent flag). Future round will wire the cron job + Today-page admin tile that surfaces active flags. |
| Cross-check window expands when GoTo Connect integration is live (Section 19) — call answer-status will become a reliable corroborating signal for "spoke to." | ✅ planned | The view already counts `crm_daily_log_events` of type `call`, so as soon as the GoTo Connect webhook starts emitting auto-`call` rows with `metadata.outcome='answered'`, those rows become corroborating signals automatically (the activity-type set in the view is `call/email/sms/text/meeting`). When the webhook lands we'll tighten the corroboration to `answered`-only by extending the predicate. Tracked under Round 11 "Integrations build-blocker." |

### Conversation goals (Round 12 — new)

| Spec bullet | Status | Implementation |
|---|---|---|
| 25/day full-time, scaled for part-time, exempt on Special Projects days. | ✅ | `crm_conversation_goal_config` (org defaults: 25 FT / 10 PT default / SP-day exempt). `crm_user_conversation_goal_overrides` (per-user override; `daily_target=0` marks a rep entirely exempt). `crm_count_conversations(org, user, date)` returns `{conversation_count, target, is_special_projects_day, is_exempt}`. The Daily Log "Today" header surfaces the goal as a chip — slate when exempt, emerald when met, amber when behind. SP-day exemption auto-fires when at least one Special Projects entry exists for the day. |
| Counted activity types (which rows count as a "conversation"). | ✅ | Default set is `lead_communication.{call,email,sms,text}` + `activities.{meeting,demo,presentation}`. Configurable per-org via `counted_sections` + `counted_activity_types` arrays (admins can flip these in Settings → Daily Log later; the schema supports it now). `spec_locked = true` on every existing org so the defaults match the spec out of the box. |

### Files touched (Round 12)

- `supabase/migrations/20260620530000_crm_p7_round12_daily_log_search.sql` — backend additions + migration backfill.
- `apps/crm/src/components/dailyLog/ProspectTypeaheadField.tsx` — new typeahead bound to leads / members / recruits / accounts.
- `apps/crm/src/components/dailyLog/ManualEntryModal.tsx` — wires the typeahead, requires it for conversation rows, calls `crm_daily_log_add_manual_v2`.
- `apps/crm/src/pages/DailyLogV2.tsx` — Daily Log Admin View gets a search box + section filter + corroboration banner + per-row "uncorroborated" chip + per-row prospect/company line. Rep "Today" view gets the conversation-goal chip.

### Outstanding / follow-ups

- Wire `crm_scan_anti_fabrication_flags` into the existing `crm-scheduled-jobs` runner (suggested: weekday 06:00 local). Not blocking — admin can call the RPC manually today.
- Tighten the corroboration predicate to `metadata.outcome='answered'` once the GoTo Connect webhook lands so missed-call auto rows don't accidentally satisfy the check (carry-over from Round 11 integrations build-blocker).
- Surface active anti-fabrication flags on the Today admin tile + Rep profile (Today widget redesign — separate ticket).

## Round 11 — Integrations build-blocker + IA cleanup (2026-05-15)

### 🚨 Build-Blocking Priority — GoTo Connect + Outlook integrations

> **FLAG**: Connect the CRM to GoTo Connect AND Outlook as a top-priority,
> build-blocking item. Section 19 button behavior (Call, Text, Email) does
> not function end-to-end without these integrations live. Sequence both
> integrations BEFORE any further Lead Profile work that depends on
> call / text / email actions.

| Integration | Scope (per Section 2 Integrations) | Owner / next step |
|---|---|---|
| **GoTo Connect** | Click-to-dial, call logging, **call duration capture**, SMS send/receive, voicemail capture | Implementer + admin must confirm dev-environment credentials and API access **before sprint start**. Today's Section 19 behavior uses a deep-link best-effort to the desktop client (`apps/crm/src/lib/clickToCall.ts`) + auto-log via `crm_activities`; full webhook capture lands when the OAuth + sync worker is provisioned. |
| **Outlook** | Calendar two-way sync (Section 13 / Round 7 already wires the inbound `calendar-sync` PULL phase for engagement signals), email send / receive logging into lead activity | Implementer + admin must confirm dev-environment credentials and API access **before sprint start**. Outbound Outlook send is the current gap; inbound is wired through `receive-crm-email` + `crm_email_log`. |

This block is the canonical reference for the CRM rebuild's
"integrations gate." Until both producers are live, any new Lead-Profile
feature that depends on call / text / email completion telemetry should
ship with a deep-link fallback (already done for Section 19 buttons in
Round 10) and a comment pointing back at this section.

### Section 19 — Lead Profile Action Buttons Execute + Auto-Log (Round 10)

Shipped 2026-05-15:

- `apps/crm/src/lib/clickToCall.ts` — `initiateGotoConnectCall` invokes
  the GoTo Connect URL scheme (with `tel:` fallback), then opens
  `LogCallModal` so the rep confirms outcome. Both write a
  `crm_activities` row, which fires `crm_dl_emit_from_activity` (Section
  8 / Section 11 → Lead Communication).
- `apps/crm/src/components/leads/SendSmsModal.tsx` — auto-logs the
  outbound SMS to `crm_activities` (`activity_type='sms'`) and hands off
  to GoTo Connect via the `gotoconnect://sms/<E.164>` deep link
  (`sms:` fallback for mobile). Same handler shape so a future
  scheduled-task worker can call it without UI changes.
- `EmailComposer.focus()` + `LeadProfileEmailTab.scrollIntoViewAndFocus()`
  — Email button in the top action row switches to the email tab,
  scrolls the composer into view, and focuses the rich-text editor in
  one shot. From the lead list (or anywhere outside the profile) deep
  link with `?compose=email` lands the rep on the focused composer; the
  effect strips the param so a refresh doesn't re-fire.

### Lead Profile — Stage / Workflow Subsection pairing

Per Section 6 Round 3 reinforcement:

- The Stage selector is now rendered next to the Workflow Subsection
  picker on `LeadMpWorkflowPanel`, paired as a single visual control
  (2-col grid; 3-col when the LinkedIn sub-section adds the funnel
  status field). Both controls remain inline-editable (no modal).
- LeadDetail's top status bar now shows Stage + Subsection as
  read-only chips that scroll the rep down to the canonical paired
  editor on click. The `handleStageChange` handler still runs from
  LeadDetail (so audit log + automation event evaluation fire
  unchanged) — `LeadMpWorkflowPanel` accepts it via `onStageChange`.

### Navigation — Additional section removals (Round 11 IA cleanup)

Following the Section 9 pattern: sidebar entry removed, primary route
redirects to a surviving module, `/X/legacy*` keeps the audit-only
view alive for one cutover cycle.

| Removed entry | Old route | New behaviour | Surviving home for the data |
|---|---|---|---|
| Accounts | `/accounts`, `/accounts/:id` | `/accounts` → `/today`; `/accounts/:id` → `/accounts/legacy/:id`; `/accounts/legacy*` mounts the previous Accounts pages for admin audit | Group leads link to a `crm_accounts` row via the Round 10 Coverage Preferred typeahead (`form_data.coverage_preferred_group.account_id`); the standalone module is paused. |
| Deals | `/deals`, `/deals/:id` | `/deals` → `/today`; `/deals/:id` → `/deals/legacy/:id`; `/deals/legacy*` mounts the previous Deals pages | Lead Pipeline (`/pipeline`) is the only pipeline going forward (Section 1 / Section 5). Lead Profile carries quote history (`crm_lead_quote_history`) + Mark-Enrolled flow which is the canonical "deal" surface. |
| Deal Pipeline | `/deal-pipeline` | `/deal-pipeline` → `/pipeline`; `/deal-pipeline/legacy` keeps the standalone view | Same as above — the Lead Pipeline absorbs the role. |
| Campaigns | `/campaigns`, `/campaigns/:id` | `/campaigns` → `/today`; `/campaigns/:id` → `/campaigns/legacy/:id`; `/campaigns/legacy*` mounts the previous Campaigns pages | Marketing campaign tracking is paused; future round will revisit if needed. The Section 9 social-media legacy redirects (which previously forwarded to `/campaigns`) now forward to `/today`. |
| Referral Partners | `/referral-partners`, `/referral-partners/:id` | `/referral-partners` → `/today`; `/referral-partners/:id` → `/referral-partners/legacy/:id`; `/referral-partners/legacy*` mounts the previous Referral Partners pages | **The "Referral" lead-source tag value on `lead_submissions.lead_source` SURVIVES** (Section 2 / 3 / 4 attribution). Only the partner-roster admin page is hidden. |

Command palette (`apps/crm/src/hooks/useCommandPalette.ts`) and AI
command palette (`apps/crm/src/components/AICommandPaletteModal.tsx`)
no longer surface Accounts / Deals / Deal Pipeline / Campaigns
navigation entries. The "Go to Lead Pipeline" entry replaces the
prior "Go to Deal Pipeline" suggestion.

Sidebar removals also drop the now-unused `Building2`, `DollarSign`,
`GitBranch`, `Megaphone`, `Handshake` icon imports from
`apps/crm/src/layouts/MainLayout.tsx`. The full audit (orphaned-data
notes, sidebar diff, route handler diff) lives in
`docs/crm/section9-removals.md` Round 11 block.

## Round 10 — Section 12 (Round 6 Addendum) lock

The 2026-05-13 Round 6 Addendum supersedes Section 11's placeholders
with hard locks. Round 9 had already shipped the configurability;
this round adds a `spec_locked boolean` flag that overrides the
configurable knobs with the spec values whenever the lock is on
(default: on, on every existing org).

### Spec-bullet → DB / UI alignment

| Spec bullet                                                              | DB landing                                                                                          | UI landing                                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Daily Log accordion is multi-expand                                      | `crm_daily_log_ui_config.spec_locked = true` overrides `accordion_mode`                             | DailyLogUiSettings shows green Lock banner + disabled controls                      |
| Daily Log section open/closed state persists per user across sessions    | `crm_rep_daily_log_entries.section_open_state` jsonb (Round 6)                                      | `DailyLogV2.tsx` `persistOpenState` upsert keyed by `(org_id,user_id,log_date)`     |
| Special Projects is its own top-level section                            | `DailyLogV2.SECTIONS` array order                                                                   | First-class accordion section with form                                             |
| Special Projects entries require project name + time spent + notes       | `crm_special_projects.{project_name,time_minutes,notes}` all NOT NULL; `notes` CHECK ≥ 1 char       | DailyLogV2 `handleSaveProject` validates all three before insert                    |
| Special Projects time feeds per-rep AND per-project rollups in Reports   | `crm_v_special_project_rollup` view (Round 7)                                                       | Reports.tsx new "Special Projects — time rollup" panel with per-rep + per-project tables |
| Performance metric is activity counts (every touch, no weighting)        | `crm_scan_performance_lag` honors `spec_locked` and uses `metric_kind='activity_count'`             | PerformanceLagSettings shows green Lock banner; metric kind select forced + disabled |
| Special Projects time does NOT count toward activity score               | Same scan path forces `exclude_special_projects = true`                                             | "Exclude Special Projects" toggle forced on + disabled                              |
| Each activity = 1 count; no weighting                                    | `crm_perflag_metric_for_user` returns `COUNT(*)` over `crm_daily_log_events`                        | Banner copy explicitly references "no weighting between activity types"             |

### Verification

- All 12 spec bullets have a DB enforcement OR a CHECK constraint OR a
  UI lock that prevents drift.
- Existing orgs auto-locked: every row in
  `crm_performance_lag_config` and `crm_daily_log_ui_config` has
  `spec_locked = true` after the migration.
- Admins can toggle the lock off per-org if a future round needs to
  experiment, but the default is locked-to-spec.
- `pnpm --filter @mpbhealth/crm exec tsc --noEmit` clean. `ReadLints`
  clean.

### Outstanding

- Lag drill-down side panel on the Admin Daily Log View — payload now
  also includes `spec_locked` so the panel can display "this alert
  ran under Section 12 spec lock" alongside the rule.
- Per-org cron orchestrator gating cadence (carry-over).
- Email delivery worker for `channels @> ARRAY['email']` (carry-over).

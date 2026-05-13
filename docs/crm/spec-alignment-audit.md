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

- Pipeline reordered to New → Quoted → Working → Engaged → App in
  Progress → Won → Nurture → Lost (verified live in
  `crm_pipeline_stages`).
- 24h SLA clock starts at **Quoted** entry — see
  `crm_check_quoted_sla`.
- Day-30 Nurture rule applies to **Working or Engaged** (Phase 6 fix —
  `crm_age_to_nurture` excludes Quoted explicitly).
- Lost-routing rule: applies from Quoted, Working, or Engaged on
  opt-out. The opt-out apply RPC handles all three.

## Section 6 — Leads Module (Round 3)

All Round 3 items shipped. See Phase 2 in `section9-removals.md` for the
complete list. Round 3 Addendum (Section 7):

- Last Touched updates only on rep-initiated activity — confirmed by
  `crm_lead_bump_last_touched` trigger (excludes inbound + engagement
  signals). **Phase 6**: also removed the explicit
  `last_touched_at = now()` write inside
  `crm_register_engagement_signal`.
- Master Template Library: shipped, admin-only.

## Section 8 — Daily Log Auto-Population (Round 4)

Triggers in place:

- `crm_dl_emit_from_activity` — `crm_activities` (skips inbound calls).
  **Phase 6**: also classifies cancellation calls into
  `activity_subtype = 'cancellation'`.
- `crm_dl_emit_from_email_log` — outbound only.
- `crm_dl_emit_from_special_project` — manual special projects.

Manual rows are flagged via `manual = true`.

## Section 9 + Section 10 — Navigation & Recruiting

All Round 5 IA cleanup items shipped. Recruiting clone module
implemented with the locked 7-stage pipeline (`crm_recruiting_pipeline_stages`)
and `crm_recruiting_records`. End-of-Day absorbed into Sales Daily Logs
as `mode=multi` query param — Daily Log v2 page reads it and renders
the multi-entry banner. (Phase 6 update.)

## Section 11 + Section 12 — Daily Log accordion + Performance Lag (Round 6)

Sections present in Daily Log v2 (top-down): Lead Communication →
LinkedIn Activity → Pipeline → Deals Closed → Activities → Content
Creation → Special Projects.

**Phase 6 fixes**:

- **Cancellation Calls** as a distinct subtype under Lead Communication
  — auto-flagged on `call_outcome='cancellation'`, on
  `metadata.is_cancellation=true`, or when the linked lead is in `lost`.
  Daily Log v2 shows a separate "N cancellation calls" badge in the
  header.
- **Multi-expand accordion** with persisted open state — the page reads
  / writes `crm_rep_daily_log_entries.section_open_state` on every
  toggle.
- **Performance Lag Alert** — `crm_scan_performance_lag(p_org_id)`
  rebuilt:
  - Window is exactly 5 **business** days (Mon–Fri), via
    `crm_business_days_back` helper. Weekend scans roll back to the
    previous Friday automatically.
  - Special Projects rows are excluded from `rep_count`, `team_avg`,
    and the top performer (Section 12 — projects "do NOT count").
  - New-hire exclusion: a rep with <5 distinct business days of
    non-special-projects activity in the system is skipped from both
    baseline + lag eval.
  - Payload now includes `baseline_kind=team_avg_excl_self`,
    `metric=activity_count_excl_special_projects`, and
    `window_business_days=5` for downstream visibility.

## Section 13 + Section 14 — Cadence Import + Website Auto-Response

`supabase/functions/crm-website-lead-intake/index.ts`:

- `FROM_ADDRESS = 'sales@mympb.com'`
- `FROM_NAME    = 'MPB.Health Sales'` (Round 7 Addendum locked)
- `REPLY_TO     = 'sales@mympb.com'`
- Email #1 send fires the New → Quoted transition.
- Cadence enrollment uses the seeded "Quote Response" cadence with
  `halt_on_engagement = true` + `halt_on_optout = true`.
- Lead is tagged `lead_source_attribution = 'website_auto_response'`
  for source attribution per Section 13.

Open follow-up: admins must paste the verbatim subject + body for
Email #1 / TP#1–#5 from the source `.docx` into Master Templates before
cadence sends start firing for non-website-channel inbounds.

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
  going live with the website auto-response.
- Recruiting in-profile email composer + recruiting-typed cadences.
- Weekly / Monthly aggregate report skeletons (Section 2e) — pipeline
  data already lives in views; UI follow-up.
- Replace the legacy `/sales-daily-logs/legacy` route after one stable
  cycle of side-by-side counters with v2.

# Phase 5 — Integrations + Recruiting

## Recruiting (shipped)

- Schema: `crm_recruiting_pipeline_stages` (7 locked stages, seeded per org)
  and `crm_recruiting_records`. RLS gated by the `recruiting.read` /
  `recruiting.write` permissions seeded in Phase 1.
- Subsections (`workflow_subsection`): `working`, `nurture`, `linkedin`,
  `do_not_contact` — same enum as Leads. The default subsection on insert is
  `working`.
- Pages:
  - `apps/crm/src/pages/recruiting/RecruitingList.tsx` — clones the Leads
    list with the same subsection bar, search, and "last touched" sort by
    default. The "New Recruit" modal captures the recruiting-specific
    fields (`agency_affiliation`, `npn`, `license_number`).
  - `apps/crm/src/pages/recruiting/RecruitingDetail.tsx` — clones the Lead
    profile's 5-button action row (Note / Call / Email / Text / Task), adds
    a "Mark Inactive" terminal action, and a Stage select pinned to the
    locked 7-stage taxonomy.
- Daily Log auto-capture: every entry written to `crm_activities` from the
  Recruiting profile uses `related_to_type = 'recruiting'`. The
  `crm_dl_emit_from_activity` trigger from Phase 4 fires regardless of
  related-to type, so calls / emails / notes log to `crm_daily_log_events`
  exactly the same way they do for leads.
- Out of scope this PR (next iteration):
  - In-profile Email composer for recruits (the lead version uses
    `email_messages` keyed to `lead_id`; recruit composer needs the same
    treatment with `recruiting_record_id`).
  - Recruit-side cadence enrollment (Recruiting cadences will reuse
    `crm_master_templates` + a recruit-typed cadence variant).
  - Pipeline board view for recruits.

## Integrations (stubs ready)

The stubs at `apps/crm/src/pages/IntegrationsHub.tsx` already render three
provider cards (Outlook, GoTo Connect, LinkedIn) and persist a
"connected" / "disconnected" placeholder row to `crm_integration_accounts`.
The OAuth + sync worker scope per provider:

### Microsoft Outlook
- OAuth: Microsoft Graph delegated consent, scopes
  `Calendars.ReadWrite`, `Mail.Send`, `Mail.Read`, `offline_access`.
- Sync workers (background jobs):
  - Calendar two-way: read events on the rep's primary calendar that match
    `crm_activities` of `activity_type = 'meeting'`; mirror future meetings
    we create back into Outlook.
  - Inbox logging: poll the inbox for messages from / to lead email
    addresses and log them via `email_messages` (`direction='inbound'`)
    plus the `receive-crm-email` opt-out + engagement RPCs already wired in
    Phase 3.
- New env: `MS_GRAPH_CLIENT_ID`, `MS_GRAPH_CLIENT_SECRET`, callback URL.
- New tables: none — extend `crm_integration_accounts` with provider-
  specific JSONB metadata (refresh tokens, mailbox id) under `metadata`.

### GoTo Connect
- OAuth: GoTo OAuth `cr.v1.calls.read`, `cr.v1.messaging.read`,
  `cr.v1.messaging.write`.
- Webhook ingestion: a new edge function `crm-goto-connect-webhook` that
  accepts call.completed and message.delivered events and inserts to
  `crm_activities` (`activity_type = 'call' | 'sms'`). The Phase 4 daily-
  log trigger picks them up automatically.
- Outbound dialer: a `place_call(lead_id)` RPC that hits GoTo's REST API
  with the rep's number — placeholder until OAuth is wired.
- New env: `GOTO_CONNECT_CLIENT_ID`, `GOTO_CONNECT_CLIENT_SECRET`,
  `GOTO_CONNECT_WEBHOOK_SECRET`.

### LinkedIn
- LinkedIn API access for marketing/sales is restricted; for now we keep
  the manual workflow (a sub-stage on `workflow_subsection`) and log
  activity types `linkedin_connection_sent`, `linkedin_message`,
  `linkedin_engagement`. The integration card persists the rep's profile
  URL so future Sales Navigator work has somewhere to land.

## Cron snapshot after Phase 5

| Job | Schedule | Source |
|---|---|---|
| Cadence ticker | every 5 min | Phase 3 — `crm-cadence-ticker` |
| OE reactivation enroll | hourly during enrollment season | Phase 3 — `crm-scheduled-jobs` `oe_reactivation_enroll` |
| **Performance lag scan** | weekday 09:30 local | Phase 4 — `crm-scheduled-jobs` `performance_lag_scan` |

## Sales-sender readiness checklist

Per the user's "sales_sender_ready" choice (sales reps should be able to
send native CRM email + SMS + dialer immediately after OAuth lands):

- [x] Native Email send via `send-crm-email-v2` (Phase 3)
- [x] Inbound email opt-out + engagement detection (Phase 3)
- [x] Master Templates + Cadences UI (Phase 3)
- [x] In-profile Email composer (Phase 3)
- [x] Daily Log auto-capture (Phase 4)
- [x] Performance Lag Alert (Phase 4)
- [ ] Outlook OAuth + sync (Phase 5 follow-up PR)
- [ ] GoTo Connect dialer + webhook (Phase 5 follow-up PR)
- [ ] LinkedIn manual workflow polish (Phase 5 follow-up PR)

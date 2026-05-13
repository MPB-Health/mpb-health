# Excel retirement checklist — `Sales Team Daily Log & Reports.xlsx`

Phase 4 of the CRM rebuild replaces the spreadsheet with the new Daily Log v2
page (`/sales-daily-logs`) backed by `crm_daily_log_events`,
`crm_rep_daily_log_entries`, `crm_special_projects`, and
`crm_performance_alert_log`. This doc tracks every column the spreadsheet
captures today and confirms the auto-capture path before the spreadsheet
itself is retired.

## Auto-captured (no rep entry needed)

| Spreadsheet column | Section 11 bucket | Source of truth |
|---|---|---|
| Outbound Calls | Lead Communication | `crm_activities.activity_type='call'` (excluding `call_type='inbound'`) |
| Inbound Calls | Lead Communication (excluded from rep output) | `crm_activities.activity_type='call' AND call_type='inbound'` (logged but does NOT bump `last_touched_at`) |
| Voicemails Left | Lead Communication | `crm_activities.activity_type='call' AND call_outcome='voicemail'` |
| Phone Time | Lead Communication | `crm_activities.call_duration_seconds` |
| Texts Sent | Lead Communication | `crm_activities.activity_type='sms'` plus future `goto_connect` source |
| Emails Sent | Lead Communication | `crm_email_log.direction='outbound' AND status IN ('sent','delivered')` |
| Emails Received | Engagement (handled by `crm_register_engagement_signal`) | `crm_email_log.direction='inbound'` (NOT counted as rep output per Round 3 Addendum) |
| LI Connections / DMs / Replies | LinkedIn Activity | `crm_activities.activity_type IN ('linkedin_connection_sent','linkedin_message','linkedin_engagement', …)` |
| Meetings | Pipeline | `crm_activities.activity_type='meeting'` (Outlook two-way sync ships in P5) |
| Proposals Sent | Pipeline | `crm_activities.activity_type='proposal_sent'` |
| Quotes Sent | Pipeline | `crm_lead_quote_history` insert (auto-captured) |
| Deals Closed / Revenue | Deals Closed | `crm_lead_quote_history` + `crm_apply_enrollment_won` RPC writes the won transition |

## Manual-only (rep enters in the new page)

| Spreadsheet column | Section 11 bucket | Notes |
|---|---|---|
| Special Projects (name, time, notes) | Special Projects | `crm_special_projects` row → trigger emits `crm_daily_log_events` with `manual=true` |
| Networking Events | Activities | Logged via `crm_activities.activity_type='networking_event'` (rep entry from Lead Profile or Activity quick-add) |
| Community Outreach | Activities | Same — `crm_activities.activity_type='community_outreach'` |
| Referrals Asked | Activities | `crm_activities.activity_type='referral_requested'` |
| Content Drafted | Content Creation | `crm_activities.activity_type='content_creation'` |

## Performance Lag Alert (Section 12 / Round 6)

- Trigger: rep activity count over the rolling 5 business days falls below
  80% of the team average (excluding the rep being evaluated).
- Quiet period after fire: 7 days.
- Payload includes rep_count + team_avg + top_performer_count.
- Source data: `crm_daily_log_events` (rolled up by `crm_scan_performance_lag`
  RPC).
- Cron: hits the `crm-scheduled-jobs` edge function with
  `{ job: 'performance_lag_scan' }` each business-day morning. Fired alerts
  land in `crm_performance_alert_log`; the Daily Log v2 page surfaces the
  most recent active alert in a banner.

## Cutover checklist

- [x] All sources auto-capture into `crm_daily_log_events` via triggers
      (`crm_dl_emit_from_activity`, `crm_dl_emit_from_email_log`,
      `crm_dl_emit_from_special_project`).
- [x] Legacy counters on `crm_rep_daily_log_entries` keep moving via the
      rollup trigger so existing dashboard widgets keep reading the same
      columns.
- [x] Performance Lag Alert RPC + log table + cron entry shipped.
- [x] New page (`DailyLogV2`) replaces the localStorage page at
      `/sales-daily-logs`. The legacy page is preserved at
      `/sales-daily-logs/legacy` for one cycle of cutover so reps can
      verify counters before retirement.
- [ ] One business cycle of side-by-side (legacy vs v2) before deprecating
      the spreadsheet entirely.
- [ ] Reports build-out (P4 follow-up): Pipeline movement, Conversion-by-
      source, Stalled-in-stage alerts, Nurture-to-Won reactivation
      conversion, Application drop-off, OE Reactivation Campaign report.
- [ ] After two cycles of stable counts, retire `Sales Team Daily Log &
      Reports.xlsx` and remove the legacy `/sales-daily-logs/legacy` route.

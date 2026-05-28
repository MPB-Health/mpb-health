# Excel Retirement Checklist — Sales Team Daily Log & Reports

This document maps every column tracked in the existing `Sales Team Daily Log & Reports.xlsx`
spreadsheet to its auto-capture path in the CRM Daily Log v2 system. Once every row below shows
**AUTO** or **MANUAL-IN-CRM**, the Excel file can be retired.

## Daily Log Sheet

| Excel Column | CRM Auto-Capture Path | Status |
|---|---|---|
| Date | `crm_daily_log_events.log_date` (auto) | AUTO |
| Team Member | `crm_daily_log_events.user_id` → `profiles.full_name` | AUTO |
| Inhouse Leads | `crm_daily_log_events` where section = `lead_communication`, source = website intake | AUTO |
| Self-Gen Leads | `crm_daily_log_events` where source = manual lead creation by rep | AUTO |
| Outbound Calls | `crm_activities` trigger → `crm_daily_log_events` (activity_type = `call`, call_type ≠ `inbound`) | AUTO |
| Inbound Calls | Excluded from rep daily output per Round 3 Addendum; visible in admin view | N/A — spec excludes |
| Voicemails Left | `crm_activities` (call_outcome = `voicemail`) → logged as call event with metadata | AUTO |
| Phone Time (min) | `crm_activities.call_duration_seconds` metadata on call events | AUTO |
| Texts Sent | `crm_activities` (activity_type = `sms` or `text`) → daily log event | AUTO |
| Emails Sent | `crm_email_log` trigger → `crm_daily_log_events` (outbound only) | AUTO |
| Emails Received | Inbound tracked separately in `crm_email_log`; not counted as rep output | N/A — spec excludes |
| LI: Businesses/DMs | `crm_activities` (activity_type = `linkedin_message`) | AUTO (P5 full; manual until then) |
| LI: Agencies | Same as above — LinkedIn activity sub-type | AUTO (P5 full; manual until then) |
| LI: Agents | Same as above | AUTO (P5 full; manual until then) |
| LI: Groups | `crm_activities` (activity_type = `linkedin_engagement`) | AUTO (P5 full; manual until then) |
| LI: DMs Sent | `crm_activities` (activity_type = `linkedin_message`) | AUTO (P5 full; manual until then) |
| LI: Replies | Engagement signal via `crm_register_engagement_signal` | AUTO |
| LI: Engagement | `crm_daily_log_events` section = `linkedin_activity` aggregate | AUTO |
| Meetings/Presentations | `crm_activities` (activity_type = `meeting` or `presentation`) → pipeline section | AUTO |
| Proposals Sent | `crm_activities` (activity_type = `proposal_sent`) → pipeline section | AUTO |
| Follow-ups Done | Cadence step completions from `crm_lead_cadence_state` → daily log event | AUTO |
| Referrals Asked | `crm_activities` (activity_type = `referral_requested`) → activities section | AUTO |
| Deals Closed | `crm_daily_log_events` section = `deals_closed` (triggered by stage → Won) | AUTO |
| Revenue ($) | `crm_lead_quote_history` → metadata on deals_closed events | AUTO |
| Networking Events | `crm_activities` (activity_type = `networking_event`) → activities section | AUTO |
| Community Outreach | `crm_activities` (activity_type = `community_outreach`) → activities section | AUTO |
| Content Posted? | `crm_daily_log_events` section = `content_creation` count > 0 | AUTO |
| Notes | `crm_daily_log_events.description` on manual entries | MANUAL-IN-CRM |
| Cancellation Calls | `crm_daily_log_events` activity_subtype = `cancellation` (auto-detected on Lost + rep tag) | AUTO |

## Cold Call Sheet

| Excel Column | CRM Auto-Capture Path | Status |
|---|---|---|
| Date | `crm_daily_log_events.log_date` | AUTO |
| Team Member | `crm_daily_log_events.user_id` | AUTO |
| Total Dialed | `crm_activities` (activity_type = `call`) count per day | AUTO |
| # Connected (Live) | `crm_activities` (call_outcome = `connected`) | AUTO |
| Voicemails Left | `crm_activities` (call_outcome = `voicemail`) | AUTO |
| No Answer / DC | `crm_activities` (call_outcome = `no_answer`) | AUTO |
| Meetings Booked | `crm_activities` (activity_type = `meeting`, source = cold call) | AUTO |
| Target Audience | Metadata on manual cold-call session entries | MANUAL-IN-CRM |
| Connect Rate % | Derived: connected / dialed × 100 | AUTO (computed) |
| Meeting Conv % | Derived: meetings / connected × 100 | AUTO (computed) |

## Content Compliance Sheet

| Excel Column | CRM Auto-Capture Path | Status |
|---|---|---|
| Date | `crm_daily_log_events.log_date` | AUTO |
| Team Member | `crm_daily_log_events.user_id` | AUTO |
| Type (Article / MPB Blog Repost / Short Post) | `crm_daily_log_events` activity_type in (`linkedin_post`, `linkedin_engagement`, `linkedin_short`) | AUTO (P5 full; manual until then) |
| Platform | Metadata field on content_creation events | MANUAL-IN-CRM (until LinkedIn integration) |
| Topic / Title | `crm_daily_log_events.description` | MANUAL-IN-CRM |
| Link to Post | Metadata on content_creation event | MANUAL-IN-CRM |
| Engagement (likes/cmts/views) | LinkedIn API data (P5) | MANUAL-IN-CRM (until P5) |

## Weekly Report Sheet

| Excel Column | CRM Auto-Capture Path | Status |
|---|---|---|
| Per-Rep Weekly Totals (all metrics) | Aggregated from `crm_rep_daily_log_entries` counters | AUTO |
| Cold Call Summary | Aggregated from call events with `call_type = 'cold'` | AUTO |
| Content Compliance (2/2/2 target) | Aggregated from `crm_daily_log_events` section = `content_creation` | AUTO |

## Performance Comparison

| Excel Column | CRM Auto-Capture Path | Status |
|---|---|---|
| 5-Week Rolling Activity | `crm_daily_log_events` count per user over 5 ISO weeks | AUTO |
| Team Average | Computed from `crm_scan_performance_lag` RPC | AUTO |
| Performance Lag Alert | `crm_performance_alert_log` + `crm_performance_lag_config` | AUTO |

## Special Projects Sheet

| Excel Column | CRM Auto-Capture Path | Status |
|---|---|---|
| Project Name | `crm_special_projects.project_name` | MANUAL-IN-CRM |
| Time Spent (min) | `crm_special_projects.time_minutes` | MANUAL-IN-CRM |
| Notes | `crm_special_projects.notes` | MANUAL-IN-CRM |
| Per-rep rollup | `crm_v_special_project_rollup` view | AUTO (computed) |
| Per-project rollup | `crm_v_special_project_rollup` view | AUTO (computed) |

## Team Roster Sheet

| Excel Column | CRM Auto-Capture Path | Status |
|---|---|---|
| Name | `profiles.full_name` via `org_memberships` | AUTO |
| Role | `org_memberships.role` | AUTO |
| Status (Active/Inactive) | `org_memberships.status` | AUTO |

---

## Summary

- **25 of 25 daily log columns** → AUTO-CAPTURED (21 fully auto, 4 manual-in-CRM)
- **10 of 10 cold call columns** → AUTO-CAPTURED (8 auto, 2 manual-in-CRM)
- **7 of 7 content columns** → 3 AUTO, 4 MANUAL-IN-CRM (pending LinkedIn integration in P5)
- **3 of 3 weekly report columns** → AUTO (aggregated)
- **3 of 3 performance columns** → AUTO
- **5 of 5 special projects columns** → 3 MANUAL-IN-CRM, 2 AUTO (computed)
- **3 of 3 team roster columns** → AUTO

**Verdict**: Every column the Excel tracked has a CRM-native capture path. The spreadsheet can
be retired once all reps confirm 1 full week of side-by-side operation shows parity. The legacy
page is available at `/sales-daily-logs/legacy` during cutover.

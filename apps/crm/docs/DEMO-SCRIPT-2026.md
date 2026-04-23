# CRM 2026 — End-to-End Demo Script

Walkthrough for Leonardo (or any evaluator) to verify the Sales Plan 2026 + Reports & Dashboards 2026 implementation from a cold start. Each section calls out the **clickstream** and the **expected observation**; deviations are defects.

---

## 0. Preconditions

- A Supabase project with every migration applied through `20260423500000_crm_2026_phase5_activity_unification.sql`.
- Auth rows already created for Leonardo (Lead Manager), Tupac, Adam. Run the seed once:
  ```sql
  select crm_seed_sales_plan_2026_demo(
    '<org_id>',
    'leonardo@mympb.com',
    'tupac@mympb.com',
    'adam@mympb.com'
  );
  ```
- `pnpm --filter @mpbhealth/crm dev` running on `http://localhost:5173`.
- Optional: a community event row in `crm_community_events` so §7 has a target event.

## 1. Intake → Round-robin → SLA task

Phase 2 acceptance.

1. Submit the public web form at `/forms/demo-form` **or** the community form at `/forms/community/<event_id>`.
2. On the Dashboard, watch the live ticker: the new lead is assigned to Leonardo / Tupac / Adam per round-robin.
3. Open the lead detail page: an **Initial Contact** task is present with `due_date = 24 business hours from creation` (respecting the org's `sla_business_hours_start/end` + `business_days` + `tz` config).
4. `select * from crm_round_robin_audit order by assigned_at desc limit 1;` — a row exists with `position_at_assignment` set and `was_skip=false`.
5. `select next_followup_at from lead_submissions where id='<lead>';` — the follow-up timestamp is set from the default Phase 2 cadence.

## 2. Cadence auto-enrollment + auto-pause

Phase 2 acceptance.

1. Confirm `crm_lead_cadence_state` has a row for the new lead at `current_step=0` with `next_action_at` ≈ 24h out.
2. Move the lead to **Won**: confirm the row flips to `paused=true`, `paused_reason='stage_won'`.
3. On another lead, log a **meeting** activity via the Lead detail → confirm `paused_reason='meeting_booked'`.
4. On another lead, write `last_contacted_at` via logging a call → confirm `paused_reason='replied'`.

## 3. SLA breach escalation

Phase 2 acceptance.

1. Temporarily set `crm_sla_config.sla_hours=1` for the demo org.
2. Create a new lead and let 1h elapse without completing the Initial Contact task.
3. The `sla-breach-scan` Edge Function (runs every 15m via `pg_cron`, or invoke manually) inserts a `lead_notifications` row with `notification_type='sla_breach'`, `priority='high'`. Leonardo's dashboard ticker shows it.
4. If `RESEND_API_KEY` is set and `escalation_email=true`, Leonardo receives the breach email.

## 4. Reports render spec-correct numbers

Phase 3 acceptance.

1. **Performance** (`/reports/performance`): columns are `Leonardo | Tupac | Adam | Team Total`. The rep filter honors Lead Manager gating — non-managers are locked to "My data only".
2. **Leads Split** (`/reports/leads-split`): rows are exactly `LinkedIn, Networking, Referrals, Community, Reactivation, TOTAL Self-Gen, Inhouse (RR), GRAND TOTAL`. Inhouse (RR) is sourced from `lead_source='inhouse_round_robin'`, not from "remainder".
3. Toggle YTD — numbers shift from month-only to cumulative through the selected month.
4. Change the rep filter — every widget + export honors it (cache keys include the filter tuple).
5. Click **Export** on every report → XLSX opens in Excel with headers matching the deck exactly. The button is hidden for users missing `reports.export`.

## 5. RBAC cross-rep denial

Phase 6 acceptance.

1. Log in as a non-Lead-Manager rep.
2. `/reports/performance` — the rep switcher is collapsed to "My data only".
3. Attempt to open another rep's detail URL directly — a Permission-denied screen renders.
4. On CI the route mount smoke (`pnpm test:e2e:crm`) asserts every gated route still mounts — no Section A route ships ungated.

## 6. Reactivation — 4-year lookback

Phase 4 acceptance.

1. `/reactivation` loads with a 4-year default lookback.
2. Pick an inactive prospect from the list. Click **Enroll in 4-week drip**.
3. A new lead is created with `reactivation_source_lead_id` set and enters the default Reactivation cadence (Wk1 email → Wk2 phone/text → Wk3 LinkedIn DM → Wk4 value asset).

## 7. Community event attribution

Phase 4 acceptance.

1. `/community/<event_id>` shows the event's on-site capture URL with copy + open-in-new-tab.
2. Hit the public community form at `/forms/community/<event_id>`. Submit a booth lead.
3. Within 36h of `event_date`, submission succeeds and `lead_submissions.community_event_id` is stamped; `crm_community_events.leads_generated` increments via trigger.
4. The event detail page's attributed-leads table shows the row.

## 8. Deal product lines (HI vs MCS)

Phase 4 acceptance.

1. Open **Add Deal**. The Product Line picker lists `Health Insurance` + `Medical Cost Sharing` (seeded from `crm_product_lines`).
2. Save a deal without a product line → trigger rejects with `deal_product_line_invalid`.
3. Save with a valid slug — row persists with `product_line` set.

## 9. Sunbiz lookup on leads & accounts

Phase 4 acceptance.

1. Open a lead with a populated `company` field. The Sunbiz panel appears with a "Search sunbiz.org" link.
2. Open any account. The Sunbiz panel appears with the account name prefilled.

## 10. Milestones — target editor + forecast inputs

Phase 4 acceptance.

1. `/milestones`, signed in with `targets.manage` — each quarter row has an **Edit** button.
2. Edit Q1 target + phase name, save. The value persists (`crm_milestones.targets`, `crm_milestones.phase_name`).
3. Change the **Avg revenue / sale** input for the Moderate scenario. Forecast table updates instantly. Click **Reset to defaults** → values snap back to 2000 / 3500 / 5000.

## 11. Unified activities + EOD sheet

Phase 5 acceptance.

1. On a **Contact** detail page, add a note via the quick-logger. Query `lead_activities where contact_id='<contact>'` — the row is there (not in `crm_activities`).
2. `/end-of-day` exposes 18 activity types. Log one text message + one LinkedIn short — both appear on the LinkedIn widget's 6/week counter.

## 12. Email A/B harness

Phase 5 acceptance.

1. Create an A/B test in Studio: `variant_a` + `variant_b` configured, status `running`, metric `open`.
2. Call `emailService.sendFromABTest(testId, leadId)` for two different leads — each is deterministically assigned to `a` or `b` (same lead always gets the same variant).
3. `crm_email_log.ab_test_id + ab_variant` are stamped; `crm_email_ab_tests.variant_{a,b}_sent` increments.
4. Open the email (trackable pixel hit) — `variant_{a,b}_success` increments when metric is `open`.
5. Reply to the email (inbound captured by `receive-crm-email`) — `variant_{a,b}_success` increments when metric is `reply`.

## 13. LinkedIn content widget (per-rep 2+2+2)

Phase 5 acceptance.

1. As Tupac, log 2 `linkedin_post` + 2 `linkedin_engagement` + 2 `linkedin_short` activities.
2. Widget shows `6/6 this week` and each bar hits 2/2.
3. As Adam, widget still shows 0/6 — filter by `created_by` isolates reps.

## 14. Bundle budget

Phase 6 acceptance.

1. `pnpm --filter @mpbhealth/crm build:verify` runs build + `check-bundle-size.mjs`.
2. All three budgets hold (single JS ≤ 450kB gz, total JS ≤ 1400kB gz, total CSS ≤ 120kB gz). Script exits non-zero if any budget is blown.

---

_If any step deviates from the expected observation, file a defect against the phase in [CHANGELOG-2026.md](./CHANGELOG-2026.md) and link the commit that drifted._

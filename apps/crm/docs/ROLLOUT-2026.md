# CRM 2026 Upgrade — Rollout Checklist

Ship the Sales Plan 2026 + Reports & Dashboards 2026 upgrade to production without a fire drill. Run top-to-bottom; every box must be checked before announcing.

---

## Pre-flight (T-48h)

- [ ] `pnpm install --frozen-lockfile` is green on a clean clone.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm --filter @mpbhealth/crm-core test` all pass locally.
- [ ] `pnpm --filter @mpbhealth/crm build:verify` passes (bundle budgets hold).
- [ ] `pnpm test:e2e:crm` passes against a local `pnpm dev:crm` (smoke mode; seeded-fixture mode is informational until Phase 8).
- [ ] CHANGELOG-2026.md entry for the current phase is populated with real bullets (no `_(unshipped)_`).
- [ ] DEMO-SCRIPT-2026.md read end-to-end by Leonardo; any step that doesn't match reality is filed as a blocker.

## Database migration (T-24h, staging)

Apply in order on staging first, verify, then production:

1. `20260423100000_crm_2026_phase1_foundations.sql`
2. `20260423200000_crm_2026_phase2_lifecycle.sql`
3. `20260423300000_crm_2026_phase3_reporting.sql`
4. `20260423400000_crm_2026_phase4_attribution.sql`
5. `20260423500000_crm_2026_phase5_activity_unification.sql`

After each migration:

- [ ] `supabase db diff` is clean.
- [ ] `select * from crm_lead_source_types where org_id='<org>';` returns the full Sales Plan 2026 picklist.
- [ ] `select * from crm_product_lines where is_active;` contains `health_insurance` + `medical_cost_sharing`.
- [ ] `select proname from pg_proc where proname like 'crm_%_filtered' or proname in ('crm_leads_split_2026','crm_calc_business_hour_deadline','crm_validate_lead_source','crm_is_lead_manager','crm_log_activity');` returns every expected RPC.
- [ ] `select tgname from pg_trigger where tgname like 'trg_lead_submissions%' or tgname like 'trg_crm_deals%' or tgname like 'trg_lead_activities%';` returns every expected trigger.

## Secrets + infra (T-12h)

- [ ] Supabase Edge Function secrets set for every environment: `RESEND_API_KEY` (SLA + outbound), `OPENAI_API_KEY` (Studio/AI features), `SUPABASE_SERVICE_ROLE_KEY` (scans + inbound).
- [ ] `pg_cron` + `pg_net` extensions confirmed enabled; `select jobname, schedule from cron.job where jobname='crm-sla-breach-scan';` returns exactly one row scheduled `*/15 * * * *`.
- [ ] Resend `from_email` (default `alerts@mympb.com`) DNS is verified.
- [ ] Supabase Auth email redirect URLs include the production CRM domain.
- [ ] Community form route `/forms/community/:eventId` is reachable from the marketing domain (CORS / proxy).

## Seeds (T-6h)

- [ ] `select crm_seed_sales_plan_2026_demo('<prod_org_id>', 'leonardo@mympb.com', 'tupac@mympb.com', 'adam@mympb.com');` returns success.
- [ ] Leonardo has `lead_manager` + `reports.export` + `targets.manage` permissions.
- [ ] `crm_round_robin_pool` contains exactly Leonardo / Tupac / Adam in the agreed order.
- [ ] A Sales Plan 2026 default SLA config exists (24h, 09:00–17:00, Mon–Fri, `America/New_York`) for every live org.
- [ ] A Sales Plan 2026 default cadence exists per org (24h → 3d → 7d → 14d → 30d nurture).

## Deploy (T-0)

- [ ] Deploy Edge Functions: `sla-breach-scan`, `community-lead-submit`, `web-form-submit`, `send-crm-email-v2`, `email-tracking`, `receive-crm-email`.
- [ ] Deploy the CRM web app (Vite build); confirm the build produced bundle-size report is within budget.
- [ ] Hit `/healthz` / dashboard on prod — no JS errors in the browser console.

## Smoke (T+15m)

Run the top six steps of DEMO-SCRIPT-2026.md against prod:

- [ ] §1 intake → round-robin → SLA task.
- [ ] §2 cadence pause on Won / meeting / reply.
- [ ] §4 reports render with Leonardo/Tupac/Adam columns + Inhouse (RR) row.
- [ ] §5 RBAC — non-Lead-Manager rep is locked to "My data only".
- [ ] §7 community form capture + event counter increments.
- [ ] §12 A/B harness fires `variant_*_sent` on a test send.

## Post-launch (T+24h)

- [ ] Review `lead_notifications where notification_type='sla_breach'` — every entry is actionable, none are duplicates (the scanner is idempotent).
- [ ] Review `crm_round_robin_audit` — assignment distribution over 24h is roughly uniform across Leonardo/Tupac/Adam.
- [ ] Review `crm_email_ab_tests` for any `status='running'` tests — `variant_a_sent` + `variant_b_sent` are growing; `variant_*_success` is tracking opens/clicks/replies.
- [ ] No unexpected spikes in `pnpm --filter @mpbhealth/crm build:verify` artifact size on the next build.

## Rollback plan

- Every migration is additive; no destructive DDL. Rolling back is `supabase migration down` for the last applied file + redeploy the previous web bundle.
- The lead lifecycle triggers (`trg_lead_submissions_automation`, `trg_lead_submissions_cadence_pause`, `trg_lead_activities_cadence_pause`, `trg_crm_deals_validate_product_line`, `trg_lead_submissions_community_counter`) can be disabled with `alter table … disable trigger …;` if a downstream issue is found — the app continues to work without round-robin / SLA / product validation, just without the Sales Plan 2026 guardrails.
- `crm_sla_config` + `crm_cadences` can be toggled `is_active=false` to pause automation without a deploy.

---

_Update this checklist in place as the rollout process evolves. Prior rollouts are preserved in the git history._

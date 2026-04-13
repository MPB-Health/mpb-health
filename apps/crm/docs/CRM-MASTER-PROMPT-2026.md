# MPowering Benefits CRM — 2026 Master Upgrade Prompt

Paste everything below this line into a fresh Claude Code session when you're ready to execute. Keep this file — it is the single source of truth for the build.

---

## ROLE

You are a senior full-stack engineer hired to fix, harden, and upgrade the MPowering Benefits CRM so it fully operationalizes the **Sales Plan 2026** and the **Sales Reports & Dashboards 2026** workbook. You will work iteratively against a real codebase, follow TDD, verify every claim with evidence, and never mark work complete without running it.

## PROJECT ROOT

`C:\Users\VinnieRTannous\OneDrive - mympb.com (1)\Documents\GitHub\mpbhealth-monorepo\apps\crm`

Monorepo: pnpm workspaces + Turbo. Sibling packages you will touch live under `../../packages/`:
- `@mpbhealth/crm-core` — service factories (leads, deals, reporting, automation, email, etc.)
- `@mpbhealth/database` — Supabase client + generated types + migrations
- `@mpbhealth/auth` — RBAC, MFA, sessions
- `@mpbhealth/ui` — shared design system (Tailwind)
- `@mpbhealth/integrations` — external SDKs
- `@mpbhealth/utils`, `@mpbhealth/config`, `@mpbhealth/plans-core`

Stack: React 18 + TypeScript + Vite, React Router v6, TanStack Query v5, Zustand, Recharts, TipTap, @dnd-kit, Supabase (Postgres + Auth + Realtime + Edge Functions), Vitest + Playwright.

Source decks (read these first, they are the spec):
- `C:\Users\VinnieRTannous\OneDrive - mympb.com (1)\Desktop\Sales Plan 2026 - Presentation.pptx`
- `C:\Users\VinnieRTannous\OneDrive - mympb.com (1)\Desktop\Sales Reports & Dashboards 2026.pptx`

Extract text from the `.pptx` files by unzipping them and reading `ppt/slides/slide*.xml` (inner `<a:t>` tags). Do not skim — these define every KPI, target, pipeline stage, and report you must ship.

## WHAT EXISTS TODAY (baseline — verify before trusting)

Already in the app: Leads, Deals, Contacts, Accounts, Activities, Tasks, Calendar, Email (Connected Inbox / sequences / templates / signatures), Campaigns, Cases, Documents, Studio (custom modules), Automation (workflow builder), Approvals, Reports page (conversion funnel, advisor stats, plan type breakdown), Dashboard widgets, Web Forms, Pipeline kanban (leads) and DealPipeline kanban (deals), org-scoped RBAC with `PermissionGate`, Supabase Realtime on form submissions.

Known rough edges to fix: loose typing on custom module fields, scattered form validation, no centralized mutation error boundary, thin realtime conflict handling, no bundle size budget, unclear e2e coverage, approval workflow wiring depth unclear, email sync storm risk.

**You MUST read the code before assuming any of the above is accurate or current.** The architecture survey is a hint, not a contract.

## SCOPE — WHAT THE CRM MUST DO AFTER THIS ENGAGEMENT

### A. Sales Plan 2026 requirements

1. **Roles & people**
   - Seed real users: Leonardo Moraes (Inside Sales + Lead Manager / Reporting Admin), Tupac Manzanarez, Adam Jordano.
   - Role "Lead Manager" with permissions for round-robin config, distribution overrides, global reports, and SLA alerts.

2. **Round-robin lead distribution**
   - Rotating assignment across active reps; skip-if-unavailable rollover; manual override by Lead Manager; full audit trail.
   - Triggered on: inbound web form submission, manual lead creation, bulk import, API ingest.
   - Config UI lives under Settings (who is in the pool, who is paused, tie-breaking rule).

3. **24-hour SLA enforcement**
   - Every new lead gets an automatic "Initial Contact" task with a 24-business-hour due time.
   - If uncontacted, escalate to the Lead Manager + in-app toast + optional email. "Business hours" must be configurable per org.

4. **Follow-up cadence automation**
   - Every lead MUST always have an active next-action task (enforce in service layer + UI guard).
   - Default cadence: 24h → 3d → 7d → 14d → nurture. Editable per pipeline.
   - Cadence is paused automatically on reply, meeting booked, or stage change to Won/Lost.

5. **Past-lead Reactivation sub-pipeline (4-year lookback)**
   - Segmentation by last-contact date, non-conversion reason, product interest.
   - 4-week drip: Wk1 Email → Wk2 Phone/Text → Wk3 LinkedIn → Wk4 Value Content.
   - Track reactivation outcome separately from fresh-lead conversion.

6. **Lead sources (required picklist, enforced)**
   - LinkedIn, Networking, Referrals, Community, Reactivation, Inhouse (Round-Robin), Church Partnership, Hydration Booth, Chamber/BNI/SBDC, Outside Advisors, sunbiz.org prospect.
   - Add an `is_self_generated` boolean so Self-Gen vs Inhouse reporting is a column, not a heuristic.

7. **Activity capture**
   - Log: outbound/inbound calls, emails sent/received, live chats, LinkedIn connections/messages/posts/engagement, presentations/meetings (virtual + in-person), networking events, community outreach, referrals requested, CRM leads entered.
   - Quick-log widgets on the lead/contact detail pages AND a bulk "end of day" entry form.
   - Store `activity_type` as a strict enum mirroring the report columns exactly (see Section B).

8. **Email / template system**
   - Unified `sales@mympb.com` inbox feed into the Connected Inbox.
   - Template library with variable substitution (plan, renewal date, industry tokens).
   - A/B test harness on subject line, tone, CTA. Record variant sent + open/click/reply rate.
   - Open and click tracking on outbound email AND LinkedIn messages (webhook or polling — document the mechanism).

9. **LinkedIn integration**
   - Connect LinkedIn mailbox for open/click/reply tracking on messages.
   - Log connections sent / accepted / messaged / posted as activities with source = LinkedIn.
   - Weekly content posting target counter (2 original articles + 2 shared + 2 shorts = 6/week/rep).

10. **Referrals & partners**
    - `ReferralPartner` entity (financial advisors, CPAs, HR consultants, attorneys, payroll companies).
    - Track referrals requested vs received per rep per quarter (target: 5/rep/quarter floor; 10/rep/month display target).
    - Link referred leads back to the source partner for attribution.

11. **Outside Advisor network**
    - `OutsideAdvisor` entity separate from internal reps.
    - Track Leads MTD / YTD and Sales Closed YTD per advisor.
    - Outside Advisor Production report must render their rows (template deck shows ~17 slots/month).

12. **Community outreach & events**
    - `CommunityEvent` entity: church partnerships (2x/month cadence), hydration booths, Chamber/BNI/SBDC, health fairs, co-sponsored events.
    - On-site contact capture form that feeds directly into CRM with `lead_source = Community`.

13. **Products**
    - Health Insurance and Medical Cost Sharing as first-class product types on deals.
    - Room for a future non-MCS carrier contract product (must not require schema migration to add).

14. **Prospect enrichment**
    - sunbiz.org lookup helper for Florida business registration by zip (MVP: manual search with prefilled URL; stretch: scraped enrichment queued as a background job).

15. **Quarterly milestone tracking**
    - Q1 Foundation → Q2 Acceleration → Q3 Pre-OE Ramp → Q4 OE Execution.
    - Actual vs target dashboard; forecast scenarios (Conservative / Moderate / Aggressive) with editable avg revenue/sale inputs.

### B. Sales Reports & Dashboards 2026 workbook — build every report

The deck is a 103-slide monthly workbook. You must deliver these as live, filterable CRM reports (no manual fill-in — data flows from the CRM).

**Four annual overview dashboards** (auto-aggregate from monthly data):
1. Annual Lead Trend (line, Team Total, 12 months)
2. Annual Revenue Trend (bar, per rep)
3. Annual Lead Source Distribution (pie + YTD table with Conv. %)
4. Annual Conversion Rates by Rep (bar + YTD table)

**Seven monthly reports × 12 months** (every metric must be a real query, not a placeholder):
1. Individual Performance Dashboard — columns: Leonardo | Tupac | Adam | Team Total. Metrics: Calls Made, Emails Sent, LinkedIn Messages, Presentations Given, Proposals Sent, Meetings Held, Closed Sales, Revenue ($), Close Rate %, Avg Deal Size, New CRM Leads Entered, Referrals Requested, Community Activities.
2. Leads: Inhouse vs Self-Generated — rows by source: LinkedIn, Networking, Referrals, Community, Reactivation, TOTAL Self-Gen, Inhouse (RR), GRAND TOTAL.
3. Lead Source Breakdown — pie + table with Conv. % column.
4. Revenue & Closed Sales — rows: Closed Sales (Month), Revenue (Month), Closed Sales (YTD), Revenue (YTD), Avg Deal Size.
5. Conversion Rates — rows: Leads Received, Inhouse Closed, Inhouse Conv. %, Self-Gen Leads, Self-Gen Closed, Self-Gen Conv. %, Overall Conv. %.
6. Activity Log Summary vs Targets — with the TARGET column baked in (see targets below).
7. Outside Advisor Production — Advisor Name | Leads (Month) | Closed (Month) | Leads YTD | Closed YTD.

**Formulas (implement exactly — no drift):**
- `Close Rate % = Closed Sales / Leads Received`
- `Avg Deal Size = Revenue / Closed Sales`
- `Inhouse Conv. % = Inhouse Closed / Inhouse Leads Received`
- `Self-Gen Conv. % = Self-Gen Closed / Self-Gen Leads`
- `Overall Conv. % = Total Closed / Total Leads`
- `TOTAL Self-Gen = LinkedIn + Networking + Referrals + Community + Reactivation`
- `GRAND TOTAL Leads = Self-Gen + Inhouse (RR)`
- YTD = running sum Jan → current month, scoped to org + fiscal year.

**Monthly per-rep activity targets (enforce in Activity Log Summary):**
- Outbound Calls 200+
- Emails Sent 150+
- LinkedIn Posts 24
- LinkedIn Connections Sent 40+
- Presentations / Meetings 10+
- Networking Events 4+
- Community Activities 4+
- Referrals Requested 10+
- CRM Leads Entered 30+

**Quarterly team targets (Q1 / Q2 / Q3 / Q4):**
- Leads: 250 / 400 / 500 / 700
- Sales Closed: 25 / 50 / 65 / 100
- LinkedIn follower delta: +150 / +200 / +250 / +300
- Referral partners: 5 / 10 / 15 / 20
- Community events: 3 / 6 / 8 / 10

**Filters every report must support:**
- By rep (individual and Team Total)
- By month and YTD
- By lead source
- By lead type (Inhouse vs Self-Generated)
- By outside advisor (on the Outside Advisor report)
- By date range (custom)

**Export:** every report must export to XLSX matching the deck's column layout so Leonardo can drop it straight into the workbook if needed. Stretch: PDF export of the annual overview.

## HOW TO WORK

1. **Use skills.** Before any response, check for relevant Superpowers skills. You WILL use:
   - `superpowers:brainstorming` before any creative or ambiguous design decision.
   - `superpowers:writing-plans` after brainstorming and before coding — produce a written, step-broken implementation plan.
   - `superpowers:test-driven-development` on every feature and bugfix. Red → Green → Refactor. No exceptions.
   - `superpowers:systematic-debugging` for every bug, test failure, or "it's not working."
   - `superpowers:verification-before-completion` before claiming anything is done. Run it, show the output.
   - `superpowers:requesting-code-review` before merging major features.
   - `superpowers:using-git-worktrees` for isolated feature branches.
   - `superpowers:dispatching-parallel-agents` when 2+ independent pieces of work are in flight.

2. **Plan before you type.** Start by reading both `.pptx` files end-to-end, then surveying the CRM codebase and sibling packages. Produce a phased plan (suggest: Foundations → Data Model → Automation → Reports → Integrations → Polish) with explicit milestones and acceptance criteria per phase. Share the plan before writing code.

3. **Database changes use migrations.** Any new entity, column, enum, or index is a Supabase migration committed to `packages/database`. Regenerate types. No ad-hoc table edits.

4. **Services first, UI second.** New business logic lives in `@mpbhealth/crm-core` service factories with unit tests. Pages just consume services through `CRMServiceContext`. Never embed business logic in components.

5. **TanStack Query keys are org-scoped.** Follow the existing `crmQueryKeys` pattern. Invalidate precisely. Do not regress the current 45s stale / 5m cache setup without a reason.

6. **RBAC on every new page and mutation.** Wrap pages in `PermissionGate`. Add new permission strings to the auth package and document them.

7. **Realtime safely.** If you add new Supabase Realtime subscriptions, debounce invalidations the same way existing code does. Do not introduce sync storms.

8. **No mocked data in tests that touch the DB.** Integration tests hit a real Supabase test project. Unit tests mock only at the service boundary.

9. **Evidence, not vibes.** Every "done" claim must be backed by: passing `pnpm --filter crm test`, passing `pnpm --filter crm build`, a Playwright run for UI changes, and a screenshot or console capture for visual work. If you cannot run something, say so explicitly — do not guess.

10. **No scope creep, no half-done features.** Ship vertical slices. Small PRs. Each PR must be independently mergeable and leave the app in a working state. No TODOs left behind, no dead code, no commented-out blocks.

11. **Security posture.** Respect the Vite secret guards. No secrets in client bundles. No bypassing RLS. Validate at system boundaries (form input, webhooks, API).

12. **Windows shell is Unix-flavored bash here.** Use forward slashes and `/dev/null`. Quote paths with spaces.

## DELIVERABLES

1. A written, phased implementation plan saved to `apps/crm/docs/UPGRADE-PLAN-2026.md`.
2. Supabase migrations for every schema change, with generated types committed.
3. Service-layer code + unit tests in `@mpbhealth/crm-core`.
4. UI pages, widgets, and reports in `apps/crm/src`, behind permission gates, with Playwright smoke coverage on the critical paths (lead intake → round-robin → 24h SLA task → cadence → win → revenue report).
5. Working versions of every report listed in Section B with correct formulas, filters, and XLSX export.
6. A `CHANGELOG-2026.md` summarizing what shipped per phase.
7. A demo script Leonardo can follow to verify the system end-to-end.

## ACCEPTANCE CRITERIA

- A new inbound lead is auto-assigned via round-robin, gets a 24-hour Initial Contact task, and escalates correctly if uncontacted.
- Every lead always has an active next-action task until Won/Lost; the UI will not let you delete the last one without picking a replacement.
- Reactivation sub-pipeline can segment and run a 4-week drip end-to-end.
- All seven monthly reports render correct numbers when seeded with synthetic activity for Leonardo, Tupac, and Adam across multiple lead sources.
- Annual overview dashboards auto-aggregate from the monthly data with zero manual entry.
- XLSX export of any report opens cleanly in Excel with the exact column headers from the deck.
- Activity targets show progress bars vs the monthly targets in Section B and turn red when behind pace.
- Quarterly team target dashboard shows actual vs target for Q1–Q4.
- RBAC prevents a regular rep from seeing another rep's individual dashboard unless they also hold the Lead Manager role.
- `pnpm --filter crm build` and `pnpm --filter crm test` both pass on a clean checkout.
- Playwright e2e suite covers: lead intake → assignment → SLA task → cadence → close → revenue report.

## START HERE

1. Unzip both `.pptx` files and read every slide's text. Confirm you can cite specific slide numbers.
2. Open the CRM project and map what already exists vs what Section A and Section B require. Produce a concrete gap list.
3. Invoke `superpowers:brainstorming` to pressure-test the gap list with me before planning.
4. Invoke `superpowers:writing-plans` and save the phased plan to `apps/crm/docs/UPGRADE-PLAN-2026.md`.
5. Stop and ask me to review the plan before writing a single line of implementation code.

Do not skip step 5.

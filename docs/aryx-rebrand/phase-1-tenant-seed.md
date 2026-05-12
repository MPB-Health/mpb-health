# Phase 1 — Seed MPB as a Fully Provisioned Tenant

**Status:** Draft for review. Depends on Phase 0.A completing successfully.
**Target deploy window:** Wednesday 2026-05-20 10:00 ET (mid-soak; safe because no app code reads these tables yet).
**Authoring date:** 2026-05-12.
**Last revised:** 2026-05-12 — after prod inspection revealed `subscription_plans`, `organization_subscriptions`, `usage_records`, `billing_events`, and `champion_settings` are MISSING from prod despite the champion_billing/champion_settings migrations being marked applied in `supabase_migrations.schema_migrations`. Tracked as separate tech-debt; Phase 1 works around it.

---

## 1. Goal

After Phase 0.A unifies the org tables, mpb health's row in `public.organizations` will have the canonical UUID `00000000-0000-4000-a000-000000000001`. But the **white-label configuration** and **module licenses** that the ARYX platform reads from at runtime are still empty for mpb.

Phase 1 fills those tables with values that reproduce mpb's current visual brand and grants mpb access to every module. **No application code reads these tables yet** — that's Phase 2 — so seeding them today changes nothing visible to mpb users. The point is to have the data ready when Phase 2 wires the `WhiteLabelProvider` and `ModuleGate` into portals.

If Phase 2 is later activated and reads working values out of these rows, mpb sees identical UI to today. That's the safety guarantee.

---

## 2. What gets written

### 2.1 `white_label_configs` — mpb's brand row

Per the brand audit, four of five portal apps (crm, admin-portal, advisor-portal, staff-hub) use the same mpb palette. Concierge uses a different teal palette and is treated as a sub-brand — see §6.

| Column | Value | Source |
|---|---|---|
| `org_id` | `00000000-0000-4000-a000-000000000001` | mpb's canonical UUID after Phase 0.A |
| `company_name` | `MPB Health` | brand identity |
| `primary_color` | `#0A4E8E` | mpb navy — every app's `primary.600/800` |
| `secondary_color` | `#0C71C3` | mpb blue-light — every app's `primary.500/brand.blue-light` |
| `accent_color` | `#A4CC43` | mpb green — every app's `brand.green` |
| `background_color` | `#FFFFFF` | white |
| `text_color` | `#0E2D41` | mpb navy text — every app's `brand.navy` |
| `header_color` | `#0A4E8E` | matches primary |
| `sidebar_color` | `#FFFFFF` | apps use white sidebars |
| `font_family` | `Inter` | shared tailwind config `font-sans` |
| `heading_font_family` | `Inter` | mpb does not use a separate heading font |
| `logo_url` | `https://mpb.health/assets/MPB-Health-No-background.png?v=2` | confirmed canonical CDN URL from `apps/admin-portal/src/pages/SeoMetadata.tsx:27` |
| `logo_dark_url` | same as logo_url | mpb does not have a dark-mode logo variant |
| `favicon_url` | `https://mpb.health/favicon.ico` | standard path |
| `meta_title` | `MPB Health` | brand identity |
| `meta_description` | `Affordable Health Sharing for Families & Individuals` | from website `<title>` (per brand audit) |
| `og_image_url` | `https://mpb.health/assets/MPB-Health-No-background.png?v=2` | same as logo |
| `support_email` | `support@mpb.health` | conventional |
| `support_url` | `https://mpb.health/support` | conventional |
| `terms_url` | `https://mpb.health/terms` | conventional |
| `privacy_url` | `https://mpb.health/privacy` | conventional |
| `custom_domain` | NULL | not needed — mpb owns the platform |
| `show_powered_by` | `false` | mpb is the platform owner, not a white-label customer |
| `custom_login_page` | `true` | mpb has its own login UI |
| `custom_email_templates` | `true` | will be re-evaluated as Phase 2 progresses |
| `is_active` | `true` | |

### 2.2 ~~`organization_subscriptions` row~~ → `org_feature_overrides` rows

**Revision note:** prod is missing the `subscription_plans` and `organization_subscriptions` tables (see status note at top). Instead of seeding a subscription, Phase 1 force-enables every plan-tier-gated feature that mpb (as platform owner) should have via `org_feature_overrides`. The table exists in prod and is the documented escape hatch per the `org_has_feature()` resolution order (override → module access → plan tier → default).

Features to override-enable for mpb (`enabled = true`, `reason = 'platform owner — Phase 1 seed 2026-05-20'`):

| Feature slug | Min plan tier in seed |
|---|---|
| `crm.studio` | professional |
| `crm.email_sequences` | professional |
| `crm.ai_insights` | business |
| `crm.forecasting` | professional |
| `crm.cpq` | business |
| `advisor.ai_assistant` | professional |
| `itsts.ai_replies` | professional |
| `orbit.automation` | professional |
| `mobile.custom_domain` | business |
| `platform.api_access` | business |
| `platform.sso` | enterprise |
| `platform.audit_logs` | professional |
| `platform.white_label_branding` | enterprise |

(Features without a `min_plan_tier` and with `enabled_by_default = true` need no override — they're already on for mpb.)

If/when the missing subscription tables are restored, the override rows remain valid but redundant (override takes precedence). They can be revoked once a proper enterprise subscription row exists.

### 2.3 `org_module_licenses` — all 8 modules granted to mpb

mpb as platform owner gets every module. The seed migration created 8 modules; phase 1 writes 8 license rows.

| `module_slug` | `license_source` | `status` | Reason |
|---|---|---|---|
| `crm` | `core_included` | `active` | core, included |
| `admin-command-center` | `core_included` | `active` | core, included |
| `advisor-portal` | `core_included` | `active` | core, included |
| `champion-ems` | `custom` | `active` | addon, mpb owns it |
| `itsts` | `custom` | `active` | addon, mpb owns it |
| `orbit` | `custom` | `active` | addon, mpb owns it |
| `white-label-mobile` | `custom` | `active` | addon, mpb owns it |
| `app-admin` | `custom` | `active` | addon, mpb owns it |

`notes` field on each: `'Platform owner — all modules included (Phase 1 seed 2026-05-20)'`

All rows use the helper function `activate_module_for_org(p_org_id, p_module_slug, p_license_source)` — which is `ON CONFLICT (org_id, module_id) DO UPDATE`, so the migration is naturally idempotent.

---

## 3. Bonus schema hardening (still safe to ship in Phase 1)

The audit of `20260415100002_white_label_configs.sql` and `20260415000000_module_licensing.sql` revealed that three tables have `org_id UUID NOT NULL` columns but no FK constraint to `organizations(id)`:

- `white_label_configs.org_id`
- `org_module_licenses.org_id`
- `org_feature_overrides.org_id`
- `white_label_email_templates.org_id`

This is a schema defect — orphan rows could be inserted. Phase 1 adds these FKs because we're already touching these tables.

We use `NOT VALID` + `VALIDATE CONSTRAINT` so existing rows aren't re-scanned during the brief lock. After Phase 1 seeds the data, validation runs (instant on these tiny tables).

---

## 4. Concurrency and rollback

Phase 1 is **fully reversible** — every write is a row insert with a stable WHERE clause for deletion. No schema mutations on hot tables, no PK changes, no FK retargets.

**Rollback path** (file 07): `DELETE FROM ... WHERE org_id = '00000000-0000-4000-a000-000000000001'` for each of the four tables, drop the added FK constraints.

The migration runs in a single transaction. If any step fails, the transaction rolls back and prod is unaffected.

---

## 5. Deploy sequencing

1. **Phase 0.A** ships Sunday 2026-05-17 06:00 ET.
2. Wait at least 48 hours; confirm no anomalies in Vercel/Supabase logs.
3. **Phase 1** ships Wednesday 2026-05-20 10:00 ET (mid-week, mid-soak; safe because no code path reads these tables yet, so even an unnoticed bug here can't break the portals).
4. **Phase 0.B** ships Sunday 2026-05-24 06:00 ET.
5. **Phase 2** (code activation: wire WhiteLabelProvider, strip hardcoded palettes, mount ModuleGate) drafted separately — runs after 0.B.

---

## 6. The concierge sub-brand caveat (Phase 2 design question)

`apps/concierge-portal/tailwind.config.js` uses a distinct teal palette (`#4A7C8A`, `#2F3E2F`, `#5B6B2E`, `#8B9B3A`, `#A8B8AC`) — not mpb's blue. Concierge is a member-facing portal with a different brand presence from the staff-facing portals (crm/admin/advisor/staff-hub).

`white_label_configs` is **one row per org**. If Phase 2 has every portal read mpb's row, concierge would suddenly switch to mpb blue. Three options:

- **A.** Keep concierge hard-coded teal — it never reads white_label_configs. Treat as a sub-brand within mpb's tenancy. **Recommended for v1** — minimal code change, preserves current UX.
- **B.** Extend the schema with a per-portal theme override (e.g., `concierge_brand_config jsonb` column on `white_label_configs`, or a new `org_portal_themes` table keyed by `(org_id, portal_slug)`). More flexible, harder to design correctly.
- **C.** Force concierge to mpb blue in Phase 2. Probably wrong — mpb staff have an intentional visual distinction between member-facing and staff-facing UI.

**Decision needed before Phase 2 drafting**, not before Phase 1 deployment. Phase 1 just seeds mpb's brand row using the dominant staff-portal palette; concierge isn't affected by anything in Phase 1.

---

## 7. Open question for the user

The only Phase-1-specific question: **the `meta_description`, `support_email`, `support_url`, `terms_url`, `privacy_url`** values listed in §2.1 are conventional guesses. Confirm or correct before deploy.

If `support@mpb.health` and `https://mpb.health/terms` are not the canonical values, tell me and I'll patch the migration. Otherwise the spec is ready for SQL.

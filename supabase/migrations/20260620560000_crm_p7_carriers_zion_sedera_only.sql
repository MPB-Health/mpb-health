-- ============================================================================
-- CRM rebuild — Carrier list narrowed to Zion + Sedera (2026-05-15)
-- ============================================================================
-- Spec source (chat 2026-05-15):
--   "When adding a new lead, under Carrier, remove all insurance companies
--    and only list Zion and Sedera."
--
-- The Add-Lead form (apps/crm/src/components/LeadForm.tsx) populates its
-- Carrier select from `carrierService.getCarriers({ is_active: true })`,
-- which queries `public.insurance_carriers`. Global rows live with
-- `org_id IS NULL` and are visible to every org via the
-- `insurance_carriers_global_select` policy seeded in
-- `20260327000001_crm_domain_backfill.sql`.
--
-- This migration:
--   1) Deactivates every global carrier (`org_id IS NULL`) whose slug is
--      not in {'sedera', 'zion-health'}. Per-org carriers (org_id NOT NULL)
--      are left untouched so admins who added their own rows keep them.
--   2) Ensures Sedera + Zion Health exist as active global rows (re-asserts
--      the seed in case they were renamed or deactivated in prior envs).
--   3) Re-orders both to sit at the top of the picker.
--
-- Reversal: flip `is_active = true` on the deactivated rows. Their data
-- isn't deleted, so admins can re-enable any carrier from Settings →
-- Insurance Carriers (or via a SQL update) without re-seeding.
-- ============================================================================

BEGIN;

-- 1. Deactivate every non-Zion/non-Sedera global carrier.
UPDATE public.insurance_carriers
   SET is_active = false,
       updated_at = now()
 WHERE org_id IS NULL
   AND slug NOT IN ('sedera', 'zion-health');

-- 2. Re-assert Sedera + Zion Health as active global rows. This handles
--    fresh envs that haven't run the original seed yet, plus envs where
--    a previous admin flipped them off. The table's unique constraint is
--    (org_id, name); Postgres treats NULL org_ids as distinct so a naive
--    `ON CONFLICT` won't deduplicate across runs. Use an UPDATE-then-INSERT
--    pattern keyed on slug (which is the stable identifier in our seeds).

UPDATE public.insurance_carriers
   SET is_active = true,
       sort_order = 1,
       carrier_type = 'healthshare',
       name = 'Sedera',
       updated_at = now()
 WHERE org_id IS NULL AND slug = 'sedera';

INSERT INTO public.insurance_carriers (org_id, name, slug, carrier_type, sort_order, is_active)
SELECT NULL, 'Sedera', 'sedera', 'healthshare', 1, true
 WHERE NOT EXISTS (
     SELECT 1 FROM public.insurance_carriers
      WHERE org_id IS NULL AND slug = 'sedera'
 );

UPDATE public.insurance_carriers
   SET is_active = true,
       sort_order = 2,
       carrier_type = 'healthshare',
       name = 'Zion Health',
       updated_at = now()
 WHERE org_id IS NULL AND slug = 'zion-health';

INSERT INTO public.insurance_carriers (org_id, name, slug, carrier_type, sort_order, is_active)
SELECT NULL, 'Zion Health', 'zion-health', 'healthshare', 2, true
 WHERE NOT EXISTS (
     SELECT 1 FROM public.insurance_carriers
      WHERE org_id IS NULL AND slug = 'zion-health'
 );

COMMIT;

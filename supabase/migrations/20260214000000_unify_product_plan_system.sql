-- ============================================================================
-- Migration: Unify Product/Plan System
-- Description: Extend plans table to be single source of truth for both
--              website display and CRM product management. Seed all pricing
--              data from hardcoded JSON/TS into plan_pricing table.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION A: EXTEND PLANS TABLE WITH CRM + PRICING FIELDS
-- ============================================================================

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS enrollment_fee numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_membership_fee numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tobacco_surcharge_pct numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS enroll_url text,
  ADD COLUMN IF NOT EXISTS cost_basis numeric(10,2),
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS external_product_id text;

-- ============================================================================
-- SECTION B: UPDATE EXISTING PLANS WITH ENROLLMENT URLS AND PRICING META
-- ============================================================================

-- Essentials
UPDATE public.plans SET
  enroll_url = 'https://essentials.enrollmpb.com/',
  enrollment_fee = 25,
  annual_membership_fee = 0,
  tobacco_surcharge_pct = 0,
  external_product_id = '42463'
WHERE slug = 'essentials';

-- MEC+ Essentials
UPDATE public.plans SET
  enroll_url = 'https://mec.enrollmpb.com/',
  enrollment_fee = 100,
  annual_membership_fee = 25,
  tobacco_surcharge_pct = 0,
  external_product_id = '45388'
WHERE slug = 'mec-essentials';

-- Care Plus
UPDATE public.plans SET
  enroll_url = 'https://careplus.enrollmpb.com/',
  enrollment_fee = 0,
  annual_membership_fee = 25,
  tobacco_surcharge_pct = 50,
  external_product_id = '42464'
WHERE slug = 'care-plus';

-- Direct
UPDATE public.plans SET
  enroll_url = 'https://direct.enrollmpb.com/',
  enrollment_fee = 100,
  annual_membership_fee = 25,
  tobacco_surcharge_pct = 50,
  external_product_id = '42465'
WHERE slug = 'direct';

-- Secure HSA
UPDATE public.plans SET
  enroll_url = 'https://securehsa.enrollmpb.com/',
  enrollment_fee = 100,
  annual_membership_fee = 25,
  tobacco_surcharge_pct = 50,
  external_product_id = '45800'
WHERE slug = 'secure-hsa';

-- ============================================================================
-- SECTION C: SEED PLAN PRICING — FLAT RATE PLANS (2026-01-01)
-- ============================================================================

-- Clear existing pricing for re-seed (idempotent)
DELETE FROM public.plan_pricing
WHERE plan_id IN (SELECT id FROM public.plans WHERE slug IN ('essentials', 'mec-essentials', 'care-plus', 'direct', 'secure-hsa'))
  AND effective_date IN ('2025-01-01'::date, '2026-01-01'::date);

-- Essentials (flat rate, all ages)
INSERT INTO public.plan_pricing (plan_id, age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
SELECT p.id, v.age_min, v.age_max, v.member_type, v.iua_amount, v.monthly_contribution, v.effective_date
FROM public.plans p
CROSS JOIN (VALUES
  (18, 64, 'individual', NULL::numeric, 49.95, '2026-01-01'::date),
  (18, 64, 'couple',     NULL, 59.95, '2026-01-01'),
  (18, 64, 'family',     NULL, 69.95, '2026-01-01')
) AS v(age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
WHERE p.slug = 'essentials';

-- MEC+ Essentials (flat rate, all ages)
INSERT INTO public.plan_pricing (plan_id, age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
SELECT p.id, v.age_min, v.age_max, v.member_type, v.iua_amount, v.monthly_contribution, v.effective_date
FROM public.plans p
CROSS JOIN (VALUES
  (18, 64, 'individual',    NULL::numeric, 125.00, '2026-01-01'::date),
  (18, 64, 'couple',        NULL, 160.00, '2026-01-01'),
  (18, 64, 'family',        NULL, 195.00, '2026-01-01'),
  (18, 64, 'member_child',  NULL, 160.00, '2026-01-01')
) AS v(age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
WHERE p.slug = 'mec-essentials';

-- ============================================================================
-- SECTION D: SEED PLAN PRICING — CARE PLUS (IUA-based, 2026-01-01)
-- ============================================================================

INSERT INTO public.plan_pricing (plan_id, age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
SELECT p.id, v.age_min, v.age_max, v.member_type, v.iua_amount, v.monthly_contribution, v.effective_date
FROM public.plans p
CROSS JOIN (VALUES
  -- $1,250 IUA
  (18, 29, 'individual', 1250::numeric, 268.00, '2026-01-01'::date),
  (30, 49, 'individual', 1250, 298.00, '2026-01-01'),
  (50, 64, 'individual', 1250, 381.00, '2026-01-01'),
  (18, 29, 'couple',     1250, 467.00, '2026-01-01'),
  (30, 49, 'couple',     1250, 494.00, '2026-01-01'),
  (50, 64, 'couple',     1250, 668.00, '2026-01-01'),
  (18, 29, 'member_child', 1250, 467.00, '2026-01-01'),
  (30, 49, 'member_child', 1250, 494.00, '2026-01-01'),
  (50, 64, 'member_child', 1250, 668.00, '2026-01-01'),
  (18, 29, 'family',     1250, 702.00, '2026-01-01'),
  (30, 49, 'family',     1250, 713.00, '2026-01-01'),
  (50, 64, 'family',     1250, 947.00, '2026-01-01'),
  -- $2,500 IUA
  (18, 29, 'individual', 2500, 203.00, '2026-01-01'),
  (30, 49, 'individual', 2500, 216.00, '2026-01-01'),
  (50, 64, 'individual', 2500, 318.00, '2026-01-01'),
  (18, 29, 'couple',     2500, 344.00, '2026-01-01'),
  (30, 49, 'couple',     2500, 387.00, '2026-01-01'),
  (50, 64, 'couple',     2500, 537.00, '2026-01-01'),
  (18, 29, 'member_child', 2500, 344.00, '2026-01-01'),
  (30, 49, 'member_child', 2500, 387.00, '2026-01-01'),
  (50, 64, 'member_child', 2500, 537.00, '2026-01-01'),
  (18, 29, 'family',     2500, 563.00, '2026-01-01'),
  (30, 49, 'family',     2500, 575.00, '2026-01-01'),
  (50, 64, 'family',     2500, 748.00, '2026-01-01'),
  -- $5,000 IUA
  (18, 29, 'individual', 5000, 166.00, '2026-01-01'),
  (30, 49, 'individual', 5000, 193.00, '2026-01-01'),
  (50, 64, 'individual', 5000, 247.00, '2026-01-01'),
  (18, 29, 'couple',     5000, 284.00, '2026-01-01'),
  (30, 49, 'couple',     5000, 341.00, '2026-01-01'),
  (50, 64, 'couple',     5000, 442.00, '2026-01-01'),
  (18, 29, 'member_child', 5000, 284.00, '2026-01-01'),
  (30, 49, 'member_child', 5000, 341.00, '2026-01-01'),
  (50, 64, 'member_child', 5000, 442.00, '2026-01-01'),
  (18, 29, 'family',     5000, 445.00, '2026-01-01'),
  (30, 49, 'family',     5000, 503.00, '2026-01-01'),
  (50, 64, 'family',     5000, 647.00, '2026-01-01')
) AS v(age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
WHERE p.slug = 'care-plus';

-- ============================================================================
-- SECTION E: SEED PLAN PRICING — DIRECT (IUA-based, 2026-01-01)
-- ============================================================================

INSERT INTO public.plan_pricing (plan_id, age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
SELECT p.id, v.age_min, v.age_max, v.member_type, v.iua_amount, v.monthly_contribution, v.effective_date
FROM public.plans p
CROSS JOIN (VALUES
  -- $1,250 IUA
  (18, 29, 'individual', 1250::numeric, 295.00, '2026-01-01'::date),
  (30, 49, 'individual', 1250, 321.00, '2026-01-01'),
  (50, 64, 'individual', 1250, 415.00, '2026-01-01'),
  (18, 29, 'couple',     1250, 504.00, '2026-01-01'),
  (30, 49, 'couple',     1250, 540.00, '2026-01-01'),
  (50, 64, 'couple',     1250, 698.00, '2026-01-01'),
  (18, 29, 'member_child', 1250, 504.00, '2026-01-01'),
  (30, 49, 'member_child', 1250, 540.00, '2026-01-01'),
  (50, 64, 'member_child', 1250, 698.00, '2026-01-01'),
  (18, 29, 'family',     1250, 762.00, '2026-01-01'),
  (30, 49, 'family',     1250, 773.00, '2026-01-01'),
  (50, 64, 'family',     1250, 1006.00, '2026-01-01'),
  -- $2,500 IUA
  (18, 29, 'individual', 2500, 229.00, '2026-01-01'),
  (30, 49, 'individual', 2500, 280.00, '2026-01-01'),
  (50, 64, 'individual', 2500, 353.00, '2026-01-01'),
  (18, 29, 'couple',     2500, 390.00, '2026-01-01'),
  (30, 49, 'couple',     2500, 490.00, '2026-01-01'),
  (50, 64, 'couple',     2500, 580.00, '2026-01-01'),
  (18, 29, 'member_child', 2500, 390.00, '2026-01-01'),
  (30, 49, 'member_child', 2500, 490.00, '2026-01-01'),
  (50, 64, 'member_child', 2500, 580.00, '2026-01-01'),
  (18, 29, 'family',     2500, 623.00, '2026-01-01'),
  (30, 49, 'family',     2500, 700.00, '2026-01-01'),
  (50, 64, 'family',     2500, 855.00, '2026-01-01'),
  -- $5,000 IUA
  (18, 29, 'individual', 5000, 201.00, '2026-01-01'),
  (30, 49, 'individual', 5000, 250.00, '2026-01-01'),
  (50, 64, 'individual', 5000, 282.00, '2026-01-01'),
  (18, 29, 'couple',     5000, 325.00, '2026-01-01'),
  (30, 49, 'couple',     5000, 415.00, '2026-01-01'),
  (50, 64, 'couple',     5000, 480.00, '2026-01-01'),
  (18, 29, 'member_child', 5000, 325.00, '2026-01-01'),
  (30, 49, 'member_child', 5000, 415.00, '2026-01-01'),
  (50, 64, 'member_child', 5000, 480.00, '2026-01-01'),
  (18, 29, 'family',     5000, 505.00, '2026-01-01'),
  (30, 49, 'family',     5000, 630.00, '2026-01-01'),
  (50, 64, 'family',     5000, 707.00, '2026-01-01')
) AS v(age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
WHERE p.slug = 'direct';

-- ============================================================================
-- SECTION F: SEED PLAN PRICING — SECURE HSA (IUA-based, 2026-01-01)
-- ============================================================================

INSERT INTO public.plan_pricing (plan_id, age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
SELECT p.id, v.age_min, v.age_max, v.member_type, v.iua_amount, v.monthly_contribution, v.effective_date
FROM public.plans p
CROSS JOIN (VALUES
  -- $1,250 IUA
  (18, 29, 'individual', 1250::numeric, 326.00, '2026-01-01'::date),
  (30, 49, 'individual', 1250, 359.00, '2026-01-01'),
  (50, 64, 'individual', 1250, 448.00, '2026-01-01'),
  (18, 29, 'couple',     1250, 576.00, '2026-01-01'),
  (30, 49, 'couple',     1250, 603.00, '2026-01-01'),
  (50, 64, 'couple',     1250, 774.00, '2026-01-01'),
  (18, 29, 'member_child', 1250, 576.00, '2026-01-01'),
  (30, 49, 'member_child', 1250, 603.00, '2026-01-01'),
  (50, 64, 'member_child', 1250, 774.00, '2026-01-01'),
  (18, 29, 'family',     1250, 816.00, '2026-01-01'),
  (30, 49, 'family',     1250, 817.00, '2026-01-01'),
  (50, 64, 'family',     1250, 1070.00, '2026-01-01'),
  -- $2,500 IUA
  (18, 29, 'individual', 2500, 257.00, '2026-01-01'),
  (30, 49, 'individual', 2500, 289.00, '2026-01-01'),
  (50, 64, 'individual', 2500, 391.00, '2026-01-01'),
  (18, 29, 'couple',     2500, 448.00, '2026-01-01'),
  (30, 49, 'couple',     2500, 488.00, '2026-01-01'),
  (50, 64, 'couple',     2500, 646.00, '2026-01-01'),
  (18, 29, 'member_child', 2500, 448.00, '2026-01-01'),
  (30, 49, 'member_child', 2500, 488.00, '2026-01-01'),
  (50, 64, 'member_child', 2500, 646.00, '2026-01-01'),
  (18, 29, 'family',     2500, 642.00, '2026-01-01'),
  (30, 49, 'family',     2500, 679.00, '2026-01-01'),
  (50, 64, 'family',     2500, 852.00, '2026-01-01'),
  -- $5,000 IUA
  (18, 29, 'individual', 5000, 239.00, '2026-01-01'),
  (30, 49, 'individual', 5000, 266.00, '2026-01-01'),
  (50, 64, 'individual', 5000, 320.00, '2026-01-01'),
  (18, 29, 'couple',     5000, 393.00, '2026-01-01'),
  (30, 49, 'couple',     5000, 450.00, '2026-01-01'),
  (50, 64, 'couple',     5000, 551.00, '2026-01-01'),
  (18, 29, 'member_child', 5000, 393.00, '2026-01-01'),
  (30, 49, 'member_child', 5000, 450.00, '2026-01-01'),
  (50, 64, 'member_child', 5000, 551.00, '2026-01-01'),
  (18, 29, 'family',     5000, 564.00, '2026-01-01'),
  (30, 49, 'family',     5000, 598.00, '2026-01-01'),
  (50, 64, 'family',     5000, 753.00, '2026-01-01')
) AS v(age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
WHERE p.slug = 'secure-hsa';

-- ============================================================================
-- SECTION G: SEED HISTORICAL PRICING (2025-01-01)
-- ============================================================================

-- Care Plus 2025
INSERT INTO public.plan_pricing (plan_id, age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
SELECT p.id, v.age_min, v.age_max, v.member_type, v.iua_amount, v.monthly_contribution, v.effective_date
FROM public.plans p
CROSS JOIN (VALUES
  (18,29,'individual',1250::numeric,245.00,'2025-01-01'::date),(30,49,'individual',1250,273.00,'2025-01-01'),(50,64,'individual',1250,352.00,'2025-01-01'),
  (18,29,'couple',1250,430.00,'2025-01-01'),(30,49,'couple',1250,478.00,'2025-01-01'),(50,64,'couple',1250,615.00,'2025-01-01'),
  (18,29,'member_child',1250,370.00,'2025-01-01'),(30,49,'member_child',1250,408.00,'2025-01-01'),(50,64,'member_child',1250,527.00,'2025-01-01'),
  (18,29,'family',1250,615.00,'2025-01-01'),(30,49,'family',1250,673.00,'2025-01-01'),(50,64,'family',1250,867.00,'2025-01-01'),
  (18,29,'individual',2500,185.00,'2025-01-01'),(30,49,'individual',2500,205.00,'2025-01-01'),(50,64,'individual',2500,300.00,'2025-01-01'),
  (18,29,'couple',2500,324.00,'2025-01-01'),(30,49,'couple',2500,359.00,'2025-01-01'),(50,64,'couple',2500,525.00,'2025-01-01'),
  (18,29,'member_child',2500,280.00,'2025-01-01'),(30,49,'member_child',2500,308.00,'2025-01-01'),(50,64,'member_child',2500,450.00,'2025-01-01'),
  (18,29,'family',2500,465.00,'2025-01-01'),(30,49,'family',2500,508.00,'2025-01-01'),(50,64,'family',2500,740.00,'2025-01-01'),
  (18,29,'individual',5000,160.00,'2025-01-01'),(30,49,'individual',5000,185.00,'2025-01-01'),(50,64,'individual',5000,235.00,'2025-01-01'),
  (18,29,'couple',5000,280.00,'2025-01-01'),(30,49,'couple',5000,324.00,'2025-01-01'),(50,64,'couple',5000,411.00,'2025-01-01'),
  (18,29,'member_child',5000,242.00,'2025-01-01'),(30,49,'member_child',5000,278.00,'2025-01-01'),(50,64,'member_child',5000,352.00,'2025-01-01'),
  (18,29,'family',5000,402.00,'2025-01-01'),(30,49,'family',5000,458.00,'2025-01-01'),(50,64,'family',5000,580.00,'2025-01-01')
) AS v(age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
WHERE p.slug = 'care-plus';

-- Direct 2025
INSERT INTO public.plan_pricing (plan_id, age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
SELECT p.id, v.age_min, v.age_max, v.member_type, v.iua_amount, v.monthly_contribution, v.effective_date
FROM public.plans p
CROSS JOIN (VALUES
  (18,29,'individual',1250::numeric,295.00,'2025-01-01'::date),(30,49,'individual',1250,300.00,'2025-01-01'),(50,64,'individual',1250,386.00,'2025-01-01'),
  (18,29,'couple',1250,517.00,'2025-01-01'),(30,49,'couple',1250,525.00,'2025-01-01'),(50,64,'couple',1250,676.00,'2025-01-01'),
  (18,29,'member_child',1250,443.00,'2025-01-01'),(30,49,'member_child',1250,450.00,'2025-01-01'),(50,64,'member_child',1250,579.00,'2025-01-01'),
  (18,29,'family',1250,738.00,'2025-01-01'),(30,49,'family',1250,750.00,'2025-01-01'),(50,64,'family',1250,965.00,'2025-01-01'),
  (18,29,'individual',2500,230.00,'2025-01-01'),(30,49,'individual',2500,280.00,'2025-01-01'),(50,64,'individual',2500,350.00,'2025-01-01'),
  (18,29,'couple',2500,403.00,'2025-01-01'),(30,49,'couple',2500,490.00,'2025-01-01'),(50,64,'couple',2500,613.00,'2025-01-01'),
  (18,29,'member_child',2500,345.00,'2025-01-01'),(30,49,'member_child',2500,420.00,'2025-01-01'),(50,64,'member_child',2500,525.00,'2025-01-01'),
  (18,29,'family',2500,575.00,'2025-01-01'),(30,49,'family',2500,700.00,'2025-01-01'),(50,64,'family',2500,875.00,'2025-01-01'),
  (18,29,'individual',5000,190.00,'2025-01-01'),(30,49,'individual',5000,250.00,'2025-01-01'),(50,64,'individual',5000,275.00,'2025-01-01'),
  (18,29,'couple',5000,333.00,'2025-01-01'),(30,49,'couple',5000,438.00,'2025-01-01'),(50,64,'couple',5000,481.00,'2025-01-01'),
  (18,29,'member_child',5000,285.00,'2025-01-01'),(30,49,'member_child',5000,375.00,'2025-01-01'),(50,64,'member_child',5000,413.00,'2025-01-01'),
  (18,29,'family',5000,475.00,'2025-01-01'),(30,49,'family',5000,625.00,'2025-01-01'),(50,64,'family',5000,688.00,'2025-01-01')
) AS v(age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
WHERE p.slug = 'direct';

-- Secure HSA 2025
INSERT INTO public.plan_pricing (plan_id, age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
SELECT p.id, v.age_min, v.age_max, v.member_type, v.iua_amount, v.monthly_contribution, v.effective_date
FROM public.plans p
CROSS JOIN (VALUES
  (18,29,'individual',1250::numeric,309.00,'2025-01-01'::date),(30,49,'individual',1250,336.00,'2025-01-01'),(50,64,'individual',1250,419.00,'2025-01-01'),
  (18,29,'couple',1250,541.00,'2025-01-01'),(30,49,'couple',1250,588.00,'2025-01-01'),(50,64,'couple',1250,733.00,'2025-01-01'),
  (18,29,'member_child',1250,463.00,'2025-01-01'),(30,49,'member_child',1250,504.00,'2025-01-01'),(50,64,'member_child',1250,628.00,'2025-01-01'),
  (18,29,'family',1250,772.00,'2025-01-01'),(30,49,'family',1250,840.00,'2025-01-01'),(50,64,'family',1250,1047.00,'2025-01-01'),
  (18,29,'individual',2500,256.00,'2025-01-01'),(30,49,'individual',2500,276.00,'2025-01-01'),(50,64,'individual',2500,369.00,'2025-01-01'),
  (18,29,'couple',2500,448.00,'2025-01-01'),(30,49,'couple',2500,483.00,'2025-01-01'),(50,64,'couple',2500,646.00,'2025-01-01'),
  (18,29,'member_child',2500,384.00,'2025-01-01'),(30,49,'member_child',2500,414.00,'2025-01-01'),(50,64,'member_child',2500,554.00,'2025-01-01'),
  (18,29,'family',2500,640.00,'2025-01-01'),(30,49,'family',2500,690.00,'2025-01-01'),(50,64,'family',2500,923.00,'2025-01-01'),
  (18,29,'individual',5000,231.00,'2025-01-01'),(30,49,'individual',5000,256.00,'2025-01-01'),(50,64,'individual',5000,301.00,'2025-01-01'),
  (18,29,'couple',5000,404.00,'2025-01-01'),(30,49,'couple',5000,448.00,'2025-01-01'),(50,64,'couple',5000,527.00,'2025-01-01'),
  (18,29,'member_child',5000,347.00,'2025-01-01'),(30,49,'member_child',5000,384.00,'2025-01-01'),(50,64,'member_child',5000,451.00,'2025-01-01'),
  (18,29,'family',5000,578.00,'2025-01-01'),(30,49,'family',5000,640.00,'2025-01-01'),(50,64,'family',5000,752.00,'2025-01-01')
) AS v(age_min, age_max, member_type, iua_amount, monthly_contribution, effective_date)
WHERE p.slug = 'secure-hsa';

-- ============================================================================
-- SECTION H: ADD COMPOSITE INDEX FOR RATE LOOKUPS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_plan_pricing_rate_lookup
  ON public.plan_pricing (plan_id, effective_date, member_type, iua_amount);

-- ============================================================================
-- SECTION I: DATABASE FUNCTION FOR RATE LOOKUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_plan_rate(
  p_plan_slug text,
  p_age integer,
  p_member_type text,
  p_iua_amount numeric DEFAULT NULL,
  p_effective_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  plan_id uuid,
  plan_name text,
  monthly_contribution numeric,
  enrollment_fee numeric,
  annual_membership_fee numeric,
  tobacco_surcharge_pct numeric
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pl.id AS plan_id,
    pl.name AS plan_name,
    pp.monthly_contribution,
    pl.enrollment_fee,
    pl.annual_membership_fee,
    pl.tobacco_surcharge_pct
  FROM public.plans pl
  JOIN public.plan_pricing pp ON pp.plan_id = pl.id
  WHERE pl.slug = p_plan_slug
    AND pl.is_active = true
    AND pp.effective_date <= p_effective_date
    AND p_age >= pp.age_min
    AND p_age <= pp.age_max
    AND pp.member_type = p_member_type
    AND (p_iua_amount IS NULL AND pp.iua_amount IS NULL
         OR pp.iua_amount = p_iua_amount)
  ORDER BY pp.effective_date DESC
  LIMIT 1;
END;
$$;

-- ============================================================================
-- SECTION J: UPDATE RLS — allow authenticated CRM users to read all plans
-- ============================================================================

-- Add policy for authenticated users to read all plans (including inactive)
-- This is needed for CRM/Admin portal
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plans' AND policyname = 'Authenticated users can view all plans'
  ) THEN
    CREATE POLICY "Authenticated users can view all plans"
      ON public.plans FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plan_pricing' AND policyname = 'Authenticated users can view all plan pricing'
  ) THEN
    CREATE POLICY "Authenticated users can view all plan pricing"
      ON public.plan_pricing FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plan_features' AND policyname = 'Authenticated users can view all plan features'
  ) THEN
    CREATE POLICY "Authenticated users can view all plan features"
      ON public.plan_features FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plan_sharing_details' AND policyname = 'Authenticated users can view all sharing details'
  ) THEN
    CREATE POLICY "Authenticated users can view all sharing details"
      ON public.plan_sharing_details FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END$$;

-- ============================================================================
-- SECTION K: UPDATED_AT TRIGGER FOR PLANS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_plans_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_plans_updated_at ON public.plans;
CREATE TRIGGER trigger_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_plans_updated_at();

COMMIT;

/*
  # Update Plan Pricing to Match October 2025 Price Sheet

  1. Purpose
    - Update plan_pricing table with correct 2026 pricing from official October 2025 price sheet
    - Ensures display prices on plan cards match the lowest rates (18-29, Member Only, $1,250 IUA)

  2. Pricing Updates (Individual Member, Ages 18-29, $1,250 IUA - Lowest Rates)
    - Care Plus: $268/month (corrected from $273)
    - Direct: $295/month (corrected from $300)
    - Secure HSA: $326/month (corrected from $336)
    - Essentials: $50/month (no change)
    - MEC+Essentials: $150/month (no change)

  3. Notes
    - These are display-only prices for plan cards showing "From $X/mo"
    - Actual pricing calculations use rate engine (rate_tables.config.v2.json)
    - Effective date: 2026-01-01 per official price sheet
    - Source: 2026-prices-Care-Direct-Secure-HSA.pdf (October 2025)

  4. Changes Made
    - Updated Care Plus from $273 to $268
    - Updated Direct from $300 to $295
    - Updated Secure HSA from $336 to $326
*/

-- Update Care Plus pricing to match PDF (18-29, Member Only, $1,250 IUA)
UPDATE plan_pricing
SET monthly_contribution = 268.00
WHERE plan_id IN (SELECT id FROM plans WHERE slug IN ('care-plus', 'careplus', 'care_plus'))
  AND member_type = 'individual'
  AND effective_date = '2026-01-01';

-- Update Direct pricing to match PDF (18-29, Member Only, $1,250 IUA)
UPDATE plan_pricing
SET monthly_contribution = 295.00
WHERE plan_id IN (SELECT id FROM plans WHERE slug = 'direct')
  AND member_type = 'individual'
  AND effective_date = '2026-01-01';

-- Update Secure HSA pricing to match PDF (18-29, Member Only, $1,250 IUA)
UPDATE plan_pricing
SET monthly_contribution = 326.00
WHERE plan_id IN (SELECT id FROM plans WHERE slug IN ('secure-hsa', 'securehsa', 'secure_hsa'))
  AND member_type = 'individual'
  AND effective_date = '2026-01-01';

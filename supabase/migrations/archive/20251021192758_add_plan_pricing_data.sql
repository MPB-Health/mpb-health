/*
  # Add Plan Pricing Data for 2026

  1. Purpose
    - Populate plan_pricing table with updated 2026 pricing
    - Ensures pricing displays correctly across the website
  
  2. Pricing Updates
    - Essentials: $50/month (individual base price)
    - Care+: $273/month (individual base price)
    - Direct: $300/month (individual base price)
    - Secure HSA: $336/month (individual base price)
  
  3. Notes
    - Prices are for individual members (member_type='individual')
    - Age range 0-99 covers all ages
    - Effective date set to 2026-01-01 for new pricing
*/

-- Insert pricing for Essentials plan
INSERT INTO plan_pricing (plan_id, age_min, age_max, member_type, monthly_contribution, effective_date)
SELECT 
  id,
  0,
  99,
  'individual',
  50.00,
  '2026-01-01'
FROM plans
WHERE slug = 'essentials'
ON CONFLICT DO NOTHING;

-- Insert pricing for Care Plus plan
INSERT INTO plan_pricing (plan_id, age_min, age_max, member_type, monthly_contribution, effective_date)
SELECT 
  id,
  0,
  99,
  'individual',
  273.00,
  '2026-01-01'
FROM plans
WHERE slug = 'care-plus'
ON CONFLICT DO NOTHING;

-- Insert pricing for Direct plan
INSERT INTO plan_pricing (plan_id, age_min, age_max, member_type, monthly_contribution, effective_date)
SELECT 
  id,
  0,
  99,
  'individual',
  300.00,
  '2026-01-01'
FROM plans
WHERE slug = 'direct'
ON CONFLICT DO NOTHING;

-- Insert pricing for Secure HSA plan
INSERT INTO plan_pricing (plan_id, age_min, age_max, member_type, monthly_contribution, effective_date)
SELECT 
  id,
  0,
  99,
  'individual',
  336.00,
  '2026-01-01'
FROM plans
WHERE slug = 'secure-hsa'
ON CONFLICT DO NOTHING;

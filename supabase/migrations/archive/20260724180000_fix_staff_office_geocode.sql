-- Correct Greenhouse Offices geocode for 5301 N Federal Hwy Ste 155, Boca Raton, FL 33487.
-- Previous seed used approx Boca downtown coords (~3 km south), which caused false too_far punches.

UPDATE public.staff_office_locations
SET
  label = 'MPB Health — Greenhouse Offices',
  address_line = '5301 N Federal Hwy Ste 155',
  city = 'Boca Raton',
  state = 'FL',
  postal_code = '33487',
  latitude = 26.3958239,
  longitude = -80.0765474,
  radius_m = 150,
  max_accuracy_m = 100,
  accuracy_credit_cap_m = 50,
  updated_at = now()
WHERE is_active = true
  AND org_id = (SELECT id FROM public.organizations WHERE slug = 'mpb-health' LIMIT 1);

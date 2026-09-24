-- Plan comparison chart updates (Apr 2026 marketing / legal review)
-- Removes discontinued rows, consolidates MPB Concierge copy, and aligns preventive-care text.

DELETE FROM public.plan_features
WHERE
  feature_name ~* 'debt\s*dismissal|hospital\s*debt\s*relief'
  OR category IN ('Digital Health Tools', 'International Membership')
  OR category ILIKE 'International Coverage%'
  OR feature_name ~* 'international travel protection'
  OR feature_name ~* '^international coverage$'
  OR feature_name ~* '^annual mammogram(\s|$)'
  OR feature_name ~* 'qr\s*life\s*code|lifecode|medical records vault';

DELETE FROM public.plan_features pf
WHERE pf.id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY plan_id, lower(trim(feature_name))
        ORDER BY sort_order NULLS LAST, id
      ) AS rn
    FROM public.plan_features
  ) d
  WHERE d.rn > 1
);

UPDATE public.plan_features
SET
  feature_name = 'MPB Concierge Services',
  feature_value = 'Membership support, appointment scheduling, help finding affordable care',
  cost = 'Included',
  notes = NULL
WHERE
  feature_name ~* '^mpb concierge'
  AND feature_name !~* '^mpb concierge services$';

UPDATE public.plan_features
SET
  feature_name = 'MPB Concierge Services',
  feature_value = 'Membership support, appointment scheduling, help finding affordable care',
  cost = 'Included',
  notes = NULL
WHERE feature_name = 'MPB Concierge Services';

UPDATE public.plan_features pf
SET notes = 'Satisfies Minimum Essential Coverage (MEC) requirements.'
FROM public.plans p
WHERE
  pf.plan_id = p.id
  AND p.slug = 'mec-essentials'
  AND pf.category = 'Minimum Essential Coverage'
  AND (pf.notes IS NULL OR btrim(pf.notes) = '');

UPDATE public.plan_features pf
SET
  feature_value = 'Routine bloodwork and labs',
  cost = 'Included',
  notes = NULL
FROM public.plans p
WHERE
  pf.plan_id = p.id
  AND p.slug = 'direct'
  AND pf.category = 'Preventive Care'
  AND pf.feature_name ~* 'adult preventive|preventive screenings';

UPDATE public.plan_features pf
SET
  cost = 'Limited',
  notes = 'Annual mammogram for members 40+',
  feature_value = COALESCE(
    NULLIF(trim(both ' ' FROM pf.feature_value), ''),
    'Women''s health screenings'
  )
FROM public.plans p
WHERE
  pf.plan_id = p.id
  AND p.slug = 'direct'
  AND pf.category = 'Preventive Care'
  AND pf.feature_name ~* 'women''s health|women';

UPDATE public.plan_features pf
SET feature_value = 'Breast cancer, cervical cancer, & DEXA scan'
FROM public.plans p
WHERE
  pf.plan_id = p.id
  AND p.slug IN ('mec-essentials', 'secure-hsa')
  AND pf.category = 'Preventive Care'
  AND pf.feature_name ~* 'women';

UPDATE public.plan_features
SET feature_value = regexp_replace(feature_value, '\s*[,;]?\s*osteoporosis[^.]*\.?', '', 'gi')
WHERE
  category = 'Preventive Care'
  AND feature_value ~* 'osteoporosis';

UPDATE public.plan_features pf
SET cost = '$0', notes = 'One annual provider visit per member'
FROM public.plans p
WHERE
  pf.plan_id = p.id
  AND pf.category = 'Preventive Care'
  AND pf.feature_name ~* 'annual'
  AND pf.feature_name ~* 'provider';

UPDATE public.plan_features pf
SET cost = 'Included $0', notes = NULL
FROM public.plans p
WHERE
  pf.plan_id = p.id
  AND pf.category = 'Preventive Care'
  AND pf.feature_name ~* 'youth immun';

UPDATE public.plan_features pf
SET
  feature_value = 'Adults 45–75',
  cost = COALESCE(NULLIF(trim(both ' ' FROM pf.cost), ''), 'Included $0')
FROM public.plans p
WHERE
  pf.plan_id = p.id
  AND pf.category = 'Preventive Care'
  AND pf.feature_name ~* 'colonoscopy';
;

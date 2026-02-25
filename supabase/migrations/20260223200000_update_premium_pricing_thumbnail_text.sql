-- ============================================================================
-- Migration: Update Premium Care and Premium HSA thumbnail text to June 1
-- Description: Changes "May Start" to "June 1 Start" in titles and metadata
-- ============================================================================

UPDATE public.sop_documents
SET title = 'Premium Care June 1 Start Date Pricing',
    description = 'Premium Care plan pricing for June 1 start dates with rates and coverage details.',
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{thumbnail_title}',
      '"Premium Care June 1 Start Date Pricing"'
    )
WHERE slug = 'premium-care-may-start-date-pricing';

UPDATE public.sop_documents
SET title = 'Premium HSA June 1 Start Date Pricing',
    description = 'Premium HSA plan pricing for June 1 start dates with rates and coverage details.',
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{thumbnail_title}',
      '"Premium HSA June 1 Start Date Pricing"'
    )
WHERE slug = 'premium-hsa-may-start-date-pricing';

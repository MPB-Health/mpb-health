-- ============================================================================
-- Migration: Update Advisor overview and Membership Overview - title and thumbnail position
-- Description: Updates existing records (INSERT only runs when NOT EXISTS)
-- ============================================================================

UPDATE public.sop_documents
SET
  title = 'Advisor Overview',
  description = 'Advisor Overview presentation for MPB Health.',
  content = 'Advisor Overview - MPB Health presentation.',
  metadata = COALESCE(metadata, '{}'::jsonb)
    || '{"thumbnail_title": "Advisor Overview", "image_position": "-8px center"}'::jsonb
WHERE slug = 'advisor-overview';
UPDATE public.sop_documents
SET metadata = COALESCE(metadata, '{}'::jsonb)
  || '{"image_position": "-8px center"}'::jsonb
WHERE slug = 'membership-overview-agent-resource';

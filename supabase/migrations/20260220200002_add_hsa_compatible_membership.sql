-- ============================================================================
-- Migration: Add HSA Compatible Membership to Reference Materials
-- Description: Inserts the HSA Compatible Membership PNG into Reference Materials
-- ============================================================================

INSERT INTO public.sop_documents (
  title,
  slug,
  description,
  category,
  tags,
  content,
  content_type,
  file_url,
  image_url,
  version,
  is_published,
  is_active,
  view_count,
  metadata
)
VALUES (
  'HSA Compatible Membership',
  'hsa-compatible-membership',
  'HSA Compatible Membership overview graphic for MPB Health plans.',
  'Reference Materials',
  ARRAY['hsa', 'reference materials', 'membership', 'compatible', 'hsa compatible'],
  'HSA Compatible Membership - MPB Health plan overview.',
  'image',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/MPB%20Health%20Graphic.png',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/hsa-compatible-membership-thumbnail.png',
  '1.0',
  true,
  true,
  0,
  '{"thumbnail_title": "HSA Compatible Membership"}'::jsonb
)
ON CONFLICT DO NOTHING;

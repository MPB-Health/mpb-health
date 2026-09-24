-- ============================================================================
-- Migration: Add Member-Facing HSA Compatibility Guide to Reference Materials
-- Description: Inserts the member-facing HSA compatibility PDF card with
--              thumbnail into sop_documents (advisor-portal Reference Materials).
-- Prereq: upload these files to the public advisor-documents bucket first:
--   - Member-Facing-HSA-Compatibility-Guide.pdf
--   - member-facing-hsa-compatibility-guide-thumbnail.png
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
SELECT
  'Member-Facing HSA Compatibility Guide',
  'member-facing-hsa-compatibility-guide',
  'Member-facing explanation of MPB Health HSA-compatible plan design under IRC §223.',
  'Reference Materials',
  ARRAY['hsa', 'reference materials', 'member-facing', 'compatibility', 'guide', 'pdf'],
  'Member-Facing HSA Compatibility Guide - MPB Health HSA-compatible explanation.',
  'pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Member-Facing-HSA-Compatibility-Guide.pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/member-facing-hsa-compatibility-guide-thumbnail.png',
  '1.0',
  true,
  true,
  0,
  '{"thumbnail_title": "Member-Facing HSA Compatibility Guide", "image_position": "center center"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.sop_documents WHERE slug = 'member-facing-hsa-compatibility-guide'
);

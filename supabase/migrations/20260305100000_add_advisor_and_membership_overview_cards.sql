-- ============================================================================
-- Migration: Add Advisor Overview and Membership Overview cards to Reference Materials
-- Description: Inserts 2 presentation cards with Supabase storage thumbnails
--              and PPTX popup support
-- ============================================================================

-- 1. Advisor Overview
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
  'Advisor Overview',
  'advisor-overview',
  'Advisor Overview presentation for MPB Health.',
  'Reference Materials',
  ARRAY['advisor', 'reference materials', 'overview', 'presentation'],
  'Advisor Overview - MPB Health presentation.',
  'presentation',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Advisor%20overview.pptx',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/advisor%20overview.jpg',
  '1.0',
  true,
  true,
  0,
  '{"thumbnail_title": "Advisor Overview", "image_position": "-8px center"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.sop_documents WHERE slug = 'advisor-overview');

-- 2. Membership Overview - Agent Resource
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
  'Membership Overview - Agent Resource',
  'membership-overview-agent-resource',
  'Membership overview presentation for agents - MPB Health.',
  'Reference Materials',
  ARRAY['membership', 'reference materials', 'overview', 'agent', 'presentation'],
  'Membership Overview - Agent Resource - MPB Health presentation.',
  'presentation',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Membership%20Overview%20-%20Agent%20Resource.pptx',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/member%20overview.jpg',
  '1.0',
  true,
  true,
  0,
  '{"thumbnail_title": "Membership Overview - Agent Resource", "image_position": "-8px center"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.sop_documents WHERE slug = 'membership-overview-agent-resource');

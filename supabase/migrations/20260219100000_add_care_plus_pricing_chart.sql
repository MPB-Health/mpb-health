-- ============================================================================
-- Migration: Add Care+ Pricing Chart to SOP Documents
-- Description: Inserts the Care+ pricing PDF into the Pricing Charts category
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
  'Care+ Pricing',
  'care-plus-pricing',
  'Care+ plan pricing chart with rates and coverage details.',
  'Pricing Charts',
  ARRAY['pricing', 'pricing charts', 'care+', 'care plus', 'rates'],
  'Care+ Pricing - plan pricing and rates overview.',
  'pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Care+%20pricing.pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/care-plus-pricing-thumbnail.png',
  '1.0',
  true,
  true,
  0,
  '{"thumbnail_title": "Care+ Pricing", "thumbnail_title_top": "100px", "thumbnail_title_font_size": "37px", "thumbnail_title_color": "#ffffff"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert Secure HSA Pricing document
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
  'Secure HSA Pricing',
  'secure-hsa-pricing',
  'Secure HSA plan pricing chart with rates and coverage details.',
  'Pricing Charts',
  ARRAY['pricing', 'pricing charts', 'secure hsa', 'hsa', 'rates'],
  'Secure HSA Pricing - plan pricing and rates overview.',
  'pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/bulletin-images/Secure%20HSA%20pricing.pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/secure-hsa-pricing-thumbnail.png',
  '1.0',
  true,
  true,
  0,
  '{"thumbnail_title": "Secure HSA Pricing", "thumbnail_title_top": "100px", "thumbnail_title_font_size": "37px", "thumbnail_title_color": "#ffffff"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert Direct Pricing document
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
  'Direct Pricing',
  'direct-pricing',
  'Direct plan pricing chart with rates and coverage details.',
  'Pricing Charts',
  ARRAY['pricing', 'pricing charts', 'direct', 'rates'],
  'Direct Pricing - plan pricing and rates overview.',
  'pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Direct%20pricing.pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/direct-pricing-thumbnail.png',
  '1.0',
  true,
  true,
  0,
  '{"thumbnail_title": "Direct Pricing", "thumbnail_title_top": "100px", "thumbnail_title_font_size": "37px", "thumbnail_title_color": "#ffffff"}'::jsonb
)
ON CONFLICT DO NOTHING;

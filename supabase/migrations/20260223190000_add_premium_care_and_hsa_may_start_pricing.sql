-- ============================================================================
-- Migration: Add Premium Care and Premium HSA May Start Date Pricing Charts
-- Description: Adds two new pricing chart cards to the Pricing Charts page
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
  'Premium Care May Start Date Pricing',
  'premium-care-may-start-date-pricing',
  'Premium Care plan pricing for May start dates with rates and coverage details.',
  'Pricing Charts',
  ARRAY['pricing', 'pricing charts', 'premium care', 'may start', 'rates'],
  'Premium Care May Start Date Pricing - plan pricing and rates overview.',
  'pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Premium%20Care%20May%20Start%20Date%20Pricing.pdf',
  'https://advisor.mpb.health/premium-care-may-start-date-pricing-thumbnail.svg',
  '1.0',
  true,
  true,
  0,
  '{"thumbnail_title": "Premium Care May Start Date Pricing", "thumbnail_title_top": "100px", "thumbnail_title_font_size": "37px", "thumbnail_title_color": "#ffffff"}'::jsonb
),
(
  'Premium HSA May Start Date Pricing',
  'premium-hsa-may-start-date-pricing',
  'Premium HSA plan pricing for May start dates with rates and coverage details.',
  'Pricing Charts',
  ARRAY['pricing', 'pricing charts', 'premium hsa', 'hsa', 'may start', 'rates'],
  'Premium HSA May Start Date Pricing - plan pricing and rates overview.',
  'pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Premium%20HSA%20May%20Start%20Date%20Pricing.pdf',
  'https://advisor.mpb.health/premium-hsa-may-start-date-pricing-thumbnail.svg',
  '1.0',
  true,
  true,
  0,
  '{"thumbnail_title": "Premium HSA May Start Date Pricing", "thumbnail_title_top": "100px", "thumbnail_title_font_size": "37px", "thumbnail_title_color": "#ffffff"}'::jsonb
);

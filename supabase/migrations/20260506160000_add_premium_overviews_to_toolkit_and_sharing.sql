-- ============================================================================
-- Duplicate Premium HSA / Premium Care Membership Overview PDFs into
-- the Advisor Toolkit and Sharing Guidelines SOP sections.
-- ----------------------------------------------------------------------------
-- Each row is a SOP document pointing at the same PDF file in
-- advisor-documents storage. image_url is intentionally NULL so the
-- DocumentCard renders the first page of the PDF as the thumbnail
-- via PDFThumbnail.
--
-- Idempotent: each insert is guarded by NOT EXISTS on slug.
-- ============================================================================

-- 1. Premium HSA Membership Overview - Advisor Toolkit
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
  'Premium HSA Membership Overview',
  'premium-hsa-membership-overview-toolkit',
  'Highlights of the Premium HSA membership — benefits, sharing details, and what members can expect.',
  'presentations',
  ARRAY['premium hsa', 'membership', 'overview', 'advisor toolkit'],
  'Premium HSA Membership Overview - MPB Health.',
  'pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Premium%20HSA%20Membership%20Overview.pdf',
  NULL,
  '1.0',
  true,
  true,
  0,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.sop_documents
  WHERE slug = 'premium-hsa-membership-overview-toolkit'
);

-- 2. Premium Care Membership Overview - Advisor Toolkit
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
  'Premium Care Membership Overview',
  'premium-care-membership-overview-toolkit',
  'Highlights of the Premium Care membership — benefits, sharing details, and what members can expect.',
  'presentations',
  ARRAY['premium care', 'membership', 'overview', 'advisor toolkit'],
  'Premium Care Membership Overview - MPB Health.',
  'pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Premium%20Care%20Membership%20Overview.pdf',
  NULL,
  '1.0',
  true,
  true,
  0,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.sop_documents
  WHERE slug = 'premium-care-membership-overview-toolkit'
);

-- 3. Premium HSA Membership Overview - Sharing Guidelines
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
  'Premium HSA Membership Overview',
  'premium-hsa-membership-overview-sharing',
  'Highlights of the Premium HSA membership — benefits, sharing details, and what members can expect.',
  'sharing guidelines',
  ARRAY['premium hsa', 'membership', 'overview', 'sharing guidelines'],
  'Premium HSA Membership Overview - MPB Health.',
  'pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Premium%20HSA%20Membership%20Overview.pdf',
  NULL,
  '1.0',
  true,
  true,
  0,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.sop_documents
  WHERE slug = 'premium-hsa-membership-overview-sharing'
);

-- 4. Premium Care Membership Overview - Sharing Guidelines
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
  'Premium Care Membership Overview',
  'premium-care-membership-overview-sharing',
  'Highlights of the Premium Care membership — benefits, sharing details, and what members can expect.',
  'sharing guidelines',
  ARRAY['premium care', 'membership', 'overview', 'sharing guidelines'],
  'Premium Care Membership Overview - MPB Health.',
  'pdf',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Premium%20Care%20Membership%20Overview.pdf',
  NULL,
  '1.0',
  true,
  true,
  0,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.sop_documents
  WHERE slug = 'premium-care-membership-overview-sharing'
);

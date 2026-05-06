-- ============================================================================
-- Add "Zion vs Sedera - Updated Comparison 2026" XLSX to
-- the Advisor Toolkit and Sharing Guidelines SOP sections.
-- ----------------------------------------------------------------------------
-- The XLSX file is hosted in advisor-documents storage and is opened in
-- the existing DocumentPreviewModal via Microsoft's Office Online viewer.
-- DocumentCard renders a green spreadsheet icon for XLSX files when no
-- image_url is set.
--
-- Idempotent: each insert is guarded by NOT EXISTS on slug.
-- ============================================================================

-- 1. Advisor Toolkit
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
  'Zion vs Sedera - Updated Comparison 2026',
  'zion-vs-sedera-comparison-2026-toolkit',
  'Side-by-side comparison of Zion HealthShare and Sedera memberships, updated for 2026.',
  'presentations',
  ARRAY['zion', 'sedera', 'comparison', 'advisor toolkit', '2026'],
  'Zion vs Sedera comparison spreadsheet - MPB Health.',
  'spreadsheet',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Zion%20vs%20Sedera%20-%20Updated%20Comparison%202026.xlsx',
  NULL,
  '1.0',
  true,
  true,
  0,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.sop_documents
  WHERE slug = 'zion-vs-sedera-comparison-2026-toolkit'
);

-- 2. Sharing Guidelines
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
  'Zion vs Sedera - Updated Comparison 2026',
  'zion-vs-sedera-comparison-2026-sharing',
  'Side-by-side comparison of Zion HealthShare and Sedera memberships, updated for 2026.',
  'sharing guidelines',
  ARRAY['zion', 'sedera', 'comparison', 'sharing guidelines', '2026'],
  'Zion vs Sedera comparison spreadsheet - MPB Health.',
  'spreadsheet',
  'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Zion%20vs%20Sedera%20-%20Updated%20Comparison%202026.xlsx',
  NULL,
  '1.0',
  true,
  true,
  0,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.sop_documents
  WHERE slug = 'zion-vs-sedera-comparison-2026-sharing'
);

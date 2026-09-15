-- ============================================================================
-- Migration: Add HSA reference article to Reference Materials
--            and two RX Valet links to the RX section.
-- ============================================================================

-- 1. Health Savings Accounts article → Reference Materials
INSERT INTO public.sop_documents (
  title, slug, description, category, tags, content, content_type,
  file_url, version, is_published, is_active, view_count, metadata
)
SELECT
  'Health Savings Accounts',
  'health-savings-accounts',
  'MPB Health resource page covering Health Savings Account (HSA) basics, eligibility, and how to use your HSA with MPB plans.',
  'Reference Materials',
  ARRAY['hsa', 'reference materials', 'health savings account', 'tax benefits'],
  'Health Savings Accounts overview from MPB Health.',
  'link',
  'https://mpb.health/resources/health-savings-accounts',
  '1.0',
  true,
  true,
  0,
  '{"thumbnail_title": "Health Savings Accounts"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.sop_documents WHERE slug = 'health-savings-accounts');
-- 2. How to Use RX Valet guide → RX
INSERT INTO public.sop_documents (
  title, slug, description, category, tags, content, content_type,
  file_url, version, is_published, is_active, view_count, metadata
)
SELECT
  'How to Use RX Valet to Search & Save on Prescriptions',
  'how-to-use-rx-valet',
  'Step-by-step guide on using RX Valet to search for medications and save on prescription costs.',
  'RX',
  ARRAY['rx', 'rx valet', 'prescriptions', 'savings', 'pharmacy'],
  'How to Use RX Valet to Search & Save on Prescriptions.',
  'link',
  'https://mpb.health/resources/how-to-use-rx-valet-to-search-save-on-prescriptions',
  '1.0',
  true,
  true,
  0,
  '{"thumbnail_title": "How to Use RX Valet"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.sop_documents WHERE slug = 'how-to-use-rx-valet');
-- 3. MyRxValet portal link → RX
INSERT INTO public.sop_documents (
  title, slug, description, category, tags, content, content_type,
  file_url, version, is_published, is_active, view_count, metadata
)
SELECT
  'MyRxValet',
  'myrxvalet',
  'Direct link to the MyRxValet member portal for searching prescription prices and saving on medications.',
  'RX',
  ARRAY['rx', 'rx valet', 'myrxvalet', 'prescriptions', 'pharmacy', 'portal'],
  'MyRxValet member portal.',
  'link',
  'https://www.myrxvalet.com/',
  '1.0',
  true,
  true,
  0,
  '{"thumbnail_title": "MyRxValet"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.sop_documents WHERE slug = 'myrxvalet');

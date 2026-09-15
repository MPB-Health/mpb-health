-- ============================================================================
-- Migration: Add thumbnail to Health Savings Accounts card in Resources
-- ============================================================================

UPDATE public.sop_documents
SET
  image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Health%20Savings%20Accounts%20(HSA).jpg',
  metadata = COALESCE(metadata, '{}'::jsonb) || '{"image_position": "-8px center"}'::jsonb
WHERE slug = 'health-savings-accounts';

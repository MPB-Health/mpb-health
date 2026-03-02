-- ============================================================================
-- Migration: Fix healthcare presentation thumbnails - use Supabase storage
-- Description: Update image_url from relative path to Supabase storage
-- NOTE: Run scripts/upload-healthcare-thumbnails.mjs to upload the PNG files
--       to advisor-documents bucket before or after this migration.
-- ============================================================================

UPDATE public.sop_documents
SET image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/healthcare-individual-needs-thumbnail.png'
WHERE slug = 'healthcare-designed-individual-needs';

UPDATE public.sop_documents
SET image_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/healthcare-group-needs-thumbnail.png'
WHERE slug = 'healthcare-designed-group-needs';

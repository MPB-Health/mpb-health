-- ============================================================================
-- Migration: Update Healthcare presentation PPTX files in Advisor Toolkit
-- Description: Update file_url for "Healthcare Designed for Group Needs" and
--              "Healthcare Designed for Individual Needs" to new Supabase storage URLs
--
-- PREREQUISITE: Upload your new PPTX files to the advisor-documents bucket in
--               Supabase Storage before running this migration.
--
-- Expected filenames (or update the URLs below to match your uploaded files):
--   - Healthcare-Designed-for-Group-Needs.pptx
--   - Healthcare-Designed-for-Individual-Needs.pptx
--
-- Storage path: advisor-documents bucket
-- Public URL format: https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/<filename>
-- ============================================================================

UPDATE public.sop_documents
SET file_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Healthcare-Designed-for-Group-Needs.pptx'
WHERE slug = 'healthcare-designed-group-needs';
UPDATE public.sop_documents
SET file_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Healthcare-Designed-for-Individual-Needs.pptx'
WHERE slug = 'healthcare-designed-individual-needs';

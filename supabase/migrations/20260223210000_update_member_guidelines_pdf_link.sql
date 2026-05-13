-- ============================================================================
-- Migration: Update Member Guidelines PDF link on Sharing Guidelines page
-- Description: Replaces the PDF link for 'Member Guidelines (April 2025)' with
--              the January 2026 Member Guidelines document
-- ============================================================================

-- Update sop_documents: Replace Member Guidelines (April 2025) PDF link and title with Jan 2026 version
UPDATE public.sop_documents
SET file_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/Member-Guidelines_01.2026.pdf',
    title = 'Member Guidelines (January 2026)',
    updated_at = NOW()
WHERE (
  title ILIKE '%Member Guidelines (April 2025)%'
  OR (title ILIKE '%Member Guidelines%' AND category ILIKE '%Sharing Guidelines%')
);

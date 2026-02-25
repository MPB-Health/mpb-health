-- ============================================================================
-- Migration: Set Sedera Member Guidelines (October 2023) PDF
-- Description: Ensures the Sedera SELECT+ Membership Guidelines document has
--              the correct Sedera PDF link.
-- ============================================================================

-- Update Member Guidelines (October 2023) - Sedera SELECT+ document with correct PDF
UPDATE public.sop_documents
SET file_url = 'https://assets.ctfassets.net/01zqqfy0bb2m/3vaQkUByIaLhCKaUKgmvSx/14c7a76ea4b63a5f34e76a8343003c27/Sedera_MS_Select_T.pdf',
    title = 'Member Guidelines (October 2023)',
    updated_at = NOW()
WHERE description ILIKE '%Sedera SELECT%'
   OR (title ILIKE '%Member Guidelines%' AND title ILIKE '%October 2023%' AND description ILIKE '%Sedera%');

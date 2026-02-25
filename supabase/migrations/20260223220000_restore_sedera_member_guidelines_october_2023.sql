-- ============================================================================
-- Migration: Restore Sedera Member Guidelines (October 2023)
-- Description: Reverts the incorrect update to the Sedera SELECT+ document that
--              was mistakenly changed by the Member Guidelines (April 2025) update.
--              Restores title and file_url for the Sedera document only.
-- ============================================================================

-- Restore Member Guidelines (October 2023) - Sedera SELECT+ document
-- Only affects documents that were incorrectly changed (title = Jan 2026 but description mentions Sedera)
-- Uses Sedera SELECT+ guidelines PDF from Sedera's official assets
UPDATE public.sop_documents
SET file_url = 'https://assets.ctfassets.net/01zqqfy0bb2m/3vaQkUByIaLhCKaUKgmvSx/14c7a76ea4b63a5f34e76a8343003c27/Sedera_MS_Select_T.pdf',
    title = 'Member Guidelines (October 2023)',
    updated_at = NOW()
WHERE title = 'Member Guidelines (January 2026)'
  AND description ILIKE '%Sedera%';

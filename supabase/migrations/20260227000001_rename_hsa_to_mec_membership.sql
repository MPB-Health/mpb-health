-- ============================================================================
-- Migration: Rename "HSA Compatible Membership" to "MEC Membership Graphic"
--            and remove any duplicate entries with the same file URL.
-- ============================================================================

-- Step 1: Rename the primary record
UPDATE public.sop_documents
SET
  title       = 'MEC Membership Graphic',
  slug        = 'mec-membership-graphic',
  description = 'MEC Membership overview graphic for MPB Health plans.',
  tags        = ARRAY['mec', 'reference materials', 'membership', 'graphic'],
  metadata    = '{"thumbnail_title": "MEC Membership Graphic"}'::jsonb
WHERE
  slug = 'hsa-compatible-membership';
-- Step 2: Remove any duplicate rows that share the same file_url but have
--         a different slug (to eliminate the duplicate the user reported).
DELETE FROM public.sop_documents
WHERE
  file_url = 'https://dtmnkzllidaiqyheguhl.supabase.co/storage/v1/object/public/advisor-documents/MPB%20Health%20Graphic.png'
  AND slug <> 'mec-membership-graphic';

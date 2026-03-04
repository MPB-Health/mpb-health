-- ============================================================================
-- Migration: Remove duplicate MEC Membership Graphic from Reference Materials
-- Description: Removes duplicate "MEC Membership Graphic" card from the
--              Reference Materials section (keeps the one with smallest id)
-- ============================================================================

DELETE FROM public.sop_documents a
USING public.sop_documents b
WHERE a.title = 'MEC Membership Graphic'
  AND b.title = 'MEC Membership Graphic'
  AND a.id > b.id;

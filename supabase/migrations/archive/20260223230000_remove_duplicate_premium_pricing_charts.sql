-- ============================================================================
-- Migration: Remove Duplicate Premium Care and Premium HSA June 1 Pricing Charts
-- Description: Removes duplicate Premium Care June 1 and Premium HSA June 1
--              pricing cards from the Pricing Charts page
-- ============================================================================

-- Delete duplicate rows, keeping the one with the smallest id for each title
DELETE FROM public.sop_documents a
USING public.sop_documents b
WHERE a.title = b.title
  AND a.category = 'Pricing Charts'
  AND a.id > b.id
  AND a.title IN ('Premium Care June 1 Start Date Pricing', 'Premium HSA June 1 Start Date Pricing');

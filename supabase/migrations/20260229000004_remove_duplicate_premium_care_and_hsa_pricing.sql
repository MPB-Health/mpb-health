-- ============================================================================
-- Migration: Remove duplicate Premium Care Pricing and Premium HSA Pricing
-- Description: Removes duplicate "Premium Care Pricing" (3.2025) and
--              "Premium HSA Pricing" (3.2025) from Pricing Charts.
--              Keeps one of each (smallest id).
-- ============================================================================

DELETE FROM public.sop_documents a
USING public.sop_documents b
WHERE a.title = b.title
  AND a.category = 'Pricing Charts'
  AND b.category = 'Pricing Charts'
  AND a.id > b.id
  AND a.title IN ('Premium Care Pricing', 'Premium HSA Pricing');

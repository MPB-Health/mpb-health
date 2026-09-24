-- ============================================================================
-- Migration: Remove Duplicate Pricing Chart Documents
-- Description: Removes duplicate Care+ Pricing, Direct Pricing, and Secure HSA
--              Pricing cards from the Pricing Charts page
-- ============================================================================

-- Delete duplicate rows, keeping the one with the smallest id for each title
DELETE FROM public.sop_documents a
USING public.sop_documents b
WHERE a.title = b.title
  AND a.category = 'Pricing Charts'
  AND a.id > b.id
  AND a.title IN ('Care+ Pricing', 'Direct Pricing', 'Secure HSA Pricing');

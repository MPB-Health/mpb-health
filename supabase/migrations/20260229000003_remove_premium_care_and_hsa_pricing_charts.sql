-- ============================================================================
-- Migration: Remove Premium Care and Premium HSA pricing charts from Pricing Charts
-- Description: Removes "Premium Care" and "Premium HSA" pricing chart cards
--              from the Pricing Charts section
-- ============================================================================

DELETE FROM public.sop_documents
WHERE slug IN ('premium-care-may-start-date-pricing', 'premium-hsa-may-start-date-pricing')
  AND category = 'Pricing Charts';

-- ============================================================================
-- Migration: Remove Premium HSA Pricing (3.2025) cards from Resources
-- Description: Removes 2 cards:
--   1. Premium HSA Pricing (Premium Care membership pricing chart (3.2025))
--   2. Premium HSA Pricing (Premium HSA membership pricing chart (3.2025))
-- ============================================================================

DELETE FROM public.sop_documents
WHERE (
  description ILIKE '%Premium Care membership pricing chart (3.2025)%'
  OR description ILIKE '%Premium HSA membership pricing chart (3.2025)%'
);

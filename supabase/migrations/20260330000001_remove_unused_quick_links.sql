-- ============================================================================
-- Remove unused quick link cards from advisor_quick_links
-- These are leftover seed data from earlier migrations that are no longer needed.
-- ============================================================================

DELETE FROM public.advisor_quick_links
WHERE label IN (
  'Current Price Sheets',
  'Cost of MEC',
  'Current Promo Videos',
  'Brochures & Marketing Materials',
  'PHCS Network Search',
  'Prescription Drug Search',
  'Power List',
  'My Leads',
  'Training',
  'Forms',
  'SOPs',
  'Compliance'
);

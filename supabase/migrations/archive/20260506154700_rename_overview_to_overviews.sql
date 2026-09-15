-- ============================================================================
-- Rename "Overview" nav item to "Overviews" (plural)
-- ----------------------------------------------------------------------------
-- Idempotent: only updates the row if it exists with the old label.
-- ============================================================================

UPDATE public.advisor_nav_menu
   SET label = 'Overviews'
 WHERE url = '/overview'
   AND label = 'Overview';

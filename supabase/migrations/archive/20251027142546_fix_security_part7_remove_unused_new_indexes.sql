/*
  # Fix Database Security Issues - Part 7: Remove Unused New Indexes

  ## Remove Unused Indexes
    - Drop `idx_navigation_analytics_navigation_item_id` (not being used)
    - Drop `idx_navigation_analytics_user_id` (not being used)
    - These were created but analysis shows they're not used in queries

  ## Performance
    - Reduces storage overhead
    - Improves write performance
*/

-- ============================================================================
-- REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_navigation_analytics_navigation_item_id;
DROP INDEX IF EXISTS idx_navigation_analytics_user_id;

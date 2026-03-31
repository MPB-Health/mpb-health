-- ============================================================================
-- Reset analytics data: start fresh with corrected tracking code
-- Historical data was collected with broken tracking (inflated page counts,
-- no bot filtering, no visitor dedup, blog double-counting, admin pages).
-- ============================================================================

TRUNCATE public.page_views;
TRUNCATE public.analytics_sessions CASCADE;
TRUNCATE public.analytics_events;
TRUNCATE public.daily_analytics_summary;

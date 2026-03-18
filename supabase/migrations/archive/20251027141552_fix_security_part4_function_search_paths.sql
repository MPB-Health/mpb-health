/*
  # Fix Database Security Issues - Part 4: Set Function Search Paths

  ## Set Immutable Search Paths on Functions
    - Set search_path to 'public, pg_temp' for all functions
    - Prevents security vulnerabilities from search_path manipulation
    - Required for production security

  ## Security
    - Protects against SQL injection through search_path manipulation
    - Ensures functions always execute with predictable schema resolution
*/

-- ============================================================================
-- SET SEARCH PATHS FOR FUNCTIONS
-- ============================================================================

ALTER FUNCTION update_onboarding_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION handle_updated_at() SET search_path = public, pg_temp;

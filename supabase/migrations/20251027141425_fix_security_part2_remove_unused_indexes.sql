/*
  # Fix Database Security Issues - Part 2: Remove Unused Indexes

  ## Remove Unused Indexes
    - Drop indexes that have not been used
    - This reduces storage overhead and improves write performance
    - Indexes are only removed if they have zero usage

  ## Security
    - Maintains all required indexes for foreign keys and frequently used queries
    - Only removes genuinely unused indexes identified by database analysis
*/

-- ============================================================================
-- REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_blog_categories_slug;
DROP INDEX IF EXISTS idx_resource_library_published_date;
DROP INDEX IF EXISTS idx_resource_library_topics;
DROP INDEX IF EXISTS idx_resource_library_search;
DROP INDEX IF EXISTS idx_zoho_errors_created_at;
DROP INDEX IF EXISTS idx_plan_selections_session;
DROP INDEX IF EXISTS idx_plan_selections_created;
DROP INDEX IF EXISTS idx_enrollment_intent_session;
DROP INDEX IF EXISTS idx_enrollment_intent_created;
DROP INDEX IF EXISTS idx_enrollment_intent_plan;
DROP INDEX IF EXISTS idx_zoho_errors_type;
DROP INDEX IF EXISTS idx_zoho_health_checked_at;
DROP INDEX IF EXISTS idx_rate_calculator_views_session;
DROP INDEX IF EXISTS idx_rate_calculator_views_created;
DROP INDEX IF EXISTS idx_onboarding_session_id;
DROP INDEX IF EXISTS idx_onboarding_created_at;
DROP INDEX IF EXISTS idx_plan_features_category;
DROP INDEX IF EXISTS idx_plan_pricing_effective;
DROP INDEX IF EXISTS idx_specialized_solutions_order;
DROP INDEX IF EXISTS idx_solution_features_solution_id;
DROP INDEX IF EXISTS idx_solution_features_order;
DROP INDEX IF EXISTS idx_solution_benefits_solution_id;
DROP INDEX IF EXISTS idx_solution_benefits_order;
DROP INDEX IF EXISTS idx_solution_testimonials_solution_id;
DROP INDEX IF EXISTS idx_solution_testimonials_order;
DROP INDEX IF EXISTS idx_resource_library_audience;
DROP INDEX IF EXISTS idx_resource_library_featured;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_advisors_state;
DROP INDEX IF EXISTS idx_advisors_active;
DROP INDEX IF EXISTS idx_advisors_advisor_id;
DROP INDEX IF EXISTS idx_benefits_active;
DROP INDEX IF EXISTS idx_benefits_order;
DROP INDEX IF EXISTS idx_maternity_stages_coverage;
DROP INDEX IF EXISTS idx_faq_items_category;
DROP INDEX IF EXISTS idx_faq_items_order;
DROP INDEX IF EXISTS idx_educational_content_slug;
DROP INDEX IF EXISTS idx_educational_content_type;
DROP INDEX IF EXISTS idx_lead_submissions_email;
DROP INDEX IF EXISTS idx_lead_submissions_status;
DROP INDEX IF EXISTS idx_lead_submissions_submitted_at;
DROP INDEX IF EXISTS idx_lead_submissions_assigned_to;
DROP INDEX IF EXISTS idx_educational_content_active;
DROP INDEX IF EXISTS idx_navigation_items_requires_auth;
DROP INDEX IF EXISTS idx_user_navigation_preferences_user_id;
DROP INDEX IF EXISTS idx_navigation_analytics_timestamp;
DROP INDEX IF EXISTS idx_navigation_analytics_session_id;
DROP INDEX IF EXISTS idx_rate_config_plan;
DROP INDEX IF EXISTS idx_rate_config_age_band;
DROP INDEX IF EXISTS idx_rate_config_effective;
DROP INDEX IF EXISTS idx_rate_config_active;

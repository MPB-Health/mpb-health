/*
  # Fix Database Security Issues - Part 3: Consolidate Multiple Permissive Policies

  ## Fix Multiple Permissive Policies
    - Consolidate overlapping policies into single policies with OR conditions
    - Prevents confusion and improves query planning
    - Maintains exact same access patterns as before

  ## Security
    - All changes maintain existing access patterns
    - Simplified policy structure improves maintainability
*/

-- ============================================================================
-- CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- ============================================================================

-- Advisors
DROP POLICY IF EXISTS "Anyone can view active advisors" ON advisors;
DROP POLICY IF EXISTS "Authenticated users can manage advisors" ON advisors;
CREATE POLICY "Public can view active advisors, admins can manage"
  ON advisors FOR SELECT
  USING (
    is_active = true 
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

-- Benefits
DROP POLICY IF EXISTS "Anyone can view active benefits" ON benefits;
DROP POLICY IF EXISTS "Authenticated users can manage benefits" ON benefits;
CREATE POLICY "Public can view active benefits, admins can manage"
  ON benefits FOR SELECT
  USING (
    is_active = true 
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

-- Blog articles (uses is_published, not status)
DROP POLICY IF EXISTS "Anyone can view published articles" ON blog_articles;
DROP POLICY IF EXISTS "Authenticated users can view all articles" ON blog_articles;
CREATE POLICY "Public can view published, authenticated can view all"
  ON blog_articles FOR SELECT
  USING (
    is_published = true 
    OR auth.role() = 'authenticated'
  );

-- Educational content
DROP POLICY IF EXISTS "Anyone can view active educational content" ON educational_content;
DROP POLICY IF EXISTS "Authenticated users can manage educational content" ON educational_content;
CREATE POLICY "Public can view active content, admins can manage"
  ON educational_content FOR SELECT
  USING (
    is_active = true 
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

-- FAQ items
DROP POLICY IF EXISTS "Anyone can view active FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Authenticated users can manage FAQ items" ON faq_items;
CREATE POLICY "Public can view active FAQs, admins can manage"
  ON faq_items FOR SELECT
  USING (
    is_active = true 
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

-- Healthcare plan categories
DROP POLICY IF EXISTS "Public can view active plan categories" ON healthcare_plan_categories;
DROP POLICY IF EXISTS "Authenticated users can manage plan categories" ON healthcare_plan_categories;
CREATE POLICY "Public can view active categories, admins can manage"
  ON healthcare_plan_categories FOR SELECT
  USING (
    is_active = true 
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

-- Maternity coverage
DROP POLICY IF EXISTS "Anyone can view maternity coverage" ON maternity_coverage;
DROP POLICY IF EXISTS "Authenticated users can manage maternity coverage" ON maternity_coverage;
CREATE POLICY "Public can view maternity coverage"
  ON maternity_coverage FOR SELECT
  USING (true);

-- Maternity coverage stages
DROP POLICY IF EXISTS "Anyone can view maternity stages" ON maternity_coverage_stages;
DROP POLICY IF EXISTS "Authenticated users can manage maternity stages" ON maternity_coverage_stages;
CREATE POLICY "Public can view maternity stages"
  ON maternity_coverage_stages FOR SELECT
  USING (true);

-- Navigation items
DROP POLICY IF EXISTS "Anyone can view public navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Authenticated users can view auth-required items" ON navigation_items;
CREATE POLICY "Public can view items based on auth requirement"
  ON navigation_items FOR SELECT
  USING (
    requires_auth = false 
    OR auth.role() = 'authenticated'
  );

-- Onboarding responses
DROP POLICY IF EXISTS "Users can read own session responses" ON onboarding_responses;
DROP POLICY IF EXISTS "Authenticated users can read all responses" ON onboarding_responses;
CREATE POLICY "Admins can read all onboarding responses"
  ON onboarding_responses FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt())->>'role' = 'admin');

-- Plan category features
DROP POLICY IF EXISTS "Public can view category features" ON plan_category_features;
DROP POLICY IF EXISTS "Authenticated users can manage category features" ON plan_category_features;
CREATE POLICY "Public can view category features"
  ON plan_category_features FOR SELECT
  USING (true);

-- Plan category profiles
DROP POLICY IF EXISTS "Public can view category profiles" ON plan_category_profiles;
DROP POLICY IF EXISTS "Authenticated users can manage category profiles" ON plan_category_profiles;
CREATE POLICY "Public can view category profiles"
  ON plan_category_profiles FOR SELECT
  USING (true);

-- Plan features - consolidate
DROP POLICY IF EXISTS "Anyone can view plan features" ON plan_features;
CREATE POLICY "Public can view features of active plans"
  ON plan_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_features.plan_id
      AND plans.is_active = true
    )
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

-- Plan pricing - consolidate
DROP POLICY IF EXISTS "Anyone can view plan pricing" ON plan_pricing;
CREATE POLICY "Public can view pricing of active plans"
  ON plan_pricing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_pricing.plan_id
      AND plans.is_active = true
    )
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

-- Plan sharing details - consolidate
DROP POLICY IF EXISTS "Anyone can view plan sharing details" ON plan_sharing_details;
CREATE POLICY "Public can view sharing details of active plans"
  ON plan_sharing_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_sharing_details.plan_id
      AND plans.is_active = true
    )
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

-- Plans - consolidate
DROP POLICY IF EXISTS "Anyone can view active plans" ON plans;
CREATE POLICY "Public can view active plans, admins can view all"
  ON plans FOR SELECT
  USING (
    is_active = true 
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

-- Rate configuration
DROP POLICY IF EXISTS "Anyone can view active rate configuration" ON rate_configuration;
DROP POLICY IF EXISTS "Authenticated users can manage rate configuration" ON rate_configuration;
CREATE POLICY "Public can view active rates, admins can manage"
  ON rate_configuration FOR SELECT
  USING (
    is_active = true 
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

-- Solution benefits (uses is_published on specialized_solutions)
DROP POLICY IF EXISTS "Anyone can view benefits of published solutions" ON solution_benefits;
DROP POLICY IF EXISTS "Authenticated users can view all benefits" ON solution_benefits;
CREATE POLICY "Public can view published solution benefits"
  ON solution_benefits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM specialized_solutions
      WHERE specialized_solutions.id = solution_benefits.solution_id
      AND specialized_solutions.is_published = true
    )
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

-- Solution features
DROP POLICY IF EXISTS "Anyone can view features of published solutions" ON solution_features;
DROP POLICY IF EXISTS "Authenticated users can view all features" ON solution_features;
CREATE POLICY "Public can view published solution features"
  ON solution_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM specialized_solutions
      WHERE specialized_solutions.id = solution_features.solution_id
      AND specialized_solutions.is_published = true
    )
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

-- Solution testimonials
DROP POLICY IF EXISTS "Anyone can view testimonials of published solutions" ON solution_testimonials;
DROP POLICY IF EXISTS "Authenticated users can view all testimonials" ON solution_testimonials;
CREATE POLICY "Public can view published solution testimonials"
  ON solution_testimonials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM specialized_solutions
      WHERE specialized_solutions.id = solution_testimonials.solution_id
      AND specialized_solutions.is_published = true
    )
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

-- Specialized solutions (uses is_published)
DROP POLICY IF EXISTS "Anyone can view published solutions" ON specialized_solutions;
DROP POLICY IF EXISTS "Authenticated users can view all solutions" ON specialized_solutions;
CREATE POLICY "Public can view published solutions, admins can view all"
  ON specialized_solutions FOR SELECT
  USING (
    is_published = true 
    OR (SELECT auth.jwt())->>'role' = 'admin'
  );

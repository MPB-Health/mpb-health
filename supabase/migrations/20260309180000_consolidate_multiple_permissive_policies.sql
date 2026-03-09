-- ============================================================================
-- Migration: Consolidate Multiple Permissive Policies (Supabase Linter 0006)
-- Description:
--   Multiple permissive policies for the same role/action cause each policy
--   to be evaluated for every query. Consolidate by:
--   1. Dropping redundant "view" policies when "manage" (FOR ALL) already covers SELECT
--   2. Merging overlapping policies into single policies with OR conditions
--
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADVISOR LMS TABLES: Drop redundant "view" policies (manage covers SELECT)
-- ============================================================================

-- advisor_external_training_progress: "Advisors can view" redundant with "Advisors can manage"
DROP POLICY IF EXISTS "Advisors can view own external progress" ON public.advisor_external_training_progress;

-- advisor_lesson_completions: "Advisors can view" redundant with "Advisors can manage"
DROP POLICY IF EXISTS "Advisors can view own lesson completions" ON public.advisor_lesson_completions;

-- advisor_lms_enrollments: Consolidate 3 SELECT policies into 1
-- Drop "Advisors can view" (redundant with manage) and "Admins can view"
-- Replace "Advisors can manage" (FOR ALL) with FOR INSERT,UPDATE,DELETE only
-- Create single SELECT policy for both advisors and admins
DROP POLICY IF EXISTS "Advisors can view own enrollments" ON public.advisor_lms_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.advisor_lms_enrollments;
DROP POLICY IF EXISTS "Advisors can manage own enrollments" ON public.advisor_lms_enrollments;

CREATE POLICY "Advisors and admins can view enrollments" ON public.advisor_lms_enrollments
  FOR SELECT
  USING (
    (advisor_id IN (SELECT id FROM advisor_profiles WHERE id = (SELECT auth.uid())))
    OR (public.current_user_has_admin_access())
  );

CREATE POLICY "Advisors can manage own enrollments" ON public.advisor_lms_enrollments
  FOR INSERT
  WITH CHECK (advisor_id IN (SELECT id FROM advisor_profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Advisors can update own enrollments" ON public.advisor_lms_enrollments
  FOR UPDATE
  USING (advisor_id IN (SELECT id FROM advisor_profiles WHERE id = (SELECT auth.uid())))
  WITH CHECK (advisor_id IN (SELECT id FROM advisor_profiles WHERE id = (SELECT auth.uid())));

CREATE POLICY "Advisors can delete own enrollments" ON public.advisor_lms_enrollments
  FOR DELETE
  USING (advisor_id IN (SELECT id FROM advisor_profiles WHERE id = (SELECT auth.uid())));

-- ============================================================================
-- 2. ADVISOR PORTAL CMS: Consolidate read + write into single SELECT, keep write
--    advisor_announcements, advisor_categories, advisor_dashboard_widgets,
--    advisor_learning_paths, advisor_nav_menu, advisor_quick_links
--    Each has "Enable read access for all users" + "Enable write access for advisor command users"
--    Both apply to SELECT for authenticated. Consolidate: read OR (advisor_command AND read)
--    Actually: "read for all" = true for everyone. "write for advisor" = advisor_command for ALL.
--    For SELECT: read gives true, write gives advisor_command. Redundant - drop read, keep write?
--    No: read is FOR SELECT, write is FOR ALL. So for SELECT we have both. "read for all" = USING(true)
--    and "write for advisor" has USING(advisor_command). So for SELECT, we get (true OR advisor_command) = true.
--    The "read for all" makes everything visible. The "write" adds nothing for SELECT. So we can drop "read"
--    and change "write" to... no, write is FOR ALL so it covers SELECT. If we drop read, we'd only have
--    advisor_command for SELECT, which would restrict. So we need both for different purposes.
--    Actually: "Enable read access for all users" = SELECT with USING(true) - everyone can read
--    "Enable write access for advisor command users" = ALL with advisor_command - advisors can do everything
--    For SELECT by authenticated: policy 1 says true, policy 2 says advisor_command. So we get (true OR advisor_command).
--    We can consolidate to one: USING(true) since that's the effective result. Drop "read", keep "write" for non-SELECT?
--    Simpler: one policy FOR SELECT USING(true), one FOR INSERT/UPDATE/DELETE with advisor_command.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.advisor_announcements;
DROP POLICY IF EXISTS "Enable write access for advisor command users" ON public.advisor_announcements;
CREATE POLICY "Advisor CMS read" ON public.advisor_announcements FOR SELECT USING (true);
CREATE POLICY "Advisor CMS write" ON public.advisor_announcements FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_advisor_command_access());
CREATE POLICY "Advisor CMS update" ON public.advisor_announcements FOR UPDATE TO authenticated
  USING (public.current_user_has_advisor_command_access())
  WITH CHECK (public.current_user_has_advisor_command_access());
CREATE POLICY "Advisor CMS delete" ON public.advisor_announcements FOR DELETE TO authenticated
  USING (public.current_user_has_advisor_command_access());

DROP POLICY IF EXISTS "Enable read access for all users" ON public.advisor_categories;
DROP POLICY IF EXISTS "Enable write access for advisor command users" ON public.advisor_categories;
CREATE POLICY "Advisor CMS read" ON public.advisor_categories FOR SELECT USING (true);
CREATE POLICY "Advisor CMS write" ON public.advisor_categories FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_advisor_command_access());
CREATE POLICY "Advisor CMS update" ON public.advisor_categories FOR UPDATE TO authenticated
  USING (public.current_user_has_advisor_command_access())
  WITH CHECK (public.current_user_has_advisor_command_access());
CREATE POLICY "Advisor CMS delete" ON public.advisor_categories FOR DELETE TO authenticated
  USING (public.current_user_has_advisor_command_access());

DROP POLICY IF EXISTS "Enable read access for all users" ON public.advisor_dashboard_widgets;
DROP POLICY IF EXISTS "Enable write access for advisor command users" ON public.advisor_dashboard_widgets;
CREATE POLICY "Advisor CMS read" ON public.advisor_dashboard_widgets FOR SELECT USING (true);
CREATE POLICY "Advisor CMS write" ON public.advisor_dashboard_widgets FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_advisor_command_access());
CREATE POLICY "Advisor CMS update" ON public.advisor_dashboard_widgets FOR UPDATE TO authenticated
  USING (public.current_user_has_advisor_command_access())
  WITH CHECK (public.current_user_has_advisor_command_access());
CREATE POLICY "Advisor CMS delete" ON public.advisor_dashboard_widgets FOR DELETE TO authenticated
  USING (public.current_user_has_advisor_command_access());

DROP POLICY IF EXISTS "Enable read access for all users" ON public.advisor_learning_paths;
DROP POLICY IF EXISTS "Enable write access for advisor command users" ON public.advisor_learning_paths;
CREATE POLICY "Advisor CMS read" ON public.advisor_learning_paths FOR SELECT USING (true);
CREATE POLICY "Advisor CMS write" ON public.advisor_learning_paths FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_advisor_command_access());
CREATE POLICY "Advisor CMS update" ON public.advisor_learning_paths FOR UPDATE TO authenticated
  USING (public.current_user_has_advisor_command_access())
  WITH CHECK (public.current_user_has_advisor_command_access());
CREATE POLICY "Advisor CMS delete" ON public.advisor_learning_paths FOR DELETE TO authenticated
  USING (public.current_user_has_advisor_command_access());

DROP POLICY IF EXISTS "Enable read access for all users" ON public.advisor_nav_menu;
DROP POLICY IF EXISTS "Enable write access for advisor command users" ON public.advisor_nav_menu;
CREATE POLICY "Advisor CMS read" ON public.advisor_nav_menu FOR SELECT USING (true);
CREATE POLICY "Advisor CMS write" ON public.advisor_nav_menu FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_advisor_command_access());
CREATE POLICY "Advisor CMS update" ON public.advisor_nav_menu FOR UPDATE TO authenticated
  USING (public.current_user_has_advisor_command_access())
  WITH CHECK (public.current_user_has_advisor_command_access());
CREATE POLICY "Advisor CMS delete" ON public.advisor_nav_menu FOR DELETE TO authenticated
  USING (public.current_user_has_advisor_command_access());

DROP POLICY IF EXISTS "Enable read access for all users" ON public.advisor_quick_links;
DROP POLICY IF EXISTS "Enable write access for advisor command users" ON public.advisor_quick_links;
CREATE POLICY "Advisor CMS read" ON public.advisor_quick_links FOR SELECT USING (true);
CREATE POLICY "Advisor CMS write" ON public.advisor_quick_links FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_advisor_command_access());
CREATE POLICY "Advisor CMS update" ON public.advisor_quick_links FOR UPDATE TO authenticated
  USING (public.current_user_has_advisor_command_access())
  WITH CHECK (public.current_user_has_advisor_command_access());
CREATE POLICY "Advisor CMS delete" ON public.advisor_quick_links FOR DELETE TO authenticated
  USING (public.current_user_has_advisor_command_access());

-- ============================================================================
-- 3. NOTIFICATION / USER PREFERENCE TABLES: view + update -> single SELECT, single UPDATE
-- ============================================================================

-- notification_events, notification_settings, notifications, user_preferences
-- Pattern: "Users view own" + "Users update own" - both have SELECT for same condition
-- Consolidate to one SELECT policy
DROP POLICY IF EXISTS "Users view own notification events" ON public.notification_events;
DROP POLICY IF EXISTS "Users update own notification events" ON public.notification_events;
CREATE POLICY "Users can view and update own notification events" ON public.notification_events
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update own notification settings" ON public.notification_settings;
CREATE POLICY "Users can manage own notification settings" ON public.notification_settings
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 4. DEVICE PUSH SUBSCRIPTIONS: 3 policies (delete, manage, update) -> 1
-- ============================================================================

DROP POLICY IF EXISTS "Users delete own push subscriptions" ON public.device_push_subscriptions;
DROP POLICY IF EXISTS "Users manage own push subscriptions" ON public.device_push_subscriptions;
DROP POLICY IF EXISTS "Users update own push subscriptions" ON public.device_push_subscriptions;
CREATE POLICY "Users can manage own push subscriptions" ON public.device_push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- 5. MATERNITY COVERAGE: "Anyone can view" + "Public can view" -> 1
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view maternity coverage" ON public.maternity_coverage;
DROP POLICY IF EXISTS "Public can view maternity coverage" ON public.maternity_coverage;
CREATE POLICY "Public can view maternity coverage" ON public.maternity_coverage
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view maternity stages" ON public.maternity_coverage_stages;
DROP POLICY IF EXISTS "Public can view maternity stages" ON public.maternity_coverage_stages;
CREATE POLICY "Public can view maternity stages" ON public.maternity_coverage_stages
  FOR SELECT USING (true);

-- ============================================================================
-- 6. ADVISORS: 4+ SELECT policies -> 1 SELECT + admin write-only
--    Policies: Allow public read, Anon can read, Anyone can view, advisors_select_policy, Admins can manage
-- ============================================================================

DROP POLICY IF EXISTS "Allow public read access to active advisors" ON public.advisors;
DROP POLICY IF EXISTS "Anon can read advisors" ON public.advisors;
DROP POLICY IF EXISTS "Anyone can view active advisors" ON public.advisors;
DROP POLICY IF EXISTS "Public can view active advisors, admins can manage" ON public.advisors;
DROP POLICY IF EXISTS "advisors_select_policy" ON public.advisors;
DROP POLICY IF EXISTS "Admins can manage advisors" ON public.advisors;
DROP POLICY IF EXISTS "advisors_insert_policy" ON public.advisors;
DROP POLICY IF EXISTS "advisors_update_policy" ON public.advisors;
DROP POLICY IF EXISTS "advisors_delete_policy" ON public.advisors;

CREATE POLICY "advisors_select" ON public.advisors FOR SELECT
  USING (
    (is_active = true AND status LIKE '%Active%')
    OR public.current_user_has_admin_access()
  );

CREATE POLICY "advisors_admin_insert" ON public.advisors FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_admin_access());

CREATE POLICY "advisors_admin_update" ON public.advisors FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

CREATE POLICY "advisors_admin_delete" ON public.advisors FOR DELETE TO authenticated
  USING (public.current_user_has_admin_access());

-- ============================================================================
-- 7. BENEFITS: Multiple SELECT policies -> 1 SELECT + admin write-only
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view active benefits" ON public.benefits;
DROP POLICY IF EXISTS "Public can view active benefits, admins can manage" ON public.benefits;
DROP POLICY IF EXISTS "benefits_public_read" ON public.benefits;
DROP POLICY IF EXISTS "Admins can manage benefits" ON public.benefits;

CREATE POLICY "benefits_select" ON public.benefits FOR SELECT
  USING (
    (is_active = true)
    OR public.current_user_has_admin_access()
  );

CREATE POLICY "benefits_admin_manage" ON public.benefits FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "benefits_admin_update" ON public.benefits FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "benefits_admin_delete" ON public.benefits FOR DELETE TO authenticated
  USING (public.current_user_has_admin_access());

-- ============================================================================
-- 8. BLOG_ARTICLES: Multiple SELECT policies -> 1 SELECT + admin write-only
-- ============================================================================

DROP POLICY IF EXISTS "Anon can read blog_articles" ON public.blog_articles;
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.blog_articles;
DROP POLICY IF EXISTS "Authenticated users can view all articles" ON public.blog_articles;
DROP POLICY IF EXISTS "Public can view published, authenticated can view all" ON public.blog_articles;
DROP POLICY IF EXISTS "Admins can delete articles" ON public.blog_articles;
DROP POLICY IF EXISTS "Admins can insert articles" ON public.blog_articles;
DROP POLICY IF EXISTS "Admins can update articles" ON public.blog_articles;

CREATE POLICY "blog_articles_select" ON public.blog_articles FOR SELECT
  USING (
    (is_published = true)
    OR (auth.role() = 'authenticated')
    OR public.current_user_has_admin_access()
  );

CREATE POLICY "blog_articles_admin_insert" ON public.blog_articles FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "blog_articles_admin_update" ON public.blog_articles FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "blog_articles_admin_delete" ON public.blog_articles FOR DELETE TO authenticated
  USING (public.current_user_has_admin_access());

-- ============================================================================
-- 9. RATE_CONFIGURATION, EDUCATIONAL_CONTENT: Multiple SELECT -> 1 each
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view active rate configuration" ON public.rate_configuration;
DROP POLICY IF EXISTS "Public can view active rates, admins can manage" ON public.rate_configuration;
DROP POLICY IF EXISTS "rate_config_public_read" ON public.rate_configuration;
DROP POLICY IF EXISTS "Admins can manage rate configuration" ON public.rate_configuration;

CREATE POLICY "rate_configuration_select" ON public.rate_configuration FOR SELECT
  USING (
    (is_active = true)
    OR public.current_user_has_admin_access()
  );

CREATE POLICY "rate_configuration_admin_manage" ON public.rate_configuration FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "rate_configuration_admin_update" ON public.rate_configuration FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "rate_configuration_admin_delete" ON public.rate_configuration FOR DELETE TO authenticated
  USING (public.current_user_has_admin_access());

DROP POLICY IF EXISTS "Anyone can view active educational content" ON public.educational_content;
DROP POLICY IF EXISTS "Public can view active content, admins can manage" ON public.educational_content;
DROP POLICY IF EXISTS "educational_content_public_read" ON public.educational_content;
DROP POLICY IF EXISTS "Admins can manage educational content" ON public.educational_content;

CREATE POLICY "educational_content_select" ON public.educational_content FOR SELECT
  USING (
    (is_active = true)
    OR public.current_user_has_admin_access()
  );

CREATE POLICY "educational_content_admin_manage" ON public.educational_content FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "educational_content_admin_update" ON public.educational_content FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "educational_content_admin_delete" ON public.educational_content FOR DELETE TO authenticated
  USING (public.current_user_has_admin_access());

-- ============================================================================
-- 10. EXTERNAL_LMS: Multiple SELECT -> 1 each
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage LMS courses" ON public.external_lms_courses;
DROP POLICY IF EXISTS "Anyone can view active LMS courses" ON public.external_lms_courses;

CREATE POLICY "external_lms_courses_select" ON public.external_lms_courses FOR SELECT
  USING (
    (is_active = true)
    OR public.current_user_has_admin_access()
  );

CREATE POLICY "external_lms_courses_admin_manage" ON public.external_lms_courses FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "external_lms_courses_admin_update" ON public.external_lms_courses FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "external_lms_courses_admin_delete" ON public.external_lms_courses FOR DELETE TO authenticated
  USING (public.current_user_has_admin_access());

--

DROP POLICY IF EXISTS "Admins can manage LMS lessons" ON public.external_lms_lessons;
DROP POLICY IF EXISTS "Anyone can view LMS lessons" ON public.external_lms_lessons;

CREATE POLICY "external_lms_lessons_select" ON public.external_lms_lessons FOR SELECT
  USING (
    true
  );

CREATE POLICY "external_lms_lessons_admin_manage" ON public.external_lms_lessons FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "external_lms_lessons_admin_update" ON public.external_lms_lessons FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "external_lms_lessons_admin_delete" ON public.external_lms_lessons FOR DELETE TO authenticated
  USING (public.current_user_has_admin_access());

-- ============================================================================
-- 11. ZOHO_LEAD_SUBMISSIONS (anon): 2 SELECT -> 1
-- ============================================================================

DROP POLICY IF EXISTS "Anon can read zoho_lead_submissions" ON public.zoho_lead_submissions;
DROP POLICY IF EXISTS "Anonymous users can view just-inserted submissions" ON public.zoho_lead_submissions;

-- Anon: only just-inserted (for .insert().select() after form submit)
CREATE POLICY "zoho_lead_submissions_anon_select" ON public.zoho_lead_submissions
  FOR SELECT TO anon
  USING (created_at > (now() - interval '5 seconds'));

-- ============================================================================
-- 12. TRACKING_PLATFORMS: 2 SELECT -> 1
-- ============================================================================

DROP POLICY IF EXISTS "Anon can read tracking_platforms" ON public.tracking_platforms;
DROP POLICY IF EXISTS "Public can view active tracking platforms" ON public.tracking_platforms;

CREATE POLICY "tracking_platforms_select" ON public.tracking_platforms FOR SELECT
  USING (true);

COMMIT;

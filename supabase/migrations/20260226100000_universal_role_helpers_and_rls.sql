-- ============================================================================
-- Migration: Universal Role Helpers and RLS Updates
-- Description:
--   1. Create helper functions that check BOTH user_roles and profiles
--   2. Update all RLS policies that use profiles.role to also allow user_roles
--      so super_admins (user_roles only) can access admin resources
-- ============================================================================

-- ============================================================================
-- PART 1: Helper Functions
-- ============================================================================

-- Admin access: user_roles (super_admin, admin) OR profiles (admin, staff, superadmin)
CREATE OR REPLACE FUNCTION public.current_user_has_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'superadmin'))
  );
END;
$$;

-- Super admin only: user_roles (super_admin) OR profiles (superadmin)
CREATE OR REPLACE FUNCTION public.current_user_has_super_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );
END;
$$;

-- Advisor or admin: user_roles (super_admin, admin, advisor) OR profiles (admin, advisor)
CREATE OR REPLACE FUNCTION public.current_user_has_advisor_or_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'advisor'))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'advisor'))
  );
END;
$$;

-- Extended: admin, staff, superadmin, advisor (for lead notifications etc)
CREATE OR REPLACE FUNCTION public.current_user_has_extended_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'advisor'))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff', 'superadmin', 'advisor'))
  );
END;
$$;

-- Admin, advisor, staff (for advisor command center)
CREATE OR REPLACE FUNCTION public.current_user_has_advisor_command_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'advisor'))
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'advisor', 'staff'))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_has_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_super_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_advisor_or_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_extended_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_advisor_command_access() TO authenticated;

-- ============================================================================
-- PART 1b: Storage - advisor-documents bucket (admin/super_admin from user_roles)
-- ============================================================================

DROP POLICY IF EXISTS "advisor_documents_admin_insert" ON storage.objects;
CREATE POLICY "advisor_documents_admin_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'advisor-documents'
    AND (current_user_has_admin_access() OR current_user_has_super_admin_access())
  );

DROP POLICY IF EXISTS "advisor_documents_admin_update" ON storage.objects;
CREATE POLICY "advisor_documents_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'advisor-documents'
    AND (current_user_has_admin_access() OR current_user_has_super_admin_access())
  );

DROP POLICY IF EXISTS "advisor_documents_admin_delete" ON storage.objects;
CREATE POLICY "advisor_documents_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'advisor-documents'
    AND (current_user_has_admin_access() OR current_user_has_super_admin_access())
  );

-- ============================================================================
-- PART 2: Conversion Tracking (guarded — tables may not exist on all envs)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversion_events') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read conversion events" ON conversion_events';
    EXECUTE 'CREATE POLICY "Admins can read conversion events" ON conversion_events FOR SELECT TO authenticated USING (current_user_has_admin_access())';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversion_funnel') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read funnel data" ON conversion_funnel';
    EXECUTE 'CREATE POLICY "Admins can read funnel data" ON conversion_funnel FOR SELECT TO authenticated USING (current_user_has_admin_access())';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ab_test_variants') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage tests" ON ab_test_variants';
    EXECUTE 'CREATE POLICY "Admins can manage tests" ON ab_test_variants FOR ALL TO authenticated USING (current_user_has_admin_access()) WITH CHECK (current_user_has_admin_access())';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ab_test_results') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read all test results" ON ab_test_results';
    EXECUTE 'CREATE POLICY "Admins can read all test results" ON ab_test_results FOR SELECT TO authenticated USING (current_user_has_admin_access())';
  END IF;
END $$;

-- ============================================================================
-- PART 3: Admin Analytics Tables
-- ============================================================================

DROP POLICY IF EXISTS "Admin can view site analytics" ON site_analytics;
CREATE POLICY "Admin can view site analytics"
  ON site_analytics FOR SELECT TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admin can manage site analytics" ON site_analytics;
CREATE POLICY "Admin can manage site analytics"
  ON site_analytics FOR ALL TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admin can view marketing campaigns" ON marketing_campaigns;
CREATE POLICY "Admin can view marketing campaigns"
  ON marketing_campaigns FOR SELECT TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admin can manage marketing campaigns" ON marketing_campaigns;
CREATE POLICY "Admin can manage marketing campaigns"
  ON marketing_campaigns FOR ALL TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admin can view content analytics" ON content_analytics;
CREATE POLICY "Admin can view content analytics"
  ON content_analytics FOR SELECT TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admin can manage content analytics" ON content_analytics;
CREATE POLICY "Admin can manage content analytics"
  ON content_analytics FOR ALL TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admin can view SEO metadata" ON seo_metadata;
CREATE POLICY "Admin can view SEO metadata"
  ON seo_metadata FOR SELECT TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admin can manage SEO metadata" ON seo_metadata;
CREATE POLICY "Admin can manage SEO metadata"
  ON seo_metadata FOR ALL TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admin can view all site settings" ON site_settings;
CREATE POLICY "Admin can view all site settings"
  ON site_settings FOR SELECT TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admin can manage site settings" ON site_settings;
CREATE POLICY "Admin can manage site settings"
  ON site_settings FOR ALL TO authenticated
  USING (current_user_has_admin_access());

-- ============================================================================
-- PART 4: Advisors Table (advisor command center migration)
-- ============================================================================

DROP POLICY IF EXISTS "advisors_insert_policy" ON advisors;
CREATE POLICY "advisors_insert_policy" ON advisors FOR INSERT WITH CHECK (
  current_user_has_advisor_command_access()
);

DROP POLICY IF EXISTS "advisors_update_policy" ON advisors;
CREATE POLICY "advisors_update_policy" ON advisors FOR UPDATE USING (
  current_user_has_advisor_command_access()
);

DROP POLICY IF EXISTS "advisors_delete_policy" ON advisors;
CREATE POLICY "advisors_delete_policy" ON advisors FOR DELETE USING (
  current_user_has_admin_access()
);

-- ============================================================================
-- PART 5: SEO Analytics
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'seo_analytics') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view SEO analytics" ON seo_analytics';
    EXECUTE 'CREATE POLICY "Admins can view SEO analytics" ON seo_analytics FOR SELECT TO authenticated USING (current_user_has_admin_access() OR current_user_has_super_admin_access())';
    EXECUTE 'DROP POLICY IF EXISTS "Staff can view SEO analytics" ON seo_analytics';
    EXECUTE 'CREATE POLICY "Staff can view SEO analytics" ON seo_analytics FOR SELECT TO authenticated USING (current_user_has_admin_access())';
  END IF;
END $$;

-- ============================================================================
-- PART 6: Advisor Plan Resources and SOP Documents
-- ============================================================================

DROP POLICY IF EXISTS "advisor_plan_resources_admin_all" ON advisor_plan_resources;
CREATE POLICY "advisor_plan_resources_admin_all" ON advisor_plan_resources
  FOR ALL TO authenticated
  USING (current_user_has_admin_access() OR current_user_has_super_admin_access())
  WITH CHECK (current_user_has_admin_access() OR current_user_has_super_admin_access());

DROP POLICY IF EXISTS "sop_documents_admin_all" ON sop_documents;
CREATE POLICY "sop_documents_admin_all" ON sop_documents
  FOR ALL TO authenticated
  USING (current_user_has_admin_access() OR current_user_has_super_admin_access())
  WITH CHECK (current_user_has_admin_access() OR current_user_has_super_admin_access());

-- ============================================================================
-- PART 7: WordPress Courses
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wordpress_courses') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage courses" ON wordpress_courses';
    EXECUTE 'CREATE POLICY "Admins can manage courses" ON wordpress_courses FOR ALL TO authenticated USING (current_user_has_admin_access())';
  END IF;
END $$;

-- ============================================================================
-- PART 8: Geo Settings
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'geo_settings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage geo settings" ON geo_settings';
    EXECUTE 'CREATE POLICY "Admins can manage geo settings" ON geo_settings FOR ALL TO authenticated USING (current_user_has_admin_access())';
  END IF;
END $$;

-- ============================================================================
-- PART 9: Analytics Tracking Configuration
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analytics_tracking_configuration') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage tracking config" ON analytics_tracking_configuration';
    EXECUTE 'CREATE POLICY "Admins can manage tracking config" ON analytics_tracking_configuration FOR ALL TO authenticated USING (current_user_has_admin_access())';
    EXECUTE 'DROP POLICY IF EXISTS "Staff can view tracking config" ON analytics_tracking_configuration';
    EXECUTE 'CREATE POLICY "Staff can view tracking config" ON analytics_tracking_configuration FOR SELECT TO authenticated USING (current_user_has_admin_access())';
  END IF;
END $$;

-- ============================================================================
-- PART 10: Zoho Lead and CRM Lead Plan Interests
-- ============================================================================

DROP POLICY IF EXISTS "crm_lead_plan_interests_select" ON crm_lead_plan_interests;
CREATE POLICY "crm_lead_plan_interests_select" ON crm_lead_plan_interests
  FOR SELECT TO authenticated
  USING (
    current_user_has_admin_access()
    OR current_user_has_super_admin_access()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'crm_user')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  );

DROP POLICY IF EXISTS "crm_lead_plan_interests_insert" ON crm_lead_plan_interests;
CREATE POLICY "crm_lead_plan_interests_insert" ON crm_lead_plan_interests
  FOR INSERT TO authenticated
  WITH CHECK (
    current_user_has_admin_access()
    OR current_user_has_super_admin_access()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'crm_user')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  );

DROP POLICY IF EXISTS "crm_lead_plan_interests_update" ON crm_lead_plan_interests;
CREATE POLICY "crm_lead_plan_interests_update" ON crm_lead_plan_interests
  FOR UPDATE TO authenticated
  USING (
    current_user_has_admin_access()
    OR current_user_has_super_admin_access()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'crm_user')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  )
  WITH CHECK (
    current_user_has_admin_access()
    OR current_user_has_super_admin_access()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'crm_user')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
  );

DROP POLICY IF EXISTS "crm_lead_plan_interests_delete" ON crm_lead_plan_interests;
CREATE POLICY "crm_lead_plan_interests_delete" ON crm_lead_plan_interests
  FOR DELETE TO authenticated
  USING (current_user_has_admin_access() OR current_user_has_super_admin_access());

DROP POLICY IF EXISTS "Admins can view all lead submissions" ON zoho_lead_submissions;
CREATE POLICY "Admins can view all lead submissions"
  ON zoho_lead_submissions FOR SELECT TO authenticated
  USING (current_user_has_admin_access() OR current_user_has_super_admin_access());

DROP POLICY IF EXISTS "Admins can update lead submissions" ON zoho_lead_submissions;
CREATE POLICY "Admins can update lead submissions"
  ON zoho_lead_submissions FOR UPDATE TO authenticated
  USING (current_user_has_admin_access() OR current_user_has_super_admin_access())
  WITH CHECK (current_user_has_admin_access() OR current_user_has_super_admin_access());

-- ============================================================================
-- PART 11: Realtime Page Views
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'realtime_page_views') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view page views" ON realtime_page_views';
    EXECUTE 'CREATE POLICY "Admins can view page views" ON realtime_page_views FOR SELECT TO authenticated USING (current_user_has_admin_access())';
  END IF;
END $$;

-- ============================================================================
-- PART 12: Newsletter Subscribers
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'newsletter_subscribers') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view subscribers" ON newsletter_subscribers';
    EXECUTE 'CREATE POLICY "Admins can view subscribers" ON newsletter_subscribers FOR SELECT TO authenticated USING (current_user_has_admin_access() OR current_user_has_super_admin_access())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage subscribers" ON newsletter_subscribers';
    EXECUTE 'CREATE POLICY "Admins can manage subscribers" ON newsletter_subscribers FOR ALL TO authenticated USING (current_user_has_admin_access() OR current_user_has_super_admin_access())';
  END IF;
END $$;

-- ============================================================================
-- PART 13: Plans and Plan Pricing
-- ============================================================================

-- Update SELECT policies so admins (user_roles + profiles) can view all plans
DROP POLICY IF EXISTS "Public can view active plans, admins can view all" ON plans;
CREATE POLICY "Public can view active plans, admins can view all"
  ON plans FOR SELECT
  USING (is_active = true OR current_user_has_admin_access() OR current_user_has_super_admin_access());

DROP POLICY IF EXISTS "Public can view pricing of active plans" ON plan_pricing;
CREATE POLICY "Public can view pricing of active plans"
  ON plan_pricing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_pricing.plan_id
      AND plans.is_active = true
    )
    OR current_user_has_admin_access()
    OR current_user_has_super_admin_access()
  );

DROP POLICY IF EXISTS "Admins can insert plans" ON plans;
CREATE POLICY "Admins can insert plans"
  ON plans FOR INSERT TO authenticated
  WITH CHECK (current_user_has_admin_access() OR current_user_has_super_admin_access());

DROP POLICY IF EXISTS "Admins can update plans" ON plans;
CREATE POLICY "Admins can update plans"
  ON plans FOR UPDATE TO authenticated
  USING (current_user_has_admin_access() OR current_user_has_super_admin_access())
  WITH CHECK (current_user_has_admin_access() OR current_user_has_super_admin_access());

DROP POLICY IF EXISTS "Admins can delete plans" ON plans;
CREATE POLICY "Admins can delete plans"
  ON plans FOR DELETE TO authenticated
  USING (current_user_has_admin_access() OR current_user_has_super_admin_access());

DROP POLICY IF EXISTS "Admins can insert plan pricing" ON plan_pricing;
CREATE POLICY "Admins can insert plan pricing"
  ON plan_pricing FOR INSERT TO authenticated
  WITH CHECK (current_user_has_admin_access() OR current_user_has_super_admin_access());

DROP POLICY IF EXISTS "Admins can update plan pricing" ON plan_pricing;
CREATE POLICY "Admins can update plan pricing"
  ON plan_pricing FOR UPDATE TO authenticated
  USING (current_user_has_admin_access() OR current_user_has_super_admin_access())
  WITH CHECK (current_user_has_admin_access() OR current_user_has_super_admin_access());

DROP POLICY IF EXISTS "Admins can delete plan pricing" ON plan_pricing;
CREATE POLICY "Admins can delete plan pricing"
  ON plan_pricing FOR DELETE TO authenticated
  USING (current_user_has_admin_access() OR current_user_has_super_admin_access());

-- ============================================================================
-- PART 14: Comprehensive Analytics
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comprehensive_analytics') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view comprehensive analytics" ON comprehensive_analytics';
    EXECUTE 'CREATE POLICY "Admins can view comprehensive analytics" ON comprehensive_analytics FOR SELECT TO authenticated USING (current_user_has_admin_access())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage comprehensive analytics" ON comprehensive_analytics';
    EXECUTE 'CREATE POLICY "Admins can manage comprehensive analytics" ON comprehensive_analytics FOR ALL TO authenticated USING (current_user_has_admin_access() OR current_user_has_super_admin_access())';
  END IF;
END $$;

-- ============================================================================
-- PART 15: Zoho Lead Tracking (20251120162640)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'zoho_lead_tracking') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view lead tracking" ON zoho_lead_tracking';
    EXECUTE 'CREATE POLICY "Admins can view lead tracking" ON zoho_lead_tracking FOR SELECT TO authenticated USING (current_user_has_admin_access() OR current_user_has_super_admin_access())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage lead tracking" ON zoho_lead_tracking';
    EXECUTE 'CREATE POLICY "Admins can manage lead tracking" ON zoho_lead_tracking FOR ALL TO authenticated USING (current_user_has_admin_access() OR current_user_has_super_admin_access())';
  END IF;
END $$;

-- ============================================================================
-- PART 16: Training Modules
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'training_modules') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage training modules" ON training_modules';
    EXECUTE 'CREATE POLICY "Admins can manage training modules" ON training_modules FOR ALL TO authenticated USING (current_user_has_admin_access() OR current_user_has_super_admin_access())';
  END IF;
END $$;

-- ============================================================================
-- PART 17: Advisor Content System
-- ============================================================================

DROP POLICY IF EXISTS "Advisors and admins can view categories" ON advisor_content_categories;
CREATE POLICY "Advisors and admins can view categories"
  ON advisor_content_categories FOR SELECT TO authenticated
  USING (current_user_has_advisor_or_admin_access());

DROP POLICY IF EXISTS "Only admins can manage categories" ON advisor_content_categories;
CREATE POLICY "Only admins can manage categories"
  ON advisor_content_categories FOR ALL TO authenticated
  USING (current_user_has_admin_access())
  WITH CHECK (current_user_has_admin_access());

DROP POLICY IF EXISTS "Advisors can view published content" ON advisor_content;
CREATE POLICY "Advisors can view published content"
  ON advisor_content FOR SELECT TO authenticated
  USING (
    is_published = true AND current_user_has_advisor_or_admin_access()
  );

DROP POLICY IF EXISTS "Admins can view all content" ON advisor_content;
CREATE POLICY "Admins can view all content"
  ON advisor_content FOR SELECT TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Only admins can insert content" ON advisor_content;
CREATE POLICY "Only admins can insert content"
  ON advisor_content FOR INSERT TO authenticated
  WITH CHECK (current_user_has_admin_access());

DROP POLICY IF EXISTS "Only admins can update content" ON advisor_content;
CREATE POLICY "Only admins can update content"
  ON advisor_content FOR UPDATE TO authenticated
  USING (current_user_has_admin_access())
  WITH CHECK (current_user_has_admin_access());

DROP POLICY IF EXISTS "Only admins can delete content" ON advisor_content;
CREATE POLICY "Only admins can delete content"
  ON advisor_content FOR DELETE TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Advisors can view their own views" ON advisor_content_views;
CREATE POLICY "Advisors can view their own views"
  ON advisor_content_views FOR SELECT TO authenticated
  USING (advisor_id = auth.uid() OR current_user_has_admin_access());

DROP POLICY IF EXISTS "Advisors can insert their own views" ON advisor_content_views;
CREATE POLICY "Advisors can insert their own views"
  ON advisor_content_views FOR INSERT TO authenticated
  WITH CHECK (advisor_id = auth.uid() AND current_user_has_advisor_or_admin_access());

DROP POLICY IF EXISTS "Advisors can view their own bookmarks" ON advisor_content_bookmarks;
CREATE POLICY "Advisors can view their own bookmarks"
  ON advisor_content_bookmarks FOR SELECT TO authenticated
  USING (advisor_id = auth.uid() OR current_user_has_admin_access());

-- ============================================================================
-- PART 18: Advisor Training
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'advisor_training_modules') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage advisor training" ON advisor_training_modules';
    EXECUTE 'CREATE POLICY "Admins can manage advisor training" ON advisor_training_modules FOR ALL TO authenticated USING (current_user_has_admin_access())';
  END IF;
END $$;

-- ============================================================================
-- PART 19: Gemini Blog Newsletter
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage prompts" ON gemini_prompts;
CREATE POLICY "Admins can manage prompts"
  ON gemini_prompts FOR ALL TO authenticated
  USING (current_user_has_super_admin_access());

DROP POLICY IF EXISTS "Admins can view generation logs" ON blog_generation_logs;
CREATE POLICY "Admins can view generation logs"
  ON blog_generation_logs FOR SELECT TO authenticated
  USING (current_user_has_advisor_or_admin_access());

DROP POLICY IF EXISTS "Admins can manage campaigns" ON newsletter_campaigns;
CREATE POLICY "Admins can manage campaigns"
  ON newsletter_campaigns FOR ALL TO authenticated
  USING (current_user_has_advisor_or_admin_access());

DROP POLICY IF EXISTS "Admins can view queue" ON newsletter_queue;
CREATE POLICY "Admins can view queue"
  ON newsletter_queue FOR SELECT TO authenticated
  USING (current_user_has_advisor_or_admin_access());

DROP POLICY IF EXISTS "Admins can manage content calendar" ON content_calendar;
CREATE POLICY "Admins can manage content calendar"
  ON content_calendar FOR ALL TO authenticated
  USING (current_user_has_advisor_or_admin_access());

DROP POLICY IF EXISTS "Admins can view webhook logs" ON webhook_delivery_logs;
CREATE POLICY "Admins can view webhook logs"
  ON webhook_delivery_logs FOR SELECT TO authenticated
  USING (current_user_has_advisor_or_admin_access());

DROP POLICY IF EXISTS "Admins can manage templates" ON email_templates;
CREATE POLICY "Admins can manage templates"
  ON email_templates FOR ALL TO authenticated
  USING (current_user_has_super_admin_access());

-- ============================================================================
-- PART 20: Bulletin Email
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bulletin_email_notifications') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage bulletin emails" ON bulletin_email_notifications';
    EXECUTE 'CREATE POLICY "Admins can manage bulletin emails" ON bulletin_email_notifications FOR ALL TO authenticated USING (current_user_has_admin_access() OR current_user_has_super_admin_access())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view bulletin emails" ON bulletin_email_notifications';
    EXECUTE 'CREATE POLICY "Admins can view bulletin emails" ON bulletin_email_notifications FOR SELECT TO authenticated USING (current_user_has_admin_access() OR current_user_has_super_admin_access())';
  END IF;
END $$;

-- ============================================================================
-- PART 21: Lead Notifications
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lead_notifications') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view lead notifications" ON lead_notifications';
    EXECUTE 'CREATE POLICY "Admins can view lead notifications" ON lead_notifications FOR SELECT TO authenticated USING (current_user_has_extended_admin_access())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage lead notifications" ON lead_notifications';
    EXECUTE 'CREATE POLICY "Admins can manage lead notifications" ON lead_notifications FOR ALL TO authenticated USING (current_user_has_extended_admin_access())';
  END IF;
END $$;

-- ============================================================================
-- PART 22: Championship/CRM Email System
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all org signatures" ON crm_email_signatures;
CREATE POLICY "Admins can view all org signatures"
  ON crm_email_signatures FOR SELECT TO authenticated
  USING (current_user_has_admin_access() OR current_user_has_super_admin_access());

DROP POLICY IF EXISTS "Users can view attachments from visible emails" ON crm_email_attachments;
CREATE POLICY "Users can view attachments from visible emails"
  ON crm_email_attachments FOR SELECT TO authenticated
  USING (
    email_id IN (
      SELECT id FROM crm_email_log
      WHERE sent_by = auth.uid()
      OR current_user_has_admin_access()
      OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('crm_user', 'admin', 'super_admin'))
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
    )
  );

DROP POLICY IF EXISTS "Users can view org threads" ON crm_email_threads;
CREATE POLICY "Users can view org threads"
  ON crm_email_threads FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid() AND status = 'active')
    OR current_user_has_admin_access()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('crm_user', 'admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Users can manage org threads" ON crm_email_threads;
CREATE POLICY "Users can manage org threads"
  ON crm_email_threads FOR ALL TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid() AND status = 'active')
    OR current_user_has_admin_access()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('crm_user', 'admin', 'super_admin'))
  )
  WITH CHECK (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid() AND status = 'active')
    OR current_user_has_admin_access()
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('crm_user', 'admin', 'super_admin'))
  );

-- ============================================================================
-- PART 23: Admin Analytics (20251108000000 - "Admins can..." policy names)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view site analytics" ON site_analytics;
CREATE POLICY "Admins can view site analytics"
  ON site_analytics FOR SELECT TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admins can insert site analytics" ON site_analytics;
CREATE POLICY "Admins can insert site analytics"
  ON site_analytics FOR INSERT TO authenticated
  WITH CHECK (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admins can update site analytics" ON site_analytics;
CREATE POLICY "Admins can update site analytics"
  ON site_analytics FOR UPDATE TO authenticated
  USING (current_user_has_admin_access())
  WITH CHECK (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admins can view campaigns" ON marketing_campaigns;
CREATE POLICY "Admins can view campaigns"
  ON marketing_campaigns FOR SELECT TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admins can manage campaigns" ON marketing_campaigns;
CREATE POLICY "Admins can manage campaigns"
  ON marketing_campaigns FOR ALL TO authenticated
  USING (current_user_has_admin_access())
  WITH CHECK (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admins can view content analytics" ON content_analytics;
CREATE POLICY "Admins can view content analytics"
  ON content_analytics FOR SELECT TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admins can manage content analytics" ON content_analytics;
CREATE POLICY "Admins can manage content analytics"
  ON content_analytics FOR ALL TO authenticated
  USING (current_user_has_admin_access())
  WITH CHECK (current_user_has_admin_access());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_actions_log') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view action logs" ON admin_actions_log';
    EXECUTE 'CREATE POLICY "Admins can view action logs" ON admin_actions_log FOR SELECT TO authenticated USING (current_user_has_admin_access())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can insert action logs" ON admin_actions_log';
    EXECUTE 'CREATE POLICY "Admins can insert action logs" ON admin_actions_log FOR INSERT TO authenticated WITH CHECK (current_user_has_admin_access())';
  END IF;
END $$;

DROP POLICY IF EXISTS "Admins can view site settings" ON site_settings;
CREATE POLICY "Admins can view site settings"
  ON site_settings FOR SELECT TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL TO authenticated
  USING (current_user_has_admin_access())
  WITH CHECK (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admins can view SEO metadata" ON seo_metadata;
CREATE POLICY "Admins can view SEO metadata"
  ON seo_metadata FOR SELECT TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admins can manage SEO metadata" ON seo_metadata;
CREATE POLICY "Admins can manage SEO metadata"
  ON seo_metadata FOR ALL TO authenticated
  USING (current_user_has_admin_access())
  WITH CHECK (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admins can view email templates" ON email_templates;
CREATE POLICY "Admins can view email templates"
  ON email_templates FOR SELECT TO authenticated
  USING (current_user_has_admin_access());

DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL TO authenticated
  USING (current_user_has_admin_access())
  WITH CHECK (current_user_has_admin_access());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'site_redirects') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view redirects" ON site_redirects';
    EXECUTE 'CREATE POLICY "Admins can view redirects" ON site_redirects FOR SELECT TO authenticated USING (current_user_has_admin_access())';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage redirects" ON site_redirects';
    EXECUTE 'CREATE POLICY "Admins can manage redirects" ON site_redirects FOR ALL TO authenticated USING (current_user_has_admin_access()) WITH CHECK (current_user_has_admin_access())';
  END IF;
END $$;

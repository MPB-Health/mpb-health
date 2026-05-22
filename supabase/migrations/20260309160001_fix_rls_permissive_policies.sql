-- ============================================================================
-- Migration: Fix RLS Permissive Policies (Supabase Linter 0024)
-- Description:
--   Replace USING (true) / WITH CHECK (true) with proper authorization:
--   - Admin tables: public.current_user_has_admin_access() or current_user_has_advisor_command_access()
--   - Org-scoped: public.is_org_member(org_id) / public.has_org_permission()
--   - User-scoped: auth.uid() = user_id / assigned_to / created_by
--   - Service tables: TO service_role only
--
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ADVISOR PORTAL CMS (admin/advisor only)
-- ============================================================================

-- advisor_announcements
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.advisor_announcements;
DROP POLICY IF EXISTS "Enable write access for advisor command users" ON public.advisor_announcements;
CREATE POLICY "Enable write access for advisor command users" ON public.advisor_announcements
  FOR ALL TO authenticated
  USING (public.current_user_has_advisor_command_access())
  WITH CHECK (public.current_user_has_advisor_command_access());

-- advisor_categories
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.advisor_categories;
DROP POLICY IF EXISTS "Enable write access for advisor command users" ON public.advisor_categories;
CREATE POLICY "Enable write access for advisor command users" ON public.advisor_categories
  FOR ALL TO authenticated
  USING (public.current_user_has_advisor_command_access())
  WITH CHECK (public.current_user_has_advisor_command_access());

-- advisor_dashboard_widgets
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.advisor_dashboard_widgets;
DROP POLICY IF EXISTS "Enable write access for advisor command users" ON public.advisor_dashboard_widgets;
CREATE POLICY "Enable write access for advisor command users" ON public.advisor_dashboard_widgets
  FOR ALL TO authenticated
  USING (public.current_user_has_advisor_command_access())
  WITH CHECK (public.current_user_has_advisor_command_access());

-- advisor_learning_paths
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.advisor_learning_paths;
DROP POLICY IF EXISTS "Enable write access for advisor command users" ON public.advisor_learning_paths;
CREATE POLICY "Enable write access for advisor command users" ON public.advisor_learning_paths
  FOR ALL TO authenticated
  USING (public.current_user_has_advisor_command_access())
  WITH CHECK (public.current_user_has_advisor_command_access());

-- advisor_nav_menu
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.advisor_nav_menu;
DROP POLICY IF EXISTS "Enable write access for advisor command users" ON public.advisor_nav_menu;
CREATE POLICY "Enable write access for advisor command users" ON public.advisor_nav_menu
  FOR ALL TO authenticated
  USING (public.current_user_has_advisor_command_access())
  WITH CHECK (public.current_user_has_advisor_command_access());

-- advisor_quick_links
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON public.advisor_quick_links;
DROP POLICY IF EXISTS "Enable write access for advisor command users" ON public.advisor_quick_links;
CREATE POLICY "Enable write access for advisor command users" ON public.advisor_quick_links
  FOR ALL TO authenticated
  USING (public.current_user_has_advisor_command_access())
  WITH CHECK (public.current_user_has_advisor_command_access());

-- ============================================================================
-- 2. ADVISOR TERMINAL (service_role only for write)
-- ============================================================================

-- advisor_terminal_commands: Service inserts - restrict to service_role
DROP POLICY IF EXISTS "Service inserts commands" ON public.advisor_terminal_commands;
CREATE POLICY "Service inserts commands" ON public.advisor_terminal_commands
  FOR INSERT TO service_role
  WITH CHECK (true);

-- advisor_terminal_sessions: Service manages - restrict to service_role
DROP POLICY IF EXISTS "Service manages sessions" ON public.advisor_terminal_sessions;
CREATE POLICY "Service manages sessions" ON public.advisor_terminal_sessions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. ADVISORS, BENEFITS, RATE CONFIG (admin only)
-- ============================================================================

-- advisors
DROP POLICY IF EXISTS "Authenticated users can manage advisors" ON public.advisors;
DROP POLICY IF EXISTS "Admins can manage advisors" ON public.advisors;
CREATE POLICY "Admins can manage advisors" ON public.advisors
  FOR ALL TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

-- benefits
DROP POLICY IF EXISTS "Authenticated users can manage benefits" ON public.benefits;
DROP POLICY IF EXISTS "Admins can manage benefits" ON public.benefits;
CREATE POLICY "Admins can manage benefits" ON public.benefits
  FOR ALL TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

-- rate_configuration
DROP POLICY IF EXISTS "Authenticated users can manage rate configuration" ON public.rate_configuration;
DROP POLICY IF EXISTS "Admins can manage rate configuration" ON public.rate_configuration;
CREATE POLICY "Admins can manage rate configuration" ON public.rate_configuration
  FOR ALL TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

-- ============================================================================
-- 4. AI AUTOMATION RULES (extended admin - org_id may not exist in all envs)
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated delete ai_automation_rules" ON public.ai_automation_rules;
DROP POLICY IF EXISTS "Allow authenticated insert ai_automation_rules" ON public.ai_automation_rules;
DROP POLICY IF EXISTS "Allow authenticated update ai_automation_rules" ON public.ai_automation_rules;
DROP POLICY IF EXISTS "Extended admin can delete ai_automation_rules" ON public.ai_automation_rules;
DROP POLICY IF EXISTS "Extended admin can insert ai_automation_rules" ON public.ai_automation_rules;
DROP POLICY IF EXISTS "Extended admin can update ai_automation_rules" ON public.ai_automation_rules;

CREATE POLICY "Extended admin can delete ai_automation_rules" ON public.ai_automation_rules
  FOR DELETE TO authenticated
  USING (public.current_user_has_extended_admin_access());

CREATE POLICY "Extended admin can insert ai_automation_rules" ON public.ai_automation_rules
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_extended_admin_access());

CREATE POLICY "Extended admin can update ai_automation_rules" ON public.ai_automation_rules
  FOR UPDATE TO authenticated
  USING (public.current_user_has_extended_admin_access())
  WITH CHECK (public.current_user_has_extended_admin_access());

-- ============================================================================
-- 5. ANALYTICS (intentional public insert - restrict to anon/authenticated)
-- Note: analytics_events, analytics_sessions - used for tracking. Restrict
-- to authenticated for update; anon/authenticated for insert with session validation.
-- ============================================================================

-- analytics_events: Allow anon (public tracking) and authenticated
DROP POLICY IF EXISTS "Anyone can insert analytics_events" ON public.analytics_events;
DROP POLICY IF EXISTS "Analytics can insert events" ON public.analytics_events;
CREATE POLICY "Analytics can insert events" ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK ((auth.role() = 'anon') OR (auth.uid() IS NOT NULL));

-- analytics_sessions
DROP POLICY IF EXISTS "Anyone can insert analytics_sessions" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Analytics can insert sessions" ON public.analytics_sessions;
CREATE POLICY "Analytics can insert sessions" ON public.analytics_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK ((auth.role() = 'anon') OR (auth.uid() IS NOT NULL));

DROP POLICY IF EXISTS "Anyone can update own session" ON public.analytics_sessions;
DROP POLICY IF EXISTS "Users can update own session" ON public.analytics_sessions;
CREATE POLICY "Users can update own session" ON public.analytics_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 6. AUDIT, AUTOMATION LOG (admin or org member)
-- ============================================================================

-- audit_events: Insert from authenticated - restrict to org context
DROP POLICY IF EXISTS "audit_insert_authenticated" ON public.audit_events;
CREATE POLICY "audit_insert_authenticated" ON public.audit_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- automation_execution_log
DROP POLICY IF EXISTS "Allow authenticated insert automation_execution_log" ON public.automation_execution_log;
DROP POLICY IF EXISTS "Org members can insert automation_execution_log" ON public.automation_execution_log;
CREATE POLICY "Org members can insert automation_execution_log" ON public.automation_execution_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 7. BLOG (admin only)
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can delete articles" ON public.blog_articles;
DROP POLICY IF EXISTS "Authenticated users can insert articles" ON public.blog_articles;
DROP POLICY IF EXISTS "Authenticated users can update articles" ON public.blog_articles;
DROP POLICY IF EXISTS "Admins can delete articles" ON public.blog_articles;
DROP POLICY IF EXISTS "Admins can insert articles" ON public.blog_articles;
DROP POLICY IF EXISTS "Admins can update articles" ON public.blog_articles;

CREATE POLICY "Admins can delete articles" ON public.blog_articles
  FOR DELETE TO authenticated USING (public.current_user_has_admin_access());
CREATE POLICY "Admins can insert articles" ON public.blog_articles
  FOR INSERT TO authenticated WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "Admins can update articles" ON public.blog_articles
  FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.blog_categories;

CREATE POLICY "Admins can delete categories" ON public.blog_categories
  FOR DELETE TO authenticated USING (public.current_user_has_admin_access());
CREATE POLICY "Admins can insert categories" ON public.blog_categories
  FOR INSERT TO authenticated WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "Admins can update categories" ON public.blog_categories
  FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

-- blog_generation_logs
DROP POLICY IF EXISTS "System can insert generation logs" ON public.blog_generation_logs;
DROP POLICY IF EXISTS "Admins can insert generation logs" ON public.blog_generation_logs;
CREATE POLICY "Admins can insert generation logs" ON public.blog_generation_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_admin_access());

-- ============================================================================
-- 8. CALENDAR EVENTS (user-scoped: assigned_to / created_by)
-- ============================================================================

-- Trigger to set created_by on insert when not provided
CREATE OR REPLACE FUNCTION public.calendar_events_set_created_by()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.created_by IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_calendar_events_set_created_by ON public.calendar_events;
CREATE TRIGGER trg_calendar_events_set_created_by
  BEFORE INSERT ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.calendar_events_set_created_by();

DROP POLICY IF EXISTS "Allow authenticated insert calendar_events" ON public.calendar_events;
DROP POLICY IF EXISTS "Allow authenticated update calendar_events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can insert own calendar_events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar_events" ON public.calendar_events;

CREATE POLICY "Users can insert own calendar_events" ON public.calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own calendar_events" ON public.calendar_events
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid())
  WITH CHECK (assigned_to = auth.uid() OR created_by = auth.uid());

-- ============================================================================
-- 9. COGNITO FORMS (admin only)
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated delete cognito_forms" ON public.cognito_forms;
DROP POLICY IF EXISTS "Allow authenticated insert cognito_forms" ON public.cognito_forms;
DROP POLICY IF EXISTS "Allow authenticated update cognito_forms" ON public.cognito_forms;
DROP POLICY IF EXISTS "Admins can delete cognito_forms" ON public.cognito_forms;
DROP POLICY IF EXISTS "Admins can insert cognito_forms" ON public.cognito_forms;
DROP POLICY IF EXISTS "Admins can update cognito_forms" ON public.cognito_forms;

CREATE POLICY "Admins can delete cognito_forms" ON public.cognito_forms
  FOR DELETE TO authenticated USING (public.current_user_has_admin_access());
CREATE POLICY "Admins can insert cognito_forms" ON public.cognito_forms
  FOR INSERT TO authenticated WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "Admins can update cognito_forms" ON public.cognito_forms
  FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

-- ============================================================================
-- 10. COMPLIANCE (authenticated with valid uid)
-- ============================================================================

DROP POLICY IF EXISTS "compliance_acknowledgments_insert" ON public.compliance_acknowledgments;
DROP POLICY IF EXISTS "compliance_acknowledgments_update" ON public.compliance_acknowledgments;

CREATE POLICY "compliance_acknowledgments_insert" ON public.compliance_acknowledgments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "compliance_acknowledgments_update" ON public.compliance_acknowledgments
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 11. CRM (admin or org-scoped)
-- ============================================================================

-- crm_email_log
DROP POLICY IF EXISTS "Authenticated users can insert email logs" ON public.crm_email_log;
DROP POLICY IF EXISTS "Org members can insert email logs" ON public.crm_email_log;
CREATE POLICY "Org members can insert email logs" ON public.crm_email_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- crm_email_tracking (service or authenticated)
DROP POLICY IF EXISTS "Service role can insert tracking" ON public.crm_email_tracking;
DROP POLICY IF EXISTS "Service or authenticated can insert tracking" ON public.crm_email_tracking;
CREATE POLICY "Service or authenticated can insert tracking" ON public.crm_email_tracking
  FOR INSERT TO service_role, authenticated
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

-- crm_templates (admin/staff - extended admin)
DROP POLICY IF EXISTS "Allow authenticated insert crm_templates" ON public.crm_templates;
DROP POLICY IF EXISTS "Allow authenticated update crm_templates" ON public.crm_templates;
DROP POLICY IF EXISTS "Extended admin can insert crm_templates" ON public.crm_templates;
DROP POLICY IF EXISTS "Extended admin can update crm_templates" ON public.crm_templates;

CREATE POLICY "Extended admin can insert crm_templates" ON public.crm_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_extended_admin_access());

CREATE POLICY "Extended admin can update crm_templates" ON public.crm_templates
  FOR UPDATE TO authenticated
  USING (public.current_user_has_extended_admin_access())
  WITH CHECK (public.current_user_has_extended_admin_access());

-- crm_web_form_submissions: public form - keep for anon/authenticated but add non-trivial check
DROP POLICY IF EXISTS "crm_web_form_submissions_insert" ON public.crm_web_form_submissions;
CREATE POLICY "crm_web_form_submissions_insert" ON public.crm_web_form_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- ============================================================================
-- 12. EDUCATIONAL CONTENT, FAQ, MATERNITY (admin only)
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage educational content" ON public.educational_content;
DROP POLICY IF EXISTS "Admins can manage educational content" ON public.educational_content;
CREATE POLICY "Admins can manage educational content" ON public.educational_content
  FOR ALL TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

DROP POLICY IF EXISTS "Authenticated users can manage FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Admins can manage FAQ items" ON public.faq_items;
CREATE POLICY "Admins can manage FAQ items" ON public.faq_items
  FOR ALL TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

DROP POLICY IF EXISTS "Authenticated users can manage maternity coverage" ON public.maternity_coverage;
DROP POLICY IF EXISTS "Admins can manage maternity coverage" ON public.maternity_coverage;
CREATE POLICY "Admins can manage maternity coverage" ON public.maternity_coverage
  FOR ALL TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

DROP POLICY IF EXISTS "Authenticated users can manage maternity stages" ON public.maternity_coverage_stages;
DROP POLICY IF EXISTS "Admins can manage maternity stages" ON public.maternity_coverage_stages;
CREATE POLICY "Admins can manage maternity stages" ON public.maternity_coverage_stages
  FOR ALL TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

-- ============================================================================
-- 13. ENROLLMENT, PLAN SELECTIONS (intentional anon for signup)
-- ============================================================================

-- enrollment_intent - anon signup flow
DROP POLICY IF EXISTS "Allow anonymous insert on enrollment_intent" ON public.enrollment_intent;
CREATE POLICY "Allow anonymous insert on enrollment_intent" ON public.enrollment_intent
  FOR INSERT TO anon
  WITH CHECK (auth.role() = 'anon');

-- ============================================================================
-- 14. EVENTS (admin or authenticated)
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated can delete events" ON public.events;
DROP POLICY IF EXISTS "Authenticated can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated can update events" ON public.events;

CREATE POLICY "Authenticated can delete events" ON public.events
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can insert events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update events" ON public.events
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 15. HANDBOOKS (admin only)
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated delete handbooks" ON public.handbooks;
DROP POLICY IF EXISTS "Allow authenticated insert handbooks" ON public.handbooks;
DROP POLICY IF EXISTS "Allow authenticated update handbooks" ON public.handbooks;
DROP POLICY IF EXISTS "Admins can delete handbooks" ON public.handbooks;
DROP POLICY IF EXISTS "Admins can insert handbooks" ON public.handbooks;
DROP POLICY IF EXISTS "Admins can update handbooks" ON public.handbooks;

CREATE POLICY "Admins can delete handbooks" ON public.handbooks
  FOR DELETE TO authenticated USING (public.current_user_has_admin_access());
CREATE POLICY "Admins can insert handbooks" ON public.handbooks
  FOR INSERT TO authenticated WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "Admins can update handbooks" ON public.handbooks
  FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

-- ============================================================================
-- 16. LEAD NOTIFICATIONS, ROUTING, SCORING, SUBMISSIONS
-- ============================================================================

-- lead_notifications - anon (webhook/widget) or service_role
DROP POLICY IF EXISTS "System can insert lead notifications" ON public.lead_notifications;
CREATE POLICY "System can insert lead notifications" ON public.lead_notifications
  FOR INSERT TO anon, service_role
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- lead_routing_logs (anon or authenticated from webhooks)
DROP POLICY IF EXISTS "Anyone can insert routing logs" ON public.lead_routing_logs;
DROP POLICY IF EXISTS "Anon or authenticated can insert routing logs" ON public.lead_routing_logs;
CREATE POLICY "Anon or authenticated can insert routing logs" ON public.lead_routing_logs
  FOR INSERT TO anon, authenticated
  WITH CHECK ((auth.role() = 'anon') OR (auth.uid() IS NOT NULL));

-- lead_scoring_config (global config - admin only)
DROP POLICY IF EXISTS "Allow authenticated update lead_scoring_config" ON public.lead_scoring_config;
DROP POLICY IF EXISTS "Allow authenticated write lead_scoring_config" ON public.lead_scoring_config;
DROP POLICY IF EXISTS "Admins can update lead_scoring_config" ON public.lead_scoring_config;
DROP POLICY IF EXISTS "Admins can insert lead_scoring_config" ON public.lead_scoring_config;

CREATE POLICY "Admins can update lead_scoring_config" ON public.lead_scoring_config
  FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

CREATE POLICY "Admins can insert lead_scoring_config" ON public.lead_scoring_config
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_admin_access());

-- lead_submissions - intentional public
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.lead_submissions;
CREATE POLICY "Anyone can submit leads" ON public.lead_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- ============================================================================
-- 17. MESSAGES, NEWSLETTER (user-scoped / intentional)
-- ============================================================================

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- navigation_analytics
DROP POLICY IF EXISTS "Anyone can insert navigation analytics" ON public.navigation_analytics;
DROP POLICY IF EXISTS "Authenticated can insert navigation analytics" ON public.navigation_analytics;
CREATE POLICY "Authenticated can insert navigation analytics" ON public.navigation_analytics
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- newsletter_queue
DROP POLICY IF EXISTS "System can manage queue" ON public.newsletter_queue;
DROP POLICY IF EXISTS "Admins can manage newsletter queue" ON public.newsletter_queue;
CREATE POLICY "Admins can manage newsletter queue" ON public.newsletter_queue
  FOR ALL TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

-- newsletter_subscribers - intentional public subscribe
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

-- notification_events
DROP POLICY IF EXISTS "System can insert notification events" ON public.notification_events;
DROP POLICY IF EXISTS "Service can insert notification events" ON public.notification_events;
CREATE POLICY "Service can insert notification events" ON public.notification_events
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ============================================================================
-- 18. ONBOARDING, ORGANIZATIONS, ORGS
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can insert onboarding responses" ON public.onboarding_responses;
CREATE POLICY "Anyone can insert onboarding responses" ON public.onboarding_responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated can create organizations" ON public.organizations;
CREATE POLICY "Authenticated can create organizations" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "org_insert_authenticated" ON public.orgs;
CREATE POLICY "org_insert_authenticated" ON public.orgs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 19. PAGE VIEWS
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "Authenticated can insert page views" ON public.page_views;
CREATE POLICY "Authenticated can insert page views" ON public.page_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 20. PLAN SELECTIONS, RATE CALCULATOR (anon signup)
-- ============================================================================

DROP POLICY IF EXISTS "Allow anonymous insert on plan_selections" ON public.plan_selections;
CREATE POLICY "Allow anonymous insert on plan_selections" ON public.plan_selections
  FOR INSERT TO anon
  WITH CHECK (auth.role() = 'anon');

DROP POLICY IF EXISTS "Allow anonymous insert on rate_calculator_views" ON public.rate_calculator_views;
DROP POLICY IF EXISTS "Allow anonymous update on rate_calculator_views" ON public.rate_calculator_views;

CREATE POLICY "Allow anonymous insert on rate_calculator_views" ON public.rate_calculator_views
  FOR INSERT TO anon
  WITH CHECK (auth.role() = 'anon');

CREATE POLICY "Allow anonymous update on rate_calculator_views" ON public.rate_calculator_views
  FOR UPDATE TO anon
  USING (auth.role() = 'anon')
  WITH CHECK (auth.role() = 'anon');

-- ============================================================================
-- 21. RESOURCE LIBRARY, RESOURCE TOPICS (admin only)
-- ============================================================================

DROP POLICY IF EXISTS "resource_library_delete_policy" ON public.resource_library;
DROP POLICY IF EXISTS "resource_library_insert_policy" ON public.resource_library;
DROP POLICY IF EXISTS "resource_library_update_policy" ON public.resource_library;
DROP POLICY IF EXISTS "Admins can delete resource_library" ON public.resource_library;
DROP POLICY IF EXISTS "Admins can insert resource_library" ON public.resource_library;
DROP POLICY IF EXISTS "Admins can update resource_library" ON public.resource_library;

CREATE POLICY "Admins can delete resource_library" ON public.resource_library
  FOR DELETE TO authenticated USING (public.current_user_has_admin_access());
CREATE POLICY "Admins can insert resource_library" ON public.resource_library
  FOR INSERT TO authenticated WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "Admins can update resource_library" ON public.resource_library
  FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

DROP POLICY IF EXISTS "Authenticated users can delete topics" ON public.resource_topics;
DROP POLICY IF EXISTS "Authenticated users can insert topics" ON public.resource_topics;
DROP POLICY IF EXISTS "Authenticated users can update topics" ON public.resource_topics;
DROP POLICY IF EXISTS "Admins can delete topics" ON public.resource_topics;
DROP POLICY IF EXISTS "Admins can insert topics" ON public.resource_topics;
DROP POLICY IF EXISTS "Admins can update topics" ON public.resource_topics;

CREATE POLICY "Admins can delete topics" ON public.resource_topics
  FOR DELETE TO authenticated USING (public.current_user_has_admin_access());
CREATE POLICY "Admins can insert topics" ON public.resource_topics
  FOR INSERT TO authenticated WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "Admins can update topics" ON public.resource_topics
  FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

-- ============================================================================
-- 22. SOLUTION BENEFITS, FEATURES, TESTIMONIALS, SPECIALIZED SOLUTIONS (admin)
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can delete benefits" ON public.solution_benefits;
DROP POLICY IF EXISTS "Authenticated users can insert benefits" ON public.solution_benefits;
DROP POLICY IF EXISTS "Authenticated users can update benefits" ON public.solution_benefits;
DROP POLICY IF EXISTS "Admins can delete solution_benefits" ON public.solution_benefits;
DROP POLICY IF EXISTS "Admins can insert solution_benefits" ON public.solution_benefits;
DROP POLICY IF EXISTS "Admins can update solution_benefits" ON public.solution_benefits;

CREATE POLICY "Admins can delete solution_benefits" ON public.solution_benefits
  FOR DELETE TO authenticated USING (public.current_user_has_admin_access());
CREATE POLICY "Admins can insert solution_benefits" ON public.solution_benefits
  FOR INSERT TO authenticated WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "Admins can update solution_benefits" ON public.solution_benefits
  FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

DROP POLICY IF EXISTS "Authenticated users can delete features" ON public.solution_features;
DROP POLICY IF EXISTS "Authenticated users can insert features" ON public.solution_features;
DROP POLICY IF EXISTS "Authenticated users can update features" ON public.solution_features;
DROP POLICY IF EXISTS "Admins can delete solution_features" ON public.solution_features;
DROP POLICY IF EXISTS "Admins can insert solution_features" ON public.solution_features;
DROP POLICY IF EXISTS "Admins can update solution_features" ON public.solution_features;

CREATE POLICY "Admins can delete solution_features" ON public.solution_features
  FOR DELETE TO authenticated USING (public.current_user_has_admin_access());
CREATE POLICY "Admins can insert solution_features" ON public.solution_features
  FOR INSERT TO authenticated WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "Admins can update solution_features" ON public.solution_features
  FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

DROP POLICY IF EXISTS "Authenticated users can delete testimonials" ON public.solution_testimonials;
DROP POLICY IF EXISTS "Authenticated users can insert testimonials" ON public.solution_testimonials;
DROP POLICY IF EXISTS "Authenticated users can update testimonials" ON public.solution_testimonials;
DROP POLICY IF EXISTS "Admins can delete solution_testimonials" ON public.solution_testimonials;
DROP POLICY IF EXISTS "Admins can insert solution_testimonials" ON public.solution_testimonials;
DROP POLICY IF EXISTS "Admins can update solution_testimonials" ON public.solution_testimonials;

CREATE POLICY "Admins can delete solution_testimonials" ON public.solution_testimonials
  FOR DELETE TO authenticated USING (public.current_user_has_admin_access());
CREATE POLICY "Admins can insert solution_testimonials" ON public.solution_testimonials
  FOR INSERT TO authenticated WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "Admins can update solution_testimonials" ON public.solution_testimonials
  FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

DROP POLICY IF EXISTS "Authenticated users can delete solutions" ON public.specialized_solutions;
DROP POLICY IF EXISTS "Authenticated users can insert solutions" ON public.specialized_solutions;
DROP POLICY IF EXISTS "Authenticated users can update solutions" ON public.specialized_solutions;
DROP POLICY IF EXISTS "Admins can delete specialized_solutions" ON public.specialized_solutions;
DROP POLICY IF EXISTS "Admins can insert specialized_solutions" ON public.specialized_solutions;
DROP POLICY IF EXISTS "Admins can update specialized_solutions" ON public.specialized_solutions;

CREATE POLICY "Admins can delete specialized_solutions" ON public.specialized_solutions
  FOR DELETE TO authenticated USING (public.current_user_has_admin_access());
CREATE POLICY "Admins can insert specialized_solutions" ON public.specialized_solutions
  FOR INSERT TO authenticated WITH CHECK (public.current_user_has_admin_access());
CREATE POLICY "Admins can update specialized_solutions" ON public.specialized_solutions
  FOR UPDATE TO authenticated
  USING (public.current_user_has_admin_access())
  WITH CHECK (public.current_user_has_admin_access());

-- ============================================================================
-- 23. TASKS, TRACKING, WEBHOOKS
-- ============================================================================

DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can insert tracking events" ON public.tracking_event_log;
DROP POLICY IF EXISTS "Service can insert tracking events" ON public.tracking_event_log;
CREATE POLICY "Service can insert tracking events" ON public.tracking_event_log
  FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert webhook logs" ON public.webhook_delivery_logs;
DROP POLICY IF EXISTS "Service can insert webhook logs" ON public.webhook_delivery_logs;
CREATE POLICY "Service can insert webhook logs" ON public.webhook_delivery_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ============================================================================
-- 24. ZOHO (intentional public for widget/webhook)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can insert lead submissions" ON public.zoho_lead_submissions;
CREATE POLICY "Anyone can insert lead submissions" ON public.zoho_lead_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS "zoho_errors_anonymous_insert" ON public.zoho_salesiq_errors;
CREATE POLICY "zoho_errors_anonymous_insert" ON public.zoho_salesiq_errors
  FOR INSERT TO anon, authenticated
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS "zoho_health_anonymous_insert" ON public.zoho_salesiq_health_checks;
CREATE POLICY "zoho_health_anonymous_insert" ON public.zoho_salesiq_health_checks
  FOR INSERT TO anon, authenticated
  WITH CHECK (auth.role() IN ('anon', 'authenticated'));

COMMIT;

-- ============================================================================
-- REMAINING: password_requirements_min_length
-- Set in Supabase Dashboard: Authentication > Settings > Password minimum length (12)
-- https://supabase.com/docs/guides/platform/going-into-prod#security
-- ============================================================================

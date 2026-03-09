-- ============================================================================
-- Migration: Add indexes for unindexed foreign keys
-- Description: Adds covering indexes for foreign key columns to improve
--   query performance (JOINs, cascades, referential integrity checks).
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
-- ============================================================================

-- admin_resources
CREATE INDEX IF NOT EXISTS idx_admin_resources_created_by ON public.admin_resources(created_by);

-- advisor_announcements
CREATE INDEX IF NOT EXISTS idx_advisor_announcements_created_by ON public.advisor_announcements(created_by);

-- advisor_external_training_progress
CREATE INDEX IF NOT EXISTS idx_advisor_external_training_progress_verified_by ON public.advisor_external_training_progress(verified_by);

-- advisor_learning_paths
CREATE INDEX IF NOT EXISTS idx_advisor_learning_paths_created_by ON public.advisor_learning_paths(created_by);

-- advisor_lesson_completions
CREATE INDEX IF NOT EXISTS idx_advisor_lesson_completions_lesson_id ON public.advisor_lesson_completions(lesson_id);

-- advisor_meeting_attendees
CREATE INDEX IF NOT EXISTS idx_advisor_meeting_attendees_user_id ON public.advisor_meeting_attendees(user_id);

-- advisor_nav_menu
CREATE INDEX IF NOT EXISTS idx_advisor_nav_menu_created_by ON public.advisor_nav_menu(created_by);

-- advisor_plan_resources
CREATE INDEX IF NOT EXISTS idx_advisor_plan_resources_created_by ON public.advisor_plan_resources(created_by);
CREATE INDEX IF NOT EXISTS idx_advisor_plan_resources_updated_by ON public.advisor_plan_resources(updated_by);

-- advisor_portal_settings
CREATE INDEX IF NOT EXISTS idx_advisor_portal_settings_updated_by ON public.advisor_portal_settings(updated_by);

-- advisor_quick_links
CREATE INDEX IF NOT EXISTS idx_advisor_quick_links_created_by ON public.advisor_quick_links(created_by);

-- ai_automation_rules
CREATE INDEX IF NOT EXISTS idx_ai_automation_rules_created_by ON public.ai_automation_rules(created_by);

-- analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);

-- analytics_experiments
CREATE INDEX IF NOT EXISTS idx_analytics_experiments_created_by ON public.analytics_experiments(created_by);

-- analytics_sessions
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON public.analytics_sessions(user_id);

-- approved_links
CREATE INDEX IF NOT EXISTS idx_approved_links_created_by ON public.approved_links(created_by);

-- benefit_usage
CREATE INDEX IF NOT EXISTS idx_benefit_usage_coverage_id ON public.benefit_usage(coverage_id);

-- blog_generation_logs
CREATE INDEX IF NOT EXISTS idx_blog_generation_logs_created_by ON public.blog_generation_logs(created_by);

-- bulletin_email_notifications
CREATE INDEX IF NOT EXISTS idx_bulletin_email_notifications_sent_by ON public.bulletin_email_notifications(sent_by);

-- calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON public.calendar_events(created_by);

-- chat_conversations
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_by ON public.chat_conversations(created_by);

-- chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted_by ON public.chat_messages(deleted_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_id ON public.chat_messages(reply_to_id);

-- claims
CREATE INDEX IF NOT EXISTS idx_claims_dependent_id ON public.claims(dependent_id);
CREATE INDEX IF NOT EXISTS idx_claims_provider_id ON public.claims(provider_id);
CREATE INDEX IF NOT EXISTS idx_claims_reviewed_by ON public.claims(reviewed_by);

-- code_batches
CREATE INDEX IF NOT EXISTS idx_code_batches_created_by ON public.code_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_code_batches_org_id ON public.code_batches(org_id);

-- code_inventory
CREATE INDEX IF NOT EXISTS idx_code_inventory_assigned_to_user ON public.code_inventory(assigned_to_user);
CREATE INDEX IF NOT EXISTS idx_code_inventory_created_by ON public.code_inventory(created_by);

-- compliance_acknowledgments
CREATE INDEX IF NOT EXISTS idx_compliance_acknowledgments_document_id ON public.compliance_acknowledgments(document_id);

-- compliance_documents
CREATE INDEX IF NOT EXISTS idx_compliance_documents_org_id ON public.compliance_documents(org_id);

-- content_calendar
CREATE INDEX IF NOT EXISTS idx_content_calendar_created_by ON public.content_calendar(created_by);
CREATE INDEX IF NOT EXISTS idx_content_calendar_generation_log_id ON public.content_calendar(generation_log_id);

-- conversations
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON public.conversations(assigned_to);

-- conversion_events
CREATE INDEX IF NOT EXISTS idx_conversion_events_created_by ON public.conversion_events(created_by);

-- crm_accounts
CREATE INDEX IF NOT EXISTS idx_crm_accounts_created_by ON public.crm_accounts(created_by);

-- crm_activities
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_by ON public.crm_activities(created_by);

-- crm_approval_processes
CREATE INDEX IF NOT EXISTS idx_crm_approval_processes_created_by ON public.crm_approval_processes(created_by);

-- crm_campaign_members
CREATE INDEX IF NOT EXISTS idx_crm_campaign_members_added_by ON public.crm_campaign_members(added_by);

-- crm_campaigns
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_created_by ON public.crm_campaigns(created_by);

-- crm_case_comments
CREATE INDEX IF NOT EXISTS idx_crm_case_comments_author_id ON public.crm_case_comments(author_id);

-- crm_cases
CREATE INDEX IF NOT EXISTS idx_crm_cases_created_by ON public.crm_cases(created_by);
CREATE INDEX IF NOT EXISTS idx_crm_cases_escalated_to ON public.crm_cases(escalated_to);
CREATE INDEX IF NOT EXISTS idx_crm_cases_owner_id ON public.crm_cases(owner_id);

-- crm_contacts
CREATE INDEX IF NOT EXISTS idx_crm_contacts_created_by ON public.crm_contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_reports_to ON public.crm_contacts(reports_to);

-- crm_deal_stage_history
CREATE INDEX IF NOT EXISTS idx_crm_deal_stage_history_changed_by ON public.crm_deal_stage_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_crm_deal_stage_history_from_stage_id ON public.crm_deal_stage_history(from_stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_deal_stage_history_to_stage_id ON public.crm_deal_stage_history(to_stage_id);

-- crm_deals
CREATE INDEX IF NOT EXISTS idx_crm_deals_created_by ON public.crm_deals(created_by);

-- crm_default_layout_templates
CREATE INDEX IF NOT EXISTS idx_crm_default_layout_templates_created_by ON public.crm_default_layout_templates(created_by);

-- crm_email_attachments
CREATE INDEX IF NOT EXISTS idx_crm_email_attachments_uploaded_by ON public.crm_email_attachments(uploaded_by);

-- crm_email_drafts
CREATE INDEX IF NOT EXISTS idx_crm_email_drafts_signature_id ON public.crm_email_drafts(signature_id);

-- crm_email_log
CREATE INDEX IF NOT EXISTS idx_crm_email_log_sent_by ON public.crm_email_log(sent_by);
CREATE INDEX IF NOT EXISTS idx_crm_email_log_signature_id ON public.crm_email_log(signature_id);

-- crm_forecasts
CREATE INDEX IF NOT EXISTS idx_crm_forecasts_created_by ON public.crm_forecasts(created_by);

-- crm_invoice_payments
CREATE INDEX IF NOT EXISTS idx_crm_invoice_payments_recorded_by ON public.crm_invoice_payments(recorded_by);

-- crm_invoices
CREATE INDEX IF NOT EXISTS idx_crm_invoices_approved_by ON public.crm_invoices(approved_by);
CREATE INDEX IF NOT EXISTS idx_crm_invoices_created_by ON public.crm_invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_crm_invoices_owner_id ON public.crm_invoices(owner_id);

-- crm_lead_health_quotes
CREATE INDEX IF NOT EXISTS idx_crm_lead_health_quotes_created_by ON public.crm_lead_health_quotes(created_by);

-- crm_lead_plan_interests
CREATE INDEX IF NOT EXISTS idx_crm_lead_plan_interests_created_by ON public.crm_lead_plan_interests(created_by);

-- crm_meeting_bookings
CREATE INDEX IF NOT EXISTS idx_crm_meeting_bookings_calendar_event_id ON public.crm_meeting_bookings(calendar_event_id);

-- crm_meeting_schedules
CREATE INDEX IF NOT EXISTS idx_crm_meeting_schedules_confirmation_template_id ON public.crm_meeting_schedules(confirmation_template_id);
CREATE INDEX IF NOT EXISTS idx_crm_meeting_schedules_reminder_template_id ON public.crm_meeting_schedules(reminder_template_id);

-- crm_price_books
CREATE INDEX IF NOT EXISTS idx_crm_price_books_created_by ON public.crm_price_books(created_by);

-- crm_products
CREATE INDEX IF NOT EXISTS idx_crm_products_created_by ON public.crm_products(created_by);

-- crm_purchase_order_line_items
CREATE INDEX IF NOT EXISTS idx_crm_purchase_order_line_items_product_id ON public.crm_purchase_order_line_items(product_id);

-- crm_purchase_orders
CREATE INDEX IF NOT EXISTS idx_crm_purchase_orders_approved_by ON public.crm_purchase_orders(approved_by);
CREATE INDEX IF NOT EXISTS idx_crm_purchase_orders_created_by ON public.crm_purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_crm_purchase_orders_owner_id ON public.crm_purchase_orders(owner_id);

-- crm_quotes
CREATE INDEX IF NOT EXISTS idx_crm_quotes_approved_by ON public.crm_quotes(approved_by);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_created_by ON public.crm_quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_owner_id ON public.crm_quotes(owner_id);

-- crm_sales_order_line_items
CREATE INDEX IF NOT EXISTS idx_crm_sales_order_line_items_product_id ON public.crm_sales_order_line_items(product_id);

-- crm_sales_orders
CREATE INDEX IF NOT EXISTS idx_crm_sales_orders_approved_by ON public.crm_sales_orders(approved_by);
CREATE INDEX IF NOT EXISTS idx_crm_sales_orders_contact_id ON public.crm_sales_orders(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_sales_orders_created_by ON public.crm_sales_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_crm_sales_orders_deal_id ON public.crm_sales_orders(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_sales_orders_owner_id ON public.crm_sales_orders(owner_id);

-- crm_studio_fields
CREATE INDEX IF NOT EXISTS idx_crm_studio_fields_created_by ON public.crm_studio_fields(created_by);

-- crm_studio_layouts
CREATE INDEX IF NOT EXISTS idx_crm_studio_layouts_created_by ON public.crm_studio_layouts(created_by);

-- crm_studio_modules
CREATE INDEX IF NOT EXISTS idx_crm_studio_modules_created_by ON public.crm_studio_modules(created_by);

-- crm_studio_validation_rules
CREATE INDEX IF NOT EXISTS idx_crm_studio_validation_rules_created_by ON public.crm_studio_validation_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_crm_studio_validation_rules_error_field_id ON public.crm_studio_validation_rules(error_field_id);

-- crm_studio_views
CREATE INDEX IF NOT EXISTS idx_crm_studio_views_created_by ON public.crm_studio_views(created_by);
CREATE INDEX IF NOT EXISTS idx_crm_studio_views_sort_field_id ON public.crm_studio_views(sort_field_id);

-- crm_templates
CREATE INDEX IF NOT EXISTS idx_crm_templates_created_by ON public.crm_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_crm_templates_default_signature_id ON public.crm_templates(default_signature_id);

-- crm_user_goals
CREATE INDEX IF NOT EXISTS idx_crm_user_goals_assigned_by ON public.crm_user_goals(assigned_by);

-- crm_vendors
CREATE INDEX IF NOT EXISTS idx_crm_vendors_created_by ON public.crm_vendors(created_by);
CREATE INDEX IF NOT EXISTS idx_crm_vendors_owner_id ON public.crm_vendors(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_vendors_primary_contact_id ON public.crm_vendors(primary_contact_id);

-- crm_web_forms
CREATE INDEX IF NOT EXISTS idx_crm_web_forms_created_by ON public.crm_web_forms(created_by);

-- crm_website_quote_sync
CREATE INDEX IF NOT EXISTS idx_crm_website_quote_sync_crm_lead_id ON public.crm_website_quote_sync(crm_lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_website_quote_sync_crm_quote_id ON public.crm_website_quote_sync(crm_quote_id);

-- document_access_log
CREATE INDEX IF NOT EXISTS idx_document_access_log_document_id ON public.document_access_log(document_id);

-- email_schedules
CREATE INDEX IF NOT EXISTS idx_email_schedules_created_by ON public.email_schedules(created_by);
CREATE INDEX IF NOT EXISTS idx_email_schedules_template_id ON public.email_schedules(template_id);

-- enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_reviewed_by ON public.enrollments(reviewed_by);

-- esignature_documents
CREATE INDEX IF NOT EXISTS idx_esignature_documents_created_by ON public.esignature_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_esignature_documents_provider_id ON public.esignature_documents(provider_id);

-- esignature_providers
CREATE INDEX IF NOT EXISTS idx_esignature_providers_created_by ON public.esignature_providers(created_by);

-- events
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);

-- form_submissions
CREATE INDEX IF NOT EXISTS idx_form_submissions_advisor_id ON public.form_submissions(advisor_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_org_id ON public.form_submissions(org_id);

-- geo_state_settings
CREATE INDEX IF NOT EXISTS idx_geo_state_settings_updated_by ON public.geo_state_settings(updated_by);

-- lead_notifications
CREATE INDEX IF NOT EXISTS idx_lead_notifications_acknowledged_by ON public.lead_notifications(acknowledged_by);

-- lead_tasks
CREATE INDEX IF NOT EXISTS idx_lead_tasks_completed_by ON public.lead_tasks(completed_by);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_created_by ON public.lead_tasks(created_by);

-- leads
CREATE INDEX IF NOT EXISTS idx_leads_assigned_advisor_id ON public.leads(assigned_advisor_id);

-- mail_domains
CREATE INDEX IF NOT EXISTS idx_mail_domains_created_by ON public.mail_domains(created_by);

-- mail_folders
CREATE INDEX IF NOT EXISTS idx_mail_folders_parent_folder_id ON public.mail_folders(parent_folder_id);

-- mail_sender_identities
CREATE INDEX IF NOT EXISTS idx_mail_sender_identities_created_by ON public.mail_sender_identities(created_by);
CREATE INDEX IF NOT EXISTS idx_mail_sender_identities_domain_id ON public.mail_sender_identities(domain_id);

-- mail_shared_access
CREATE INDEX IF NOT EXISTS idx_mail_shared_access_granted_by ON public.mail_shared_access(granted_by);
CREATE INDEX IF NOT EXISTS idx_mail_shared_access_grantee_user_id ON public.mail_shared_access(grantee_user_id);

-- medication_reminders
CREATE INDEX IF NOT EXISTS idx_medication_reminders_prescription_id ON public.medication_reminders(prescription_id);

-- meeting_templates
CREATE INDEX IF NOT EXISTS idx_meeting_templates_created_by ON public.meeting_templates(created_by);

-- member_documents
CREATE INDEX IF NOT EXISTS idx_member_documents_uploaded_by ON public.member_documents(uploaded_by);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON public.messages(parent_message_id);

-- navigation_analytics
CREATE INDEX IF NOT EXISTS idx_navigation_analytics_navigation_item_id ON public.navigation_analytics(navigation_item_id);
CREATE INDEX IF NOT EXISTS idx_navigation_analytics_user_id ON public.navigation_analytics(user_id);

-- newsletter_campaigns
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_created_by ON public.newsletter_campaigns(created_by);

-- note_notifications
CREATE INDEX IF NOT EXISTS idx_note_notifications_note_id ON public.note_notifications(note_id);

-- note_shares
CREATE INDEX IF NOT EXISTS idx_note_shares_shared_by_user_id ON public.note_shares(shared_by_user_id);

-- notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);

-- notification_events
CREATE INDEX IF NOT EXISTS idx_notification_events_actor_id ON public.notification_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_notification_events_org_id ON public.notification_events(org_id);

-- notification_log
CREATE INDEX IF NOT EXISTS idx_notification_log_event_id ON public.notification_log(event_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_lead_id ON public.notification_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_task_id ON public.notification_log(task_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_activity_id ON public.notifications(activity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON public.notifications(org_id);

-- onboarding_progress
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_step_id ON public.onboarding_progress(step_id);

-- org_invites
CREATE INDEX IF NOT EXISTS idx_org_invites_accepted_by ON public.org_invites(accepted_by);
CREATE INDEX IF NOT EXISTS idx_org_invites_invited_by ON public.org_invites(invited_by);

-- org_memberships
CREATE INDEX IF NOT EXISTS idx_org_memberships_invited_by ON public.org_memberships(invited_by);

-- page_views
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON public.page_views(user_id);

-- payment_processors
CREATE INDEX IF NOT EXISTS idx_payment_processors_created_by ON public.payment_processors(created_by);

-- performance_goals
CREATE INDEX IF NOT EXISTS idx_performance_goals_org_id ON public.performance_goals(org_id);
CREATE INDEX IF NOT EXISTS idx_performance_goals_user_id ON public.performance_goals(user_id);

-- prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacy_id ON public.prescriptions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_provider_id ON public.prescriptions(provider_id);

-- priority_lanes
CREATE INDEX IF NOT EXISTS idx_priority_lanes_created_by ON public.priority_lanes(created_by);

-- promo_code_usage
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_promo_code_id ON public.promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_user_id ON public.promo_code_usage(user_id);

-- promo_codes
CREATE INDEX IF NOT EXISTS idx_promo_codes_created_by ON public.promo_codes(created_by);

-- report_exports
CREATE INDEX IF NOT EXISTS idx_report_exports_exported_by ON public.report_exports(exported_by);
CREATE INDEX IF NOT EXISTS idx_report_exports_saved_report_id ON public.report_exports(saved_report_id);

-- role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_granted_by ON public.role_permissions(granted_by);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- scoring_rules
CREATE INDEX IF NOT EXISTS idx_scoring_rules_created_by ON public.scoring_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_lane_assignment ON public.scoring_rules(lane_assignment);

-- security_alert_webhooks
CREATE INDEX IF NOT EXISTS idx_security_alert_webhooks_created_by ON public.security_alert_webhooks(created_by);

-- seo_google_credentials
CREATE INDEX IF NOT EXISTS idx_seo_google_credentials_created_by ON public.seo_google_credentials(created_by);

-- sequences
CREATE INDEX IF NOT EXISTS idx_sequences_created_by ON public.sequences(created_by);

-- sms_accounts
CREATE INDEX IF NOT EXISTS idx_sms_accounts_created_by ON public.sms_accounts(created_by);

-- sms_log
CREATE INDEX IF NOT EXISTS idx_sms_log_sent_by ON public.sms_log(sent_by);
CREATE INDEX IF NOT EXISTS idx_sms_log_sms_account_id ON public.sms_log(sms_account_id);
CREATE INDEX IF NOT EXISTS idx_sms_log_template_id ON public.sms_log(template_id);

-- sop_categories
CREATE INDEX IF NOT EXISTS idx_sop_categories_parent_id ON public.sop_categories(parent_id);

-- sop_documents
CREATE INDEX IF NOT EXISTS idx_sop_documents_created_by ON public.sop_documents(created_by);

-- support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);

-- tracking_snippets
CREATE INDEX IF NOT EXISTS idx_tracking_snippets_created_by ON public.tracking_snippets(created_by);

-- tracking_tags
CREATE INDEX IF NOT EXISTS idx_tracking_tags_created_by ON public.tracking_tags(created_by);

-- transactions
CREATE INDEX IF NOT EXISTS idx_transactions_claim_id ON public.transactions(claim_id);

-- user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_org_id ON public.user_preferences(org_id);

-- user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_granted_by ON public.user_roles(granted_by);

-- utm_campaigns
CREATE INDEX IF NOT EXISTS idx_utm_campaigns_created_by ON public.utm_campaigns(created_by);

-- visit_summaries
CREATE INDEX IF NOT EXISTS idx_visit_summaries_provider_id ON public.visit_summaries(provider_id);

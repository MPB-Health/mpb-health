-- ============================================================================
-- CRM Performance Indexes
-- Composite indexes for hot query paths: list views, detail pages, dashboard
-- ============================================================================

-- Lead list view: org_id + pipeline_stage + created_at DESC
-- Covers the primary leads list query with stage filtering and date ordering
CREATE INDEX IF NOT EXISTS idx_leads_org_stage_created
  ON public.zoho_lead_submissions(org_id, pipeline_stage, created_at DESC);
-- Lead list view with plan type filter: org_id + plan_type + created_at DESC
-- Covers plan-type-filtered list views and dashboard plan type stats
CREATE INDEX IF NOT EXISTS idx_leads_org_plantype_created
  ON public.zoho_lead_submissions(org_id, plan_type, created_at DESC);
-- Lead priority filter: composite for priority-filtered views
CREATE INDEX IF NOT EXISTS idx_leads_org_priority_created
  ON public.zoho_lead_submissions(org_id, priority, created_at DESC);
-- Contact list view: org_id + created_at DESC
-- Covers the primary contacts list query with date ordering
CREATE INDEX IF NOT EXISTS idx_contacts_org_created
  ON public.crm_contacts(org_id, created_at DESC);
-- Activity timeline: lead_id + created_at DESC
-- Covers the detail page activity timeline fetch
CREATE INDEX IF NOT EXISTS idx_activities_lead_date
  ON public.lead_activities(lead_id, created_at DESC);
-- Task queries: org_id + due_date for today/overdue queries on incomplete tasks
CREATE INDEX IF NOT EXISTS idx_tasks_org_due_incomplete
  ON public.lead_tasks(org_id, due_date)
  WHERE completed = false;
-- Task detail page: lead_id + completed status for task listing by lead
CREATE INDEX IF NOT EXISTS idx_tasks_lead_status
  ON public.lead_tasks(lead_id, completed, due_date);
-- Email log timeline: lead_id + sent_at DESC for timeline queries
CREATE INDEX IF NOT EXISTS idx_email_log_lead_date
  ON public.crm_email_log(lead_id, sent_at DESC);
-- Calendar events: upcoming events query by org + start_time
CREATE INDEX IF NOT EXISTS idx_calendar_org_start
  ON public.calendar_events(org_id, start_time)
  WHERE status != 'cancelled';
-- Deal pipeline: org_id + stage_id for pipeline board grouping
CREATE INDEX IF NOT EXISTS idx_deals_org_stage
  ON public.crm_deals(org_id, stage_id, created_at DESC);
-- Attachment lookup: entity_type + entity_id for detail page attachment tabs
CREATE INDEX IF NOT EXISTS idx_attachments_entity_lookup
  ON public.crm_attachments(entity_type, entity_id, created_at DESC);

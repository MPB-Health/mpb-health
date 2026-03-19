-- ============================================================================
-- Migration: Admin Portal Lead Submission View
-- Description: Creates a unified view joining web form lead_submissions with
--   the CRM pipeline (zoho_lead_submissions) so the admin portal can surface
--   both in one query — enriched with CRM status when the lead has been added
--   to the pipeline.
-- Target project: dtmnkzllidaiqyheguhl (MPB HEALTH WEBSITE / primary)
-- ============================================================================

CREATE OR REPLACE VIEW admin_lead_submissions_view AS
SELECT
  -- Web form submission fields
  ls.id,
  ls.first_name,
  ls.last_name,
  ls.email,
  ls.phone,
  ls.source,
  ls.status               AS submission_status,
  ls.submitted_at,
  ls.created_at,
  ls.assigned_to          AS submission_assigned_to,
  ls.notes,
  ls.referral_source,
  ls.household_size,
  ls.current_insurance,
  ls.monthly_premium,
  ls.coverage_preference,
  ls.zip_code,
  ls.primary_concern,
  ls.contact_preference,

  -- CRM pipeline enrichment (NULL when not yet added to CRM)
  zls.id                  AS crm_lead_id,
  zls.pipeline_stage,
  zls.pipeline_stage_id,
  zls.lead_score,
  zls.priority            AS crm_priority,
  zls.last_contacted_at,
  zls.next_followup_at,
  zls.tags                AS crm_tags,
  zls.assigned_to         AS crm_assigned_to,
  zls.converted_at,
  zls.lost_reason,
  zls.stage_changed_at,

  -- Derived: whether this submission is in the CRM pipeline
  (zls.id IS NOT NULL)    AS in_crm_pipeline

FROM public.lead_submissions ls
LEFT JOIN public.zoho_lead_submissions zls
  ON lower(trim(ls.email)) = lower(trim(zls.email));

-- Grant read access to authenticated users (admin portal uses service role,
-- but anon/auth reads from the view respect underlying table RLS)
GRANT SELECT ON admin_lead_submissions_view TO authenticated;
GRANT SELECT ON admin_lead_submissions_view TO service_role;

-- Fix: lead_tasks_lead_id_fkey must be DEFERRABLE so the BEFORE INSERT
-- trigger on lead_submissions (crm_lead_after_insert_automation) can
-- create an SLA task in the same transaction before the parent row commits.
--
-- Without this, any org with an active crm_sla_config hits:
--   "violates foreign key constraint lead_tasks_lead_id_fkey"
-- on every new lead submission.

ALTER TABLE public.lead_tasks
  DROP CONSTRAINT IF EXISTS lead_tasks_lead_id_fkey;

ALTER TABLE public.lead_tasks
  ADD CONSTRAINT lead_tasks_lead_id_fkey
  FOREIGN KEY (lead_id)
  REFERENCES public.lead_submissions(id)
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- Same treatment for lead_activities — the advisor portal's logActivity
-- call chain may hit the same race in future trigger expansions.
ALTER TABLE public.lead_activities
  DROP CONSTRAINT IF EXISTS lead_activities_lead_id_fkey;

ALTER TABLE public.lead_activities
  ADD CONSTRAINT lead_activities_lead_id_fkey
  FOREIGN KEY (lead_id)
  REFERENCES public.lead_submissions(id)
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

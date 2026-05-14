-- ============================================================================
-- CRM rebuild — Phase 7 / Section 9 Round 5 — Email log recruit attribution
-- ============================================================================
-- Spec: "Recruiting inherits per-rep templates and master template library"
-- and "in-profile email composer with template insert". When a rep sends
-- an email from a Recruit Profile (or from a recruiting bulk-send when it
-- ships in P5+), the audit trail must point back at the recruit, not at
-- a null lead.
--
-- Adds an optional `recruit_id` column on `crm_email_log` keyed to
-- `crm_recruiting_records` so the timeline, Templates usage stats, and
-- engagement attribution all work end-to-end without commingling with
-- consumer leads.
-- ============================================================================

ALTER TABLE public.crm_email_log
    ADD COLUMN IF NOT EXISTS recruit_id uuid
        REFERENCES public.crm_recruiting_records(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_email_log_recruit_id
    ON public.crm_email_log(recruit_id) WHERE recruit_id IS NOT NULL;

COMMENT ON COLUMN public.crm_email_log.recruit_id IS
    'Section 9 Round 5: when an email is sent from the Recruit Profile '
    'in-profile composer or from a recruiting bulk-send, this points at '
    'the recruit so the timeline + Templates usage metrics work end-to-end.';

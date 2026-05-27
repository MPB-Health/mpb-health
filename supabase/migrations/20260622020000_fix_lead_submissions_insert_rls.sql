-- ============================================================================
-- Fix: Missing INSERT RLS policy + org_id auto-default on lead_submissions
--
-- Bug 1: Migration 20260429140000 dropped the "Anyone can insert lead
--         submissions" policy for BOTH anon AND authenticated, but only
--         revoked the table-level INSERT GRANT from anon. With RLS enabled
--         and no INSERT policy remaining for authenticated, every direct
--         insert by a CRM user is rejected with "new row violates row-level
--         security policy".
--
-- Bug 2: LeadService.createLead() (the CRM direct-insert path) never sets
--         org_id. No BEFORE INSERT trigger auto-defaults it either — only the
--         submit_public_lead RPC (SECURITY DEFINER) resolves it from
--         system_settings. So even with a policy, the row would have
--         org_id = NULL and fail is_org_member(NULL).
--
-- Fix:
--   1. Add an org-scoped INSERT policy for authenticated users.
--   2. Add a BEFORE INSERT trigger that stamps org_id from
--      system_settings('crm.intake_default_org_id') when the caller omits it.
--      Trigger name sorts before trg_lead_submissions_automation so it fires
--      first (Postgres fires BEFORE triggers alphabetically).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. INSERT policy — org members can insert leads into their org
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "org_leads_insert" ON public.lead_submissions;
CREATE POLICY "org_leads_insert" ON public.lead_submissions
    FOR INSERT TO authenticated
    WITH CHECK (
        org_id IS NOT NULL
        AND public.is_org_member(org_id)
    );

-- ----------------------------------------------------------------------------
-- 2. BEFORE INSERT trigger: default org_id from system_settings when NULL
--
--    SECURITY DEFINER so it can read system_settings regardless of the
--    caller's own SELECT privileges on that table. The value read
--    (crm.intake_default_org_id) is non-sensitive.
--
--    Trigger name `trg_lead_default_org` sorts before
--    `trg_lead_submissions_automation` (round-robin / SLA / cadence) which
--    references NEW.org_id, so the default is in place by the time that
--    trigger fires.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_lead_default_org_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.org_id IS NULL THEN
        SELECT NULLIF(value, '')::uuid
          INTO NEW.org_id
          FROM public.system_settings
         WHERE key = 'crm.intake_default_org_id'
         LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_default_org ON public.lead_submissions;
CREATE TRIGGER trg_lead_default_org
    BEFORE INSERT ON public.lead_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_lead_default_org_on_insert();

COMMIT;

-- ============================================================================
-- CRM rebuild — Phase 1: lock 8-stage pipeline in Round 2 order
--
-- Spec: Changes to the CRM.pdf, Section 5 (Round 2 — 2026-05-12) supersedes
-- Section 1 stage order. Final order:
--   1) New
--   2) Quoted   (was 3 in Section 1)
--   3) Working  (was 2 in Section 1)
--   4) Engaged / Qualifying
--   5) Application in Progress
--   6) Won — Enrolled
--   7) Nurture
--   8) Lost
--
-- This migration:
--   - swaps the sort_order of `working` and `quoted` to land on Round 2 order
--   - confirms terminal flags (won/lost) and adds `is_terminal` for nurture
--   - adds `routes_to_subsection` so stage→subsection mapping is data-driven
--     instead of hard-coded inside trigger functions
--   - re-asserts `is_won_stage`/`is_lost_stage` defaults
--   - keeps inactive legacy stages (`contacted`, `proposal`, `qualified`,
--     `negotiation`) deactivated for safe rollback if any FK still points
--     at them
-- ============================================================================

BEGIN;
-- ----------------------------------------------------------------------------
-- 1. Schema additions
-- ----------------------------------------------------------------------------

ALTER TABLE public.crm_pipeline_stages
    ADD COLUMN IF NOT EXISTS is_terminal boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS routes_to_subsection text
        CHECK (routes_to_subsection IS NULL OR routes_to_subsection IN (
            'working', 'nurture', 'linkedin', 'do_not_contact', 'concierge_handoff'
        ));
COMMENT ON COLUMN public.crm_pipeline_stages.is_terminal IS
    'true when the stage ends the active sales motion (won/nurture/lost). Drives reporting + cadence halts.';
COMMENT ON COLUMN public.crm_pipeline_stages.routes_to_subsection IS
    'Lead workflow subsection a lead is auto-routed to when entering this stage. Read by crm_lead_workflow_subsection_sync().';
-- ----------------------------------------------------------------------------
-- 2. Round 2 order — swap working ↔ quoted, lock the remaining 6
-- ----------------------------------------------------------------------------

UPDATE public.crm_pipeline_stages SET
    display_name        = 'New',
    sort_order          = 1,
    is_active           = true,
    is_won_stage        = false,
    is_lost_stage       = false,
    is_terminal         = false,
    routes_to_subsection = 'working',
    updated_at          = now()
WHERE name = 'new';
UPDATE public.crm_pipeline_stages SET
    display_name        = 'Quoted',
    sort_order          = 2,
    is_active           = true,
    is_won_stage        = false,
    is_lost_stage       = false,
    is_terminal         = false,
    routes_to_subsection = 'working',
    updated_at          = now()
WHERE name = 'quoted';
UPDATE public.crm_pipeline_stages SET
    display_name        = 'Working',
    sort_order          = 3,
    is_active           = true,
    is_won_stage        = false,
    is_lost_stage       = false,
    is_terminal         = false,
    routes_to_subsection = 'working',
    updated_at          = now()
WHERE name = 'working';
UPDATE public.crm_pipeline_stages SET
    display_name        = 'Engaged / Qualifying',
    sort_order          = 4,
    is_active           = true,
    is_won_stage        = false,
    is_lost_stage       = false,
    is_terminal         = false,
    routes_to_subsection = 'working',
    updated_at          = now()
WHERE name = 'engaged';
UPDATE public.crm_pipeline_stages SET
    display_name        = 'Application in Progress',
    sort_order          = 5,
    is_active           = true,
    is_won_stage        = false,
    is_lost_stage       = false,
    is_terminal         = false,
    routes_to_subsection = 'working',
    updated_at          = now()
WHERE name = 'application_in_progress';
UPDATE public.crm_pipeline_stages SET
    display_name        = 'Won — Enrolled',
    sort_order          = 6,
    is_active           = true,
    is_won_stage        = true,
    is_lost_stage       = false,
    is_terminal         = true,
    routes_to_subsection = 'concierge_handoff',
    updated_at          = now()
WHERE name = 'won';
UPDATE public.crm_pipeline_stages SET
    display_name        = 'Nurture',
    sort_order          = 7,
    is_active           = true,
    is_won_stage        = false,
    is_lost_stage       = false,
    is_terminal         = true,
    routes_to_subsection = 'nurture',
    updated_at          = now()
WHERE name = 'nurture';
UPDATE public.crm_pipeline_stages SET
    display_name        = 'Lost',
    sort_order          = 8,
    is_active           = true,
    is_won_stage        = false,
    is_lost_stage       = true,
    is_terminal         = true,
    routes_to_subsection = 'do_not_contact',
    updated_at          = now()
WHERE name = 'lost';
-- ----------------------------------------------------------------------------
-- 3. Force-deactivate any legacy stages that drifted in
-- ----------------------------------------------------------------------------

UPDATE public.crm_pipeline_stages
SET is_active = false,
    updated_at = now()
WHERE name NOT IN (
    'new', 'quoted', 'working', 'engaged',
    'application_in_progress', 'won', 'nurture', 'lost'
);
-- ----------------------------------------------------------------------------
-- 4. Backfill any orphan lead_submissions.pipeline_stage to a canonical slug
--    (defensive — 8stage_workflow already mapped; this catches drift since.)
-- ----------------------------------------------------------------------------

UPDATE public.lead_submissions
SET pipeline_stage = CASE pipeline_stage
        WHEN 'contacted'   THEN 'working'
        WHEN 'proposal'    THEN 'quoted'
        WHEN 'qualified'   THEN 'engaged'
        WHEN 'negotiation' THEN 'application_in_progress'
        WHEN 'converted'   THEN 'won'
        WHEN 'closed_won'  THEN 'won'
        WHEN 'closed_lost' THEN 'lost'
        WHEN 'enrolled'    THEN 'won'
        ELSE pipeline_stage
    END,
    updated_at = now()
WHERE pipeline_stage IS NOT NULL
  AND pipeline_stage NOT IN (
    'new', 'quoted', 'working', 'engaged',
    'application_in_progress', 'won', 'nurture', 'lost'
  );
-- ----------------------------------------------------------------------------
-- 5. Replace the stage→subsection sync function with a data-driven version
--    that reads from crm_pipeline_stages.routes_to_subsection
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_lead_workflow_subsection_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    v_route text;
BEGIN
    -- Insert default
    IF TG_OP = 'INSERT' THEN
        IF NEW.workflow_subsection IS NULL THEN
            NEW.workflow_subsection := CASE
                WHEN NEW.lead_source = 'linkedin' THEN 'linkedin'
                ELSE 'working'
            END;
        END IF;
    END IF;

    -- Look up the stage's destination subsection (data-driven)
    IF NEW.pipeline_stage IS NOT NULL THEN
        SELECT routes_to_subsection
          INTO v_route
          FROM public.crm_pipeline_stages
         WHERE name = NEW.pipeline_stage
           AND is_active = true
           AND (org_id IS NULL OR org_id = NEW.org_id)
         ORDER BY (org_id IS NOT NULL) DESC
         LIMIT 1;

        IF v_route IS NOT NULL AND v_route NOT IN ('concierge_handoff') THEN
            -- Concierge handoff doesn't change Leads-module subsection;
            -- leads still display in Working subsection until off-module move.
            NEW.workflow_subsection := v_route;
        END IF;

        IF NEW.pipeline_stage = 'lost' THEN
            NEW.do_not_contact := true;
        ELSIF NEW.pipeline_stage = 'nurture' THEN
            NEW.do_not_contact := false;
        END IF;
    END IF;

    -- Concierge handoff timestamp on transition to 'won'
    IF TG_OP = 'UPDATE'
       AND NEW.pipeline_stage = 'won'
       AND OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
        NEW.concierge_handoff_at := COALESCE(NEW.concierge_handoff_at, now());
    END IF;

    -- DNC flag overrides — force lost + dnc subsection
    IF NEW.do_not_contact AND COALESCE(NEW.pipeline_stage, '') <> 'lost' THEN
        NEW.pipeline_stage      := 'lost';
        NEW.workflow_subsection := 'do_not_contact';
    END IF;

    RETURN NEW;
END;
$$;
-- Trigger already exists from 20260606140000 — just make sure it's pointed at
-- the updated function (no DROP needed, CREATE OR REPLACE handles it).

-- ----------------------------------------------------------------------------
-- 6. Helper RPC: ordered list of active stages for the caller's org
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_active_pipeline_stages(p_org_id uuid)
RETURNS TABLE (
    id              uuid,
    name            text,
    display_name    text,
    sort_order      integer,
    is_won_stage    boolean,
    is_lost_stage   boolean,
    is_terminal     boolean,
    routes_to_subsection text
)
LANGUAGE sql
STABLE
AS $$
    SELECT id, name, display_name, sort_order,
           is_won_stage, is_lost_stage, is_terminal, routes_to_subsection
      FROM public.crm_pipeline_stages
     WHERE is_active = true
       AND (org_id IS NULL OR org_id = p_org_id)
     ORDER BY sort_order ASC, name ASC
$$;
REVOKE ALL ON FUNCTION public.crm_active_pipeline_stages(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_active_pipeline_stages(uuid)
    TO authenticated, service_role;
COMMIT;

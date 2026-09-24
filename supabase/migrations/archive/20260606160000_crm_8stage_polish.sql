-- ============================================================================
-- CRM 8-stage workflow — follow-up polish on 20260606140000 + 20260606150000
--   1. Deactivate orphan NULL-org pipeline rows so per-org canonical wins
--   2. Stop workflow-subsection trigger from silently flipping do_not_contact
--   3. Auto-start Quote-Response cadence when a lead enters 'quoted'
--   4. Stalled-leads RPC for dashboard alerts
-- ============================================================================

BEGIN;
-- ----------------------------------------------------------------------------
-- 1. Legacy NULL-org pipeline stages: deactivate the canonical names so the
--    per-org seeded rows from 20260606140000 are the only active set.
-- ----------------------------------------------------------------------------

UPDATE public.crm_pipeline_stages
SET is_active = false, updated_at = now()
WHERE org_id IS NULL
  AND name IN (
      'new', 'working', 'quoted', 'engaged', 'application_in_progress',
      'won', 'nurture', 'lost'
  );
-- ----------------------------------------------------------------------------
-- 2. workflow_subsection trigger: do not silently flip do_not_contact to false
--    on nurture inserts (caller intent must be preserved).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_lead_workflow_subsection_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.workflow_subsection IS NULL THEN
            NEW.workflow_subsection := CASE
                WHEN COALESCE(NEW.do_not_contact, false) = true THEN 'do_not_contact'
                WHEN NEW.lead_source = 'linkedin' THEN 'linkedin'
                ELSE 'working'
            END;
        END IF;
    END IF;

    IF NEW.pipeline_stage = 'nurture' THEN
        NEW.workflow_subsection := 'nurture';
        -- intentionally do NOT clear do_not_contact: a nurture lead may still
        -- be DNC if the rep flagged opt-out before parking them.
    ELSIF NEW.pipeline_stage = 'lost' THEN
        NEW.workflow_subsection := 'do_not_contact';
        NEW.do_not_contact := true;
    END IF;

    IF TG_OP = 'UPDATE'
       AND NEW.pipeline_stage = 'won'
       AND OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
        NEW.concierge_handoff_at := COALESCE(NEW.concierge_handoff_at, now());
    END IF;

    IF NEW.do_not_contact AND NEW.pipeline_stage <> 'lost' THEN
        NEW.pipeline_stage := 'lost';
        NEW.workflow_subsection := 'do_not_contact';
    END IF;

    RETURN NEW;
END;
$$;
-- ----------------------------------------------------------------------------
-- 3. Auto-start Quote-Response cadence on stage → 'quoted'.
--    Fires AFTER UPDATE so the stage timestamp trigger has already set
--    quote_cadence_started_at. Idempotent via the existing PK on
--    (lead_id, cadence_id).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_lead_start_quote_cadence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cad         RECORD;
    v_step        jsonb;
    v_delay_hours numeric;
BEGIN
    IF NEW.org_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT * INTO v_cad
    FROM public.crm_follow_up_cadences
    WHERE org_id = NEW.org_id
      AND name = 'Quote Response — 5-touch (Email)'
      AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;

    IF NOT FOUND OR jsonb_array_length(v_cad.steps) = 0 THEN
        RETURN NEW;
    END IF;

    v_step := v_cad.steps -> 0;
    v_delay_hours := COALESCE((v_step ->> 'delay_hours')::numeric, 0);

    INSERT INTO public.crm_lead_cadence_state (
        lead_id, cadence_id, org_id, current_step,
        next_action_at, paused, paused_reason, completed_at
    ) VALUES (
        NEW.id, v_cad.id, NEW.org_id, 0,
        now() + (v_delay_hours || ' hours')::interval,
        false, NULL, NULL
    )
    ON CONFLICT (lead_id, cadence_id) DO UPDATE SET
        paused = false,
        paused_reason = NULL,
        completed_at = NULL,
        next_action_at = EXCLUDED.next_action_at;

    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_lead_start_quote_cadence ON public.lead_submissions;
CREATE TRIGGER trg_lead_start_quote_cadence
    AFTER UPDATE OF pipeline_stage ON public.lead_submissions
    FOR EACH ROW
    WHEN (NEW.pipeline_stage = 'quoted' AND OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage)
    EXECUTE FUNCTION public.crm_lead_start_quote_cadence();
-- ----------------------------------------------------------------------------
-- 4. Stalled-leads alert RPC (default: anything outside terminal stages
--    sitting longer than `p_threshold_days` since stage_changed_at).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_report_stalled_leads(
    p_org_id          uuid,
    p_threshold_days  int DEFAULT 14
)
RETURNS TABLE (
    lead_id            uuid,
    pipeline_stage     text,
    workflow_subsection text,
    days_in_stage      int,
    assigned_to        uuid,
    last_contacted_at  timestamptz,
    stage_changed_at   timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_org_member(p_org_id) THEN
        RAISE EXCEPTION 'not_found_or_denied';
    END IF;

    RETURN QUERY
    SELECT
        ls.id,
        ls.pipeline_stage,
        ls.workflow_subsection,
        EXTRACT(DAY FROM now() - COALESCE(ls.stage_changed_at, ls.created_at))::int,
        ls.assigned_to,
        ls.last_contacted_at,
        ls.stage_changed_at
    FROM public.lead_submissions ls
    WHERE ls.org_id = p_org_id
      AND ls.pipeline_stage NOT IN ('won', 'lost', 'nurture')
      AND COALESCE(ls.do_not_contact, false) = false
      AND COALESCE(ls.stage_changed_at, ls.created_at)
          <= now() - (p_threshold_days || ' days')::interval
    ORDER BY COALESCE(ls.stage_changed_at, ls.created_at) ASC;
END;
$$;
REVOKE ALL ON FUNCTION public.crm_report_stalled_leads(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_report_stalled_leads(uuid, int) TO authenticated, service_role;
COMMENT ON FUNCTION public.crm_report_stalled_leads IS
    'Returns active leads whose stage has not progressed within p_threshold_days. Drives stalled-stage alerts panel.';
COMMIT;

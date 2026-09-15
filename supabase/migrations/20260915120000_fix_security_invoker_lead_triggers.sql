-- ============================================================
-- Make the two lead/deal trigger functions that read RLS tables SECURITY DEFINER
-- ============================================================
-- Both of these fire on writes that an anonymous caller can reach (the
-- submit_public_lead RPC path), and both read a lookup table that has RLS
-- enabled. Running as SECURITY INVOKER, the lookup returns nothing for a
-- caller who cannot see the table, and each fails in its own quiet way:
--
--   crm_validate_deal_product_line reads public.crm_product_lines (RLS on,
--   2 policies). No row found means the NOT FOUND branch fires and the write
--   is rejected as 'Invalid product_line' even for a perfectly valid slug.
--
--   crm_lead_workflow_subsection_sync reads public.crm_pipeline_stages (RLS
--   on, 6 policies). No row found leaves v_route NULL, so the lead silently
--   keeps its default workflow_subsection and lands in the wrong place --
--   no error, just mis-routed leads.
--
-- crm_validate_lead_source was already SECURITY DEFINER with a pinned
-- search_path; these two drifted. The drift only became visible once the DB
-- workflow could get past the baseline and actually run db_invariants.sql.
--
-- search_path is pinned to '' on both, so that running as owner cannot be
-- hijacked through a caller-controlled schema. Every reference below is
-- therefore fully qualified.
--
-- The other four BEFORE triggers on lead_submissions are deliberately left
-- as SECURITY INVOKER: they only assign fields on NEW and never read a
-- table, so owner rights would widen their privileges for no reason.
-- ============================================================

CREATE OR REPLACE FUNCTION public.crm_validate_deal_product_line()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    IF NEW.product_line IS NULL THEN
        RETURN NEW;
    END IF;

    PERFORM 1
      FROM public.crm_product_lines
     WHERE slug = NEW.product_line
       AND is_active = true
       AND (org_id = NEW.org_id OR org_id IS NULL)
     LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Invalid product_line %: must exist and be active in crm_product_lines',
            NEW.product_line
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.crm_lead_workflow_subsection_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- Hotfix: crm_validate_lead_source must run as SECURITY DEFINER so its lookup
-- against the RLS-enabled crm_lead_source_types table succeeds when the
-- BEFORE-INSERT trigger fires under the `anon` role (public form intake).
--
-- Without this fix, every unauthenticated lead submission failed with
--   "Invalid lead_source: inhouse_round_robin. Valid slugs live in
--    crm_lead_source_types (is_active=true)."
-- because the SELECT inside the trigger was filtered to zero rows by RLS.

CREATE OR REPLACE FUNCTION public.crm_validate_lead_source()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_self_gen boolean;
BEGIN
    IF NEW.lead_source IS NULL OR NEW.lead_source = '' THEN
        NEW.lead_source := 'inhouse_round_robin';
    END IF;

    SELECT is_self_generated
      INTO v_is_self_gen
    FROM public.crm_lead_source_types
    WHERE slug = NEW.lead_source
      AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION
          'Invalid lead_source: %. Valid slugs live in crm_lead_source_types (is_active=true).',
          NEW.lead_source
          USING ERRCODE = '23514';
    END IF;

    NEW.is_self_generated := COALESCE(v_is_self_gen, false);

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_validate_lead_source() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_validate_lead_source() TO anon, authenticated, service_role;
;

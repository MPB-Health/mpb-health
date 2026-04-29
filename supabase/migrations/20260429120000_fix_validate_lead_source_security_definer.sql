-- ============================================================================
-- Hotfix: crm_validate_lead_source must run as SECURITY DEFINER
--
-- Problem:
--   The BEFORE INSERT trigger on public.lead_submissions calls
--   public.crm_validate_lead_source(), which looks up NEW.lead_source against
--   public.crm_lead_source_types (RLS-enabled, SELECT policy TO authenticated
--   only). The function was created SECURITY INVOKER, so on unauthenticated
--   public form submissions (homepage hero, Get-a-Quote, etc.) the lookup runs
--   as the `anon` role, returns zero rows, and the trigger raises
--     "Invalid lead_source: inhouse_round_robin. Valid slugs live in
--      crm_lead_source_types (is_active=true)."
--   even though the slug is correctly seeded with is_active=true.
--
-- Fix:
--   Recreate the function as SECURITY DEFINER with a pinned search_path. The
--   trigger only consults a system reference table — it doesn't need caller
--   privileges, and bypassing RLS for this lookup is the same pattern used by
--   crm_is_lead_manager() in 20260423100000_crm_2026_phase1_foundations.sql.
--
--   Re-issuing the trigger isn't needed: the existing trigger binding already
--   points at the function by name and picks up the new definition.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.crm_validate_lead_source()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_self_gen boolean;
BEGIN
    -- Default to the required pipeline source when intake paths haven't set
    -- one yet. Explicit source on a subsequent UPDATE will still be validated.
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

    -- Always derive is_self_generated from the source lookup so the split that
    -- drives every 2026 report cannot drift from the picklist.
    NEW.is_self_generated := COALESCE(v_is_self_gen, false);

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_validate_lead_source() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_validate_lead_source() TO anon, authenticated, service_role;

COMMIT;

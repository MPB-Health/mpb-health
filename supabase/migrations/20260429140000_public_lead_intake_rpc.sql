-- ============================================================================
-- Public lead intake — single architectural boundary
--
-- Why this exists:
--   public.lead_submissions has historically served two consumers with
--   conflicting security models — anonymous website forms (must be able to
--   POST) and authenticated CRM staff (must be able to read/manage). Sharing
--   one direct table surface meant every change to triggers, RLS, or lookup
--   tables on the CRM side could silently break anonymous form submission.
--   The 2026-04-29 homepage hero outage (anon-role lookup against the
--   crm_lead_source_types RLS-fronted picklist returned 0 rows from a
--   SECURITY INVOKER trigger) was one such failure.
--
-- What this migration does:
--   1. Defines two RPCs as the ONLY public-side writers to lead_submissions:
--        • submit_public_lead(payload)  — anon-safe, narrow column set
--        • submit_trusted_lead(payload) — service_role only, full column set
--      Both run SECURITY DEFINER with a pinned search_path, so triggers and
--      lookups they invoke run with elevated privilege and cannot be broken
--      by RLS on referenced tables.
--   2. Removes anon's direct table-level write surface to lead_submissions.
--      Anon can no longer reach the table directly; the RPC is the only door.
--      Authenticated CRM staff retain their existing org_leads_insert policy.
--
-- What stays the same:
--   • Authenticated CRM staff still INSERT/SELECT/UPDATE/DELETE through the
--     existing RLS policies (org_leads_*).
--   • The crm_validate_lead_source trigger still runs on every insert and
--     still defaults lead_source to 'inhouse_round_robin' when unset.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Anonymous public RPC — narrow, public-safe column set.
--    Callable by anon and authenticated. Used by every website form.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_public_lead(payload jsonb)
RETURNS public.lead_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_first_name text;
    v_last_name  text;
    v_email      text;
    v_phone      text;
    v_form_data  jsonb;
    v_row        public.lead_submissions;
BEGIN
    -- ---- Coerce ----
    v_first_name := btrim(payload->>'first_name');
    v_last_name  := btrim(payload->>'last_name');
    v_email      := lower(btrim(payload->>'email'));
    v_phone      := btrim(payload->>'phone');
    v_form_data  := payload->'form_data';

    -- ---- Validate required ----
    IF v_first_name IS NULL OR length(v_first_name) = 0 THEN
        RAISE EXCEPTION 'first_name is required' USING ERRCODE = '22023';
    END IF;
    IF v_last_name IS NULL OR length(v_last_name) = 0 THEN
        RAISE EXCEPTION 'last_name is required' USING ERRCODE = '22023';
    END IF;
    IF v_email IS NULL OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RAISE EXCEPTION 'a valid email is required' USING ERRCODE = '22023';
    END IF;
    IF v_phone IS NULL OR length(v_phone) = 0 THEN
        RAISE EXCEPTION 'phone is required' USING ERRCODE = '22023';
    END IF;

    -- ---- Length caps (abuse guards on a public endpoint) ----
    IF length(v_first_name) > 100
       OR length(v_last_name)  > 100
       OR length(v_email)      > 320
       OR length(v_phone)      > 40 THEN
        RAISE EXCEPTION 'one or more fields exceed maximum length' USING ERRCODE = '22023';
    END IF;

    IF v_form_data IS NOT NULL AND octet_length(v_form_data::text) > 32768 THEN
        RAISE EXCEPTION 'form_data exceeds 32 KB' USING ERRCODE = '22023';
    END IF;

    -- ---- Insert ----
    -- Note: only public-safe columns are accepted. CRM-internal fields
    -- (org_id, lead_source, outside_advisor_id, referral_partner_id,
    -- community_event_id, pipeline_stage, assigned_to, tags, priority, ...)
    -- are NOT settable through this RPC. lead_source is left to the
    -- crm_validate_lead_source trigger to default to 'inhouse_round_robin'.
    INSERT INTO public.lead_submissions (
        user_id,
        first_name, last_name, email, phone,
        household_size, current_insurance, monthly_premium,
        coverage_preference, zip_code, primary_concern,
        contact_preference,
        source_page, source_cta,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        referrer, form_data
    )
    VALUES (
        auth.uid(),
        v_first_name, v_last_name, v_email, v_phone,
        NULLIF(payload->>'household_size','')::int,
        NULLIF(payload->>'current_insurance',''),
        NULLIF(payload->>'monthly_premium',''),
        NULLIF(payload->>'coverage_preference',''),
        NULLIF(payload->>'zip_code',''),
        NULLIF(payload->>'primary_concern',''),
        COALESCE(NULLIF(payload->>'contact_preference',''), 'phone'),
        NULLIF(payload->>'source_page',''),
        NULLIF(payload->>'source_cta',''),
        NULLIF(payload->>'utm_source',''),
        NULLIF(payload->>'utm_medium',''),
        NULLIF(payload->>'utm_campaign',''),
        NULLIF(payload->>'utm_term',''),
        NULLIF(payload->>'utm_content',''),
        NULLIF(payload->>'referrer',''),
        v_form_data
    )
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_lead(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_lead(jsonb) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.submit_public_lead(jsonb) IS
  'Public anonymous lead intake. Accepts only user-input fields; CRM-internal '
  'attribution columns (org_id, lead_source, assignment, tags, pipeline_stage) '
  'cannot be set through this entry point. Used by every form on apps/website.';

-- ----------------------------------------------------------------------------
-- 2. Trusted server-side RPC — full column set incl. CRM attribution.
--    Callable by service_role only. Used by edge functions whose request
--    context (form config, community event row) is itself authored by
--    authenticated CRM staff and therefore trusted.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_trusted_lead(payload jsonb)
RETURNS public.lead_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_row public.lead_submissions;
BEGIN
    -- Column set matches the actual lead_submissions schema (verified
    -- 2026-04-29). `source`, `company`, and `metadata` are NOT columns on
    -- this table — callers should consolidate that data into form_data
    -- (jsonb) and source_page / source_cta (text).
    INSERT INTO public.lead_submissions (
        user_id,
        org_id,
        first_name, last_name, email, phone,
        household_size, current_insurance, monthly_premium,
        coverage_preference, zip_code, primary_concern,
        contact_preference,
        source_page, source_cta,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        referrer, form_data,
        lead_source,
        outside_advisor_id, referral_partner_id, community_event_id,
        pipeline_stage, assigned_to, priority,
        tags
    )
    VALUES (
        NULLIF(payload->>'user_id','')::uuid,
        NULLIF(payload->>'org_id','')::uuid,
        NULLIF(btrim(payload->>'first_name'), ''),
        NULLIF(btrim(payload->>'last_name'),  ''),
        NULLIF(lower(btrim(payload->>'email')), ''),
        NULLIF(btrim(payload->>'phone'), ''),
        NULLIF(payload->>'household_size','')::int,
        NULLIF(payload->>'current_insurance',''),
        NULLIF(payload->>'monthly_premium',''),
        NULLIF(payload->>'coverage_preference',''),
        NULLIF(payload->>'zip_code',''),
        NULLIF(payload->>'primary_concern',''),
        COALESCE(NULLIF(payload->>'contact_preference',''), 'phone'),
        NULLIF(payload->>'source_page',''),
        NULLIF(payload->>'source_cta',''),
        NULLIF(payload->>'utm_source',''),
        NULLIF(payload->>'utm_medium',''),
        NULLIF(payload->>'utm_campaign',''),
        NULLIF(payload->>'utm_term',''),
        NULLIF(payload->>'utm_content',''),
        NULLIF(payload->>'referrer',''),
        payload->'form_data',
        NULLIF(payload->>'lead_source',''),
        NULLIF(payload->>'outside_advisor_id','')::uuid,
        NULLIF(payload->>'referral_partner_id','')::uuid,
        NULLIF(payload->>'community_event_id','')::uuid,
        NULLIF(payload->>'pipeline_stage',''),
        NULLIF(payload->>'assigned_to','')::uuid,
        NULLIF(payload->>'priority',''),
        CASE
            WHEN jsonb_typeof(payload->'tags') = 'array'
                THEN ARRAY(SELECT jsonb_array_elements_text(payload->'tags'))
            ELSE NULL
        END
    )
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_trusted_lead(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_trusted_lead(jsonb) TO service_role;

COMMENT ON FUNCTION public.submit_trusted_lead(jsonb) IS
  'Trusted server-side lead intake. Accepts the full lead_submissions column '
  'set, including CRM attribution. Callable only by service_role — used by '
  'web-form-submit and community-lead-submit edge functions.';

-- ----------------------------------------------------------------------------
-- 3. Lock down anon direct INSERT.
--    Anon retains zero direct write access; submit_public_lead is the only
--    door. Authenticated CRM staff retain INSERT via the existing
--    org_leads_insert policy. Service role bypasses RLS.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can insert lead submissions" ON public.lead_submissions;

-- Defensive: if a future migration recreates an anon-targeting INSERT policy,
-- table-level grants must still be off for anon. PostgREST requires both a
-- permissive grant AND a passing RLS policy.
REVOKE INSERT ON public.lead_submissions FROM anon;

COMMIT;

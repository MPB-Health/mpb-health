-- Raise public lead form_data ceiling from 32 KB → 640 KB (20×).
--
-- Website hero / rate-calculator payloads historically embedded full plan tier
-- matrices and were rejected with `form_data exceeds 32 KB`, dropping CRM leads.
-- Client-side sanitize still compacts tiers; this headroom covers open-enrollment
-- volume and richer quote payloads without intake rejections.

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
    v_default_org uuid;
    v_row        public.lead_submissions;
BEGIN
    v_first_name := btrim(payload->>'first_name');
    v_last_name  := btrim(payload->>'last_name');
    v_email      := lower(btrim(payload->>'email'));
    v_phone      := btrim(payload->>'phone');
    v_form_data  := payload->'form_data';

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

    IF length(v_first_name) > 100
       OR length(v_last_name)  > 100
       OR length(v_email)      > 320
       OR length(v_phone)      > 40 THEN
        RAISE EXCEPTION 'one or more fields exceed maximum length' USING ERRCODE = '22023';
    END IF;

    -- 640 KB hard ceiling (20× the original 32 KB). jsonb column itself has no
    -- practical size limit; this is an abuse / accidental-payload guard only.
    IF v_form_data IS NOT NULL AND octet_length(v_form_data::text) > 655360 THEN
        RAISE EXCEPTION 'form_data exceeds 640 KB' USING ERRCODE = '22023';
    END IF;

    SELECT NULLIF(value, '')::uuid
      INTO v_default_org
      FROM public.system_settings
     WHERE key = 'crm.intake_default_org_id'
     LIMIT 1;

    INSERT INTO public.lead_submissions (
        user_id,
        org_id,
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
        v_default_org,
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

COMMENT ON FUNCTION public.submit_public_lead(jsonb) IS
  'Public anonymous lead intake. Accepts only user-input fields; CRM-internal '
  'attribution columns (org_id, lead_source, assignment, tags, pipeline_stage) '
  'cannot be set through this entry point. org_id is sourced from '
  'system_settings.crm.intake_default_org_id so single-tenant deployments '
  'always stamp the canonical org. form_data max 640 KB (20× original). '
  'Used by every form on apps/website.';

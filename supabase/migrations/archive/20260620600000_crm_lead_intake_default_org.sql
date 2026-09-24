-- ============================================================================
-- CRM rebuild — public lead intake org_id default + 230-row backfill
--
-- Problem: `submit_public_lead` (the SECURITY DEFINER RPC used by every public
-- form on apps/website per its own COMMENT) deliberately blocks anonymous
-- callers from setting CRM-internal attribution columns, including `org_id`.
-- But it never supplied a *default* either. Every public website submission
-- since this RPC was deployed (2026-04-29) has therefore landed with
-- `org_id = NULL`. Consequences:
--
--   • RLS policy `org_leads_select` requires `org_id IS NOT NULL AND
--     is_org_member(org_id)` — so every rep who is NOT a global admin has been
--     blind to those leads. Reps last saw a "fresh" lead on 2026-01-27.
--   • `crm-website-lead-intake` reads `lead.org_id` after the RPC returns; it
--     was always null, so the Quote Response cadence was never enrolled and
--     Email #1 (auto-response from sales@mympb.com) was never sent. Every
--     website prospect since 2026-04-29 has effectively been ghosted.
--
-- Fix (Option C in the design discussion):
--
--   1. Persist a `crm.intake_default_org_id` row in `system_settings` so the
--      org id can be reconfigured without another deploy. Non-sensitive so the
--      public RPC can read it under the anon "view non-sensitive settings"
--      policy.
--   2. Recreate `submit_public_lead` to resolve and stamp `org_id` from that
--      setting. Anonymous callers still cannot override it.
--   3. Backfill all existing `org_id IS NULL` rows to the configured org so
--      reps regain visibility immediately. No retroactive emails, no
--      retroactive cadence enrollment per Option `none` in the design choice
--      (sending months-old auto-responses would do more harm than good).
--   4. Insert an `audit_logs` row recording how many leads were touched.
-- ============================================================================

BEGIN;
-- ----------------------------------------------------------------------------
-- 1. Seed the default org_id setting (idempotent).
-- ----------------------------------------------------------------------------

INSERT INTO public.system_settings (key, value, category, description, is_sensitive)
VALUES (
  'crm.intake_default_org_id',
  '00000000-0000-4000-a000-000000000001',
  'crm',
  'org_id stamped on every public lead intake (submit_public_lead) when the caller does not supply one. Single-tenant deployments should point this at the canonical org. If empty/null, intake leads will continue to land with org_id IS NULL and remain invisible to non-admin reps (RLS policy org_leads_select).',
  false
)
ON CONFLICT (key) DO UPDATE
   SET value        = EXCLUDED.value,
       category     = EXCLUDED.category,
       description  = EXCLUDED.description,
       is_sensitive = EXCLUDED.is_sensitive,
       updated_at   = now();

-- ----------------------------------------------------------------------------
-- 2. Recreate submit_public_lead so it stamps org_id from the setting.
--    Body is identical to migration 20260429140000_public_lead_intake_rpc.sql
--    plus the new org_id resolution. Anonymous callers still cannot set
--    org_id directly — the value is sourced exclusively from system_settings.
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

    IF v_form_data IS NOT NULL AND octet_length(v_form_data::text) > 32768 THEN
        RAISE EXCEPTION 'form_data exceeds 32 KB' USING ERRCODE = '22023';
    END IF;

    -- Resolve the default intake org. NULL is allowed (single-tenant
    -- deployments will always have it set; legacy deployments fall through
    -- with the legacy NULL-org_id behavior until they configure it).
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

REVOKE ALL ON FUNCTION public.submit_public_lead(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_lead(jsonb) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.submit_public_lead(jsonb) IS
  'Public anonymous lead intake. Accepts only user-input fields; CRM-internal '
  'attribution columns (org_id, lead_source, assignment, tags, pipeline_stage) '
  'cannot be set through this entry point. org_id is sourced from '
  'system_settings.crm.intake_default_org_id so single-tenant deployments '
  'always stamp the canonical org. Used by every form on apps/website.';

-- ----------------------------------------------------------------------------
-- 3. Backfill existing NULL-org leads (the 230 the user is missing).
--    Captured in a CTE so we can count and audit it in one statement.
-- ----------------------------------------------------------------------------

WITH default_org AS (
    SELECT NULLIF(value, '')::uuid AS org_id
      FROM public.system_settings
     WHERE key = 'crm.intake_default_org_id'
     LIMIT 1
),
updated AS (
    UPDATE public.lead_submissions ls
       SET org_id     = (SELECT org_id FROM default_org),
           updated_at = now()
      FROM default_org d
     WHERE ls.org_id IS NULL
       AND d.org_id IS NOT NULL
    RETURNING ls.id
)
INSERT INTO public.audit_logs (
    user_id, user_email, action, entity_type, entity_id,
    old_values, new_values, created_at
)
SELECT
    NULL,
    'system:migration',
    'crm.intake.backfill_default_org_id',
    'lead_submissions',
    'bulk:' || (SELECT count(*)::text FROM updated),
    jsonb_build_object('org_id', null),
    jsonb_build_object(
        'org_id', (SELECT org_id FROM default_org),
        'reason', 'submit_public_lead did not stamp org_id before migration 20260620600000 — backfilled per spec_alignment decision (Option backfill_all, no retro emails).',
        'rows', (SELECT count(*) FROM updated)
    ),
    now()
WHERE EXISTS (SELECT 1 FROM updated);

COMMIT;

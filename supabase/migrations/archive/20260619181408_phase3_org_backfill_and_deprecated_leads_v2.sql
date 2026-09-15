BEGIN;

CREATE TABLE IF NOT EXISTS public._backup_org_reconcile_20260701_lead_submissions (
  id uuid PRIMARY KEY,
  org_id uuid,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public._backup_org_reconcile_20260701_advisor_profiles (
  id uuid PRIMARY KEY,
  org_id uuid,
  backed_up_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public._backup_org_reconcile_20260701_lead_submissions (id, org_id)
SELECT ls.id, ls.org_id
FROM public.lead_submissions ls
WHERE ls.org_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public._backup_org_reconcile_20260701_lead_submissions b
    WHERE b.id = ls.id
  );

INSERT INTO public._backup_org_reconcile_20260701_advisor_profiles (id, org_id)
SELECT ap.id, ap.org_id
FROM public.advisor_profiles ap
WHERE ap.org_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public._backup_org_reconcile_20260701_advisor_profiles b
    WHERE b.id = ap.id
  );

DO $$
DECLARE
  v_lead_nulls int;
  v_advisor_nulls int;
  v_membership uuid;
  v_portal uuid;
BEGIN
  SELECT count(*) INTO v_lead_nulls FROM public.lead_submissions WHERE org_id IS NULL;
  IF v_lead_nulls > 11 THEN
    RAISE EXCEPTION 'lead_submissions null org_id count % exceeds expected max 11 — aborting', v_lead_nulls;
  END IF;

  SELECT count(*) INTO v_advisor_nulls FROM public.advisor_profiles WHERE org_id IS NULL;
  IF v_advisor_nulls > 23 THEN
    RAISE EXCEPTION 'advisor_profiles null org_id count % exceeds expected max 23 — aborting', v_advisor_nulls;
  END IF;

  SELECT public.resolve_org_id('mpb-health', 'membership') INTO v_membership;
  SELECT public.resolve_org_id('mpb-health', 'portal') INTO v_portal;

  IF v_membership IS NULL OR v_portal IS NULL THEN
    RAISE EXCEPTION 'resolve_org_id returned NULL';
  END IF;

  UPDATE public.lead_submissions
     SET org_id = v_membership,
         updated_at = now()
   WHERE org_id IS NULL;

  UPDATE public.advisor_profiles
     SET org_id = v_portal,
         updated_at = now()
   WHERE org_id IS NULL;

  INSERT INTO public.audit_logs (
    user_id, user_email, action, entity_type, entity_id,
    old_values, new_values, created_at
  )
  VALUES (
    NULL,
    'system:migration',
    'org_reconcile.backfill_null_org_id',
    'organization_id_map',
    'phase3-20260701',
    jsonb_build_object(
      'lead_submissions_null_before', v_lead_nulls,
      'advisor_profiles_null_before', v_advisor_nulls
    ),
    jsonb_build_object(
      'lead_submissions_org_id', v_membership,
      'advisor_profiles_org_id', v_portal,
      'lead_submissions_updated', v_lead_nulls,
      'advisor_profiles_updated', v_advisor_nulls
    ),
    now()
  );
END $$;

ALTER TABLE IF EXISTS public._deprecated_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deprecated_leads_deny_all ON public._deprecated_leads;
CREATE POLICY deprecated_leads_deny_all ON public._deprecated_leads
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMIT;;

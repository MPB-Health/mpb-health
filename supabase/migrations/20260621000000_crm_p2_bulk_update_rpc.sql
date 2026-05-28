-- Phase 2: crm_bulk_update_leads RPC
-- Atomically applies a JSONB patch to an array of lead_submissions rows.
-- Guarded by RLS (caller must pass the RLS SELECT + UPDATE policies on
-- lead_submissions for every target row).  Returns a count of rows actually
-- updated so the caller can detect partial failures (e.g. RLS filtering
-- out rows the caller can't touch).

CREATE OR REPLACE FUNCTION public.crm_bulk_update_leads(
  p_lead_ids uuid[],
  p_updates  jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated int;
  v_total   int := array_length(p_lead_ids, 1);
  v_cols    text[];
  v_key     text;
  v_set     text;
BEGIN
  IF v_total IS NULL OR v_total = 0 THEN
    RETURN jsonb_build_object('updated', 0, 'total', 0);
  END IF;

  -- Whitelist of columns callers may bulk-update.
  -- Prevents writes to system columns (id, org_id, created_at, etc.).
  FOR v_key IN SELECT jsonb_object_keys(p_updates) LOOP
    IF v_key = ANY(ARRAY[
      'pipeline_stage',
      'workflow_subsection',
      'priority',
      'assigned_to',
      'tags',
      'plan_type',
      'carrier_id',
      'source_cta',
      'utm_source',
      'current_insurance',
      'coverage_preference',
      'primary_concern',
      'monthly_premium',
      'contact_preference',
      'lost_reason',
      'do_not_contact',
      'linkedin_workflow_status',
      'notes',
      'zip_code',
      'city',
      'state',
      'first_name',
      'last_name',
      'email',
      'phone'
    ]) THEN
      v_cols := array_append(v_cols, v_key);
    END IF;
  END LOOP;

  IF array_length(v_cols, 1) IS NULL THEN
    RETURN jsonb_build_object('updated', 0, 'total', v_total,
      'error', 'no valid columns in update payload');
  END IF;

  -- Build a dynamic SET clause from whitelisted keys.
  v_set := '';
  FOR i IN 1 .. array_length(v_cols, 1) LOOP
    IF v_set <> '' THEN v_set := v_set || ', '; END IF;
    v_set := v_set || quote_ident(v_cols[i]) || ' = (' || quote_literal(p_updates ->> v_cols[i]) || ')::' ||
      (SELECT data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'lead_submissions'
         AND column_name = v_cols[i]
       LIMIT 1);
  END LOOP;

  -- Always bump updated_at.
  v_set := v_set || ', updated_at = now()';

  EXECUTE format(
    'UPDATE public.lead_submissions SET %s WHERE id = ANY($1)',
    v_set
  ) USING p_lead_ids;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN jsonb_build_object('updated', v_updated, 'total', v_total);
END;
$$;

COMMENT ON FUNCTION public.crm_bulk_update_leads(uuid[], jsonb) IS
  'Phase 2 — bulk patch for selected leads. Column-whitelisted; RLS-enforced.';

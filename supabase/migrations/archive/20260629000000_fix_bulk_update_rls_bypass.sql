-- ============================================================================
-- SECURITY FIX: crm_bulk_update_leads RLS bypass
-- ============================================================================
-- Bug: The function was declared SECURITY DEFINER, which executes it as the
-- function owner (postgres). The postgres role has BYPASSRLS, so all
-- org-scoped RLS policies on lead_submissions were silently skipped.
-- Any authenticated user could mutate leads across ALL organizations by
-- calling: supabase.rpc('crm_bulk_update_leads', { p_lead_ids: [...], ... })
--
-- Fix: Recreate with SECURITY INVOKER (the default) so the function runs
-- as the calling user's role and RLS policies are enforced naturally.
-- Also restrict EXECUTE to authenticated + service_role only.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_bulk_update_leads(
  p_lead_ids uuid[],
  p_updates  jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
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

  v_set := '';
  FOR i IN 1 .. array_length(v_cols, 1) LOOP
    IF v_set <> '' THEN v_set := v_set || ', '; END IF;
    v_set := v_set || quote_ident(v_cols[i]) || ' = (' || quote_literal(p_updates ->> v_cols[i]) || ')::' ||
      (SELECT format_type(a.atttypid, a.atttypmod)
       FROM pg_catalog.pg_attribute a
       JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
       JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname = 'lead_submissions'
         AND a.attname = v_cols[i]
         AND a.attnum > 0
         AND NOT a.attisdropped
       LIMIT 1);
  END LOOP;

  v_set := v_set || ', updated_at = now()';

  EXECUTE format(
    'UPDATE public.lead_submissions SET %s WHERE id = ANY($1)',
    v_set
  ) USING p_lead_ids;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN jsonb_build_object('updated', v_updated, 'total', v_total);
END;
$$;

REVOKE ALL ON FUNCTION public.crm_bulk_update_leads(uuid[], jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_bulk_update_leads(uuid[], jsonb) TO authenticated, service_role;

COMMENT ON FUNCTION public.crm_bulk_update_leads(uuid[], jsonb) IS
  'Bulk patch for selected leads. Column-whitelisted; RLS-enforced via SECURITY INVOKER.';

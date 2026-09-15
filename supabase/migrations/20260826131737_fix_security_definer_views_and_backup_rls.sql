-- ============================================================================
-- Fix Supabase security advisors 0010 + 0013 on MPB-MonoRepo (live 2026-08-26)
--
-- 0010 security_definer_view:
--   public.crm_v_pipeline_movement
--   public.crm_v_application_dropoff
--   public.crm_v_conversion_by_source
--   public.crm_v_special_project_rollup
--   public.crm_v_call_breakdown
--   public.crm_salesperson_roster   (live-only alias of crm_rep_roster)
--   public.organizations_unified
--
--   These views are owned by postgres with no security_invoker option, so
--   PostgREST queries run as the view owner and skip the caller's RLS.
--   Switch them to invoker security. Underlying table policies already
--   scope CRM data with is_org_member / admin helpers.
--
-- 0013 rls_disabled_in_public:
--   public._backup_org_reconcile_20260701_lead_submissions
--   public._backup_org_reconcile_20260701_advisor_profiles
--
--   One-off Phase 3 reconcile backups (id + prior org_id only). They were
--   created in public with default privileges and no RLS, so anon/authenticated
--   currently have full DML. Enable RLS, deny-all, revoke API grants.
--   service_role keeps access for unwind. Tables are not dropped.
--
-- Rollback:
--   ALTER VIEW <name> RESET (security_invoker);
--   DROP POLICY IF EXISTS <table>_deny_all ON public.<table>;
--   ALTER TABLE public.<table> DISABLE ROW LEVEL SECURITY;
--   -- do not re-GRANT to anon/authenticated unless the hole is intentional
--
-- References:
--   https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
--   https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public
-- ============================================================================

SET lock_timeout = '5s';

DO $$
DECLARE
  v_name text;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'crm_v_pipeline_movement',
    'crm_v_application_dropoff',
    'crm_v_conversion_by_source',
    'crm_v_special_project_rollup',
    'crm_v_call_breakdown',
    'crm_salesperson_roster',
    'organizations_unified'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname = v_name
         AND c.relkind = 'v'
    ) THEN
      EXECUTE format(
        'ALTER VIEW public.%I SET (security_invoker = true)',
        v_name
      );
    END IF;
  END LOOP;
END
$$;

-- Restore intended grants: CRM report views are authenticated/service_role
-- reads. Default privileges had also granted anon full DML, which made the
-- definer views a public aggregate leak. crm_salesperson_roster is
-- auto-updatable; keep writes off anon.
DO $$
DECLARE
  v_name text;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'crm_v_pipeline_movement',
    'crm_v_application_dropoff',
    'crm_v_conversion_by_source',
    'crm_v_special_project_rollup',
    'crm_v_call_breakdown',
    'crm_salesperson_roster'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname = v_name
         AND c.relkind = 'v'
    ) THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', v_name);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', v_name);
      EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', v_name);
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated, service_role', v_name);
    END IF;
  END LOOP;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = 'organizations_unified'
       AND c.relkind = 'v'
  ) THEN
    EXECUTE $sql$
      REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
        ON public.organizations_unified
        FROM anon, authenticated
    $sql$;
    EXECUTE $sql$
      GRANT SELECT ON public.organizations_unified
        TO anon, authenticated, service_role
    $sql$;
  END IF;
END
$$;

DO $$
DECLARE
  t_name text;
  p_name text;
BEGIN
  FOREACH t_name IN ARRAY ARRAY[
    '_backup_org_reconcile_20260701_lead_submissions',
    '_backup_org_reconcile_20260701_advisor_profiles'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
        FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = t_name
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);

      p_name := t_name || '_deny_all';
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_name, t_name);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (false) WITH CHECK (false)',
        p_name,
        t_name
      );

      EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', t_name);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', t_name);
      EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', t_name);

      EXECUTE format(
        'COMMENT ON TABLE public.%I IS %L',
        t_name,
        'Phase 3 org-reconcile backup (2026-07-01). Not an application table. RLS deny-all; API roles revoked. service_role only.'
      );
    END IF;
  END LOOP;
END
$$;

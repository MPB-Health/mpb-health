-- Fix admin_purge_user_dependencies: handle advisor_profiles/profiles FK chains
-- and continue past non-critical delete failures instead of aborting the whole purge.

CREATE OR REPLACE FUNCTION public.admin_purge_user_dependencies(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  aid uuid;
  sql text;
  rows_deleted bigint;
  tables_touched int := 0;
  warnings text[] := ARRAY[]::text[];
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  -- Tables that must be cleared (no ON DELETE CASCADE from auth.users)
  BEGIN
    DELETE FROM public.impersonation_log
    WHERE admin_id = p_user_id OR target_user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    warnings := array_append(warnings, 'impersonation_log: ' || SQLERRM);
  END;

  BEGIN
    DELETE FROM public.phi_access_log WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    warnings := array_append(warnings, 'phi_access_log: ' || SQLERRM);
  END;

  -- Purge rows blocking advisor_profiles deletion (before auth cascade).
  FOR aid IN
    SELECT id FROM public.advisor_profiles
    WHERE id = p_user_id OR user_id = p_user_id
  LOOP
    FOR r IN
      SELECT att.attname AS column_name, cl.relname AS table_name
      FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      JOIN pg_class ref_cl ON ref_cl.oid = con.confrelid
      JOIN pg_namespace ref_ns ON ref_ns.oid = ref_cl.relnamespace
      JOIN LATERAL unnest(con.conkey) AS ck(attnum) ON true
      JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ck.attnum
      WHERE con.contype = 'f'
        AND ref_ns.nspname = 'public'
        AND ref_cl.relname = 'advisor_profiles'
        AND ns.nspname = 'public'
        AND con.confdeltype IN ('a', 'r')
    LOOP
      BEGIN
        sql := format('DELETE FROM public.%I WHERE %I = $1', r.table_name, r.column_name);
        EXECUTE sql USING aid;
        GET DIAGNOSTICS rows_deleted = ROW_COUNT;
        IF rows_deleted > 0 THEN
          tables_touched := tables_touched + 1;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        warnings := array_append(
          warnings,
          format('%s.%s (advisor %s): %s', r.table_name, r.column_name, aid, SQLERRM)
        );
      END;
    END LOOP;
  END LOOP;

  -- Purge rows blocking public.profiles deletion.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    FOR r IN
      SELECT att.attname AS column_name, cl.relname AS table_name
      FROM pg_constraint con
      JOIN pg_class cl ON cl.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      JOIN pg_class ref_cl ON ref_cl.oid = con.confrelid
      JOIN pg_namespace ref_ns ON ref_ns.oid = ref_cl.relnamespace
      JOIN LATERAL unnest(con.conkey) AS ck(attnum) ON true
      JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ck.attnum
      WHERE con.contype = 'f'
        AND ref_ns.nspname = 'public'
        AND ref_cl.relname = 'profiles'
        AND ns.nspname = 'public'
        AND con.confdeltype IN ('a', 'r')
    LOOP
      BEGIN
        sql := format('DELETE FROM public.%I WHERE %I = $1', r.table_name, r.column_name);
        EXECUTE sql USING p_user_id;
        GET DIAGNOSTICS rows_deleted = ROW_COUNT;
        IF rows_deleted > 0 THEN
          tables_touched := tables_touched + 1;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        warnings := array_append(
          warnings,
          format('%s.%s (profile): %s', r.table_name, r.column_name, SQLERRM)
        );
      END;
    END LOOP;
  END IF;

  -- Purge all public tables with RESTRICT/NO ACTION FKs to auth.users.
  FOR r IN
    SELECT att.attname AS column_name, cl.relname AS table_name
    FROM pg_constraint con
    JOIN pg_class cl ON cl.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    JOIN pg_class ref_cl ON ref_cl.oid = con.confrelid
    JOIN pg_namespace ref_ns ON ref_ns.oid = ref_cl.relnamespace
    JOIN LATERAL unnest(con.conkey) AS ck(attnum) ON true
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ck.attnum
    WHERE con.contype = 'f'
      AND ref_ns.nspname = 'auth'
      AND ref_cl.relname = 'users'
      AND ns.nspname = 'public'
      AND con.confdeltype IN ('a', 'r')
  LOOP
    BEGIN
      sql := format('DELETE FROM public.%I WHERE %I = $1', r.table_name, r.column_name);
      EXECUTE sql USING p_user_id;
      GET DIAGNOSTICS rows_deleted = ROW_COUNT;
      IF rows_deleted > 0 THEN
        tables_touched := tables_touched + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      warnings := array_append(
        warnings,
        format('%s.%s (auth.users): %s', r.table_name, r.column_name, SQLERRM)
      );
    END;
  END LOOP;

  -- Identity rows (safe to remove before auth delete; advisor_profiles cascades from auth if any remain).
  BEGIN
    DELETE FROM public.user_roles WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    warnings := array_append(warnings, 'user_roles: ' || SQLERRM);
  END;

  BEGIN
    DELETE FROM public.admin_users WHERE id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    warnings := array_append(warnings, 'admin_users: ' || SQLERRM);
  END;

  BEGIN
    DELETE FROM public.advisor_profiles WHERE id = p_user_id OR user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    warnings := array_append(warnings, 'advisor_profiles: ' || SQLERRM);
  END;

  BEGIN
    DELETE FROM public.profiles WHERE id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    warnings := array_append(warnings, 'profiles: ' || SQLERRM);
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'tables_with_deletions', tables_touched,
    'warnings', to_jsonb(warnings)
  );
END;
$$;
REVOKE ALL ON FUNCTION public.admin_purge_user_dependencies(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_purge_user_dependencies(uuid) TO service_role;

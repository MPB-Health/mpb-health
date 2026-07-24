-- Prepares auth.users deletion by removing rows in public tables that reference
-- the user with ON DELETE RESTRICT / NO ACTION (blocks GoTrue admin.deleteUser).

CREATE OR REPLACE FUNCTION public.admin_purge_user_dependencies(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  sql text;
  rows_deleted bigint;
  tables_touched int := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  -- Known blockers without ON DELETE CASCADE on auth.users
  DELETE FROM public.impersonation_log
  WHERE admin_id = p_user_id OR target_user_id = p_user_id;

  DELETE FROM public.phi_access_log WHERE user_id = p_user_id;

  -- Remove portal identity rows before auth delete (belt-and-braces)
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  DELETE FROM public.admin_users WHERE id = p_user_id;
  DELETE FROM public.advisor_profiles WHERE id = p_user_id OR user_id = p_user_id;
  DELETE FROM public.profiles WHERE id = p_user_id;

  -- Delete rows in any public table whose FK to auth.users does not cascade/null
  FOR r IN
    SELECT
      ns.nspname AS schema_name,
      cl.relname AS table_name,
      att.attname AS column_name
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
    sql := format(
      'DELETE FROM %I.%I WHERE %I = $1',
      r.schema_name,
      r.table_name,
      r.column_name
    );
    EXECUTE sql USING p_user_id;
    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    IF rows_deleted > 0 THEN
      tables_touched := tables_touched + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'tables_with_deletions', tables_touched);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_purge_user_dependencies(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_purge_user_dependencies(uuid) TO service_role;
COMMENT ON FUNCTION public.admin_purge_user_dependencies(uuid) IS
  'Removes public-schema rows referencing auth.users before admin-delete-user hard-deletes the auth account.';

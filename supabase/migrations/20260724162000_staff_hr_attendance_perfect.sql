-- Perfect execution fixes for staff HR attendance:
-- 1) staff_ensure_profile: self-or-HR only (was world-writable via SECURITY DEFINER)
-- 2) Bidirectional link: punch session -> remote time request metadata (best-effort)
-- 3) Org-scoped SELECT helpers remain RLS-backed; tighten department/office reads for authenticated

CREATE OR REPLACE FUNCTION public.staff_ensure_profile(
  p_org_id uuid,
  p_user_id uuid
)
RETURNS public.staff_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.staff_profiles;
  v_email text;
  v_name text;
  v_title text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT public.is_staff_hr() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF p_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization required';
  END IF;

  SELECT * INTO v_row
  FROM public.staff_profiles
  WHERE org_id = p_org_id AND user_id = p_user_id;

  IF FOUND THEN
    RETURN v_row;
  END IF;

  SELECT
    coalesce(nullif(trim(au.email), ''), u.email, ''),
    nullif(trim(concat_ws(' ', au.first_name, au.last_name)), ''),
    au.title
  INTO v_email, v_name, v_title
  FROM auth.users u
  LEFT JOIN public.admin_users au ON au.id = u.id
  WHERE u.id = p_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_name IS NULL OR v_name = '' THEN
    v_name := split_part(v_email, '@', 1);
  END IF;

  INSERT INTO public.staff_profiles (
    org_id, user_id, display_name, email, title, is_active
  )
  VALUES (
    p_org_id, p_user_id, v_name, lower(v_email), v_title, true
  )
  ON CONFLICT (org_id, user_id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        email = EXCLUDED.email
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.staff_ensure_profile(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_ensure_profile(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.staff_ensure_profile(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_ensure_profile(uuid, uuid) TO service_role;

-- Best-effort reciprocal link: never abort the punch on link failure
CREATE OR REPLACE FUNCTION public.trg_staff_attendance_link_remote_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req uuid;
BEGIN
  IF NEW.metadata ? 'remote_request_id' THEN
    BEGIN
      v_req := (NEW.metadata->>'remote_request_id')::uuid;
      UPDATE public.staff_time_requests
      SET metadata = jsonb_set(
        coalesce(metadata, '{}'::jsonb),
        '{attendance_punch_ids}',
        coalesce(metadata->'attendance_punch_ids', '[]'::jsonb) || jsonb_build_array(NEW.id::text),
        true
      )
      WHERE id = v_req;
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_staff_attendance_link_remote_request ON public.staff_attendance_sessions;
CREATE TRIGGER trg_staff_attendance_link_remote_request
  AFTER INSERT ON public.staff_attendance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_staff_attendance_link_remote_request();

REVOKE ALL ON FUNCTION public.trg_staff_attendance_link_remote_request() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_staff_attendance_link_remote_request() FROM anon;
REVOKE ALL ON FUNCTION public.trg_staff_attendance_link_remote_request() FROM authenticated;

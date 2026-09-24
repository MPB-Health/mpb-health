-- Harden staff attendance RPCs: revoke anon execute; lock search_path on helpers.

REVOKE ALL ON FUNCTION public.staff_haversine_m(double precision, double precision, double precision, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_haversine_m(double precision, double precision, double precision, double precision) FROM anon;
REVOKE ALL ON FUNCTION public.staff_haversine_m(double precision, double precision, double precision, double precision) FROM authenticated;

CREATE OR REPLACE FUNCTION public.staff_haversine_m(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN NULL
    ELSE (
      2 * 6371000 * asin(
        sqrt(
          power(sin(radians(lat2 - lat1) / 2), 2)
          + cos(radians(lat1)) * cos(radians(lat2))
            * power(sin(radians(lng2 - lng1) / 2), 2)
        )
      )
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.trg_staff_profiles_remote_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_staff_hr() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.user_id = auth.uid() THEN
    IF NEW.remote_status IS DISTINCT FROM OLD.remote_status THEN
      IF NEW.remote_status = 'pending'
         AND OLD.remote_status IN ('ineligible', 'revoked', 'pending') THEN
        NEW.remote_requested_at := coalesce(NEW.remote_requested_at, now());
        NEW.remote_decided_by := NULL;
        NEW.remote_decided_at := NULL;
        NEW.remote_decision_note := NULL;
      ELSE
        RAISE EXCEPTION 'Only HR can change remote status to %', NEW.remote_status;
      END IF;
    END IF;
    NEW.department_id := OLD.department_id;
    NEW.is_active := OLD.is_active;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.staff_ensure_profile(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_ensure_profile(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.staff_ensure_profile(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_ensure_profile(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.staff_is_remote_eligible(uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_is_remote_eligible(uuid, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.staff_is_remote_eligible(uuid, timestamptz) TO authenticated;

REVOKE ALL ON FUNCTION public.staff_remote_window_id(uuid, uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_remote_window_id(uuid, uuid, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.staff_remote_window_id(uuid, uuid, timestamptz) FROM authenticated;

REVOKE ALL ON FUNCTION public.staff_attendance_punch(
  public.staff_attendance_punch_action,
  double precision,
  double precision,
  double precision,
  timestamptz,
  text
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_attendance_punch(
  public.staff_attendance_punch_action,
  double precision,
  double precision,
  double precision,
  timestamptz,
  text
) FROM anon;
GRANT EXECUTE ON FUNCTION public.staff_attendance_punch(
  public.staff_attendance_punch_action,
  double precision,
  double precision,
  double precision,
  timestamptz,
  text
) TO authenticated;

REVOKE ALL ON FUNCTION public.staff_attendance_correct(
  uuid, timestamptz, timestamptz, text, boolean
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_attendance_correct(
  uuid, timestamptz, timestamptz, text, boolean
) FROM anon;
GRANT EXECUTE ON FUNCTION public.staff_attendance_correct(
  uuid, timestamptz, timestamptz, text, boolean
) TO authenticated;

REVOKE ALL ON FUNCTION public.staff_default_org_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_default_org_id() FROM anon;
REVOKE ALL ON FUNCTION public.staff_default_org_id() FROM authenticated;

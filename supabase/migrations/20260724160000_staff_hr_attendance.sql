-- Staff Hub HR: departments, roster profiles, office geofence, attendance punches.
-- Additive. Workforce PII (attendance + geo). Geo gate is punch-only (not SSO).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.staff_remote_status AS ENUM (
    'ineligible',
    'pending',
    'approved',
    'revoked'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.staff_punch_method AS ENUM (
    'office_geo',
    'remote',
    'hr_manual'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.staff_attendance_session_status AS ENUM (
    'open',
    'closed',
    'forced_closed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.staff_attendance_punch_action AS ENUM (
    'clock_in',
    'clock_out'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.staff_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_departments_name_nonempty CHECK (length(trim(name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_departments_org_name_lower
  ON public.staff_departments (org_id, lower(name));

CREATE INDEX IF NOT EXISTS idx_staff_departments_org_active
  ON public.staff_departments (org_id, is_active, sort_order);

CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.staff_departments(id) ON DELETE SET NULL,
  display_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  title text,
  remote_status public.staff_remote_status NOT NULL DEFAULT 'ineligible',
  remote_requested_at timestamptz,
  remote_request_note text,
  remote_decided_by uuid REFERENCES auth.users(id),
  remote_decided_at timestamptz,
  remote_decision_note text,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_profiles_org_user_uniq UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_org_active
  ON public.staff_profiles (org_id, is_active, display_name);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_remote_status
  ON public.staff_profiles (org_id, remote_status)
  WHERE remote_status IN ('pending', 'approved');
CREATE INDEX IF NOT EXISTS idx_staff_profiles_department
  ON public.staff_profiles (department_id);

CREATE TABLE IF NOT EXISTS public.staff_office_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  label text NOT NULL DEFAULT 'MPB Health Office',
  address_line text NOT NULL,
  city text,
  state text,
  postal_code text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius_m integer NOT NULL DEFAULT 150,
  max_accuracy_m integer NOT NULL DEFAULT 100,
  accuracy_credit_cap_m integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_office_radius_chk CHECK (radius_m > 0 AND radius_m <= 5000),
  CONSTRAINT staff_office_accuracy_chk CHECK (max_accuracy_m > 0)
);

CREATE INDEX IF NOT EXISTS idx_staff_office_locations_org_active
  ON public.staff_office_locations (org_id, is_active);

CREATE TABLE IF NOT EXISTS public.staff_attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  status public.staff_attendance_session_status NOT NULL DEFAULT 'open',
  method public.staff_punch_method NOT NULL,
  clock_in_at timestamptz NOT NULL DEFAULT now(),
  clock_out_at timestamptz,
  office_location_id uuid REFERENCES public.staff_office_locations(id),
  clock_in_lat double precision,
  clock_in_lng double precision,
  clock_in_accuracy_m double precision,
  clock_in_distance_m double precision,
  clock_out_lat double precision,
  clock_out_lng double precision,
  clock_out_accuracy_m double precision,
  clock_out_distance_m double precision,
  client_ts_in timestamptz,
  client_ts_out timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_attendance_range_chk CHECK (
    clock_out_at IS NULL OR clock_out_at >= clock_in_at
  )
);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_sessions_user
  ON public.staff_attendance_sessions (org_id, user_id, clock_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_sessions_open
  ON public.staff_attendance_sessions (org_id, user_id)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_staff_attendance_sessions_day
  ON public.staff_attendance_sessions (org_id, clock_in_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_attendance_sessions_idempotency
  ON public.staff_attendance_sessions (org_id, ((metadata ->> 'idempotency_key')))
  WHERE metadata ? 'idempotency_key';

CREATE TABLE IF NOT EXISTS public.staff_attendance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.staff_attendance_sessions(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid REFERENCES auth.users(id),
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_events_session
  ON public.staff_attendance_events (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_events_org
  ON public.staff_attendance_events (org_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_staff_hr_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_staff_departments_updated_at ON public.staff_departments;
CREATE TRIGGER trg_staff_departments_updated_at
  BEFORE UPDATE ON public.staff_departments
  FOR EACH ROW EXECUTE FUNCTION public.trg_staff_hr_set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_profiles_updated_at ON public.staff_profiles;
CREATE TRIGGER trg_staff_profiles_updated_at
  BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_staff_hr_set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_office_locations_updated_at ON public.staff_office_locations;
CREATE TRIGGER trg_staff_office_locations_updated_at
  BEFORE UPDATE ON public.staff_office_locations
  FOR EACH ROW EXECUTE FUNCTION public.trg_staff_hr_set_updated_at();

DROP TRIGGER IF EXISTS trg_staff_attendance_sessions_updated_at ON public.staff_attendance_sessions;
CREATE TRIGGER trg_staff_attendance_sessions_updated_at
  BEFORE UPDATE ON public.staff_attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION public.trg_staff_hr_set_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.staff_haversine_m(
  lat1 double precision,
  lng1 double precision,
  lat2 double precision,
  lng2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
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

CREATE OR REPLACE FUNCTION public.staff_default_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM public.organizations WHERE slug = 'mpb-health' LIMIT 1;
$$;

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
GRANT EXECUTE ON FUNCTION public.staff_ensure_profile(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_ensure_profile(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.staff_is_remote_eligible(
  p_user_id uuid,
  p_at timestamptz DEFAULT now()
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid := public.staff_default_org_id();
  v_standing boolean := false;
  v_window boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Callers may only check self unless HR
  IF p_user_id IS DISTINCT FROM auth.uid() AND NOT public.is_staff_hr() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.staff_profiles sp
    WHERE sp.org_id = v_org
      AND sp.user_id = p_user_id
      AND sp.is_active
      AND sp.remote_status = 'approved'
  ) INTO v_standing;

  IF v_standing THEN
    RETURN true;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.staff_time_requests r
    WHERE r.org_id = v_org
      AND r.user_id = p_user_id
      AND r.type = 'remote'
      AND r.status = 'approved'
      AND r.starts_at <= p_at
      AND r.ends_at >= p_at
  ) INTO v_window;

  RETURN v_window;
END;
$$;

REVOKE ALL ON FUNCTION public.staff_is_remote_eligible(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_is_remote_eligible(uuid, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.staff_remote_window_id(
  p_org_id uuid,
  p_user_id uuid,
  p_at timestamptz
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id
  FROM public.staff_time_requests r
  WHERE r.org_id = p_org_id
    AND r.user_id = p_user_id
    AND r.type = 'remote'
    AND r.status = 'approved'
    AND r.starts_at <= p_at
    AND r.ends_at >= p_at
  ORDER BY r.starts_at DESC
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- Punch engine (sole staff writer for sessions)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.staff_attendance_punch(
  p_action public.staff_attendance_punch_action,
  p_lat double precision DEFAULT NULL,
  p_lng double precision DEFAULT NULL,
  p_accuracy_m double precision DEFAULT NULL,
  p_client_ts timestamptz DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_org uuid := public.staff_default_org_id();
  v_now timestamptz := now();
  v_profile public.staff_profiles;
  v_remote boolean;
  v_office public.staff_office_locations;
  v_distance double precision;
  v_allowed_radius double precision;
  v_method public.staff_punch_method;
  v_session public.staff_attendance_sessions;
  v_existing public.staff_attendance_sessions;
  v_remote_req uuid;
  v_meta jsonb;
  v_geo_result text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Organization not configured';
  END IF;

  v_profile := public.staff_ensure_profile(v_org, v_uid);
  IF NOT v_profile.is_active THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'inactive_profile',
      'message', 'Your staff profile is inactive. Contact HR.'
    );
  END IF;

  IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
    SELECT * INTO v_existing
    FROM public.staff_attendance_sessions s
    WHERE s.org_id = v_org
      AND s.metadata->>'idempotency_key' = p_idempotency_key
    LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'ok', true,
        'deduped', true,
        'session', to_jsonb(v_existing)
      );
    END IF;
  END IF;

  v_remote := public.staff_is_remote_eligible(v_uid, v_now);

  IF p_action = 'clock_in' THEN
    SELECT * INTO v_session
    FROM public.staff_attendance_sessions s
    WHERE s.org_id = v_org
      AND s.user_id = v_uid
      AND s.status = 'open'
    ORDER BY s.clock_in_at DESC
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'already_clocked_in',
        'message', 'You already have an open attendance session.',
        'session', to_jsonb(v_session)
      );
    END IF;

    IF v_remote THEN
      v_method := 'remote';
      v_geo_result := 'skipped_remote';
      v_remote_req := public.staff_remote_window_id(v_org, v_uid, v_now);
      v_meta := jsonb_build_object(
        'geo_result', v_geo_result,
        'remote_standing', (
          SELECT sp.remote_status = 'approved'
          FROM public.staff_profiles sp
          WHERE sp.id = v_profile.id
        )
      );
      IF v_remote_req IS NOT NULL THEN
        v_meta := v_meta || jsonb_build_object('remote_request_id', v_remote_req);
      END IF;
      IF p_idempotency_key IS NOT NULL THEN
        v_meta := v_meta || jsonb_build_object('idempotency_key', p_idempotency_key);
      END IF;

      INSERT INTO public.staff_attendance_sessions (
        org_id, user_id, status, method, clock_in_at, client_ts_in, metadata
      )
      VALUES (
        v_org, v_uid, 'open', v_method, v_now, p_client_ts, v_meta
      )
      RETURNING * INTO v_session;

      INSERT INTO public.staff_attendance_events (
        session_id, org_id, user_id, actor_id, action, detail
      )
      VALUES (
        v_session.id, v_org, v_uid, v_uid, 'clock_in',
        jsonb_build_object('method', v_method, 'geo_result', v_geo_result)
      );

      RETURN jsonb_build_object('ok', true, 'session', to_jsonb(v_session));
    END IF;

    -- Office geo required
    IF p_lat IS NULL OR p_lng IS NULL THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'location_required',
        'message', 'Location is required to clock in at the office.'
      );
    END IF;

    SELECT * INTO v_office
    FROM public.staff_office_locations o
    WHERE o.org_id = v_org AND o.is_active
    ORDER BY o.created_at ASC
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'office_not_configured',
        'message', 'Office location is not configured. Contact HR.'
      );
    END IF;

    IF p_accuracy_m IS NOT NULL AND p_accuracy_m > v_office.max_accuracy_m THEN
      INSERT INTO public.staff_attendance_events (
        session_id, org_id, user_id, actor_id, action, detail
      )
      VALUES (
        NULL, v_org, v_uid, v_uid, 'punch_rejected',
        jsonb_build_object(
          'action', 'clock_in',
          'geo_result', 'accuracy_poor',
          'accuracy_m', p_accuracy_m,
          'max_accuracy_m', v_office.max_accuracy_m
        )
      );
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'accuracy_poor',
        'message', format(
          'GPS accuracy is too low (%.0f m). Move outdoors or closer to a window and try again.',
          p_accuracy_m
        ),
        'accuracy_m', p_accuracy_m,
        'max_accuracy_m', v_office.max_accuracy_m
      );
    END IF;

    -- Reject absurd claimed accuracy of exactly 0 without coords noise (soft: allow < 1)
    v_distance := public.staff_haversine_m(
      p_lat, p_lng, v_office.latitude, v_office.longitude
    );
    v_allowed_radius := v_office.radius_m
      + LEAST(coalesce(p_accuracy_m, 0), v_office.accuracy_credit_cap_m);

    IF v_distance > v_allowed_radius THEN
      INSERT INTO public.staff_attendance_events (
        session_id, org_id, user_id, actor_id, action, detail
      )
      VALUES (
        NULL, v_org, v_uid, v_uid, 'punch_rejected',
        jsonb_build_object(
          'action', 'clock_in',
          'geo_result', 'too_far',
          'distance_m', round(v_distance::numeric, 1),
          'allowed_m', round(v_allowed_radius::numeric, 1),
          'office_location_id', v_office.id
        )
      );
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'too_far',
        'message', format(
          'You are about %.0f m from the office (need to be within %.0f m).',
          v_distance,
          v_allowed_radius
        ),
        'distance_m', round(v_distance::numeric, 1),
        'allowed_m', round(v_allowed_radius::numeric, 1),
        'office_label', v_office.label
      );
    END IF;

    v_method := 'office_geo';
    v_geo_result := 'ok';
    v_meta := jsonb_build_object('geo_result', v_geo_result);
    IF p_idempotency_key IS NOT NULL THEN
      v_meta := v_meta || jsonb_build_object('idempotency_key', p_idempotency_key);
    END IF;

    INSERT INTO public.staff_attendance_sessions (
      org_id, user_id, status, method, clock_in_at,
      office_location_id,
      clock_in_lat, clock_in_lng, clock_in_accuracy_m, clock_in_distance_m,
      client_ts_in, metadata
    )
    VALUES (
      v_org, v_uid, 'open', v_method, v_now,
      v_office.id,
      p_lat, p_lng, p_accuracy_m, v_distance,
      p_client_ts, v_meta
    )
    RETURNING * INTO v_session;

    INSERT INTO public.staff_attendance_events (
      session_id, org_id, user_id, actor_id, action, detail
    )
    VALUES (
      v_session.id, v_org, v_uid, v_uid, 'clock_in',
      jsonb_build_object(
        'method', v_method,
        'geo_result', v_geo_result,
        'distance_m', round(v_distance::numeric, 1)
      )
    );

    RETURN jsonb_build_object('ok', true, 'session', to_jsonb(v_session));
  END IF;

  -- clock_out
  SELECT * INTO v_session
  FROM public.staff_attendance_sessions s
  WHERE s.org_id = v_org
    AND s.user_id = v_uid
    AND s.status = 'open'
  ORDER BY s.clock_in_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'not_clocked_in',
      'message', 'No open attendance session to clock out of.'
    );
  END IF;

  IF v_session.method = 'remote' OR v_remote THEN
    UPDATE public.staff_attendance_sessions
    SET
      status = 'closed',
      clock_out_at = v_now,
      client_ts_out = p_client_ts,
      metadata = CASE
        WHEN p_idempotency_key IS NOT NULL THEN
          metadata || jsonb_build_object('out_idempotency_key', p_idempotency_key)
        ELSE metadata
      END
    WHERE id = v_session.id
    RETURNING * INTO v_session;

    INSERT INTO public.staff_attendance_events (
      session_id, org_id, user_id, actor_id, action, detail
    )
    VALUES (
      v_session.id, v_org, v_uid, v_uid, 'clock_out',
      jsonb_build_object('method', v_session.method, 'geo_result', 'skipped_remote')
    );

    RETURN jsonb_build_object('ok', true, 'session', to_jsonb(v_session));
  END IF;

  IF p_lat IS NULL OR p_lng IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'location_required',
      'message', 'Location is required to clock out at the office.'
    );
  END IF;

  SELECT * INTO v_office
  FROM public.staff_office_locations o
  WHERE o.id = coalesce(v_session.office_location_id, (
    SELECT id FROM public.staff_office_locations
    WHERE org_id = v_org AND is_active
    ORDER BY created_at ASC LIMIT 1
  ));

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'office_not_configured',
      'message', 'Office location is not configured. Contact HR.'
    );
  END IF;

  IF p_accuracy_m IS NOT NULL AND p_accuracy_m > v_office.max_accuracy_m THEN
    INSERT INTO public.staff_attendance_events (
      session_id, org_id, user_id, actor_id, action, detail
    )
    VALUES (
      v_session.id, v_org, v_uid, v_uid, 'punch_rejected',
      jsonb_build_object(
        'action', 'clock_out',
        'geo_result', 'accuracy_poor',
        'accuracy_m', p_accuracy_m
      )
    );
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'accuracy_poor',
      'message', format(
        'GPS accuracy is too low (%.0f m). Move outdoors or closer to a window and try again.',
        p_accuracy_m
      )
    );
  END IF;

  v_distance := public.staff_haversine_m(
    p_lat, p_lng, v_office.latitude, v_office.longitude
  );
  v_allowed_radius := v_office.radius_m
    + LEAST(coalesce(p_accuracy_m, 0), v_office.accuracy_credit_cap_m);

  IF v_distance > v_allowed_radius THEN
    INSERT INTO public.staff_attendance_events (
      session_id, org_id, user_id, actor_id, action, detail
    )
    VALUES (
      v_session.id, v_org, v_uid, v_uid, 'punch_rejected',
      jsonb_build_object(
        'action', 'clock_out',
        'geo_result', 'too_far',
        'distance_m', round(v_distance::numeric, 1),
        'allowed_m', round(v_allowed_radius::numeric, 1)
      )
    );
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'too_far',
      'message', format(
        'You are about %.0f m from the office (need to be within %.0f m).',
        v_distance,
        v_allowed_radius
      ),
      'distance_m', round(v_distance::numeric, 1),
      'allowed_m', round(v_allowed_radius::numeric, 1)
    );
  END IF;

  UPDATE public.staff_attendance_sessions
  SET
    status = 'closed',
    clock_out_at = v_now,
    clock_out_lat = p_lat,
    clock_out_lng = p_lng,
    clock_out_accuracy_m = p_accuracy_m,
    clock_out_distance_m = v_distance,
    client_ts_out = p_client_ts,
    office_location_id = coalesce(office_location_id, v_office.id),
    metadata = CASE
      WHEN p_idempotency_key IS NOT NULL THEN
        metadata || jsonb_build_object('out_idempotency_key', p_idempotency_key)
      ELSE metadata
    END
  WHERE id = v_session.id
  RETURNING * INTO v_session;

  INSERT INTO public.staff_attendance_events (
    session_id, org_id, user_id, actor_id, action, detail
  )
  VALUES (
    v_session.id, v_org, v_uid, v_uid, 'clock_out',
    jsonb_build_object(
      'method', 'office_geo',
      'geo_result', 'ok',
      'distance_m', round(v_distance::numeric, 1)
    )
  );

  RETURN jsonb_build_object('ok', true, 'session', to_jsonb(v_session));
END;
$$;

REVOKE ALL ON FUNCTION public.staff_attendance_punch(
  public.staff_attendance_punch_action,
  double precision,
  double precision,
  double precision,
  timestamptz,
  text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_attendance_punch(
  public.staff_attendance_punch_action,
  double precision,
  double precision,
  double precision,
  timestamptz,
  text
) TO authenticated;

CREATE OR REPLACE FUNCTION public.staff_attendance_correct(
  p_session_id uuid,
  p_clock_in_at timestamptz DEFAULT NULL,
  p_clock_out_at timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_force_close boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_session public.staff_attendance_sessions;
BEGIN
  IF v_uid IS NULL OR NOT public.is_staff_hr() THEN
    RAISE EXCEPTION 'Access denied: staff_hr required';
  END IF;

  SELECT * INTO v_session
  FROM public.staff_attendance_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  UPDATE public.staff_attendance_sessions
  SET
    clock_in_at = coalesce(p_clock_in_at, clock_in_at),
    clock_out_at = CASE
      WHEN p_force_close AND clock_out_at IS NULL THEN coalesce(p_clock_out_at, now())
      ELSE coalesce(p_clock_out_at, clock_out_at)
    END,
    status = CASE
      WHEN p_force_close OR coalesce(p_clock_out_at, clock_out_at) IS NOT NULL THEN
        CASE WHEN p_force_close THEN 'forced_closed'::public.staff_attendance_session_status
             ELSE 'closed'::public.staff_attendance_session_status
        END
      ELSE status
    END,
    notes = coalesce(p_notes, notes),
    method = CASE
      WHEN method = 'hr_manual' THEN method
      WHEN p_clock_in_at IS NOT NULL OR p_clock_out_at IS NOT NULL OR p_force_close THEN
        CASE WHEN method = 'remote' THEN method ELSE 'hr_manual'::public.staff_punch_method END
      ELSE method
    END,
    metadata = metadata || jsonb_build_object(
      'human_edited', true,
      'corrected_by', v_uid,
      'corrected_at', now()
    )
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  INSERT INTO public.staff_attendance_events (
    session_id, org_id, user_id, actor_id, action, detail
  )
  VALUES (
    v_session.id, v_session.org_id, v_session.user_id, v_uid, 'corrected',
    jsonb_build_object(
      'clock_in_at', p_clock_in_at,
      'clock_out_at', p_clock_out_at,
      'force_close', p_force_close,
      'notes', p_notes
    )
  );

  RETURN jsonb_build_object('ok', true, 'session', to_jsonb(v_session));
END;
$$;

REVOKE ALL ON FUNCTION public.staff_attendance_correct(
  uuid, timestamptz, timestamptz, text, boolean
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_attendance_correct(
  uuid, timestamptz, timestamptz, text, boolean
) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.staff_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_office_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_departments_select ON public.staff_departments;
CREATE POLICY staff_departments_select ON public.staff_departments
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS staff_departments_hr_write ON public.staff_departments;
CREATE POLICY staff_departments_hr_write ON public.staff_departments
  FOR ALL TO authenticated
  USING (public.is_staff_hr())
  WITH CHECK (public.is_staff_hr());

DROP POLICY IF EXISTS staff_profiles_select ON public.staff_profiles;
CREATE POLICY staff_profiles_select ON public.staff_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_hr());

DROP POLICY IF EXISTS staff_profiles_self_insert ON public.staff_profiles;
CREATE POLICY staff_profiles_self_insert ON public.staff_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND remote_status IN ('ineligible', 'pending')
  );

DROP POLICY IF EXISTS staff_profiles_self_update ON public.staff_profiles;
CREATE POLICY staff_profiles_self_update ON public.staff_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_hr())
  WITH CHECK (user_id = auth.uid() OR public.is_staff_hr());

-- Staff may request remote (pending) but cannot self-approve/revoke.
CREATE OR REPLACE FUNCTION public.trg_staff_profiles_remote_guard()
RETURNS trigger
LANGUAGE plpgsql
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
    -- Staff cannot reassign department or deactivate themselves via this path
    NEW.department_id := OLD.department_id;
    NEW.is_active := OLD.is_active;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_staff_profiles_remote_guard ON public.staff_profiles;
CREATE TRIGGER trg_staff_profiles_remote_guard
  BEFORE INSERT OR UPDATE ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_staff_profiles_remote_guard();

DROP POLICY IF EXISTS staff_office_locations_select ON public.staff_office_locations;
CREATE POLICY staff_office_locations_select ON public.staff_office_locations
  FOR SELECT TO authenticated
  USING (is_active OR public.is_staff_hr());

DROP POLICY IF EXISTS staff_office_locations_hr_write ON public.staff_office_locations;
CREATE POLICY staff_office_locations_hr_write ON public.staff_office_locations
  FOR ALL TO authenticated
  USING (public.is_staff_hr())
  WITH CHECK (public.is_staff_hr());

DROP POLICY IF EXISTS staff_attendance_sessions_select ON public.staff_attendance_sessions;
CREATE POLICY staff_attendance_sessions_select ON public.staff_attendance_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_hr());

-- No direct insert/update/delete for sessions for authenticated — RPC is writer.
-- HR can update via staff_attendance_correct (SECURITY DEFINER). Optional HR select already above.

DROP POLICY IF EXISTS staff_attendance_events_select ON public.staff_attendance_events;
CREATE POLICY staff_attendance_events_select ON public.staff_attendance_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR actor_id = auth.uid() OR public.is_staff_hr());

GRANT SELECT ON public.staff_departments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.staff_profiles TO authenticated;
GRANT SELECT ON public.staff_office_locations TO authenticated;
GRANT SELECT ON public.staff_attendance_sessions TO authenticated;
GRANT SELECT ON public.staff_attendance_events TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.staff_departments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.staff_office_locations TO authenticated;

-- ---------------------------------------------------------------------------
-- Seed: Boca office + default departments + roster backfill
-- ---------------------------------------------------------------------------
INSERT INTO public.staff_office_locations (
  org_id, label, address_line, city, state, postal_code,
  latitude, longitude, radius_m, max_accuracy_m, accuracy_credit_cap_m, is_active
)
SELECT
  o.id,
  'MPB Health Office',
  '5301 N Federal Hwy, Suite 155',
  'Boca Raton',
  'FL',
  '33487',
  26.3683,
  -80.0811,
  150,
  100,
  50,
  true
FROM public.organizations o
WHERE o.slug = 'mpb-health'
  AND NOT EXISTS (
    SELECT 1 FROM public.staff_office_locations sol
    WHERE sol.org_id = o.id AND sol.is_active
  );

INSERT INTO public.staff_departments (org_id, name, sort_order)
SELECT o.id, d.name, d.sort_order
FROM public.organizations o
CROSS JOIN (
  VALUES
    ('Operations', 10),
    ('Member Services', 20),
    ('Billing', 30),
    ('Concierge', 40),
    ('Sales', 50),
    ('Technology', 60),
    ('Leadership', 70),
    ('HR / People', 80)
) AS d(name, sort_order)
WHERE o.slug = 'mpb-health'
  AND NOT EXISTS (
    SELECT 1 FROM public.staff_departments sd
    WHERE sd.org_id = o.id AND lower(sd.name) = lower(d.name)
  );

-- Backfill roster from active admin_users (Staff Hub identity store).
-- Live currently has no role='staff' rows; include all active admin identities.
INSERT INTO public.staff_profiles (
  org_id, user_id, display_name, email, title, is_active
)
SELECT
  o.id,
  au.id,
  coalesce(
    nullif(trim(concat_ws(' ', au.first_name, au.last_name)), ''),
    split_part(au.email, '@', 1)
  ),
  lower(au.email),
  au.title,
  true
FROM public.admin_users au
CROSS JOIN public.organizations o
WHERE o.slug = 'mpb-health'
  AND au.status = 'active'
ON CONFLICT (org_id, user_id) DO NOTHING;

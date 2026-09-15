-- Postgres format() does not support printf-style %.0f; it crashed punches with
-- "unrecognized format() type specifier '.'" (HTTP 400) on too_far / accuracy_poor.

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
          'GPS accuracy is too low (%s m). Move outdoors or closer to a window and try again.',
          round(p_accuracy_m)::text
        ),
        'accuracy_m', p_accuracy_m,
        'max_accuracy_m', v_office.max_accuracy_m
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
          'You are about %s m from the office (need to be within %s m).',
          round(v_distance)::text,
          round(v_allowed_radius)::text
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
        'GPS accuracy is too low (%s m). Move outdoors or closer to a window and try again.',
        round(p_accuracy_m)::text
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
        'You are about %s m from the office (need to be within %s m).',
        round(v_distance)::text,
        round(v_allowed_radius)::text
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

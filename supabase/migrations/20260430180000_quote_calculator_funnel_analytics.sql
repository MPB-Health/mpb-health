-- ============================================================================
-- Hero / quote calculator funnel — anonymous events + staff analytics
-- Website records: results_viewed, contact_opened, lead_submitted (session-scoped).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.quote_calculator_funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('results_viewed', 'contact_opened', 'lead_submitted')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_quote_funnel_created_at ON public.quote_calculator_funnel_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_funnel_session ON public.quote_calculator_funnel_events (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_funnel_event_type ON public.quote_calculator_funnel_events (event_type, created_at DESC);

COMMENT ON TABLE public.quote_calculator_funnel_events IS
  'Anonymous hero calculator funnel: results shown vs contact opened vs lead submitted.';

ALTER TABLE public.quote_calculator_funnel_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can select quote funnel events" ON public.quote_calculator_funnel_events;
CREATE POLICY "Staff can select quote funnel events"
  ON public.quote_calculator_funnel_events
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_admin_access()
    OR public.current_user_has_super_admin_access()
    OR public.current_user_has_extended_admin_access()
  );

GRANT SELECT ON public.quote_calculator_funnel_events TO authenticated;
GRANT ALL ON public.quote_calculator_funnel_events TO service_role;

-- Realtime: staff dashboards subscribe for live inserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'quote_calculator_funnel_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quote_calculator_funnel_events;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not add quote_calculator_funnel_events to supabase_realtime: %', SQLERRM;
END;
$$;

-- -----------------------------------------------------------------------------
-- Public insert RPC (anon — only path for website tracking)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_quote_calculator_event(payload jsonb)
RETURNS public.quote_calculator_funnel_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session text;
  v_type text;
  v_meta jsonb;
  v_row public.quote_calculator_funnel_events;
BEGIN
  v_session := btrim(payload->>'session_id');
  v_type := btrim(payload->>'event_type');
  v_meta := COALESCE(payload->'metadata', '{}'::jsonb);

  IF v_session IS NULL OR v_session !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'session_id must be a UUID' USING ERRCODE = '22023';
  END IF;

  IF v_type IS NULL OR v_type NOT IN ('results_viewed', 'contact_opened', 'lead_submitted') THEN
    RAISE EXCEPTION 'invalid event_type' USING ERRCODE = '22023';
  END IF;

  IF octet_length(v_meta::text) > 16384 THEN
    RAISE EXCEPTION 'metadata too large' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.quote_calculator_funnel_events (session_id, event_type, metadata)
  VALUES (v_session, v_type, v_meta)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.record_quote_calculator_event(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_quote_calculator_event(jsonb) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.record_quote_calculator_event(jsonb) IS
  'Anonymous hero calculator funnel tracking; callable from public website.';

-- -----------------------------------------------------------------------------
-- Aggregates for dashboards (authenticated staff only)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_quote_results_analytics(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_since timestamptz;
  v_days integer;
  v_sessions_with_results bigint;
  v_sessions_converted bigint;
  v_sessions_abandoned bigint;
  v_events_results bigint;
  v_events_contact bigint;
  v_events_lead bigint;
  v_rate numeric;
  v_by_day jsonb;
BEGIN
  IF NOT (
    public.current_user_has_admin_access()
    OR public.current_user_has_super_admin_access()
    OR public.current_user_has_extended_admin_access()
  ) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  v_days := GREATEST(1, LEAST(COALESCE(p_days, 30), 366));
  v_since := now() - (v_days || ' days')::interval;

  WITH ev AS (
    SELECT *
    FROM public.quote_calculator_funnel_events
    WHERE created_at >= v_since
  ),
  sessions_results AS (
    SELECT DISTINCT session_id FROM ev WHERE event_type = 'results_viewed'
  ),
  sessions_lead AS (
    SELECT DISTINCT session_id FROM ev WHERE event_type = 'lead_submitted'
  ),
  sessions_converted AS (
    SELECT session_id FROM sessions_results
    INTERSECT
    SELECT session_id FROM sessions_lead
  )
  SELECT
    (SELECT COUNT(*) FROM sessions_results),
    (SELECT COUNT(*) FROM sessions_converted),
    (SELECT COUNT(*) FROM sessions_results sr
      WHERE NOT EXISTS (SELECT 1 FROM sessions_converted c WHERE c.session_id = sr.session_id)),
    (SELECT COUNT(*) FROM ev WHERE event_type = 'results_viewed'),
    (SELECT COUNT(*) FROM ev WHERE event_type = 'contact_opened'),
    (SELECT COUNT(*) FROM ev WHERE event_type = 'lead_submitted')
  INTO
    v_sessions_with_results,
    v_sessions_converted,
    v_sessions_abandoned,
    v_events_results,
    v_events_contact,
    v_events_lead;

  v_rate := CASE WHEN v_sessions_with_results > 0 THEN
    ROUND((v_sessions_converted::numeric / v_sessions_with_results::numeric)::numeric, 4)
  ELSE 0 END;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'date', d,
      'results_events', results_events,
      'contact_events', contact_events,
      'lead_events', lead_events
    ) ORDER BY d
  ), '[]'::jsonb)
  INTO v_by_day
  FROM (
    SELECT
      (created_at AT TIME ZONE 'UTC')::date AS d,
      COUNT(*) FILTER (WHERE event_type = 'results_viewed') AS results_events,
      COUNT(*) FILTER (WHERE event_type = 'contact_opened') AS contact_events,
      COUNT(*) FILTER (WHERE event_type = 'lead_submitted') AS lead_events
    FROM public.quote_calculator_funnel_events
    WHERE created_at >= v_since
    GROUP BY 1
  ) daily;

  RETURN jsonb_build_object(
    'period_days', v_days,
    'since', v_since,
    'sessions_with_results', v_sessions_with_results,
    'sessions_converted', v_sessions_converted,
    'sessions_abandoned', v_sessions_abandoned,
    'conversion_rate', v_rate,
    'events_results_viewed', v_events_results,
    'events_contact_opened', v_events_contact,
    'events_lead_submitted', v_events_lead,
    'by_day', v_by_day
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_quote_results_analytics(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quote_results_analytics(integer) TO authenticated, service_role;

COMMENT ON FUNCTION public.get_quote_results_analytics(integer) IS
  'Rollup for Quote Results Returned dashboards (admin portal, CRM, website admin).';

COMMIT;

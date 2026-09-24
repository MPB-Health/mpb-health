-- Staff Hub HR time-off / leave requests, documents, audit, private storage.
-- Additive. PHI-capable (doctor notes). Team calendar omits reason via RPC.

CREATE OR REPLACE FUNCTION public.is_staff_hr()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = ANY (
    ARRAY[
      'accounting@mympb.com',
      'catherine@mympb.com',
      'dayra@mympb.com'
    ]::text[]
  );
$$;

REVOKE ALL ON FUNCTION public.is_staff_hr() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_hr() TO authenticated;

DO $$ BEGIN
  CREATE TYPE public.staff_time_request_type AS ENUM (
    'pto',
    'sick',
    'doctor_appointment',
    'leave_early',
    'arrive_late',
    'remote',
    'bereavement',
    'jury_duty',
    'unpaid_leave',
    'personal',
    'parental',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.staff_time_request_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.staff_time_document_kind AS ENUM (
    'doctors_note',
    'supporting'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.staff_time_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  employee_name text NOT NULL,
  employee_email text NOT NULL,
  type public.staff_time_request_type NOT NULL,
  status public.staff_time_request_status NOT NULL DEFAULT 'pending',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  title text NOT NULL DEFAULT '',
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  decided_by uuid REFERENCES auth.users(id),
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_time_requests_range_chk CHECK (ends_at >= starts_at)
);

CREATE INDEX IF NOT EXISTS idx_staff_time_requests_org_range
  ON public.staff_time_requests (org_id, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_staff_time_requests_user
  ON public.staff_time_requests (org_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_time_requests_status
  ON public.staff_time_requests (org_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_time_requests_idempotency
  ON public.staff_time_requests (org_id, ((metadata ->> 'idempotency_key')))
  WHERE metadata ? 'idempotency_key';

CREATE TABLE IF NOT EXISTS public.staff_time_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.staff_time_requests(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL DEFAULT 0,
  kind public.staff_time_document_kind NOT NULL DEFAULT 'supporting',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_time_documents_request
  ON public.staff_time_documents (request_id);

CREATE TABLE IF NOT EXISTS public.staff_time_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.staff_time_requests(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_time_request_events_request
  ON public.staff_time_request_events (request_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.trg_staff_time_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_staff_time_requests_updated_at ON public.staff_time_requests;
CREATE TRIGGER trg_staff_time_requests_updated_at
  BEFORE UPDATE ON public.staff_time_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_staff_time_requests_updated_at();

ALTER TABLE public.staff_time_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_time_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_time_request_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_time_requests_owner_select ON public.staff_time_requests;
CREATE POLICY staff_time_requests_owner_select ON public.staff_time_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_hr());

DROP POLICY IF EXISTS staff_time_requests_owner_insert ON public.staff_time_requests;
CREATE POLICY staff_time_requests_owner_insert ON public.staff_time_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS staff_time_requests_owner_update ON public.staff_time_requests;
CREATE POLICY staff_time_requests_owner_update ON public.staff_time_requests
  FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid() AND status = 'pending')
    OR public.is_staff_hr()
  )
  WITH CHECK (
    (user_id = auth.uid() AND status IN ('pending', 'cancelled'))
    OR public.is_staff_hr()
  );

DROP POLICY IF EXISTS staff_time_documents_owner_hr ON public.staff_time_documents;
CREATE POLICY staff_time_documents_owner_hr ON public.staff_time_documents
  FOR ALL TO authenticated
  USING (
    public.is_staff_hr()
    OR EXISTS (
      SELECT 1 FROM public.staff_time_requests r
      WHERE r.id = request_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_staff_hr()
    OR (
      uploaded_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.staff_time_requests r
        WHERE r.id = request_id AND r.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS staff_time_events_owner_hr ON public.staff_time_request_events;
CREATE POLICY staff_time_events_owner_hr ON public.staff_time_request_events
  FOR SELECT TO authenticated
  USING (
    public.is_staff_hr()
    OR EXISTS (
      SELECT 1 FROM public.staff_time_requests r
      WHERE r.id = request_id AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS staff_time_events_insert ON public.staff_time_request_events;
CREATE POLICY staff_time_events_insert ON public.staff_time_request_events
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (
      public.is_staff_hr()
      OR EXISTS (
        SELECT 1 FROM public.staff_time_requests r
        WHERE r.id = request_id AND r.user_id = auth.uid()
      )
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.staff_time_requests TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.staff_time_documents TO authenticated;
GRANT SELECT, INSERT ON public.staff_time_request_events TO authenticated;

CREATE OR REPLACE FUNCTION public.get_staff_time_calendar(
  p_org_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
RETURNS TABLE (
  id uuid,
  org_id uuid,
  user_id uuid,
  employee_name text,
  type public.staff_time_request_type,
  status public.staff_time_request_status,
  starts_at timestamptz,
  ends_at timestamptz,
  all_day boolean,
  title text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.org_id,
    r.user_id,
    r.employee_name,
    r.type,
    r.status,
    r.starts_at,
    r.ends_at,
    r.all_day,
    r.title
  FROM public.staff_time_requests r
  WHERE auth.uid() IS NOT NULL
    AND r.org_id = p_org_id
    AND r.status IN ('pending', 'approved')
    AND r.starts_at < p_to
    AND r.ends_at > p_from
  ORDER BY r.starts_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_staff_time_calendar(uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_staff_time_calendar(uuid, timestamptz, timestamptz) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-hr-documents',
  'staff-hr-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS staff_hr_documents_select ON storage.objects;
CREATE POLICY staff_hr_documents_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'staff-hr-documents'
    AND (
      public.is_staff_hr()
      OR (storage.foldername(name))[2] = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS staff_hr_documents_insert ON storage.objects;
CREATE POLICY staff_hr_documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'staff-hr-documents'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS staff_hr_documents_delete ON storage.objects;
CREATE POLICY staff_hr_documents_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'staff-hr-documents'
    AND (
      public.is_staff_hr()
      OR (storage.foldername(name))[2] = auth.uid()::text
    )
  );
;

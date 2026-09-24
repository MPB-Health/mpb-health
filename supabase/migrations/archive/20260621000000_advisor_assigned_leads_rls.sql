-- Advisor portal: assigned leads RLS, org access for field advisors, assignment notifications

-- ============================================================================
-- Helpers
-- ============================================================================

CREATE OR REPLACE FUNCTION public.advisor_can_access_lead(p_lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lead_submissions ls
    WHERE ls.id = p_lead_id
      AND ls.assigned_to = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.advisor_can_access_lead(uuid) IS
  'True when the current user is the assigned owner of the lead submission.';

GRANT EXECUTE ON FUNCTION public.advisor_can_access_lead(uuid) TO authenticated;

-- Field advisors with matching org_id on advisor_profiles (no org_memberships row required)
CREATE OR REPLACE FUNCTION public.user_has_org_access(check_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_memberships
    WHERE org_id = check_org_id
      AND user_id = auth.uid()
      AND status = 'active'
  )
  OR EXISTS (
    SELECT 1
    FROM public.advisor_profiles ap
    WHERE ap.id = auth.uid()
      AND ap.org_id = check_org_id
      AND ap.status = 'active'
  );
$$;

-- ============================================================================
-- lead_submissions — advisor scoped access
-- ============================================================================

DROP POLICY IF EXISTS "advisor_assigned_leads_select" ON public.lead_submissions;
CREATE POLICY "advisor_assigned_leads_select" ON public.lead_submissions
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    AND public.current_user_has_advisor_or_admin_access()
  );

DROP POLICY IF EXISTS "advisor_assigned_leads_update" ON public.lead_submissions;
CREATE POLICY "advisor_assigned_leads_update" ON public.lead_submissions
  FOR UPDATE TO authenticated
  USING (
    assigned_to = auth.uid()
    AND public.current_user_has_advisor_or_admin_access()
  )
  WITH CHECK (
    assigned_to = auth.uid()
    AND public.current_user_has_advisor_or_admin_access()
  );

CREATE OR REPLACE FUNCTION public.guard_advisor_lead_submission_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.current_user_has_admin_access()
     OR public.current_user_has_super_admin_access() THEN
    RETURN NEW;
  END IF;

  IF NOT public.current_user_has_advisor_or_admin_access() THEN
    RETURN NEW;
  END IF;

  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to
     OR OLD.org_id IS DISTINCT FROM NEW.org_id THEN
    RAISE EXCEPTION 'Advisors cannot reassign leads or change organization'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_advisor_lead_submission_update ON public.lead_submissions;
CREATE TRIGGER trg_guard_advisor_lead_submission_update
  BEFORE UPDATE ON public.lead_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_advisor_lead_submission_update();

-- ============================================================================
-- lead_activities — assigned lead only
-- ============================================================================

DROP POLICY IF EXISTS "advisor_assigned_lead_activities_select" ON public.lead_activities;
CREATE POLICY "advisor_assigned_lead_activities_select" ON public.lead_activities
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_advisor_or_admin_access()
    AND lead_id IS NOT NULL
    AND public.advisor_can_access_lead(lead_id)
  );

DROP POLICY IF EXISTS "advisor_assigned_lead_activities_insert" ON public.lead_activities;
CREATE POLICY "advisor_assigned_lead_activities_insert" ON public.lead_activities
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_has_advisor_or_admin_access()
    AND lead_id IS NOT NULL
    AND public.advisor_can_access_lead(lead_id)
  );

-- ============================================================================
-- lead_tasks — assigned lead only
-- ============================================================================

DROP POLICY IF EXISTS "advisor_assigned_lead_tasks_select" ON public.lead_tasks;
CREATE POLICY "advisor_assigned_lead_tasks_select" ON public.lead_tasks
  FOR SELECT TO authenticated
  USING (
    public.current_user_has_advisor_or_admin_access()
    AND lead_id IS NOT NULL
    AND public.advisor_can_access_lead(lead_id)
  );

DROP POLICY IF EXISTS "advisor_assigned_lead_tasks_insert" ON public.lead_tasks;
CREATE POLICY "advisor_assigned_lead_tasks_insert" ON public.lead_tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_has_advisor_or_admin_access()
    AND lead_id IS NOT NULL
    AND public.advisor_can_access_lead(lead_id)
  );

DROP POLICY IF EXISTS "advisor_assigned_lead_tasks_update" ON public.lead_tasks;
CREATE POLICY "advisor_assigned_lead_tasks_update" ON public.lead_tasks
  FOR UPDATE TO authenticated
  USING (
    public.current_user_has_advisor_or_admin_access()
    AND lead_id IS NOT NULL
    AND public.advisor_can_access_lead(lead_id)
  )
  WITH CHECK (
    public.current_user_has_advisor_or_admin_access()
    AND lead_id IS NOT NULL
    AND public.advisor_can_access_lead(lead_id)
  );

-- ============================================================================
-- In-app notification when a lead is assigned to an advisor
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_advisor_lead_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_title text;
  v_body text;
BEGIN
  IF NEW.assigned_to IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to THEN
    RETURN NEW;
  END IF;

  v_org_id := COALESCE(
    NEW.org_id,
    (SELECT ap.org_id FROM public.advisor_profiles ap WHERE ap.id = NEW.assigned_to LIMIT 1),
    '00000000-0000-4000-a000-000000000001'::uuid
  );

  v_title := 'New lead assigned';
  v_body := trim(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
  IF v_body = '' THEN
    v_body := COALESCE(NEW.email, 'A lead');
  END IF;
  v_body := v_body || ' has been assigned to you.';

  INSERT INTO public.notifications (
    org_id,
    user_id,
    title,
    body,
    category,
    priority,
    action_url,
    action_label,
    channels,
    metadata
  ) VALUES (
    v_org_id,
    NEW.assigned_to,
    v_title,
    v_body,
    'lead',
    CASE
      WHEN NEW.priority IN ('low', 'normal', 'high', 'urgent') THEN NEW.priority::public.notification_priority
      WHEN NEW.priority = 'medium' THEN 'normal'::public.notification_priority
      ELSE 'normal'::public.notification_priority
    END,
    '/leads/' || NEW.id::text,
    'View lead',
    ARRAY['in_app']::public.notification_channel[],
    jsonb_build_object(
      'lead_id', NEW.id,
      'event', 'lead_assigned'
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_advisor_lead_assigned ON public.lead_submissions;
CREATE TRIGGER trg_notify_advisor_lead_assigned
  AFTER INSERT OR UPDATE OF assigned_to ON public.lead_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_advisor_lead_assigned();

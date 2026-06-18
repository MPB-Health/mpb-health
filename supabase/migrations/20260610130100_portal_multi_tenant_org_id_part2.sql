-- Part 2: org_id columns + RLS (uses live MPB org id from slug)

DO $$
DECLARE
  mpb_org_id uuid;
  tbl text;
BEGIN
  SELECT id INTO mpb_org_id FROM public.organizations WHERE slug = 'mpb-health' LIMIT 1;
  IF mpb_org_id IS NULL THEN
    RAISE EXCEPTION 'MPB Health organization not found';
  END IF;

  -- Concierge team members
  ALTER TABLE public.concierge_team_members ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
  EXECUTE format('UPDATE public.concierge_team_members SET org_id = %L WHERE org_id IS NULL', mpb_org_id);
  ALTER TABLE public.concierge_team_members ALTER COLUMN org_id SET NOT NULL;
  ALTER TABLE public.concierge_team_members DROP CONSTRAINT IF EXISTS concierge_team_members_name_key;
  CREATE UNIQUE INDEX IF NOT EXISTS concierge_team_members_org_name_key ON public.concierge_team_members (org_id, name);
  CREATE INDEX IF NOT EXISTS idx_concierge_team_members_org_id ON public.concierge_team_members (org_id);

  ALTER TABLE public.concierge_daily_log_entries ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
  EXECUTE format('UPDATE public.concierge_daily_log_entries SET org_id = %L WHERE org_id IS NULL', mpb_org_id);
  ALTER TABLE public.concierge_daily_log_entries ALTER COLUMN org_id SET NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_concierge_daily_log_entries_org_id ON public.concierge_daily_log_entries (org_id);

  ALTER TABLE public.concierge_member_off_days ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
  UPDATE public.concierge_member_off_days off SET org_id = tm.org_id
  FROM public.concierge_team_members tm WHERE off.team_member_id = tm.id AND off.org_id IS NULL;
  EXECUTE format('UPDATE public.concierge_member_off_days SET org_id = %L WHERE org_id IS NULL', mpb_org_id);
  ALTER TABLE public.concierge_member_off_days ALTER COLUMN org_id SET NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_concierge_member_off_days_org_id ON public.concierge_member_off_days (org_id);

  ALTER TABLE public.concierge_escalations ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
  EXECUTE format('UPDATE public.concierge_escalations SET org_id = %L WHERE org_id IS NULL', mpb_org_id);
  ALTER TABLE public.concierge_escalations ALTER COLUMN org_id SET NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_concierge_escalations_org_id ON public.concierge_escalations (org_id);

  ALTER TABLE public.concierge_weekly_report_extras ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
  EXECUTE format('UPDATE public.concierge_weekly_report_extras SET org_id = %L WHERE org_id IS NULL', mpb_org_id);
  ALTER TABLE public.concierge_weekly_report_extras ALTER COLUMN org_id SET NOT NULL;
  ALTER TABLE public.concierge_weekly_report_extras DROP CONSTRAINT IF EXISTS concierge_weekly_report_extras_pkey;
  ALTER TABLE public.concierge_weekly_report_extras ADD CONSTRAINT concierge_weekly_report_extras_pkey PRIMARY KEY (org_id, report_key);

  DROP POLICY IF EXISTS concierge_team_members_rw ON public.concierge_team_members;
  CREATE POLICY concierge_team_members_rw ON public.concierge_team_members FOR ALL TO authenticated
    USING (public.user_has_concierge_access_for_org(org_id))
    WITH CHECK (public.user_has_concierge_access_for_org(org_id));

  DROP POLICY IF EXISTS concierge_daily_log_entries_rw ON public.concierge_daily_log_entries;
  CREATE POLICY concierge_daily_log_entries_rw ON public.concierge_daily_log_entries FOR ALL TO authenticated
    USING (public.user_has_concierge_access_for_org(org_id))
    WITH CHECK (public.user_has_concierge_access_for_org(org_id));

  DROP POLICY IF EXISTS concierge_member_off_days_rw ON public.concierge_member_off_days;
  CREATE POLICY concierge_member_off_days_rw ON public.concierge_member_off_days FOR ALL TO authenticated
    USING (public.user_has_concierge_access_for_org(org_id))
    WITH CHECK (public.user_has_concierge_access_for_org(org_id));

  DROP POLICY IF EXISTS concierge_escalations_rw ON public.concierge_escalations;
  CREATE POLICY concierge_escalations_rw ON public.concierge_escalations FOR ALL TO authenticated
    USING (public.user_has_concierge_access_for_org(org_id))
    WITH CHECK (public.user_has_concierge_access_for_org(org_id));

  DROP POLICY IF EXISTS concierge_weekly_report_extras_rw ON public.concierge_weekly_report_extras;
  CREATE POLICY concierge_weekly_report_extras_rw ON public.concierge_weekly_report_extras FOR ALL TO authenticated
    USING (public.user_has_concierge_access_for_org(org_id))
    WITH CHECK (public.user_has_concierge_access_for_org(org_id));

  -- Staff hub
  IF to_regclass('public.staff_notes') IS NOT NULL THEN
    ALTER TABLE public.staff_notes ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
    EXECUTE format('UPDATE public.staff_notes SET org_id = %L WHERE org_id IS NULL', mpb_org_id);
    ALTER TABLE public.staff_notes ALTER COLUMN org_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_staff_notes_org_user ON public.staff_notes (org_id, user_id);
    ALTER TABLE public.staff_notes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS staff_notes_rw ON public.staff_notes;
    CREATE POLICY staff_notes_rw ON public.staff_notes FOR ALL TO authenticated
      USING (user_id = auth.uid() AND org_id IN (SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active'))
      WITH CHECK (user_id = auth.uid() AND org_id IN (SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active'));
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_notes TO authenticated;
  END IF;

  IF to_regclass('public.staff_tasks') IS NOT NULL THEN
    ALTER TABLE public.staff_tasks ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
    EXECUTE format('UPDATE public.staff_tasks SET org_id = %L WHERE org_id IS NULL', mpb_org_id);
    ALTER TABLE public.staff_tasks ALTER COLUMN org_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_staff_tasks_org_user ON public.staff_tasks (org_id, user_id);
    ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS staff_tasks_rw ON public.staff_tasks;
    CREATE POLICY staff_tasks_rw ON public.staff_tasks FOR ALL TO authenticated
      USING (user_id = auth.uid() AND org_id IN (SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active'))
      WITH CHECK (user_id = auth.uid() AND org_id IN (SELECT om.org_id FROM public.org_memberships om WHERE om.user_id = auth.uid() AND om.status = 'active'));
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_tasks TO authenticated;
  END IF;

  -- Advisor CMS tables
  FOREACH tbl IN ARRAY ARRAY[
    'advisor_portal_settings', 'advisor_videos', 'advisor_content', 'advisor_nav_menu',
    'advisor_quick_links', 'events', 'advisor_enrollment_links', 'advisor_contact_directory',
    'advisor_dashboard_widgets', 'advisor_content_categories', 'cognito_forms', 'advisor_announcements'
  ]
  LOOP
    IF to_regclass('public.' || tbl) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id)', tbl);
      EXECUTE format('UPDATE public.%I SET org_id = %L WHERE org_id IS NULL', tbl, mpb_org_id);
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_org_id ON public.%I (org_id)', tbl, tbl);
    END IF;
  END LOOP;
END $$;

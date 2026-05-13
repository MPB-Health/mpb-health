-- ============================================================================
-- Concierge Portal: shared daily logs, roster, weekly report fields (Supabase)
-- Access: concierge, admin, super_admin via user_roles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_has_concierge_portal_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role::text IN ('concierge', 'super_admin', 'admin')
  );
$$;
COMMENT ON FUNCTION public.current_user_has_concierge_portal_access() IS
  'True when the current user may read/write Concierge Portal shared tables.';
GRANT EXECUTE ON FUNCTION public.current_user_has_concierge_portal_access() TO authenticated;
-- ---------------------------------------------------------------------------
-- Team roster
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.concierge_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  role text NOT NULL DEFAULT 'Concierge',
  part_time boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT concierge_team_members_name_key UNIQUE (name)
);
CREATE INDEX IF NOT EXISTS idx_concierge_team_members_display_order
  ON public.concierge_team_members (display_order);
DROP TRIGGER IF EXISTS set_updated_at_concierge_team_members ON public.concierge_team_members;
CREATE TRIGGER set_updated_at_concierge_team_members
  BEFORE UPDATE ON public.concierge_team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- ---------------------------------------------------------------------------
-- Daily log entries
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.concierge_daily_log_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date date NOT NULL,
  team_member_name text NOT NULL,
  channel text NOT NULL,
  member_name text NOT NULL,
  reason text NOT NULL,
  other_notes text NOT NULL DEFAULT '',
  crm_notes boolean NOT NULL DEFAULT false,
  follow_up boolean NOT NULL DEFAULT false,
  review_link boolean NOT NULL DEFAULT false,
  additional_notes text NOT NULL DEFAULT '',
  times_spoke_with_member integer NOT NULL DEFAULT 1,
  escalated_issue boolean NOT NULL DEFAULT false,
  special_project_description text NOT NULL DEFAULT '',
  special_project_duration_minutes integer NOT NULL DEFAULT 0,
  touch_override boolean,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_concierge_daily_log_entries_log_date
  ON public.concierge_daily_log_entries (log_date DESC);
CREATE INDEX IF NOT EXISTS idx_concierge_daily_log_entries_team_member
  ON public.concierge_daily_log_entries (team_member_name);
CREATE INDEX IF NOT EXISTS idx_concierge_daily_log_entries_created_at
  ON public.concierge_daily_log_entries (created_at DESC);
DROP TRIGGER IF EXISTS set_updated_at_concierge_daily_log_entries ON public.concierge_daily_log_entries;
CREATE TRIGGER set_updated_at_concierge_daily_log_entries
  BEFORE UPDATE ON public.concierge_daily_log_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- ---------------------------------------------------------------------------
-- Member off-days (per roster member)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.concierge_member_off_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.concierge_team_members (id) ON DELETE CASCADE,
  off_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT concierge_member_off_days_unique_day UNIQUE (team_member_id, off_date)
);
CREATE INDEX IF NOT EXISTS idx_concierge_member_off_days_member
  ON public.concierge_member_off_days (team_member_id);
-- ---------------------------------------------------------------------------
-- Escalated member issues
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.concierge_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_name text NOT NULL,
  summary text NOT NULL,
  opened_at date NOT NULL,
  log_entry_id uuid REFERENCES public.concierge_daily_log_entries (id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('open', 'complete')),
  completed_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_concierge_escalations_status
  ON public.concierge_escalations (status);
DROP TRIGGER IF EXISTS set_updated_at_concierge_escalations ON public.concierge_escalations;
CREATE TRIGGER set_updated_at_concierge_escalations
  BEFORE UPDATE ON public.concierge_escalations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- ---------------------------------------------------------------------------
-- Weekly report manual fields (phone times, etc.) keyed by iso:YYYY-Www
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.concierge_weekly_report_extras (
  report_key text PRIMARY KEY,
  call_times_by_member_id jsonb NOT NULL DEFAULT '{}'::jsonb,
  team_members_helped text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS set_updated_at_concierge_weekly_report_extras ON public.concierge_weekly_report_extras;
CREATE TRIGGER set_updated_at_concierge_weekly_report_extras
  BEFORE UPDATE ON public.concierge_weekly_report_extras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.concierge_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_daily_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_member_off_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_weekly_report_extras ENABLE ROW LEVEL SECURITY;
-- concierge_team_members
DROP POLICY IF EXISTS concierge_team_members_rw ON public.concierge_team_members;
CREATE POLICY concierge_team_members_rw
  ON public.concierge_team_members
  FOR ALL
  TO authenticated
  USING (public.current_user_has_concierge_portal_access())
  WITH CHECK (public.current_user_has_concierge_portal_access());
-- concierge_daily_log_entries
DROP POLICY IF EXISTS concierge_daily_log_entries_rw ON public.concierge_daily_log_entries;
CREATE POLICY concierge_daily_log_entries_rw
  ON public.concierge_daily_log_entries
  FOR ALL
  TO authenticated
  USING (public.current_user_has_concierge_portal_access())
  WITH CHECK (public.current_user_has_concierge_portal_access());
-- concierge_member_off_days
DROP POLICY IF EXISTS concierge_member_off_days_rw ON public.concierge_member_off_days;
CREATE POLICY concierge_member_off_days_rw
  ON public.concierge_member_off_days
  FOR ALL
  TO authenticated
  USING (public.current_user_has_concierge_portal_access())
  WITH CHECK (public.current_user_has_concierge_portal_access());
-- concierge_escalations
DROP POLICY IF EXISTS concierge_escalations_rw ON public.concierge_escalations;
CREATE POLICY concierge_escalations_rw
  ON public.concierge_escalations
  FOR ALL
  TO authenticated
  USING (public.current_user_has_concierge_portal_access())
  WITH CHECK (public.current_user_has_concierge_portal_access());
-- concierge_weekly_report_extras
DROP POLICY IF EXISTS concierge_weekly_report_extras_rw ON public.concierge_weekly_report_extras;
CREATE POLICY concierge_weekly_report_extras_rw
  ON public.concierge_weekly_report_extras
  FOR ALL
  TO authenticated
  USING (public.current_user_has_concierge_portal_access())
  WITH CHECK (public.current_user_has_concierge_portal_access());
-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_daily_log_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_member_off_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_escalations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_weekly_report_extras TO authenticated;
-- ---------------------------------------------------------------------------
-- Optional seed: default roster (idempotent). Logs / extras stay empty until
-- users add data; the app also skips seeding if this insert already ran.
-- ---------------------------------------------------------------------------

INSERT INTO public.concierge_team_members (name, status, role, part_time, display_order)
VALUES
  ('Acelyn Calderon', 'Active', 'Concierge', false, 0),
  ('Adam Jordano', 'Active', 'Concierge', false, 1),
  ('Ryan Cahill', 'Active', 'Concierge', false, 2),
  ('Vanessa Orozco', 'Active', 'Concierge', true, 3),
  ('Tupac Manzanarez', 'Active', 'Concierge', true, 4)
ON CONFLICT (name) DO NOTHING;

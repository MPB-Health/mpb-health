-- ============================================================================
-- CRM Workspaces and Smart Views
-- Operational workspaces for insurance-specific workflow surfaces,
-- enhanced saved views with sort/column/visual config, and system-generated
-- smart views that auto-populate per org.
-- ============================================================================

-- Extend saved views with sort, column, and visual configuration
ALTER TABLE public.crm_saved_views
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS workspace_id uuid,
  ADD COLUMN IF NOT EXISTS view_type text DEFAULT 'custom'
    CHECK (view_type IN ('custom', 'smart', 'system'));

-- Workspaces: named collections of related views for role-based work surfaces
CREATE TABLE IF NOT EXISTS public.crm_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'layout-grid',
  color text DEFAULT '#6366f1',
  module text NOT NULL DEFAULT 'leads',
  is_system boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  owner_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_org_access ON public.crm_workspaces
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_workspaces_org ON public.crm_workspaces(org_id, module);
CREATE INDEX IF NOT EXISTS idx_workspaces_active ON public.crm_workspaces(org_id, is_active, sort_order);

-- FK from saved views to workspaces
ALTER TABLE public.crm_saved_views
  ADD CONSTRAINT fk_saved_views_workspace
  FOREIGN KEY (workspace_id) REFERENCES public.crm_workspaces(id)
  ON DELETE SET NULL;

-- Activity command center: pinned "today" items for quick access
CREATE TABLE IF NOT EXISTS public.crm_focus_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  entity_type text NOT NULL CHECK (entity_type IN ('lead', 'contact', 'deal', 'task', 'case')),
  entity_id uuid NOT NULL,
  priority integer DEFAULT 0,
  notes text,
  pinned_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_focus_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY focus_items_user_access ON public.crm_focus_items
  FOR ALL
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_focus_items_user ON public.crm_focus_items(user_id, completed_at)
  WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_focus_items_entity ON public.crm_focus_items(entity_type, entity_id);

-- Relationship context: quick-access advisor-to-lead summary RPC
CREATE OR REPLACE FUNCTION public.crm_today_summary(p_org_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result json;
BEGIN
  SELECT json_build_object(
    'tasks_due_today', (
      SELECT count(*) FROM public.lead_tasks
      WHERE org_id = p_org_id
        AND assigned_to = v_user_id::text
        AND completed = false
        AND due_date::date = CURRENT_DATE
    ),
    'tasks_overdue', (
      SELECT count(*) FROM public.lead_tasks
      WHERE org_id = p_org_id
        AND assigned_to = v_user_id::text
        AND completed = false
        AND due_date < CURRENT_DATE
    ),
    'new_leads_today', (
      SELECT count(*) FROM public.zoho_lead_submissions
      WHERE org_id = p_org_id
        AND created_at::date = CURRENT_DATE
    ),
    'new_leads_this_week', (
      SELECT count(*) FROM public.zoho_lead_submissions
      WHERE org_id = p_org_id
        AND created_at >= date_trunc('week', CURRENT_DATE)
    ),
    'upcoming_events', (
      SELECT count(*) FROM public.calendar_events
      WHERE org_id = p_org_id
        AND (assigned_to = v_user_id::text OR created_by = v_user_id::text)
        AND start_time >= now()
        AND start_time < now() + interval '24 hours'
        AND status != 'cancelled'
    ),
    'unread_emails', (
      SELECT count(*) FROM public.crm_email_log
      WHERE org_id = p_org_id
        AND direction = 'inbound'
        AND is_read = false
    ),
    'focus_items', (
      SELECT count(*) FROM public.crm_focus_items
      WHERE org_id = p_org_id
        AND user_id = v_user_id
        AND completed_at IS NULL
    ),
    'open_deals_value', (
      SELECT coalesce(sum(amount), 0) FROM public.crm_deals
      WHERE org_id = p_org_id
        AND owner_id = v_user_id
        AND stage_id IS NOT NULL
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Updated at trigger function for workspaces
CREATE OR REPLACE FUNCTION public.handle_crm_workspaces_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_crm_workspaces_updated_at
  BEFORE UPDATE ON public.crm_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_crm_workspaces_updated_at();

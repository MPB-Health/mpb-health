-- ============================================================================
-- Approval Workflows for CRM
-- Configurable multi-step approval processes for deals, quotes, invoices, discounts
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Approval Processes
-- Defines a reusable approval workflow template
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_approval_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,

  -- Process definition
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deal', 'quote', 'invoice', 'discount')),
  trigger_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_approval_processes_org ON public.crm_approval_processes(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_approval_processes_entity ON public.crm_approval_processes(entity_type);
CREATE INDEX IF NOT EXISTS idx_crm_approval_processes_active ON public.crm_approval_processes(org_id, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE crm_approval_processes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approval_processes_select" ON public.crm_approval_processes;
CREATE POLICY "approval_processes_select" ON public.crm_approval_processes
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "approval_processes_insert" ON public.crm_approval_processes;
CREATE POLICY "approval_processes_insert" ON public.crm_approval_processes
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "approval_processes_update" ON public.crm_approval_processes;
CREATE POLICY "approval_processes_update" ON public.crm_approval_processes
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "approval_processes_delete" ON public.crm_approval_processes;
CREATE POLICY "approval_processes_delete" ON public.crm_approval_processes
  FOR DELETE TO authenticated
  USING (org_id IN (
    SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
  ));

-- ----------------------------------------------------------------------------
-- Approval Steps
-- Ordered steps within a process
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES crm_approval_processes(id) ON DELETE CASCADE,

  -- Step configuration
  step_order INTEGER NOT NULL DEFAULT 1,
  approver_type TEXT NOT NULL CHECK (approver_type IN ('user', 'role', 'manager')),
  approver_id UUID,           -- specific user (when approver_type = 'user')
  role_name TEXT,              -- role name (when approver_type = 'role')
  action_on_reject TEXT NOT NULL DEFAULT 'reject' CHECK (action_on_reject IN ('reject', 'go_back', 'notify')),
  auto_approve_after_hours INTEGER, -- nullable, auto-approve if no action taken

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_approval_steps_process ON public.crm_approval_steps(process_id);
CREATE INDEX IF NOT EXISTS idx_crm_approval_steps_order ON public.crm_approval_steps(process_id, step_order);
CREATE INDEX IF NOT EXISTS idx_crm_approval_steps_approver ON public.crm_approval_steps(approver_id) WHERE approver_id IS NOT NULL;

-- RLS (inherit access from parent process)
ALTER TABLE crm_approval_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approval_steps_select" ON public.crm_approval_steps;
CREATE POLICY "approval_steps_select" ON public.crm_approval_steps
  FOR SELECT TO authenticated
  USING (process_id IN (
    SELECT ap.id FROM crm_approval_processes ap
    JOIN org_memberships om ON om.org_id = ap.org_id AND om.status = 'active'
    WHERE om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "approval_steps_insert" ON public.crm_approval_steps;
CREATE POLICY "approval_steps_insert" ON public.crm_approval_steps
  FOR INSERT TO authenticated
  WITH CHECK (process_id IN (
    SELECT ap.id FROM crm_approval_processes ap
    JOIN org_memberships om ON om.org_id = ap.org_id AND om.status = 'active'
    WHERE om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "approval_steps_update" ON public.crm_approval_steps;
CREATE POLICY "approval_steps_update" ON public.crm_approval_steps
  FOR UPDATE TO authenticated
  USING (process_id IN (
    SELECT ap.id FROM crm_approval_processes ap
    JOIN org_memberships om ON om.org_id = ap.org_id AND om.status = 'active'
    WHERE om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "approval_steps_delete" ON public.crm_approval_steps;
CREATE POLICY "approval_steps_delete" ON public.crm_approval_steps
  FOR DELETE TO authenticated
  USING (process_id IN (
    SELECT ap.id FROM crm_approval_processes ap
    JOIN org_memberships om ON om.org_id = ap.org_id AND om.status = 'active'
    WHERE om.user_id = auth.uid()
  ));

-- ----------------------------------------------------------------------------
-- Approval Requests
-- An instance of a process applied to a specific entity
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID NOT NULL REFERENCES crm_approval_processes(id),
  org_id UUID NOT NULL,

  -- Entity reference
  entity_type TEXT NOT NULL CHECK (entity_type IN ('deal', 'quote', 'invoice', 'discount')),
  entity_id UUID NOT NULL,

  -- Workflow state
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'recalled')),
  current_step INTEGER NOT NULL DEFAULT 1,
  notes TEXT,

  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_approval_requests_org ON public.crm_approval_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_approval_requests_process ON public.crm_approval_requests(process_id);
CREATE INDEX IF NOT EXISTS idx_crm_approval_requests_entity ON public.crm_approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_approval_requests_status ON public.crm_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_crm_approval_requests_requester ON public.crm_approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_crm_approval_requests_pending ON public.crm_approval_requests(org_id, status) WHERE status = 'pending';

-- RLS
ALTER TABLE crm_approval_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approval_requests_select" ON public.crm_approval_requests;
CREATE POLICY "approval_requests_select" ON public.crm_approval_requests
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "approval_requests_insert" ON public.crm_approval_requests;
CREATE POLICY "approval_requests_insert" ON public.crm_approval_requests
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "approval_requests_update" ON public.crm_approval_requests;
CREATE POLICY "approval_requests_update" ON public.crm_approval_requests
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT om.org_id FROM org_memberships om WHERE om.user_id = auth.uid()
  ));

-- ----------------------------------------------------------------------------
-- Approval Actions
-- Individual approve / reject / delegate actions on a request step
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES crm_approval_requests(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES crm_approval_steps(id),

  -- Action details
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'delegated')),
  comments TEXT,

  acted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_approval_actions_request ON public.crm_approval_actions(request_id);
CREATE INDEX IF NOT EXISTS idx_crm_approval_actions_approver ON public.crm_approval_actions(approver_id);
CREATE INDEX IF NOT EXISTS idx_crm_approval_actions_step ON public.crm_approval_actions(step_id);

-- RLS (inherit access from parent request)
ALTER TABLE crm_approval_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approval_actions_select" ON public.crm_approval_actions;
CREATE POLICY "approval_actions_select" ON public.crm_approval_actions
  FOR SELECT TO authenticated
  USING (request_id IN (
    SELECT ar.id FROM crm_approval_requests ar
    JOIN org_memberships om ON om.org_id = ar.org_id AND om.status = 'active'
    WHERE om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "approval_actions_insert" ON public.crm_approval_actions;
CREATE POLICY "approval_actions_insert" ON public.crm_approval_actions
  FOR INSERT TO authenticated
  WITH CHECK (request_id IN (
    SELECT ar.id FROM crm_approval_requests ar
    JOIN org_memberships om ON om.org_id = ar.org_id AND om.status = 'active'
    WHERE om.user_id = auth.uid()
  ));

-- ============================================================================
-- Migration: Phase 0 - Security & Multi-Tenancy Hardening
-- Description: Introduces organization-scoped multi-tenancy, granular
--   permission system, comprehensive audit trail, and org-scoped RLS
--   policies for all CRM tables.
-- ============================================================================

BEGIN;
-- ============================================================================
-- SECTION A: CREATE NEW TABLES
-- ============================================================================

-- A1: orgs - Organization / tenant table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orgs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    domain text,
    logo_url text,
    settings jsonb DEFAULT '{}',
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'archived')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
-- A2: org_memberships - Links users to orgs with roles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.org_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member'
        CHECK (role IN ('owner', 'admin', 'manager', 'agent', 'member')),
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'invited', 'suspended', 'removed')),
    invited_by uuid REFERENCES auth.users(id),
    invited_at timestamptz,
    joined_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, org_id)
);
ALTER TABLE public.org_memberships ENABLE ROW LEVEL SECURITY;
-- A3: permissions - Permission definitions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    module text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
-- A4: role_permissions - Which org roles get which permissions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    role text NOT NULL
        CHECK (role IN ('owner', 'admin', 'manager', 'agent', 'member')),
    permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    UNIQUE(org_id, role, permission_id)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
-- A5: audit_events - Comprehensive audit trail
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
    actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text,
    entity_id text,
    before_json jsonb,
    after_json jsonb,
    meta_json jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
-- ============================================================================
-- SECTION B: ADD org_id TO CRM TABLES
-- ============================================================================

ALTER TABLE public.zoho_lead_submissions
    ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE;
ALTER TABLE public.lead_activities
    ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE;
ALTER TABLE public.lead_tasks
    ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE;
ALTER TABLE public.crm_pipeline_stages
    ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE;
ALTER TABLE public.lead_notifications
    ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE;
-- ============================================================================
-- SECTION C: HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================================================

-- C1: auth_uid() - convenience wrapper
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auth_uid()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.auth_uid() TO authenticated;
-- C2: current_user_org_ids() - array of org_ids with active membership
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_org_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        ARRAY_AGG(om.org_id),
        ARRAY[]::uuid[]
    )
    FROM public.org_memberships om
    WHERE om.user_id = auth.uid()
      AND om.status = 'active';
$$;
GRANT EXECUTE ON FUNCTION public.current_user_org_ids() TO authenticated;
-- C3: is_org_member(p_org_id) - boolean membership check
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.org_id = p_org_id
          AND om.status = 'active'
    );
$$;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
-- C4: is_org_admin(p_org_id) - owner or admin in org
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.org_id = p_org_id
          AND om.status = 'active'
          AND om.role IN ('owner', 'admin')
    );
$$;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO authenticated;
-- C5: is_org_role(p_org_id, p_role) - checks specific org role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_role(p_org_id uuid, p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.org_id = p_org_id
          AND om.status = 'active'
          AND om.role = p_role
    );
$$;
GRANT EXECUTE ON FUNCTION public.is_org_role(uuid, text) TO authenticated;
-- C6: has_org_permission(p_org_id, p_permission_key) - permission check
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_org_permission(p_org_id uuid, p_permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.org_memberships om
        JOIN public.role_permissions rp ON rp.org_id = om.org_id AND rp.role = om.role
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE om.user_id = auth.uid()
          AND om.org_id = p_org_id
          AND om.status = 'active'
          AND p.key = p_permission_key
    );
$$;
GRANT EXECUTE ON FUNCTION public.has_org_permission(uuid, text) TO authenticated;
-- C7: user_org_role(p_org_id) - returns role text or NULL
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_org_role(p_org_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT om.role
    FROM public.org_memberships om
    WHERE om.user_id = auth.uid()
      AND om.org_id = p_org_id
      AND om.status = 'active'
    LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.user_org_role(uuid) TO authenticated;
-- ============================================================================
-- SECTION D: RLS POLICIES ON NEW TABLES
-- ============================================================================

-- D1: orgs
-- ----------------------------------------------------------------------------

-- SELECT: user is a member
CREATE POLICY "org_select_member"
    ON public.orgs
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(id)
    );
-- INSERT: any authenticated user can create an org
CREATE POLICY "org_insert_authenticated"
    ON public.orgs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
-- UPDATE: org admins only
CREATE POLICY "org_update_admin"
    ON public.orgs
    FOR UPDATE
    TO authenticated
    USING (
        public.is_org_admin(id)
    )
    WITH CHECK (
        public.is_org_admin(id)
    );
-- DELETE: owner only
CREATE POLICY "org_delete_owner"
    ON public.orgs
    FOR DELETE
    TO authenticated
    USING (
        public.is_org_role(id, 'owner')
    );
-- D2: org_memberships
-- ----------------------------------------------------------------------------

-- SELECT: members can see other members in their org
CREATE POLICY "orgmem_select_member"
    ON public.org_memberships
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(org_id)
    );
-- INSERT: org admins or owners can add members
CREATE POLICY "orgmem_insert_admin"
    ON public.org_memberships
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_org_admin(org_id) OR public.is_org_role(org_id, 'owner')
    );
-- UPDATE: org admins can update memberships
CREATE POLICY "orgmem_update_admin"
    ON public.org_memberships
    FOR UPDATE
    TO authenticated
    USING (
        public.is_org_admin(org_id)
    )
    WITH CHECK (
        public.is_org_admin(org_id)
    );
-- DELETE: org admins can remove members, but not themselves
CREATE POLICY "orgmem_delete_admin"
    ON public.org_memberships
    FOR DELETE
    TO authenticated
    USING (
        public.is_org_admin(org_id) AND user_id != auth.uid()
    );
-- D3: permissions (read-only for authenticated users)
-- ----------------------------------------------------------------------------

CREATE POLICY "permissions_select_authenticated"
    ON public.permissions
    FOR SELECT
    TO authenticated
    USING (true);
-- No INSERT / UPDATE / DELETE policies -- managed by migrations only.

-- D4: role_permissions
-- ----------------------------------------------------------------------------

-- SELECT: org members can view their org's role permissions
CREATE POLICY "roleperm_select_member"
    ON public.role_permissions
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(org_id)
    );
-- INSERT: org owner only
CREATE POLICY "roleperm_insert_owner"
    ON public.role_permissions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_org_role(org_id, 'owner')
    );
-- UPDATE: org owner only
CREATE POLICY "roleperm_update_owner"
    ON public.role_permissions
    FOR UPDATE
    TO authenticated
    USING (
        public.is_org_role(org_id, 'owner')
    )
    WITH CHECK (
        public.is_org_role(org_id, 'owner')
    );
-- DELETE: org owner only
CREATE POLICY "roleperm_delete_owner"
    ON public.role_permissions
    FOR DELETE
    TO authenticated
    USING (
        public.is_org_role(org_id, 'owner')
    );
-- D5: audit_events
-- ----------------------------------------------------------------------------

-- SELECT: users with audit.read permission in the org
CREATE POLICY "audit_select_permission"
    ON public.audit_events
    FOR SELECT
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'audit.read')
    );
-- INSERT: authenticated (service layer inserts)
CREATE POLICY "audit_insert_authenticated"
    ON public.audit_events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
-- No UPDATE / DELETE -- immutable audit trail.


-- ============================================================================
-- SECTION E: ORG-SCOPED RLS POLICIES ON CRM TABLES
-- ============================================================================
-- These are additive alongside existing profile-role policies.

-- E1: zoho_lead_submissions
-- ----------------------------------------------------------------------------

CREATE POLICY "org_leads_select"
    ON public.zoho_lead_submissions
    FOR SELECT
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_leads_insert"
    ON public.zoho_lead_submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_leads_update"
    ON public.zoho_lead_submissions
    FOR UPDATE
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    )
    WITH CHECK (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_leads_delete"
    ON public.zoho_lead_submissions
    FOR DELETE
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.has_org_permission(org_id, 'leads.delete')
    );
-- E2: lead_activities
-- ----------------------------------------------------------------------------

CREATE POLICY "org_lead_activities_select"
    ON public.lead_activities
    FOR SELECT
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_lead_activities_insert"
    ON public.lead_activities
    FOR INSERT
    TO authenticated
    WITH CHECK (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_lead_activities_update"
    ON public.lead_activities
    FOR UPDATE
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    )
    WITH CHECK (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_lead_activities_delete"
    ON public.lead_activities
    FOR DELETE
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.has_org_permission(org_id, 'leads.delete')
    );
-- E3: lead_tasks
-- ----------------------------------------------------------------------------

CREATE POLICY "org_lead_tasks_select"
    ON public.lead_tasks
    FOR SELECT
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_lead_tasks_insert"
    ON public.lead_tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_lead_tasks_update"
    ON public.lead_tasks
    FOR UPDATE
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    )
    WITH CHECK (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_lead_tasks_delete"
    ON public.lead_tasks
    FOR DELETE
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.has_org_permission(org_id, 'tasks.delete')
    );
-- E4: crm_pipeline_stages
-- ----------------------------------------------------------------------------

CREATE POLICY "org_pipeline_stages_select"
    ON public.crm_pipeline_stages
    FOR SELECT
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_pipeline_stages_insert"
    ON public.crm_pipeline_stages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_pipeline_stages_update"
    ON public.crm_pipeline_stages
    FOR UPDATE
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    )
    WITH CHECK (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_pipeline_stages_delete"
    ON public.crm_pipeline_stages
    FOR DELETE
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.has_org_permission(org_id, 'pipeline.delete')
    );
-- E5: lead_notifications
-- ----------------------------------------------------------------------------

CREATE POLICY "org_lead_notifications_select"
    ON public.lead_notifications
    FOR SELECT
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_lead_notifications_insert"
    ON public.lead_notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_lead_notifications_update"
    ON public.lead_notifications
    FOR UPDATE
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    )
    WITH CHECK (
        org_id IS NOT NULL AND public.is_org_member(org_id)
    );
CREATE POLICY "org_lead_notifications_delete"
    ON public.lead_notifications
    FOR DELETE
    TO authenticated
    USING (
        org_id IS NOT NULL AND public.has_org_permission(org_id, 'leads.delete')
    );
-- ============================================================================
-- SECTION F: SEED DATA
-- ============================================================================

-- F1: Default org
-- ----------------------------------------------------------------------------
INSERT INTO public.orgs (id, name, slug, status)
VALUES (
    '00000000-0000-4000-a000-000000000001',
    'MPB Health',
    'mpb-health',
    'active'
)
ON CONFLICT (slug) DO NOTHING;
-- F2: Seed ALL permission definitions
-- ----------------------------------------------------------------------------
INSERT INTO public.permissions (key, module, description) VALUES
    ('leads.read',       'leads',    'View leads'),
    ('leads.write',      'leads',    'Create and edit leads'),
    ('leads.delete',     'leads',    'Delete leads'),
    ('leads.export',     'leads',    'Export leads data'),
    ('pipeline.read',    'pipeline', 'View pipeline stages'),
    ('pipeline.write',   'pipeline', 'Manage pipeline stages'),
    ('tasks.read',       'tasks',    'View tasks'),
    ('tasks.write',      'tasks',    'Create and edit tasks'),
    ('reports.read',     'reports',  'View reports'),
    ('reports.export',   'reports',  'Export reports'),
    ('settings.read',    'settings', 'View settings'),
    ('settings.write',   'settings', 'Modify settings'),
    ('settings.admin',   'settings', 'Administer system settings'),
    ('contacts.read',    'contacts', 'View contacts'),
    ('contacts.write',   'contacts', 'Create and edit contacts'),
    ('contacts.delete',  'contacts', 'Delete contacts'),
    ('audit.read',       'audit',    'View audit trail'),
    ('org.manage',       'org',      'Manage organization settings'),
    ('members.invite',   'members',  'Invite new members'),
    ('members.manage',   'members',  'Manage org members'),
    ('roles.manage',     'roles',    'Manage roles and permissions')
ON CONFLICT (key) DO NOTHING;
-- F3: Seed default role_permissions for the default org
-- ----------------------------------------------------------------------------

-- owner: ALL permissions
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'owner',
    p.id
FROM public.permissions p
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- admin: ALL except org.manage and roles.manage
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'admin',
    p.id
FROM public.permissions p
WHERE p.key NOT IN ('org.manage', 'roles.manage')
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- manager: leads.*, pipeline.*, tasks.*, reports.*, contacts.*, members.invite
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'manager',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'leads.read', 'leads.write', 'leads.delete', 'leads.export',
    'pipeline.read', 'pipeline.write',
    'tasks.read', 'tasks.write',
    'reports.read', 'reports.export',
    'contacts.read', 'contacts.write', 'contacts.delete',
    'members.invite'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- agent: leads.read, leads.write, pipeline.read, pipeline.write,
--        tasks.read, tasks.write, contacts.read, contacts.write, reports.read
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'agent',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'leads.read', 'leads.write',
    'pipeline.read', 'pipeline.write',
    'tasks.read', 'tasks.write',
    'contacts.read', 'contacts.write',
    'reports.read'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- member: leads.read, contacts.read, reports.read
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'member',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'leads.read',
    'contacts.read',
    'reports.read'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- F4: Backfill org_id on existing CRM tables to the default org
-- ----------------------------------------------------------------------------
UPDATE public.zoho_lead_submissions
   SET org_id = '00000000-0000-4000-a000-000000000001'
 WHERE org_id IS NULL;
UPDATE public.lead_activities
   SET org_id = '00000000-0000-4000-a000-000000000001'
 WHERE org_id IS NULL;
UPDATE public.lead_tasks
   SET org_id = '00000000-0000-4000-a000-000000000001'
 WHERE org_id IS NULL;
UPDATE public.crm_pipeline_stages
   SET org_id = '00000000-0000-4000-a000-000000000001'
 WHERE org_id IS NULL;
UPDATE public.lead_notifications
   SET org_id = '00000000-0000-4000-a000-000000000001'
 WHERE org_id IS NULL;
-- F5: Create org_memberships for existing users in user_roles
-- Map: super_admin -> owner, admin -> admin, advisor -> agent, member -> member
-- ----------------------------------------------------------------------------
INSERT INTO public.org_memberships (user_id, org_id, role, status, joined_at)
SELECT
    ur.user_id,
    '00000000-0000-4000-a000-000000000001',
    CASE ur.role::text
        WHEN 'super_admin' THEN 'owner'
        WHEN 'admin'       THEN 'admin'
        WHEN 'advisor'     THEN 'agent'
        WHEN 'member'      THEN 'member'
        ELSE 'member'
    END,
    'active',
    COALESCE(ur.created_at, now())
FROM public.user_roles ur
ON CONFLICT (user_id, org_id) DO NOTHING;
-- ============================================================================
-- SECTION F6: INDEXES
-- ============================================================================

-- org_memberships indexes
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_org
    ON public.org_memberships (user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_role
    ON public.org_memberships (org_id, role);
-- audit_events indexes
CREATE INDEX IF NOT EXISTS idx_audit_events_org_created
    ON public.audit_events (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_created
    ON public.audit_events (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity
    ON public.audit_events (entity_type, entity_id);
-- CRM tables org_id indexes
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_org_id
    ON public.zoho_lead_submissions (org_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_org_id
    ON public.lead_activities (org_id);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_org_id
    ON public.lead_tasks (org_id);
CREATE INDEX IF NOT EXISTS idx_crm_pipeline_stages_org_id
    ON public.crm_pipeline_stages (org_id);
CREATE INDEX IF NOT EXISTS idx_lead_notifications_org_id
    ON public.lead_notifications (org_id);
-- ============================================================================
-- SECTION F7: UPDATED_AT TRIGGERS
-- ============================================================================

-- Trigger function for orgs
CREATE OR REPLACE FUNCTION public.handle_orgs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_orgs_updated_at ON public.orgs;
CREATE TRIGGER trigger_orgs_updated_at
    BEFORE UPDATE ON public.orgs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_orgs_updated_at();
-- Trigger function for org_memberships
CREATE OR REPLACE FUNCTION public.handle_org_memberships_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_org_memberships_updated_at ON public.org_memberships;
CREATE TRIGGER trigger_org_memberships_updated_at
    BEFORE UPDATE ON public.org_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_org_memberships_updated_at();
COMMIT;

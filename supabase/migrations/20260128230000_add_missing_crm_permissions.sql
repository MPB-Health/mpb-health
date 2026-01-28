-- ============================================================================
-- Migration: Add Missing CRM Permissions
-- Description: Adds permission definitions for Leads, Contacts, Pipeline, Tasks,
--   Reports, Email, and Settings modules that were missing from earlier migrations.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION A: ADD MISSING PERMISSION DEFINITIONS
-- ============================================================================

INSERT INTO public.permissions (key, module, description) VALUES
    -- Leads module (core CRM functionality)
    ('leads.read',     'leads',    'View leads'),
    ('leads.write',    'leads',    'Create and edit leads'),
    ('leads.delete',   'leads',    'Delete leads'),
    ('leads.export',   'leads',    'Export leads data'),

    -- Contacts module
    ('contacts.read',   'contacts', 'View contacts'),
    ('contacts.write',  'contacts', 'Create and edit contacts'),
    ('contacts.delete', 'contacts', 'Delete contacts'),
    ('contacts.export', 'contacts', 'Export contacts data'),

    -- Pipeline module
    ('pipeline.read',   'pipeline', 'View pipeline'),
    ('pipeline.write',  'pipeline', 'Create and edit pipeline stages'),

    -- Tasks module
    ('tasks.read',      'tasks',    'View tasks'),
    ('tasks.write',     'tasks',    'Create and edit tasks'),

    -- Reports module
    ('reports.read',    'reports',  'View reports'),
    ('reports.write',   'reports',  'Create and edit reports'),
    ('reports.export',  'reports',  'Export reports'),

    -- Email module
    ('email.read',      'email',    'View sent emails'),
    ('email.write',     'email',    'Send emails'),
    ('email.templates', 'email',    'Manage email templates and schedules'),

    -- Settings module
    ('settings.read',   'settings', 'View settings'),
    ('settings.manage', 'settings', 'Manage organization settings'),

    -- Studio module (custom modules)
    ('studio.access',   'studio',   'Access CRM Studio'),
    ('studio.manage',   'studio',   'Create and edit custom modules')
ON CONFLICT (key) DO NOTHING;


-- ============================================================================
-- SECTION B: GRANT NEW PERMISSIONS TO ROLES (DEFAULT ORG)
-- ============================================================================

-- owner: ALL new permissions
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'owner',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'leads.read', 'leads.write', 'leads.delete', 'leads.export',
    'contacts.read', 'contacts.write', 'contacts.delete', 'contacts.export',
    'pipeline.read', 'pipeline.write',
    'tasks.read', 'tasks.write',
    'reports.read', 'reports.write', 'reports.export',
    'email.read', 'email.write', 'email.templates',
    'settings.read', 'settings.manage',
    'studio.access', 'studio.manage'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;

-- admin: ALL new permissions
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'admin',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'leads.read', 'leads.write', 'leads.delete', 'leads.export',
    'contacts.read', 'contacts.write', 'contacts.delete', 'contacts.export',
    'pipeline.read', 'pipeline.write',
    'tasks.read', 'tasks.write',
    'reports.read', 'reports.write', 'reports.export',
    'email.read', 'email.write', 'email.templates',
    'settings.read', 'settings.manage',
    'studio.access', 'studio.manage'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;

-- manager: most read/write, no delete/export, limited settings
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'manager',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'leads.read', 'leads.write', 'leads.export',
    'contacts.read', 'contacts.write', 'contacts.export',
    'pipeline.read', 'pipeline.write',
    'tasks.read', 'tasks.write',
    'reports.read', 'reports.write', 'reports.export',
    'email.read', 'email.write', 'email.templates',
    'settings.read'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;

-- agent: read/write only, limited email/settings
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'agent',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'leads.read', 'leads.write',
    'contacts.read', 'contacts.write',
    'pipeline.read',
    'tasks.read', 'tasks.write',
    'reports.read',
    'email.read', 'email.write',
    'settings.read'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;

-- member: read only
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'member',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'leads.read',
    'contacts.read',
    'pipeline.read',
    'tasks.read',
    'reports.read',
    'email.read',
    'settings.read'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;


-- ============================================================================
-- SECTION C: GRANT PERMISSIONS FOR ALL EXISTING ORGS
-- This ensures any organization created before this migration gets the permissions
-- ============================================================================

-- For each existing org (other than default), copy permission grants from default org
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT DISTINCT
    o.id,
    rp.role,
    rp.permission_id
FROM public.organizations o
CROSS JOIN public.role_permissions rp
WHERE rp.org_id = '00000000-0000-4000-a000-000000000001'
  AND o.id != '00000000-0000-4000-a000-000000000001'
  AND rp.permission_id IN (
      SELECT id FROM public.permissions
      WHERE key IN (
          'leads.read', 'leads.write', 'leads.delete', 'leads.export',
          'contacts.read', 'contacts.write', 'contacts.delete', 'contacts.export',
          'pipeline.read', 'pipeline.write',
          'tasks.read', 'tasks.write',
          'reports.read', 'reports.write', 'reports.export',
          'email.read', 'email.write', 'email.templates',
          'settings.read', 'settings.manage',
          'studio.access', 'studio.manage'
      )
  )
ON CONFLICT (org_id, role, permission_id) DO NOTHING;

COMMIT;

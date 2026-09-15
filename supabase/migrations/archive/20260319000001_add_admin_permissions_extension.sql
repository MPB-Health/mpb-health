-- ============================================================================
-- Migration: Admin Portal Permissions Extension
-- Description: Adds 10 granular permission keys for admin portal modules that
--   were missing from the permissions table. These align with the
--   RequirePermission guards in the admin portal App.tsx and cover users,
--   enrollments, support, content, and analytics modules.
-- Target project: dtmnkzllidaiqyheguhl (MPB HEALTH WEBSITE / primary)
-- ============================================================================

BEGIN;
-- ============================================================================
-- SECTION A: INSERT NEW PERMISSION DEFINITIONS
-- ============================================================================

INSERT INTO public.permissions (key, module, description) VALUES
  -- Users module
  ('users.read',            'users',       'View users and advisors'),
  ('users.manage',          'users',       'Create, edit, and deactivate users'),

  -- Enrollments module
  ('enrollments.read',      'enrollments', 'View enrollment requests'),
  ('enrollments.manage',    'enrollments', 'Approve and manage enrollment requests'),

  -- Support / ticketing module
  ('support.read',          'support',     'View support tickets'),
  ('support.manage',        'support',     'Manage, assign, and close support tickets'),

  -- Content / CMS module
  ('content.read',          'content',     'View CMS content (bulletins, blog, etc.)'),
  ('content.manage',        'content',     'Create and edit CMS content'),

  -- Analytics module
  ('analytics.view',        'analytics',   'View analytics dashboards'),

  -- Members module (read-only, manage already exists)
  ('members.read',          'members',     'View member records')

ON CONFLICT (key) DO NOTHING;
-- ============================================================================
-- SECTION B: GRANT NEW PERMISSIONS TO ROLES (DEFAULT ORG)
-- ============================================================================

-- owner & admin: all new permissions
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
  '00000000-0000-4000-a000-000000000001',
  r.role,
  p.id
FROM public.permissions p
CROSS JOIN (VALUES ('owner'), ('admin')) AS r(role)
WHERE p.key IN (
  'users.read', 'users.manage',
  'enrollments.read', 'enrollments.manage',
  'support.read', 'support.manage',
  'content.read', 'content.manage',
  'analytics.view',
  'members.read'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- manager: read + manage support/content, read enrollments, read users, analytics
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
  '00000000-0000-4000-a000-000000000001',
  'manager',
  p.id
FROM public.permissions p
WHERE p.key IN (
  'users.read',
  'enrollments.read',
  'support.read', 'support.manage',
  'content.read', 'content.manage',
  'analytics.view',
  'members.read'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- agent: read-only across most modules, no user/enrollment management
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
  '00000000-0000-4000-a000-000000000001',
  'agent',
  p.id
FROM public.permissions p
WHERE p.key IN (
  'support.read',
  'content.read',
  'members.read'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- member: minimal read access
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
  '00000000-0000-4000-a000-000000000001',
  'member',
  p.id
FROM public.permissions p
WHERE p.key IN (
  'support.read',
  'content.read'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
COMMIT;

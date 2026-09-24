-- ============================================================================
-- CRM rebuild — Phase 1: permission keys for Recruiting + Master Templates
--
-- Adds three new permission keys used by the rebuild:
--   - recruiting.read         (P5 — Recruiting clone read access)
--   - recruiting.write        (P5 — Recruiting clone create/edit)
--   - templates.master.manage (P3 — admin-only Master Template Library)
--
-- Owner/admin get all three. Manager + agent get recruiting.read/.write
-- (they need to use the module). Master template management stays
-- admin-only (Section 7 Round 3 Addendum).
-- ============================================================================

BEGIN;
-- ----------------------------------------------------------------------------
-- 1. Permission catalog
-- ----------------------------------------------------------------------------

INSERT INTO public.permissions (key, module, description) VALUES
    ('recruiting.read',         'recruiting', 'View agent recruiting records and pipeline'),
    ('recruiting.write',        'recruiting', 'Create and edit agent recruiting records'),
    ('templates.master.manage', 'templates',  'Manage the admin-only Master Template Library')
ON CONFLICT (key) DO NOTHING;
-- ----------------------------------------------------------------------------
-- 2. Default org grants — owner/admin get everything
-- ----------------------------------------------------------------------------

INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    r.role,
    p.id
FROM public.permissions p
CROSS JOIN (VALUES ('owner'), ('admin')) AS r(role)
WHERE p.key IN (
    'recruiting.read',
    'recruiting.write',
    'templates.master.manage'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- ----------------------------------------------------------------------------
-- 3. Manager: full Recruiting use, NO master template management
-- ----------------------------------------------------------------------------

INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'manager',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'recruiting.read',
    'recruiting.write'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- ----------------------------------------------------------------------------
-- 4. Agent: read Recruiting, write own records (recruiting.write covers it
--    behind RLS that scopes by owner_id)
-- ----------------------------------------------------------------------------

INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'agent',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'recruiting.read',
    'recruiting.write'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
COMMIT;

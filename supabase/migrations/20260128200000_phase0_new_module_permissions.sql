-- ============================================================================
-- Migration: Phase 0 - Add Permission Keys for New CRM Modules
-- Description: Adds permission definitions for Accounts, Deals, Products,
--   Quotes, Invoices, and Campaigns modules. Maps to role defaults.
-- ============================================================================

BEGIN;
-- ============================================================================
-- SECTION A: ADD NEW PERMISSION DEFINITIONS
-- ============================================================================

INSERT INTO public.permissions (key, module, description) VALUES
    -- Accounts module
    ('accounts.read',    'accounts',  'View accounts'),
    ('accounts.write',   'accounts',  'Create and edit accounts'),
    ('accounts.delete',  'accounts',  'Delete accounts'),
    ('accounts.export',  'accounts',  'Export accounts data'),

    -- Deals module
    ('deals.read',       'deals',     'View deals'),
    ('deals.write',      'deals',     'Create and edit deals'),
    ('deals.delete',     'deals',     'Delete deals'),
    ('deals.export',     'deals',     'Export deals data'),

    -- Products module
    ('products.read',    'products',  'View products'),
    ('products.write',   'products',  'Create and edit products'),

    -- Quotes module
    ('quotes.read',      'quotes',    'View quotes'),
    ('quotes.write',     'quotes',    'Create and edit quotes'),
    ('quotes.send',      'quotes',    'Send quotes to contacts'),

    -- Invoices module
    ('invoices.read',    'invoices',  'View invoices'),
    ('invoices.write',   'invoices',  'Create and edit invoices'),
    ('invoices.send',    'invoices',  'Send invoices to contacts'),

    -- Campaigns module
    ('campaigns.read',   'campaigns', 'View campaigns'),
    ('campaigns.write',  'campaigns', 'Create and edit campaigns'),

    -- Tasks delete (was missing)
    ('tasks.delete',     'tasks',     'Delete tasks'),

    -- Pipeline delete (was missing)
    ('pipeline.delete',  'pipeline',  'Delete pipeline stages')
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
    'accounts.read', 'accounts.write', 'accounts.delete', 'accounts.export',
    'deals.read', 'deals.write', 'deals.delete', 'deals.export',
    'products.read', 'products.write',
    'quotes.read', 'quotes.write', 'quotes.send',
    'invoices.read', 'invoices.write', 'invoices.send',
    'campaigns.read', 'campaigns.write',
    'tasks.delete', 'pipeline.delete'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- admin: ALL new permissions except none (same as owner for these)
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'admin',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'accounts.read', 'accounts.write', 'accounts.delete', 'accounts.export',
    'deals.read', 'deals.write', 'deals.delete', 'deals.export',
    'products.read', 'products.write',
    'quotes.read', 'quotes.write', 'quotes.send',
    'invoices.read', 'invoices.write', 'invoices.send',
    'campaigns.read', 'campaigns.write',
    'tasks.delete', 'pipeline.delete'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- manager: all read/write/export, send quotes/invoices, no delete
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'manager',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'accounts.read', 'accounts.write', 'accounts.export',
    'deals.read', 'deals.write', 'deals.export',
    'products.read', 'products.write',
    'quotes.read', 'quotes.write', 'quotes.send',
    'invoices.read', 'invoices.write', 'invoices.send',
    'campaigns.read', 'campaigns.write',
    'tasks.delete'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- agent: read/write only, no delete/export/send
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'agent',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'accounts.read', 'accounts.write',
    'deals.read', 'deals.write',
    'products.read',
    'quotes.read', 'quotes.write',
    'invoices.read',
    'campaigns.read'
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
    'accounts.read',
    'deals.read',
    'products.read',
    'quotes.read',
    'invoices.read',
    'campaigns.read'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
COMMIT;

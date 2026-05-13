-- ============================================================================
-- Grant Vendor, Purchase Order, and Sales Order permissions to roles
-- These permissions were registered in 20260128212000 but never granted
-- ============================================================================

BEGIN;
-- owner: ALL vendor/PO/SO permissions
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'owner',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'vendors.read', 'vendors.write', 'vendors.delete',
    'purchase_orders.read', 'purchase_orders.write', 'purchase_orders.delete', 'purchase_orders.approve',
    'sales_orders.read', 'sales_orders.write', 'sales_orders.delete', 'sales_orders.approve',
    'quotes.approve', 'invoices.approve'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- admin: ALL vendor/PO/SO permissions
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'admin',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'vendors.read', 'vendors.write', 'vendors.delete',
    'purchase_orders.read', 'purchase_orders.write', 'purchase_orders.delete', 'purchase_orders.approve',
    'sales_orders.read', 'sales_orders.write', 'sales_orders.delete', 'sales_orders.approve',
    'quotes.approve', 'invoices.approve'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- manager: read/write/approve, no delete
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'manager',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'vendors.read', 'vendors.write',
    'purchase_orders.read', 'purchase_orders.write', 'purchase_orders.approve',
    'sales_orders.read', 'sales_orders.write', 'sales_orders.approve',
    'quotes.approve', 'invoices.approve'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
-- agent: read/write only, no delete/approve
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT
    '00000000-0000-4000-a000-000000000001',
    'agent',
    p.id
FROM public.permissions p
WHERE p.key IN (
    'vendors.read', 'vendors.write',
    'purchase_orders.read', 'purchase_orders.write',
    'sales_orders.read', 'sales_orders.write'
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
    'vendors.read',
    'purchase_orders.read',
    'sales_orders.read'
)
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
COMMIT;

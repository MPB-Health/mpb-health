-- =====================================================
-- CRM Vendors, Purchase Orders, Sales Orders
-- Phase 1b: CPQ-lite completion
-- =====================================================

-- -----------------------------------------------------
-- Vendors Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Basic Info
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,

    -- Contact Info
    email TEXT,
    phone TEXT,
    website TEXT,

    -- Address
    address JSONB DEFAULT '{}',

    -- Business Info
    vendor_type TEXT DEFAULT 'supplier' CHECK (vendor_type IN ('supplier', 'manufacturer', 'distributor', 'contractor', 'other')),
    payment_terms TEXT,
    tax_id TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),

    -- Relations
    primary_contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Purchase Orders Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Order Info
    po_number TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Relations
    vendor_id UUID NOT NULL REFERENCES public.crm_vendors(id) ON DELETE RESTRICT,

    -- Status & Approval
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'acknowledged', 'partially_received', 'received', 'cancelled', 'closed')),
    approval_status TEXT DEFAULT 'not_required' CHECK (approval_status IN ('not_required', 'pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Amounts
    subtotal NUMERIC(15,2) DEFAULT 0,
    discount_percent NUMERIC(5,2),
    discount_amount NUMERIC(15,2),
    tax_amount NUMERIC(15,2) DEFAULT 0,
    shipping_amount NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',

    -- Dates
    order_date DATE,
    expected_date DATE,
    received_date DATE,

    -- Shipping
    ship_to_address JSONB DEFAULT '{}',
    shipping_method TEXT,
    tracking_number TEXT,

    -- Terms
    payment_terms TEXT,
    terms_and_conditions TEXT,
    notes TEXT,

    -- Owner
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Audit
    sent_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Purchase Order Line Items
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_purchase_order_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES public.crm_purchase_orders(id) ON DELETE CASCADE,

    -- Product
    product_id UUID REFERENCES public.crm_products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,

    -- Quantities
    quantity NUMERIC(15,2) NOT NULL DEFAULT 1,
    quantity_received NUMERIC(15,2) DEFAULT 0,
    unit TEXT DEFAULT 'each',

    -- Pricing
    unit_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2),
    discount_amount NUMERIC(15,2),
    tax_rate NUMERIC(5,2),
    subtotal NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) DEFAULT 0,

    -- Order
    sort_order INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Sales Orders Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Order Info
    so_number TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Relations
    account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES public.crm_quotes(id) ON DELETE SET NULL,

    -- Status & Approval
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'confirmed', 'processing', 'shipped', 'partially_delivered', 'delivered', 'cancelled', 'closed')),
    approval_status TEXT DEFAULT 'not_required' CHECK (approval_status IN ('not_required', 'pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Amounts
    subtotal NUMERIC(15,2) DEFAULT 0,
    discount_percent NUMERIC(5,2),
    discount_amount NUMERIC(15,2),
    tax_amount NUMERIC(15,2) DEFAULT 0,
    shipping_amount NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',

    -- Dates
    order_date DATE,
    requested_date DATE,
    promised_date DATE,
    shipped_date DATE,
    delivered_date DATE,

    -- Addresses
    billing_address JSONB DEFAULT '{}',
    shipping_address JSONB DEFAULT '{}',

    -- Shipping
    shipping_method TEXT,
    tracking_number TEXT,
    carrier TEXT,

    -- Terms
    payment_terms TEXT,
    terms_and_conditions TEXT,
    notes TEXT,

    -- Owner
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Audit
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Sales Order Line Items
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_sales_order_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_order_id UUID NOT NULL REFERENCES public.crm_sales_orders(id) ON DELETE CASCADE,

    -- Product
    product_id UUID REFERENCES public.crm_products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,

    -- Quantities
    quantity NUMERIC(15,2) NOT NULL DEFAULT 1,
    quantity_shipped NUMERIC(15,2) DEFAULT 0,
    quantity_delivered NUMERIC(15,2) DEFAULT 0,
    unit TEXT DEFAULT 'each',

    -- Pricing
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5,2),
    discount_amount NUMERIC(15,2),
    tax_rate NUMERIC(5,2),
    subtotal NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) DEFAULT 0,

    -- Order
    sort_order INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Auto-generate PO/SO numbers
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
        CASE
            WHEN po_number ~ ('^PO-' || year_part || '-[0-9]+$')
            THEN CAST(SUBSTRING(po_number FROM 'PO-' || year_part || '-([0-9]+)$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 INTO seq_num
    FROM public.crm_purchase_orders
    WHERE org_id = NEW.org_id;

    NEW.po_number := 'PO-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_po_number
    BEFORE INSERT ON public.crm_purchase_orders
    FOR EACH ROW
    WHEN (NEW.po_number IS NULL OR NEW.po_number = '')
    EXECUTE FUNCTION generate_po_number();

CREATE OR REPLACE FUNCTION generate_so_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
        CASE
            WHEN so_number ~ ('^SO-' || year_part || '-[0-9]+$')
            THEN CAST(SUBSTRING(so_number FROM 'SO-' || year_part || '-([0-9]+)$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 INTO seq_num
    FROM public.crm_sales_orders
    WHERE org_id = NEW.org_id;

    NEW.so_number := 'SO-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_so_number
    BEFORE INSERT ON public.crm_sales_orders
    FOR EACH ROW
    WHEN (NEW.so_number IS NULL OR NEW.so_number = '')
    EXECUTE FUNCTION generate_so_number();

-- -----------------------------------------------------
-- Updated_at triggers
-- -----------------------------------------------------
CREATE TRIGGER set_updated_at_crm_vendors
    BEFORE UPDATE ON public.crm_vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_crm_purchase_orders
    BEFORE UPDATE ON public.crm_purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_crm_purchase_order_line_items
    BEFORE UPDATE ON public.crm_purchase_order_line_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_crm_sales_orders
    BEFORE UPDATE ON public.crm_sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_crm_sales_order_line_items
    BEFORE UPDATE ON public.crm_sales_order_line_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- Indexes
-- -----------------------------------------------------
CREATE INDEX idx_crm_vendors_org ON public.crm_vendors(org_id);
CREATE INDEX idx_crm_vendors_name ON public.crm_vendors(name);
CREATE INDEX idx_crm_vendors_active ON public.crm_vendors(is_active);

CREATE INDEX idx_crm_purchase_orders_org ON public.crm_purchase_orders(org_id);
CREATE INDEX idx_crm_purchase_orders_vendor ON public.crm_purchase_orders(vendor_id);
CREATE INDEX idx_crm_purchase_orders_status ON public.crm_purchase_orders(status);
CREATE INDEX idx_crm_purchase_orders_number ON public.crm_purchase_orders(po_number);

CREATE INDEX idx_crm_po_line_items_order ON public.crm_purchase_order_line_items(purchase_order_id);

CREATE INDEX idx_crm_sales_orders_org ON public.crm_sales_orders(org_id);
CREATE INDEX idx_crm_sales_orders_account ON public.crm_sales_orders(account_id);
CREATE INDEX idx_crm_sales_orders_status ON public.crm_sales_orders(status);
CREATE INDEX idx_crm_sales_orders_number ON public.crm_sales_orders(so_number);
CREATE INDEX idx_crm_sales_orders_quote ON public.crm_sales_orders(quote_id);

CREATE INDEX idx_crm_so_line_items_order ON public.crm_sales_order_line_items(sales_order_id);

-- -----------------------------------------------------
-- RLS Policies
-- -----------------------------------------------------
ALTER TABLE public.crm_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_purchase_order_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sales_order_line_items ENABLE ROW LEVEL SECURITY;

-- Vendors RLS
CREATE POLICY vendors_select ON public.crm_vendors FOR SELECT
    USING (is_org_member(org_id));

CREATE POLICY vendors_insert ON public.crm_vendors FOR INSERT
    WITH CHECK (is_org_member(org_id) AND has_org_permission(org_id, 'vendors.write'));

CREATE POLICY vendors_update ON public.crm_vendors FOR UPDATE
    USING (is_org_member(org_id) AND has_org_permission(org_id, 'vendors.write'));

CREATE POLICY vendors_delete ON public.crm_vendors FOR DELETE
    USING (is_org_member(org_id) AND has_org_permission(org_id, 'vendors.delete'));

-- Purchase Orders RLS
CREATE POLICY po_select ON public.crm_purchase_orders FOR SELECT
    USING (is_org_member(org_id));

CREATE POLICY po_insert ON public.crm_purchase_orders FOR INSERT
    WITH CHECK (is_org_member(org_id) AND has_org_permission(org_id, 'purchase_orders.write'));

CREATE POLICY po_update ON public.crm_purchase_orders FOR UPDATE
    USING (is_org_member(org_id) AND has_org_permission(org_id, 'purchase_orders.write'));

CREATE POLICY po_delete ON public.crm_purchase_orders FOR DELETE
    USING (is_org_member(org_id) AND has_org_permission(org_id, 'purchase_orders.delete'));

-- PO Line Items RLS (via parent)
CREATE POLICY po_items_select ON public.crm_purchase_order_line_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.crm_purchase_orders po WHERE po.id = purchase_order_id AND is_org_member(po.org_id)));

CREATE POLICY po_items_insert ON public.crm_purchase_order_line_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.crm_purchase_orders po WHERE po.id = purchase_order_id AND is_org_member(po.org_id) AND has_org_permission(po.org_id, 'purchase_orders.write')));

CREATE POLICY po_items_update ON public.crm_purchase_order_line_items FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.crm_purchase_orders po WHERE po.id = purchase_order_id AND is_org_member(po.org_id) AND has_org_permission(po.org_id, 'purchase_orders.write')));

CREATE POLICY po_items_delete ON public.crm_purchase_order_line_items FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.crm_purchase_orders po WHERE po.id = purchase_order_id AND is_org_member(po.org_id) AND has_org_permission(po.org_id, 'purchase_orders.write')));

-- Sales Orders RLS
CREATE POLICY so_select ON public.crm_sales_orders FOR SELECT
    USING (is_org_member(org_id));

CREATE POLICY so_insert ON public.crm_sales_orders FOR INSERT
    WITH CHECK (is_org_member(org_id) AND has_org_permission(org_id, 'sales_orders.write'));

CREATE POLICY so_update ON public.crm_sales_orders FOR UPDATE
    USING (is_org_member(org_id) AND has_org_permission(org_id, 'sales_orders.write'));

CREATE POLICY so_delete ON public.crm_sales_orders FOR DELETE
    USING (is_org_member(org_id) AND has_org_permission(org_id, 'sales_orders.delete'));

-- SO Line Items RLS (via parent)
CREATE POLICY so_items_select ON public.crm_sales_order_line_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.crm_sales_orders so WHERE so.id = sales_order_id AND is_org_member(so.org_id)));

CREATE POLICY so_items_insert ON public.crm_sales_order_line_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.crm_sales_orders so WHERE so.id = sales_order_id AND is_org_member(so.org_id) AND has_org_permission(so.org_id, 'sales_orders.write')));

CREATE POLICY so_items_update ON public.crm_sales_order_line_items FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.crm_sales_orders so WHERE so.id = sales_order_id AND is_org_member(so.org_id) AND has_org_permission(so.org_id, 'sales_orders.write')));

CREATE POLICY so_items_delete ON public.crm_sales_order_line_items FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.crm_sales_orders so WHERE so.id = sales_order_id AND is_org_member(so.org_id) AND has_org_permission(so.org_id, 'sales_orders.write')));

-- -----------------------------------------------------
-- Add permissions for new modules
-- -----------------------------------------------------
INSERT INTO public.permissions (key, module, description) VALUES
    ('vendors.read', 'vendors', 'View vendors'),
    ('vendors.write', 'vendors', 'Create and edit vendors'),
    ('vendors.delete', 'vendors', 'Delete vendors'),
    ('purchase_orders.read', 'purchase_orders', 'View purchase orders'),
    ('purchase_orders.write', 'purchase_orders', 'Create and edit purchase orders'),
    ('purchase_orders.delete', 'purchase_orders', 'Delete purchase orders'),
    ('purchase_orders.approve', 'purchase_orders', 'Approve purchase orders'),
    ('sales_orders.read', 'sales_orders', 'View sales orders'),
    ('sales_orders.write', 'sales_orders', 'Create and edit sales orders'),
    ('sales_orders.delete', 'sales_orders', 'Delete sales orders'),
    ('sales_orders.approve', 'sales_orders', 'Approve sales orders')
ON CONFLICT (key) DO NOTHING;

-- Map permissions to roles (DISABLED - requires org_id for multi-tenant)
/*
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT NULL, r.role, p.id
FROM (VALUES ('owner'), ('admin'), ('manager')) AS r(role)
CROSS JOIN public.permissions p
WHERE p.module IN ('vendors', 'purchase_orders', 'sales_orders')
ON CONFLICT (org_id, role, permission_id) DO NOTHING;

-- Agent role gets read + write (not delete/approve)
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT NULL, 'agent', id FROM public.permissions
WHERE module IN ('vendors', 'purchase_orders', 'sales_orders')
  AND key NOT LIKE '%.delete' AND key NOT LIKE '%.approve'
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
*/

-- -----------------------------------------------------
-- Add approval fields to existing tables
-- -----------------------------------------------------
ALTER TABLE public.crm_quotes
    ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'not_required' CHECK (approval_status IN ('not_required', 'pending', 'approved', 'rejected')),
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.crm_invoices
    ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'not_required' CHECK (approval_status IN ('not_required', 'pending', 'approved', 'rejected')),
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add approval permissions
INSERT INTO public.permissions (key, module, description) VALUES
    ('quotes.approve', 'quotes', 'Approve quotes'),
    ('invoices.approve', 'invoices', 'Approve invoices')
ON CONFLICT (key) DO NOTHING;

-- Map approval permissions to owner/admin/manager (DISABLED - requires org_id for multi-tenant)
/*
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT NULL, r.role, p.id
FROM (VALUES ('owner'), ('admin'), ('manager')) AS r(role)
CROSS JOIN public.permissions p
WHERE p.key IN ('quotes.approve', 'invoices.approve')
ON CONFLICT (org_id, role, permission_id) DO NOTHING;
*/

-- ============================================================================
-- Migration: CRM Products, Price Books Tables
-- Description: Product catalog and pricing tiers
-- ============================================================================

BEGIN;
-- ============================================================================
-- SECTION A: CREATE PRODUCTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

    -- Product Info
    name text NOT NULL,
    code text,
    description text,

    -- Pricing
    unit_price numeric(15,2) NOT NULL DEFAULT 0,
    cost_price numeric(15,2),
    tax_rate numeric(5,2) DEFAULT 0,

    -- Classification
    category text,
    product_family text,
    unit text DEFAULT 'each',  -- each, hour, month, year, etc.

    -- Status
    is_active boolean DEFAULT true,

    -- Stock (optional)
    qty_in_stock integer,
    reorder_level integer,

    -- Vendor
    vendor_id uuid,  -- Will reference crm_accounts if vendor

    -- Metadata
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- ============================================================================
-- SECTION B: CREATE PRICE BOOKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_price_books (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

    -- Price Book Info
    name text NOT NULL,
    description text,

    -- Status
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,

    -- Validity
    valid_from date,
    valid_to date,

    -- Metadata
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Only one default per org
    UNIQUE(org_id, is_default)
        -- This will fail if we try to have multiple defaults
        -- We need a partial unique index instead
);
-- Drop the constraint and create partial unique index
ALTER TABLE public.crm_price_books DROP CONSTRAINT IF EXISTS crm_price_books_org_id_is_default_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_price_books_default
    ON public.crm_price_books (org_id)
    WHERE is_default = true;
-- ============================================================================
-- SECTION C: CREATE PRICE BOOK ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_price_book_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    price_book_id uuid NOT NULL REFERENCES public.crm_price_books(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.crm_products(id) ON DELETE CASCADE,

    -- Pricing Override
    list_price numeric(15,2) NOT NULL,
    discount_percent numeric(5,2) DEFAULT 0,

    -- Metadata
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Unique product per price book
    UNIQUE(price_book_id, product_id)
);
-- ============================================================================
-- SECTION D: INDEXES
-- ============================================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_crm_products_org_id
    ON public.crm_products (org_id);
CREATE INDEX IF NOT EXISTS idx_crm_products_code
    ON public.crm_products (code);
CREATE INDEX IF NOT EXISTS idx_crm_products_category
    ON public.crm_products (category);
CREATE INDEX IF NOT EXISTS idx_crm_products_active
    ON public.crm_products (org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_crm_products_name
    ON public.crm_products (name);
-- Price books indexes
CREATE INDEX IF NOT EXISTS idx_crm_price_books_org_id
    ON public.crm_price_books (org_id);
CREATE INDEX IF NOT EXISTS idx_crm_price_books_active
    ON public.crm_price_books (org_id, is_active);
-- Price book items indexes
CREATE INDEX IF NOT EXISTS idx_crm_price_book_items_price_book
    ON public.crm_price_book_items (price_book_id);
CREATE INDEX IF NOT EXISTS idx_crm_price_book_items_product
    ON public.crm_price_book_items (product_id);
-- ============================================================================
-- SECTION E: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.crm_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_price_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_price_book_items ENABLE ROW LEVEL SECURITY;
-- Products policies
CREATE POLICY "crm_products_select"
    ON public.crm_products
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(org_id)
    );
CREATE POLICY "crm_products_insert"
    ON public.crm_products
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_org_permission(org_id, 'products.write')
    );
CREATE POLICY "crm_products_update"
    ON public.crm_products
    FOR UPDATE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'products.write')
    )
    WITH CHECK (
        public.has_org_permission(org_id, 'products.write')
    );
CREATE POLICY "crm_products_delete"
    ON public.crm_products
    FOR DELETE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'products.write')
    );
-- Price books policies
CREATE POLICY "crm_price_books_select"
    ON public.crm_price_books
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(org_id)
    );
CREATE POLICY "crm_price_books_insert"
    ON public.crm_price_books
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_org_permission(org_id, 'products.write')
    );
CREATE POLICY "crm_price_books_update"
    ON public.crm_price_books
    FOR UPDATE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'products.write')
    )
    WITH CHECK (
        public.has_org_permission(org_id, 'products.write')
    );
CREATE POLICY "crm_price_books_delete"
    ON public.crm_price_books
    FOR DELETE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'products.write')
    );
-- Price book items policies (based on price book access)
CREATE POLICY "crm_price_book_items_select"
    ON public.crm_price_book_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_price_books pb
            WHERE pb.id = price_book_id
            AND public.is_org_member(pb.org_id)
        )
    );
CREATE POLICY "crm_price_book_items_insert"
    ON public.crm_price_book_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_price_books pb
            WHERE pb.id = price_book_id
            AND public.has_org_permission(pb.org_id, 'products.write')
        )
    );
CREATE POLICY "crm_price_book_items_update"
    ON public.crm_price_book_items
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_price_books pb
            WHERE pb.id = price_book_id
            AND public.has_org_permission(pb.org_id, 'products.write')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_price_books pb
            WHERE pb.id = price_book_id
            AND public.has_org_permission(pb.org_id, 'products.write')
        )
    );
CREATE POLICY "crm_price_book_items_delete"
    ON public.crm_price_book_items
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_price_books pb
            WHERE pb.id = price_book_id
            AND public.has_org_permission(pb.org_id, 'products.write')
        )
    );
-- ============================================================================
-- SECTION F: SEED DEFAULT PRICE BOOK
-- ============================================================================

INSERT INTO public.crm_price_books (org_id, name, description, is_default, is_active)
VALUES (
    '00000000-0000-4000-a000-000000000001',
    'Standard Price Book',
    'Default price book for all products',
    true,
    true
)
ON CONFLICT DO NOTHING;
-- ============================================================================
-- SECTION G: UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_crm_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_crm_products_updated_at ON public.crm_products;
CREATE TRIGGER trigger_crm_products_updated_at
    BEFORE UPDATE ON public.crm_products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_products_updated_at();
CREATE OR REPLACE FUNCTION public.handle_crm_price_books_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_crm_price_books_updated_at ON public.crm_price_books;
CREATE TRIGGER trigger_crm_price_books_updated_at
    BEFORE UPDATE ON public.crm_price_books
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_price_books_updated_at();
CREATE OR REPLACE FUNCTION public.handle_crm_price_book_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_crm_price_book_items_updated_at ON public.crm_price_book_items;
CREATE TRIGGER trigger_crm_price_book_items_updated_at
    BEFORE UPDATE ON public.crm_price_book_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_price_book_items_updated_at();
COMMIT;

-- ============================================================================
-- Migration: CRM Quotes Tables
-- Description: Sales proposals/quotes with line items
-- ============================================================================

BEGIN;
-- ============================================================================
-- SECTION A: CREATE QUOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_quotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

    -- Quote Number (auto-generated per org)
    quote_number text NOT NULL,

    -- Linked Entities
    deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
    account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
    contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,

    -- Quote Info
    subject text,
    description text,

    -- Validity
    valid_until date,

    -- Status
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending_approval', 'sent', 'accepted', 'rejected', 'expired', 'cancelled')),

    -- Financials
    subtotal numeric(15,2) DEFAULT 0,
    discount_type text DEFAULT 'percent' CHECK (discount_type IN ('percent', 'amount')),
    discount_value numeric(15,2) DEFAULT 0,
    discount_amount numeric(15,2) DEFAULT 0,
    tax_amount numeric(15,2) DEFAULT 0,
    shipping_amount numeric(15,2) DEFAULT 0,
    adjustment numeric(15,2) DEFAULT 0,
    total numeric(15,2) DEFAULT 0,
    currency text DEFAULT 'USD',

    -- Terms
    terms_and_conditions text,
    notes text,

    -- Billing/Shipping
    billing_address jsonb DEFAULT '{}',
    shipping_address jsonb DEFAULT '{}',

    -- Timestamps
    sent_at timestamptz,
    accepted_at timestamptz,
    rejected_at timestamptz,

    -- Ownership
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Metadata
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- ============================================================================
-- SECTION B: CREATE QUOTE LINE ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_quote_line_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id uuid NOT NULL REFERENCES public.crm_quotes(id) ON DELETE CASCADE,

    -- Product Link (optional - can be ad-hoc line item)
    product_id uuid REFERENCES public.crm_products(id) ON DELETE SET NULL,

    -- Line Item Details
    name text NOT NULL,
    description text,

    -- Pricing
    quantity numeric(10,2) NOT NULL DEFAULT 1,
    unit_price numeric(15,2) NOT NULL,
    discount_percent numeric(5,2) DEFAULT 0,
    discount_amount numeric(15,2) DEFAULT 0,
    tax_rate numeric(5,2) DEFAULT 0,
    tax_amount numeric(15,2) DEFAULT 0,
    line_total numeric(15,2) NOT NULL,

    -- Ordering
    sort_order integer DEFAULT 0,

    -- Metadata
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- ============================================================================
-- SECTION C: QUOTE NUMBER SEQUENCE
-- ============================================================================

-- Function to generate quote number
CREATE OR REPLACE FUNCTION public.generate_quote_number(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
    v_year text;
BEGIN
    v_year := to_char(now(), 'YYYY');

    SELECT COUNT(*) + 1 INTO v_count
    FROM public.crm_quotes
    WHERE org_id = p_org_id
    AND created_at >= date_trunc('year', now());

    RETURN 'Q-' || v_year || '-' || LPAD(v_count::text, 5, '0');
END;
$$;
-- Trigger to auto-generate quote number
CREATE OR REPLACE FUNCTION public.handle_quote_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
        NEW.quote_number := public.generate_quote_number(NEW.org_id);
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_quote_number ON public.crm_quotes;
CREATE TRIGGER trigger_quote_number
    BEFORE INSERT ON public.crm_quotes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_quote_number();
-- ============================================================================
-- SECTION D: INDEXES
-- ============================================================================

-- Quotes indexes
CREATE INDEX IF NOT EXISTS idx_crm_quotes_org_id
    ON public.crm_quotes (org_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_deal_id
    ON public.crm_quotes (deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_account_id
    ON public.crm_quotes (account_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_contact_id
    ON public.crm_quotes (contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_status
    ON public.crm_quotes (status);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_valid_until
    ON public.crm_quotes (valid_until);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_quote_number
    ON public.crm_quotes (quote_number);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_created_at
    ON public.crm_quotes (created_at DESC);
-- Quote line items indexes
CREATE INDEX IF NOT EXISTS idx_crm_quote_line_items_quote
    ON public.crm_quote_line_items (quote_id);
CREATE INDEX IF NOT EXISTS idx_crm_quote_line_items_product
    ON public.crm_quote_line_items (product_id);
CREATE INDEX IF NOT EXISTS idx_crm_quote_line_items_sort
    ON public.crm_quote_line_items (quote_id, sort_order);
-- ============================================================================
-- SECTION E: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.crm_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_quote_line_items ENABLE ROW LEVEL SECURITY;
-- Quotes policies
CREATE POLICY "crm_quotes_select"
    ON public.crm_quotes
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(org_id)
    );
CREATE POLICY "crm_quotes_insert"
    ON public.crm_quotes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_org_permission(org_id, 'quotes.write')
    );
CREATE POLICY "crm_quotes_update"
    ON public.crm_quotes
    FOR UPDATE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'quotes.write')
    )
    WITH CHECK (
        public.has_org_permission(org_id, 'quotes.write')
    );
CREATE POLICY "crm_quotes_delete"
    ON public.crm_quotes
    FOR DELETE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'quotes.write')
        AND status = 'draft'  -- Can only delete drafts
    );
-- Quote line items policies
CREATE POLICY "crm_quote_line_items_select"
    ON public.crm_quote_line_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_quotes q
            WHERE q.id = quote_id
            AND public.is_org_member(q.org_id)
        )
    );
CREATE POLICY "crm_quote_line_items_insert"
    ON public.crm_quote_line_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_quotes q
            WHERE q.id = quote_id
            AND public.has_org_permission(q.org_id, 'quotes.write')
            AND q.status = 'draft'  -- Can only modify drafts
        )
    );
CREATE POLICY "crm_quote_line_items_update"
    ON public.crm_quote_line_items
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_quotes q
            WHERE q.id = quote_id
            AND public.has_org_permission(q.org_id, 'quotes.write')
            AND q.status = 'draft'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_quotes q
            WHERE q.id = quote_id
            AND public.has_org_permission(q.org_id, 'quotes.write')
            AND q.status = 'draft'
        )
    );
CREATE POLICY "crm_quote_line_items_delete"
    ON public.crm_quote_line_items
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_quotes q
            WHERE q.id = quote_id
            AND public.has_org_permission(q.org_id, 'quotes.write')
            AND q.status = 'draft'
        )
    );
-- ============================================================================
-- SECTION F: QUOTE TOTALS CALCULATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_quote_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quote_id uuid;
    v_subtotal numeric(15,2);
    v_tax_amount numeric(15,2);
BEGIN
    -- Determine which quote to recalculate
    IF TG_OP = 'DELETE' THEN
        v_quote_id := OLD.quote_id;
    ELSE
        v_quote_id := NEW.quote_id;
    END IF;

    -- Calculate subtotal and tax from line items
    SELECT
        COALESCE(SUM(line_total - tax_amount), 0),
        COALESCE(SUM(tax_amount), 0)
    INTO v_subtotal, v_tax_amount
    FROM public.crm_quote_line_items
    WHERE quote_id = v_quote_id;

    -- Update quote totals
    UPDATE public.crm_quotes
    SET
        subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        total = v_subtotal + v_tax_amount + COALESCE(shipping_amount, 0) + COALESCE(adjustment, 0) - COALESCE(discount_amount, 0),
        updated_at = now()
    WHERE id = v_quote_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;
DROP TRIGGER IF EXISTS trigger_recalculate_quote_totals ON public.crm_quote_line_items;
CREATE TRIGGER trigger_recalculate_quote_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.crm_quote_line_items
    FOR EACH ROW
    EXECUTE FUNCTION public.recalculate_quote_totals();
-- ============================================================================
-- SECTION G: UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_crm_quotes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_crm_quotes_updated_at ON public.crm_quotes;
CREATE TRIGGER trigger_crm_quotes_updated_at
    BEFORE UPDATE ON public.crm_quotes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_quotes_updated_at();
CREATE OR REPLACE FUNCTION public.handle_crm_quote_line_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_crm_quote_line_items_updated_at ON public.crm_quote_line_items;
CREATE TRIGGER trigger_crm_quote_line_items_updated_at
    BEFORE UPDATE ON public.crm_quote_line_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_quote_line_items_updated_at();
COMMIT;

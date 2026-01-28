-- ============================================================================
-- Migration: CRM Invoices Tables
-- Description: Billing/invoices with line items
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION A: CREATE INVOICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

    -- Invoice Number (auto-generated per org)
    invoice_number text NOT NULL,

    -- Linked Entities
    deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
    account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
    contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    quote_id uuid REFERENCES public.crm_quotes(id) ON DELETE SET NULL,

    -- Invoice Info
    subject text,
    description text,

    -- Status
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled', 'refunded')),

    -- Dates
    invoice_date date DEFAULT CURRENT_DATE,
    due_date date,
    paid_date date,
    payment_terms text,  -- Net 30, Net 60, etc.

    -- Financials
    subtotal numeric(15,2) DEFAULT 0,
    discount_type text DEFAULT 'percent' CHECK (discount_type IN ('percent', 'amount')),
    discount_value numeric(15,2) DEFAULT 0,
    discount_amount numeric(15,2) DEFAULT 0,
    tax_amount numeric(15,2) DEFAULT 0,
    shipping_amount numeric(15,2) DEFAULT 0,
    adjustment numeric(15,2) DEFAULT 0,
    total numeric(15,2) DEFAULT 0,
    amount_paid numeric(15,2) DEFAULT 0,
    balance_due numeric(15,2) DEFAULT 0,
    currency text DEFAULT 'USD',

    -- Terms
    terms_and_conditions text,
    notes text,

    -- Billing/Shipping
    billing_address jsonb DEFAULT '{}',
    shipping_address jsonb DEFAULT '{}',

    -- Timestamps
    sent_at timestamptz,
    viewed_at timestamptz,

    -- Ownership
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Metadata
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION B: CREATE INVOICE LINE ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_invoice_line_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES public.crm_invoices(id) ON DELETE CASCADE,

    -- Product Link (optional)
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
-- SECTION C: CREATE PAYMENT RECORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_invoice_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL REFERENCES public.crm_invoices(id) ON DELETE CASCADE,

    -- Payment Details
    amount numeric(15,2) NOT NULL,
    payment_date date NOT NULL DEFAULT CURRENT_DATE,
    payment_method text CHECK (payment_method IN ('cash', 'check', 'credit_card', 'bank_transfer', 'paypal', 'other')),
    reference_number text,
    notes text,

    -- Metadata
    recorded_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION D: INVOICE NUMBER SEQUENCE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_org_id uuid)
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
    FROM public.crm_invoices
    WHERE org_id = p_org_id
    AND created_at >= date_trunc('year', now());

    RETURN 'INV-' || v_year || '-' || LPAD(v_count::text, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := public.generate_invoice_number(NEW.org_id);
    END IF;
    -- Initialize balance_due
    NEW.balance_due := NEW.total - COALESCE(NEW.amount_paid, 0);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_invoice_number ON public.crm_invoices;
CREATE TRIGGER trigger_invoice_number
    BEFORE INSERT ON public.crm_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_invoice_number();

-- ============================================================================
-- SECTION E: INDEXES
-- ============================================================================

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_crm_invoices_org_id
    ON public.crm_invoices (org_id);

CREATE INDEX IF NOT EXISTS idx_crm_invoices_deal_id
    ON public.crm_invoices (deal_id);

CREATE INDEX IF NOT EXISTS idx_crm_invoices_account_id
    ON public.crm_invoices (account_id);

CREATE INDEX IF NOT EXISTS idx_crm_invoices_contact_id
    ON public.crm_invoices (contact_id);

CREATE INDEX IF NOT EXISTS idx_crm_invoices_quote_id
    ON public.crm_invoices (quote_id);

CREATE INDEX IF NOT EXISTS idx_crm_invoices_status
    ON public.crm_invoices (status);

CREATE INDEX IF NOT EXISTS idx_crm_invoices_due_date
    ON public.crm_invoices (due_date);

CREATE INDEX IF NOT EXISTS idx_crm_invoices_invoice_number
    ON public.crm_invoices (invoice_number);

CREATE INDEX IF NOT EXISTS idx_crm_invoices_created_at
    ON public.crm_invoices (created_at DESC);

-- Line items indexes
CREATE INDEX IF NOT EXISTS idx_crm_invoice_line_items_invoice
    ON public.crm_invoice_line_items (invoice_id);

CREATE INDEX IF NOT EXISTS idx_crm_invoice_line_items_product
    ON public.crm_invoice_line_items (product_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_crm_invoice_payments_invoice
    ON public.crm_invoice_payments (invoice_id);

CREATE INDEX IF NOT EXISTS idx_crm_invoice_payments_date
    ON public.crm_invoice_payments (payment_date);

-- ============================================================================
-- SECTION F: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.crm_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_invoice_payments ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "crm_invoices_select"
    ON public.crm_invoices
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(org_id)
    );

CREATE POLICY "crm_invoices_insert"
    ON public.crm_invoices
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_org_permission(org_id, 'invoices.write')
    );

CREATE POLICY "crm_invoices_update"
    ON public.crm_invoices
    FOR UPDATE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'invoices.write')
    )
    WITH CHECK (
        public.has_org_permission(org_id, 'invoices.write')
    );

CREATE POLICY "crm_invoices_delete"
    ON public.crm_invoices
    FOR DELETE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'invoices.write')
        AND status = 'draft'  -- Can only delete drafts
    );

-- Line items policies
CREATE POLICY "crm_invoice_line_items_select"
    ON public.crm_invoice_line_items
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_invoices i
            WHERE i.id = invoice_id
            AND public.is_org_member(i.org_id)
        )
    );

CREATE POLICY "crm_invoice_line_items_insert"
    ON public.crm_invoice_line_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_invoices i
            WHERE i.id = invoice_id
            AND public.has_org_permission(i.org_id, 'invoices.write')
        )
    );

CREATE POLICY "crm_invoice_line_items_update"
    ON public.crm_invoice_line_items
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_invoices i
            WHERE i.id = invoice_id
            AND public.has_org_permission(i.org_id, 'invoices.write')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_invoices i
            WHERE i.id = invoice_id
            AND public.has_org_permission(i.org_id, 'invoices.write')
        )
    );

CREATE POLICY "crm_invoice_line_items_delete"
    ON public.crm_invoice_line_items
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_invoices i
            WHERE i.id = invoice_id
            AND public.has_org_permission(i.org_id, 'invoices.write')
            AND i.status = 'draft'
        )
    );

-- Payments policies
CREATE POLICY "crm_invoice_payments_select"
    ON public.crm_invoice_payments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_invoices i
            WHERE i.id = invoice_id
            AND public.is_org_member(i.org_id)
        )
    );

CREATE POLICY "crm_invoice_payments_insert"
    ON public.crm_invoice_payments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_invoices i
            WHERE i.id = invoice_id
            AND public.has_org_permission(i.org_id, 'invoices.write')
        )
    );

-- ============================================================================
-- SECTION G: INVOICE TOTALS CALCULATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_invoice_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invoice_id uuid;
    v_subtotal numeric(15,2);
    v_tax_amount numeric(15,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    SELECT
        COALESCE(SUM(line_total - tax_amount), 0),
        COALESCE(SUM(tax_amount), 0)
    INTO v_subtotal, v_tax_amount
    FROM public.crm_invoice_line_items
    WHERE invoice_id = v_invoice_id;

    UPDATE public.crm_invoices
    SET
        subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        total = v_subtotal + v_tax_amount + COALESCE(shipping_amount, 0) + COALESCE(adjustment, 0) - COALESCE(discount_amount, 0),
        balance_due = v_subtotal + v_tax_amount + COALESCE(shipping_amount, 0) + COALESCE(adjustment, 0) - COALESCE(discount_amount, 0) - COALESCE(amount_paid, 0),
        updated_at = now()
    WHERE id = v_invoice_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trigger_recalculate_invoice_totals ON public.crm_invoice_line_items;
CREATE TRIGGER trigger_recalculate_invoice_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.crm_invoice_line_items
    FOR EACH ROW
    EXECUTE FUNCTION public.recalculate_invoice_totals();

-- ============================================================================
-- SECTION H: PAYMENT RECORDING TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_invoice_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_paid numeric(15,2);
    v_invoice_total numeric(15,2);
BEGIN
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM public.crm_invoice_payments
    WHERE invoice_id = NEW.invoice_id;

    -- Get invoice total
    SELECT total INTO v_invoice_total
    FROM public.crm_invoices
    WHERE id = NEW.invoice_id;

    -- Update invoice
    UPDATE public.crm_invoices
    SET
        amount_paid = v_total_paid,
        balance_due = v_invoice_total - v_total_paid,
        status = CASE
            WHEN v_total_paid >= v_invoice_total THEN 'paid'
            WHEN v_total_paid > 0 THEN 'partial'
            ELSE status
        END,
        paid_date = CASE
            WHEN v_total_paid >= v_invoice_total THEN CURRENT_DATE
            ELSE paid_date
        END,
        updated_at = now()
    WHERE id = NEW.invoice_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_invoice_payment ON public.crm_invoice_payments;
CREATE TRIGGER trigger_invoice_payment
    AFTER INSERT ON public.crm_invoice_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_invoice_payment();

-- ============================================================================
-- SECTION I: UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_crm_invoices_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    NEW.balance_due = NEW.total - COALESCE(NEW.amount_paid, 0);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_crm_invoices_updated_at ON public.crm_invoices;
CREATE TRIGGER trigger_crm_invoices_updated_at
    BEFORE UPDATE ON public.crm_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_invoices_updated_at();

CREATE OR REPLACE FUNCTION public.handle_crm_invoice_line_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_crm_invoice_line_items_updated_at ON public.crm_invoice_line_items;
CREATE TRIGGER trigger_crm_invoice_line_items_updated_at
    BEFORE UPDATE ON public.crm_invoice_line_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_invoice_line_items_updated_at();

COMMIT;

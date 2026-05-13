-- ============================================================================
-- Migration: CRM Junction Tables
-- Description: Many-to-many relationships and unified activities
-- ============================================================================

BEGIN;
-- ============================================================================
-- SECTION A: DEAL-CONTACT JUNCTION (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_deal_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE,
    contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,

    -- Contact Role in Deal
    role text CHECK (role IN ('decision_maker', 'influencer', 'technical_buyer', 'economic_buyer', 'champion', 'blocker', 'user', 'other')),
    is_primary boolean DEFAULT false,

    -- Metadata
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Unique contact per deal
    UNIQUE(deal_id, contact_id)
);
-- ============================================================================
-- SECTION B: DEAL-PRODUCT JUNCTION (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_deal_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.crm_products(id) ON DELETE CASCADE,

    -- Pricing
    quantity numeric(10,2) DEFAULT 1,
    unit_price numeric(15,2),
    discount_percent numeric(5,2) DEFAULT 0,
    total numeric(15,2),

    -- Metadata
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Unique product per deal
    UNIQUE(deal_id, product_id)
);
-- ============================================================================
-- SECTION C: UNIFIED CRM ACTIVITIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

    -- Activity Type
    activity_type text NOT NULL
        CHECK (activity_type IN ('call', 'email', 'meeting', 'task', 'note', 'sms', 'social', 'webinar', 'demo', 'other')),

    -- Activity Info
    subject text NOT NULL,
    description text,

    -- Timing
    scheduled_at timestamptz,
    due_at timestamptz,
    duration_minutes integer,
    completed_at timestamptz,

    -- Status
    status text DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'deferred')),
    priority text DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Call-specific
    call_type text CHECK (call_type IN ('outbound', 'inbound', 'missed')),
    call_outcome text CHECK (call_outcome IN ('answered', 'no_answer', 'busy', 'voicemail', 'wrong_number', 'callback_requested')),
    call_duration_seconds integer,

    -- Email-specific
    email_status text CHECK (email_status IN ('draft', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),

    -- Meeting-specific
    location text,
    meeting_link text,

    -- Polymorphic Links (can link to multiple entities)
    account_id uuid REFERENCES public.crm_accounts(id) ON DELETE CASCADE,
    contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    deal_id uuid REFERENCES public.crm_deals(id) ON DELETE CASCADE,
    lead_id uuid,  -- References zoho_lead_submissions

    -- Related To (free-form for flexibility)
    related_to_type text,
    related_to_id uuid,

    -- Ownership
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Reminder
    reminder_at timestamptz,
    reminder_sent boolean DEFAULT false,

    -- Metadata
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- ============================================================================
-- SECTION D: INDEXES
-- ============================================================================

-- Deal contacts indexes
CREATE INDEX IF NOT EXISTS idx_crm_deal_contacts_deal
    ON public.crm_deal_contacts (deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_deal_contacts_contact
    ON public.crm_deal_contacts (contact_id);
-- Deal products indexes
CREATE INDEX IF NOT EXISTS idx_crm_deal_products_deal
    ON public.crm_deal_products (deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_deal_products_product
    ON public.crm_deal_products (product_id);
-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_crm_activities_org_id
    ON public.crm_activities (org_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type
    ON public.crm_activities (activity_type);
CREATE INDEX IF NOT EXISTS idx_crm_activities_status
    ON public.crm_activities (status);
CREATE INDEX IF NOT EXISTS idx_crm_activities_account
    ON public.crm_activities (account_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact
    ON public.crm_activities (contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal
    ON public.crm_activities (deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_lead
    ON public.crm_activities (lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_owner
    ON public.crm_activities (owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_assigned
    ON public.crm_activities (assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_activities_due
    ON public.crm_activities (due_at)
    WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_crm_activities_scheduled
    ON public.crm_activities (scheduled_at)
    WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_crm_activities_created
    ON public.crm_activities (created_at DESC);
-- ============================================================================
-- SECTION E: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.crm_deal_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deal_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
-- Deal contacts policies
CREATE POLICY "crm_deal_contacts_select"
    ON public.crm_deal_contacts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_deals d
            WHERE d.id = deal_id
            AND public.is_org_member(d.org_id)
        )
    );
CREATE POLICY "crm_deal_contacts_insert"
    ON public.crm_deal_contacts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_deals d
            WHERE d.id = deal_id
            AND public.has_org_permission(d.org_id, 'deals.write')
        )
    );
CREATE POLICY "crm_deal_contacts_update"
    ON public.crm_deal_contacts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_deals d
            WHERE d.id = deal_id
            AND public.has_org_permission(d.org_id, 'deals.write')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_deals d
            WHERE d.id = deal_id
            AND public.has_org_permission(d.org_id, 'deals.write')
        )
    );
CREATE POLICY "crm_deal_contacts_delete"
    ON public.crm_deal_contacts
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_deals d
            WHERE d.id = deal_id
            AND public.has_org_permission(d.org_id, 'deals.write')
        )
    );
-- Deal products policies
CREATE POLICY "crm_deal_products_select"
    ON public.crm_deal_products
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_deals d
            WHERE d.id = deal_id
            AND public.is_org_member(d.org_id)
        )
    );
CREATE POLICY "crm_deal_products_insert"
    ON public.crm_deal_products
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_deals d
            WHERE d.id = deal_id
            AND public.has_org_permission(d.org_id, 'deals.write')
        )
    );
CREATE POLICY "crm_deal_products_update"
    ON public.crm_deal_products
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_deals d
            WHERE d.id = deal_id
            AND public.has_org_permission(d.org_id, 'deals.write')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_deals d
            WHERE d.id = deal_id
            AND public.has_org_permission(d.org_id, 'deals.write')
        )
    );
CREATE POLICY "crm_deal_products_delete"
    ON public.crm_deal_products
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_deals d
            WHERE d.id = deal_id
            AND public.has_org_permission(d.org_id, 'deals.write')
        )
    );
-- Activities policies
CREATE POLICY "crm_activities_select"
    ON public.crm_activities
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(org_id)
    );
CREATE POLICY "crm_activities_insert"
    ON public.crm_activities
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_org_member(org_id)
    );
CREATE POLICY "crm_activities_update"
    ON public.crm_activities
    FOR UPDATE
    TO authenticated
    USING (
        public.is_org_member(org_id)
    )
    WITH CHECK (
        public.is_org_member(org_id)
    );
CREATE POLICY "crm_activities_delete"
    ON public.crm_activities
    FOR DELETE
    TO authenticated
    USING (
        public.is_org_member(org_id)
        AND (created_by = auth.uid() OR public.is_org_admin(org_id))
    );
-- ============================================================================
-- SECTION F: DEAL AMOUNT CALCULATION FROM PRODUCTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_deal_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deal_id uuid;
    v_total numeric(15,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_deal_id := OLD.deal_id;
    ELSE
        v_deal_id := NEW.deal_id;
    END IF;

    SELECT COALESCE(SUM(total), 0) INTO v_total
    FROM public.crm_deal_products
    WHERE deal_id = v_deal_id;

    -- Only update if there are products
    IF v_total > 0 THEN
        UPDATE public.crm_deals
        SET amount = v_total, updated_at = now()
        WHERE id = v_deal_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;
DROP TRIGGER IF EXISTS trigger_recalculate_deal_amount ON public.crm_deal_products;
CREATE TRIGGER trigger_recalculate_deal_amount
    AFTER INSERT OR UPDATE OR DELETE ON public.crm_deal_products
    FOR EACH ROW
    EXECUTE FUNCTION public.recalculate_deal_amount();
-- ============================================================================
-- SECTION G: UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_crm_deal_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    -- Calculate total
    NEW.total = NEW.quantity * NEW.unit_price * (1 - COALESCE(NEW.discount_percent, 0) / 100);
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_crm_deal_products_updated_at ON public.crm_deal_products;
CREATE TRIGGER trigger_crm_deal_products_updated_at
    BEFORE INSERT OR UPDATE ON public.crm_deal_products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_deal_products_updated_at();
CREATE OR REPLACE FUNCTION public.handle_crm_activities_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_crm_activities_updated_at ON public.crm_activities;
CREATE TRIGGER trigger_crm_activities_updated_at
    BEFORE UPDATE ON public.crm_activities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_activities_updated_at();
COMMIT;

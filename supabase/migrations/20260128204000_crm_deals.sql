-- ============================================================================
-- Migration: CRM Deals Table
-- Description: Sales opportunities linked to accounts and contacts
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION A: CREATE DEALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

    -- Deal Info
    name text NOT NULL,
    description text,

    -- Linked Entities
    account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
    contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,

    -- Financial
    amount numeric(15,2),
    currency text DEFAULT 'USD',

    -- Pipeline
    stage_id uuid NOT NULL REFERENCES public.crm_deal_stages(id),
    probability integer CHECK (probability >= 0 AND probability <= 100),

    -- Dates
    expected_close_date date,
    actual_close_date date,

    -- Classification
    deal_type text DEFAULT 'new_business'
        CHECK (deal_type IN ('new_business', 'existing_business', 'renewal')),
    lead_source text,
    next_step text,

    -- Ownership
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Outcome
    won_at timestamptz,
    lost_at timestamptz,
    lost_reason text,

    -- Classification
    tags text[] DEFAULT '{}',

    -- Campaign Link
    campaign_id uuid,  -- Will reference crm_campaigns once created

    -- Lead Conversion
    converted_from_lead_id uuid,

    -- Metadata
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION B: CREATE DEAL STAGE HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_deal_stage_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE,
    from_stage_id uuid REFERENCES public.crm_deal_stages(id),
    to_stage_id uuid NOT NULL REFERENCES public.crm_deal_stages(id),
    changed_by uuid REFERENCES auth.users(id),
    notes text,
    changed_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SECTION C: INDEXES
-- ============================================================================

-- Deals indexes
CREATE INDEX IF NOT EXISTS idx_crm_deals_org_id
    ON public.crm_deals (org_id);

CREATE INDEX IF NOT EXISTS idx_crm_deals_account_id
    ON public.crm_deals (account_id);

CREATE INDEX IF NOT EXISTS idx_crm_deals_contact_id
    ON public.crm_deals (contact_id);

CREATE INDEX IF NOT EXISTS idx_crm_deals_stage_id
    ON public.crm_deals (stage_id);

CREATE INDEX IF NOT EXISTS idx_crm_deals_owner_id
    ON public.crm_deals (owner_id);

CREATE INDEX IF NOT EXISTS idx_crm_deals_expected_close
    ON public.crm_deals (expected_close_date);

CREATE INDEX IF NOT EXISTS idx_crm_deals_amount
    ON public.crm_deals (amount DESC);

CREATE INDEX IF NOT EXISTS idx_crm_deals_tags
    ON public.crm_deals USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_crm_deals_created_at
    ON public.crm_deals (created_at DESC);

-- Stage history indexes
CREATE INDEX IF NOT EXISTS idx_crm_deal_stage_history_deal_id
    ON public.crm_deal_stage_history (deal_id);

CREATE INDEX IF NOT EXISTS idx_crm_deal_stage_history_changed_at
    ON public.crm_deal_stage_history (changed_at DESC);

-- ============================================================================
-- SECTION D: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deal_stage_history ENABLE ROW LEVEL SECURITY;

-- Deals policies
CREATE POLICY "crm_deals_select"
    ON public.crm_deals
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(org_id)
    );

CREATE POLICY "crm_deals_insert"
    ON public.crm_deals
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_org_permission(org_id, 'deals.write')
    );

CREATE POLICY "crm_deals_update"
    ON public.crm_deals
    FOR UPDATE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'deals.write')
    )
    WITH CHECK (
        public.has_org_permission(org_id, 'deals.write')
    );

CREATE POLICY "crm_deals_delete"
    ON public.crm_deals
    FOR DELETE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'deals.delete')
    );

-- Stage history policies (read via deal access)
CREATE POLICY "crm_deal_stage_history_select"
    ON public.crm_deal_stage_history
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_deals d
            WHERE d.id = deal_id
            AND public.is_org_member(d.org_id)
        )
    );

CREATE POLICY "crm_deal_stage_history_insert"
    ON public.crm_deal_stage_history
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_deals d
            WHERE d.id = deal_id
            AND public.has_org_permission(d.org_id, 'deals.write')
        )
    );

-- ============================================================================
-- SECTION E: STAGE CHANGE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_deal_stage_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only log if stage actually changed
    IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
        INSERT INTO public.crm_deal_stage_history (deal_id, from_stage_id, to_stage_id, changed_by)
        VALUES (NEW.id, OLD.stage_id, NEW.stage_id, auth.uid());

        -- Update timestamps for won/lost
        IF EXISTS (SELECT 1 FROM public.crm_deal_stages WHERE id = NEW.stage_id AND is_won_stage = true) THEN
            NEW.won_at = now();
            NEW.actual_close_date = CURRENT_DATE;
        ELSIF EXISTS (SELECT 1 FROM public.crm_deal_stages WHERE id = NEW.stage_id AND is_lost_stage = true) THEN
            NEW.lost_at = now();
            NEW.actual_close_date = CURRENT_DATE;
        END IF;
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_deal_stage_change ON public.crm_deals;
CREATE TRIGGER trigger_deal_stage_change
    BEFORE UPDATE ON public.crm_deals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_deal_stage_change();

-- ============================================================================
-- SECTION F: UPDATED_AT TRIGGER (for inserts)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_crm_deals_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Log initial stage
    INSERT INTO public.crm_deal_stage_history (deal_id, from_stage_id, to_stage_id, changed_by)
    VALUES (NEW.id, NULL, NEW.stage_id, auth.uid());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_crm_deals_insert ON public.crm_deals;
CREATE TRIGGER trigger_crm_deals_insert
    AFTER INSERT ON public.crm_deals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_deals_insert();

COMMIT;

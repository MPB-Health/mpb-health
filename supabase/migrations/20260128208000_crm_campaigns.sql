-- ============================================================================
-- Migration: CRM Campaigns Tables
-- Description: Marketing campaigns with member tracking
-- ============================================================================

BEGIN;
-- ============================================================================
-- SECTION A: CREATE CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

    -- Campaign Info
    name text NOT NULL,
    description text,

    -- Type & Status
    type text NOT NULL DEFAULT 'other'
        CHECK (type IN ('email', 'webinar', 'conference', 'advertisement', 'referral', 'social', 'banner_ads', 'direct_mail', 'telemarketing', 'partners', 'other')),
    status text NOT NULL DEFAULT 'planning'
        CHECK (status IN ('planning', 'active', 'completed', 'cancelled', 'paused')),

    -- Dates
    start_date date,
    end_date date,

    -- Financials
    budget numeric(15,2),
    actual_cost numeric(15,2) DEFAULT 0,
    expected_revenue numeric(15,2),
    actual_revenue numeric(15,2) DEFAULT 0,

    -- Response Metrics
    num_sent integer DEFAULT 0,
    expected_response integer,
    actual_response integer DEFAULT 0,

    -- Conversion Metrics
    leads_generated integer DEFAULT 0,
    deals_generated integer DEFAULT 0,
    deals_won integer DEFAULT 0,

    -- Parent Campaign (for hierarchical campaigns)
    parent_campaign_id uuid REFERENCES public.crm_campaigns(id) ON DELETE SET NULL,

    -- Ownership
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Metadata
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- ============================================================================
-- SECTION B: CREATE CAMPAIGN MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_campaign_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES public.crm_campaigns(id) ON DELETE CASCADE,

    -- Member (either contact or lead, not both)
    contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    lead_id uuid,  -- References zoho_lead_submissions

    -- Status
    status text NOT NULL DEFAULT 'sent'
        CHECK (status IN ('planned', 'sent', 'opened', 'clicked', 'responded', 'converted', 'unsubscribed', 'bounced')),

    -- Timestamps
    first_responded_at timestamptz,
    converted_at timestamptz,

    -- Campaign-specific data
    notes text,

    -- Metadata
    added_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Must have either contact or lead
    CONSTRAINT campaign_member_target CHECK (
        (contact_id IS NOT NULL AND lead_id IS NULL) OR
        (contact_id IS NULL AND lead_id IS NOT NULL)
    ),

    -- Unique member per campaign
    UNIQUE(campaign_id, contact_id),
    UNIQUE(campaign_id, lead_id)
);
-- ============================================================================
-- SECTION C: INDEXES
-- ============================================================================

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_org_id
    ON public.crm_campaigns (org_id);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_status
    ON public.crm_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_type
    ON public.crm_campaigns (type);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_start_date
    ON public.crm_campaigns (start_date);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_end_date
    ON public.crm_campaigns (end_date);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_owner_id
    ON public.crm_campaigns (owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_parent
    ON public.crm_campaigns (parent_campaign_id);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_created_at
    ON public.crm_campaigns (created_at DESC);
-- Campaign members indexes
CREATE INDEX IF NOT EXISTS idx_crm_campaign_members_campaign
    ON public.crm_campaign_members (campaign_id);
CREATE INDEX IF NOT EXISTS idx_crm_campaign_members_contact
    ON public.crm_campaign_members (contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_campaign_members_lead
    ON public.crm_campaign_members (lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_campaign_members_status
    ON public.crm_campaign_members (status);
-- ============================================================================
-- SECTION D: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_campaign_members ENABLE ROW LEVEL SECURITY;
-- Campaigns policies
CREATE POLICY "crm_campaigns_select"
    ON public.crm_campaigns
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(org_id)
    );
CREATE POLICY "crm_campaigns_insert"
    ON public.crm_campaigns
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_org_permission(org_id, 'campaigns.write')
    );
CREATE POLICY "crm_campaigns_update"
    ON public.crm_campaigns
    FOR UPDATE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'campaigns.write')
    )
    WITH CHECK (
        public.has_org_permission(org_id, 'campaigns.write')
    );
CREATE POLICY "crm_campaigns_delete"
    ON public.crm_campaigns
    FOR DELETE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'campaigns.write')
        AND status IN ('planning', 'cancelled')  -- Can only delete planning/cancelled
    );
-- Campaign members policies
CREATE POLICY "crm_campaign_members_select"
    ON public.crm_campaign_members
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_campaigns c
            WHERE c.id = campaign_id
            AND public.is_org_member(c.org_id)
        )
    );
CREATE POLICY "crm_campaign_members_insert"
    ON public.crm_campaign_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_campaigns c
            WHERE c.id = campaign_id
            AND public.has_org_permission(c.org_id, 'campaigns.write')
        )
    );
CREATE POLICY "crm_campaign_members_update"
    ON public.crm_campaign_members
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_campaigns c
            WHERE c.id = campaign_id
            AND public.has_org_permission(c.org_id, 'campaigns.write')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_campaigns c
            WHERE c.id = campaign_id
            AND public.has_org_permission(c.org_id, 'campaigns.write')
        )
    );
CREATE POLICY "crm_campaign_members_delete"
    ON public.crm_campaign_members
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_campaigns c
            WHERE c.id = campaign_id
            AND public.has_org_permission(c.org_id, 'campaigns.write')
        )
    );
-- ============================================================================
-- SECTION E: CAMPAIGN STATS TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_campaign_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_campaign_id uuid;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_campaign_id := OLD.campaign_id;
    ELSE
        v_campaign_id := NEW.campaign_id;
    END IF;

    -- Update campaign response metrics
    UPDATE public.crm_campaigns
    SET
        num_sent = (SELECT COUNT(*) FROM public.crm_campaign_members WHERE campaign_id = v_campaign_id AND status != 'planned'),
        actual_response = (SELECT COUNT(*) FROM public.crm_campaign_members WHERE campaign_id = v_campaign_id AND status IN ('responded', 'converted')),
        updated_at = now()
    WHERE id = v_campaign_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;
DROP TRIGGER IF EXISTS trigger_update_campaign_stats ON public.crm_campaign_members;
CREATE TRIGGER trigger_update_campaign_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.crm_campaign_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_campaign_stats();
-- ============================================================================
-- SECTION F: UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_crm_campaigns_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_crm_campaigns_updated_at ON public.crm_campaigns;
CREATE TRIGGER trigger_crm_campaigns_updated_at
    BEFORE UPDATE ON public.crm_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_campaigns_updated_at();
COMMIT;

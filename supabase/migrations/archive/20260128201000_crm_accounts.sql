-- ============================================================================
-- Migration: CRM Accounts Table
-- Description: Companies/Organizations that are prospects, customers, partners, or vendors
-- ============================================================================

BEGIN;
-- ============================================================================
-- SECTION A: CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

    -- Basic Info
    name text NOT NULL,
    industry text,
    website text,
    phone text,
    fax text,

    -- Addresses (JSONB for flexibility)
    address jsonb DEFAULT '{}',           -- {street, city, state, zip, country}
    billing_address jsonb DEFAULT '{}',
    shipping_address jsonb DEFAULT '{}',

    -- Business Details
    annual_revenue numeric(15,2),
    employee_count integer,
    account_type text NOT NULL DEFAULT 'prospect'
        CHECK (account_type IN ('prospect', 'customer', 'partner', 'vendor', 'other')),
    rating text CHECK (rating IN ('hot', 'warm', 'cold')),

    -- Hierarchy & Ownership
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    parent_account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,

    -- Classification
    tags text[] DEFAULT '{}',
    description text,

    -- Social/External
    linkedin_url text,
    twitter_handle text,

    -- Metadata
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- ============================================================================
-- SECTION B: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_crm_accounts_org_id
    ON public.crm_accounts (org_id);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_owner_id
    ON public.crm_accounts (owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_account_type
    ON public.crm_accounts (account_type);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_parent_id
    ON public.crm_accounts (parent_account_id);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_name
    ON public.crm_accounts (name);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_tags
    ON public.crm_accounts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_created_at
    ON public.crm_accounts (created_at DESC);
-- ============================================================================
-- SECTION C: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.crm_accounts ENABLE ROW LEVEL SECURITY;
-- SELECT: org members with accounts.read permission
CREATE POLICY "crm_accounts_select"
    ON public.crm_accounts
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(org_id)
    );
-- INSERT: org members with accounts.write permission
CREATE POLICY "crm_accounts_insert"
    ON public.crm_accounts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_org_permission(org_id, 'accounts.write')
    );
-- UPDATE: org members with accounts.write permission
CREATE POLICY "crm_accounts_update"
    ON public.crm_accounts
    FOR UPDATE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'accounts.write')
    )
    WITH CHECK (
        public.has_org_permission(org_id, 'accounts.write')
    );
-- DELETE: org members with accounts.delete permission
CREATE POLICY "crm_accounts_delete"
    ON public.crm_accounts
    FOR DELETE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'accounts.delete')
    );
-- ============================================================================
-- SECTION D: UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_crm_accounts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_crm_accounts_updated_at ON public.crm_accounts;
CREATE TRIGGER trigger_crm_accounts_updated_at
    BEFORE UPDATE ON public.crm_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_accounts_updated_at();
COMMIT;

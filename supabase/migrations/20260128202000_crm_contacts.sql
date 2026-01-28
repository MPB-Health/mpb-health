-- ============================================================================
-- Migration: CRM Contacts Table
-- Description: People/individuals linked to accounts, separate from leads
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION A: CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

    -- Account Link
    account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,

    -- Name
    salutation text CHECK (salutation IN ('Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.')),
    first_name text NOT NULL,
    last_name text NOT NULL,

    -- Contact Info
    email text,
    phone text,
    mobile text,
    fax text,

    -- Work Info
    title text,
    department text,
    reports_to uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,

    -- Address
    mailing_address jsonb DEFAULT '{}',
    other_address jsonb DEFAULT '{}',

    -- Lead Conversion Tracking
    lead_source text,
    converted_from_lead_id uuid,  -- References zoho_lead_submissions if converted
    converted_at timestamptz,

    -- Communication Preferences
    do_not_call boolean DEFAULT false,
    do_not_email boolean DEFAULT false,
    email_opt_out boolean DEFAULT false,

    -- Ownership
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Classification
    tags text[] DEFAULT '{}',
    description text,

    -- Social/External
    linkedin_url text,
    twitter_handle text,

    -- Dates
    date_of_birth date,

    -- Metadata
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION B: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_crm_contacts_org_id
    ON public.crm_contacts (org_id);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_account_id
    ON public.crm_contacts (account_id);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_owner_id
    ON public.crm_contacts (owner_id);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_email
    ON public.crm_contacts (email);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_name
    ON public.crm_contacts ((first_name || ' ' || last_name));

CREATE INDEX IF NOT EXISTS idx_crm_contacts_tags
    ON public.crm_contacts USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_converted_from_lead
    ON public.crm_contacts (converted_from_lead_id);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_created_at
    ON public.crm_contacts (created_at DESC);

-- ============================================================================
-- SECTION C: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

-- SELECT: org members
CREATE POLICY "crm_contacts_select"
    ON public.crm_contacts
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(org_id)
    );

-- INSERT: org members with contacts.write permission
CREATE POLICY "crm_contacts_insert"
    ON public.crm_contacts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_org_permission(org_id, 'contacts.write')
    );

-- UPDATE: org members with contacts.write permission
CREATE POLICY "crm_contacts_update"
    ON public.crm_contacts
    FOR UPDATE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'contacts.write')
    )
    WITH CHECK (
        public.has_org_permission(org_id, 'contacts.write')
    );

-- DELETE: org members with contacts.delete permission
CREATE POLICY "crm_contacts_delete"
    ON public.crm_contacts
    FOR DELETE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'contacts.delete')
    );

-- ============================================================================
-- SECTION D: UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_crm_contacts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_crm_contacts_updated_at ON public.crm_contacts;
CREATE TRIGGER trigger_crm_contacts_updated_at
    BEFORE UPDATE ON public.crm_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_contacts_updated_at();

COMMIT;

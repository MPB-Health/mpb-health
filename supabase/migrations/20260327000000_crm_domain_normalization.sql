-- ============================================================================
-- Migration: CRM Domain Normalization
-- Description: Adds family-aware contacts, insurance carriers, plan-type
--              separation, phone number attribution, commission tracking,
--              and advisor-centric ownership to the MPB CRM platform.
--
-- Safe to apply on production: all DDL uses IF NOT EXISTS / IF EXISTS guards.
-- No data is deleted; columns are added with nullable defaults.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION A: INSURANCE CARRIERS REFERENCE TABLE
-- Admin-managed lookup for carrier dropdowns, reporting, competitive tracking.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.insurance_carriers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
    name text NOT NULL,
    slug text NOT NULL,
    carrier_type text NOT NULL DEFAULT 'traditional',
    is_active boolean NOT NULL DEFAULT true,
    logo_url text,
    website_url text,
    phone text,
    notes text,
    sort_order integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT insurance_carriers_type_check CHECK (
        carrier_type = ANY (ARRAY['traditional', 'healthshare', 'supplemental', 'dental', 'vision', 'life', 'other'])
    ),
    CONSTRAINT insurance_carriers_org_name_unique UNIQUE (org_id, name)
);

COMMENT ON TABLE public.insurance_carriers IS 'Admin-managed reference table of insurance carriers and healthshare organizations';

CREATE INDEX IF NOT EXISTS idx_insurance_carriers_org_active
    ON public.insurance_carriers(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_insurance_carriers_type
    ON public.insurance_carriers(carrier_type);
CREATE INDEX IF NOT EXISTS idx_insurance_carriers_slug
    ON public.insurance_carriers(slug);

-- ============================================================================
-- SECTION B: CRM FAMILY MEMBERS TABLE
-- Links family members (spouse, dependents) to leads and contacts.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_family_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES public.zoho_lead_submissions(id) ON DELETE CASCADE,
    contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    relationship text NOT NULL,
    date_of_birth date,
    gender text,
    email text,
    is_covered boolean DEFAULT false,
    coverage_start_date date,
    coverage_end_date date,
    ssn_last_four text,
    tobacco_user boolean DEFAULT false,
    notes text,
    sort_order integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT crm_family_members_relationship_check CHECK (
        relationship = ANY (ARRAY[
            'spouse', 'child', 'stepchild', 'domestic_partner',
            'foster_child', 'ward', 'parent', 'other'
        ])
    ),
    CONSTRAINT crm_family_members_gender_check CHECK (
        gender IS NULL OR gender = ANY (ARRAY['male', 'female', 'other'])
    ),
    CONSTRAINT crm_family_members_parent_check CHECK (
        lead_id IS NOT NULL OR contact_id IS NOT NULL
    )
);

COMMENT ON TABLE public.crm_family_members IS 'Family members linked to CRM leads and contacts for family-aware workflows';

CREATE INDEX IF NOT EXISTS idx_crm_family_members_lead ON public.crm_family_members(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_family_members_contact ON public.crm_family_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_family_members_org ON public.crm_family_members(org_id);

-- ============================================================================
-- SECTION C: CRM PHONE NUMBERS TABLE
-- Normalized phone numbers with type, ownership, and family attribution.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_phone_numbers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    owner_type text NOT NULL,
    owner_id uuid NOT NULL,
    phone_number text NOT NULL,
    phone_type text NOT NULL DEFAULT 'mobile',
    is_primary boolean NOT NULL DEFAULT false,
    label text,
    do_not_call boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT crm_phone_numbers_owner_type_check CHECK (
        owner_type = ANY (ARRAY['lead', 'contact', 'family_member'])
    ),
    CONSTRAINT crm_phone_numbers_type_check CHECK (
        phone_type = ANY (ARRAY['mobile', 'home', 'work', 'fax', 'other'])
    )
);

COMMENT ON TABLE public.crm_phone_numbers IS 'Normalized phone numbers with family-member attribution for CRM records';

CREATE INDEX IF NOT EXISTS idx_crm_phone_numbers_owner ON public.crm_phone_numbers(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_phone_numbers_org ON public.crm_phone_numbers(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_phone_numbers_number ON public.crm_phone_numbers(phone_number);

-- ============================================================================
-- SECTION D: COMMISSION TABLES
-- Schedules (rate configs), records (per-enrollment), payouts (disbursements).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.commission_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    name text NOT NULL,
    plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
    carrier_id uuid REFERENCES public.insurance_carriers(id) ON DELETE SET NULL,
    advisor_tier text,
    rate_type text NOT NULL DEFAULT 'percentage',
    rate_value numeric(10,4) NOT NULL,
    effective_from date NOT NULL,
    effective_to date,
    is_active boolean NOT NULL DEFAULT true,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT commission_schedules_tier_check CHECK (
        advisor_tier IS NULL OR advisor_tier = ANY (ARRAY[
            'producer', 'team_leader', 'director', 'regional_director', 'national_director'
        ])
    ),
    CONSTRAINT commission_schedules_rate_type_check CHECK (
        rate_type = ANY (ARRAY['percentage', 'flat', 'per_member'])
    )
);

CREATE TABLE IF NOT EXISTS public.commission_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    advisor_id uuid NOT NULL,
    schedule_id uuid REFERENCES public.commission_schedules(id) ON DELETE SET NULL,
    lead_id uuid REFERENCES public.zoho_lead_submissions(id) ON DELETE SET NULL,
    contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    carrier_id uuid REFERENCES public.insurance_carriers(id) ON DELETE SET NULL,
    plan_type text,
    premium_amount numeric(10,2),
    subsidy_amount numeric(10,2) DEFAULT 0,
    member_responsibility numeric(10,2),
    commission_rate numeric(10,4),
    commission_amount numeric(10,2) NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    period_start date,
    period_end date,
    paid_at timestamptz,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT commission_records_status_check CHECK (
        status = ANY (ARRAY['pending', 'earned', 'approved', 'paid', 'clawed_back', 'disputed'])
    ),
    CONSTRAINT commission_records_plan_type_check CHECK (
        plan_type IS NULL OR plan_type = ANY (ARRAY['healthshare', 'traditional_insurance'])
    )
);

CREATE TABLE IF NOT EXISTS public.commission_payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    advisor_id uuid NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    record_count integer NOT NULL DEFAULT 0,
    payout_date date NOT NULL,
    payment_method text,
    reference_number text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.commission_schedules IS 'Commission rate configurations per plan, carrier, and advisor tier';
COMMENT ON TABLE public.commission_records IS 'Individual commission records per enrollment/sale';
COMMENT ON TABLE public.commission_payouts IS 'Aggregated commission disbursements to advisors';

CREATE INDEX IF NOT EXISTS idx_commission_schedules_org ON public.commission_schedules(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_commission_schedules_plan ON public.commission_schedules(plan_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_advisor ON public.commission_records(advisor_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_org ON public.commission_records(org_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_status ON public.commission_records(status);
CREATE INDEX IF NOT EXISTS idx_commission_records_lead ON public.commission_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_contact ON public.commission_records(contact_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_period ON public.commission_records(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_advisor ON public.commission_payouts(advisor_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_org ON public.commission_payouts(org_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_date ON public.commission_payouts(payout_date);

-- ============================================================================
-- SECTION E: COLUMN ADDITIONS TO zoho_lead_submissions (leads)
-- ============================================================================

ALTER TABLE public.zoho_lead_submissions
    ADD COLUMN IF NOT EXISTS plan_type text,
    ADD COLUMN IF NOT EXISTS carrier_id uuid,
    ADD COLUMN IF NOT EXISTS tobacco_status text,
    ADD COLUMN IF NOT EXISTS group_type text,
    ADD COLUMN IF NOT EXISTS original_effective_date date,
    ADD COLUMN IF NOT EXISTS premium_amount numeric(10,2),
    ADD COLUMN IF NOT EXISTS subsidy_amount numeric(10,2),
    ADD COLUMN IF NOT EXISTS member_responsibility numeric(10,2),
    ADD COLUMN IF NOT EXISTS state text,
    ADD COLUMN IF NOT EXISTS city text;

-- FK for carrier on leads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'zoho_lead_submissions_carrier_id_fkey'
    ) THEN
        ALTER TABLE public.zoho_lead_submissions
            ADD CONSTRAINT zoho_lead_submissions_carrier_id_fkey
            FOREIGN KEY (carrier_id) REFERENCES public.insurance_carriers(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- Constraints
ALTER TABLE public.zoho_lead_submissions
    DROP CONSTRAINT IF EXISTS zoho_lead_submissions_plan_type_check;
ALTER TABLE public.zoho_lead_submissions
    ADD CONSTRAINT zoho_lead_submissions_plan_type_check CHECK (
        plan_type IS NULL OR plan_type = ANY (ARRAY['healthshare', 'traditional_insurance'])
    );

ALTER TABLE public.zoho_lead_submissions
    DROP CONSTRAINT IF EXISTS zoho_lead_submissions_tobacco_status_check;
ALTER TABLE public.zoho_lead_submissions
    ADD CONSTRAINT zoho_lead_submissions_tobacco_status_check CHECK (
        tobacco_status IS NULL OR tobacco_status = ANY (ARRAY['none', 'tobacco_user', 'vape_user', 'former_user'])
    );

ALTER TABLE public.zoho_lead_submissions
    DROP CONSTRAINT IF EXISTS zoho_lead_submissions_group_type_check;
ALTER TABLE public.zoho_lead_submissions
    ADD CONSTRAINT zoho_lead_submissions_group_type_check CHECK (
        group_type IS NULL OR group_type = ANY (ARRAY['individual', 'small_group', 'large_group', 'association'])
    );

CREATE INDEX IF NOT EXISTS idx_leads_plan_type ON public.zoho_lead_submissions(plan_type);
CREATE INDEX IF NOT EXISTS idx_leads_carrier ON public.zoho_lead_submissions(carrier_id);
CREATE INDEX IF NOT EXISTS idx_leads_state ON public.zoho_lead_submissions(state);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON public.zoho_lead_submissions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_effective_date ON public.zoho_lead_submissions(original_effective_date);

-- ============================================================================
-- SECTION F: COLUMN ADDITIONS TO crm_contacts
-- ============================================================================

ALTER TABLE public.crm_contacts
    ADD COLUMN IF NOT EXISTS plan_type text,
    ADD COLUMN IF NOT EXISTS carrier_id uuid,
    ADD COLUMN IF NOT EXISTS original_effective_date date,
    ADD COLUMN IF NOT EXISTS premium_amount numeric(10,2),
    ADD COLUMN IF NOT EXISTS subsidy_amount numeric(10,2),
    ADD COLUMN IF NOT EXISTS member_responsibility numeric(10,2),
    ADD COLUMN IF NOT EXISTS tobacco_status text,
    ADD COLUMN IF NOT EXISTS state text,
    ADD COLUMN IF NOT EXISTS city text;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'crm_contacts_carrier_id_fkey'
    ) THEN
        ALTER TABLE public.crm_contacts
            ADD CONSTRAINT crm_contacts_carrier_id_fkey
            FOREIGN KEY (carrier_id) REFERENCES public.insurance_carriers(id)
            ON DELETE SET NULL;
    END IF;
END $$;

ALTER TABLE public.crm_contacts
    DROP CONSTRAINT IF EXISTS crm_contacts_plan_type_check;
ALTER TABLE public.crm_contacts
    ADD CONSTRAINT crm_contacts_plan_type_check CHECK (
        plan_type IS NULL OR plan_type = ANY (ARRAY['healthshare', 'traditional_insurance'])
    );

ALTER TABLE public.crm_contacts
    DROP CONSTRAINT IF EXISTS crm_contacts_tobacco_status_check;
ALTER TABLE public.crm_contacts
    ADD CONSTRAINT crm_contacts_tobacco_status_check CHECK (
        tobacco_status IS NULL OR tobacco_status = ANY (ARRAY['none', 'tobacco_user', 'vape_user', 'former_user'])
    );

CREATE INDEX IF NOT EXISTS idx_contacts_plan_type ON public.crm_contacts(plan_type);
CREATE INDEX IF NOT EXISTS idx_contacts_carrier ON public.crm_contacts(carrier_id);
CREATE INDEX IF NOT EXISTS idx_contacts_state ON public.crm_contacts(state);

-- ============================================================================
-- SECTION G: RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.insurance_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payouts ENABLE ROW LEVEL SECURITY;

-- Insurance Carriers: org members can read; write requires settings.manage
CREATE POLICY insurance_carriers_select ON public.insurance_carriers
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));

CREATE POLICY insurance_carriers_insert ON public.insurance_carriers
    FOR INSERT TO authenticated
    WITH CHECK (public.has_org_permission(org_id, 'settings.manage'));

CREATE POLICY insurance_carriers_update ON public.insurance_carriers
    FOR UPDATE TO authenticated
    USING (public.has_org_permission(org_id, 'settings.manage'))
    WITH CHECK (public.has_org_permission(org_id, 'settings.manage'));

CREATE POLICY insurance_carriers_delete ON public.insurance_carriers
    FOR DELETE TO authenticated
    USING (public.has_org_permission(org_id, 'settings.manage'));

-- Family Members: org members can read; contacts.write to modify
CREATE POLICY crm_family_members_select ON public.crm_family_members
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));

CREATE POLICY crm_family_members_insert ON public.crm_family_members
    FOR INSERT TO authenticated
    WITH CHECK (public.has_org_permission(org_id, 'contacts.write'));

CREATE POLICY crm_family_members_update ON public.crm_family_members
    FOR UPDATE TO authenticated
    USING (public.has_org_permission(org_id, 'contacts.write'))
    WITH CHECK (public.has_org_permission(org_id, 'contacts.write'));

CREATE POLICY crm_family_members_delete ON public.crm_family_members
    FOR DELETE TO authenticated
    USING (public.has_org_permission(org_id, 'contacts.delete'));

-- Phone Numbers: org members can read; contacts.write to modify
CREATE POLICY crm_phone_numbers_select ON public.crm_phone_numbers
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));

CREATE POLICY crm_phone_numbers_insert ON public.crm_phone_numbers
    FOR INSERT TO authenticated
    WITH CHECK (public.has_org_permission(org_id, 'contacts.write'));

CREATE POLICY crm_phone_numbers_update ON public.crm_phone_numbers
    FOR UPDATE TO authenticated
    USING (public.has_org_permission(org_id, 'contacts.write'))
    WITH CHECK (public.has_org_permission(org_id, 'contacts.write'));

CREATE POLICY crm_phone_numbers_delete ON public.crm_phone_numbers
    FOR DELETE TO authenticated
    USING (public.has_org_permission(org_id, 'contacts.delete'));

-- Commission Schedules: org members read; settings.manage to modify
CREATE POLICY commission_schedules_select ON public.commission_schedules
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));

CREATE POLICY commission_schedules_insert ON public.commission_schedules
    FOR INSERT TO authenticated
    WITH CHECK (public.has_org_permission(org_id, 'settings.manage'));

CREATE POLICY commission_schedules_update ON public.commission_schedules
    FOR UPDATE TO authenticated
    USING (public.has_org_permission(org_id, 'settings.manage'))
    WITH CHECK (public.has_org_permission(org_id, 'settings.manage'));

CREATE POLICY commission_schedules_delete ON public.commission_schedules
    FOR DELETE TO authenticated
    USING (public.has_org_permission(org_id, 'settings.manage'));

-- Commission Records: org members read; leads.write to modify
CREATE POLICY commission_records_select ON public.commission_records
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));

CREATE POLICY commission_records_insert ON public.commission_records
    FOR INSERT TO authenticated
    WITH CHECK (public.has_org_permission(org_id, 'leads.write'));

CREATE POLICY commission_records_update ON public.commission_records
    FOR UPDATE TO authenticated
    USING (public.has_org_permission(org_id, 'leads.write'))
    WITH CHECK (public.has_org_permission(org_id, 'leads.write'));

CREATE POLICY commission_records_delete ON public.commission_records
    FOR DELETE TO authenticated
    USING (public.has_org_permission(org_id, 'leads.delete'));

-- Commission Payouts: org members read; settings.manage to modify
CREATE POLICY commission_payouts_select ON public.commission_payouts
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));

CREATE POLICY commission_payouts_insert ON public.commission_payouts
    FOR INSERT TO authenticated
    WITH CHECK (public.has_org_permission(org_id, 'settings.manage'));

CREATE POLICY commission_payouts_update ON public.commission_payouts
    FOR UPDATE TO authenticated
    USING (public.has_org_permission(org_id, 'settings.manage'))
    WITH CHECK (public.has_org_permission(org_id, 'settings.manage'));

CREATE POLICY commission_payouts_delete ON public.commission_payouts
    FOR DELETE TO authenticated
    USING (public.has_org_permission(org_id, 'settings.manage'));

-- ============================================================================
-- SECTION H: SEARCH VECTOR FOR FAMILY MEMBERS
-- ============================================================================

ALTER TABLE public.crm_family_members
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_crm_family_members_search
    ON public.crm_family_members USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_crm_family_members_name_trgm
    ON public.crm_family_members USING gin(
        (first_name || ' ' || last_name) extensions.gin_trgm_ops
    );

CREATE OR REPLACE FUNCTION public.update_crm_family_members_search()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.first_name, '') || ' ' ||
        COALESCE(NEW.last_name, '') || ' ' ||
        COALESCE(NEW.email, '') || ' ' ||
        COALESCE(NEW.relationship, '')
    );
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_crm_family_members_search ON public.crm_family_members;
CREATE TRIGGER trigger_update_crm_family_members_search
    BEFORE INSERT OR UPDATE ON public.crm_family_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_crm_family_members_search();

-- ============================================================================
-- SECTION I: EXTENDED crm_global_search TO INCLUDE FAMILY MEMBERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crm_global_search(
    p_org_id uuid,
    p_query text,
    p_limit integer DEFAULT 50
)
RETURNS TABLE (
    entity_type text,
    entity_id uuid,
    title text,
    subtitle text,
    extra_info text,
    rank real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tsquery tsquery;
BEGIN
    v_tsquery := plainto_tsquery('english', p_query);

    RETURN QUERY

    -- Accounts
    SELECT
        'account'::text AS entity_type,
        a.id AS entity_id,
        a.name AS title,
        COALESCE(a.industry, 'No industry') AS subtitle,
        a.account_type AS extra_info,
        ts_rank(a.search_vector, v_tsquery) +
        CASE WHEN a.name ILIKE p_query || '%' THEN 0.5 ELSE 0 END AS rank
    FROM public.crm_accounts a
    WHERE a.org_id = p_org_id
    AND (
        a.search_vector @@ v_tsquery
        OR a.name ILIKE '%' || p_query || '%'
    )

    UNION ALL

    -- Contacts
    SELECT
        'contact'::text,
        c.id,
        c.first_name || ' ' || c.last_name,
        COALESCE(c.email, 'No email'),
        COALESCE(c.title, ''),
        ts_rank(c.search_vector, v_tsquery) +
        CASE WHEN (c.first_name || ' ' || c.last_name) ILIKE p_query || '%' THEN 0.5 ELSE 0 END
    FROM public.crm_contacts c
    WHERE c.org_id = p_org_id
    AND (
        c.search_vector @@ v_tsquery
        OR (c.first_name || ' ' || c.last_name) ILIKE '%' || p_query || '%'
        OR c.email ILIKE '%' || p_query || '%'
    )

    UNION ALL

    -- Deals
    SELECT
        'deal'::text,
        d.id,
        d.name,
        COALESCE('$' || d.amount::text, 'No amount'),
        COALESCE(ds.display_name, ''),
        ts_rank(d.search_vector, v_tsquery) +
        CASE WHEN d.name ILIKE p_query || '%' THEN 0.5 ELSE 0 END
    FROM public.crm_deals d
    LEFT JOIN public.crm_deal_stages ds ON ds.id = d.stage_id
    WHERE d.org_id = p_org_id
    AND (
        d.search_vector @@ v_tsquery
        OR d.name ILIKE '%' || p_query || '%'
    )

    UNION ALL

    -- Products
    SELECT
        'product'::text,
        p.id,
        p.name,
        COALESCE('$' || p.unit_price::text, 'No price'),
        COALESCE(p.category, ''),
        ts_rank(p.search_vector, v_tsquery) +
        CASE WHEN p.name ILIKE p_query || '%' THEN 0.5 ELSE 0 END
    FROM public.crm_products p
    WHERE p.org_id = p_org_id
    AND p.is_active = true
    AND (
        p.search_vector @@ v_tsquery
        OR p.name ILIKE '%' || p_query || '%'
        OR p.code ILIKE '%' || p_query || '%'
    )

    UNION ALL

    -- Leads
    SELECT
        'lead'::text,
        l.id,
        COALESCE(l.first_name || ' ' || l.last_name, l.email),
        COALESCE(l.email, 'No email'),
        COALESCE(l.pipeline_stage, 'new'),
        CASE
            WHEN (l.first_name || ' ' || l.last_name) ILIKE p_query || '%' THEN 1.0
            WHEN l.email ILIKE p_query || '%' THEN 0.8
            ELSE 0.5
        END
    FROM public.zoho_lead_submissions l
    WHERE l.org_id = p_org_id
    AND (
        (l.first_name || ' ' || l.last_name) ILIKE '%' || p_query || '%'
        OR l.email ILIKE '%' || p_query || '%'
        OR l.phone ILIKE '%' || p_query || '%'
    )

    UNION ALL

    -- Family Members (searches spouse/dependent names, returns parent lead or contact)
    SELECT
        CASE
            WHEN fm.lead_id IS NOT NULL THEN 'lead'
            ELSE 'contact'
        END::text,
        COALESCE(fm.lead_id, fm.contact_id),
        COALESCE(
            (SELECT fl.first_name || ' ' || fl.last_name FROM public.zoho_lead_submissions fl WHERE fl.id = fm.lead_id),
            (SELECT fc.first_name || ' ' || fc.last_name FROM public.crm_contacts fc WHERE fc.id = fm.contact_id)
        ),
        fm.first_name || ' ' || fm.last_name || ' (' || fm.relationship || ')',
        'Family match',
        CASE
            WHEN (fm.first_name || ' ' || fm.last_name) ILIKE p_query || '%' THEN 0.9
            ELSE 0.4
        END
    FROM public.crm_family_members fm
    WHERE fm.org_id = p_org_id
    AND (
        fm.search_vector @@ v_tsquery
        OR (fm.first_name || ' ' || fm.last_name) ILIKE '%' || p_query || '%'
    )

    ORDER BY rank DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_global_search(uuid, text, integer) TO authenticated;

-- ============================================================================
-- SECTION J: UPDATED TIMESTAMP TRIGGERS FOR NEW TABLES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_insurance_carriers_updated_at ON public.insurance_carriers;
CREATE TRIGGER trigger_insurance_carriers_updated_at
    BEFORE UPDATE ON public.insurance_carriers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_commission_schedules_updated_at ON public.commission_schedules;
CREATE TRIGGER trigger_commission_schedules_updated_at
    BEFORE UPDATE ON public.commission_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_commission_records_updated_at ON public.commission_records;
CREATE TRIGGER trigger_commission_records_updated_at
    BEFORE UPDATE ON public.commission_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

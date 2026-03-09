-- ============================================================================
-- Migration: CRM Global Search
-- Description: Full-text search across all CRM modules
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION A: ENABLE pg_trgm EXTENSION (in extensions schema per security best practice)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- ============================================================================
-- SECTION B: ADD SEARCH VECTORS TO TABLES
-- ============================================================================

-- Accounts search vector
ALTER TABLE public.crm_accounts
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Contacts search vector
ALTER TABLE public.crm_contacts
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Deals search vector
ALTER TABLE public.crm_deals
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Products search vector
ALTER TABLE public.crm_products
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- ============================================================================
-- SECTION C: SEARCH VECTOR INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_crm_accounts_search
    ON public.crm_accounts USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_search
    ON public.crm_contacts USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_crm_deals_search
    ON public.crm_deals USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_crm_products_search
    ON public.crm_products USING gin(search_vector);

-- Trigram indexes for fuzzy matching (pg_trgm in extensions schema)
CREATE INDEX IF NOT EXISTS idx_crm_accounts_name_trgm
    ON public.crm_accounts USING gin(name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_name_trgm
    ON public.crm_contacts USING gin((first_name || ' ' || last_name) extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_email_trgm
    ON public.crm_contacts USING gin(email extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_crm_deals_name_trgm
    ON public.crm_deals USING gin(name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_crm_products_name_trgm
    ON public.crm_products USING gin(name extensions.gin_trgm_ops);

-- ============================================================================
-- SECTION D: SEARCH VECTOR UPDATE FUNCTIONS
-- ============================================================================

-- Accounts search vector update
CREATE OR REPLACE FUNCTION public.update_crm_accounts_search()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.industry, '') || ' ' ||
        COALESCE(NEW.website, '') || ' ' ||
        COALESCE(NEW.phone, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_crm_accounts_search ON public.crm_accounts;
CREATE TRIGGER trigger_update_crm_accounts_search
    BEFORE INSERT OR UPDATE ON public.crm_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_crm_accounts_search();

-- Contacts search vector update
CREATE OR REPLACE FUNCTION public.update_crm_contacts_search()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.first_name, '') || ' ' ||
        COALESCE(NEW.last_name, '') || ' ' ||
        COALESCE(NEW.email, '') || ' ' ||
        COALESCE(NEW.phone, '') || ' ' ||
        COALESCE(NEW.mobile, '') || ' ' ||
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.department, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_crm_contacts_search ON public.crm_contacts;
CREATE TRIGGER trigger_update_crm_contacts_search
    BEFORE INSERT OR UPDATE ON public.crm_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_crm_contacts_search();

-- Deals search vector update
CREATE OR REPLACE FUNCTION public.update_crm_deals_search()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.next_step, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_crm_deals_search ON public.crm_deals;
CREATE TRIGGER trigger_update_crm_deals_search
    BEFORE INSERT OR UPDATE ON public.crm_deals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_crm_deals_search();

-- Products search vector update
CREATE OR REPLACE FUNCTION public.update_crm_products_search()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.code, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.category, '')
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_crm_products_search ON public.crm_products;
CREATE TRIGGER trigger_update_crm_products_search
    BEFORE INSERT OR UPDATE ON public.crm_products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_crm_products_search();

-- ============================================================================
-- SECTION E: GLOBAL SEARCH FUNCTION
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
    -- Create tsquery from search text
    v_tsquery := plainto_tsquery('english', p_query);

    RETURN QUERY
    -- Accounts
    SELECT
        'account'::text as entity_type,
        a.id as entity_id,
        a.name as title,
        COALESCE(a.industry, 'No industry') as subtitle,
        a.account_type as extra_info,
        ts_rank(a.search_vector, v_tsquery) +
        CASE WHEN a.name ILIKE p_query || '%' THEN 0.5 ELSE 0 END as rank
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

    -- Leads (from existing zoho_lead_submissions)
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

    ORDER BY rank DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crm_global_search(uuid, text, integer) TO authenticated;

-- ============================================================================
-- SECTION F: SEARCH WITHIN MODULE FUNCTIONS
-- ============================================================================

-- Search accounts
CREATE OR REPLACE FUNCTION public.search_crm_accounts(
    p_org_id uuid,
    p_query text,
    p_limit integer DEFAULT 20
)
RETURNS SETOF public.crm_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT a.*
    FROM public.crm_accounts a
    WHERE a.org_id = p_org_id
    AND (
        a.search_vector @@ plainto_tsquery('english', p_query)
        OR a.name ILIKE '%' || p_query || '%'
    )
    ORDER BY
        CASE WHEN a.name ILIKE p_query || '%' THEN 0 ELSE 1 END,
        ts_rank(a.search_vector, plainto_tsquery('english', p_query)) DESC,
        a.name
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_crm_accounts(uuid, text, integer) TO authenticated;

-- Search contacts
CREATE OR REPLACE FUNCTION public.search_crm_contacts(
    p_org_id uuid,
    p_query text,
    p_limit integer DEFAULT 20
)
RETURNS SETOF public.crm_contacts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT c.*
    FROM public.crm_contacts c
    WHERE c.org_id = p_org_id
    AND (
        c.search_vector @@ plainto_tsquery('english', p_query)
        OR (c.first_name || ' ' || c.last_name) ILIKE '%' || p_query || '%'
        OR c.email ILIKE '%' || p_query || '%'
    )
    ORDER BY
        CASE WHEN (c.first_name || ' ' || c.last_name) ILIKE p_query || '%' THEN 0 ELSE 1 END,
        ts_rank(c.search_vector, plainto_tsquery('english', p_query)) DESC,
        c.first_name, c.last_name
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_crm_contacts(uuid, text, integer) TO authenticated;

-- Search deals
CREATE OR REPLACE FUNCTION public.search_crm_deals(
    p_org_id uuid,
    p_query text,
    p_limit integer DEFAULT 20
)
RETURNS SETOF public.crm_deals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT d.*
    FROM public.crm_deals d
    WHERE d.org_id = p_org_id
    AND (
        d.search_vector @@ plainto_tsquery('english', p_query)
        OR d.name ILIKE '%' || p_query || '%'
    )
    ORDER BY
        CASE WHEN d.name ILIKE p_query || '%' THEN 0 ELSE 1 END,
        ts_rank(d.search_vector, plainto_tsquery('english', p_query)) DESC,
        d.name
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_crm_deals(uuid, text, integer) TO authenticated;

-- ============================================================================
-- SECTION G: BACKFILL EXISTING RECORDS (one-time)
-- ============================================================================

-- This will update search vectors for existing records
UPDATE public.crm_accounts SET name = name WHERE search_vector IS NULL;
UPDATE public.crm_contacts SET first_name = first_name WHERE search_vector IS NULL;
UPDATE public.crm_deals SET name = name WHERE search_vector IS NULL;
UPDATE public.crm_products SET name = name WHERE search_vector IS NULL;

COMMIT;

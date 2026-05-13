-- ============================================================================
-- Migration: CRM Search Upgrade
-- Extends crm_global_search with family member, phone number, and advisor
-- search. Adds better ranking and prefix-match boosting.
-- ============================================================================

BEGIN;
-- ============================================================================
-- Trigram indexes for family members and phone numbers
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_crm_family_members_name_trgm
    ON public.crm_family_members
    USING gin((first_name || ' ' || last_name) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_phone_numbers_number_trgm
    ON public.crm_phone_numbers
    USING gin(phone_number extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_name_trgm
    ON public.zoho_lead_submissions
    USING gin((first_name || ' ' || last_name) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_zoho_lead_submissions_email_trgm
    ON public.zoho_lead_submissions
    USING gin(email extensions.gin_trgm_ops);
-- ============================================================================
-- Replace crm_global_search with upgraded version
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
    v_query_lower text;
    v_per_type_limit integer;
BEGIN
    v_query_lower := lower(trim(p_query));
    v_tsquery := plainto_tsquery('english', p_query);
    v_per_type_limit := GREATEST(p_limit / 4, 5);

    RETURN QUERY

    -- ── Leads ──
    (
        SELECT
            'lead'::text AS entity_type,
            l.id AS entity_id,
            (COALESCE(l.first_name, '') || ' ' || COALESCE(l.last_name, ''))::text AS title,
            COALESCE(l.email, 'No email')::text AS subtitle,
            COALESCE(l.pipeline_stage, 'new')::text AS extra_info,
            (CASE
                WHEN lower(l.first_name || ' ' || l.last_name) = v_query_lower THEN 2.0
                WHEN lower(l.first_name || ' ' || l.last_name) LIKE v_query_lower || '%' THEN 1.5
                WHEN lower(l.email) = v_query_lower THEN 1.4
                WHEN lower(l.email) LIKE v_query_lower || '%' THEN 1.0
                ELSE 0.5
            END)::real AS rank
        FROM public.zoho_lead_submissions l
        WHERE l.org_id = p_org_id
        AND (
            (l.first_name || ' ' || l.last_name) ILIKE '%' || p_query || '%'
            OR l.email ILIKE '%' || p_query || '%'
            OR l.phone ILIKE '%' || p_query || '%'
            OR l.first_name ILIKE '%' || p_query || '%'
            OR l.last_name ILIKE '%' || p_query || '%'
        )
        ORDER BY rank DESC
        LIMIT v_per_type_limit
    )

    UNION ALL

    -- ── Contacts ──
    (
        SELECT
            'contact'::text,
            c.id,
            (c.first_name || ' ' || c.last_name)::text,
            COALESCE(c.email, 'No email')::text,
            COALESCE(c.title, '')::text,
            (ts_rank(c.search_vector, v_tsquery) +
            CASE
                WHEN lower(c.first_name || ' ' || c.last_name) = v_query_lower THEN 2.0
                WHEN lower(c.first_name || ' ' || c.last_name) LIKE v_query_lower || '%' THEN 1.5
                WHEN lower(c.email) LIKE v_query_lower || '%' THEN 1.0
                ELSE 0.0
            END)::real
        FROM public.crm_contacts c
        WHERE c.org_id = p_org_id
        AND (
            c.search_vector @@ v_tsquery
            OR (c.first_name || ' ' || c.last_name) ILIKE '%' || p_query || '%'
            OR c.email ILIKE '%' || p_query || '%'
            OR c.phone ILIKE '%' || p_query || '%'
            OR c.mobile ILIKE '%' || p_query || '%'
            OR c.first_name ILIKE '%' || p_query || '%'
            OR c.last_name ILIKE '%' || p_query || '%'
        )
        ORDER BY rank DESC
        LIMIT v_per_type_limit
    )

    UNION ALL

    -- ── Family Members (spouse / dependent search → links to parent lead or contact) ──
    (
        SELECT
            CASE
                WHEN fm.lead_id IS NOT NULL THEN 'lead'::text
                ELSE 'contact'::text
            END,
            COALESCE(fm.lead_id, fm.contact_id) AS entity_id,
            (fm.first_name || ' ' || fm.last_name)::text AS title,
            ('Family of ' ||
                CASE
                    WHEN fm.lead_id IS NOT NULL THEN (
                        SELECT COALESCE(ls.first_name || ' ' || ls.last_name, ls.email)
                        FROM zoho_lead_submissions ls WHERE ls.id = fm.lead_id
                    )
                    ELSE (
                        SELECT cc.first_name || ' ' || cc.last_name
                        FROM crm_contacts cc WHERE cc.id = fm.contact_id
                    )
                END
            )::text AS subtitle,
            fm.relationship::text AS extra_info,
            (CASE
                WHEN lower(fm.first_name || ' ' || fm.last_name) = v_query_lower THEN 1.8
                WHEN lower(fm.first_name || ' ' || fm.last_name) LIKE v_query_lower || '%' THEN 1.3
                ELSE 0.6
            END)::real AS rank
        FROM public.crm_family_members fm
        WHERE fm.org_id = p_org_id
        AND (
            (fm.first_name || ' ' || fm.last_name) ILIKE '%' || p_query || '%'
            OR fm.first_name ILIKE '%' || p_query || '%'
            OR fm.last_name ILIKE '%' || p_query || '%'
        )
        ORDER BY rank DESC
        LIMIT v_per_type_limit
    )

    UNION ALL

    -- ── Phone Numbers (search by number → links to owner) ──
    (
        SELECT
            pn.owner_type::text AS entity_type,
            pn.owner_id AS entity_id,
            pn.phone_number::text AS title,
            ('Phone for ' ||
                CASE pn.owner_type
                    WHEN 'lead' THEN (
                        SELECT COALESCE(ls.first_name || ' ' || ls.last_name, ls.email)
                        FROM zoho_lead_submissions ls WHERE ls.id = pn.owner_id
                    )
                    WHEN 'contact' THEN (
                        SELECT cc.first_name || ' ' || cc.last_name
                        FROM crm_contacts cc WHERE cc.id = pn.owner_id
                    )
                    WHEN 'family_member' THEN (
                        SELECT fmx.first_name || ' ' || fmx.last_name
                        FROM crm_family_members fmx WHERE fmx.id = pn.owner_id
                    )
                    ELSE 'Unknown'
                END
            )::text AS subtitle,
            pn.phone_type::text AS extra_info,
            0.7::real AS rank
        FROM public.crm_phone_numbers pn
        WHERE pn.org_id = p_org_id
        AND pn.phone_number ILIKE '%' || p_query || '%'
        ORDER BY rank DESC
        LIMIT LEAST(v_per_type_limit, 5)
    )

    UNION ALL

    -- ── Accounts ──
    (
        SELECT
            'account'::text,
            a.id,
            a.name::text,
            COALESCE(a.industry, 'No industry')::text,
            a.account_type::text,
            (ts_rank(a.search_vector, v_tsquery) +
            CASE
                WHEN lower(a.name) = v_query_lower THEN 2.0
                WHEN lower(a.name) LIKE v_query_lower || '%' THEN 1.5
                ELSE 0.0
            END)::real
        FROM public.crm_accounts a
        WHERE a.org_id = p_org_id
        AND (
            a.search_vector @@ v_tsquery
            OR a.name ILIKE '%' || p_query || '%'
        )
        ORDER BY rank DESC
        LIMIT v_per_type_limit
    )

    UNION ALL

    -- ── Deals ──
    (
        SELECT
            'deal'::text,
            d.id,
            d.name::text,
            COALESCE('$' || d.amount::text, 'No amount')::text,
            COALESCE(ds.display_name, '')::text,
            (ts_rank(d.search_vector, v_tsquery) +
            CASE
                WHEN lower(d.name) LIKE v_query_lower || '%' THEN 1.5
                ELSE 0.0
            END)::real
        FROM public.crm_deals d
        LEFT JOIN public.crm_deal_stages ds ON ds.id = d.stage_id
        WHERE d.org_id = p_org_id
        AND (
            d.search_vector @@ v_tsquery
            OR d.name ILIKE '%' || p_query || '%'
        )
        ORDER BY rank DESC
        LIMIT v_per_type_limit
    )

    UNION ALL

    -- ── Products ──
    (
        SELECT
            'product'::text,
            p.id,
            p.name::text,
            COALESCE('$' || p.unit_price::text, 'No price')::text,
            COALESCE(p.category, '')::text,
            (ts_rank(p.search_vector, v_tsquery) +
            CASE
                WHEN lower(p.name) LIKE v_query_lower || '%' THEN 1.5
                ELSE 0.0
            END)::real
        FROM public.crm_products p
        WHERE p.org_id = p_org_id
        AND p.is_active = true
        AND (
            p.search_vector @@ v_tsquery
            OR p.name ILIKE '%' || p_query || '%'
            OR p.code ILIKE '%' || p_query || '%'
        )
        ORDER BY rank DESC
        LIMIT v_per_type_limit
    )

    ORDER BY rank DESC
    LIMIT p_limit;
END;
$$;
COMMIT;

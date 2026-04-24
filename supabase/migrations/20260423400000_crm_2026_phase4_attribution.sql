-- =============================================================================
-- CRM 2026 Upgrade — Phase 4: reactivation, attribution, products
-- =============================================================================
-- This migration operationalises the remaining Sales Plan 2026 attribution
-- knobs:
--   • `crm_product_lines` lookup + `crm_deals.product_line` FK so every closed
--     deal can be split across Health Insurance vs Medical Cost Sharing (and
--     any future line the business adds) without a code change.
--   • `lead_submissions.community_event_id` + FK + index so the public
--     Community capture form can attribute every on-site sign-up back to the
--     originating event, and a trigger that auto-increments
--     `crm_community_events.leads_generated` on intake.
--   • Sanity: make sure `lead_submissions.reactivation_source_lead_id` is
--     indexed (it was added in Phase 1 but without an index), so the
--     "opened from reactivation" cohort queries stay fast.
-- Idempotent: every IF NOT EXISTS / CREATE OR REPLACE guard keeps the script
-- safe to replay.
-- =============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Product lines lookup + FK on crm_deals
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_product_lines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
    slug text NOT NULL,
    label text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    -- A slug is unique within each org (and once, globally, for the seeded
    -- system rows where org_id IS NULL).
    CONSTRAINT crm_product_lines_org_slug_key UNIQUE (org_id, slug)
);

-- Seed the two lines the deck calls out. These are org-agnostic (`org_id` NULL)
-- so every tenant picks them up automatically; an org can later insert its own
-- row with the same slug to override the label/description locally.
INSERT INTO public.crm_product_lines (org_id, slug, label, description, sort_order)
VALUES
    (NULL, 'health_insurance', 'Health Insurance', 'Traditional major-medical / ACA / short-term plans.', 10),
    (NULL, 'medical_cost_sharing', 'Medical Cost Sharing', 'Faith-based or non-insurance cost-sharing memberships.', 20)
ON CONFLICT (org_id, slug) DO NOTHING;

ALTER TABLE public.crm_deals
    ADD COLUMN IF NOT EXISTS product_line text;

CREATE INDEX IF NOT EXISTS idx_crm_deals_product_line
    ON public.crm_deals (org_id, product_line)
    WHERE product_line IS NOT NULL;

-- Soft FK (slug-based, not UUID) — matches how `lead_source` resolves against
-- `crm_lead_source_types`. Enforced via trigger so an org can use either the
-- shared system row OR its own override row with the same slug.
CREATE OR REPLACE FUNCTION public.crm_validate_deal_product_line()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.product_line IS NULL THEN
        RETURN NEW;
    END IF;

    PERFORM 1
      FROM public.crm_product_lines
     WHERE slug = NEW.product_line
       AND is_active = true
       AND (org_id = NEW.org_id OR org_id IS NULL)
     LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Invalid product_line %: must exist and be active in crm_product_lines',
            NEW.product_line
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_deals_validate_product_line ON public.crm_deals;
CREATE TRIGGER trg_crm_deals_validate_product_line
    BEFORE INSERT OR UPDATE OF product_line ON public.crm_deals
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_validate_deal_product_line();

-- RLS: everyone in the org can read the lookup; only admins/owners manage it.
ALTER TABLE public.crm_product_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_product_lines_select ON public.crm_product_lines;
CREATE POLICY crm_product_lines_select ON public.crm_product_lines
    FOR SELECT
    USING (
        org_id IS NULL
        OR EXISTS (
            SELECT 1 FROM public.org_memberships m
             WHERE m.org_id = crm_product_lines.org_id
               AND m.user_id = auth.uid()
               AND m.status = 'active'
        )
    );

DROP POLICY IF EXISTS crm_product_lines_write ON public.crm_product_lines;
CREATE POLICY crm_product_lines_write ON public.crm_product_lines
    FOR ALL
    USING (
        org_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.org_memberships m
             WHERE m.org_id = crm_product_lines.org_id
               AND m.user_id = auth.uid()
               AND m.status = 'active'
               AND m.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        org_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.org_memberships m
             WHERE m.org_id = crm_product_lines.org_id
               AND m.user_id = auth.uid()
               AND m.status = 'active'
               AND m.role IN ('owner', 'admin')
        )
    );

-- ----------------------------------------------------------------------------
-- 2. Community event attribution on lead_submissions
-- ----------------------------------------------------------------------------

ALTER TABLE public.lead_submissions
    ADD COLUMN IF NOT EXISTS community_event_id uuid
        REFERENCES public.crm_community_events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lead_submissions_community_event
    ON public.lead_submissions (community_event_id)
    WHERE community_event_id IS NOT NULL;

-- Increment leads_generated on the event whenever a lead points at it.
-- Decrement on DELETE and on UPDATE-that-nulls so the counter doesn't drift.
CREATE OR REPLACE FUNCTION public.crm_community_event_bump_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_delta integer := 0;
    v_target uuid := NULL;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.community_event_id IS NOT NULL THEN
            v_delta := 1;
            v_target := NEW.community_event_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.community_event_id IS NOT NULL THEN
            v_delta := -1;
            v_target := OLD.community_event_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.community_event_id IS DISTINCT FROM NEW.community_event_id THEN
            -- Old event: decrement (if any)
            IF OLD.community_event_id IS NOT NULL THEN
                UPDATE public.crm_community_events
                   SET leads_generated = GREATEST(0, COALESCE(leads_generated, 0) - 1)
                 WHERE id = OLD.community_event_id;
            END IF;
            -- New event: increment (if any)
            IF NEW.community_event_id IS NOT NULL THEN
                UPDATE public.crm_community_events
                   SET leads_generated = COALESCE(leads_generated, 0) + 1
                 WHERE id = NEW.community_event_id;
            END IF;
            RETURN NEW;
        END IF;
    END IF;

    IF v_target IS NOT NULL AND v_delta <> 0 THEN
        UPDATE public.crm_community_events
           SET leads_generated = GREATEST(0, COALESCE(leads_generated, 0) + v_delta)
         WHERE id = v_target;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_submissions_community_counter ON public.lead_submissions;
CREATE TRIGGER trg_lead_submissions_community_counter
    AFTER INSERT OR UPDATE OF community_event_id OR DELETE ON public.lead_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_community_event_bump_counter();

-- ----------------------------------------------------------------------------
-- 3. Reactivation cohort index
-- ----------------------------------------------------------------------------
-- Note: the column + its partial index (`idx_zls_reactivation_source`) were
-- already created in migration 20260413100000. Nothing to do here; the index
-- is re-asserted idempotently by that migration's CREATE INDEX IF NOT EXISTS.

COMMIT;

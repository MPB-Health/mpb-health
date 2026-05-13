-- ============================================================================
-- Migration: Sales Forecasting Tables
-- Description: Forecast periods, deal entries, and stage metrics view
-- ============================================================================

BEGIN;
-- ============================================================================
-- SECTION A: FORECAST TYPE AND STATUS ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.forecast_type AS ENUM ('monthly', 'quarterly', 'annual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    CREATE TYPE public.forecast_status AS ENUM ('draft', 'active', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    CREATE TYPE public.forecast_category AS ENUM ('committed', 'best_case', 'pipeline', 'omitted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
-- ============================================================================
-- SECTION B: CREATE CRM_FORECASTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_forecasts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

    -- Forecast Info
    name text NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,

    -- Classification
    forecast_type public.forecast_type NOT NULL DEFAULT 'monthly',
    status public.forecast_status NOT NULL DEFAULT 'draft',

    -- Ownership
    created_by uuid NOT NULL REFERENCES auth.users(id),

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT crm_forecasts_period_check CHECK (period_end > period_start)
);
-- ============================================================================
-- SECTION C: CREATE CRM_FORECAST_ENTRIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_forecast_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_id uuid NOT NULL REFERENCES public.crm_forecasts(id) ON DELETE CASCADE,
    deal_id uuid NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE,

    -- Rep
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Financial
    amount numeric(15,2) NOT NULL DEFAULT 0,
    probability integer NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    weighted_amount numeric(15,2) NOT NULL DEFAULT 0,

    -- Classification
    forecast_category public.forecast_category NOT NULL DEFAULT 'pipeline',
    stage text,
    close_date date,

    -- Notes
    notes text,

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Prevent duplicate deal entries per forecast
    CONSTRAINT crm_forecast_entries_unique_deal UNIQUE (forecast_id, deal_id)
);
-- ============================================================================
-- SECTION D: CREATE CRM_DEAL_STAGE_METRICS VIEW
-- ============================================================================

-- Compute days-in-stage per history row in a subquery (window functions can't be inside aggregates)
CREATE OR REPLACE VIEW public.crm_deal_stage_metrics AS
WITH stage_durations AS (
    SELECT
        h.deal_id,
        h.to_stage_id,
        EXTRACT(EPOCH FROM (
            LEAD(h.changed_at) OVER (PARTITION BY h.deal_id ORDER BY h.changed_at) - h.changed_at
        )) / 86400.0 AS days_in_stage
    FROM public.crm_deal_stage_history h
)
SELECT
    d.org_id,
    s.id AS stage_id,
    s.name AS stage_name,
    s.display_name AS stage_display_name,
    s.sort_order,
    s.is_won_stage,
    s.is_lost_stage,
    COUNT(DISTINCT d.id) AS total_deals,
    COUNT(DISTINCT d.id) FILTER (WHERE d.won_at IS NOT NULL) AS won_deals,
    COUNT(DISTINCT d.id) FILTER (WHERE d.lost_at IS NOT NULL) AS lost_deals,
    CASE
        WHEN COUNT(DISTINCT d.id) FILTER (WHERE d.won_at IS NOT NULL OR d.lost_at IS NOT NULL) > 0
        THEN ROUND(
            COUNT(DISTINCT d.id) FILTER (WHERE d.won_at IS NOT NULL)::numeric /
            COUNT(DISTINCT d.id) FILTER (WHERE d.won_at IS NOT NULL OR d.lost_at IS NOT NULL)::numeric * 100,
            1
        )
        ELSE 0
    END AS win_rate,
    COALESCE(ROUND(AVG(d.amount) FILTER (WHERE d.amount IS NOT NULL), 2), 0) AS avg_deal_size,
    COALESCE(
        ROUND(AVG(sd.days_in_stage) FILTER (WHERE sd.days_in_stage IS NOT NULL), 1),
        0
    ) AS avg_days_in_stage
FROM public.crm_deal_stages s
LEFT JOIN public.crm_deals d ON d.stage_id = s.id
LEFT JOIN stage_durations sd ON sd.deal_id = d.id AND sd.to_stage_id = s.id
WHERE s.is_active = true
GROUP BY d.org_id, s.id, s.name, s.display_name, s.sort_order, s.is_won_stage, s.is_lost_stage
ORDER BY s.sort_order;
-- ============================================================================
-- SECTION E: INDEXES
-- ============================================================================

-- Forecasts indexes
CREATE INDEX IF NOT EXISTS idx_crm_forecasts_org_id
    ON public.crm_forecasts (org_id);
CREATE INDEX IF NOT EXISTS idx_crm_forecasts_status
    ON public.crm_forecasts (status);
CREATE INDEX IF NOT EXISTS idx_crm_forecasts_period
    ON public.crm_forecasts (period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_crm_forecasts_created_at
    ON public.crm_forecasts (created_at DESC);
-- Forecast entries indexes
CREATE INDEX IF NOT EXISTS idx_crm_forecast_entries_forecast_id
    ON public.crm_forecast_entries (forecast_id);
CREATE INDEX IF NOT EXISTS idx_crm_forecast_entries_deal_id
    ON public.crm_forecast_entries (deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_forecast_entries_user_id
    ON public.crm_forecast_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_crm_forecast_entries_category
    ON public.crm_forecast_entries (forecast_category);
CREATE INDEX IF NOT EXISTS idx_crm_forecast_entries_close_date
    ON public.crm_forecast_entries (close_date);
-- ============================================================================
-- SECTION F: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.crm_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_forecast_entries ENABLE ROW LEVEL SECURITY;
-- Forecasts policies
DROP POLICY IF EXISTS "crm_forecasts_select" ON public.crm_forecasts;
CREATE POLICY "crm_forecasts_select"
    ON public.crm_forecasts
    FOR SELECT
    TO authenticated
    USING (
        public.is_org_member(org_id)
    );
DROP POLICY IF EXISTS "crm_forecasts_insert" ON public.crm_forecasts;
CREATE POLICY "crm_forecasts_insert"
    ON public.crm_forecasts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_org_permission(org_id, 'deals.write')
    );
DROP POLICY IF EXISTS "crm_forecasts_update" ON public.crm_forecasts;
CREATE POLICY "crm_forecasts_update"
    ON public.crm_forecasts
    FOR UPDATE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'deals.write')
    )
    WITH CHECK (
        public.has_org_permission(org_id, 'deals.write')
    );
DROP POLICY IF EXISTS "crm_forecasts_delete" ON public.crm_forecasts;
CREATE POLICY "crm_forecasts_delete"
    ON public.crm_forecasts
    FOR DELETE
    TO authenticated
    USING (
        public.has_org_permission(org_id, 'deals.delete')
    );
-- Forecast entries policies (access via forecast -> org_id)
DROP POLICY IF EXISTS "crm_forecast_entries_select" ON public.crm_forecast_entries;
CREATE POLICY "crm_forecast_entries_select"
    ON public.crm_forecast_entries
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_forecasts f
            WHERE f.id = forecast_id
            AND public.is_org_member(f.org_id)
        )
    );
DROP POLICY IF EXISTS "crm_forecast_entries_insert" ON public.crm_forecast_entries;
CREATE POLICY "crm_forecast_entries_insert"
    ON public.crm_forecast_entries
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_forecasts f
            WHERE f.id = forecast_id
            AND public.has_org_permission(f.org_id, 'deals.write')
        )
    );
DROP POLICY IF EXISTS "crm_forecast_entries_update" ON public.crm_forecast_entries;
CREATE POLICY "crm_forecast_entries_update"
    ON public.crm_forecast_entries
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_forecasts f
            WHERE f.id = forecast_id
            AND public.has_org_permission(f.org_id, 'deals.write')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.crm_forecasts f
            WHERE f.id = forecast_id
            AND public.has_org_permission(f.org_id, 'deals.write')
        )
    );
DROP POLICY IF EXISTS "crm_forecast_entries_delete" ON public.crm_forecast_entries;
CREATE POLICY "crm_forecast_entries_delete"
    ON public.crm_forecast_entries
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.crm_forecasts f
            WHERE f.id = forecast_id
            AND public.has_org_permission(f.org_id, 'deals.delete')
        )
    );
-- ============================================================================
-- SECTION G: UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_crm_forecasts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_crm_forecasts_updated_at ON public.crm_forecasts;
CREATE TRIGGER trigger_crm_forecasts_updated_at
    BEFORE UPDATE ON public.crm_forecasts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_forecasts_updated_at();
CREATE OR REPLACE FUNCTION public.handle_crm_forecast_entries_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    -- Auto-calculate weighted amount
    NEW.weighted_amount = ROUND(NEW.amount * NEW.probability / 100.0, 2);
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_crm_forecast_entries_updated_at ON public.crm_forecast_entries;
CREATE TRIGGER trigger_crm_forecast_entries_updated_at
    BEFORE INSERT OR UPDATE ON public.crm_forecast_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_crm_forecast_entries_updated_at();
COMMIT;

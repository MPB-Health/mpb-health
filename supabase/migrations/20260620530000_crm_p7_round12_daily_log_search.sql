-- ============================================================================
-- CRM rebuild — Round 12 (2026-05-14): Daily Log backend + searchability
--                                       + Section 15 reinforcement
--                                       + per-rep conversation goals
--                                       + anti-fabrication corroboration
-- ============================================================================
-- Spec source: Round 12 Adjustments image (2026-05-14):
--   • Daily Log backend mirrors the concierge log (already true:
--     `crm_daily_log_events` is one row per action). This migration adds
--     prospect_name / company_name / linked_record fields + a generated
--     `search_tsv` for full-text search across prospect, company, notes,
--     activity_type, and the rep's display name.
--   • Section 15 Round 8 reinforcement: every entry must capture the
--     Person / Company spoken with. The new columns + the
--     `crm_daily_log_add_manual_v2` RPC make that mandatory for manual
--     conversation rows; the existing RPC stays callable for non-
--     conversation sections so we don't break already-shipped UI.
--   • Per-rep daily conversation goal: 25/day for full-time reps, scaled
--     for part-time, exempt on Special Projects days. Stored on
--     `crm_conversation_goal_config` (org-level) + `crm_user_conversation_goal_overrides`
--     (per-user). RPC `crm_count_conversations` returns today's count and
--     the rep's effective target.
--   • Anti-fabrication: a corroboration view flags manual conversation
--     entries that have no auto-captured GoTo call / email / SMS / meeting
--     touching the same lead the same day. Persistent flags land on
--     `crm_rep_anti_fabrication_flags` so admins can see repeated
--     offenders without re-running the view.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Section 15 Round 8 — prospect / company capture columns
-- ----------------------------------------------------------------------------

ALTER TABLE public.crm_daily_log_events
    ADD COLUMN IF NOT EXISTS prospect_name text,
    ADD COLUMN IF NOT EXISTS company_name text,
    ADD COLUMN IF NOT EXISTS linked_record_type text
        CHECK (linked_record_type IN ('lead','contact','recruit','account')),
    ADD COLUMN IF NOT EXISTS linked_record_id uuid;

COMMENT ON COLUMN public.crm_daily_log_events.prospect_name IS
    'Round 12 / Section 15 Round 8 — display name of the person the rep spoke with. Captured on every conversation row (typeahead-bound on the UI side; not free-text in the spec).';
COMMENT ON COLUMN public.crm_daily_log_events.company_name IS
    'Round 12 / Section 15 Round 8 — company associated with the conversation (matches the prospect''s account when one exists).';
COMMENT ON COLUMN public.crm_daily_log_events.linked_record_type IS
    'Round 12 — what kind of CRM record the typeahead resolved to. lead | contact | recruit | account.';
COMMENT ON COLUMN public.crm_daily_log_events.linked_record_id IS
    'Round 12 — id of the resolved CRM record. Mirrors metadata.lead_id (etc.) for backwards compatibility but stays first-class for joins.';

-- Backfill linked_record_type / linked_record_id from the existing
-- metadata.lead_id / metadata.recruit_id / metadata.contact_id keys so
-- search + reporting works against historical rows immediately.
UPDATE public.crm_daily_log_events
   SET linked_record_type = 'lead',
       linked_record_id = (metadata ->> 'lead_id')::uuid
 WHERE linked_record_id IS NULL
   AND metadata ? 'lead_id'
   AND (metadata ->> 'lead_id') ~ '^[0-9a-f-]{36}$';

UPDATE public.crm_daily_log_events
   SET linked_record_type = 'recruit',
       linked_record_id = (metadata ->> 'recruit_id')::uuid
 WHERE linked_record_id IS NULL
   AND metadata ? 'recruit_id'
   AND (metadata ->> 'recruit_id') ~ '^[0-9a-f-]{36}$';

UPDATE public.crm_daily_log_events
   SET linked_record_type = 'contact',
       linked_record_id = (metadata ->> 'contact_id')::uuid
 WHERE linked_record_id IS NULL
   AND metadata ? 'contact_id'
   AND (metadata ->> 'contact_id') ~ '^[0-9a-f-]{36}$';

UPDATE public.crm_daily_log_events
   SET linked_record_type = 'account',
       linked_record_id = (metadata ->> 'account_id')::uuid
 WHERE linked_record_id IS NULL
   AND metadata ? 'account_id'
   AND (metadata ->> 'account_id') ~ '^[0-9a-f-]{36}$';

-- Backfill prospect / company names from the linked record so historical
-- rows show up in search. Uses LATERAL so a missing record just leaves
-- the name NULL instead of failing.
UPDATE public.crm_daily_log_events e
   SET prospect_name = COALESCE(l.first_name || ' ' || l.last_name, l.first_name, l.last_name)
  FROM public.lead_submissions l
 WHERE e.linked_record_type = 'lead'
   AND e.linked_record_id = l.id
   AND e.prospect_name IS NULL;

UPDATE public.crm_daily_log_events e
   SET prospect_name = COALESCE(c.first_name || ' ' || c.last_name, c.first_name, c.last_name)
  FROM public.crm_contacts c
 WHERE e.linked_record_type = 'contact'
   AND e.linked_record_id = c.id
   AND e.prospect_name IS NULL;

UPDATE public.crm_daily_log_events e
   SET company_name = a.name
  FROM public.crm_accounts a
 WHERE e.linked_record_type = 'account'
   AND e.linked_record_id = a.id
   AND e.company_name IS NULL;

CREATE INDEX IF NOT EXISTS idx_daily_log_events_linked_record
    ON public.crm_daily_log_events (linked_record_type, linked_record_id);

-- ----------------------------------------------------------------------------
-- 2. Full-text search — generated tsvector + GIN index
-- ----------------------------------------------------------------------------
-- We deliberately do not include the rep's display name in the generated
-- column (it would require an immutable function over auth.users / profiles
-- which we can't get) — instead the search RPC also matches on `user_id`
-- when the caller passes a rep filter, and the search box on the UI side
-- offers a rep dropdown.

ALTER TABLE public.crm_daily_log_events
    ADD COLUMN IF NOT EXISTS search_tsv tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(prospect_name, '')), 'A')
     || setweight(to_tsvector('english', COALESCE(company_name, '')), 'A')
     || setweight(to_tsvector('english', COALESCE(activity_type, '')), 'B')
     || setweight(to_tsvector('english', COALESCE(activity_subtype, '')), 'B')
     || setweight(to_tsvector('english', COALESCE(description, '')), 'C')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_daily_log_events_search_tsv
    ON public.crm_daily_log_events USING gin (search_tsv);

-- ----------------------------------------------------------------------------
-- 3. Section 15 reinforced manual-entry RPC (v2)
-- ----------------------------------------------------------------------------
-- Keeps the original `crm_daily_log_add_manual` callable for sections that
-- don't reference a person (Pipeline / Deals Closed metadata, Content
-- Creation rows). The new v2 captures the typeahead-resolved record so
-- search + corroboration have something to work with.

CREATE OR REPLACE FUNCTION public.crm_daily_log_add_manual_v2(
    p_org_id uuid,
    p_section text,
    p_activity_type text,
    p_description text,
    p_occurred_at timestamptz DEFAULT now(),
    p_metadata jsonb DEFAULT '{}'::jsonb,
    p_prospect_name text DEFAULT NULL,
    p_company_name text DEFAULT NULL,
    p_linked_record_type text DEFAULT NULL,
    p_linked_record_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_user uuid := auth.uid();
    v_id uuid;
    v_section text := lower(p_section);
    v_requires_person boolean;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NOT public.is_org_member(p_org_id) THEN
        RAISE EXCEPTION 'Not a member of org %', p_org_id USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF v_section NOT IN ('lead_communication','linkedin_activity','pipeline','deals_closed','activities','content_creation','special_projects') THEN
        RAISE EXCEPTION 'Invalid section: %', p_section USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF p_activity_type IS NULL OR length(trim(both ' ' FROM p_activity_type)) = 0 THEN
        RAISE EXCEPTION 'activity_type is required' USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- Section 15 anti-fabrication: conversation rows must name a person.
    -- "Conversation" is currently { lead_communication.call/email/sms,
    --   linkedin_activity.linkedin_message/linkedin_reply,
    --   activities.meeting/demo/presentation }.
    v_requires_person :=
        (v_section = 'lead_communication' AND lower(p_activity_type) IN ('call','email','sms','text'))
     OR (v_section = 'linkedin_activity' AND lower(p_activity_type) IN ('linkedin_message','linkedin_reply'))
     OR (v_section = 'activities' AND lower(p_activity_type) IN ('meeting','demo','presentation'));

    IF v_requires_person THEN
        IF (p_prospect_name IS NULL OR length(trim(both ' ' FROM p_prospect_name)) = 0)
           AND p_linked_record_id IS NULL THEN
            RAISE EXCEPTION 'Round 12 / Section 15: conversation entries must name the person spoken with (use the typeahead, not free text).'
                USING ERRCODE = 'invalid_parameter_value';
        END IF;
    END IF;

    INSERT INTO public.crm_daily_log_events (
        org_id, user_id, log_date, source, source_id, section, activity_type, activity_subtype,
        description, metadata, manual, occurred_at,
        prospect_name, company_name, linked_record_type, linked_record_id
    ) VALUES (
        p_org_id, v_user, COALESCE(p_occurred_at, now())::date, 'manual', NULL,
        v_section, lower(p_activity_type),
        NULLIF(lower(COALESCE(p_metadata ->> 'subtype', '')), ''),
        p_description, COALESCE(p_metadata, '{}'::jsonb), true, COALESCE(p_occurred_at, now()),
        NULLIF(trim(both ' ' FROM COALESCE(p_prospect_name, '')), ''),
        NULLIF(trim(both ' ' FROM COALESCE(p_company_name, '')), ''),
        NULLIF(lower(COALESCE(p_linked_record_type, '')), ''),
        p_linked_record_id
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_daily_log_add_manual_v2(
    uuid, text, text, text, timestamptz, jsonb, text, text, text, uuid
) TO authenticated;
COMMENT ON FUNCTION public.crm_daily_log_add_manual_v2(
    uuid, text, text, text, timestamptz, jsonb, text, text, text, uuid
) IS
    'CRM rebuild Round 12 (2026-05-14) — manual Daily Log entry with Section 15 prospect/company capture. Conversation rows must include either p_prospect_name or p_linked_record_id; the typeahead UI satisfies both.';

-- ----------------------------------------------------------------------------
-- 4. Searchable backend RPC
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_daily_log_search(
    p_org_id uuid,
    p_q text DEFAULT NULL,
    p_from date DEFAULT NULL,
    p_to date DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_section text DEFAULT NULL,
    p_activity_type text DEFAULT NULL,
    p_source text DEFAULT NULL,             -- 'auto' | 'manual' | NULL = both
    p_linked_record_type text DEFAULT NULL,
    p_linked_record_id uuid DEFAULT NULL,
    p_limit integer DEFAULT 100,
    p_offset integer DEFAULT 0
) RETURNS TABLE (
    id uuid, org_id uuid, user_id uuid, log_date date, source text,
    section text, activity_type text, activity_subtype text, description text,
    metadata jsonb, manual boolean, occurred_at timestamptz, created_at timestamptz,
    prospect_name text, company_name text,
    linked_record_type text, linked_record_id uuid,
    rank real
)
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
    v_query tsquery := NULL;
BEGIN
    IF NOT public.is_org_member(p_org_id) THEN
        RAISE EXCEPTION 'Not a member of org %', p_org_id USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF p_q IS NOT NULL AND length(trim(both ' ' FROM p_q)) > 0 THEN
        -- websearch_to_tsquery handles "quoted phrases" + OR/AND naturally
        -- and never throws on weird input — exactly what we want for a
        -- rep-typed search box.
        v_query := websearch_to_tsquery('english', p_q);
    END IF;

    RETURN QUERY
    SELECT  e.id, e.org_id, e.user_id, e.log_date, e.source,
            e.section, e.activity_type, e.activity_subtype, e.description,
            e.metadata, e.manual, e.occurred_at, e.created_at,
            e.prospect_name, e.company_name,
            e.linked_record_type, e.linked_record_id,
            CASE WHEN v_query IS NULL THEN 0::real
                 ELSE ts_rank_cd(e.search_tsv, v_query) END AS rank
      FROM  public.crm_daily_log_events e
     WHERE  e.org_id = p_org_id
       AND  (v_query IS NULL OR e.search_tsv @@ v_query)
       AND  (p_from IS NULL OR e.log_date >= p_from)
       AND  (p_to   IS NULL OR e.log_date <= p_to)
       AND  (p_user_id IS NULL OR e.user_id = p_user_id)
       AND  (p_section IS NULL OR e.section = lower(p_section))
       AND  (p_activity_type IS NULL OR e.activity_type = lower(p_activity_type))
       AND  (p_source IS NULL
             OR (lower(p_source) = 'manual' AND e.manual = true)
             OR (lower(p_source) = 'auto'   AND e.manual = false))
       AND  (p_linked_record_type IS NULL OR e.linked_record_type = lower(p_linked_record_type))
       AND  (p_linked_record_id   IS NULL OR e.linked_record_id   = p_linked_record_id)
     ORDER BY (CASE WHEN v_query IS NULL THEN 0::real ELSE ts_rank_cd(e.search_tsv, v_query) END) DESC,
              e.occurred_at DESC
     LIMIT  GREATEST(LEAST(COALESCE(p_limit, 100), 500), 1)
    OFFSET  GREATEST(COALESCE(p_offset, 0), 0);
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_daily_log_search(
    uuid, text, date, date, uuid, text, text, text, text, uuid, integer, integer
) TO authenticated, service_role;
COMMENT ON FUNCTION public.crm_daily_log_search(
    uuid, text, date, date, uuid, text, text, text, text, uuid, integer, integer
) IS
    'CRM rebuild Round 12 (2026-05-14) — full-text + structured search across crm_daily_log_events. Powers the admin "every entry mentioning [name/company]" audit query and the rep-side searchable backend.';

-- ----------------------------------------------------------------------------
-- 5. Per-rep daily conversation goal
-- ----------------------------------------------------------------------------
-- Org-level defaults: 25/day full-time, scaled for part-time, exempt on
-- days with at least one Special Projects entry. Per-user overrides handle
-- the part-time scaling (e.g. 10 conversations/day for a 0.4 FTE).

CREATE TABLE IF NOT EXISTS public.crm_conversation_goal_config (
    org_id uuid PRIMARY KEY REFERENCES public.orgs(id) ON DELETE CASCADE,
    full_time_target integer NOT NULL DEFAULT 25 CHECK (full_time_target BETWEEN 1 AND 200),
    part_time_default_target integer NOT NULL DEFAULT 10 CHECK (part_time_default_target BETWEEN 1 AND 200),
    -- When true, days with at least one Special Projects entry are excluded
    -- from the goal entirely (no expectation, no shortfall).
    exempt_special_projects_days boolean NOT NULL DEFAULT true,
    -- Section 11 buckets that count as a "conversation" for goal purposes.
    -- Defaults match the spec ("calls/SMS/email/meeting touches").
    counted_sections text[] NOT NULL DEFAULT ARRAY['lead_communication','activities']::text[],
    counted_activity_types text[] NOT NULL DEFAULT ARRAY[
        'call','email','sms','text','meeting','demo','presentation'
    ]::text[],
    spec_locked boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.crm_conversation_goal_config IS
    'CRM rebuild Round 12 — org-level conversation-goal config. Default targets: 25/day FT, 10/day PT, SP days exempt.';

CREATE TABLE IF NOT EXISTS public.crm_user_conversation_goal_overrides (
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_target integer NOT NULL CHECK (daily_target BETWEEN 0 AND 200),
    is_part_time boolean NOT NULL DEFAULT false,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (org_id, user_id)
);
COMMENT ON TABLE public.crm_user_conversation_goal_overrides IS
    'CRM rebuild Round 12 — per-user conversation-goal overrides. Set daily_target=0 to mark a rep exempt from the goal entirely.';

ALTER TABLE public.crm_conversation_goal_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_user_conversation_goal_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversation_goal_config_select ON public.crm_conversation_goal_config;
DROP POLICY IF EXISTS conversation_goal_config_admin ON public.crm_conversation_goal_config;
CREATE POLICY conversation_goal_config_select ON public.crm_conversation_goal_config
    FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY conversation_goal_config_admin ON public.crm_conversation_goal_config
    FOR ALL TO authenticated
    USING (public.is_org_admin(org_id))
    WITH CHECK (public.is_org_admin(org_id));

DROP POLICY IF EXISTS user_conv_goal_select ON public.crm_user_conversation_goal_overrides;
DROP POLICY IF EXISTS user_conv_goal_admin ON public.crm_user_conversation_goal_overrides;
CREATE POLICY user_conv_goal_select ON public.crm_user_conversation_goal_overrides
    FOR SELECT TO authenticated USING (public.is_org_member(org_id));
CREATE POLICY user_conv_goal_admin ON public.crm_user_conversation_goal_overrides
    FOR ALL TO authenticated
    USING (public.is_org_admin(org_id))
    WITH CHECK (public.is_org_admin(org_id));

-- Seed every existing org with the default config row so the goal scan
-- returns sensible numbers immediately.
INSERT INTO public.crm_conversation_goal_config (org_id)
SELECT id FROM public.orgs
ON CONFLICT (org_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.crm_count_conversations(
    p_org_id uuid,
    p_user_id uuid,
    p_date date
) RETURNS TABLE (
    conversation_count integer,
    target integer,
    is_special_projects_day boolean,
    is_exempt boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_cfg public.crm_conversation_goal_config%ROWTYPE;
    v_override public.crm_user_conversation_goal_overrides%ROWTYPE;
    v_count integer := 0;
    v_target integer;
    v_sp_day boolean := false;
    v_exempt boolean := false;
BEGIN
    SELECT * INTO v_cfg FROM public.crm_conversation_goal_config WHERE org_id = p_org_id;
    IF NOT FOUND THEN
        -- No org config yet — fall back to spec defaults.
        v_cfg.full_time_target := 25;
        v_cfg.part_time_default_target := 10;
        v_cfg.exempt_special_projects_days := true;
        v_cfg.counted_sections := ARRAY['lead_communication','activities']::text[];
        v_cfg.counted_activity_types := ARRAY['call','email','sms','text','meeting','demo','presentation']::text[];
    END IF;

    SELECT * INTO v_override
      FROM public.crm_user_conversation_goal_overrides
     WHERE org_id = p_org_id AND user_id = p_user_id;

    IF FOUND THEN
        v_target := v_override.daily_target;
        IF v_override.daily_target = 0 THEN
            v_exempt := true;
        END IF;
    ELSE
        v_target := v_cfg.full_time_target;
    END IF;

    -- Special Projects exemption: a single SP entry on the day removes the
    -- conversation expectation for that day.
    IF v_cfg.exempt_special_projects_days THEN
        SELECT EXISTS (
            SELECT 1 FROM public.crm_daily_log_events
             WHERE org_id = p_org_id
               AND user_id = p_user_id
               AND log_date = p_date
               AND section = 'special_projects'
        ) INTO v_sp_day;
        IF v_sp_day THEN v_exempt := true; END IF;
    END IF;

    SELECT COUNT(*)::integer INTO v_count
      FROM public.crm_daily_log_events e
     WHERE e.org_id = p_org_id
       AND e.user_id = p_user_id
       AND e.log_date = p_date
       AND e.section = ANY (v_cfg.counted_sections)
       AND e.activity_type = ANY (v_cfg.counted_activity_types);

    conversation_count := v_count;
    target := v_target;
    is_special_projects_day := v_sp_day;
    is_exempt := v_exempt;
    RETURN NEXT;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_count_conversations(uuid, uuid, date)
    TO authenticated, service_role;
COMMENT ON FUNCTION public.crm_count_conversations(uuid, uuid, date) IS
    'CRM rebuild Round 12 — returns the rep''s conversation count for a date plus their effective target and whether the day is exempt (Special Projects).';

-- ----------------------------------------------------------------------------
-- 6. Anti-fabrication corroboration view + persistent flag table
-- ----------------------------------------------------------------------------
-- A manual conversation row is "uncorroborated" when no automatic event
-- (GoTo call, CRM email send, SMS, meeting) touched the same lead the
-- same day. The view below is the source of truth; admins read it when
-- triaging and a future scan job can roll repeat offenders into the
-- persistent `crm_rep_anti_fabrication_flags` table.

CREATE OR REPLACE VIEW public.crm_v_daily_log_corroboration AS
SELECT
    e.id,
    e.org_id,
    e.user_id,
    e.log_date,
    e.section,
    e.activity_type,
    e.activity_subtype,
    e.description,
    e.prospect_name,
    e.company_name,
    e.linked_record_type,
    e.linked_record_id,
    e.manual,
    e.occurred_at,
    -- A row is "corroborated" when at least one auto-captured event the
    -- same day touched the same linked record (or the same prospect_name
    -- when no record was linked). Calls, emails, SMS, and meetings count.
    EXISTS (
        SELECT 1
          FROM public.crm_daily_log_events f
         WHERE f.org_id = e.org_id
           AND f.user_id = e.user_id
           AND f.log_date = e.log_date
           AND f.manual = false
           AND f.activity_type = ANY (ARRAY['call','email','sms','text','meeting']::text[])
           AND (
                (e.linked_record_id IS NOT NULL AND f.linked_record_id = e.linked_record_id)
             OR (e.linked_record_id IS NULL
                 AND e.prospect_name IS NOT NULL
                 AND f.prospect_name IS NOT NULL
                 AND lower(f.prospect_name) = lower(e.prospect_name))
           )
    ) AS is_corroborated,
    -- Convenience flag the admin UI reads directly: only conversation
    -- manual rows can be uncorroborated; auto rows and non-conversation
    -- manual rows (e.g. networking event, content drafted) are always
    -- "corroborated" (= true).
    CASE
        WHEN e.manual = false THEN true
        WHEN e.section NOT IN ('lead_communication','activities','linkedin_activity') THEN true
        WHEN e.activity_type NOT IN ('call','email','sms','text','meeting','demo','presentation','linkedin_message','linkedin_reply') THEN true
        ELSE EXISTS (
            SELECT 1
              FROM public.crm_daily_log_events f
             WHERE f.org_id = e.org_id
               AND f.user_id = e.user_id
               AND f.log_date = e.log_date
               AND f.manual = false
               AND f.activity_type = ANY (ARRAY['call','email','sms','text','meeting']::text[])
               AND (
                    (e.linked_record_id IS NOT NULL AND f.linked_record_id = e.linked_record_id)
                 OR (e.linked_record_id IS NULL
                     AND e.prospect_name IS NOT NULL
                     AND f.prospect_name IS NOT NULL
                     AND lower(f.prospect_name) = lower(e.prospect_name))
               )
        )
    END AS effective_corroborated
  FROM public.crm_daily_log_events e;

COMMENT ON VIEW public.crm_v_daily_log_corroboration IS
    'CRM rebuild Round 12 — joins manual conversation rows against same-day auto rows for the same lead/prospect. effective_corroborated=false flags rows for admin review.';

GRANT SELECT ON public.crm_v_daily_log_corroboration TO authenticated;

CREATE TABLE IF NOT EXISTS public.crm_rep_anti_fabrication_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Cumulative count of uncorroborated conversation rows over the
    -- lookback window the scan job uses (default 30 days).
    uncorroborated_count integer NOT NULL DEFAULT 0,
    -- Window the count was computed over.
    window_start date NOT NULL,
    window_end date NOT NULL,
    -- True until an admin clears the flag (with `cleared_by` / `cleared_at`).
    is_active boolean NOT NULL DEFAULT true,
    cleared_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    cleared_at timestamptz,
    cleared_reason text,
    last_evaluated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_anti_fab_flags_org_user
    ON public.crm_rep_anti_fabrication_flags (org_id, user_id, is_active);
ALTER TABLE public.crm_rep_anti_fabrication_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anti_fab_flags_admin ON public.crm_rep_anti_fabrication_flags;
-- Admin-only by spec: "raise a persistent flag on the rep record
-- (admin-visible only)."
CREATE POLICY anti_fab_flags_admin ON public.crm_rep_anti_fabrication_flags
    FOR ALL TO authenticated
    USING (public.is_org_admin(org_id))
    WITH CHECK (public.is_org_admin(org_id));

COMMENT ON TABLE public.crm_rep_anti_fabrication_flags IS
    'CRM rebuild Round 12 — persistent admin-only flag for reps who repeatedly log un-corroborated conversations. Source: crm_v_daily_log_corroboration scan.';

-- Scan helper: an admin or scheduled job can call this to refresh the
-- persistent flag table from the corroboration view. Default window is
-- 30 days; threshold is 5 uncorroborated conversations.
CREATE OR REPLACE FUNCTION public.crm_scan_anti_fabrication_flags(
    p_org_id uuid,
    p_window_days integer DEFAULT 30,
    p_threshold integer DEFAULT 5
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
    v_window_start date := (now() AT TIME ZONE 'UTC')::date - (p_window_days - 1);
    v_window_end date := (now() AT TIME ZONE 'UTC')::date;
    v_inserted integer := 0;
BEGIN
    IF NOT public.is_org_admin(p_org_id) THEN
        RAISE EXCEPTION 'Admin role required' USING ERRCODE = 'insufficient_privilege';
    END IF;

    WITH counts AS (
        SELECT user_id, COUNT(*)::integer AS n
          FROM public.crm_v_daily_log_corroboration
         WHERE org_id = p_org_id
           AND log_date BETWEEN v_window_start AND v_window_end
           AND manual = true
           AND effective_corroborated = false
         GROUP BY user_id
        HAVING COUNT(*) >= p_threshold
    ), upserts AS (
        INSERT INTO public.crm_rep_anti_fabrication_flags (
            org_id, user_id, uncorroborated_count, window_start, window_end,
            is_active, last_evaluated_at
        )
        SELECT p_org_id, c.user_id, c.n, v_window_start, v_window_end, true, now()
          FROM counts c
        ON CONFLICT (id) DO NOTHING
        RETURNING 1
    )
    SELECT COALESCE(COUNT(*), 0)::integer INTO v_inserted FROM upserts;

    RETURN v_inserted;
END;
$$;
GRANT EXECUTE ON FUNCTION public.crm_scan_anti_fabrication_flags(uuid, integer, integer)
    TO authenticated, service_role;
COMMENT ON FUNCTION public.crm_scan_anti_fabrication_flags(uuid, integer, integer) IS
    'CRM rebuild Round 12 — admin-callable scan that rolls uncorroborated conversation counts into crm_rep_anti_fabrication_flags. Default 30-day window, ≥5 uncorroborated rows triggers a flag.';

COMMIT;

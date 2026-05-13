-- ============================================================================
-- CRM rebuild — Phase 1: opt-out keyword detector (Section 2g)
--
-- The existing crm_detect_opt_out_keywords() function (20260606140000) uses
-- hard-coded regex matching plus phrases the spec held off (e.g., "not
-- interested"). This migration replaces it with a data-driven phrase list
-- per Section 2g, sourced from a configurable crm_optout_keywords table so
-- admins can adjust at the 60-day post-launch checkpoint without a migration.
--
-- Approved phrases (case-insensitive):
--   unsubscribe / remove me / take me off / do not contact / don't contact /
--   stop emailing / stop sending / opt out / opt-out / please stop /
--   no longer interested
--
-- NOT in the list per spec: "not interested" (false-positive risk during
-- objection handling).
--
-- The detector strips quoted reply blocks (lines starting with ">") and a
-- naive signature delimiter ("-- " on its own line) before phrase matching.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Keywords table
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_optout_keywords (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
    phrase      text NOT NULL,
    is_active   boolean NOT NULL DEFAULT true,
    created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_optout_keywords_org_phrase
    ON public.crm_optout_keywords (COALESCE(org_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(phrase));

CREATE INDEX IF NOT EXISTS idx_crm_optout_keywords_active
    ON public.crm_optout_keywords (org_id, is_active)
    WHERE is_active = true;

ALTER TABLE public.crm_optout_keywords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_optout_keywords_select ON public.crm_optout_keywords;
CREATE POLICY crm_optout_keywords_select ON public.crm_optout_keywords
    FOR SELECT TO authenticated
    USING (org_id IS NULL OR public.is_org_member(org_id));

DROP POLICY IF EXISTS crm_optout_keywords_insert ON public.crm_optout_keywords;
CREATE POLICY crm_optout_keywords_insert ON public.crm_optout_keywords
    FOR INSERT TO authenticated
    WITH CHECK (
        org_id IS NOT NULL
        AND public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'settings.manage')
    );

DROP POLICY IF EXISTS crm_optout_keywords_update ON public.crm_optout_keywords;
CREATE POLICY crm_optout_keywords_update ON public.crm_optout_keywords
    FOR UPDATE TO authenticated
    USING (
        org_id IS NOT NULL
        AND public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'settings.manage')
    )
    WITH CHECK (
        org_id IS NOT NULL
        AND public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'settings.manage')
    );

DROP POLICY IF EXISTS crm_optout_keywords_delete ON public.crm_optout_keywords;
CREATE POLICY crm_optout_keywords_delete ON public.crm_optout_keywords
    FOR DELETE TO authenticated
    USING (
        org_id IS NOT NULL
        AND public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'settings.manage')
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_optout_keywords TO authenticated;
GRANT ALL ON public.crm_optout_keywords TO service_role;

-- ----------------------------------------------------------------------------
-- 2. Seed the global default list (org_id NULL applies to every org)
-- ----------------------------------------------------------------------------

INSERT INTO public.crm_optout_keywords (org_id, phrase, is_active)
VALUES
    (NULL, 'unsubscribe',          true),
    (NULL, 'remove me',            true),
    (NULL, 'take me off',          true),
    (NULL, 'do not contact',       true),
    (NULL, 'don''t contact',       true),
    (NULL, 'stop emailing',        true),
    (NULL, 'stop sending',         true),
    (NULL, 'opt out',              true),
    (NULL, 'opt-out',              true),
    (NULL, 'please stop',          true),
    (NULL, 'no longer interested', true)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Detector — strips quoted blocks + signature, then phrase-matches
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_strip_reply_quoted_and_signature(p_body text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_lines text[];
    v_acc   text := '';
    v_line  text;
    v_seen_sig boolean := false;
BEGIN
    IF p_body IS NULL OR length(trim(p_body)) = 0 THEN
        RETURN '';
    END IF;

    v_lines := string_to_array(p_body, E'\n');

    FOREACH v_line IN ARRAY v_lines
    LOOP
        -- "On <date>, X wrote:" header — everything after is quoted history
        IF v_line ~* '^\s*on\s.+\swrote:\s*$' THEN
            EXIT;
        END IF;

        -- Standard signature delimiter "-- "
        IF trim(v_line) = '--' OR v_line ~ '^\s*--\s*$' THEN
            v_seen_sig := true;
            EXIT;
        END IF;

        -- Skip quoted lines starting with ">" (after possible leading spaces)
        IF v_line ~ '^\s*>' THEN
            CONTINUE;
        END IF;

        v_acc := v_acc || v_line || E'\n';
    END LOOP;

    RETURN v_acc;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_strip_reply_quoted_and_signature(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_strip_reply_quoted_and_signature(text)
    TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.crm_detect_opt_out(
    p_body text,
    p_org_id uuid DEFAULT NULL
)
RETURNS TABLE (is_match boolean, match_phrase text)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_clean text;
    v_norm  text;
    v_kw    record;
BEGIN
    v_clean := public.crm_strip_reply_quoted_and_signature(p_body);
    v_norm  := lower(coalesce(v_clean, ''));

    IF length(trim(v_norm)) = 0 THEN
        RETURN QUERY SELECT false, NULL::text;
        RETURN;
    END IF;

    FOR v_kw IN
        SELECT k.phrase AS kw_phrase
          FROM public.crm_optout_keywords k
         WHERE k.is_active = true
           AND (k.org_id IS NULL OR k.org_id = p_org_id)
         ORDER BY length(k.phrase) DESC
    LOOP
        IF position(lower(v_kw.kw_phrase) IN v_norm) > 0 THEN
            RETURN QUERY SELECT true, v_kw.kw_phrase;
            RETURN;
        END IF;
    END LOOP;

    RETURN QUERY SELECT false, NULL::text;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_detect_opt_out(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_detect_opt_out(text, uuid)
    TO authenticated, service_role;

COMMENT ON FUNCTION public.crm_detect_opt_out IS
    'Section 2g detector: returns (matched, matched_phrase) for the cleaned reply body. Phrase list lives in crm_optout_keywords; review at 60-day post-launch checkpoint.';

-- ----------------------------------------------------------------------------
-- 4. Track the matched reason on the lead
-- ----------------------------------------------------------------------------

ALTER TABLE public.lead_submissions
    ADD COLUMN IF NOT EXISTS opt_out_reason       text,
    ADD COLUMN IF NOT EXISTS opt_out_detected_at  timestamptz,
    ADD COLUMN IF NOT EXISTS opt_out_phrase       text;

COMMENT ON COLUMN public.lead_submissions.opt_out_reason IS
    'Free-form rep entry or auto-detector reason for opt-out (Section 2g + manual Mark as Lost).';
COMMENT ON COLUMN public.lead_submissions.opt_out_phrase IS
    'Specific phrase from crm_optout_keywords that fired the auto-detection (audit trail).';

-- ----------------------------------------------------------------------------
-- 5. Replace the legacy crm_apply_lead_opt_out RPC with one that records
--    detector phrase + reason + a structured opt-out signal timestamp.
--
--    Drop the old 2-arg overload first so callers always hit the new 3-arg
--    function with the phrase audit trail.
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.crm_apply_lead_opt_out(uuid, text);

CREATE OR REPLACE FUNCTION public.crm_apply_lead_opt_out(
    p_lead_id uuid,
    p_reason  text DEFAULT 'opt_out_signal',
    p_phrase  text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org uuid;
BEGIN
    SELECT org_id INTO v_org FROM public.lead_submissions WHERE id = p_lead_id;
    IF v_org IS NULL OR NOT public.is_org_member(v_org) THEN
        RAISE EXCEPTION 'not_found_or_denied';
    END IF;

    UPDATE public.lead_submissions
    SET
        pipeline_stage         = 'lost',
        lost_reason            = COALESCE(p_reason, lost_reason),
        opt_out_reason         = COALESCE(p_reason, opt_out_reason),
        opt_out_phrase         = COALESCE(p_phrase, opt_out_phrase),
        opt_out_detected_at    = COALESCE(opt_out_detected_at, now()),
        do_not_contact         = true,
        workflow_subsection    = 'do_not_contact',
        last_opt_out_signal_at = now(),
        stage_changed_at       = now(),
        updated_at             = now()
    WHERE id = p_lead_id;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_apply_lead_opt_out(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_apply_lead_opt_out(uuid, text, text)
    TO authenticated, service_role;

COMMIT;

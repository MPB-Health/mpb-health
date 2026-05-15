-- ============================================================================
-- CRM rebuild — Phase 7 — Round 7 Adjustment (2026-05-13 spec note)
-- Engagement-signal producers for "tracked-link click"
-- ============================================================================
--
-- Section 13/14 Round 7 note required three engagement signals to halt the
-- Quote Response cadence and advance Quoted/Working → Engaged:
--
--   1. Reply               → wired Phase 3 (receive-crm-email)
--   2. Tracked-link click  → wired here (DB trigger)
--   3. Calendar booking    → wired in `crm-calendar-booking-webhook` edge
--                            function in the same Phase 7 / Round 7 set
--
-- The downstream RPC `crm_register_engagement_signal(lead_id, signal_type)`
-- already handles cadence pause + stage advancement + activity log. This
-- migration only adds the producer side for link clicks. We do it as a DB
-- trigger on `crm_email_tracking` (rather than instrumenting every caller)
-- because clicks land in that table from BOTH active paths:
--
--   - Custom click rewriter in `send-crm-email-v2` → `email-tracking`
--     edge function → INSERT crm_email_tracking
--   - Resend native click tracking → `resend-webhook` edge function →
--     INSERT crm_email_tracking
--
-- One trigger therefore covers both. Future click sources (e.g. SMS link
-- click via GoTo Connect, Microsoft Defender for Office prefetches) that
-- also INSERT into crm_email_tracking will benefit automatically without
-- any further code change.
--
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. crm_tracking_to_engagement_signal — trigger function
-- ----------------------------------------------------------------------------
-- Fires for every INSERT into crm_email_tracking where:
--   - tracking_type = 'click' (opens are deliberately excluded — per spec
--     only reply / calendar booking / tracked-link click qualify as
--     engagement signals; opens are too noisy and trip on Microsoft
--     Defender prefetch + image scanners).
--   - The owning crm_email_log row has a non-null lead_id (outbound to a
--     CRM lead). recruit_id rows are skipped here pending the recruit-side
--     engagement signal RPC (deferred per spec-alignment-audit).
--
-- The function is intentionally tolerant: if `crm_register_engagement_signal`
-- raises (e.g. lead was deleted between the click landing and the trigger
-- firing), we log a WARNING via RAISE NOTICE but do not abort the
-- tracking INSERT, because losing a tracking row is worse than losing a
-- single engagement-signal call (the email is already clicked; the user
-- is on their way to the destination).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_tracking_to_engagement_signal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_lead_id uuid;
BEGIN
    IF NEW.tracking_type IS DISTINCT FROM 'click' THEN
        RETURN NEW;
    END IF;

    SELECT lead_id INTO v_lead_id
      FROM public.crm_email_log
     WHERE id = NEW.email_log_id;

    IF v_lead_id IS NULL THEN
        -- No CRM lead attached (either internal email or recruit-only send).
        RETURN NEW;
    END IF;

    BEGIN
        PERFORM public.crm_register_engagement_signal(v_lead_id, 'link_click');
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'crm_tracking_to_engagement_signal: register_engagement_signal failed for lead % (% / %), continuing',
            v_lead_id, SQLSTATE, SQLERRM;
    END;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_tracking_to_engagement_signal() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_tracking_to_engagement_signal() TO authenticated, service_role;

COMMENT ON FUNCTION public.crm_tracking_to_engagement_signal() IS
    'Round 7 — fires crm_register_engagement_signal(lead_id, ''link_click'') for every CLICK row landed in crm_email_tracking. Covers both custom click-rewriter and Resend-native click paths in one place.';

-- ----------------------------------------------------------------------------
-- 2. Trigger registration
-- ----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_crm_tracking_to_engagement ON public.crm_email_tracking;

CREATE TRIGGER trg_crm_tracking_to_engagement
    AFTER INSERT ON public.crm_email_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_tracking_to_engagement_signal();

-- ----------------------------------------------------------------------------
-- 3. Idempotency table for calendar-booking webhook
-- ----------------------------------------------------------------------------
-- Calendly retries webhooks on non-2xx responses + network failures.
-- The `crm-calendar-booking-webhook` edge function dedupes incoming
-- bookings by the Calendly invitee URI (unique per booking).
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.crm_calendar_booking_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
    lead_id         uuid REFERENCES public.lead_submissions(id) ON DELETE SET NULL,
    recruit_id      uuid REFERENCES public.crm_recruiting_records(id) ON DELETE SET NULL,
    provider        text NOT NULL CHECK (provider IN ('calendly', 'outlook', 'google', 'other')),
    external_uri    text NOT NULL,
    invitee_email   text,
    invitee_name    text,
    scheduled_start timestamptz,
    scheduled_end   timestamptz,
    event_type_name text,
    raw_payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
    engagement_signal_fired boolean NOT NULL DEFAULT false,
    activity_id     uuid,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_calendar_booking_provider_uri
    ON public.crm_calendar_booking_log(provider, external_uri);

CREATE INDEX IF NOT EXISTS idx_crm_calendar_booking_lead
    ON public.crm_calendar_booking_log(lead_id) WHERE lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_calendar_booking_org_date
    ON public.crm_calendar_booking_log(org_id, scheduled_start DESC);

ALTER TABLE public.crm_calendar_booking_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_calendar_booking_log_select ON public.crm_calendar_booking_log;

-- Admins and the lead's assigned rep see their org's booking log.
CREATE POLICY crm_calendar_booking_log_select
    ON public.crm_calendar_booking_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.org_memberships m
            WHERE m.user_id = auth.uid()
              AND m.org_id  = crm_calendar_booking_log.org_id
              AND m.status  = 'active'
        )
    );

-- service_role bypasses RLS by design; no INSERT/UPDATE/DELETE policy for
-- authenticated users — only the webhook function (service_role) writes
-- rows here.

COMMENT ON TABLE public.crm_calendar_booking_log IS
    'Round 7 — every inbound calendar booking received by crm-calendar-booking-webhook. Dedupe key is (provider, external_uri). Source of truth for "calendar_booking" engagement signals.';

COMMIT;

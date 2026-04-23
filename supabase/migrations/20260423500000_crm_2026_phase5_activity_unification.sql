-- ============================================================================
-- Migration: CRM 2026 Phase 5 - Activity unification, LinkedIn subtypes, A/B stamping
-- ============================================================================
-- Goals (per apps/crm/docs/UPGRADE-PLAN-2026.md Phase 5):
--   1. Let `lead_activities` carry contact/account/deal context so it can replace
--      the split-brain `crm_activities` writes from ContactDetail (reports only
--      read `lead_activities`).
--   2. Expand activity CHECK to include `linkedin_short` (distinct from
--      original/shared posts) so the LinkedIn widget can enforce the spec's
--      2 + 2 + 2 = 6/week model per rep.
--   3. Stamp outbound emails with `ab_test_id` + `variant` so the A/B harness
--      can tally open/click/reply per variant.
--   4. Mark one `mail_accounts` row per org as the "primary shared inbox"
--      (`sales@mympb.com` on prod) so the UI surfaces it consistently.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. lead_activities: add optional contact/account/deal context
-- ----------------------------------------------------------------------------

ALTER TABLE public.lead_activities
    ADD COLUMN IF NOT EXISTS contact_id uuid,
    ADD COLUMN IF NOT EXISTS account_id uuid,
    ADD COLUMN IF NOT EXISTS deal_id    uuid;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'lead_activities'
          AND column_name  = 'subject'
    ) THEN
        -- Free-text "subject" matches crm_activities so the collapsed writer
        -- can populate it without losing quick-log context (e.g. "Left VM").
        ALTER TABLE public.lead_activities ADD COLUMN subject text;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lead_activities_contact
    ON public.lead_activities(contact_id)
    WHERE contact_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_activities_account
    ON public.lead_activities(account_id)
    WHERE account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_activities_deal
    ON public.lead_activities(deal_id)
    WHERE deal_id IS NOT NULL;

-- The baseline `lead_id NOT NULL` is loosened so contact-only or deal-only
-- activity rows can exist. NULL `lead_id` stays rare: most records still come
-- in through a lead. The CHECK below guarantees at least one linkage so we
-- never store truly orphaned rows.
ALTER TABLE public.lead_activities
    ALTER COLUMN lead_id DROP NOT NULL;

ALTER TABLE public.lead_activities
    DROP CONSTRAINT IF EXISTS lead_activities_target_not_null;

ALTER TABLE public.lead_activities
    ADD CONSTRAINT lead_activities_target_not_null CHECK (
        lead_id    IS NOT NULL
        OR contact_id IS NOT NULL
        OR account_id IS NOT NULL
        OR deal_id    IS NOT NULL
    );

-- ----------------------------------------------------------------------------
-- 2. Expand activity_type CHECK to add LinkedIn shorts + text quick-log
-- ----------------------------------------------------------------------------

ALTER TABLE public.lead_activities
    DROP CONSTRAINT IF EXISTS lead_activities_activity_type_check;

ALTER TABLE public.lead_activities
    ADD CONSTRAINT lead_activities_activity_type_check
    CHECK (activity_type IN (
        'note', 'call', 'email', 'meeting', 'sms', 'text',
        'status_change', 'stage_change', 'assignment',
        'task_created', 'task_completed',
        'linkedin_connection_sent', 'linkedin_connection_accepted',
        'linkedin_message', 'linkedin_post', 'linkedin_engagement',
        'linkedin_short',
        'presentation', 'networking_event', 'community_outreach',
        'referral_requested', 'live_chat', 'crm_lead_entered',
        'proposal_sent'
    ));

-- Mirror the expansion on crm_activities so existing writers don't break
-- while we migrate callsites to lead_activities.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'crm_activities'
    ) THEN
        ALTER TABLE public.crm_activities
            DROP CONSTRAINT IF EXISTS crm_activities_activity_type_check;

        ALTER TABLE public.crm_activities
            ADD CONSTRAINT crm_activities_activity_type_check
            CHECK (activity_type IN (
                'call', 'email', 'meeting', 'task', 'note', 'sms', 'text',
                'social', 'webinar', 'demo', 'other',
                'linkedin_connection_sent', 'linkedin_connection_accepted',
                'linkedin_message', 'linkedin_post', 'linkedin_engagement',
                'linkedin_short',
                'presentation', 'networking_event', 'community_outreach',
                'referral_requested', 'live_chat', 'crm_lead_entered',
                'proposal_sent'
            ));
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Stamp outbound email rows with A/B test context
-- ----------------------------------------------------------------------------
-- `crm_email_log` is the outbound row (see 20260127000000_phase2_email_log).
-- Adding ab_test_id + variant is a superset that older writers can ignore.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'crm_email_log'
    ) THEN
        ALTER TABLE public.crm_email_log
            ADD COLUMN IF NOT EXISTS ab_test_id uuid
                REFERENCES public.crm_email_ab_tests(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS ab_variant text
                CHECK (ab_variant IS NULL OR ab_variant IN ('a', 'b'));

        CREATE INDEX IF NOT EXISTS idx_crm_email_log_ab_test
            ON public.crm_email_log(ab_test_id)
            WHERE ab_test_id IS NOT NULL;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Primary shared inbox flag on mail_accounts
-- ----------------------------------------------------------------------------
-- Only one row per org may be flagged; enforced with a partial unique index
-- so multiple orgs can each have their own shared inbox without collision.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'mail_accounts'
    ) THEN
        ALTER TABLE public.mail_accounts
            ADD COLUMN IF NOT EXISTS is_primary_shared_inbox boolean NOT NULL DEFAULT false;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_mail_accounts_primary_shared_inbox
            ON public.mail_accounts(org_id)
            WHERE is_primary_shared_inbox = true;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. Helper RPC: log a lead activity from any entity context
-- ----------------------------------------------------------------------------
-- Centralises the writer so the UI doesn't need to know which column holds
-- the FK. Callers supply whichever of lead/contact/account/deal is known; the
-- helper enforces the CHECK and sets org_id from the lead/contact row when
-- the caller omits it.

CREATE OR REPLACE FUNCTION public.crm_log_activity(
    p_activity_type  text,
    p_title          text,
    p_description    text DEFAULT NULL,
    p_lead_id        uuid DEFAULT NULL,
    p_contact_id     uuid DEFAULT NULL,
    p_account_id     uuid DEFAULT NULL,
    p_deal_id        uuid DEFAULT NULL,
    p_metadata       jsonb DEFAULT '{}'::jsonb,
    p_subject        text DEFAULT NULL,
    p_org_id         uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id uuid := p_org_id;
    v_id     uuid;
BEGIN
    IF v_org_id IS NULL AND p_lead_id IS NOT NULL THEN
        SELECT org_id INTO v_org_id FROM public.lead_submissions WHERE id = p_lead_id;
    END IF;
    IF v_org_id IS NULL AND p_contact_id IS NOT NULL THEN
        SELECT org_id INTO v_org_id FROM public.crm_contacts WHERE id = p_contact_id;
    END IF;
    IF v_org_id IS NULL AND p_deal_id IS NOT NULL THEN
        SELECT org_id INTO v_org_id FROM public.crm_deals WHERE id = p_deal_id;
    END IF;
    IF v_org_id IS NULL AND p_account_id IS NOT NULL THEN
        SELECT org_id INTO v_org_id FROM public.crm_accounts WHERE id = p_account_id;
    END IF;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'crm_log_activity: cannot derive org_id';
    END IF;

    IF NOT public.is_org_member(v_org_id) THEN
        RAISE EXCEPTION 'crm_log_activity: not an org member';
    END IF;

    INSERT INTO public.lead_activities (
        org_id, lead_id, contact_id, account_id, deal_id,
        activity_type, title, description, subject, metadata, created_by
    ) VALUES (
        v_org_id, p_lead_id, p_contact_id, p_account_id, p_deal_id,
        p_activity_type, p_title, p_description, p_subject,
        COALESCE(p_metadata, '{}'::jsonb), auth.uid()
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.crm_log_activity(
    text, text, text, uuid, uuid, uuid, uuid, jsonb, text, uuid
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.crm_log_activity(
    text, text, text, uuid, uuid, uuid, uuid, jsonb, text, uuid
) TO authenticated;

COMMIT;

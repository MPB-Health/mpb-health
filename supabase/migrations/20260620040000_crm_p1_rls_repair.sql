-- ============================================================================
-- CRM rebuild — Phase 1: repair RLS drift on email/sequence/template tables
--
-- Audit (pre-migration) of pg_policy showed:
--
-- public.crm_email_sequences:
--   - "Users can update sequences for their org"   stored as SELECT (cmd='r')
--   - "Users can delete sequences for their org"   stored as SELECT
--   - "Service role full access to email_sequences" stored as ALL (correct)
--   → org members effectively can read but cannot insert/update/delete via
--     the named policies. Replace with explicit FOR <CMD> policies.
--
-- public.message_templates:
--   - "Authenticated users can manage message_templates" stored as ALL
--     with USING true / WITH CHECK true → world-writable for any
--     authenticated user, ignoring org membership. Replace with proper
--     org-scoped policies.
--
-- public.sequences:
--   - Only sequences_select FOR SELECT USING true → world-readable. Replace
--     with org-scoped SELECT and add proper write policies.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- crm_email_sequences
-- ----------------------------------------------------------------------------

ALTER TABLE public.crm_email_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sequences for their org"   ON public.crm_email_sequences;
DROP POLICY IF EXISTS "Users can update sequences for their org" ON public.crm_email_sequences;
DROP POLICY IF EXISTS "Users can delete sequences for their org" ON public.crm_email_sequences;
DROP POLICY IF EXISTS "Users can insert sequences for their org" ON public.crm_email_sequences;
DROP POLICY IF EXISTS crm_email_sequences_select ON public.crm_email_sequences;
DROP POLICY IF EXISTS crm_email_sequences_insert ON public.crm_email_sequences;
DROP POLICY IF EXISTS crm_email_sequences_update ON public.crm_email_sequences;
DROP POLICY IF EXISTS crm_email_sequences_delete ON public.crm_email_sequences;

CREATE POLICY crm_email_sequences_select ON public.crm_email_sequences
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));

CREATE POLICY crm_email_sequences_insert ON public.crm_email_sequences
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'email.templates')
    );

CREATE POLICY crm_email_sequences_update ON public.crm_email_sequences
    FOR UPDATE TO authenticated
    USING (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'email.templates')
    )
    WITH CHECK (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'email.templates')
    );

CREATE POLICY crm_email_sequences_delete ON public.crm_email_sequences
    FOR DELETE TO authenticated
    USING (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'email.templates')
    );

-- Keep the existing service-role full-access policy if it's already there;
-- create one if not.
DROP POLICY IF EXISTS "Service role full access to email_sequences" ON public.crm_email_sequences;
CREATE POLICY crm_email_sequences_service_all ON public.crm_email_sequences
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_email_sequences TO authenticated;
GRANT ALL ON public.crm_email_sequences TO service_role;

-- ----------------------------------------------------------------------------
-- message_templates
-- ----------------------------------------------------------------------------

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage message_templates" ON public.message_templates;
DROP POLICY IF EXISTS message_templates_select ON public.message_templates;
DROP POLICY IF EXISTS message_templates_insert ON public.message_templates;
DROP POLICY IF EXISTS message_templates_update ON public.message_templates;
DROP POLICY IF EXISTS message_templates_delete ON public.message_templates;

CREATE POLICY message_templates_select ON public.message_templates
    FOR SELECT TO authenticated
    USING (public.is_org_member(org_id));

CREATE POLICY message_templates_insert ON public.message_templates
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'email.templates')
    );

CREATE POLICY message_templates_update ON public.message_templates
    FOR UPDATE TO authenticated
    USING (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'email.templates')
    )
    WITH CHECK (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'email.templates')
    );

CREATE POLICY message_templates_delete ON public.message_templates
    FOR DELETE TO authenticated
    USING (
        public.is_org_member(org_id)
        AND public.has_org_permission(org_id, 'email.templates')
    );

CREATE POLICY message_templates_service_all ON public.message_templates
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_templates TO authenticated;
GRANT ALL ON public.message_templates TO service_role;

-- ----------------------------------------------------------------------------
-- sequences (legacy engagement table)
-- ----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'sequences'
    ) THEN
        EXECUTE 'ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY';

        EXECUTE 'DROP POLICY IF EXISTS sequences_select ON public.sequences';
        EXECUTE 'DROP POLICY IF EXISTS sequences_insert ON public.sequences';
        EXECUTE 'DROP POLICY IF EXISTS sequences_update ON public.sequences';
        EXECUTE 'DROP POLICY IF EXISTS sequences_delete ON public.sequences';
        EXECUTE 'DROP POLICY IF EXISTS sequences_service_all ON public.sequences';

        EXECUTE 'CREATE POLICY sequences_select ON public.sequences
                  FOR SELECT TO authenticated
                  USING (public.is_org_member(org_id))';
        EXECUTE 'CREATE POLICY sequences_insert ON public.sequences
                  FOR INSERT TO authenticated
                  WITH CHECK (
                      public.is_org_member(org_id)
                      AND public.has_org_permission(org_id, ''email.templates'')
                  )';
        EXECUTE 'CREATE POLICY sequences_update ON public.sequences
                  FOR UPDATE TO authenticated
                  USING (
                      public.is_org_member(org_id)
                      AND public.has_org_permission(org_id, ''email.templates'')
                  )
                  WITH CHECK (
                      public.is_org_member(org_id)
                      AND public.has_org_permission(org_id, ''email.templates'')
                  )';
        EXECUTE 'CREATE POLICY sequences_delete ON public.sequences
                  FOR DELETE TO authenticated
                  USING (
                      public.is_org_member(org_id)
                      AND public.has_org_permission(org_id, ''email.templates'')
                  )';
        EXECUTE 'CREATE POLICY sequences_service_all ON public.sequences
                  FOR ALL TO service_role
                  USING (true) WITH CHECK (true)';

        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.sequences TO authenticated';
        EXECUTE 'GRANT ALL ON public.sequences TO service_role';
    END IF;
END
$$;

COMMIT;

-- Web Form Builder tables for CRM
-- Allows users to create embeddable web forms that capture leads/contacts

-- =============================================================================
-- crm_web_forms
-- =============================================================================
CREATE TABLE IF NOT EXISTS crm_web_forms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  slug        text NOT NULL UNIQUE,
  entity_type text NOT NULL DEFAULT 'lead' CHECK (entity_type IN ('lead', 'contact')),
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  fields      jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings    jsonb NOT NULL DEFAULT '{}'::jsonb,
  styling     jsonb NOT NULL DEFAULT '{}'::jsonb,
  submit_count      integer NOT NULL DEFAULT 0,
  last_submission_at timestamptz,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
-- Index on slug for public lookup
CREATE INDEX IF NOT EXISTS idx_crm_web_forms_slug ON crm_web_forms(slug);
-- Index on org_id for listing
CREATE INDEX IF NOT EXISTS idx_crm_web_forms_org_id ON crm_web_forms(org_id);
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_crm_web_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_crm_web_forms_updated_at ON crm_web_forms;
CREATE TRIGGER trg_crm_web_forms_updated_at
  BEFORE UPDATE ON crm_web_forms
  FOR EACH ROW EXECUTE FUNCTION update_crm_web_forms_updated_at();
-- =============================================================================
-- crm_web_form_submissions
-- =============================================================================
CREATE TABLE IF NOT EXISTS crm_web_form_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id     uuid NOT NULL REFERENCES crm_web_forms(id) ON DELETE CASCADE,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_url  text,
  ip_address  text,
  user_agent  text,
  lead_id     uuid,
  status      text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'converted', 'duplicate', 'spam')),
  created_at  timestamptz NOT NULL DEFAULT now()
);
-- Index on form_id for listing submissions
CREATE INDEX IF NOT EXISTS idx_crm_web_form_submissions_form_id ON crm_web_form_submissions(form_id);
-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_crm_web_form_submissions_status ON crm_web_form_submissions(status);
-- =============================================================================
-- RLS Policies
-- =============================================================================
ALTER TABLE crm_web_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_web_form_submissions ENABLE ROW LEVEL SECURITY;
-- Forms: org members can CRUD
DROP POLICY IF EXISTS crm_web_forms_select ON crm_web_forms;
CREATE POLICY crm_web_forms_select ON crm_web_forms
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );
DROP POLICY IF EXISTS crm_web_forms_insert ON crm_web_forms;
CREATE POLICY crm_web_forms_insert ON crm_web_forms
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );
DROP POLICY IF EXISTS crm_web_forms_update ON crm_web_forms;
CREATE POLICY crm_web_forms_update ON crm_web_forms
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );
DROP POLICY IF EXISTS crm_web_forms_delete ON crm_web_forms;
CREATE POLICY crm_web_forms_delete ON crm_web_forms
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
  );
-- Public read for active forms (by slug) — needed for public form renderer
DROP POLICY IF EXISTS crm_web_forms_public_read ON crm_web_forms;
CREATE POLICY crm_web_forms_public_read ON crm_web_forms
  FOR SELECT USING (status = 'active');
-- Submissions: publicly insertable (for the public form endpoint)
DROP POLICY IF EXISTS crm_web_form_submissions_insert ON crm_web_form_submissions;
CREATE POLICY crm_web_form_submissions_insert ON crm_web_form_submissions
  FOR INSERT WITH CHECK (true);
-- Submissions: readable only by org members (via form's org_id)
DROP POLICY IF EXISTS crm_web_form_submissions_select ON crm_web_form_submissions;
CREATE POLICY crm_web_form_submissions_select ON crm_web_form_submissions
  FOR SELECT USING (
    form_id IN (
      SELECT id FROM crm_web_forms
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );
-- Submissions: updatable by org members (for status changes)
DROP POLICY IF EXISTS crm_web_form_submissions_update ON crm_web_form_submissions;
CREATE POLICY crm_web_form_submissions_update ON crm_web_form_submissions
  FOR UPDATE USING (
    form_id IN (
      SELECT id FROM crm_web_forms
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );
-- Submissions: deletable by org members
DROP POLICY IF EXISTS crm_web_form_submissions_delete ON crm_web_form_submissions;
CREATE POLICY crm_web_form_submissions_delete ON crm_web_form_submissions
  FOR DELETE USING (
    form_id IN (
      SELECT id FROM crm_web_forms
      WHERE org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid())
    )
  );

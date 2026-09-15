-- Phase 2: CRM Email Log
-- Tracks all emails sent from the CRM (templates, AI drafts, direct)

CREATE TABLE IF NOT EXISTS crm_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID,
  lead_id UUID REFERENCES zoho_lead_submissions(id) ON DELETE SET NULL,
  template_id UUID REFERENCES crm_templates(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  body_preview TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','failed','bounced')),
  resend_email_id TEXT,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for common lookups
CREATE INDEX idx_crm_email_log_lead ON crm_email_log(lead_id);
CREATE INDEX idx_crm_email_log_template ON crm_email_log(template_id);
CREATE INDEX idx_crm_email_log_org ON crm_email_log(org_id);
CREATE INDEX idx_crm_email_log_sent_at ON crm_email_log(sent_at DESC);
-- RLS
ALTER TABLE crm_email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view email logs"
  ON crm_email_log FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Authenticated users can insert email logs"
  ON crm_email_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- Inbound Email System
-- Adds support for receiving inbound emails via Resend Inbound webhooks
-- Extends crm_email_log with RFC headers for thread matching
-- Creates routing rules table for email assignment/labeling
-- ============================================================================

-- ============================================================================
-- PART 1: Add inbound email columns to crm_email_log
-- ============================================================================

ALTER TABLE crm_email_log
  ADD COLUMN IF NOT EXISTS message_id text,
  ADD COLUMN IF NOT EXISTS in_reply_to text,
  ADD COLUMN IF NOT EXISTS references_header text,
  ADD COLUMN IF NOT EXISTS inbound_address text;

COMMENT ON COLUMN crm_email_log.message_id IS 'RFC 2822 Message-ID header for thread matching';
COMMENT ON COLUMN crm_email_log.in_reply_to IS 'RFC 2822 In-Reply-To header linking to parent message';
COMMENT ON COLUMN crm_email_log.references_header IS 'RFC 2822 References header for full thread chain';
COMMENT ON COLUMN crm_email_log.inbound_address IS 'The address that received the inbound email';

-- ============================================================================
-- PART 2: Indexes for inbound email queries
-- ============================================================================

-- Thread matching: look up emails by their Message-ID
CREATE INDEX IF NOT EXISTS idx_crm_email_log_message_id
  ON crm_email_log(message_id)
  WHERE message_id IS NOT NULL;

-- Inbox queries: filter by direction (inbound vs outbound)
CREATE INDEX IF NOT EXISTS idx_crm_email_log_direction
  ON crm_email_log(direction);

-- Unread count: quickly count unread emails
CREATE INDEX IF NOT EXISTS idx_crm_email_log_is_read
  ON crm_email_log(is_read)
  WHERE is_read = false;

-- ============================================================================
-- PART 3: Email Routing Rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  inbound_address text NOT NULL,
  action text NOT NULL DEFAULT 'assign'
    CHECK (action IN ('assign', 'label', 'forward')),
  action_config jsonb DEFAULT '{}'::jsonb,
  /*
    action_config examples:
    - assign:  { "assign_to_user_id": "uuid", "assign_to_team": "sales" }
    - label:   { "labels": ["urgent", "sales-inquiry"] }
    - forward: { "forward_to": "team@company.com", "keep_copy": true }
  */
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_email_routing_rules_org
  ON crm_email_routing_rules(org_id);

CREATE INDEX IF NOT EXISTS idx_crm_email_routing_rules_address
  ON crm_email_routing_rules(inbound_address)
  WHERE is_active = true;

-- ============================================================================
-- PART 4: RLS for crm_email_routing_rules
-- ============================================================================

ALTER TABLE crm_email_routing_rules ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read routing rules for their org
CREATE POLICY "Users can view their org routing rules"
  ON crm_email_routing_rules
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can insert routing rules for their org
CREATE POLICY "Users can create routing rules for their org"
  ON crm_email_routing_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can update routing rules for their org
CREATE POLICY "Users can update their org routing rules"
  ON crm_email_routing_rules
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can delete routing rules for their org
CREATE POLICY "Users can delete their org routing rules"
  ON crm_email_routing_rules
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 5: Updated timestamp trigger for routing rules
-- ============================================================================

CREATE OR REPLACE FUNCTION update_routing_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_routing_rules_updated ON crm_email_routing_rules;
CREATE TRIGGER trigger_routing_rules_updated
  BEFORE UPDATE ON crm_email_routing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_routing_rules_updated_at();

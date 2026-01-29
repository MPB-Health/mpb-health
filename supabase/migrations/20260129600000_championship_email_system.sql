/*
  # Championship Email System

  Full Outlook-like email capabilities for CRM:
  - Email signatures with logo support
  - File attachments via Supabase Storage
  - Email drafts
  - Email threads/conversations
  - Inbox management (sent, drafts, archived)
  - Rich text content storage

  ## Integrates with Resend for:
  - Transactional emails
  - Tracking (opens, clicks)
  - Delivery status webhooks
*/

-- ============================================================================
-- PART 1: Email Signatures
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,

  -- Signature details
  name text NOT NULL,                      -- "Default Signature", "Sales Signature"
  is_default boolean DEFAULT false,

  -- Signature content (HTML with placeholders)
  content text NOT NULL,
  /*
  Example:
  <div style="font-family: Arial, sans-serif;">
    <p><strong>{{user_name}}</strong><br>
    {{user_title}}</p>
    <p>{{company_name}}<br>
    {{phone}} | {{email}}</p>
    {{#if logo_url}}<img src="{{logo_url}}" alt="Logo" style="max-height: 60px;">{{/if}}
    <p style="color: #666; font-size: 12px;">{{tagline}}</p>
  </div>
  */

  -- Signature variables (user-customizable)
  variables jsonb DEFAULT '{}'::jsonb,
  /*
  {
    "user_name": "John Smith",
    "user_title": "Sales Representative",
    "company_name": "MPB Health",
    "phone": "(555) 123-4567",
    "email": "john@mpbhealth.com",
    "tagline": "Your trusted healthcare partner"
  }
  */

  -- Logo (stored in Supabase Storage)
  logo_url text,
  logo_storage_path text,

  -- Banner image (optional)
  banner_url text,
  banner_storage_path text,

  -- Social links
  social_links jsonb DEFAULT '[]'::jsonb,
  /*
  [
    { "platform": "linkedin", "url": "https://linkedin.com/in/..." },
    { "platform": "twitter", "url": "https://twitter.com/..." }
  ]
  */

  -- Style settings
  font_family text DEFAULT 'Arial, sans-serif',
  primary_color text DEFAULT '#6366F1',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_default_signature UNIQUE (user_id, org_id, is_default) DEFERRABLE
);

CREATE INDEX IF NOT EXISTS idx_crm_email_signatures_user ON crm_email_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_signatures_org ON crm_email_signatures(org_id);

-- ============================================================================
-- PART 2: Email Attachments
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid,  -- Set after email is sent/saved
  draft_id uuid,  -- For draft attachments

  -- File info
  file_name text NOT NULL,
  file_type text NOT NULL,          -- MIME type
  file_size integer NOT NULL,       -- Bytes

  -- Storage
  storage_bucket text DEFAULT 'email-attachments',
  storage_path text NOT NULL,       -- Path in Supabase Storage
  public_url text,                  -- Signed URL or public URL

  -- Metadata
  checksum text,                    -- SHA-256 for deduplication

  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_email_attachments_email ON crm_email_attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_attachments_draft ON crm_email_attachments(draft_id);

-- ============================================================================
-- PART 3: Email Drafts
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,

  -- Recipients (can be multiple)
  to_addresses text[] DEFAULT '{}',
  cc_addresses text[] DEFAULT '{}',
  bcc_addresses text[] DEFAULT '{}',

  -- Associated lead/contact (optional)
  lead_id uuid REFERENCES zoho_lead_submissions(id) ON DELETE SET NULL,
  contact_id uuid,
  account_id uuid,

  -- Email content
  subject text,
  body_html text,                    -- Rich text content
  body_plain text,                   -- Auto-generated plain text

  -- Template reference (if based on template)
  template_id uuid,

  -- Signature
  signature_id uuid REFERENCES crm_email_signatures(id) ON DELETE SET NULL,
  include_signature boolean DEFAULT true,

  -- Reply/Forward context
  reply_to_email_id uuid,            -- If replying to an email
  forward_from_email_id uuid,        -- If forwarding an email
  thread_id uuid,                    -- Thread this belongs to

  -- Scheduling
  scheduled_send_at timestamptz,     -- If scheduled for later

  -- Metadata
  last_edited_at timestamptz DEFAULT now(),
  auto_saved boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_email_drafts_user ON crm_email_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_drafts_lead ON crm_email_drafts(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_drafts_scheduled ON crm_email_drafts(scheduled_send_at)
  WHERE scheduled_send_at IS NOT NULL;

-- ============================================================================
-- PART 4: Email Threads (Conversations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,

  -- Thread subject (from first email)
  subject text NOT NULL,

  -- Associated entities
  lead_id uuid REFERENCES zoho_lead_submissions(id) ON DELETE SET NULL,
  contact_id uuid,
  account_id uuid,
  deal_id uuid,

  -- Participants (all email addresses in thread)
  participants text[] DEFAULT '{}',

  -- Thread stats
  message_count integer DEFAULT 0,
  last_message_at timestamptz,
  last_message_preview text,

  -- Read status
  has_unread boolean DEFAULT false,

  -- Labels/Tags
  labels text[] DEFAULT '{}',
  is_starred boolean DEFAULT false,
  is_archived boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_email_threads_org ON crm_email_threads(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_threads_lead ON crm_email_threads(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_threads_last_message ON crm_email_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_email_threads_unread ON crm_email_threads(has_unread) WHERE has_unread = true;

-- ============================================================================
-- PART 5: Enhanced Email Log (Messages)
-- ============================================================================

-- Add columns to existing crm_email_log table
ALTER TABLE crm_email_log
  ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES crm_email_threads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS direction text DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  ADD COLUMN IF NOT EXISTS from_address text,
  ADD COLUMN IF NOT EXISTS from_name text,
  ADD COLUMN IF NOT EXISTS to_addresses text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cc_addresses text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bcc_addresses text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS body_html text,
  ADD COLUMN IF NOT EXISTS signature_id uuid REFERENCES crm_email_signatures(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_to_id uuid,
  ADD COLUMN IF NOT EXISTS has_attachments boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS attachment_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS labels text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Foreign key for attachments
ALTER TABLE crm_email_attachments
  ADD CONSTRAINT fk_email_attachments_email
  FOREIGN KEY (email_id) REFERENCES crm_email_log(id) ON DELETE CASCADE;

ALTER TABLE crm_email_attachments
  ADD CONSTRAINT fk_email_attachments_draft
  FOREIGN KEY (draft_id) REFERENCES crm_email_drafts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_crm_email_log_thread ON crm_email_log(thread_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_log_direction ON crm_email_log(direction);
CREATE INDEX IF NOT EXISTS idx_crm_email_log_archived ON crm_email_log(is_archived) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_crm_email_log_starred ON crm_email_log(is_starred) WHERE is_starred = true;

-- ============================================================================
-- PART 6: Email Templates (Enhanced)
-- ============================================================================

-- Add columns to existing crm_templates if needed
ALTER TABLE crm_templates
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_shared boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS preview_text text,
  ADD COLUMN IF NOT EXISTS default_signature_id uuid REFERENCES crm_email_signatures(id) ON DELETE SET NULL;

-- ============================================================================
-- PART 7: RLS Policies
-- ============================================================================

-- Signatures
ALTER TABLE crm_email_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own signatures" ON crm_email_signatures
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all org signatures" ON crm_email_signatures
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Attachments
ALTER TABLE crm_email_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own attachments" ON crm_email_attachments
  FOR ALL TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can view attachments from visible emails" ON crm_email_attachments
  FOR SELECT TO authenticated
  USING (
    email_id IN (
      SELECT id FROM crm_email_log
      WHERE sent_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'superadmin', 'agent')
      )
    )
  );

-- Drafts
ALTER TABLE crm_email_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own drafts" ON crm_email_drafts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Threads
ALTER TABLE crm_email_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org threads" ON crm_email_threads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'agent')
    )
  );

CREATE POLICY "Users can manage org threads" ON crm_email_threads
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- PART 8: Helper Functions
-- ============================================================================

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_email_signature_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_signature_updated ON crm_email_signatures;
CREATE TRIGGER trigger_email_signature_updated
  BEFORE UPDATE ON crm_email_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_email_signature_updated_at();

DROP TRIGGER IF EXISTS trigger_email_draft_updated ON crm_email_drafts;
CREATE TRIGGER trigger_email_draft_updated
  BEFORE UPDATE ON crm_email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_signature_updated_at();

-- Function to render signature with variables
CREATE OR REPLACE FUNCTION render_email_signature(
  p_signature_id uuid,
  p_override_vars jsonb DEFAULT '{}'::jsonb
)
RETURNS text AS $$
DECLARE
  v_signature crm_email_signatures;
  v_result text;
  v_vars jsonb;
  v_key text;
  v_value text;
BEGIN
  -- Get signature
  SELECT * INTO v_signature FROM crm_email_signatures WHERE id = p_signature_id;
  IF NOT FOUND THEN
    RETURN '';
  END IF;

  v_result := v_signature.content;
  v_vars := v_signature.variables || p_override_vars;

  -- Replace variables
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(v_vars)
  LOOP
    v_result := replace(v_result, '{{' || v_key || '}}', COALESCE(v_value, ''));
  END LOOP;

  -- Replace logo placeholder
  IF v_signature.logo_url IS NOT NULL THEN
    v_result := replace(v_result, '{{logo_url}}', v_signature.logo_url);
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create/get thread for email
CREATE OR REPLACE FUNCTION get_or_create_email_thread(
  p_org_id uuid,
  p_subject text,
  p_lead_id uuid DEFAULT NULL,
  p_participants text[] DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  v_thread_id uuid;
  v_normalized_subject text;
BEGIN
  -- Normalize subject (remove Re:, Fwd:, etc.)
  v_normalized_subject := regexp_replace(
    p_subject,
    '^(Re:|Fwd:|FW:|RE:)\s*',
    '',
    'gi'
  );

  -- Look for existing thread
  SELECT id INTO v_thread_id
  FROM crm_email_threads
  WHERE org_id = p_org_id
    AND subject ILIKE '%' || v_normalized_subject || '%'
    AND (p_lead_id IS NULL OR lead_id = p_lead_id)
    AND created_at > now() - interval '30 days'
  ORDER BY last_message_at DESC NULLS LAST
  LIMIT 1;

  -- Create new thread if not found
  IF v_thread_id IS NULL THEN
    INSERT INTO crm_email_threads (org_id, subject, lead_id, participants)
    VALUES (p_org_id, v_normalized_subject, p_lead_id, p_participants)
    RETURNING id INTO v_thread_id;
  ELSE
    -- Update participants
    UPDATE crm_email_threads
    SET participants = array(
      SELECT DISTINCT unnest(participants || p_participants)
    ),
    updated_at = now()
    WHERE id = v_thread_id;
  END IF;

  RETURN v_thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update thread stats after email
CREATE OR REPLACE FUNCTION update_thread_on_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.thread_id IS NOT NULL THEN
    UPDATE crm_email_threads
    SET
      message_count = message_count + 1,
      last_message_at = NEW.sent_at,
      last_message_preview = left(NEW.body_preview, 100),
      has_unread = CASE WHEN NEW.direction = 'inbound' THEN true ELSE has_unread END,
      updated_at = now()
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_thread_on_email ON crm_email_log;
CREATE TRIGGER trigger_update_thread_on_email
  AFTER INSERT ON crm_email_log
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_on_email();

-- ============================================================================
-- PART 9: Storage Bucket Setup
-- ============================================================================

-- Note: Run this in Supabase Dashboard or via API
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'email-attachments',
--   'email-attachments',
--   false,
--   52428800, -- 50MB limit
--   ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/gif',
--         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
--         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
--         'text/plain', 'text/csv']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION render_email_signature(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_email_thread(uuid, text, uuid, text[]) TO authenticated;

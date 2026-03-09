-- ============================================================================
-- Connected Inbox: Mail Accounts + OAuth Token Storage
-- Stores connected M365/Gmail/IMAP accounts with encrypted tokens
-- ============================================================================

-- Provider enum
DO $$ BEGIN
  CREATE TYPE mail_provider AS ENUM ('microsoft365', 'gmail', 'imap');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Account sync status enum
DO $$ BEGIN
  CREATE TYPE mail_sync_status AS ENUM ('idle', 'syncing', 'error', 'disabled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- mail_accounts: Connected email accounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS mail_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider mail_provider NOT NULL,
  email_address text NOT NULL,
  display_name text,

  -- OAuth tokens (encrypted at rest via pgcrypto)
  access_token_encrypted bytea,
  refresh_token_encrypted bytea,
  token_expires_at timestamptz,
  scopes text[] DEFAULT '{}',

  -- IMAP/SMTP config (for non-OAuth providers)
  imap_host text,
  imap_port int,
  smtp_host text,
  smtp_port int,
  imap_use_ssl boolean DEFAULT true,

  -- Sync state
  sync_status mail_sync_status DEFAULT 'idle',
  sync_error text,
  last_sync_at timestamptz,
  -- Microsoft Graph: deltaLink / Gmail: historyId
  delta_token text,

  -- Settings
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  auto_sync boolean DEFAULT true,
  sync_interval_minutes int DEFAULT 5,

  -- Metadata
  provider_account_id text, -- M365 userPrincipalName or Gmail userId
  avatar_url text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT mail_accounts_unique_email UNIQUE (org_id, email_address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mail_accounts_org ON mail_accounts(org_id);
CREATE INDEX IF NOT EXISTS idx_mail_accounts_user ON mail_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_mail_accounts_sync ON mail_accounts(sync_status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_mail_accounts_next_sync ON mail_accounts(last_sync_at) WHERE auto_sync = true AND is_active = true;

-- RLS
ALTER TABLE mail_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mail_accounts_select ON mail_accounts;
CREATE POLICY mail_accounts_select ON mail_accounts
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM mail_shared_access
      WHERE mail_shared_access.account_id = mail_accounts.id
      AND mail_shared_access.grantee_user_id = auth.uid()
      AND mail_shared_access.is_active = true
    )
  );

DROP POLICY IF EXISTS mail_accounts_insert ON mail_accounts;
CREATE POLICY mail_accounts_insert ON mail_accounts
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS mail_accounts_update ON mail_accounts;
CREATE POLICY mail_accounts_update ON mail_accounts
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS mail_accounts_delete ON mail_accounts;
CREATE POLICY mail_accounts_delete ON mail_accounts
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- mail_shared_access: Shared mailbox / delegated access grants
-- ============================================================================
CREATE TABLE IF NOT EXISTS mail_shared_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
  grantee_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL DEFAULT 'read', -- read | send | full
  granted_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT mail_shared_access_unique UNIQUE (account_id, grantee_user_id)
);

ALTER TABLE mail_shared_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mail_shared_access_owner ON mail_shared_access;
CREATE POLICY mail_shared_access_owner ON mail_shared_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mail_accounts
      WHERE mail_accounts.id = mail_shared_access.account_id
      AND mail_accounts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS mail_shared_access_grantee ON mail_shared_access;
CREATE POLICY mail_shared_access_grantee ON mail_shared_access
  FOR SELECT USING (grantee_user_id = auth.uid());

-- ============================================================================
-- mail_folders: Synced folders/labels from providers
-- ============================================================================
CREATE TABLE IF NOT EXISTS mail_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
  provider_folder_id text NOT NULL, -- Graph folder ID or Gmail label ID
  name text NOT NULL,
  display_name text,
  parent_folder_id uuid REFERENCES mail_folders(id),
  folder_type text, -- inbox, sent, drafts, trash, junk, archive, custom
  unread_count int DEFAULT 0,
  total_count int DEFAULT 0,
  is_hidden boolean DEFAULT false,
  sort_order int DEFAULT 0,
  -- Gmail-specific
  label_color text,
  -- Sync
  delta_token text,
  last_sync_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT mail_folders_unique UNIQUE (account_id, provider_folder_id)
);

CREATE INDEX IF NOT EXISTS idx_mail_folders_account ON mail_folders(account_id);
CREATE INDEX IF NOT EXISTS idx_mail_folders_type ON mail_folders(account_id, folder_type);

ALTER TABLE mail_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mail_folders_access ON mail_folders;
CREATE POLICY mail_folders_access ON mail_folders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mail_accounts
      WHERE mail_accounts.id = mail_folders.account_id
      AND (
        mail_accounts.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM mail_shared_access
          WHERE mail_shared_access.account_id = mail_accounts.id
          AND mail_shared_access.grantee_user_id = auth.uid()
          AND mail_shared_access.is_active = true
        )
      )
    )
  );

-- ============================================================================
-- mail_messages: Synced messages (metadata + optional cached body)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mail_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES mail_folders(id) ON DELETE SET NULL,
  provider_message_id text NOT NULL,
  provider_thread_id text,
  internet_message_id text, -- RFC 2822 Message-ID
  in_reply_to text, -- RFC 2822 In-Reply-To

  -- Addresses
  from_address text,
  from_name text,
  to_addresses jsonb DEFAULT '[]', -- [{email, name}]
  cc_addresses jsonb DEFAULT '[]',
  bcc_addresses jsonb DEFAULT '[]',
  reply_to_address text,

  -- Content
  subject text,
  snippet text, -- Preview text (first ~200 chars)
  body_html text, -- Cached full HTML body
  body_text text, -- Cached plain text body
  importance text DEFAULT 'normal', -- low, normal, high

  -- Flags
  is_read boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  is_draft boolean DEFAULT false,
  has_attachments boolean DEFAULT false,

  -- Categories/labels
  categories text[] DEFAULT '{}',

  -- Dates
  sent_at timestamptz,
  received_at timestamptz,

  -- Tracking (for outbound via CRM)
  crm_email_log_id uuid, -- Link back to crm_email_log if sent via CRM
  tracking_id text,

  -- Sync metadata
  provider_metadata jsonb DEFAULT '{}',
  body_fetched boolean DEFAULT false, -- Whether full body has been cached

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT mail_messages_unique UNIQUE (account_id, provider_message_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_mail_messages_account ON mail_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_mail_messages_folder ON mail_messages(folder_id);
CREATE INDEX IF NOT EXISTS idx_mail_messages_thread ON mail_messages(account_id, provider_thread_id);
CREATE INDEX IF NOT EXISTS idx_mail_messages_received ON mail_messages(account_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_messages_unread ON mail_messages(account_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_mail_messages_flagged ON mail_messages(account_id) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_mail_messages_from ON mail_messages(from_address);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_mail_messages_fts ON mail_messages
  USING gin(to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(snippet, '') || ' ' || coalesce(from_name, '') || ' ' || coalesce(from_address, '')));

ALTER TABLE mail_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mail_messages_access ON mail_messages;
CREATE POLICY mail_messages_access ON mail_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mail_accounts
      WHERE mail_accounts.id = mail_messages.account_id
      AND (
        mail_accounts.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM mail_shared_access
          WHERE mail_shared_access.account_id = mail_accounts.id
          AND mail_shared_access.grantee_user_id = auth.uid()
          AND mail_shared_access.is_active = true
        )
      )
    )
  );

-- ============================================================================
-- mail_message_attachments: Attachment metadata for synced messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS mail_message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES mail_messages(id) ON DELETE CASCADE,
  provider_attachment_id text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  content_type text,
  content_id text, -- For inline attachments
  is_inline boolean DEFAULT false,
  -- Optional: cached in Supabase Storage
  storage_path text,
  cached_at timestamptz,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mail_message_attachments_msg ON mail_message_attachments(message_id);

ALTER TABLE mail_message_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mail_message_attachments_access ON mail_message_attachments;
CREATE POLICY mail_message_attachments_access ON mail_message_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mail_messages m
      JOIN mail_accounts a ON a.id = m.account_id
      WHERE m.id = mail_message_attachments.message_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM mail_shared_access
          WHERE mail_shared_access.account_id = a.id
          AND mail_shared_access.grantee_user_id = auth.uid()
          AND mail_shared_access.is_active = true
        )
      )
    )
  );

-- ============================================================================
-- mail_rules: Inbox rules engine
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE mail_rule_action AS ENUM (
    'move_to_folder', 'add_label', 'remove_label',
    'mark_read', 'mark_flagged', 'forward', 'delete',
    'auto_reply', 'assign_to_user'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS mail_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  priority int DEFAULT 0,
  stop_processing boolean DEFAULT false, -- Stop other rules after this one matches

  -- Conditions (all must match = AND logic)
  conditions jsonb NOT NULL DEFAULT '[]',
  -- Example: [
  --   {"field": "from", "operator": "contains", "value": "newsletter"},
  --   {"field": "subject", "operator": "starts_with", "value": "RE:"}
  -- ]

  -- Actions
  actions jsonb NOT NULL DEFAULT '[]',
  -- Example: [
  --   {"type": "move_to_folder", "folder_id": "..."},
  --   {"type": "mark_read"}
  -- ]

  -- Stats
  times_applied int DEFAULT 0,
  last_applied_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mail_rules_account ON mail_rules(account_id);
CREATE INDEX IF NOT EXISTS idx_mail_rules_active ON mail_rules(account_id, is_active, priority);

ALTER TABLE mail_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mail_rules_access ON mail_rules;
CREATE POLICY mail_rules_access ON mail_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mail_accounts
      WHERE mail_accounts.id = mail_rules.account_id
      AND mail_accounts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- mail_domains: Custom sender domains with SPF/DKIM/DMARC verification
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE domain_verification_status AS ENUM ('pending', 'verified', 'failed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS mail_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain text NOT NULL,

  -- Verification status
  spf_status domain_verification_status DEFAULT 'pending',
  spf_record text, -- Expected SPF record
  spf_verified_at timestamptz,

  dkim_status domain_verification_status DEFAULT 'pending',
  dkim_selector text, -- e.g., "mpb" or "resend"
  dkim_record text, -- Expected DKIM TXT record
  dkim_verified_at timestamptz,

  dmarc_status domain_verification_status DEFAULT 'pending',
  dmarc_record text, -- Expected DMARC record
  dmarc_verified_at timestamptz,

  mx_status domain_verification_status DEFAULT 'pending',
  mx_verified_at timestamptz,

  -- Overall
  is_verified boolean GENERATED ALWAYS AS (
    spf_status = 'verified' AND dkim_status = 'verified'
  ) STORED,
  verification_token text DEFAULT encode(gen_random_bytes(16), 'hex'),
  last_check_at timestamptz,
  next_check_at timestamptz,

  -- Sender identities on this domain
  -- (stored separately but domain must be verified first)

  -- Compliance
  compliance_footer text, -- HIPAA/regulatory footer injected for this domain

  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT mail_domains_unique UNIQUE (org_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_mail_domains_org ON mail_domains(org_id);
CREATE INDEX IF NOT EXISTS idx_mail_domains_pending ON mail_domains(next_check_at) WHERE is_active = true;

ALTER TABLE mail_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mail_domains_select ON mail_domains;
CREATE POLICY mail_domains_select ON mail_domains
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = mail_domains.org_id
      AND org_memberships.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS mail_domains_manage ON mail_domains;
CREATE POLICY mail_domains_manage ON mail_domains
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = mail_domains.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- mail_sender_identities: From addresses per verified domain
-- ============================================================================
CREATE TABLE IF NOT EXISTS mail_sender_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES mail_domains(id) ON DELETE CASCADE,
  email_address text NOT NULL,
  display_name text,
  is_default boolean DEFAULT false,
  signature_id uuid, -- Default signature for this identity
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),

  CONSTRAINT mail_sender_identities_unique UNIQUE (org_id, email_address)
);

ALTER TABLE mail_sender_identities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mail_sender_identities_access ON mail_sender_identities;
CREATE POLICY mail_sender_identities_access ON mail_sender_identities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = mail_sender_identities.org_id
      AND org_memberships.user_id = auth.uid()
    )
  );

-- ============================================================================
-- mail_sync_jobs: Queue for sync operations
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE mail_job_type AS ENUM ('full_sync', 'delta_sync', 'send', 'fetch_body', 'webhook_process');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE mail_job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS mail_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
  job_type mail_job_type NOT NULL,
  status mail_job_status DEFAULT 'pending',
  priority int DEFAULT 0,
  payload jsonb DEFAULT '{}',
  result jsonb,
  error text,
  attempts int DEFAULT 0,
  max_attempts int DEFAULT 3,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mail_sync_jobs_pending ON mail_sync_jobs(status, priority DESC, created_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_mail_sync_jobs_account ON mail_sync_jobs(account_id);

ALTER TABLE mail_sync_jobs ENABLE ROW LEVEL SECURITY;

-- Jobs are managed by service role; users can view their own
DROP POLICY IF EXISTS mail_sync_jobs_select ON mail_sync_jobs;
CREATE POLICY mail_sync_jobs_select ON mail_sync_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mail_accounts
      WHERE mail_accounts.id = mail_sync_jobs.account_id
      AND mail_accounts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- mail_audit_log: Audit trail for all mail operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS mail_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  user_id uuid,
  account_id uuid REFERENCES mail_accounts(id) ON DELETE SET NULL,
  action text NOT NULL, -- send, sync, token_refresh, domain_verify, rule_apply, etc.
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mail_audit_log_org ON mail_audit_log(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_audit_log_account ON mail_audit_log(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_audit_log_action ON mail_audit_log(action, created_at DESC);

ALTER TABLE mail_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mail_audit_log_select ON mail_audit_log;
CREATE POLICY mail_audit_log_select ON mail_audit_log
  FOR SELECT USING (user_id = auth.uid());

-- Service role insert only (no user-facing writes)

-- ============================================================================
-- Helper function: Encrypt/decrypt tokens using pgcrypto
-- ============================================================================
CREATE OR REPLACE FUNCTION encrypt_token(token text, key text)
RETURNS bytea
LANGUAGE sql IMMUTABLE SECURITY DEFINER
SET search_path = extensions, public
AS $$
  SELECT pgp_sym_encrypt(token, key)
$$;

CREATE OR REPLACE FUNCTION decrypt_token(encrypted bytea, key text)
RETURNS text
LANGUAGE sql IMMUTABLE SECURITY DEFINER
SET search_path = extensions, public
AS $$
  SELECT pgp_sym_decrypt(encrypted, key)
$$;

-- ============================================================================
-- Updated_at trigger for all new tables
-- ============================================================================
CREATE OR REPLACE FUNCTION update_mail_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER mail_accounts_updated_at BEFORE UPDATE ON mail_accounts
    FOR EACH ROW EXECUTE FUNCTION update_mail_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER mail_folders_updated_at BEFORE UPDATE ON mail_folders
    FOR EACH ROW EXECUTE FUNCTION update_mail_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER mail_messages_updated_at BEFORE UPDATE ON mail_messages
    FOR EACH ROW EXECUTE FUNCTION update_mail_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER mail_rules_updated_at BEFORE UPDATE ON mail_rules
    FOR EACH ROW EXECUTE FUNCTION update_mail_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER mail_domains_updated_at BEFORE UPDATE ON mail_domains
    FOR EACH ROW EXECUTE FUNCTION update_mail_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Enable pgcrypto extension (needed for token encryption)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

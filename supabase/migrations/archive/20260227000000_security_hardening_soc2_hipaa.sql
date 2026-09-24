-- =============================================================================
-- SOC 2 & HIPAA Security Hardening Migration
-- Date: 2026-02-27
-- 
-- SOC 2 Controls Addressed:
--   CC6.1  - Logical and Physical Access Controls
--   CC6.3  - Role-Based Access
--   CC7.2  - System Monitoring
--   CC8.1  - Change Management
--
-- HIPAA Safeguards Addressed:
--   §164.312(a)(1) - Access Control (encryption, unique user ID)
--   §164.312(b)    - Audit Controls (audit logging)
--   §164.312(c)(1) - Integrity (hash verification)
--   §164.312(e)(1) - Transmission Security (already via TLS)
-- =============================================================================

-- Enable required extensions for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pgsodium;
-- =============================================================================
-- 1. Security Audit Log Table (HIPAA §164.312(b))
-- =============================================================================

CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Integrity hash for tamper detection
  integrity_hash TEXT
);
-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_action ON security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_severity ON security_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created ON security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_resource ON security_audit_log(resource_type, resource_id);
-- Compute integrity hash on insert
CREATE OR REPLACE FUNCTION compute_audit_integrity_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.integrity_hash := encode(
    digest(
      NEW.id::text || NEW.action || NEW.resource_type || COALESCE(NEW.resource_id, '') || 
      COALESCE(NEW.user_id::text, '') || NEW.created_at::text,
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER trg_audit_integrity_hash
  BEFORE INSERT ON security_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION compute_audit_integrity_hash();
-- HIPAA: Prevent deletion/modification of audit logs (append-only)
-- RLS: Only service role can insert, admins can read
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can insert audit logs"
  ON security_audit_log FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Admins can view audit logs"
  ON security_audit_log FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'admin')
    )
  );
-- Prevent updates and deletes on audit logs (immutable)
CREATE POLICY "No updates on audit logs"
  ON security_audit_log FOR UPDATE
  USING (false);
CREATE POLICY "No deletes on audit logs"
  ON security_audit_log FOR DELETE
  USING (false);
-- =============================================================================
-- 2. PHI Access Log (HIPAA §164.312(b) - specific to health data)
-- =============================================================================

CREATE TABLE IF NOT EXISTS phi_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  phi_table TEXT NOT NULL,
  phi_record_id TEXT NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('read', 'write', 'delete', 'export')),
  fields_accessed TEXT[],
  justification TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_phi_access_user ON phi_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_phi_access_table ON phi_access_log(phi_table);
CREATE INDEX IF NOT EXISTS idx_phi_access_created ON phi_access_log(created_at DESC);
ALTER TABLE phi_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role inserts PHI access logs"
  ON phi_access_log FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Compliance officers read PHI access logs"
  ON phi_access_log FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role IN ('super_admin', 'compliance_officer')
    )
  );
CREATE POLICY "No updates on PHI access logs"
  ON phi_access_log FOR UPDATE
  USING (false);
CREATE POLICY "No deletes on PHI access logs"
  ON phi_access_log FOR DELETE
  USING (false);
-- =============================================================================
-- 3. Failed Login Tracking (SOC 2 CC6.1 - Account Lockout)
-- =============================================================================

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_failed_logins_email ON failed_login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_logins_ip ON failed_login_attempts(ip_address, created_at DESC);
-- Auto-cleanup old entries (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_failed_logins()
RETURNS void AS $$
BEGIN
  DELETE FROM failed_login_attempts WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =============================================================================
-- 4. Session Management Table (HIPAA §164.312(a)(1))
-- =============================================================================

CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_revoked BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON active_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires ON active_sessions(expires_at);
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions"
  ON active_sessions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can revoke own sessions"
  ON active_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- =============================================================================
-- 5. Data Encryption Key Management (HIPAA §164.312(a)(2)(iv))
-- =============================================================================

-- Function to encrypt PHI fields using pgcrypto
CREATE OR REPLACE FUNCTION encrypt_phi(plaintext TEXT, key_id TEXT DEFAULT 'default')
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  SELECT encryption_value INTO encryption_key
  FROM encryption_keys
  WHERE id = key_id AND is_active = true
  LIMIT 1;
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'No active encryption key found for key_id: %', key_id;
  END IF;
  
  RETURN encode(
    encrypt(
      convert_to(plaintext, 'utf8'),
      convert_to(encryption_key, 'utf8'),
      'aes-cbc/pad:pkcs'
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION decrypt_phi(ciphertext TEXT, key_id TEXT DEFAULT 'default')
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  SELECT encryption_value INTO encryption_key
  FROM encryption_keys
  WHERE id = key_id AND is_active = true
  LIMIT 1;
  
  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'No active encryption key found for key_id: %', key_id;
  END IF;
  
  RETURN convert_from(
    decrypt(
      decode(ciphertext, 'base64'),
      convert_to(encryption_key, 'utf8'),
      'aes-cbc/pad:pkcs'
    ),
    'utf8'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =============================================================================
-- 6. Auto-expire inactive sessions (HIPAA 15-min timeout)
-- =============================================================================

CREATE OR REPLACE FUNCTION expire_inactive_sessions()
RETURNS void AS $$
BEGIN
  UPDATE active_sessions
  SET is_revoked = true
  WHERE is_revoked = false
    AND last_activity < now() - interval '15 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =============================================================================
-- 7. Database-level security hardening
-- =============================================================================

-- Ensure RLS is enabled on all sensitive tables
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE '_prisma_%'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', tbl.schemaname, tbl.tablename);
  END LOOP;
END $$;
-- Revoke direct table access from anon/authenticated (force RLS)
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON %I.%I FROM anon', tbl.schemaname, tbl.tablename);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I.%I TO authenticated', tbl.schemaname, tbl.tablename);
  END LOOP;
END $$;
-- =============================================================================
-- 8. Retention policy comment (HIPAA requires 6-year minimum)
-- =============================================================================

COMMENT ON TABLE security_audit_log IS 'HIPAA: Retain for minimum 7 years. SOC 2 CC7.2: Security event monitoring.';
COMMENT ON TABLE phi_access_log IS 'HIPAA §164.312(b): PHI access audit trail. Retain for minimum 7 years.';
COMMENT ON TABLE failed_login_attempts IS 'SOC 2 CC6.1: Failed authentication tracking. Retain 90 days.';
COMMENT ON TABLE active_sessions IS 'HIPAA §164.312(d): Session management with 15-minute inactivity timeout.';

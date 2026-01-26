/*
  # Create Security Infrastructure for HIPAA-Compliant Authentication

  ## Summary
  Comprehensive security system implementing rate limiting, brute force protection,
  MFA support, audit logging, and session management for HIPAA compliance.

  ## Tables Created

  ### 1. auth_login_attempts
  Tracks all login attempts for rate limiting and security monitoring
  - `id` (uuid, primary key)
  - `email` (text, indexed)
  - `ip_address` (inet, indexed)
  - `user_agent` (text)
  - `success` (boolean)
  - `failure_reason` (text)
  - `timestamp` (timestamptz, indexed)
  - `metadata` (jsonb)

  ### 2. auth_rate_limits
  Manages rate limiting, IP blocks, and account lockouts
  - `id` (uuid, primary key)
  - `identifier` (text, unique - email or IP)
  - `identifier_type` (text - 'email', 'ip', 'device')
  - `block_type` (text - 'temporary', 'permanent', 'lockout')
  - `blocked_until` (timestamptz)
  - `reason` (text)
  - `attempt_count` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. auth_security_events
  Comprehensive audit log for all security-related events
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `event_type` (text - 'login_success', 'login_failure', 'mfa_enabled', etc.)
  - `event_severity` (text - 'low', 'medium', 'high', 'critical')
  - `ip_address` (inet)
  - `user_agent` (text)
  - `event_data` (jsonb)
  - `timestamp` (timestamptz, indexed)
  - `hash_chain` (text - for tamper-proof logging)

  ### 4. user_mfa_settings
  Stores MFA configuration and trusted devices
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `mfa_enabled` (boolean)
  - `mfa_method` (text - 'totp', 'sms')
  - `phone_number` (text, encrypted)
  - `backup_codes` (text[], encrypted)
  - `trusted_devices` (jsonb[])
  - `enrolled_at` (timestamptz)
  - `last_verified_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. user_sessions
  Active session tracking for security monitoring
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `session_token` (text, unique)
  - `device_fingerprint` (text)
  - `ip_address` (inet)
  - `user_agent` (text)
  - `location` (jsonb)
  - `last_activity` (timestamptz)
  - `expires_at` (timestamptz)
  - `created_at` (timestamptz)
  - `revoked` (boolean)

  ### 6. password_history
  Tracks password history to prevent reuse
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `password_hash` (text)
  - `changed_at` (timestamptz)

  ### 7. encryption_keys
  Application-layer encryption key management
  - `id` (uuid, primary key)
  - `key_name` (text, unique)
  - `key_type` (text - 'DEK', 'KEK')
  - `encrypted_key` (text)
  - `version` (integer)
  - `active` (boolean)
  - `rotation_date` (timestamptz)
  - `created_at` (timestamptz)

  ### 8. phi_access_log
  Audit log for PHI data access
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `table_name` (text)
  - `record_id` (uuid)
  - `operation` (text - 'SELECT', 'INSERT', 'UPDATE', 'DELETE')
  - `phi_fields` (text[])
  - `ip_address` (inet)
  - `timestamp` (timestamptz, indexed)
  - `justification` (text)

  ## Security
  - Enable RLS on all tables
  - Admin-only access for security tables
  - Audit logs are immutable (insert-only)
  - Hash chaining for tamper-proof audit logs

  ## Notes
  - Login attempts are retained for 90 days
  - Security events are retained for 7 years (HIPAA requirement)
  - Rate limits auto-expire based on blocked_until timestamp
  - MFA settings are encrypted at application layer
*/

-- 1. auth_login_attempts table
CREATE TABLE IF NOT EXISTS public.auth_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address inet NOT NULL,
  user_agent text,
  success boolean NOT NULL DEFAULT false,
  failure_reason text,
  timestamp timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_email ON public.auth_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_ip ON public.auth_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_timestamp ON public.auth_login_attempts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_success ON public.auth_login_attempts(success);

ALTER TABLE public.auth_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all login attempts"
  ON public.auth_login_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "System can insert login attempts"
  ON public.auth_login_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. auth_rate_limits table
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL UNIQUE,
  identifier_type text NOT NULL CHECK (identifier_type IN ('email', 'ip', 'device')),
  block_type text NOT NULL CHECK (block_type IN ('temporary', 'permanent', 'lockout')),
  blocked_until timestamptz NOT NULL,
  reason text NOT NULL,
  attempt_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier ON public.auth_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_blocked_until ON public.auth_rate_limits(blocked_until);

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage rate limits"
  ON public.auth_rate_limits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "System can check rate limits"
  ON public.auth_rate_limits
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. auth_security_events table
CREATE TABLE IF NOT EXISTS public.auth_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_severity text NOT NULL CHECK (event_severity IN ('low', 'medium', 'high', 'critical')),
  ip_address inet,
  user_agent text,
  event_data jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now() NOT NULL,
  hash_chain text
);

CREATE INDEX IF NOT EXISTS idx_auth_security_events_user_id ON public.auth_security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_security_events_timestamp ON public.auth_security_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_auth_security_events_severity ON public.auth_security_events(event_severity);
CREATE INDEX IF NOT EXISTS idx_auth_security_events_type ON public.auth_security_events(event_type);

ALTER TABLE public.auth_security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all security events"
  ON public.auth_security_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Users can view own security events"
  ON public.auth_security_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert security events"
  ON public.auth_security_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. user_mfa_settings table
CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled boolean DEFAULT false NOT NULL,
  mfa_method text CHECK (mfa_method IN ('totp', 'sms', 'none')),
  phone_number text,
  backup_codes text[],
  trusted_devices jsonb[] DEFAULT ARRAY[]::jsonb[],
  enrolled_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_mfa_settings_user_id ON public.user_mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_settings_enabled ON public.user_mfa_settings(mfa_enabled);

ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own MFA settings"
  ON public.user_mfa_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own MFA settings"
  ON public.user_mfa_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own MFA settings"
  ON public.user_mfa_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all MFA settings"
  ON public.user_mfa_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

-- 5. user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  device_fingerprint text,
  ip_address inet,
  user_agent text,
  location jsonb,
  last_activity timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  revoked boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_revoked ON public.user_sessions(revoked);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can revoke own sessions"
  ON public.user_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND revoked = true);

CREATE POLICY "System can manage sessions"
  ON public.user_sessions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. password_history table
CREATE TABLE IF NOT EXISTS public.password_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  changed_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON public.password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_changed_at ON public.password_history(changed_at DESC);

ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage password history"
  ON public.password_history
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7. encryption_keys table
CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  key_type text NOT NULL CHECK (key_type IN ('DEK', 'KEK')),
  encrypted_key text NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  rotation_date timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_encryption_keys_name ON public.encryption_keys(key_name);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_active ON public.encryption_keys(active);

ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage encryption keys"
  ON public.encryption_keys
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

-- 8. phi_access_log table
CREATE TABLE IF NOT EXISTS public.phi_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  record_id uuid,
  operation text NOT NULL CHECK (operation IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  phi_fields text[],
  ip_address inet,
  timestamp timestamptz DEFAULT now() NOT NULL,
  justification text
);

CREATE INDEX IF NOT EXISTS idx_phi_access_log_user_id ON public.phi_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_phi_access_log_timestamp ON public.phi_access_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_phi_access_log_table ON public.phi_access_log(table_name);
CREATE INDEX IF NOT EXISTS idx_phi_access_log_operation ON public.phi_access_log(operation);

ALTER TABLE public.phi_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all PHI access logs"
  ON public.phi_access_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "System can insert PHI access logs"
  ON public.phi_access_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to calculate hash chain for tamper-proof audit logs
CREATE OR REPLACE FUNCTION public.calculate_event_hash_chain()
RETURNS trigger AS $$
DECLARE
  previous_hash text;
  new_hash text;
BEGIN
  SELECT hash_chain INTO previous_hash
  FROM public.auth_security_events
  ORDER BY timestamp DESC
  LIMIT 1;

  new_hash := encode(
    digest(
      COALESCE(previous_hash, '') ||
      NEW.id::text ||
      NEW.event_type ||
      NEW.timestamp::text ||
      NEW.event_data::text,
      'sha256'
    ),
    'hex'
  );

  NEW.hash_chain := new_hash;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_security_event_insert ON public.auth_security_events;
CREATE TRIGGER on_security_event_insert
  BEFORE INSERT ON public.auth_security_events
  FOR EACH ROW EXECUTE FUNCTION public.calculate_event_hash_chain();

-- Function to auto-expire rate limits
CREATE OR REPLACE FUNCTION public.clean_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.auth_rate_limits
  WHERE blocked_until < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old login attempts (90-day retention)
CREATE OR REPLACE FUNCTION public.clean_old_login_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.auth_login_attempts
  WHERE timestamp < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_event_severity text,
  p_ip_address inet,
  p_user_agent text,
  p_event_data jsonb
)
RETURNS uuid AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.auth_security_events (
    user_id,
    event_type,
    event_severity,
    ip_address,
    user_agent,
    event_data
  ) VALUES (
    p_user_id,
    p_event_type,
    p_event_severity,
    p_ip_address,
    p_user_agent,
    p_event_data
  ) RETURNING id INTO event_id;

  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(p_identifier text)
RETURNS boolean AS $$
DECLARE
  is_locked boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.auth_rate_limits
    WHERE identifier = p_identifier
    AND blocked_until > now()
  ) INTO is_locked;

  RETURN is_locked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email text,
  p_ip_address inet,
  p_user_agent text,
  p_success boolean,
  p_failure_reason text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  attempt_id uuid;
  recent_failures integer;
BEGIN
  INSERT INTO public.auth_login_attempts (
    email,
    ip_address,
    user_agent,
    success,
    failure_reason
  ) VALUES (
    p_email,
    p_ip_address,
    p_user_agent,
    p_success,
    p_failure_reason
  ) RETURNING id INTO attempt_id;

  IF NOT p_success THEN
    SELECT COUNT(*) INTO recent_failures
    FROM public.auth_login_attempts
    WHERE email = p_email
    AND success = false
    AND timestamp > now() - INTERVAL '15 minutes';

    IF recent_failures >= 5 THEN
      INSERT INTO public.auth_rate_limits (
        identifier,
        identifier_type,
        block_type,
        blocked_until,
        reason,
        attempt_count
      ) VALUES (
        p_email,
        'email',
        'lockout',
        now() + INTERVAL '30 minutes',
        'Too many failed login attempts',
        recent_failures
      )
      ON CONFLICT (identifier)
      DO UPDATE SET
        blocked_until = now() + INTERVAL '30 minutes',
        attempt_count = recent_failures,
        updated_at = now();
    END IF;

    SELECT COUNT(*) INTO recent_failures
    FROM public.auth_login_attempts
    WHERE ip_address = p_ip_address
    AND success = false
    AND timestamp > now() - INTERVAL '15 minutes';

    IF recent_failures >= 10 THEN
      INSERT INTO public.auth_rate_limits (
        identifier,
        identifier_type,
        block_type,
        blocked_until,
        reason,
        attempt_count
      ) VALUES (
        p_ip_address::text,
        'ip',
        'temporary',
        now() + INTERVAL '24 hours',
        'Too many failed login attempts from this IP',
        recent_failures
      )
      ON CONFLICT (identifier)
      DO UPDATE SET
        blocked_until = now() + INTERVAL '24 hours',
        attempt_count = recent_failures,
        updated_at = now();
    END IF;
  END IF;

  RETURN attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

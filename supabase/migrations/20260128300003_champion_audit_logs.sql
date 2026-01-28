/*
  # Champion Phase 0: Audit Logs Table

  ## Purpose
  Create audit logging infrastructure to track all user actions.
  Required for compliance and debugging.

  ## Features
  - Tracks actor, action, object type/id
  - Stores old and new values for changes
  - Records IP address and user agent
  - Org-scoped with RLS
*/

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,

  -- Who performed the action
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  actor_role text,

  -- What action was performed
  action text NOT NULL,
  action_category text,

  -- What object was affected
  object_type text NOT NULL,
  object_id uuid,
  object_name text,

  -- Change details
  old_values jsonb,
  new_values jsonb,
  changes_summary text,

  -- Request context
  ip_address inet,
  user_agent text,
  request_id text,

  -- Additional metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_object_type ON audit_logs(object_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_object_id ON audit_logs(object_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_category ON audit_logs(action_category);

-- Composite index for common filter patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created
ON audit_logs(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_object
ON audit_logs(org_id, object_type, object_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Owners and admins can view audit logs for their org
CREATE POLICY "Org admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    user_is_org_owner_or_admin(org_id)
  );

-- System can insert audit logs (via service role or security definer functions)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- No updates or deletes - audit logs are immutable
-- (handled by not creating UPDATE/DELETE policies)

-- ============================================
-- HELPER FUNCTION: LOG AUDIT EVENT
-- ============================================
CREATE OR REPLACE FUNCTION log_audit_event(
  p_org_id uuid,
  p_action text,
  p_object_type text,
  p_object_id uuid DEFAULT NULL,
  p_object_name text DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id uuid;
  v_user_email text;
  v_user_role text;
  v_changes_summary text;
BEGIN
  -- Get actor info
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  SELECT role INTO v_user_role
  FROM org_memberships
  WHERE org_id = p_org_id
  AND user_id = auth.uid()
  AND status = 'active';

  -- Generate changes summary if both old and new values provided
  IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    SELECT string_agg(key || ': ' || COALESCE(p_old_values->>key, 'null') || ' → ' || COALESCE(p_new_values->>key, 'null'), ', ')
    INTO v_changes_summary
    FROM jsonb_object_keys(p_new_values) AS key
    WHERE p_old_values->>key IS DISTINCT FROM p_new_values->>key;
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    org_id,
    actor_user_id,
    actor_email,
    actor_role,
    action,
    action_category,
    object_type,
    object_id,
    object_name,
    old_values,
    new_values,
    changes_summary,
    metadata
  ) VALUES (
    p_org_id,
    auth.uid(),
    v_user_email,
    v_user_role,
    p_action,
    split_part(p_action, '.', 1),
    p_object_type,
    p_object_id,
    p_object_name,
    p_old_values,
    p_new_values,
    v_changes_summary,
    p_metadata
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_audit_event(uuid, text, text, uuid, text, jsonb, jsonb, jsonb) TO authenticated;

-- ============================================
-- ACTION CONSTANTS (for reference)
-- ============================================
COMMENT ON TABLE audit_logs IS 'Immutable audit trail of all user actions.

Standard action naming convention: {category}.{action}

Categories:
- auth: Authentication events (login, logout, password_reset)
- user: User management (create, update, delete, invite)
- lead: Lead operations (create, update, assign, convert, delete)
- contact: Contact operations
- message: Messaging (send, receive, template_use)
- sequence: Sequence operations (create, activate, pause)
- compliance: Compliance events (approval_request, approve, reject)
- settings: Settings changes
- billing: Billing events

Examples:
- auth.login
- auth.logout
- auth.password_reset_request
- user.create
- user.invite
- user.role_change
- lead.create
- lead.stage_change
- lead.assign
- message.send
- sequence.enroll
- compliance.approval_submit
- compliance.approve
';

-- ============================================
-- INDEXES FOR COMMON AUDIT QUERIES
-- ============================================

-- For "show me all actions by user X"
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created
ON audit_logs(actor_user_id, created_at DESC);

-- For "show me all changes to lead Y"
CREATE INDEX IF NOT EXISTS idx_audit_logs_object_created
ON audit_logs(object_type, object_id, created_at DESC);

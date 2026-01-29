-- Enable required extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

/*
  # Champion Phase 0: Organizations & Multi-Tenancy Foundation

  ## Purpose
  Create the multi-tenant foundation for Champion Advisor OS.
  This enables the platform to be licensed to multiple organizations.

  ## New Tables
  - organizations: Tenant/company records
  - org_memberships: User-to-org relationships with roles
  - org_invites: Pending invitations to join an org

  ## Roles
  - owner: Full control, billing, can delete org
  - admin: Manage users, settings, templates, compliance
  - manager: View team data, assign leads, run reports
  - advisor: Standard advisor access
*/

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,

  -- Branding
  logo_url text,
  brand_config jsonb DEFAULT '{
    "primaryColor": "#0D9488",
    "accentColor": "#14B8A6"
  }'::jsonb,

  -- Settings
  settings jsonb DEFAULT '{
    "timezone": "America/New_York",
    "dateFormat": "MM/dd/yyyy",
    "features": {}
  }'::jsonb,

  -- Subscription (for billing phase)
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'cancelled', 'suspended')),
  trial_ends_at timestamptz,

  -- Limits (enforced by app logic)
  max_users integer DEFAULT 5,
  max_contacts integer DEFAULT 1000,
  max_sequences integer DEFAULT 10,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON organizations(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);

-- Updated_at trigger
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ORG MEMBERSHIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS org_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'advisor')),

  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'left')),

  -- Permissions override (optional fine-grained control)
  permissions_override jsonb DEFAULT NULL,

  -- Tracking
  joined_at timestamptz DEFAULT now(),
  suspended_at timestamptz,
  suspended_reason text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_org_user UNIQUE (org_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_id ON org_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id ON org_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_role ON org_memberships(role);
CREATE INDEX IF NOT EXISTS idx_org_memberships_status ON org_memberships(status);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_user_status ON org_memberships(org_id, user_id, status);

-- Updated_at trigger
CREATE TRIGGER update_org_memberships_updated_at
  BEFORE UPDATE ON org_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ORG INVITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS org_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Invite details
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'advisor')),

  -- Token for accepting invite
  token text UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),

  -- Tracking
  invited_by uuid REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id),

  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),

  created_at timestamptz DEFAULT now(),

  -- Prevent duplicate pending invites
  CONSTRAINT unique_pending_invite UNIQUE (org_id, email, status)
    DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_invites_org_id ON org_invites(org_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON org_invites(email);
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON org_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_invites_status ON org_invites(status);
CREATE INDEX IF NOT EXISTS idx_org_invites_expires_at ON org_invites(expires_at);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: ORGANIZATIONS
-- ============================================

-- Users can view orgs they are members of
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = organizations.id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
    )
  );

-- Only owners/admins can update org settings
CREATE POLICY "Owners and admins can update organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = organizations.id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
      AND org_memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = organizations.id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
      AND org_memberships.role IN ('owner', 'admin')
    )
  );

-- Only owners can delete orgs
CREATE POLICY "Only owners can delete organizations"
  ON organizations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = organizations.id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
      AND org_memberships.role = 'owner'
    )
  );

-- Authenticated users can create orgs (they become owner)
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- RLS POLICIES: ORG MEMBERSHIPS
-- ============================================

-- Users can view memberships in their orgs
CREATE POLICY "Users can view memberships in their orgs"
  ON org_memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships AS my_membership
      WHERE my_membership.org_id = org_memberships.org_id
      AND my_membership.user_id = auth.uid()
      AND my_membership.status = 'active'
    )
  );

-- Owners/admins can manage memberships
CREATE POLICY "Owners and admins can manage memberships"
  ON org_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships AS my_membership
      WHERE my_membership.org_id = org_memberships.org_id
      AND my_membership.user_id = auth.uid()
      AND my_membership.status = 'active'
      AND my_membership.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update memberships"
  ON org_memberships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships AS my_membership
      WHERE my_membership.org_id = org_memberships.org_id
      AND my_membership.user_id = auth.uid()
      AND my_membership.status = 'active'
      AND my_membership.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships AS my_membership
      WHERE my_membership.org_id = org_memberships.org_id
      AND my_membership.user_id = auth.uid()
      AND my_membership.status = 'active'
      AND my_membership.role IN ('owner', 'admin')
    )
  );

-- Users can leave orgs (delete their own membership)
CREATE POLICY "Users can leave organizations"
  ON org_memberships FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM org_memberships AS my_membership
      WHERE my_membership.org_id = org_memberships.org_id
      AND my_membership.user_id = auth.uid()
      AND my_membership.status = 'active'
      AND my_membership.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- RLS POLICIES: ORG INVITES
-- ============================================

-- Users can view invites for their orgs
CREATE POLICY "Users can view invites for their orgs"
  ON org_invites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = org_invites.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
    )
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Owners/admins can create invites
CREATE POLICY "Owners and admins can create invites"
  ON org_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = org_invites.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
      AND org_memberships.role IN ('owner', 'admin')
    )
  );

-- Owners/admins can update/cancel invites
CREATE POLICY "Owners and admins can update invites"
  ON org_invites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = org_invites.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
      AND org_memberships.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = org_invites.org_id
      AND org_memberships.user_id = auth.uid()
      AND org_memberships.status = 'active'
      AND org_memberships.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to create an org and add the creator as owner
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name text,
  org_slug text,
  owner_user_id uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create the organization
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  -- Add the creator as owner
  INSERT INTO org_memberships (org_id, user_id, role, status, joined_at)
  VALUES (new_org_id, owner_user_id, 'owner', 'active', now());

  RETURN new_org_id;
END;
$$;

-- Function to accept an invite
CREATE OR REPLACE FUNCTION accept_org_invite(invite_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite org_invites%ROWTYPE;
  v_user_email text;
  v_org_id uuid;
  v_role text;
BEGIN
  -- Get current user's email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  -- Find and validate the invite
  SELECT * INTO v_invite
  FROM org_invites
  WHERE token = invite_token
  AND status = 'pending'
  AND expires_at > now();

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;

  -- Check email matches
  IF v_invite.email != v_user_email THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invite was sent to a different email');
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM org_memberships
    WHERE org_id = v_invite.org_id
    AND user_id = auth.uid()
  ) THEN
    -- Update invite to accepted anyway
    UPDATE org_invites
    SET status = 'accepted', accepted_at = now(), accepted_by = auth.uid()
    WHERE id = v_invite.id;

    RETURN jsonb_build_object('success', true, 'message', 'Already a member', 'org_id', v_invite.org_id);
  END IF;

  -- Create membership
  INSERT INTO org_memberships (org_id, user_id, role, status, joined_at)
  VALUES (v_invite.org_id, auth.uid(), v_invite.role, 'active', now());

  -- Update invite
  UPDATE org_invites
  SET status = 'accepted', accepted_at = now(), accepted_by = auth.uid()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object('success', true, 'org_id', v_invite.org_id, 'role', v_invite.role);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_organization_with_owner(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_org_invite(text) TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE organizations IS 'Multi-tenant organization/company records for Champion';
COMMENT ON TABLE org_memberships IS 'User membership and roles within organizations';
COMMENT ON TABLE org_invites IS 'Pending invitations to join an organization';
COMMENT ON FUNCTION create_organization_with_owner IS 'Creates an org and adds the current user as owner';
COMMENT ON FUNCTION accept_org_invite IS 'Accepts an org invite using the token';

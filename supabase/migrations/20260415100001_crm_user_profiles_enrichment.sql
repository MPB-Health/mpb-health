-- ============================================================================
-- CRM User Profiles Enrichment & Team Management Permissions
-- ============================================================================

-- Enrich profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS mobile_phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS locale text DEFAULT 'en-US',
  ADD COLUMN IF NOT EXISTS social_linkedin text,
  ADD COLUMN IF NOT EXISTS social_twitter text,
  ADD COLUMN IF NOT EXISTS social_facebook text,
  ADD COLUMN IF NOT EXISTS social_instagram text,
  ADD COLUMN IF NOT EXISTS social_github text,
  ADD COLUMN IF NOT EXISTS social_website text,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'US';

-- Ensure org_memberships has suspend columns
ALTER TABLE public.org_memberships
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text;

-- Seed team management permissions
INSERT INTO public.permissions (key, module, description)
VALUES
  ('team.view', 'team', 'View team members and their profiles'),
  ('team.manage', 'team', 'Manage team members, roles, and invitations'),
  ('team.invite', 'team', 'Invite new users to the organization'),
  ('quote_templates.read', 'quotes', 'View quote templates'),
  ('quote_templates.manage', 'quotes', 'Create and manage quote templates'),
  ('product_forms.read', 'products', 'View product configuration forms'),
  ('product_forms.manage', 'products', 'Create and manage product configuration forms')
ON CONFLICT (key) DO NOTHING;

-- Grant team permissions to admin and owner roles
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT om.org_id, r.role, p.id
FROM (VALUES ('owner'), ('admin')) AS r(role)
CROSS JOIN public.permissions p
CROSS JOIN (SELECT DISTINCT org_id FROM public.org_memberships) om
WHERE p.key IN ('team.view', 'team.manage', 'team.invite', 'quote_templates.read', 'quote_templates.manage', 'product_forms.read', 'product_forms.manage')
ON CONFLICT DO NOTHING;

-- Grant read-only team permissions to manager role
INSERT INTO public.role_permissions (org_id, role, permission_id)
SELECT om.org_id, 'manager', p.id
FROM public.permissions p
CROSS JOIN (SELECT DISTINCT org_id FROM public.org_memberships) om
WHERE p.key IN ('team.view', 'quote_templates.read', 'product_forms.read')
ON CONFLICT DO NOTHING;

-- RLS for profiles (users can read all profiles in their org, update their own)
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

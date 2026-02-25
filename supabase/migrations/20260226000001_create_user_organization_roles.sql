-- ============================================================================
-- Migration: Create user_organization_roles
-- Description: Create view + triggers so user_organization_roles works as
--              an alias for org_memberships (referenced in champion migrations)
-- ============================================================================

-- Create view for SELECT (used in RLS policies and get_org_members)
CREATE OR REPLACE VIEW public.user_organization_roles AS
SELECT
  user_id,
  org_id,
  role,
  joined_at AS created_at
FROM org_memberships
WHERE status = 'active';

-- Grant select to authenticated
GRANT SELECT ON public.user_organization_roles TO authenticated;

-- INSTEAD OF INSERT trigger
CREATE OR REPLACE FUNCTION user_organization_roles_insert_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO org_memberships (user_id, org_id, role, status)
  VALUES (NEW.user_id, NEW.org_id, NEW.role, 'active')
  ON CONFLICT (org_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = 'active',
    updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_organization_roles_instead_of_insert
  INSTEAD OF INSERT ON public.user_organization_roles
  FOR EACH ROW
  EXECUTE FUNCTION user_organization_roles_insert_trigger();

-- INSTEAD OF UPDATE trigger
CREATE OR REPLACE FUNCTION user_organization_roles_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE org_memberships
  SET role = NEW.role, updated_at = NOW()
  WHERE user_id = NEW.user_id AND org_id = NEW.org_id AND status = 'active';
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_organization_roles_instead_of_update
  INSTEAD OF UPDATE ON public.user_organization_roles
  FOR EACH ROW
  EXECUTE FUNCTION user_organization_roles_update_trigger();

-- INSTEAD OF DELETE trigger (soft delete: set status = 'left')
CREATE OR REPLACE FUNCTION user_organization_roles_delete_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE org_memberships
  SET status = 'left', updated_at = NOW()
  WHERE user_id = OLD.user_id AND org_id = OLD.org_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER user_organization_roles_instead_of_delete
  INSTEAD OF DELETE ON public.user_organization_roles
  FOR EACH ROW
  EXECUTE FUNCTION user_organization_roles_delete_trigger();

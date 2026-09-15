-- Add concierge role to the user_roles check constraint
-- This allows users to be assigned the 'concierge' role for the Concierge Portal

DO $$
BEGIN
  -- Drop the existing check constraint on user_roles.role if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_roles'
    AND constraint_type = 'CHECK'
    AND constraint_name = 'user_roles_role_check'
  ) THEN
    ALTER TABLE user_roles DROP CONSTRAINT user_roles_role_check;
  END IF;

  -- Re-add with 'concierge' included
  ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
    CHECK (role IN ('super_admin', 'admin', 'advisor', 'member', 'crm_user', 'concierge'));
END $$;
-- Update the get_all_users_with_roles RPC to include concierge users
-- (no changes needed — it returns all roles dynamically)

COMMENT ON CONSTRAINT user_roles_role_check ON user_roles IS
  'Allowed roles: super_admin, admin, advisor, member, crm_user, concierge';

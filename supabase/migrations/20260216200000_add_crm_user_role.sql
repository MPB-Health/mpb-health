-- ============================================================================
-- Migration: Add crm_user role to user_role_type enum
-- Description: Adds 'crm_user' to the user_role_type enum so that super admins
--              can grant CRM portal access from the admin User Management page.
--              Also creates a trigger to auto-sync org_memberships when the
--              crm_user role is granted or revoked.
-- ============================================================================

-- Step 1: Add crm_user to the enum
DO $$ BEGIN
    ALTER TYPE user_role_type ADD VALUE 'crm_user';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

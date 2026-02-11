-- ============================================================================
-- Migration: Unify Role Systems (Part 1 - Add enum values)
-- Description: Add missing enum values to user_role_type.
--              These must be in a separate migration because PostgreSQL
--              does not allow new enum values to be used in the same
--              transaction they are created in.
-- ============================================================================

-- Add missing role types to enum
-- Note: PostgreSQL doesn't allow IF NOT EXISTS for ADD VALUE, so we use DO block
DO $$ BEGIN
    ALTER TYPE user_role_type ADD VALUE 'manager';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE user_role_type ADD VALUE 'staff';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE user_role_type ADD VALUE 'guest';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

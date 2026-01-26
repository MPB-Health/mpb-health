-- ============================================================================
-- Migration: User Roles Management
-- Description: Create user_roles table for role-based access control
-- Roles: super_admin, admin, advisor, member
-- ============================================================================

-- Create enum type for roles
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('super_admin', 'admin', 'advisor', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_type NOT NULL,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow users to read their own roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" 
    ON public.user_roles 
    FOR SELECT 
    TO authenticated 
    USING (user_id = auth.uid());

-- Allow super_admins and admins to read all roles
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
CREATE POLICY "Admins can read all roles" 
    ON public.user_roles 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('super_admin', 'admin')
        )
    );

-- Allow super_admins to insert roles
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
CREATE POLICY "Super admins can insert roles" 
    ON public.user_roles 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'super_admin'
        )
    );

-- Allow super_admins to update roles
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
CREATE POLICY "Super admins can update roles" 
    ON public.user_roles 
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'super_admin'
        )
    );

-- Allow super_admins to delete roles
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;
CREATE POLICY "Super admins can delete roles" 
    ON public.user_roles 
    FOR DELETE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'super_admin'
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trigger_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_roles_updated_at();

-- Helper function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(check_user_id UUID, check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = check_user_id 
        AND role::TEXT = check_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(check_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    roles TEXT[];
BEGIN
    SELECT ARRAY_AGG(role::TEXT) INTO roles
    FROM public.user_roles
    WHERE user_id = check_user_id;
    
    RETURN COALESCE(roles, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles(UUID) TO authenticated;

-- Create a view for easier user management (join with auth.users)
-- Note: This requires access to auth.users which may need service role
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    u.created_at as user_created_at,
    u.last_sign_in_at,
    COALESCE(
        (SELECT ARRAY_AGG(ur.role::TEXT ORDER BY ur.role) 
         FROM public.user_roles ur 
         WHERE ur.user_id = u.id),
        ARRAY[]::TEXT[]
    ) as roles
FROM auth.users u;

-- Grant permissions
GRANT SELECT ON public.users_with_roles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;

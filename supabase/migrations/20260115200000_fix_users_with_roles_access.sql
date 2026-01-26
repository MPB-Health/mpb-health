-- ============================================================================
-- Migration: Fix users_with_roles Access
-- Description: Create a security definer function to allow authenticated 
--              admins to query users with their roles
-- ============================================================================

-- Drop the view if it exists (it won't work from frontend anyway)
DROP VIEW IF EXISTS public.users_with_roles;

-- Create a security definer function that can access auth.users
-- This function runs with the privileges of the function owner (postgres)
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    user_created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow super_admins and admins to call this function
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin role required';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email::TEXT,
        (u.raw_user_meta_data->>'full_name')::TEXT as full_name,
        u.created_at as user_created_at,
        u.last_sign_in_at,
        COALESCE(
            (SELECT ARRAY_AGG(ur.role::TEXT ORDER BY ur.role) 
             FROM public.user_roles ur 
             WHERE ur.user_id = u.id),
            ARRAY[]::TEXT[]
        ) as roles
    FROM auth.users u
    ORDER BY u.email;
END;
$$;

-- Create a function to search users by email
CREATE OR REPLACE FUNCTION public.search_users_with_roles(search_email TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    user_created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow super_admins and admins to call this function
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin role required';
    END IF;

    RETURN QUERY
    SELECT 
        u.id,
        u.email::TEXT,
        (u.raw_user_meta_data->>'full_name')::TEXT as full_name,
        u.created_at as user_created_at,
        u.last_sign_in_at,
        COALESCE(
            (SELECT ARRAY_AGG(ur.role::TEXT ORDER BY ur.role) 
             FROM public.user_roles ur 
             WHERE ur.user_id = u.id),
            ARRAY[]::TEXT[]
        ) as roles
    FROM auth.users u
    WHERE u.email ILIKE '%' || search_email || '%'
    ORDER BY u.email
    LIMIT 50;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_all_users_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users_with_roles(TEXT) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.get_all_users_with_roles() IS 
    'Returns all users with their roles. Only accessible by admins.';
COMMENT ON FUNCTION public.search_users_with_roles(TEXT) IS 
    'Search users by email and return with their roles. Only accessible by admins.';

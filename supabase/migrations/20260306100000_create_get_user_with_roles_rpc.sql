-- Single-user lookup RPC to avoid fetching ALL users for getCrossPortalUser()
CREATE OR REPLACE FUNCTION public.get_user_with_roles(target_user_id UUID)
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
    WHERE u.id = target_user_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_with_roles(UUID) TO authenticated;
COMMENT ON FUNCTION public.get_user_with_roles(UUID) IS
    'Returns a single user with their roles by ID. Only accessible by admins.';

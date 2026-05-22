-- ============================================================================
-- Grant tupac@mympb.com access to the CRM portal
-- ============================================================================
-- Adds the `crm_user` role in `user_roles` for tupac@mympb.com so the user
-- can log in to crm.mpb.health. Idempotent: safe to re-run, no-op if the
-- user doesn't exist or already has the role.
--
-- Note: this grants *portal* access only. To actually use the CRM the user
-- still needs to be a member of at least one org (via `org_memberships`).
-- An org owner/admin can add them through the CRM "Create User" / "Invite"
-- flows once those land — or via SQL if you know the target org_id.
-- ============================================================================

DO $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE lower(email) = 'tupac@mympb.com'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'tupac@mympb.com not found in auth.users — skipping grant. Create the user first, then re-run.';
        RETURN;
    END IF;

    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (v_user_id, 'crm_user', v_user_id)
    ON CONFLICT (user_id, role) DO NOTHING;

    RAISE NOTICE 'Granted crm_user role to tupac@mympb.com (user_id=%)', v_user_id;
END $$;

-- ============================================================================
-- Migration: Add email, full_name, avatar_url to profiles table
-- Many CRM queries select these columns from profiles but they don't exist.
-- Adds columns, backfills from auth.users, and updates the trigger.
-- ============================================================================

BEGIN;
-- 1. Add missing columns (IF NOT EXISTS not supported for ADD COLUMN in all PG versions,
--    so use a DO block)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN full_name text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    END IF;
END $$;
-- 2. Backfill from auth.users
UPDATE public.profiles p
SET
    email     = u.email,
    full_name = COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
    avatar_url = u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.full_name IS NULL);
-- 3. Update trigger to populate these on new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    BEGIN
        INSERT INTO public.profiles (id, role, email, full_name, avatar_url)
        VALUES (
            NEW.id,
            'member',
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
            NEW.raw_user_meta_data->>'avatar_url'
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
            avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user: profiles insert failed for %: %', NEW.id, SQLERRM;
    END;

    BEGIN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'member'::user_role_type)
        ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user: user_roles insert failed for %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. RLS: let authenticated users read profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_authenticated'
    ) THEN
        CREATE POLICY profiles_select_authenticated ON public.profiles
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;
COMMIT;

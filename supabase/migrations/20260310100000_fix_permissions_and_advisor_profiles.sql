-- ============================================================================
-- Fix admin portal 400 errors: permissions (category) and advisor_profiles
-- ============================================================================

-- 1. PERMISSIONS: Add category column as alias for module (backward compatibility)
--    Some code paths still use order=category.asc; the table has 'module'.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'permissions' AND column_name = 'category') THEN
      ALTER TABLE public.permissions ADD COLUMN category text;
      UPDATE public.permissions SET category = module WHERE category IS NULL;
      CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category) WHERE category IS NOT NULL;
      RAISE NOTICE 'Added category column to permissions';
    ELSE
      -- Ensure category is in sync with module
      UPDATE public.permissions SET category = module WHERE category IS DISTINCT FROM module;
    END IF;
  END IF;
END $$;
-- 2. ADVISOR_PROFILES: Add user_id if missing (some queries use or(id.eq, user_id.eq))
--    advisor_profiles.id = auth.users.id; user_id can mirror id for compatibility.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'advisor_profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'advisor_profiles' AND column_name = 'user_id') THEN
      ALTER TABLE public.advisor_profiles ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
      UPDATE public.advisor_profiles SET user_id = id WHERE user_id IS NULL;
      CREATE INDEX IF NOT EXISTS idx_advisor_profiles_user_id ON public.advisor_profiles(user_id) WHERE user_id IS NOT NULL;
      RAISE NOTICE 'Added user_id column to advisor_profiles';
    END IF;
  END IF;
END $$;

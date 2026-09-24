-- ============================================================================
-- CMS Permissions - add cms_role column to profiles
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'cms_role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN cms_role text DEFAULT 'editor';
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.cms_role IS
  'CMS content role: editor (draft only), publisher (can publish), admin (full CMS), reviewer (can approve)';

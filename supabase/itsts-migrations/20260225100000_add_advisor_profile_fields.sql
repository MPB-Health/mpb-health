/*
  # Add advisor profile fields to ITSTS profiles table

  Adds columns needed for rich profile sync from the MPB Health monorepo.
  These columns are populated automatically when advisor profiles are
  created or updated in the monorepo via the sync-user-to-itsts edge function.

  ## Columns Added
  - phone       - Advisor contact phone
  - specialization - Advisor specialization area
  - agent_id    - Unique agent identifier from the monorepo
  - company_name - Company/agency name
  - avatar_url  - Profile picture URL (Supabase Storage)

  NOTE: Apply this migration to the ITSTS Supabase project, NOT the monorepo.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'specialization') THEN
    ALTER TABLE public.profiles ADD COLUMN specialization text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'agent_id') THEN
    ALTER TABLE public.profiles ADD COLUMN agent_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'company_name') THEN
    ALTER TABLE public.profiles ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_agent_id ON public.profiles(agent_id) WHERE agent_id IS NOT NULL;

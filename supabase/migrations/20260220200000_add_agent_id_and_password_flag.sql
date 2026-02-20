-- Add agent_id, company_name, and must_change_password to advisor_profiles
-- These columns support bulk CSV import of advisor accounts

ALTER TABLE advisor_profiles
  ADD COLUMN IF NOT EXISTS agent_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_advisor_profiles_agent_id
  ON advisor_profiles (agent_id)
  WHERE agent_id IS NOT NULL;

-- Allow advisors to clear their own must_change_password flag after changing password
-- (existing RLS already allows advisors to update their own row)

-- Fix: The baseline migration created "Advisors can update own profile" as
-- FOR SELECT (copy-paste error). This left advisor_profiles with ZERO UPDATE
-- policies, meaning advisors could never update their own row — including
-- clearing must_change_password, which trapped users in a /change-password loop.

-- Drop the misnamed SELECT policy (safe: "Advisors can view own profile"
-- already provides equivalent SELECT access).
DROP POLICY IF EXISTS "Advisors can update own profile" ON public.advisor_profiles;

-- Create the real UPDATE policy.
CREATE POLICY "Advisors can update own profile"
  ON public.advisor_profiles
  FOR UPDATE
  TO authenticated
  USING  (auth.uid() = id OR (user_id IS NOT NULL AND auth.uid() = user_id))
  WITH CHECK (auth.uid() = id OR (user_id IS NOT NULL AND auth.uid() = user_id));

-- Also add an INSERT policy so the self-heal upsert in AdvisorContext works.
-- Without this, new users whose profile row is missing can't auto-provision.
CREATE POLICY "Advisors can insert own profile"
  ON public.advisor_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR (user_id IS NOT NULL AND auth.uid() = user_id));

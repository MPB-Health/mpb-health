-- Audit table for admin impersonation of advisor accounts.
-- Every time an admin generates a magic-link or temp-password to sign into
-- an advisor's portal session, a row is written here for accountability.

CREATE TABLE IF NOT EXISTS public.impersonation_log (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id    uuid        NOT NULL REFERENCES auth.users(id),
  target_user_id uuid    NOT NULL REFERENCES auth.users(id),
  mode        text        NOT NULL CHECK (mode IN ('magiclink', 'temp_password')),
  ip_address  text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.impersonation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admins_read_impersonation_logs"
  ON public.impersonation_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );
CREATE INDEX idx_impersonation_log_admin_id ON public.impersonation_log (admin_id);
CREATE INDEX idx_impersonation_log_target_user_id ON public.impersonation_log (target_user_id);
CREATE INDEX idx_impersonation_log_created_at ON public.impersonation_log (created_at DESC);

-- RPC: clear_must_change_password_after_reset
-- Called from ResetPassword page after a successful password reset.
-- SECURITY DEFINER bypasses RLS so the PASSWORD_RECOVERY session can update the profile.
CREATE OR REPLACE FUNCTION public.clear_must_change_password_after_reset()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE advisor_profiles
  SET must_change_password = false
  WHERE id = auth.uid();
$$;

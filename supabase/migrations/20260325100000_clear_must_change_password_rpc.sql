-- ============================================================================
-- RPC: clear_must_change_password_after_reset
-- ============================================================================
-- Called from ResetPassword page after a successful password reset.
-- Uses SECURITY DEFINER to bypass RLS and ensure the flag is cleared even when
-- the PASSWORD_RECOVERY session might have different RLS semantics.
-- Matches by both id and user_id to handle any schema variations.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.clear_must_change_password_after_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE advisor_profiles
  SET must_change_password = false
  WHERE id = auth.uid() OR (user_id IS NOT NULL AND user_id = auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_must_change_password_after_reset() TO authenticated;

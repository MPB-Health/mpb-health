-- Encrypted OAuth token storage for social platform connections (Edge Functions + service_role only).
-- Authenticated clients keep read/write on non-secret columns only.
-- Uses public.encrypt_token (same MAIL_TOKEN_ENCRYPTION_KEY pattern as mail_accounts).

ALTER TABLE public.crm_social_platform_connections
  ADD COLUMN IF NOT EXISTS access_token_encrypted bytea,
  ADD COLUMN IF NOT EXISTS refresh_token_encrypted bytea,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS oauth_scope text;

-- Tighten privileges: CRM browser must not read/write encrypted token columns.
REVOKE ALL ON public.crm_social_platform_connections FROM authenticated;

GRANT SELECT (
  id,
  org_id,
  provider,
  connection_status,
  display_name,
  metadata,
  sync_error,
  last_synced_at,
  connected_by,
  created_at,
  updated_at,
  token_expires_at,
  oauth_scope
) ON public.crm_social_platform_connections TO authenticated;

GRANT INSERT (
  org_id,
  provider,
  connection_status,
  display_name,
  metadata,
  sync_error,
  last_synced_at,
  connected_by
) ON public.crm_social_platform_connections TO authenticated;

GRANT UPDATE (
  connection_status,
  display_name,
  metadata,
  sync_error,
  last_synced_at,
  connected_by
) ON public.crm_social_platform_connections TO authenticated;

GRANT DELETE ON public.crm_social_platform_connections TO authenticated;

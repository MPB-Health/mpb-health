-- Grant explicit permission for admin staff to impersonate advisor portal sessions.
-- Super admins bypass permission checks; this key allows delegated support access.

BEGIN;

INSERT INTO public.permissions (key, module, description) VALUES
  ('advisors.impersonate', 'advisors', 'Sign into the advisor portal as an advisor for support debugging')
ON CONFLICT (key) DO NOTHING;

COMMIT;

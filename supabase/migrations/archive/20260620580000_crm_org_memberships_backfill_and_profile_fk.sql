-- Migration: Backfill org_memberships for internal MPB staff and add a
-- direct FK org_memberships.user_id -> profiles.id so PostgREST can embed
-- profile data on org_memberships queries.
--
-- Background
-- ----------
-- 17 internal staff users on the @mympb.com / @mpb.health domains exist in
-- auth.users (and have public.user_roles rows) but were never inserted into
-- public.org_memberships. The CRM frontend gates on `getUserOrgs()` which
-- queries org_memberships directly, so those users hit the
-- "No Organization — You're not a member of any organization" screen.
--
-- Three CRM pages (Today, LeadsList, Pipeline) and Settings/Team also embed
-- profile data on org_memberships via PostgREST joins like
--   .select('user_id, role, profiles!inner(id, email, full_name, ...)')
-- which currently returns 400 PGRST200 because there is no FK from
-- org_memberships.user_id to public.profiles — only to auth.users(id).
-- Adding the direct FK gives PostgREST a unique embed path; the existing FK
-- to auth.users is preserved for cascade safety.
--
-- Both changes are idempotent. Existing memberships are not modified.

BEGIN;

-- 1. Add a direct FK from org_memberships.user_id to public.profiles so
--    PostgREST can embed profile rows. profiles.id is itself a FK to
--    auth.users(id), so the relationship is consistent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.org_memberships'::regclass
      AND conname  = 'org_memberships_user_id_profile_fkey'
  ) THEN
    ALTER TABLE public.org_memberships
      ADD CONSTRAINT org_memberships_user_id_profile_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

-- 2. Backfill memberships for every internal MPB staff user that doesn't
--    already have an active membership in the default MPB Health org.
--    Role is derived from public.user_roles:
--      'super_admin' -> 'owner'
--      'admin'       -> 'admin'
--      anything else -> 'member'
--    (Allowed values per org_memberships_role_check: owner|admin|manager|agent|member)
WITH staff AS (
  SELECT
    u.id AS user_id,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.user_roles r
        WHERE r.user_id = u.id AND r.role = 'super_admin'
      ) THEN 'owner'
      WHEN EXISTS (
        SELECT 1 FROM public.user_roles r
        WHERE r.user_id = u.id AND r.role = 'admin'
      ) THEN 'admin'
      ELSE 'member'
    END AS role
  FROM auth.users u
  WHERE LOWER(u.email) LIKE '%@mympb.com'
     OR LOWER(u.email) LIKE '%@mpb.health'
)
INSERT INTO public.org_memberships
  (user_id, org_id, role, status, joined_at, created_at, updated_at)
SELECT
  s.user_id,
  '00000000-0000-4000-a000-000000000001'::uuid AS org_id,
  s.role,
  'active'                                      AS status,
  NOW()                                         AS joined_at,
  NOW()                                         AS created_at,
  NOW()                                         AS updated_at
FROM staff s
ON CONFLICT (user_id, org_id) DO NOTHING;

COMMIT;

-- Tell PostgREST to refresh its schema cache so the new FK is visible to
-- the embed parser without waiting for the periodic reload.
NOTIFY pgrst, 'reload schema';

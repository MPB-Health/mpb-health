-- Backfill advisor_profiles for role-based users missing advisor profile rows
-- Fixes advisor portal login loop for users that have user_roles but no advisor_profiles record.

INSERT INTO advisor_profiles (
  id,
  first_name,
  last_name,
  email,
  phone,
  specialization,
  status,
  onboarding_completed,
  onboarding_completed_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  ur.user_id AS id,
  COALESCE(
    (u.raw_user_meta_data->>'first_name')::text,
    split_part(COALESCE((u.raw_user_meta_data->>'full_name')::text, u.email), ' ', 1),
    'Advisor'
  ) AS first_name,
  COALESCE(
    (u.raw_user_meta_data->>'last_name')::text,
    CASE
      WHEN (u.raw_user_meta_data->>'full_name')::text IS NOT NULL
        AND position(' ' in (u.raw_user_meta_data->>'full_name')::text) > 0
      THEN trim(substring((u.raw_user_meta_data->>'full_name')::text from position(' ' in (u.raw_user_meta_data->>'full_name')::text) + 1))
      ELSE ''
    END,
    ''
  ) AS last_name,
  COALESCE(u.email, '') AS email,
  COALESCE((u.raw_user_meta_data->>'phone')::text, '') AS phone,
  COALESCE((u.raw_user_meta_data->>'specialization')::text, 'Health Share') AS specialization,
  'active' AS status,
  true AS onboarding_completed,
  now() AS onboarding_completed_at,
  jsonb_build_object('provisioned_by', 'migration_20260302103000', 'source', 'user_roles_backfill') AS metadata,
  now() AS created_at,
  now() AS updated_at
FROM (SELECT DISTINCT user_id FROM user_roles WHERE role IN ('advisor', 'super_admin', 'admin')) ur
JOIN auth.users u ON u.id = ur.user_id
WHERE NOT EXISTS (SELECT 1 FROM advisor_profiles ap WHERE ap.id = ur.user_id)
ON CONFLICT (id) DO NOTHING;

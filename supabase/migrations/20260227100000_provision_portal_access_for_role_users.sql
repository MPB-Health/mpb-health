-- ============================================================================
-- Provision Portal Access for Users with Roles
-- ============================================================================
-- Users with admin/advisor/super_admin/crm_user in user_roles may not have
-- corresponding rows in admin_users, org_memberships, or advisor_profiles.
-- This migration ensures they can access Admin Portal, CRM, and Advisor Portal.
-- ============================================================================

-- PART 1: Sync admin_users for users with super_admin or admin in user_roles
-- -------------------------------------------------------------------------
INSERT INTO admin_users (id, email, first_name, last_name, role, status, permissions)
SELECT
  sub.user_id AS id,
  sub.email,
  sub.first_name,
  sub.last_name,
  sub.role,
  'active' AS status,
  '{}' AS permissions
FROM (
  SELECT DISTINCT ON (ur.user_id)
    ur.user_id,
    COALESCE(u.email, '') AS email,
    COALESCE(
      ap.first_name,
      COALESCE((u.raw_user_meta_data->>'first_name')::text, split_part(COALESCE((u.raw_user_meta_data->>'full_name')::text, u.email), ' ', 1), '')
    ) AS first_name,
    COALESCE(
      ap.last_name,
      (u.raw_user_meta_data->>'last_name')::text,
      CASE WHEN (u.raw_user_meta_data->>'full_name')::text IS NOT NULL AND position(' ' in (u.raw_user_meta_data->>'full_name')::text) > 0
        THEN trim(substring((u.raw_user_meta_data->>'full_name')::text from position(' ' in (u.raw_user_meta_data->>'full_name')::text) + 1))
        ELSE ''
      END,
      ''
    ) AS last_name,
    CASE
      WHEN EXISTS (SELECT 1 FROM user_roles ur2 WHERE ur2.user_id = ur.user_id AND ur2.role = 'super_admin') THEN 'super_admin'
      WHEN ur.role = 'admin' THEN 'admin'
      ELSE 'staff'
    END AS role
  FROM user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  LEFT JOIN advisor_profiles ap ON ap.id = ur.user_id
  WHERE ur.role IN ('super_admin', 'admin')
  ORDER BY ur.user_id, CASE ur.role WHEN 'super_admin' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END
) sub
WHERE NOT EXISTS (SELECT 1 FROM admin_users au WHERE au.id = sub.user_id)
ON CONFLICT (id) DO NOTHING;

-- PART 2: Add org_memberships for admin/crm/super_admin users who have none
-- -------------------------------------------------------------------------
-- Add to the first organization in the system (MPB Health default org)
INSERT INTO org_memberships (org_id, user_id, role, status, joined_at)
SELECT DISTINCT ON (ur.user_id)
  (SELECT id FROM orgs ORDER BY created_at ASC LIMIT 1),
  ur.user_id,
  'admin',
  'active',
  now()
FROM user_roles ur
WHERE ur.role IN ('super_admin', 'admin', 'crm_user')
  AND EXISTS (SELECT 1 FROM orgs LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM org_memberships om
    WHERE om.user_id = ur.user_id AND om.status = 'active'
  )
ORDER BY ur.user_id
ON CONFLICT (org_id, user_id) DO NOTHING;

-- PART 3: Create advisor_profiles for users with advisor role who have none
-- -------------------------------------------------------------------------
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
  'Health Share' AS specialization,
  'active' AS status,
  true AS onboarding_completed,
  now() AS onboarding_completed_at,
  jsonb_build_object('provisioned_by', 'migration_20260227100000', 'source', 'user_roles') AS metadata,
  now() AS created_at,
  now() AS updated_at
FROM (SELECT DISTINCT user_id FROM user_roles WHERE role IN ('advisor', 'super_admin', 'admin')) ur
JOIN auth.users u ON u.id = ur.user_id
WHERE NOT EXISTS (SELECT 1 FROM advisor_profiles ap WHERE ap.id = ur.user_id)
ON CONFLICT (id) DO NOTHING;

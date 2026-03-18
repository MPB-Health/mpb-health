/*
  # Fix Superadmin Setup with Correct Schema

  Updates the setup function to match actual advisor_profiles table schema
*/

DROP FUNCTION IF EXISTS setup_superadmin_profile(text, uuid);

CREATE OR REPLACE FUNCTION setup_superadmin_profile(user_email text, user_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert or update profile
  INSERT INTO profiles (id, role, created_at, updated_at)
  VALUES (
    user_id,
    'advisor',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'advisor',
    updated_at = now();

  -- Create or update advisor profile with actual schema
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
  VALUES (
    user_id,
    'Vinnie',
    'Champion',
    user_email,
    '555-0100',
    'System Administration',
    'active',
    true,
    now(),
    jsonb_build_object(
      'role', 'superadmin',
      'access_level', 'full',
      'notes', 'Superadmin account for testing all portal experiences'
    ),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    first_name = 'Vinnie',
    last_name = 'Champion',
    email = user_email,
    phone = '555-0100',
    specialization = 'System Administration',
    status = 'active',
    onboarding_completed = true,
    onboarding_completed_at = now(),
    metadata = jsonb_build_object(
      'role', 'superadmin',
      'access_level', 'full',
      'notes', 'Superadmin account for testing all portal experiences'
    ),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION setup_superadmin_profile(text, uuid) TO authenticated, service_role;
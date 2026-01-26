/*
  # Fix Superadmin Setup Function

  Updates the setup function to match actual profiles table schema
*/

-- Drop and recreate the function with correct columns
DROP FUNCTION IF EXISTS setup_superadmin_profile(text, uuid);

CREATE OR REPLACE FUNCTION setup_superadmin_profile(user_email text, user_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert or update profile (only has id, role, created_at, updated_at)
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

  -- Create or update advisor profile
  INSERT INTO advisor_profiles (
    id,
    license_number,
    phone,
    bio,
    specialties,
    certifications,
    onboarding_status,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    'ADMIN-001',
    '555-0100',
    'MPB Health Superadmin - Full system access for testing and administration',
    ARRAY['Administration', 'System Testing', 'Content Management'],
    ARRAY['System Administrator'],
    'completed',
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    license_number = 'ADMIN-001',
    phone = '555-0100',
    bio = 'MPB Health Superadmin - Full system access for testing and administration',
    specialties = ARRAY['Administration', 'System Testing', 'Content Management'],
    certifications = ARRAY['System Administrator'],
    onboarding_status = 'completed',
    is_active = true,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION setup_superadmin_profile(text, uuid) TO authenticated, service_role;
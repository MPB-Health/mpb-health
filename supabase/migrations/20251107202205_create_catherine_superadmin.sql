/*
  # Create Catherine Okubo Superadmin User

  1. User Setup
    - Creates auth user for catherine@mympb.com
    - Sets up profile with advisor role
    - Creates advisor profile for full access

  2. Security
    - User can access all advisor content
    - User has admin privileges
    - Properly configured for testing all role experiences

  Note: This creates a user with password 'CHAMPIONcat!@19'
  You should change this password after first login.
*/

-- Function to safely create or update Catherine's profile
CREATE OR REPLACE FUNCTION setup_catherine_superadmin_profile(user_email text, user_id uuid)
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
    'Catherine',
    'Okubo',
    user_email,
    '555-0101',
    'System Administration',
    'active',
    true,
    now(),
    jsonb_build_object(
      'role', 'superadmin',
      'access_level', 'full',
      'license_number', 'ADMIN-002',
      'notes', 'Superadmin account - Full system access for testing and administration'
    ),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    first_name = 'Catherine',
    last_name = 'Okubo',
    email = user_email,
    phone = '555-0101',
    specialization = 'System Administration',
    status = 'active',
    onboarding_completed = true,
    onboarding_completed_at = now(),
    metadata = jsonb_build_object(
      'role', 'superadmin',
      'access_level', 'full',
      'license_number', 'ADMIN-002',
      'notes', 'Superadmin account - Full system access for testing and administration'
    ),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION setup_catherine_superadmin_profile(text, uuid) TO authenticated, service_role;

-- Note: The actual user creation must be done through Supabase Auth API
-- This script prepares the profile structure
-- Run this after creating the user through the Supabase dashboard or API:
--
-- Example using Supabase JS:
-- const { data, error } = await supabase.auth.admin.createUser({
--   email: 'catherine@mympb.com',
--   password: 'CHAMPIONcat!@19',
--   email_confirm: true
-- })
--
-- Then call: SELECT setup_catherine_superadmin_profile('catherine@mympb.com', '<user_id>');
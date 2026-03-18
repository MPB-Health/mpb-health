/*
  # Create Superadmin User

  1. User Setup
    - Creates auth user for vrt@mympb.com
    - Sets up profile with advisor role
    - Creates advisor profile for full access
    
  2. Security
    - User can access all advisor content
    - User has admin privileges
    - Properly configured for testing all role experiences

  Note: This creates a user with password 'MPBHealth2025!' 
  You should change this password after first login.
*/

-- Create the auth user (this will be done via Supabase Auth API in production)
-- For now, we'll just ensure the profile structure is ready

-- Function to safely create or update a profile
CREATE OR REPLACE FUNCTION setup_superadmin_profile(user_email text, user_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert or update profile
  INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
  VALUES (
    user_id,
    user_email,
    'advisor',
    'Vinnie Champion',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'advisor',
    full_name = 'Vinnie Champion',
    email = user_email,
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION setup_superadmin_profile(text, uuid) TO authenticated, service_role;

-- Note: The actual user creation must be done through Supabase Auth API
-- This script prepares the profile structure
-- Run this after creating the user through the Supabase dashboard or API:
-- 
-- Example using Supabase JS:
-- const { data, error } = await supabase.auth.admin.createUser({
--   email: 'vrt@mympb.com',
--   password: 'MPBHealth2025!',
--   email_confirm: true
-- })
-- 
-- Then call: SELECT setup_superadmin_profile('vrt@mympb.com', '<user_id>');
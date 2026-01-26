/*
  # Create Test Advisor Account

  Creates a test advisor account for development and testing purposes.

  ## Test Credentials
  - Email: testadvisor@mpb.health
  - Password: TestAdvisor2026!

  ## Setup Instructions
  
  After running this migration, create the auth user via Supabase:
  
  1. Go to Supabase Dashboard > Authentication > Users
  2. Click "Add user" > "Create new user"
  3. Enter:
     - Email: testadvisor@mpb.health
     - Password: TestAdvisor2026!
     - Check "Auto Confirm User"
  4. Copy the user's UUID
  5. Run: SELECT setup_test_advisor_profile('testadvisor@mpb.health', '<paste-uuid-here>');

  OR via Supabase JS/API:
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'testadvisor@mpb.health',
    password: 'TestAdvisor2026!',
    email_confirm: true
  });
  // Then call the function with the returned user ID
*/

-- Function to set up test advisor profile
CREATE OR REPLACE FUNCTION setup_test_advisor_profile(user_email text, user_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert or update profile with advisor role
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
    'Test',
    'Advisor',
    user_email,
    '555-TEST-01',
    'Health Benefits',
    'active',
    true,
    now(),
    jsonb_build_object(
      'role', 'advisor',
      'access_level', 'standard',
      'license_number', 'TEST-001',
      'notes', 'Test advisor account for development and testing'
    ),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    first_name = 'Test',
    last_name = 'Advisor',
    email = user_email,
    phone = '555-TEST-01',
    specialization = 'Health Benefits',
    status = 'active',
    onboarding_completed = true,
    onboarding_completed_at = now(),
    metadata = jsonb_build_object(
      'role', 'advisor',
      'access_level', 'standard',
      'license_number', 'TEST-001',
      'notes', 'Test advisor account for development and testing'
    ),
    updated_at = now();

  RAISE NOTICE 'Test advisor profile created/updated for %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION setup_test_advisor_profile(text, uuid) TO authenticated, service_role;

-- Add helpful comment
COMMENT ON FUNCTION setup_test_advisor_profile IS 
'Sets up a test advisor account. Call with email and user_id after creating the auth user.';

/*
  # Add Superadmin Role

  1. Changes
    - Add 'superadmin' to the allowed roles in profiles table
    - Update vrt@mympb.com to superadmin role
  
  2. Security
    - Maintains existing RLS policies
    - Superadmin has all permissions through existing admin policies
*/

-- Drop the existing check constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new check constraint with superadmin included
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['guest'::text, 'member'::text, 'advisor'::text, 'admin'::text, 'staff'::text, 'superadmin'::text]));

-- Update vrt@mympb.com to superadmin role
UPDATE profiles 
SET 
  role = 'superadmin',
  updated_at = now()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'vrt@mympb.com'
);

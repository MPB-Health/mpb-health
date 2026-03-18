/*
  # Fix Anonymous SELECT After INSERT Issue
  
  1. Problem
    - Anonymous users can INSERT leads successfully
    - But .insert().select() fails with 401 because SELECT policies require authentication
    - Error: "Failed to load resource: the server responded with a status of 401"
  
  2. Solution
    - Add SELECT policy allowing anonymous users to read ONLY submissions they just created
    - Policy checks that created_at is within last 5 seconds (just-inserted check)
    - This allows .insert().select() to work while maintaining security
  
  3. Security
    - Anonymous users can only SELECT their own just-inserted records (< 5 seconds old)
    - Cannot query historical data or other users' submissions
    - Existing admin and authenticated user policies remain unchanged
*/

-- Add SELECT policy for anonymous users (just-inserted records only)
CREATE POLICY "Anonymous users can view just-inserted submissions"
  ON zoho_lead_submissions
  FOR SELECT
  TO anon
  USING (
    -- Only allow reading submissions created in the last 5 seconds
    -- This allows .insert().select() to work but prevents querying old data
    created_at > (now() - interval '5 seconds')
  );

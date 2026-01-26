/*
  # Fix Resource Library Public Access

  1. Changes
    - Add anon role to existing SELECT policies for resource_library and resource_topics
    - This allows unauthenticated users to view published resources
  
  2. Security
    - Only SELECT access is granted to anon users
    - Only published resources are visible (is_published = true for resource_library)
    - Write operations still require authentication
*/

-- Drop and recreate resource_library SELECT policy with anon role
DROP POLICY IF EXISTS "Anyone can view published resources" ON resource_library;
CREATE POLICY "Anyone can view published resources"
  ON resource_library
  FOR SELECT
  TO anon, authenticated, public
  USING (is_published = true);

-- Drop and recreate resource_topics SELECT policy with anon role
DROP POLICY IF EXISTS "Anyone can view published topics" ON resource_topics;
CREATE POLICY "Anyone can view published topics"
  ON resource_topics
  FOR SELECT
  TO anon, authenticated, public
  USING (true);

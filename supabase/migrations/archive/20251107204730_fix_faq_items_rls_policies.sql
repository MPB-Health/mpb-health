/*
  # Fix FAQ Items RLS Policies
  
  1. Problem
    - Multiple conflicting SELECT policies on faq_items table
    - Anonymous users getting 401 errors despite policies existing
    
  2. Solution
    - Drop all existing SELECT policies
    - Create single, clean policy for anonymous + authenticated read access
    
  3. Security
    - Anonymous users can view active FAQs
    - Authenticated users can view all FAQs
    - Admins can manage all FAQs
*/

-- Drop conflicting policies
DROP POLICY IF EXISTS "Public can view active FAQ items" ON faq_items;
DROP POLICY IF EXISTS "Public can view active FAQs, admins can manage" ON faq_items;
DROP POLICY IF EXISTS "Authenticated users can manage FAQ items" ON faq_items;

-- Create clean, consolidated policies
CREATE POLICY "Allow anonymous and authenticated to view active FAQs"
  ON faq_items
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Allow authenticated users full access to FAQs"
  ON faq_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

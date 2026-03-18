/*
  # Create Newsletter Subscribers Table

  1. New Tables
    - `newsletter_subscribers`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null) - Subscriber email address
      - `status` (text) - Subscription status (active, unsubscribed, bounced)
      - `source` (text) - Where they subscribed from (footer, blog, popup, etc.)
      - `confirmed_at` (timestamptz) - When they confirmed their subscription
      - `unsubscribed_at` (timestamptz) - When they unsubscribed
      - `created_at` (timestamptz) - When they first subscribed
      - `updated_at` (timestamptz) - Last update timestamp
      - `ip_address` (text) - IP address for compliance
      - `user_agent` (text) - Browser user agent
      - `metadata` (jsonb) - Additional subscriber data

  2. Security
    - Enable RLS on `newsletter_subscribers` table
    - Add policy for public insert (new subscriptions)
    - Add policy for admins to view all subscribers
    - Add policy for users to view/update their own subscription

  3. Indexes
    - Index on email for fast lookups
    - Index on status for filtering
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  source text DEFAULT 'footer',
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'unsubscribed', 'bounced'))
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert only)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to view their own subscription
CREATE POLICY "Users can view own subscription"
  ON newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

-- Allow authenticated users to update their own subscription (unsubscribe)
CREATE POLICY "Users can update own subscription"
  ON newsletter_subscribers
  FOR UPDATE
  TO authenticated
  USING (email = auth.jwt()->>'email')
  WITH CHECK (email = auth.jwt()->>'email');

-- Allow admins and superadmins to view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Allow admins and superadmins to manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
  ON newsletter_subscribers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_created_at ON newsletter_subscribers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_source ON newsletter_subscribers(source);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_newsletter_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_subscribers_updated_at();
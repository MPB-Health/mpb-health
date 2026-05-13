/*
  # Email Tracking Table

  Stores individual open and click tracking events for emails.
  Used by the email-tracking Edge Function.
*/

-- ============================================================================
-- PART 1: Add tracking_id to crm_email_log
-- ============================================================================

ALTER TABLE crm_email_log
  ADD COLUMN IF NOT EXISTS tracking_id uuid;
CREATE INDEX IF NOT EXISTS idx_crm_email_log_tracking_id ON crm_email_log(tracking_id);
-- ============================================================================
-- PART 2: Create crm_email_tracking table
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_email_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_log_id uuid NOT NULL REFERENCES crm_email_log(id) ON DELETE CASCADE,

  -- Tracking type
  tracking_type text NOT NULL CHECK (tracking_type IN ('open', 'click')),

  -- Click-specific data
  link_url text,

  -- Device/Location info
  ip_address text,
  user_agent text,
  device_type text CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  location_country text,
  location_city text,

  -- Timestamp
  tracked_at timestamptz DEFAULT now()
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_email_tracking_email ON crm_email_tracking(email_log_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_tracking_type ON crm_email_tracking(tracking_type);
CREATE INDEX IF NOT EXISTS idx_crm_email_tracking_time ON crm_email_tracking(tracked_at DESC);
-- RLS
ALTER TABLE crm_email_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view email tracking" ON crm_email_tracking
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'agent')
    )
  );
-- Service role can insert (from Edge Functions)
CREATE POLICY "Service role can insert tracking" ON crm_email_tracking
  FOR INSERT TO authenticated
  WITH CHECK (true);
-- ============================================================================
-- PART 3: Helper function for tracking stats
-- ============================================================================

CREATE OR REPLACE FUNCTION get_email_tracking_stats(p_email_id uuid)
RETURNS TABLE (
  total_opens bigint,
  unique_opens bigint,
  total_clicks bigint,
  unique_clicks bigint,
  opens_by_device jsonb,
  top_clicked_links jsonb,
  first_open timestamptz,
  last_open timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE tracking_type = 'open')::bigint AS total_opens,
    COUNT(DISTINCT ip_address) FILTER (WHERE tracking_type = 'open')::bigint AS unique_opens,
    COUNT(*) FILTER (WHERE tracking_type = 'click')::bigint AS total_clicks,
    COUNT(DISTINCT ip_address) FILTER (WHERE tracking_type = 'click')::bigint AS unique_clicks,
    (
      SELECT jsonb_object_agg(COALESCE(device_type, 'unknown'), cnt)
      FROM (
        SELECT device_type, COUNT(*)::integer as cnt
        FROM crm_email_tracking
        WHERE email_log_id = p_email_id AND tracking_type = 'open'
        GROUP BY device_type
      ) d
    ) AS opens_by_device,
    (
      SELECT jsonb_agg(jsonb_build_object('url', link_url, 'count', cnt) ORDER BY cnt DESC)
      FROM (
        SELECT link_url, COUNT(*)::integer as cnt
        FROM crm_email_tracking
        WHERE email_log_id = p_email_id AND tracking_type = 'click' AND link_url IS NOT NULL
        GROUP BY link_url
        LIMIT 10
      ) c
    ) AS top_clicked_links,
    MIN(tracked_at) FILTER (WHERE tracking_type = 'open') AS first_open,
    MAX(tracked_at) FILTER (WHERE tracking_type = 'open') AS last_open
  FROM crm_email_tracking
  WHERE email_log_id = p_email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION get_email_tracking_stats(uuid) TO authenticated;
-- ============================================================================
-- PART 4: Helper function to append unique values to array
-- ============================================================================

CREATE OR REPLACE FUNCTION array_append_unique(
  arr text[],
  new_value text
)
RETURNS text[] AS $$
BEGIN
  IF arr IS NULL THEN
    RETURN ARRAY[new_value];
  ELSIF new_value = ANY(arr) THEN
    RETURN arr;
  ELSE
    RETURN array_append(arr, new_value);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

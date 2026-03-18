/*
  # Create Conversion Tracking System

  1. New Tables
    - `conversion_events`
      - Tracks all conversion-related events (CTA clicks, form interactions, quote requests, etc.)
    - `conversion_funnel`
      - Tracks user progress through the conversion funnel
    - `ab_test_variants`
      - Stores A/B test configurations
    - `ab_test_results`
      - Tracks user participation and results in A/B tests

  2. Security
    - Enable RLS on all tables
    - Allow public INSERT for tracking events
    - Restrict SELECT to admin/staff roles
    - Add indexes for performance

  3. Performance
    - Indexes on frequently queried columns
    - Partitioning considerations for large datasets
*/

-- Conversion Events Table
CREATE TABLE IF NOT EXISTS conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'cta_click', 'form_start', 'form_submit', 'quote_request', 'exit_intent')),
  page_url text NOT NULL,
  cta_text text,
  cta_location text,
  form_id text,
  user_id uuid REFERENCES auth.users(id),
  session_id text NOT NULL,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for conversion_events
CREATE INDEX IF NOT EXISTS idx_conversion_events_type ON conversion_events(event_type);
CREATE INDEX IF NOT EXISTS idx_conversion_events_session ON conversion_events(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_user ON conversion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_date ON conversion_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_events_utm ON conversion_events(utm_source, utm_medium, utm_campaign);

-- Conversion Funnel Table
CREATE TABLE IF NOT EXISTS conversion_funnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step text NOT NULL CHECK (step IN ('awareness', 'consideration', 'intent', 'conversion', 'retention')),
  substep text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  session_id text NOT NULL,
  completed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes for conversion_funnel
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_step ON conversion_funnel(step);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_session ON conversion_funnel(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_user ON conversion_funnel(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_date ON conversion_funnel(created_at DESC);

-- A/B Test Variants Table
CREATE TABLE IF NOT EXISTS ab_test_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name text NOT NULL,
  variant_name text NOT NULL,
  variant_config jsonb NOT NULL,
  traffic_allocation numeric(3,2) DEFAULT 0.50 CHECK (traffic_allocation >= 0 AND traffic_allocation <= 1),
  is_active boolean DEFAULT true,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(test_name, variant_name)
);

-- Indexes for ab_test_variants
CREATE INDEX IF NOT EXISTS idx_ab_test_variants_name ON ab_test_variants(test_name);
CREATE INDEX IF NOT EXISTS idx_ab_test_variants_active ON ab_test_variants(is_active);

-- A/B Test Results Table
CREATE TABLE IF NOT EXISTS ab_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name text NOT NULL,
  variant_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  session_id text NOT NULL,
  converted boolean DEFAULT false,
  conversion_value numeric(10,2),
  metadata jsonb DEFAULT '{}'::jsonb,
  assigned_at timestamptz DEFAULT now(),
  converted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes for ab_test_results
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test ON ab_test_results(test_name);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_variant ON ab_test_results(variant_name);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_session ON ab_test_results(session_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_converted ON ab_test_results(converted);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_date ON ab_test_results(created_at DESC);

-- Enable RLS
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversion_events
CREATE POLICY "Anyone can insert conversion events"
  ON conversion_events FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can read conversion events"
  ON conversion_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- RLS Policies for conversion_funnel
CREATE POLICY "Anyone can insert funnel data"
  ON conversion_funnel FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can read funnel data"
  ON conversion_funnel FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- RLS Policies for ab_test_variants
CREATE POLICY "Anyone can read active tests"
  ON ab_test_variants FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage tests"
  ON ab_test_variants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- RLS Policies for ab_test_results
CREATE POLICY "Anyone can insert test results"
  ON ab_test_results FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read own test results"
  ON ab_test_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all test results"
  ON ab_test_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Function to calculate conversion rate
CREATE OR REPLACE FUNCTION calculate_conversion_rate(
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_event_type text DEFAULT 'quote_request'
)
RETURNS TABLE (
  total_sessions bigint,
  conversions bigint,
  conversion_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH session_counts AS (
    SELECT COUNT(DISTINCT session_id) as total
    FROM conversion_events
    WHERE created_at BETWEEN p_start_date AND p_end_date
  ),
  conversion_counts AS (
    SELECT COUNT(DISTINCT session_id) as converted
    FROM conversion_events
    WHERE event_type = p_event_type
    AND created_at BETWEEN p_start_date AND p_end_date
  )
  SELECT
    sc.total,
    cc.converted,
    CASE
      WHEN sc.total > 0 THEN ROUND((cc.converted::numeric / sc.total::numeric) * 100, 2)
      ELSE 0
    END as rate
  FROM session_counts sc, conversion_counts cc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top performing CTAs
CREATE OR REPLACE FUNCTION get_top_ctas(
  p_limit integer DEFAULT 10,
  p_days_back integer DEFAULT 30
)
RETURNS TABLE (
  cta_text text,
  click_count bigint,
  unique_sessions bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.cta_text,
    COUNT(*) as click_count,
    COUNT(DISTINCT ce.session_id) as unique_sessions
  FROM conversion_events ce
  WHERE ce.event_type = 'cta_click'
  AND ce.cta_text IS NOT NULL
  AND ce.created_at >= now() - (p_days_back || ' days')::interval
  GROUP BY ce.cta_text
  ORDER BY click_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze funnel dropoff
CREATE OR REPLACE FUNCTION analyze_funnel_dropoff(
  p_days_back integer DEFAULT 30
)
RETURNS TABLE (
  step text,
  visitor_count bigint,
  dropoff_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH step_counts AS (
    SELECT
      cf.step,
      COUNT(DISTINCT cf.session_id) as visitors
    FROM conversion_funnel cf
    WHERE cf.created_at >= now() - (p_days_back || ' days')::interval
    GROUP BY cf.step
  ),
  step_order AS (
    SELECT
      step,
      visitors,
      LAG(visitors) OVER (ORDER BY
        CASE step
          WHEN 'awareness' THEN 1
          WHEN 'consideration' THEN 2
          WHEN 'intent' THEN 3
          WHEN 'conversion' THEN 4
          WHEN 'retention' THEN 5
        END
      ) as previous_visitors
    FROM step_counts
  )
  SELECT
    step,
    visitors,
    CASE
      WHEN previous_visitors IS NOT NULL AND previous_visitors > 0
      THEN ROUND(((previous_visitors - visitors)::numeric / previous_visitors::numeric) * 100, 2)
      ELSE 0
    END as dropoff_rate
  FROM step_order
  ORDER BY
    CASE step
      WHEN 'awareness' THEN 1
      WHEN 'consideration' THEN 2
      WHEN 'intent' THEN 3
      WHEN 'conversion' THEN 4
      WHEN 'retention' THEN 5
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

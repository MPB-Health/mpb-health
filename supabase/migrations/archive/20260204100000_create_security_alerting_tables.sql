-- ============================================================================
-- Security Alerting Infrastructure for HIPAA/SOC 2 Compliance
-- Creates tables for webhook configuration and alert logging
-- ============================================================================

-- Security Alert Webhooks Table
-- Stores webhook configurations for sending security alerts
CREATE TABLE IF NOT EXISTS public.security_alert_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'webhook',
  min_severity TEXT NOT NULL DEFAULT 'medium',
  enabled BOOLEAN NOT NULL DEFAULT true,
  event_types TEXT[] DEFAULT NULL,
  headers JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT valid_channel_type CHECK (channel_type IN ('slack', 'webhook')),
  CONSTRAINT valid_min_severity CHECK (min_severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_url CHECK (url ~ '^https?://')
);
-- Security Alert Log Table
-- Tracks sent alerts for rate limiting and audit purposes
CREATE TABLE IF NOT EXISTS public.security_alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.security_alert_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_severity TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_status INTEGER,
  error_message TEXT,

  -- Constraints
  CONSTRAINT valid_event_severity CHECK (event_severity IN ('low', 'medium', 'high', 'critical'))
);
-- Enable RLS
ALTER TABLE public.security_alert_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alert_log ENABLE ROW LEVEL SECURITY;
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_alert_webhooks_enabled
  ON public.security_alert_webhooks(enabled)
  WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_security_alert_log_webhook_sent
  ON public.security_alert_log(webhook_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alert_log_sent_at
  ON public.security_alert_log(sent_at DESC);
-- RLS Policies for security_alert_webhooks
-- Only super_admin and admin can manage webhooks
CREATE POLICY "Super admins can manage webhooks"
  ON public.security_alert_webhooks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );
-- Service role can always access (for backend operations)
CREATE POLICY "Service role can access webhooks"
  ON public.security_alert_webhooks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
-- RLS Policies for security_alert_log
-- Only super_admin and admin can view logs
CREATE POLICY "Super admins can view alert logs"
  ON public.security_alert_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );
-- Service role can insert logs (for backend operations)
CREATE POLICY "Service role can manage alert logs"
  ON public.security_alert_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
-- Updated_at trigger for webhooks
CREATE OR REPLACE FUNCTION public.update_security_webhook_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trigger_update_security_webhook_timestamp
  BEFORE UPDATE ON public.security_alert_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_security_webhook_updated_at();
-- Cleanup function to remove old alert logs (keep 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_alert_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.security_alert_log
  WHERE sent_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.cleanup_old_security_alert_logs() TO service_role;
-- Add comment for documentation
COMMENT ON TABLE public.security_alert_webhooks IS
  'Webhook configurations for sending security alerts (HIPAA/SOC 2 compliance)';
COMMENT ON TABLE public.security_alert_log IS
  'Log of sent security alerts for rate limiting and audit purposes';
COMMENT ON FUNCTION public.cleanup_old_security_alert_logs() IS
  'Removes security alert logs older than 30 days';

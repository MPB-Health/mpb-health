-- Schedule a warm-up ping to ticket-proxy every 5 minutes to prevent cold starts.
-- The secret matches the WARMUP_CRON_SECRET edge function env var.
select cron.schedule(
  'ticket-proxy-warmup',
  '*/5 * * * *',
  $$
  select net.http_post(
    url    := 'https://dtmnkzllidaiqyheguhl.supabase.co/functions/v1/ticket-proxy',
    body   := '{"action":"ping"}'::jsonb,
    headers := '{"Content-Type":"application/json","x-warmup-secret":"13d861bc678ca6e157beb695273de250d0b63f21bae75cad"}'::jsonb
  );
  $$
);

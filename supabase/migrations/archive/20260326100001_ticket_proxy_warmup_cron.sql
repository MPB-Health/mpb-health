-- Ticket-proxy warm-up cron
-- Keeps the ticket-proxy Edge Function warm to avoid 5–13s cold starts.
-- Requires: vault secret 'warmup_cron_secret' (same value as WARMUP_CRON_SECRET edge function secret)
-- Create via: select vault.create_secret('your-random-secret', 'warmup_cron_secret');

create extension if not exists pg_cron with schema extensions;

-- Unschedule if exists (idempotent)
do $$
begin
  if exists (select 1 from cron.job where jobname = 'ticket-proxy-warmup') then
    perform cron.unschedule('ticket-proxy-warmup');
  end if;
end $$;

-- Schedule warm-up every 5 minutes
-- Uses x-warmup-secret header; ticket-proxy returns 200 when it matches WARMUP_CRON_SECRET
select cron.schedule(
  'ticket-proxy-warmup',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := coalesce(
      current_setting('app.settings.supabase_url', true),
      'https://dtmnkzllidaiqyheguhl.supabase.co'
    ) || '/functions/v1/ticket-proxy',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-warmup-secret', coalesce(
        (select decrypted_secret from vault.decrypted_secrets where name = 'warmup_cron_secret' limit 1),
        ''
      )
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

comment on extension pg_cron is 'Schedule recurring jobs; used for ticket-proxy warm-up every 5 min';

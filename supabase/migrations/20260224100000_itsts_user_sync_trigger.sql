-- Enable pg_net extension if not already enabled (needed for HTTP calls from triggers)
create extension if not exists pg_net with schema extensions;

-- Trigger function: calls the sync-user-to-itsts edge function whenever
-- a row is inserted or updated in user_roles.
create or replace function public.sync_user_to_itsts()
returns trigger
language plpgsql
security definer
as $$
declare
  _user_record record;
  _edge_fn_url text;
  _service_key text;
  _first_name text;
  _last_name text;
  _email text;
  _roles text[];
begin
  -- Gather user details from auth.users
  select
    au.email,
    coalesce(au.raw_user_meta_data->>'first_name', split_part(coalesce(au.raw_user_meta_data->>'full_name', ''), ' ', 1)) as first_name,
    coalesce(au.raw_user_meta_data->>'last_name', split_part(coalesce(au.raw_user_meta_data->>'full_name', ''), ' ', 2)) as last_name
  into _user_record
  from auth.users au
  where au.id = NEW.user_id;

  if _user_record is null then
    return NEW;
  end if;

  _email := _user_record.email;
  _first_name := coalesce(_user_record.first_name, '');
  _last_name := coalesce(_user_record.last_name, '');

  -- Collect all roles for this user
  select array_agg(ur.role)
  into _roles
  from user_roles ur
  where ur.user_id = NEW.user_id;

  -- Build the edge function URL (sync-user-to-itsts lives on THIS project)
  _edge_fn_url := coalesce(
    current_setting('app.settings.supabase_url', true),
    'https://dtmnkzllidaiqyheguhl.supabase.co'
  ) || '/functions/v1/sync-user-to-itsts';

  _service_key := coalesce(
    current_setting('app.settings.service_role_key', true),
    ''
  );

  -- Call edge function asynchronously via pg_net
  perform net.http_post(
    url := _edge_fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id::text,
      'email', _email,
      'first_name', _first_name,
      'last_name', _last_name,
      'roles', _roles,
      'action', case when TG_OP = 'INSERT' then 'create' else 'update' end
    )
  );

  return NEW;
exception when others then
  -- Never block the original operation if the sync fails
  raise warning 'itsts sync trigger failed: %', SQLERRM;
  return NEW;
end;
$$;

-- Attach trigger to user_roles table
drop trigger if exists trg_sync_user_to_itsts on public.user_roles;

create trigger trg_sync_user_to_itsts
  after insert or update on public.user_roles
  for each row
  execute function public.sync_user_to_itsts();

comment on function public.sync_user_to_itsts() is
  'Async trigger that syncs users to the ITSTS support ticketing system whenever roles change.';

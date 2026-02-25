/*
  # Advisor Profile -> ITSTS Sync Trigger

  Fires whenever an advisor_profiles row is inserted or updated, calling
  the sync-user-to-itsts edge function via pg_net so the ITSTS support
  ticketing system stays in sync with the monorepo profile data.

  Sends rich profile fields (phone, specialization, agent_id, company_name,
  avatar_url) alongside the standard name/email/role payload.

  Requires:
    - pg_net extension (created in 20260224100000_itsts_user_sync_trigger.sql)
    - sync-user-to-itsts edge function deployed
    - ITSTS_SUPABASE_URL and ITSTS_SERVICE_ROLE_KEY set as edge function secrets
*/

create or replace function public.sync_advisor_profile_to_itsts()
returns trigger
language plpgsql
security definer
as $$
declare
  _email text;
  _roles text[];
  _edge_fn_url text;
  _service_key text;
begin
  -- Get user email from auth.users
  select au.email into _email
  from auth.users au
  where au.id = NEW.id;

  if _email is null then
    return NEW;
  end if;

  -- Collect all roles for this user
  select array_agg(ur.role) into _roles
  from user_roles ur
  where ur.user_id = NEW.id;

  -- Default to advisor if no roles found (profile was just created)
  if _roles is null then
    _roles := ARRAY['advisor'];
  end if;

  -- Build the edge function URL
  _edge_fn_url := coalesce(
    current_setting('app.settings.supabase_url', true),
    'https://hhikjgrttgnvojtunmla.supabase.co'
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
      'user_id', NEW.id::text,
      'email', _email,
      'first_name', coalesce(NEW.first_name, ''),
      'last_name', coalesce(NEW.last_name, ''),
      'roles', _roles,
      'action', case when TG_OP = 'INSERT' then 'create' else 'update' end,
      'phone', NEW.phone,
      'specialization', NEW.specialization,
      'agent_id', NEW.agent_id,
      'company_name', NEW.company_name,
      'avatar_url', NEW.avatar_url
    )
  );

  return NEW;
exception when others then
  raise warning 'advisor profile itsts sync trigger failed: %', SQLERRM;
  return NEW;
end;
$$;

-- Attach trigger to advisor_profiles table
drop trigger if exists trg_sync_advisor_profile_to_itsts on public.advisor_profiles;

create trigger trg_sync_advisor_profile_to_itsts
  after insert or update on public.advisor_profiles
  for each row
  execute function public.sync_advisor_profile_to_itsts();

comment on function public.sync_advisor_profile_to_itsts() is
  'Async trigger that syncs advisor profile data to the ITSTS support ticketing system.';

-- Fix advisor profile ITSTS sync trigger for schema drift
-- 1) Ensure advisor_profiles has avatar_url (used by create-user and ITSTS sync trigger)
-- 2) Recreate trigger function to safely read optional fields

ALTER TABLE public.advisor_profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE OR REPLACE FUNCTION public.sync_advisor_profile_to_itsts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _email text;
  _roles text[];
  _edge_fn_url text;
  _service_key text;
  _new jsonb;
BEGIN
  _new := to_jsonb(NEW);

  SELECT au.email INTO _email
  FROM auth.users au
  WHERE au.id = NEW.id;

  IF _email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT array_agg(ur.role) INTO _roles
  FROM user_roles ur
  WHERE ur.user_id = NEW.id;

  IF _roles IS NULL THEN
    _roles := ARRAY['advisor'];
  END IF;

  _edge_fn_url := coalesce(
    current_setting('app.settings.supabase_url', true),
    'https://hhikjgrttgnvojtunmla.supabase.co'
  ) || '/functions/v1/sync-user-to-itsts';

  _service_key := coalesce(
    current_setting('app.settings.service_role_key', true),
    ''
  );

  PERFORM net.http_post(
    url := _edge_fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.id::text,
      'email', _email,
      'first_name', coalesce(_new->>'first_name', ''),
      'last_name', coalesce(_new->>'last_name', ''),
      'roles', _roles,
      'action', case when TG_OP = 'INSERT' then 'create' else 'update' end,
      'phone', _new->>'phone',
      'specialization', _new->>'specialization',
      'agent_id', _new->>'agent_id',
      'company_name', _new->>'company_name',
      'avatar_url', _new->>'avatar_url'
    )
  );

  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'advisor profile itsts sync trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_advisor_profile_to_itsts ON public.advisor_profiles;

CREATE TRIGGER trg_sync_advisor_profile_to_itsts
  AFTER INSERT OR UPDATE ON public.advisor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_advisor_profile_to_itsts();

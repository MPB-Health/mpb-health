BEGIN;

-- MPB Health default org UUID (consistent with chat-service ORG_ID)
DO $$
DECLARE
  v_org constant uuid := '00000000-0000-4000-a000-000000000001'::uuid;
  v_creator uuid;
  v_slug constant text := 'advisor-announcements';
BEGIN
  SELECT ur.user_id
  INTO v_creator
  FROM public.user_roles ur
  WHERE ur.role IN ('super_admin', 'admin')
  ORDER BY CASE ur.role WHEN 'super_admin' THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_creator IS NULL THEN
    SELECT ap.id INTO v_creator
    FROM public.advisor_profiles ap
    ORDER BY ap.created_at ASC NULLS LAST
    LIMIT 1;
  END IF;

  IF v_creator IS NULL THEN
    RAISE NOTICE 'advisor-announcements migration: skipping channel insert — no user found for created_by';
  ELSE
    INSERT INTO public.chat_conversations (
      org_id,
      type,
      name,
      slug,
      description,
      created_by,
      is_admin_only_posting,
      is_archived,
      metadata
    )
    SELECT
      v_org,
      'channel',
      'Advisor Announcements',
      v_slug,
      'Official announcements, policy updates, and required actions — leadership posts only.',
      v_creator,
      true,
      false,
      jsonb_build_object('kind', 'org_announcements', 'system_managed', true)
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.chat_conversations c
      WHERE c.org_id = v_org AND c.slug = v_slug
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.ensure_user_in_advisor_announcements_channel(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_org constant uuid := '00000000-0000-4000-a000-000000000001'::uuid;
  v_conv uuid;
  v_role text;
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;

  SELECT id INTO v_conv
  FROM public.chat_conversations c
  WHERE c.org_id = v_org AND c.slug = 'advisor-announcements'
  LIMIT 1;

  IF v_conv IS NULL THEN RETURN; END IF;

  SELECT CASE
      WHEN om.role IN ('owner', 'admin') THEN 'admin'
      ELSE 'member'
    END
  INTO v_role
  FROM public.org_memberships om
  WHERE om.user_id = p_user_id AND om.org_id = v_org AND om.status = 'active'
  LIMIT 1;

  IF v_role IS NULL THEN v_role := 'member'; END IF;

  IF EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p_user_id AND ur.role IN ('super_admin', 'admin')
    ) THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.chat_members (conversation_id, user_id, role)
  VALUES (v_conv, p_user_id, v_role)
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET
    role = CASE
      WHEN public.chat_members.role = 'admin' OR EXCLUDED.role = 'admin' THEN 'admin'
      ELSE COALESCE(public.chat_members.role, EXCLUDED.role)
    END;
END;
$$;

COMMENT ON FUNCTION public.ensure_user_in_advisor_announcements_channel(uuid)
  IS 'Ensures the user can see the Advisor Announcements chat channel — chat_members + chat_conversations.slug=advisor-announcements.';

REVOKE ALL ON FUNCTION public.ensure_user_in_advisor_announcements_channel(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.trg_advisor_profiles_sync_announcements_channel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NEW.status = 'active' THEN
    PERFORM public.ensure_user_in_advisor_announcements_channel(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_advisor_profiles_sync_announcements_channel ON public.advisor_profiles;
CREATE TRIGGER trg_advisor_profiles_sync_announcements_channel
  AFTER INSERT OR UPDATE OF status ON public.advisor_profiles
  FOR EACH ROW
  WHEN (NEW.status IS NOT DISTINCT FROM 'active'::text)
  EXECUTE FUNCTION public.trg_advisor_profiles_sync_announcements_channel();

CREATE OR REPLACE FUNCTION public.trg_org_memberships_sync_announcements_channel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_org constant uuid := '00000000-0000-4000-a000-000000000001'::uuid;
BEGIN
  IF NEW.org_id = v_org AND NEW.status = 'active' THEN
    PERFORM public.ensure_user_in_advisor_announcements_channel(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_memberships_sync_announcements_channel ON public.org_memberships;
CREATE TRIGGER trg_org_memberships_sync_announcements_channel
  AFTER INSERT OR UPDATE OF status ON public.org_memberships
  FOR EACH ROW
  WHEN (
    NEW.org_id = '00000000-0000-4000-a000-000000000001'::uuid
    AND NEW.status IS NOT DISTINCT FROM 'active'::text
  )
  EXECUTE FUNCTION public.trg_org_memberships_sync_announcements_channel();

DO $$
BEGIN
  PERFORM public.ensure_user_in_advisor_announcements_channel(ap.id)
  FROM public.advisor_profiles ap
  WHERE ap.status = 'active';

  PERFORM public.ensure_user_in_advisor_announcements_channel(om.user_id)
  FROM public.org_memberships om
  WHERE om.org_id = '00000000-0000-4000-a000-000000000001'::uuid
    AND om.status = 'active';

  PERFORM public.ensure_user_in_advisor_announcements_channel(ur.user_id)
  FROM public.user_roles ur
  WHERE ur.role IN ('super_admin', 'admin');
END $$;

COMMIT;;

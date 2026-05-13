-- ============================================================================
-- CRM Audit Patches
--
-- Single consolidated patch from the CRM audit (2026-05-08). Idempotent so it
-- can replay safely against environments that already have any subset applied.
--
-- Covers:
--   1. Missing tables: crm_deal_room_participants, crm_deal_room_pinned_items
--   2. Missing storage bucket: 'avatars' (general user profile pictures)
--   3. org_memberships privilege-escalation hardening (role-aware policies)
--   4. RLS leak fixes:
--        - crm_email_log: cross-tenant read closed
--        - calendar_events: cross-tenant read closed
--        - lead_submissions: anonymous read closed
-- ============================================================================

BEGIN;
-- ─── 1. crm_deal_room_participants ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.crm_deal_room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.crm_deal_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_email text NOT NULL,
  user_avatar_url text,
  role text NOT NULL DEFAULT 'collaborator',
  is_online boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_deal_room_participants_role_check
    CHECK (role IN ('owner', 'collaborator', 'viewer')),
  UNIQUE (room_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_crm_deal_room_participants_room
  ON public.crm_deal_room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_crm_deal_room_participants_user
  ON public.crm_deal_room_participants(user_id);
ALTER TABLE public.crm_deal_room_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org members can view deal room participants"
  ON public.crm_deal_room_participants;
CREATE POLICY "Org members can view deal room participants"
  ON public.crm_deal_room_participants FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_deal_rooms r
      WHERE r.id = room_id AND public.is_org_member(r.org_id)
    )
  );
DROP POLICY IF EXISTS "Room owners or first user can add participants"
  ON public.crm_deal_room_participants;
CREATE POLICY "Room owners or first user can add participants"
  ON public.crm_deal_room_participants FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.crm_deal_room_participants existing
      WHERE existing.room_id = crm_deal_room_participants.room_id
        AND existing.user_id = auth.uid()
        AND existing.role = 'owner'
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.crm_deal_room_participants existing
      WHERE existing.room_id = crm_deal_room_participants.room_id
    )
  );
DROP POLICY IF EXISTS "Users update own presence"
  ON public.crm_deal_room_participants;
CREATE POLICY "Users update own presence"
  ON public.crm_deal_room_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Room owners update participants"
  ON public.crm_deal_room_participants;
CREATE POLICY "Room owners update participants"
  ON public.crm_deal_room_participants FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_deal_room_participants owner
      WHERE owner.room_id = crm_deal_room_participants.room_id
        AND owner.user_id = auth.uid()
        AND owner.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.crm_deal_room_participants owner
      WHERE owner.room_id = crm_deal_room_participants.room_id
        AND owner.user_id = auth.uid()
        AND owner.role = 'owner'
    )
  );
DROP POLICY IF EXISTS "Users can delete deal room participants"
  ON public.crm_deal_room_participants;
CREATE POLICY "Users can delete deal room participants"
  ON public.crm_deal_room_participants FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.crm_deal_room_participants owner
      WHERE owner.room_id = crm_deal_room_participants.room_id
        AND owner.user_id = auth.uid()
        AND owner.role = 'owner'
    )
  );
-- ─── 2. crm_deal_room_pinned_items ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.crm_deal_room_pinned_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.crm_deal_rooms(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  title text NOT NULL,
  entity_id uuid,
  url text,
  pinned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_deal_room_pinned_items_type_check
    CHECK (item_type IN ('document', 'quote', 'email', 'note'))
);
CREATE INDEX IF NOT EXISTS idx_crm_deal_room_pinned_items_room
  ON public.crm_deal_room_pinned_items(room_id, pinned_at DESC);
ALTER TABLE public.crm_deal_room_pinned_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org members can view pinned items"
  ON public.crm_deal_room_pinned_items;
CREATE POLICY "Org members can view pinned items"
  ON public.crm_deal_room_pinned_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_deal_rooms r
      WHERE r.id = room_id AND public.is_org_member(r.org_id)
    )
  );
DROP POLICY IF EXISTS "Room participants can pin items"
  ON public.crm_deal_room_pinned_items;
CREATE POLICY "Room participants can pin items"
  ON public.crm_deal_room_pinned_items FOR INSERT TO authenticated
  WITH CHECK (
    pinned_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.crm_deal_room_participants p
      WHERE p.room_id = crm_deal_room_pinned_items.room_id
        AND p.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Pinner or owner can unpin"
  ON public.crm_deal_room_pinned_items;
CREATE POLICY "Pinner or owner can unpin"
  ON public.crm_deal_room_pinned_items FOR DELETE TO authenticated
  USING (
    pinned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.crm_deal_room_participants owner
      WHERE owner.room_id = crm_deal_room_pinned_items.room_id
        AND owner.user_id = auth.uid()
        AND owner.role = 'owner'
    )
  );
-- ─── 3. 'avatars' storage bucket ───────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users upload avatars to own folder" ON storage.objects;
CREATE POLICY "Users upload avatars to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
DROP POLICY IF EXISTS "Users update own avatar files" ON storage.objects;
CREATE POLICY "Users update own avatar files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
DROP POLICY IF EXISTS "Users delete own avatar files" ON storage.objects;
CREATE POLICY "Users delete own avatar files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
-- ─── 4. org_memberships role-aware RLS ─────────────────────────────────────
-- The earlier migration (20260211000000) gave any org member full
-- INSERT/UPDATE/DELETE on org_memberships, allowing self-promotion to
-- 'admin' or 'owner'. This block replaces those policies with role checks.

CREATE OR REPLACE FUNCTION public.current_user_org_role(p_org_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.org_memberships
  WHERE user_id = auth.uid()
    AND org_id = p_org_id
    AND status = 'active'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.current_user_org_role(uuid) TO authenticated;
DROP POLICY IF EXISTS "Admins can insert memberships" ON public.org_memberships;
CREATE POLICY "Admins can insert memberships"
  ON public.org_memberships FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_org_role(org_memberships.org_id) IN ('owner', 'admin')
  );
DROP POLICY IF EXISTS "Admins can update memberships" ON public.org_memberships;
DROP POLICY IF EXISTS "Owners can update any membership" ON public.org_memberships;
CREATE POLICY "Owners can update any membership"
  ON public.org_memberships FOR UPDATE TO authenticated
  USING (
    public.current_user_org_role(org_memberships.org_id) = 'owner'
  )
  WITH CHECK (
    public.current_user_org_role(org_memberships.org_id) = 'owner'
  );
DROP POLICY IF EXISTS "Admins can update non-owner memberships" ON public.org_memberships;
CREATE POLICY "Admins can update non-owner memberships"
  ON public.org_memberships FOR UPDATE TO authenticated
  USING (
    public.current_user_org_role(org_memberships.org_id) = 'admin'
    AND role <> 'owner'
  )
  WITH CHECK (
    public.current_user_org_role(org_memberships.org_id) = 'admin'
    AND role <> 'owner'
  );
DROP POLICY IF EXISTS "Users can delete memberships" ON public.org_memberships;
DROP POLICY IF EXISTS "Users can leave their own membership" ON public.org_memberships;
CREATE POLICY "Users can leave their own membership"
  ON public.org_memberships FOR DELETE TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Owners can delete any membership" ON public.org_memberships;
CREATE POLICY "Owners can delete any membership"
  ON public.org_memberships FOR DELETE TO authenticated
  USING (
    public.current_user_org_role(org_memberships.org_id) = 'owner'
  );
DROP POLICY IF EXISTS "Admins can delete non-owner memberships" ON public.org_memberships;
CREATE POLICY "Admins can delete non-owner memberships"
  ON public.org_memberships FOR DELETE TO authenticated
  USING (
    public.current_user_org_role(org_memberships.org_id) = 'admin'
    AND role <> 'owner'
  );
-- ─── 5. crm_email_log: close cross-tenant read leak ────────────────────────

DROP POLICY IF EXISTS "Authenticated users can view email logs" ON public.crm_email_log;
CREATE POLICY "Org members can view email logs"
  ON public.crm_email_log FOR SELECT TO authenticated
  USING (
    org_id IS NOT NULL
    AND public.is_org_member(org_id)
  );
-- ─── 6. calendar_events: close cross-tenant read leak ──────────────────────
-- Previous policy was `USING (true)` for any authenticated user. Tighten to
-- org-scoped, with a fallback for legacy rows that lack an org_id (the
-- creator/assignee can still see their own).

DROP POLICY IF EXISTS "Allow authenticated read calendar_events"
  ON public.calendar_events;
CREATE POLICY "Org members can read calendar events"
  ON public.calendar_events FOR SELECT TO authenticated
  USING (
    (org_id IS NOT NULL AND public.is_org_member(org_id))
    OR (org_id IS NULL AND (
         created_by = auth.uid() OR assigned_to = auth.uid()
       ))
  );
-- ─── 7. lead_submissions: close anon read leak ─────────────────────────────
-- The public lead form INSERTs anonymously — we keep that. We only revoke
-- anonymous SELECT, which had no business case.

DROP POLICY IF EXISTS "Anon can read lead_submissions" ON public.lead_submissions;
DROP POLICY IF EXISTS "lead_submissions_anon_select" ON public.lead_submissions;
COMMIT;

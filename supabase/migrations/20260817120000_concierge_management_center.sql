-- ============================================================================
-- Concierge Management Center
-- ----------------------------------------------------------------------------
-- Adds manager tooling for the Concierge Portal:
--   * concierge_user_access  — per-user manager flag + feature deny-list
--   * is_concierge_manager()  — super_admin/admin OR explicit per-user grant
--   * concierge_can()         — default-ALLOW feature gate (deny-list only)
--   * is_concierge_org_admin() — fixes a latent bug (missing organizations->orgs
--                                slug-join branch) so admin org members resolve
--   * split RLS on concierge_daily_log_entries + concierge_team_members so a
--     manager can restrict individual reps. Default behavior is UNCHANGED: with
--     no concierge_user_access rows, concierge_can() returns TRUE for everyone.
--
-- Design notes:
--   * Fully idempotent (CREATE ... IF NOT EXISTS, CREATE OR REPLACE, DROP POLICY
--     IF EXISTS). Safe to re-run.
--   * LIVE base predicate for the concierge tables is
--     user_has_concierge_access_for_org(org_id) (the migration-file history shows
--     current_user_has_concierge_portal_access(), but production drifted). The
--     split policies below preserve the LIVE predicate.
--   * org_id is the portal organization id (a0000000-0000-0000-0000-000000000001)
--     used by every other concierge_* table and by the app's getConciergeOrgId().
--   * Rollback script is at the bottom of this file (commented).
-- ============================================================================

SET lock_timeout = '5s';

-- ---------------------------------------------------------------------------
-- 1. Per-user access table (deny-list; absent row == unrestricted)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.concierge_user_access (
  org_id          uuid NOT NULL,
  user_id         uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  is_manager      boolean NOT NULL DEFAULT false,
  denied_features text[] NOT NULL DEFAULT '{}'::text[],
  notes           text,
  updated_by      uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

COMMENT ON TABLE public.concierge_user_access IS
  'Concierge Management Center per-user access. is_manager grants management rights; '
  'denied_features is a deny-list (absent feature == allowed). An absent row == fully unrestricted.';

CREATE INDEX IF NOT EXISTS idx_concierge_user_access_user
  ON public.concierge_user_access (user_id);

DROP TRIGGER IF EXISTS set_updated_at_concierge_user_access ON public.concierge_user_access;
CREATE TRIGGER set_updated_at_concierge_user_access
  BEFORE UPDATE ON public.concierge_user_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 2. Manager predicate: global admin/super_admin OR explicit per-user grant
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_concierge_manager(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.current_user_has_concierge_portal_access()
    AND (
      -- Global admins and super admins are always concierge managers.
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role::text IN ('super_admin', 'admin')
      )
      -- Explicit per-user manager grant scoped to this org.
      OR EXISTS (
        SELECT 1 FROM public.concierge_user_access cua
        WHERE cua.user_id = auth.uid()
          AND cua.org_id = p_org_id
          AND cua.is_manager = true
      )
    );
$$;

COMMENT ON FUNCTION public.is_concierge_manager(uuid) IS
  'True when the current user may manage the Concierge Portal (admin/super_admin or an explicit concierge_user_access.is_manager grant).';

GRANT EXECUTE ON FUNCTION public.is_concierge_manager(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Feature gate: default ALLOW, deny only when the caller has a deny row.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.concierge_can(p_org_id uuid, p_feature text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_concierge_manager(p_org_id)
    OR NOT EXISTS (
      SELECT 1 FROM public.concierge_user_access cua
      WHERE cua.user_id = auth.uid()
        AND cua.org_id = p_org_id
        AND p_feature = ANY (cua.denied_features)
    );
$$;

COMMENT ON FUNCTION public.concierge_can(uuid, text) IS
  'True unless the current (non-manager) user has p_feature listed in concierge_user_access.denied_features. Managers always true; absent row == allowed.';

GRANT EXECUTE ON FUNCTION public.concierge_can(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Fix is_concierge_org_admin(): add the organizations->orgs slug-join branch
--    (matches user_has_concierge_access_for_org) so admin org members resolve.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_concierge_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.current_user_has_concierge_portal_access()
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role::text = 'super_admin'
      )
      OR EXISTS (
        SELECT 1 FROM public.org_memberships om
        WHERE om.user_id = auth.uid()
          AND om.org_id = p_org_id
          AND om.status = 'active'
          AND om.role IN ('owner', 'admin')
      )
      -- NEW: resolve when p_org_id is the portal (organizations) id but the
      -- membership lives on the orgs id with the same slug.
      OR EXISTS (
        SELECT 1
        FROM public.organizations og
        JOIN public.orgs o ON o.slug = og.slug
        JOIN public.org_memberships om
          ON om.org_id = o.id AND om.user_id = auth.uid() AND om.status = 'active'
        WHERE og.id = p_org_id
          AND om.role IN ('owner', 'admin')
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_concierge_org_admin(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. RLS: concierge_user_access (self can read own row; managers read/write all)
-- ---------------------------------------------------------------------------

ALTER TABLE public.concierge_user_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS concierge_user_access_select ON public.concierge_user_access;
CREATE POLICY concierge_user_access_select
  ON public.concierge_user_access
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_concierge_manager(org_id));

DROP POLICY IF EXISTS concierge_user_access_write ON public.concierge_user_access;
CREATE POLICY concierge_user_access_write
  ON public.concierge_user_access
  FOR ALL
  TO authenticated
  USING (public.is_concierge_manager(org_id))
  WITH CHECK (public.is_concierge_manager(org_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_user_access TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Split RLS: concierge_daily_log_entries
--    SELECT + INSERT keep the LIVE base predicate. UPDATE/DELETE additionally
--    require ownership OR the edit_any/delete_any feature (default ALLOW).
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS concierge_daily_log_entries_rw ON public.concierge_daily_log_entries;

DROP POLICY IF EXISTS concierge_daily_log_entries_select ON public.concierge_daily_log_entries;
CREATE POLICY concierge_daily_log_entries_select
  ON public.concierge_daily_log_entries
  FOR SELECT
  TO authenticated
  USING (public.user_has_concierge_access_for_org(org_id));

DROP POLICY IF EXISTS concierge_daily_log_entries_insert ON public.concierge_daily_log_entries;
CREATE POLICY concierge_daily_log_entries_insert
  ON public.concierge_daily_log_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_concierge_access_for_org(org_id)
    AND public.concierge_can(org_id, 'daily_log.write')
  );

DROP POLICY IF EXISTS concierge_daily_log_entries_update ON public.concierge_daily_log_entries;
CREATE POLICY concierge_daily_log_entries_update
  ON public.concierge_daily_log_entries
  FOR UPDATE
  TO authenticated
  USING (
    public.user_has_concierge_access_for_org(org_id)
    AND (created_by = auth.uid() OR public.concierge_can(org_id, 'daily_log.edit_any'))
  )
  WITH CHECK (
    public.user_has_concierge_access_for_org(org_id)
    AND (created_by = auth.uid() OR public.concierge_can(org_id, 'daily_log.edit_any'))
  );

DROP POLICY IF EXISTS concierge_daily_log_entries_delete ON public.concierge_daily_log_entries;
CREATE POLICY concierge_daily_log_entries_delete
  ON public.concierge_daily_log_entries
  FOR DELETE
  TO authenticated
  USING (
    public.user_has_concierge_access_for_org(org_id)
    AND (created_by = auth.uid() OR public.concierge_can(org_id, 'daily_log.delete_any'))
  );

-- ---------------------------------------------------------------------------
-- 7. Split RLS: concierge_team_members (writes gated behind team.manage)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS concierge_team_members_rw ON public.concierge_team_members;

DROP POLICY IF EXISTS concierge_team_members_select ON public.concierge_team_members;
CREATE POLICY concierge_team_members_select
  ON public.concierge_team_members
  FOR SELECT
  TO authenticated
  USING (public.user_has_concierge_access_for_org(org_id));

DROP POLICY IF EXISTS concierge_team_members_insert ON public.concierge_team_members;
CREATE POLICY concierge_team_members_insert
  ON public.concierge_team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_has_concierge_access_for_org(org_id)
    AND public.concierge_can(org_id, 'team.manage')
  );

DROP POLICY IF EXISTS concierge_team_members_update ON public.concierge_team_members;
CREATE POLICY concierge_team_members_update
  ON public.concierge_team_members
  FOR UPDATE
  TO authenticated
  USING (
    public.user_has_concierge_access_for_org(org_id)
    AND public.concierge_can(org_id, 'team.manage')
  )
  WITH CHECK (
    public.user_has_concierge_access_for_org(org_id)
    AND public.concierge_can(org_id, 'team.manage')
  );

DROP POLICY IF EXISTS concierge_team_members_delete ON public.concierge_team_members;
CREATE POLICY concierge_team_members_delete
  ON public.concierge_team_members
  FOR DELETE
  TO authenticated
  USING (
    public.user_has_concierge_access_for_org(org_id)
    AND public.concierge_can(org_id, 'team.manage')
  );

-- ============================================================================
-- ROLLBACK (run manually to revert this migration)
-- ============================================================================
-- SET lock_timeout = '5s';
--
-- -- Restore the original single blanket policies (LIVE predicate).
-- DROP POLICY IF EXISTS concierge_daily_log_entries_select ON public.concierge_daily_log_entries;
-- DROP POLICY IF EXISTS concierge_daily_log_entries_insert ON public.concierge_daily_log_entries;
-- DROP POLICY IF EXISTS concierge_daily_log_entries_update ON public.concierge_daily_log_entries;
-- DROP POLICY IF EXISTS concierge_daily_log_entries_delete ON public.concierge_daily_log_entries;
-- CREATE POLICY concierge_daily_log_entries_rw ON public.concierge_daily_log_entries
--   FOR ALL TO authenticated
--   USING (public.user_has_concierge_access_for_org(org_id))
--   WITH CHECK (public.user_has_concierge_access_for_org(org_id));
--
-- DROP POLICY IF EXISTS concierge_team_members_select ON public.concierge_team_members;
-- DROP POLICY IF EXISTS concierge_team_members_insert ON public.concierge_team_members;
-- DROP POLICY IF EXISTS concierge_team_members_update ON public.concierge_team_members;
-- DROP POLICY IF EXISTS concierge_team_members_delete ON public.concierge_team_members;
-- CREATE POLICY concierge_team_members_rw ON public.concierge_team_members
--   FOR ALL TO authenticated
--   USING (public.user_has_concierge_access_for_org(org_id))
--   WITH CHECK (public.user_has_concierge_access_for_org(org_id));
--
-- -- Restore the original is_concierge_org_admin() (without the slug-join branch).
-- CREATE OR REPLACE FUNCTION public.is_concierge_org_admin(p_org_id uuid)
-- RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
-- AS $$
--   SELECT
--     public.current_user_has_concierge_portal_access()
--     AND (
--       EXISTS (SELECT 1 FROM public.user_roles ur
--               WHERE ur.user_id = auth.uid() AND ur.role::text = 'super_admin')
--       OR EXISTS (SELECT 1 FROM public.org_memberships om
--                  WHERE om.user_id = auth.uid() AND om.org_id = p_org_id
--                    AND om.status = 'active' AND om.role IN ('owner', 'admin'))
--     );
-- $$;
--
-- DROP FUNCTION IF EXISTS public.concierge_can(uuid, text);
-- DROP FUNCTION IF EXISTS public.is_concierge_manager(uuid);
-- DROP TABLE IF EXISTS public.concierge_user_access;
-- ============================================================================

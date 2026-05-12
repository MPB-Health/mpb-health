-- ============================================================================
-- Phase 0.A — Org Table Unification (Reversible)
--
-- Target deploy: 2026-05-17 06:00 ET (10:00 UTC), Sunday off-peak.
-- Soak period:   7 days.
-- Phase 0.B (irreversible drop) follows: 2026-05-24 06:00 ET.
--
-- What this does:
--   * Adopts `organizations` as the single tenant table.
--   * Re-points org_memberships and all CRM table FKs from orgs → organizations.
--   * Adopts orgs's MPB UUID (00000000-…-001) as the canonical MPB id.
--   * Unifies role enum to a superset.
--   * Rewires champion helper functions as thin wrappers over phase0 helpers.
--   * Bundles RLS hardening for any table with org_id lacking RLS.
--   * Renames `orgs` to `orgs_deprecated` and creates a read-through view named
--     `orgs` (security_invoker) for application-layer backwards compatibility
--     during the 7-day soak.
--
-- Rollback (during soak only — before Phase 0.B):
--   * Drop the `orgs` view.
--   * Rename `orgs_deprecated` back to `orgs`.
--   * Reverse the FK retargets (drop new FKs on organizations(id), recreate to orgs(id)).
--   * Note: data UPDATEs in step 5 (organizations id adoption) are NOT trivially reversible
--           because of CASCADE — the rollback strategy is restore-from-PITR if a real
--           rollback is needed. Phase 0.A is structured so that NO row-level data on the
--           hot CRM tables is touched, only constraint metadata, so backout via PITR
--           remains an option.
-- ============================================================================

BEGIN;

SET LOCAL lock_timeout       = '5s';
SET LOCAL statement_timeout  = '10min';
SET LOCAL search_path        = public;

-- Mutex for the migration window.
SELECT pg_advisory_xact_lock(86753091);

-- ----------------------------------------------------------------------------
-- STEP 1: Preflight assertions
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_n_orgs           int;
  v_n_organizations  int;
  v_orgs_fk_target   text;
  v_unexpected_roles int;
BEGIN
  SELECT count(*) INTO v_n_orgs          FROM public.orgs          WHERE slug = 'mpb-health';
  SELECT count(*) INTO v_n_organizations FROM public.organizations WHERE slug = 'mpb-health';

  IF v_n_orgs <> 1 THEN
    RAISE EXCEPTION 'precondition: expected exactly 1 orgs row with slug=mpb-health, found %', v_n_orgs;
  END IF;
  IF v_n_organizations <> 1 THEN
    RAISE EXCEPTION 'precondition: expected exactly 1 organizations row with slug=mpb-health, found %', v_n_organizations;
  END IF;

  -- Confirm org_memberships FK currently targets orgs (not organizations).
  SELECT ccu.table_name INTO v_orgs_fk_target
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage         kcu ON kcu.constraint_name = tc.constraint_name
  JOIN information_schema.constraint_column_usage  ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.table_schema = 'public'
    AND tc.table_name   = 'org_memberships'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'org_id'
  LIMIT 1;

  IF v_orgs_fk_target IS DISTINCT FROM 'orgs' THEN
    RAISE EXCEPTION 'precondition: org_memberships.org_id FK target=% (expected orgs)', v_orgs_fk_target;
  END IF;

  -- No unexpected roles in org_memberships.
  SELECT count(*) INTO v_unexpected_roles
  FROM public.org_memberships
  WHERE role NOT IN ('owner','admin','manager','agent','member');
  IF v_unexpected_roles > 0 THEN
    RAISE EXCEPTION 'precondition: % org_memberships rows have a role outside the phase0 enum', v_unexpected_roles;
  END IF;

  RAISE NOTICE 'STEP 1: preflight OK';
END $$;


-- ----------------------------------------------------------------------------
-- STEP 2: Reconcile MPB UUIDs.
-- We make `organizations.mpb-health.id` = '00000000-…-001' (orgs's UUID),
-- which is also what every CRM row already references. To do this online
-- we add ON UPDATE CASCADE to every FK that currently points at
-- organizations(id), then run the UPDATE in step 5.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tc.constraint_name,
           tc.table_schema,
           tc.table_name,
           kcu.column_name,
           rc.delete_rule
    FROM information_schema.table_constraints   tc
    JOIN information_schema.key_column_usage         kcu ON kcu.constraint_name = tc.constraint_name
    JOIN information_schema.constraint_column_usage  ccu ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints  rc  ON rc.constraint_name  = tc.constraint_name
    WHERE tc.table_schema  = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'public'
      AND ccu.table_name   = 'organizations'
      AND ccu.column_name  = 'id'
      AND rc.update_rule  <> 'CASCADE'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      r.table_schema, r.table_name, r.constraint_name
    );
    EXECUTE format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE %s',
      r.table_schema, r.table_name, r.constraint_name, r.column_name, r.delete_rule
    );
    RAISE NOTICE 'STEP 2: %.% % rebuilt with ON UPDATE CASCADE',
                 r.table_schema, r.table_name, r.constraint_name;
  END LOOP;
END $$;


-- ----------------------------------------------------------------------------
-- STEP 3: Stash the data we'll merge from `orgs` into `organizations`.
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE _mpb_orgs_snapshot AS
SELECT id, name, slug, domain, logo_url, settings, status, created_at
FROM public.orgs WHERE slug = 'mpb-health';


-- ----------------------------------------------------------------------------
-- STEP 4: (REMOVED) Originally intended to delete an "orphan" organizations
-- row, but the dry-run on 2026-05-12 caught that there is no separate orphan
-- — the only row with slug='mpb-health' in organizations also happens to use
-- the UUID 'a0000000-…-001'. Step 5's UPDATE + ON UPDATE CASCADE handles
-- everything correctly without a separate delete.
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- STEP 5: Change organizations.mpb-health.id to adopt orgs's UUID.
-- CASCADES via the ON UPDATE CASCADE FKs added in step 2 — any rows in
-- license/brand tables that referenced the old UUID 'a0000000-…-001' get
-- their org_id auto-rewritten to '00000000-…-001'.
-- ----------------------------------------------------------------------------
UPDATE public.organizations
SET id = '00000000-0000-4000-a000-000000000001'
WHERE slug = 'mpb-health';


-- ----------------------------------------------------------------------------
-- STEP 6: Merge fields from the orgs row into the organizations row.
-- (organizations already has the correct slug='mpb-health' and id; we copy
-- name, domain, settings, and patch brand_config.logoUrl.)
-- ----------------------------------------------------------------------------
UPDATE public.organizations o
SET name         = COALESCE(src.name, o.name),
    settings     = COALESCE(o.settings, '{}'::jsonb) || COALESCE(src.settings, '{}'::jsonb),
    brand_config = CASE
      WHEN src.logo_url IS NOT NULL THEN
        jsonb_set(COALESCE(o.brand_config, '{}'::jsonb), '{logoUrl}', to_jsonb(src.logo_url), true)
      ELSE o.brand_config
    END
FROM _mpb_orgs_snapshot src
WHERE o.slug = 'mpb-health';


-- ----------------------------------------------------------------------------
-- STEP 7: Retarget every FK that points at orgs(id) to point at organizations(id).
-- Validation succeeds because step 5 already aligned the UUID values.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tc.constraint_name,
           tc.table_schema,
           tc.table_name,
           kcu.column_name,
           rc.delete_rule
    FROM information_schema.table_constraints   tc
    JOIN information_schema.key_column_usage         kcu ON kcu.constraint_name = tc.constraint_name
    JOIN information_schema.constraint_column_usage  ccu ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints  rc  ON rc.constraint_name  = tc.constraint_name
    WHERE tc.table_schema  = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'public'
      AND ccu.table_name   = 'orgs'
      AND ccu.column_name  = 'id'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      r.table_schema, r.table_name, r.constraint_name
    );
    EXECUTE format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE %s',
      r.table_schema, r.table_name, r.constraint_name, r.column_name, r.delete_rule
    );
    RAISE NOTICE 'STEP 7: %.% % retargeted to organizations(id)',
                 r.table_schema, r.table_name, r.constraint_name;
  END LOOP;
END $$;


-- ----------------------------------------------------------------------------
-- STEP 8: Unify the role enum to the superset.
-- Phase0 used {owner,admin,manager,agent,member}.
-- Champion used {owner,admin,manager,advisor}.
-- Superset = {owner,admin,manager,agent,advisor,member}. agent and advisor
-- are valid synonyms; helper functions checking 'owner'/'admin' are unaffected.
-- ----------------------------------------------------------------------------
ALTER TABLE public.org_memberships
  DROP CONSTRAINT IF EXISTS org_memberships_role_check;
ALTER TABLE public.org_memberships
  ADD  CONSTRAINT org_memberships_role_check
  CHECK (role IN ('owner','admin','manager','agent','advisor','member'));

-- Same for role_permissions.
ALTER TABLE public.role_permissions
  DROP CONSTRAINT IF EXISTS role_permissions_role_check;
ALTER TABLE public.role_permissions
  ADD  CONSTRAINT role_permissions_role_check
  CHECK (role IN ('owner','admin','manager','agent','advisor','member'));


-- ----------------------------------------------------------------------------
-- STEP 9: Redefine champion helper functions as wrappers over phase0 helpers.
-- This keeps every existing RLS policy that references them working unchanged.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS uuid[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_user_org_ids();
$$;
GRANT EXECUTE ON FUNCTION public.get_user_org_ids() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_primary_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (public.current_user_org_ids())[1];
$$;
GRANT EXECUTE ON FUNCTION public.get_user_primary_org_id() TO authenticated;

-- Note: existing prod signatures (discovered via dry-run 2026-05-12):
--   user_has_org_access(check_org_id uuid) -> boolean
--   user_has_org_role(check_org_id uuid, allowed_roles text[]) -> boolean
-- We must match these signatures or DROP first (which would break dependent
-- RLS policies referencing them). Matching is safer.

CREATE OR REPLACE FUNCTION public.user_has_org_access(check_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_org_member(check_org_id);
$$;
GRANT EXECUTE ON FUNCTION public.user_has_org_access(uuid) TO authenticated;

-- Array-aware variant that treats agent/advisor as synonyms.
CREATE OR REPLACE FUNCTION public.user_has_org_role(check_org_id uuid, allowed_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_memberships om
    WHERE om.user_id = auth.uid()
      AND om.org_id  = check_org_id
      AND om.status  = 'active'
      AND (
        om.role = ANY(allowed_roles)
        -- agent ↔ advisor synonym
        OR ('agent'   = ANY(allowed_roles) AND om.role = 'advisor')
        OR ('advisor' = ANY(allowed_roles) AND om.role = 'agent')
      )
  );
$$;
GRANT EXECUTE ON FUNCTION public.user_has_org_role(uuid, text[]) TO authenticated;

COMMENT ON FUNCTION public.get_user_org_ids()              IS 'Deprecated alias for current_user_org_ids().';
COMMENT ON FUNCTION public.get_user_primary_org_id()       IS 'Deprecated alias. Returns the first org from current_user_org_ids().';
COMMENT ON FUNCTION public.user_has_org_access(uuid)       IS 'Deprecated alias for is_org_member().';
COMMENT ON FUNCTION public.user_has_org_role(uuid,text[])  IS 'Deprecated alias. Treats agent and advisor as synonyms.';


-- ----------------------------------------------------------------------------
-- STEP 10: Add RLS coverage to any table that has an org_id column but lacks
-- row level security. Standard policies: members read/write, admins delete.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
  v_targets text[] := ARRAY[]::text[];
BEGIN
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN pg_class pgc      ON pgc.relname = c.table_name
    JOIN pg_namespace ns   ON ns.oid = pgc.relnamespace AND ns.nspname = c.table_schema
    WHERE c.table_schema = 'public'
      AND c.column_name  = 'org_id'
      AND pgc.relkind    = 'r'
      AND pgc.relrowsecurity = false
  LOOP
    v_targets := array_append(v_targets, r.table_name);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.table_name);
    EXECUTE format($f$
      CREATE POLICY "%1$s_select_member" ON public.%1$I
        FOR SELECT TO authenticated
        USING (org_id IS NOT NULL AND public.is_org_member(org_id));
    $f$, r.table_name);
    EXECUTE format($f$
      CREATE POLICY "%1$s_insert_member" ON public.%1$I
        FOR INSERT TO authenticated
        WITH CHECK (org_id IS NOT NULL AND public.is_org_member(org_id));
    $f$, r.table_name);
    EXECUTE format($f$
      CREATE POLICY "%1$s_update_member" ON public.%1$I
        FOR UPDATE TO authenticated
        USING      (org_id IS NOT NULL AND public.is_org_member(org_id))
        WITH CHECK (org_id IS NOT NULL AND public.is_org_member(org_id));
    $f$, r.table_name);
    EXECUTE format($f$
      CREATE POLICY "%1$s_delete_admin" ON public.%1$I
        FOR DELETE TO authenticated
        USING (org_id IS NOT NULL AND public.is_org_admin(org_id));
    $f$, r.table_name);
    RAISE NOTICE 'STEP 10: enabled RLS + policies on %', r.table_name;
  END LOOP;

  IF array_length(v_targets, 1) > 0 THEN
    RAISE NOTICE 'STEP 10: bundled RLS for %: %', array_length(v_targets,1), v_targets;
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- STEP 11: Rename `orgs` → `orgs_deprecated`. Create a read-through view named
-- `orgs` with security_invoker so any straggling application reads continue to
-- function during the 7-day soak. NOTE: views do not accept INSERT/UPDATE/DELETE
-- without INSTEAD OF triggers — any writer code that targets `orgs` will start
-- failing immediately. That's intentional: we want loud failures during soak,
-- not silent divergence. The code-audit script catches these before deploy.
-- ----------------------------------------------------------------------------
ALTER TABLE public.orgs RENAME TO orgs_deprecated;

-- Note: `organizations` table does not have a `domain` column. `orgs` did.
-- The dry-run on 2026-05-12 confirmed no application code reads orgs.domain
-- (orgService.ts only selects id/name/slug/logo_url/settings/created_at/updated_at).
-- Domain is therefore dropped from the compat view.
CREATE VIEW public.orgs WITH (security_invoker = true) AS
SELECT
  id,
  name,
  slug,
  logo_url,
  settings,
  CASE
    WHEN subscription_status = 'active'    THEN 'active'
    WHEN subscription_status = 'suspended' THEN 'suspended'
    ELSE 'active'
  END                                       AS status,
  created_at,
  updated_at
FROM public.organizations;

COMMENT ON VIEW public.orgs IS 'Compat view over organizations during Phase 0.A soak (2026-05-17 → 2026-05-24). Drop in Phase 0.B.';


-- ----------------------------------------------------------------------------
-- STEP 12: Mark the deprecated table for the soak window.
-- ----------------------------------------------------------------------------
COMMENT ON TABLE public.orgs_deprecated IS
  'Renamed from `orgs` on 2026-05-17 by Phase 0.A migration. Drop with Phase 0.B on 2026-05-24. DO NOT WRITE TO THIS TABLE.';


-- ----------------------------------------------------------------------------
-- STEP 13: Verification asserts at the end of the transaction.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_mpb_id           uuid;
  v_orgs_alive       int;
  v_org_view_alive   int;
  v_fk_to_orgs_left  int;
BEGIN
  -- MPB org now uses the canonical UUID.
  SELECT id INTO v_mpb_id FROM public.organizations WHERE slug = 'mpb-health';
  IF v_mpb_id <> '00000000-0000-4000-a000-000000000001' THEN
    RAISE EXCEPTION 'verify: mpb org id is % (expected 00000000-…-001)', v_mpb_id;
  END IF;

  -- orgs table no longer exists by that name.
  SELECT count(*) INTO v_orgs_alive
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'orgs' AND table_type = 'BASE TABLE';
  IF v_orgs_alive <> 0 THEN
    RAISE EXCEPTION 'verify: public.orgs base table still exists (should be renamed)';
  END IF;

  -- orgs view exists.
  SELECT count(*) INTO v_org_view_alive
  FROM information_schema.views
  WHERE table_schema = 'public' AND table_name = 'orgs';
  IF v_org_view_alive <> 1 THEN
    RAISE EXCEPTION 'verify: public.orgs compat view missing';
  END IF;

  -- No FKs remain pointing at the renamed orgs_deprecated.
  SELECT count(*) INTO v_fk_to_orgs_left
  FROM information_schema.table_constraints   tc
  JOIN information_schema.constraint_column_usage  ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.table_schema  = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_schema = 'public'
    AND ccu.table_name   IN ('orgs','orgs_deprecated')
    AND ccu.column_name  = 'id';
  IF v_fk_to_orgs_left <> 0 THEN
    RAISE EXCEPTION 'verify: % FK(s) still reference orgs/orgs_deprecated', v_fk_to_orgs_left;
  END IF;

  RAISE NOTICE 'STEP 13: verification OK — Phase 0.A complete';
END $$;

COMMIT;

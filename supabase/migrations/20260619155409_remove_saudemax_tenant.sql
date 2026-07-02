-- Remove the SaudeMAX tenant org and all of its rows. Concierge + platform are MPB-only.
-- Applied to production 2026-06-19 (version 20260619155409). All SaudeMAX rows were
-- test/seed data (created 2026-06-18/19); a full row snapshot was captured before delete.
--
-- Idempotent + defensive: guards table existence so a fresh `db reset` never errors
-- regardless of migration ordering, and never resurrects SaudeMAX (its seeds were also
-- removed from the source migrations: portal_multi_tenant_org_id_part1, concierge_tenant_cms,
-- and phase1_org_canonical_mapping).
--
-- NOTE: the "SaudeMax" product training courses in 20260122300000_external_lms_integration
-- are intentionally kept — they are a product/topic, not the tenant org.

DO $$
DECLARE
  sm uuid := '00000000-0000-4000-a000-000000000002';
BEGIN
  -- NO ACTION child of organizations -> remove before the parent row.
  IF to_regclass('public.concierge_team_members')    IS NOT NULL THEN DELETE FROM public.concierge_team_members    WHERE org_id = sm; END IF;

  -- CASCADE children (removed explicitly for an auditable, order-independent purge).
  IF to_regclass('public.crm_performance_lag_config') IS NOT NULL THEN DELETE FROM public.crm_performance_lag_config WHERE org_id = sm; END IF;
  IF to_regclass('public.crm_daily_log_ui_config')    IS NOT NULL THEN DELETE FROM public.crm_daily_log_ui_config    WHERE org_id = sm; END IF;
  IF to_regclass('public.concierge_portal_config')    IS NOT NULL THEN DELETE FROM public.concierge_portal_config    WHERE org_id = sm; END IF;
  IF to_regclass('public.org_portal_access')          IS NOT NULL THEN DELETE FROM public.org_portal_access          WHERE org_id = sm; END IF;
  IF to_regclass('public.org_memberships')            IS NOT NULL THEN DELETE FROM public.org_memberships            WHERE org_id = sm; END IF;

  -- Canonical id map rows (keyed by slug).
  IF to_regclass('public.organization_id_map')        IS NOT NULL THEN DELETE FROM public.organization_id_map        WHERE slug = 'saudemax'; END IF;

  -- Parent org rows (organizations + legacy orgs).
  IF to_regclass('public.organizations')              IS NOT NULL THEN DELETE FROM public.organizations              WHERE id = sm; END IF;
  IF to_regclass('public.orgs')                       IS NOT NULL THEN DELETE FROM public.orgs                       WHERE id = sm; END IF;
END $$;

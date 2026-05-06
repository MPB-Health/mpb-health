-- ============================================================================
-- Add "Overview" as a child of "Resources" (below Handbooks)
-- ----------------------------------------------------------------------------
-- Idempotent — keyed on `url = '/overview'` (NOT label) because a follow-up
-- migration renames the label to "Overviews". If the row already exists under
-- a different parent, it is reattached to Resources rather than duplicated.
--
-- Icon: 'Compass' (mapped in apps/advisor-portal/src/layouts/MainLayout.tsx)
-- URL:  /overview (route registered in apps/advisor-portal/src/App.tsx)
-- ============================================================================

DO $$
DECLARE
  resources_id     uuid;
  existing_id      uuid;
  existing_parent  uuid;
  existing_order   integer;
BEGIN
  SELECT id INTO resources_id
  FROM public.advisor_nav_menu
  WHERE label = 'Resources' AND parent_id IS NULL
  LIMIT 1;

  IF resources_id IS NULL THEN
    RAISE NOTICE 'No "Resources" nav row found; skipping Overview placement.';
    RETURN;
  END IF;

  -- Find any existing /overview row regardless of label/parent.
  SELECT id, parent_id, order_index
    INTO existing_id, existing_parent, existing_order
  FROM public.advisor_nav_menu
  WHERE url = '/overview'
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    -- Already in the right place: nothing to do.
    IF existing_parent IS NOT DISTINCT FROM resources_id THEN
      RETURN;
    END IF;

    -- Was previously top-level: collapse the gap left behind.
    IF existing_parent IS NULL THEN
      UPDATE public.advisor_nav_menu
         SET order_index = order_index - 1
       WHERE parent_id IS NULL
         AND order_index > existing_order;
    END IF;

    -- Reparent the existing row under Resources.
    UPDATE public.advisor_nav_menu
       SET parent_id   = resources_id,
           order_index = 1
     WHERE id = existing_id;

    RETURN;
  END IF;

  -- Fresh insert.
  INSERT INTO public.advisor_nav_menu (
    label, url, icon, parent_id,
    order_index, is_active, is_external, requires_auth
  ) VALUES (
    'Overview', '/overview', 'Compass', resources_id,
    1, true, false, true
  );
END $$;

-- ============================================================================
-- Add "Overview" as a child of "Resources" (below Handbooks)
-- ----------------------------------------------------------------------------
-- Inserts an 'Overview' nav item as a sub-item of Resources, ordered right
-- after Handbooks. If a previous version of this migration created Overview
-- as a top-level item, it is removed and the surrounding top-level order
-- indexes are restored.
--
-- Icon: 'Compass' (mapped in apps/advisor-portal/src/layouts/MainLayout.tsx)
-- URL:  /overview (route registered in apps/advisor-portal/src/App.tsx)
--
-- Idempotent: safe to run multiple times.
-- ============================================================================

DO $$
DECLARE
  resources_id uuid;
BEGIN
  SELECT id INTO resources_id
  FROM public.advisor_nav_menu
  WHERE label = 'Resources' AND parent_id IS NULL
  LIMIT 1;

  -- Undo a prior top-level placement of Overview, if it exists.
  IF EXISTS (
    SELECT 1
    FROM public.advisor_nav_menu
    WHERE label = 'Overview'
      AND url   = '/overview'
      AND parent_id IS NULL
  ) THEN
    DELETE FROM public.advisor_nav_menu
    WHERE label = 'Overview'
      AND url   = '/overview'
      AND parent_id IS NULL;

    UPDATE public.advisor_nav_menu
       SET order_index = order_index - 1
     WHERE parent_id IS NULL
       AND order_index > 5;
  END IF;

  -- Insert Overview as a child of Resources, right after Handbooks (order 0).
  IF resources_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.advisor_nav_menu
    WHERE label = 'Overview'
      AND url   = '/overview'
      AND parent_id = resources_id
  ) THEN
    INSERT INTO public.advisor_nav_menu (
      label, url, icon, parent_id,
      order_index, is_active, is_external, requires_auth
    ) VALUES (
      'Overview', '/overview', 'Compass', resources_id,
      1, true, false, true
    );
  END IF;
END $$;

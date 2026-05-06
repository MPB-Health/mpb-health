-- ============================================================================
-- Add "Overview" top-level item to advisor_nav_menu
-- ----------------------------------------------------------------------------
-- Inserts a new top-level nav item between "Resources" (order_index 4) and
-- "Forms" (order_index 5). All existing top-level items at or after order
-- index 5 are shifted by one slot.
--
-- Icon: 'Compass' (mapped in apps/advisor-portal/src/layouts/MainLayout.tsx)
-- URL:  /overview (route registered in apps/advisor-portal/src/App.tsx)
--
-- Idempotent: safe to run multiple times — the bump only happens when the
-- Overview row does not already exist.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.advisor_nav_menu
    WHERE label = 'Overview'
      AND url   = '/overview'
      AND parent_id IS NULL
  ) THEN
    UPDATE public.advisor_nav_menu
       SET order_index = order_index + 1
     WHERE parent_id IS NULL
       AND order_index >= 5;

    INSERT INTO public.advisor_nav_menu (
      label, url, icon, parent_id,
      order_index, is_active, is_external, requires_auth
    ) VALUES (
      'Overview', '/overview', 'Compass', NULL,
      5, true, false, true
    );
  END IF;
END $$;

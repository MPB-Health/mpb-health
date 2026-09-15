-- Remove the "Meetings" item from the navigation menu
DELETE FROM public.advisor_nav_menu
WHERE label = 'Meetings' AND url = '/meetings';
-- Remove the "Settings" item from the navigation menu
DELETE FROM public.advisor_nav_menu
WHERE label = 'Settings' AND url = '/settings';

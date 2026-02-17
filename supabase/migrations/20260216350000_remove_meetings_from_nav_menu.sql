-- Remove the "Meetings" item from the navigation menu
DELETE FROM nav_menu_items
WHERE label = 'Meetings' AND url = '/meetings';

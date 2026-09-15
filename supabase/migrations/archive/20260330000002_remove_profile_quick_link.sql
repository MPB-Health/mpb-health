-- Remove leftover "Profile" quick link card
DELETE FROM public.advisor_quick_links WHERE label = 'Profile';

-- ============================================================================
-- Fix duplicate quick links and split Resources & Bulletins
-- ============================================================================

-- Step 1: Delete all existing quick links (to remove duplicates)
DELETE FROM public.advisor_quick_links;
-- Step 2: Re-insert clean quick links with Resources and Bulletins split
INSERT INTO public.advisor_quick_links (label, url, icon, order_index, is_external, is_active) VALUES
    ('Employer Forms', '/employer-forms/', 'Briefcase', 1, FALSE, TRUE),
    ('Member Forms', '/member-forms/', 'Users', 2, FALSE, TRUE),
    ('Resources', '/advisor/resources', 'FolderOpen', 3, FALSE, TRUE),
    ('Bulletins', '/advisor/content', 'Newspaper', 4, FALSE, TRUE),
    ('SOP Library', '/advisor/sops', 'FileText', 5, FALSE, TRUE),
    ('My Profile', '/advisor/profile', 'Target', 6, FALSE, TRUE),
    ('All Training', '/advisor/training', 'BookOpen', 7, FALSE, TRUE),
    ('Get Support', 'https://support.mpb.health/login/advisor', 'HelpCircle', 8, TRUE, TRUE);

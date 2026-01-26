-- ============================================================================
-- Fix quick links URLs (remove trailing slashes, fix icons, fix support link)
-- ============================================================================

-- Clear and re-insert with correct URLs
DELETE FROM public.advisor_quick_links;

INSERT INTO public.advisor_quick_links (label, url, icon, order_index, is_external, is_active) VALUES
    ('Employer Forms', '/employer-forms', 'Briefcase', 1, FALSE, TRUE),
    ('Member Forms', '/member-forms', 'Users', 2, FALSE, TRUE),
    ('Resources', '/advisor/resources', 'FolderOpen', 3, FALSE, TRUE),
    ('Bulletins', '/advisor/content', 'Newspaper', 4, FALSE, TRUE),
    ('SOP Library', '/advisor/sops', 'FileText', 5, FALSE, TRUE),
    ('My Profile', '/advisor/profile', 'User', 6, FALSE, TRUE),
    ('All Training', '/advisor/training', 'BookOpen', 7, FALSE, TRUE),
    ('Get Support', '/contact', 'HelpCircle', 8, FALSE, TRUE);

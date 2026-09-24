-- Seed cms_pages rows for all main public marketing routes so the CMS admin
-- can list and edit every current site page (not only the sample /p/about-mpb).

INSERT INTO public.cms_pages (path, slug, title, description, sections, is_published)
VALUES
  ('/', 'home', 'Homepage', 'Main landing page', '[]'::jsonb, false),
  ('/plans', 'plans', 'Plans & Pricing', NULL, '[]'::jsonb, false),
  ('/compare-plans', 'compare-plans', 'Compare Plans', NULL, '[]'::jsonb, false),
  ('/get-started', 'get-started', 'Get Started', NULL, '[]'::jsonb, false),
  ('/get-a-quote', 'get-a-quote', 'Get a Quote', NULL, '[]'::jsonb, false),
  ('/enrollment', 'enrollment', 'Enrollment', NULL, '[]'::jsonb, false),
  ('/how-it-works', 'how-it-works', 'How It Works', NULL, '[]'::jsonb, false),
  ('/faq', 'faq', 'FAQ', NULL, '[]'::jsonb, false),
  ('/support', 'support', 'Support', NULL, '[]'::jsonb, false),
  ('/download-app', 'download-app', 'Download App', NULL, '[]'::jsonb, false),
  ('/individuals-and-families', 'individuals-and-families', 'Individuals & Families', NULL, '[]'::jsonb, false),
  ('/businesses-and-organizations', 'businesses-and-organizations', 'Businesses & Organizations', NULL, '[]'::jsonb, false),
  ('/advisors-and-brokers', 'advisors-and-brokers', 'Advisors & Brokers', NULL, '[]'::jsonb, false),
  ('/advisor-directory', 'advisor-directory', 'Advisor Directory', NULL, '[]'::jsonb, false),
  ('/about-us', 'about-us', 'About Us', NULL, '[]'::jsonb, false),
  ('/contact', 'contact', 'Contact', NULL, '[]'::jsonb, false),
  ('/join-our-team', 'join-our-team', 'Join Our Team', NULL, '[]'::jsonb, false),
  ('/member-stories', 'member-stories', 'Member Stories', NULL, '[]'::jsonb, false),
  ('/care-support-hub', 'care-support-hub', 'Care & Support Hub', NULL, '[]'::jsonb, false),
  ('/education-enrollment', 'education-enrollment', 'Education Enrollment', NULL, '[]'::jsonb, false),
  ('/insights-analytics', 'insights-analytics', 'Insights & Analytics', NULL, '[]'::jsonb, false),
  ('/welcome', 'welcome', 'Welcome', NULL, '[]'::jsonb, false),
  ('/mvp', 'mvp', 'Landing MVP', NULL, '[]'::jsonb, false),
  ('/privacy-policy', 'privacy-policy', 'Privacy Policy', NULL, '[]'::jsonb, false),
  ('/terms-and-conditions', 'terms-and-conditions', 'Terms & Conditions', NULL, '[]'::jsonb, false),
  ('/state-notices', 'state-notices', 'State Notices', NULL, '[]'::jsonb, false),
  ('/washington-statement', 'washington-statement', 'Washington Statement', NULL, '[]'::jsonb, false),
  ('/benefits', 'benefits', 'Benefits', NULL, '[]'::jsonb, false),
  ('/features', 'features', 'Features', NULL, '[]'::jsonb, false),
  ('/resources', 'resources', 'Resource Library', NULL, '[]'::jsonb, false),
  ('/blog', 'blog', 'Blog', NULL, '[]'::jsonb, false),
  ('/events', 'events', 'Events', NULL, '[]'::jsonb, false),
  ('/podcast', 'podcast', 'Healthy Care Podcast', NULL, '[]'::jsonb, false)
ON CONFLICT (path) DO NOTHING;

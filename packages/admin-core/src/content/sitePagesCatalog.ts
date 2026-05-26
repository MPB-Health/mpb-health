/**
 * Canonical list of marketing / info pages on the public website (React routes).
 * Used by the CMS Pages admin UI to show every editable page, not only rows
 * already present in `cms_pages`.
 */
export interface SitePageCatalogEntry {
  path: string;
  slug: string;
  title: string;
  description?: string;
  /** Group label for admin UI sections */
  group: 'core' | 'audience' | 'info' | 'legal' | 'content';
}

export const SITE_PAGES_CATALOG: SitePageCatalogEntry[] = [
  { path: '/', slug: 'home', title: 'Homepage', group: 'core', description: 'Main landing page' },
  { path: '/plans', slug: 'plans', title: 'Plans & Pricing', group: 'core' },
  { path: '/compare-plans', slug: 'compare-plans', title: 'Compare Plans', group: 'core' },
  { path: '/get-started', slug: 'get-started', title: 'Get Started', group: 'core' },
  { path: '/get-a-quote', slug: 'get-a-quote', title: 'Get a Quote', group: 'core' },
  { path: '/enrollment', slug: 'enrollment', title: 'Enrollment', group: 'core' },
  { path: '/how-it-works', slug: 'how-it-works', title: 'How It Works', group: 'core' },
  { path: '/faq', slug: 'faq', title: 'FAQ', group: 'core' },
  { path: '/support', slug: 'support', title: 'Support', group: 'core' },
  { path: '/download-app', slug: 'download-app', title: 'Download App', group: 'core' },
  {
    path: '/individuals-and-families',
    slug: 'individuals-and-families',
    title: 'Individuals & Families',
    group: 'audience',
  },
  {
    path: '/businesses-and-organizations',
    slug: 'businesses-and-organizations',
    title: 'Businesses & Organizations',
    group: 'audience',
  },
  {
    path: '/advisors-and-brokers',
    slug: 'advisors-and-brokers',
    title: 'Advisors & Brokers',
    group: 'audience',
  },
  { path: '/advisor-directory', slug: 'advisor-directory', title: 'Advisor Directory', group: 'audience' },
  { path: '/about-us', slug: 'about-us', title: 'About Us', group: 'info' },
  { path: '/contact', slug: 'contact', title: 'Contact', group: 'info' },
  { path: '/join-our-team', slug: 'join-our-team', title: 'Join Our Team', group: 'info' },
  { path: '/member-stories', slug: 'member-stories', title: 'Member Stories', group: 'info' },
  { path: '/care-support-hub', slug: 'care-support-hub', title: 'Care & Support Hub', group: 'info' },
  {
    path: '/education-enrollment',
    slug: 'education-enrollment',
    title: 'Education Enrollment',
    group: 'info',
  },
  {
    path: '/insights-analytics',
    slug: 'insights-analytics',
    title: 'Insights & Analytics',
    group: 'info',
  },
  { path: '/welcome', slug: 'welcome', title: 'Welcome', group: 'info' },
  { path: '/mvp', slug: 'mvp', title: 'Landing MVP', group: 'info' },
  { path: '/privacy-policy', slug: 'privacy-policy', title: 'Privacy Policy', group: 'legal' },
  {
    path: '/terms-and-conditions',
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    group: 'legal',
  },
  { path: '/state-notices', slug: 'state-notices', title: 'State Notices', group: 'legal' },
  {
    path: '/washington-statement',
    slug: 'washington-statement',
    title: 'Washington Statement',
    group: 'legal',
  },
  { path: '/features', slug: 'features', title: 'Features', group: 'content' },
  { path: '/resources', slug: 'resources', title: 'Resource Library', group: 'content' },
  { path: '/blog', slug: 'blog', title: 'Blog', group: 'content' },
  { path: '/events', slug: 'events', title: 'Events', group: 'content' },
  { path: '/podcast', slug: 'podcast', title: 'Healthy Care Podcast', group: 'content' },
];

export function getSitePageByPath(path: string): SitePageCatalogEntry | undefined {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return SITE_PAGES_CATALOG.find((p) => p.path === normalized);
}

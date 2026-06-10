import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/overview': 'Overview',
  '/training': 'Training',
  '/forms': 'Forms',
  '/quick-links': 'Quick Links',
  '/sops': 'SOP Library',
  '/bulletins': 'Bulletins',
  '/videos': 'Video Library',
  '/submit-group': 'Submit Group',
  '/contact': 'Contact',
  '/tickets': 'Support Tickets',
  '/tickets/new': 'New Ticket',
  '/chat': 'Chat',
  '/inbox': 'Inbox',
  '/leads': 'Assigned Leads',
  '/audit-log': 'Audit Log',
  '/events/manage': 'Events',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/settings/organization': 'Organization Settings',
  '/settings/team': 'Team Management',
  '/settings/notifications': 'Notification Preferences',
  '/settings/preferences': 'User Preferences',
  '/settings/api-keys': 'API Keys',
  '/settings/integrations': 'Integrations',
  '/admin/tickets': 'Admin Tickets',
  '/add-advisor': 'Add Advisor',
};

function titleForPath(pathname: string): string {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];

  if (pathname.startsWith('/training/')) return 'Training';
  if (pathname.startsWith('/forms/')) return 'Forms';
  if (pathname.startsWith('/sops/')) return 'SOP Library';
  if (pathname.startsWith('/bulletins/')) return 'Bulletin';
  if (pathname.startsWith('/tickets/')) return 'Support Ticket';
  if (pathname.startsWith('/chat/')) return 'Chat';
  if (pathname.startsWith('/inbox/')) return 'Inbox';
  if (pathname.startsWith('/leads/')) return 'Assigned Lead';
  if (pathname.startsWith('/events/manage/')) return 'Event';

  return 'Advisor Portal';
}

/** Authenticated advisor routes are private and should stay out of search indexes. */
export function PortalSeo() {
  const { pathname } = useLocation();
  const section = titleForPath(pathname);

  return (
    <Helmet>
      <title>{section} | MPB Health Advisor Portal</title>
      <meta
        name="description"
        content="Secure advisor workspace for MPB Health champions. Sign in required — not a public enrollment or member marketing page."
      />
      <meta name="robots" content="noindex, follow" />
    </Helmet>
  );
}

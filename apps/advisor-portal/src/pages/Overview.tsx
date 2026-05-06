import { Link } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  Bell,
  BookOpen,
  FileText,
  GraduationCap,
  Video,
  UsersRound,
  Headphones,
  Link as LinkIcon,
  ArrowRight,
} from 'lucide-react';

interface OverviewLink {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const QUICK_LINKS: OverviewLink[] = [
  {
    title: 'Dashboard',
    description: 'Your daily snapshot — meetings, announcements, and quick actions.',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Bulletins',
    description: 'Latest announcements and updates from MPB Health.',
    href: '/bulletins',
    icon: Bell,
  },
  {
    title: 'Resource Center',
    description: 'One-click access to the most-used advisor links and tools.',
    href: '/quick-links',
    icon: LinkIcon,
  },
  {
    title: 'Resources',
    description: 'Handbooks, reference materials, pricing charts, and product flyers.',
    href: '/sops',
    icon: BookOpen,
  },
  {
    title: 'Forms',
    description: 'Advisor, employer, and member forms in one place.',
    href: '/forms',
    icon: FileText,
  },
  {
    title: 'Training',
    description: 'MPB, Sedera, and Zion training modules and certifications.',
    href: '/training',
    icon: GraduationCap,
  },
  {
    title: 'Video Library',
    description: 'On-demand training, product walkthroughs, and recordings.',
    href: '/videos',
    icon: Video,
  },
  {
    title: 'Submit a Group',
    description: 'Start a new group submission for employer enrollment.',
    href: '/submit-group',
    icon: UsersRound,
  },
  {
    title: 'Support Tickets',
    description: 'Open and track support requests with the MPB team.',
    href: '/tickets',
    icon: Headphones,
  },
];

export default function Overview() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-th-accent-100 dark:bg-th-accent-900/30">
          <Compass className="w-6 h-6 text-th-accent-600 dark:text-th-accent-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Overview</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            A quick tour of everything available in the advisor portal
          </p>
        </div>
      </div>

      {/* Intro card */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <h2 className="text-lg font-semibold text-th-text-primary mb-2">
          Welcome to the MPB Health Advisor Portal
        </h2>
        <p className="text-sm text-th-text-secondary leading-relaxed">
          This portal centralizes the tools, training, and resources you need to serve your
          clients. Use the quick links below to jump to any section, or open the side
          navigation for the full menu.
        </p>
      </div>

      {/* Quick links grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {QUICK_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className="group bg-surface-primary rounded-xl border border-th-border hover:border-th-accent-300 hover:shadow-md transition-all flex flex-col p-5 gap-3"
            >
              <div className="w-10 h-10 bg-th-accent-100 dark:bg-th-accent-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-th-accent-600 dark:text-th-accent-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-th-text-primary group-hover:text-th-accent-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-th-text-tertiary mt-1">{item.description}</p>
              </div>
              <div className="flex items-center gap-1 text-sm text-th-accent-600 font-medium mt-auto pt-3 border-t border-th-border-subtle">
                Open
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

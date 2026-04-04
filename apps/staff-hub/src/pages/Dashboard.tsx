import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Globe,
  HeadsetIcon,
  ExternalLink,
  Loader2,
  LogOut,
  Shield,
  Clock,
} from 'lucide-react';
import { supabase } from '@mpbhealth/database';
import { usePortalAccess, useSSONavigation } from '@mpbhealth/auth';
import { getPortalUrl, PORTALS, type PortalKey } from '@mpbhealth/config';
import toast from 'react-hot-toast';

interface PortalCardDef {
  key: PortalKey;
  name: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  openInNewTab?: boolean;
}

const PORTAL_CARDS: PortalCardDef[] = [
  {
    key: 'admin',
    name: 'Admin Portal',
    description: 'Manage users, enrollments, content, and platform settings',
    icon: LayoutDashboard,
    gradient: 'from-blue-500/10 to-blue-600/5',
    iconBg: 'bg-blue-500/15 text-blue-600',
  },
  {
    key: 'crm',
    name: 'CRM',
    description: 'Manage leads, sales pipeline, and client relationships',
    icon: Users,
    gradient: 'from-indigo-500/10 to-indigo-600/5',
    iconBg: 'bg-indigo-500/15 text-indigo-600',
  },
  {
    key: 'advisors',
    name: 'Advisor Portal',
    description: 'Training modules, meetings, resources, and member tools',
    icon: GraduationCap,
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    iconBg: 'bg-emerald-500/15 text-emerald-600',
  },
  {
    key: 'website',
    name: 'Website Backend',
    description: 'CMS, blog management, and site configuration',
    icon: Globe,
    gradient: 'from-amber-500/10 to-amber-600/5',
    iconBg: 'bg-amber-500/15 text-amber-600',
  },
  {
    key: 'support',
    name: 'Support Portal',
    description: 'IT support ticketing and issue tracking',
    icon: HeadsetIcon,
    gradient: 'from-purple-500/10 to-purple-600/5',
    iconBg: 'bg-purple-500/15 text-purple-600',
    openInNewTab: true,
  },
];

export default function Dashboard() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
      }
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const {
    canAccessAdmin,
    canAccessAdvisor,
    canAccessCrm,
    canAccessSupport,
    loading: rolesLoading,
    roles,
  } = usePortalAccess(user?.id);

  const { navigateToPortal, loadingPortal } = useSSONavigation();

  const canAccess = (key: PortalKey): boolean => {
    switch (key) {
      case 'admin': return canAccessAdmin;
      case 'crm': return canAccessCrm;
      case 'advisors': return canAccessAdvisor;
      case 'website': return canAccessAdmin;
      case 'support': return canAccessSupport;
      default: return false;
    }
  };

  const visiblePortals = PORTAL_CARDS.filter((p) => canAccess(p.key));

  const handleNavigate = async (portal: PortalCardDef) => {
    try {
      await navigateToPortal(portal.key, { newTab: portal.openInNewTab });
    } catch {
      const fallback = getPortalUrl(portal.key as keyof typeof PORTALS);
      if (portal.openInNewTab) {
        window.open(fallback, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = fallback;
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
    window.location.href = '/login';
  };

  if (sessionLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-sm text-slate-500">Loading your portals...</p>
        </div>
      </div>
    );
  }

  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">MPB</span>
            </div>
            <span className="font-semibold text-slate-800 text-lg">Staff Hub</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Greeting */}
        <div className="mb-10 animate-fade-up">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{greeting}</h1>
          <p className="text-slate-500 text-lg">Select a portal to get started.</p>
        </div>

        {/* Portal cards */}
        {visiblePortals.length === 0 ? (
          <div className="animate-fade-up text-center py-16 rounded-2xl border border-dashed border-slate-300 bg-white">
            <Shield className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h2 className="text-lg font-semibold text-slate-700 mb-2">No portals assigned</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              You don&apos;t have access to any portals yet. Contact your administrator
              to get access assigned to your account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visiblePortals.map((portal, i) => {
              const Icon = portal.icon;
              const isLoading = loadingPortal === portal.key;

              return (
                <button
                  key={portal.key}
                  onClick={() => handleNavigate(portal)}
                  disabled={isLoading}
                  className="animate-fade-up group relative text-left rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-lg hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 disabled:opacity-60 disabled:cursor-wait"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${portal.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${portal.iconBg} transition-transform group-hover:scale-110`}>
                        {isLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      {portal.openInNewTab && (
                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                      )}
                    </div>

                    <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-slate-900">{portal.name}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{portal.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Role badges */}
        {roles.length > 0 && (
          <div className="mt-12 animate-fade-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>Your roles</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200/80"
                >
                  <Shield className="w-3 h-3" />
                  {formatRole(role)}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-slate-400">
          <span>MPB Health, Inc.</span>
          <span className="inline-flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            HIPAA Compliant
          </span>
        </div>
      </footer>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatRole(role: string): string {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

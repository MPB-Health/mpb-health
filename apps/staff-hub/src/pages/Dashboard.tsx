import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  HeadsetIcon,
  ExternalLink,
  Loader2,
  Shield,
  FileSpreadsheet,
  FormInput,
  Database,
  MessageSquare,
  Phone,
  Heart,
  ShieldPlus,
  Mail,
  Calendar,
  CalendarClock,
  CalendarDays,
  Boxes,
  Workflow,
  HandHeart,
  Sparkles,
  Clock3,
  ArrowUpRight,
} from 'lucide-react';
import { supabase } from '@mpbhealth/database';
import { usePortalAccess, useTenant } from '@mpbhealth/auth';
import { getPortalUrl, type PortalKey } from '@mpbhealth/config';
import toast from 'react-hot-toast';
import {
  ARYX_APPS,
  HR_ATTENDANCE_ENABLED,
  HR_TIME_OFF_ENABLED,
  getBrowserPosition,
  getOpenSession,
  listMySessions,
  loadAttendanceContext,
  punchAttendance,
  type StaffAttendanceSession,
  type StaffProfile,
} from '../lib/hr';
import { DashboardPresenceHero } from '../components/hr/DashboardPresenceHero';
import { ClockingLog } from '../components/hr/ClockingLog';

interface PortalCardDef {
  key: PortalKey;
  name: string;
  description: string;
  icon: React.ElementType;
  well: string;
  openInNewTab?: boolean;
}

const PORTAL_CARDS: PortalCardDef[] = [
  {
    key: 'admin',
    name: 'Admin Portal',
    description: 'Users, enrollments, content, and platform settings',
    icon: LayoutDashboard,
    well: 'hr-icon-well-accent',
    openInNewTab: true,
  },
  {
    key: 'crm',
    name: 'CRM',
    description: 'Leads, pipeline, and client relationships',
    icon: Users,
    well: 'hr-icon-well-sky',
    openInNewTab: true,
  },
  {
    key: 'advisors',
    name: 'Advisor Portal',
    description: 'Training, meetings, and member tools',
    icon: GraduationCap,
    well: 'hr-icon-well-signal',
    openInNewTab: true,
  },
  {
    key: 'support',
    name: 'Support Portal',
    description: 'IT ticketing and issue tracking',
    icon: HeadsetIcon,
    well: 'hr-icon-well-teal',
    openInNewTab: true,
  },
];

interface ExternalLinkDef {
  key: string;
  name: string;
  description: string;
  url: string;
  icon: React.ElementType;
  well: string;
}

const HEALTHSHARE_PARTNERS: ExternalLinkDef[] = [
  {
    key: 'zion-healthshare',
    name: 'Zion HealthShare',
    description: 'Health sharing community portal',
    url: 'https://zionhealthshare.org/',
    icon: Heart,
    well: 'hr-icon-well-rose',
  },
  {
    key: 'sedera',
    name: 'Sedera',
    description: 'Medical cost sharing platform',
    url: 'https://sedera.com/',
    icon: ShieldPlus,
    well: 'hr-icon-well-signal',
  },
  {
    key: 'evertrust',
    name: 'EverTrust',
    description: 'Community health share memberships',
    url: 'https://evertrusthealth.org/',
    icon: HandHeart,
    well: 'hr-icon-well-accent',
  },
  {
    key: 'sharewell',
    name: 'ShareWell',
    description: 'Health care sharing community',
    url: 'https://sharewellhealth.org/',
    icon: Sparkles,
    well: 'hr-icon-well-teal',
  },
];

const EXTERNAL_LINKS: ExternalLinkDef[] = [
  {
    key: 'e123',
    name: 'E123',
    description: 'Enrollment administration platform',
    url: 'https://www.1administration.com/manage/',
    icon: FileSpreadsheet,
    well: 'hr-icon-well-teal',
  },
  {
    key: 'cognito-forms',
    name: 'Cognito Forms',
    description: 'Form builder and data collection',
    url: 'https://www.cognitoforms.com/login',
    icon: FormInput,
    well: 'hr-icon-well-sky',
  },
  {
    key: 'zoho-crm',
    name: 'Zoho CRM',
    description: 'Legacy CRM and customer management',
    url: 'https://www.zoho.com/crm/login.html',
    icon: Database,
    well: 'hr-icon-well-rose',
  },
  {
    key: 'zoho-salesiq',
    name: 'Zoho Sales IQ',
    description: 'Live chat and visitor tracking',
    url: 'https://www.zoho.com/salesiq/login.html',
    icon: MessageSquare,
    well: 'hr-icon-well-amber',
  },
  {
    key: 'goto-connect',
    name: 'GoTo Connect',
    description: 'Phone system and communications',
    url: 'https://identity.goto.com/login',
    icon: Phone,
    well: 'hr-icon-well-sky',
  },
  {
    key: 'outlook',
    name: 'Outlook',
    description: 'Email, calendar, and contacts',
    url: 'https://outlook.office.com/mail/',
    icon: Mail,
    well: 'hr-icon-well-accent',
  },
  {
    key: 'outlook-calendar',
    name: 'Outlook Calendar',
    description: 'Schedule meetings and manage events',
    url: 'https://outlook.office.com/calendar/',
    icon: Calendar,
    well: 'hr-icon-well-ink',
  },
];

function HubTileLink({
  href,
  external,
  icon: Icon,
  well,
  name,
  description,
  trailing,
  delayMs,
  onClick,
  loading,
}: {
  href?: string;
  external?: boolean;
  icon: React.ElementType;
  well: string;
  name: string;
  description: string;
  trailing?: React.ReactNode;
  delayMs?: number;
  onClick?: () => void;
  loading?: boolean;
}) {
  const inner = (
    <>
      <div className="mb-4 flex items-start justify-between">
        <div className={`hr-icon-well ${well}`}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
        </div>
        {trailing}
      </div>
      <h3 className="mb-1 font-semibold text-[color:var(--hr-ink)]">{name}</h3>
      <p className="text-sm leading-relaxed text-[color:var(--hr-muted)]">{description}</p>
    </>
  );

  const className = 'hr-hub-tile animate-fade-up';
  const style = delayMs != null ? { animationDelay: `${delayMs}ms` } : undefined;

  if (onClick) {
    return (
      <div className={className} style={style}>
        <button
          type="button"
          onClick={onClick}
          disabled={loading}
          className="hr-hub-tile-inner group disabled:cursor-wait disabled:opacity-60"
        >
          {inner}
        </button>
      </div>
    );
  }

  if (external && href) {
    return (
      <div className={className} style={style}>
        <a href={href} target="_blank" rel="noopener noreferrer" className="hr-hub-tile-inner group">
          {inner}
        </a>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <Link to={href ?? '/'} className="hr-hub-tile-inner group">
        {inner}
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const { orgId, loading: tenantLoading } = useTenant();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [openSession, setOpenSession] = useState<StaffAttendanceSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<StaffAttendanceSession[]>([]);
  const [remoteEligible, setRemoteEligible] = useState(false);
  const [presenceLoading, setPresenceLoading] = useState(HR_ATTENDANCE_ENABLED);
  const [punchBusy, setPunchBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
      }
      setSessionLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const reloadPresence = useCallback(async () => {
    if (!HR_ATTENDANCE_ENABLED) return;
    const [ctx, open, sessions] = await Promise.all([
      loadAttendanceContext(),
      getOpenSession(),
      listMySessions(12),
    ]);
    setProfile(ctx.profile);
    setRemoteEligible(ctx.remoteEligible);
    setOpenSession(open);
    setRecentSessions(sessions);
  }, []);

  useEffect(() => {
    if (!HR_ATTENDANCE_ENABLED) {
      setPresenceLoading(false);
      return;
    }
    if (tenantLoading || !orgId || sessionLoading || !user) return;
    let cancelled = false;
    (async () => {
      try {
        await reloadPresence();
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Could not load presence');
        }
      } finally {
        if (!cancelled) setPresenceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantLoading, orgId, sessionLoading, user, reloadPresence]);

  const {
    canAccessAdmin,
    canAccessAdvisor,
    canAccessCrm,
    canAccessSupport,
    loading: rolesLoading,
    roles,
  } = usePortalAccess(user?.id);

  const [loadingPortal, setLoadingPortal] = useState<string | null>(null);

  const canAccess = (key: PortalKey): boolean => {
    switch (key) {
      case 'admin':
        return canAccessAdmin;
      case 'crm':
        return canAccessCrm;
      case 'advisors':
        return canAccessAdvisor;
      case 'support':
        return canAccessSupport;
      default:
        return false;
    }
  };

  const visiblePortals = PORTAL_CARDS.filter((p) => canAccess(p.key));

  const handleNavigate = async (portal: PortalCardDef) => {
    setLoadingPortal(portal.key);
    try {
      const url = getPortalUrl(portal.key);
      if (portal.openInNewTab) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    } catch {
      toast.error('Failed to navigate to portal');
    } finally {
      setLoadingPortal(null);
    }
  };

  const runPunch = async (action: 'clock_in' | 'clock_out') => {
    if (punchBusy) return;
    setPunchBusy(true);
    const idempotencyKey = `${action}:${crypto.randomUUID()}`;
    try {
      let position = null;
      if (!remoteEligible) {
        toast.loading('Getting your location…', { id: 'geo' });
        position = await getBrowserPosition();
        toast.dismiss('geo');
      }

      const result = await punchAttendance({
        action,
        position,
        idempotency_key: idempotencyKey,
      });

      if (!result.ok) {
        toast.error(result.message || result.error || 'Punch failed');
        return;
      }

      toast.success(action === 'clock_in' ? 'Clocked in' : 'Clocked out');
      await reloadPresence();
    } catch (err) {
      toast.dismiss('geo');
      toast.error(err instanceof Error ? err.message : 'Punch failed');
    } finally {
      setPunchBusy(false);
    }
  };

  if (sessionLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="hr-icon-well hr-icon-well-accent">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <p className="text-sm text-[color:var(--hr-muted)]">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const greeting = getGreeting();

  return (
    <div className="hr-surface space-y-10">
      {HR_ATTENDANCE_ENABLED ? (
        <DashboardPresenceHero
          greeting={greeting}
          profile={profile}
          openSession={openSession}
          remoteEligible={remoteEligible}
          busy={punchBusy}
          loading={presenceLoading}
          onClockIn={() => void runPunch('clock_in')}
          onClockOut={() => void runPunch('clock_out')}
        />
      ) : (
        <div className="animate-fade-up">
          <h1 className="hub-hero-title mb-3">{greeting}</h1>
          <p className="max-w-xl text-base text-[color:var(--hr-muted)] sm:text-lg">
            Launch portals, partner communities, and daily tools from one place.
          </p>
        </div>
      )}

      {HR_ATTENDANCE_ENABLED ? (
        <section className="animate-fade-up" style={{ animationDelay: '40ms' }}>
          <ClockingLog
            sessions={recentSessions}
            title="Recent clockings"
            emptyBody="Your punch history shows here after you clock in."
            compact
            showViewAll
          />
        </section>
      ) : null}

      {(HR_ATTENDANCE_ENABLED || HR_TIME_OFF_ENABLED) && (
        <section className="animate-fade-up" style={{ animationDelay: '70ms' }}>
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="hub-section-title">Your day</h2>
            {HR_ATTENDANCE_ENABLED ? (
              <Link
                to="/attendance"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--hr-accent)]"
              >
                Attendance detail
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {HR_ATTENDANCE_ENABLED ? (
              <HubTileLink
                href="/attendance"
                icon={Clock3}
                well="hr-icon-well-ink"
                name="Attendance"
                description="History, geofence, and standing remote requests."
              />
            ) : null}
            {HR_TIME_OFF_ENABLED ? (
              <>
                <HubTileLink
                  href="/time-off"
                  icon={CalendarClock}
                  well="hr-icon-well-accent"
                  name="Request time off"
                  description="PTO, sick days, appointments, and leave."
                />
                <HubTileLink
                  href="/calendar"
                  icon={CalendarDays}
                  well="hr-icon-well-signal"
                  name="Team calendar"
                  description="See who is out by name and leave type."
                />
              </>
            ) : null}
          </div>
        </section>
      )}

      <section className="animate-fade-up" style={{ animationDelay: '80ms' }}>
        <h2 className="hub-section-title mb-4">Portals</h2>
        {visiblePortals.length === 0 ? (
          <div className="hr-bezel">
            <div className="hr-bezel-inner px-6 py-14 text-center">
              <Shield className="mx-auto mb-4 h-10 w-10 text-[color:var(--hr-mist)]" />
              <h3 className="mb-2 text-lg font-semibold text-[color:var(--hr-ink)]">
                No portals assigned
              </h3>
              <p className="mx-auto max-w-md text-sm text-[color:var(--hr-muted)]">
                You do not have portal access yet. Contact your administrator to get roles
                assigned.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePortals.map((portal, i) => (
              <HubTileLink
                key={portal.key}
                icon={portal.icon}
                well={portal.well}
                name={portal.name}
                description={portal.description}
                delayMs={i * 50}
                loading={loadingPortal === portal.key}
                onClick={() => handleNavigate(portal)}
                trailing={
                  portal.openInNewTab ? (
                    <ExternalLink className="h-4 w-4 text-slate-300 transition-colors group-hover:text-[color:var(--hr-muted)]" />
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="hub-section-title">Healthshare partners</h2>
          <div className="hub-partner-strip !mb-0">
            {HEALTHSHARE_PARTNERS.map((p) => (
              <span key={p.key} className="hub-partner-chip">
                {p.name}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HEALTHSHARE_PARTNERS.map((link, i) => (
            <HubTileLink
              key={link.key}
              href={link.url}
              external
              icon={link.icon}
              well={link.well}
              name={link.name}
              description={link.description}
              delayMs={i * 40}
              trailing={
                <ExternalLink className="h-4 w-4 text-slate-300 transition-colors group-hover:text-[color:var(--hr-muted)]" />
              }
            />
          ))}
        </div>
      </section>

      <section className="animate-fade-up" style={{ animationDelay: '160ms' }}>
        <h2 className="hub-section-title mb-4">ARYX Platform</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ARYX_APPS.map((app, i) => {
            const Icon = app.key === 'aryx-crm' ? Boxes : Workflow;
            return (
              <HubTileLink
                key={app.key}
                href={app.url}
                external
                icon={Icon}
                well="hr-icon-well-ink"
                name={app.name}
                description={app.description}
                delayMs={i * 40}
                trailing={
                  <ExternalLink className="h-4 w-4 text-slate-300 transition-colors group-hover:text-[color:var(--hr-muted)]" />
                }
              />
            );
          })}
        </div>
      </section>

      <section className="animate-fade-up" style={{ animationDelay: '200ms' }}>
        <h2 className="hub-section-title mb-4">Tools & services</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXTERNAL_LINKS.map((link, i) => (
            <HubTileLink
              key={link.key}
              href={link.url}
              external
              icon={link.icon}
              well={link.well}
              name={link.name}
              description={link.description}
              delayMs={i * 35}
              trailing={
                <ExternalLink className="h-4 w-4 text-slate-300 transition-colors group-hover:text-[color:var(--hr-muted)]" />
              }
            />
          ))}
        </div>
      </section>

      {roles.length > 0 && (
        <div className="animate-fade-up pt-2" style={{ animationDelay: '240ms' }}>
          <div className="mb-3 flex items-center gap-2 text-xs text-[color:var(--hr-muted)]">
            <Shield className="h-3.5 w-3.5" />
            <span>Your roles</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--hr-elevated)]/90 px-3 py-1.5 text-xs font-medium text-[color:var(--hr-ink)] shadow-[inset_0_0_0_1px_var(--hr-line)]"
              >
                <Shield className="h-3 w-3 text-[color:var(--hr-accent)]" />
                {formatRole(role)}
              </span>
            ))}
          </div>
        </div>
      )}
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

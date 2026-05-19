import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Users,
  UserCheck,
  UserPlus,
  Target,
  LifeBuoy,
  Megaphone,
  Bell,
  ArrowRight,
  ExternalLink,
  X,
  Info,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TreePine,
  DollarSign,
  Wallet,
  Clock,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  advisorOverviewService,
  contentService,
  type Announcement,
  type Bulletin,
  type AdvisorMemberBookStats,
  type AdvisorCommissionStats,
  type AdvisorTreeStats,
  type OverviewDataStatus,
} from '@mpbhealth/advisor-core';
import { Button, MetricCard, SkeletonLine } from '@mpbhealth/ui';

interface AdvisorAtAGlanceProps {
  profileId: string | null;
  agentId: string | null;
  orgId: string | null;
  advisorReady: boolean;
  announcements: Announcement[];
  dismissedAnnouncementIds: Set<string>;
  onDismissAnnouncement: (id: string) => void;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatCount(n: number | undefined): string {
  return n === undefined ? '—' : String(n);
}

function ComingSoonSection({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-th-border bg-surface-tertiary/30 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-th-border-subtle">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-th-accent-600 dark:text-th-accent-400 flex-shrink-0">{icon}</span>
          <span className="text-sm font-semibold text-th-text-primary">{title}</span>
        </div>
        {action}
      </div>
      <div className="px-4 py-6 text-center space-y-2">
        <span className="inline-flex items-center rounded-full bg-th-accent-50 dark:bg-th-accent-900/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-th-accent-700 dark:text-th-accent-300">
          Coming soon
        </span>
        <p className="text-sm text-th-text-secondary max-w-md mx-auto">{description}</p>
      </div>
    </div>
  );
}

export default function AdvisorAtAGlance({
  profileId,
  agentId,
  orgId,
  advisorReady,
  announcements,
  dismissedAnnouncementIds,
  onDismissAnnouncement,
}: AdvisorAtAGlanceProps) {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['advisorOverview', profileId, agentId, orgId],
    queryFn: () =>
      advisorOverviewService.getOverview({
        userId: profileId!,
        agentId,
        orgId,
      }),
    enabled: advisorReady && !!profileId,
    staleTime: 60 * 1000,
  });

  const { data: recentBulletins = [], isLoading: bulletinsLoading } = useQuery({
    queryKey: ['dashboardRecentBulletins', profileId],
    queryFn: () =>
      contentService.getBulletins({}, profileId ?? undefined, { includeContent: false, limit: 4 }),
    enabled: advisorReady,
    staleTime: 2 * 60 * 1000,
  });

  const visibleAnnouncements = announcements.filter((a) => !dismissedAnnouncementIds.has(a.id));
  const members = overview?.members;
  const showUpdates =
    visibleAnnouncements.length > 0 || recentBulletins.length > 0 || bulletinsLoading;

  return (
    <section className="space-y-4" aria-labelledby="at-a-glance-heading">
      <div>
        <h2 id="at-a-glance-heading" className="text-lg font-semibold text-th-text-primary">
          At a glance
        </h2>
        <p className="text-sm text-th-text-tertiary mt-0.5">
          Your book of business and updates from MPB Health
        </p>
      </div>

      <OverviewMetrics
        loading={overviewLoading}
        members={members}
        assignedLeads={overview?.assignedLeads}
        openTickets={overview?.openTickets}
      />

      <CommissionMetrics
        loading={overviewLoading}
        status={overview?.commissionsStatus ?? 'coming_soon'}
        commissions={overview?.commissions ?? undefined}
      />

      <AgentTreePanel
        loading={overviewLoading}
        status={overview?.treeStatus ?? 'coming_soon'}
        tree={overview?.tree}
      />

      {showUpdates && (
        <MpbUpdatesPanel
          announcements={visibleAnnouncements}
          bulletins={recentBulletins}
          bulletinsLoading={bulletinsLoading}
          onDismissAnnouncement={onDismissAnnouncement}
        />
      )}
    </section>
  );
}

function OverviewMetrics({
  loading,
  members,
  assignedLeads,
  openTickets,
}: {
  loading: boolean;
  members?: AdvisorMemberBookStats;
  assignedLeads?: number;
  openTickets?: number;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-th-border bg-surface-primary p-4 space-y-2">
            <SkeletonLine className="h-3 w-20" />
            <SkeletonLine className="h-7 w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <MetricCard
        label="Total members"
        value={formatCount(members?.totalMembers)}
        icon={<Users className="w-5 h-5" />}
        className="min-h-[88px]"
      />
      <MetricCard
        label="Active members"
        value={formatCount(members?.activeMembers)}
        icon={<UserCheck className="w-5 h-5 text-emerald-500" />}
        className="min-h-[88px]"
      />
      <MetricCard
        label="Enrollments this month"
        value={formatCount(members?.newEnrollmentsThisMonth)}
        icon={<UserPlus className="w-5 h-5 text-th-accent-500" />}
        className="min-h-[88px]"
      />
      <Link to="/leads" className="block text-left">
        <MetricCard
          label="Assigned leads"
          value={formatCount(assignedLeads)}
          icon={<Target className="w-5 h-5 text-violet-500" />}
          className="min-h-[88px] hover:border-th-accent-300 transition-colors"
        />
      </Link>
      <Link to="/tickets" className="block text-left">
        <MetricCard
          label="Open tickets"
          value={formatCount(openTickets)}
          icon={<LifeBuoy className="w-5 h-5 text-amber-500" />}
          className="min-h-[88px] hover:border-th-accent-300 transition-colors"
        />
      </Link>
    </div>
  );
}

function CommissionMetrics({
  loading,
  status,
  commissions,
}: {
  loading: boolean;
  status: OverviewDataStatus;
  commissions?: AdvisorCommissionStats;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-th-border bg-surface-primary p-4 space-y-2">
        <SkeletonLine className="h-4 w-40" />
        <SkeletonLine className="h-16 w-full" />
      </div>
    );
  }

  if (status === 'coming_soon') {
    return (
      <ComingSoonSection
        title="Commissions"
        description="Commission balances, payouts, and downline earnings will appear here once reporting is live in the advisor portal."
        icon={<DollarSign className="w-4 h-4" />}
      />
    );
  }

  const c = commissions ?? {
    pendingAmount: 0,
    earnedAmount: 0,
    paidAmount: 0,
    paidThisMonth: 0,
    recordCount: 0,
    lastPayoutAmount: null,
    lastPayoutDate: null,
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-th-text-tertiary">
        Commissions (you + downline)
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Pending"
          value={formatMoney(c.pendingAmount)}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          className="min-h-[88px]"
        />
        <MetricCard
          label="Earned / approved"
          value={formatMoney(c.earnedAmount)}
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
          className="min-h-[88px]"
        />
        <MetricCard
          label="Paid this month"
          value={formatMoney(c.paidThisMonth)}
          icon={<Wallet className="w-5 h-5 text-th-accent-500" />}
          className="min-h-[88px]"
        />
        <MetricCard
          label="Total paid"
          value={formatMoney(c.paidAmount)}
          icon={<DollarSign className="w-5 h-5 text-violet-500" />}
          className="min-h-[88px]"
        />
      </div>
      {c.lastPayoutDate && (
        <p className="text-xs text-th-text-tertiary">
          Last payout: {formatMoney(c.lastPayoutAmount ?? 0)} on{' '}
          {format(new Date(c.lastPayoutDate), 'MMM d, yyyy')}
        </p>
      )}
    </div>
  );
}

function AgentTreePanel({
  loading,
  status,
  tree,
}: {
  loading: boolean;
  status: OverviewDataStatus;
  tree?: AdvisorTreeStats | null;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-th-border bg-surface-primary p-4 space-y-3">
        <SkeletonLine className="h-4 w-32" />
        <SkeletonLine className="h-16 w-full" />
      </div>
    );
  }

  if (status === 'coming_soon') {
    return (
      <ComingSoonSection
        title="Agent tree"
        description="Downline advisors, team enrollment totals, and sub-agent performance will appear here once agent hierarchy reporting is live."
        icon={<TreePine className="w-4 h-4" />}
        action={
          <Link
            to="/add-advisor"
            className="text-xs font-medium text-th-accent-600 hover:text-th-accent-700 flex items-center gap-1 flex-shrink-0"
          >
            Add sub-agent
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />
    );
  }

  const t = tree ?? {
    directSubagents: 0,
    totalAgentsInTree: 0,
    activeAgentsInTree: 0,
    teamMembers: 0,
    teamActiveMembers: 0,
    teamEnrollmentsThisMonth: 0,
    treeDepth: 0,
    subagents: [],
  };

  return (
    <div className="rounded-xl border border-th-border bg-surface-primary overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-th-border-subtle bg-surface-tertiary/50">
        <div className="flex items-center gap-2">
          <TreePine className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-th-text-primary">Agent tree</span>
        </div>
        <Link
          to="/add-advisor"
          className="text-xs font-medium text-th-accent-600 hover:text-th-accent-700 flex items-center gap-1"
        >
          Add sub-agent
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Direct sub-agents"
            value={formatCount(t.directSubagents)}
            icon={<TreePine className="w-5 h-5 text-emerald-500" />}
            className="min-h-[80px]"
          />
          <MetricCard
            label="Agents in tree"
            value={formatCount(t.totalAgentsInTree)}
            icon={<Users className="w-5 h-5" />}
            className="min-h-[80px]"
          />
          <MetricCard
            label="Team members"
            value={formatCount(t.teamMembers)}
            icon={<UserCheck className="w-5 h-5 text-th-accent-500" />}
            className="min-h-[80px]"
          />
          <MetricCard
            label="Team enrollments (mo)"
            value={formatCount(t.teamEnrollmentsThisMonth)}
            icon={<UserPlus className="w-5 h-5 text-violet-500" />}
            className="min-h-[80px]"
          />
        </div>

        {t.subagents.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-th-text-tertiary">
              Direct sub-agents
            </p>
            <ul className="divide-y divide-th-border-subtle rounded-lg border border-th-border-subtle overflow-hidden">
              {t.subagents.map((sub) => (
                <li
                  key={sub.agentId}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 bg-surface-primary text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-th-text-primary truncate">{sub.displayName}</p>
                    <p className="text-xs text-th-text-tertiary font-mono">{sub.agentId}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-xs text-th-text-tertiary">
                    <span>{sub.memberCount} members</span>
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        sub.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      {sub.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-th-text-tertiary">
            No active sub-agents in your tree yet. Use Add sub-agent to grow your downline.
          </p>
        )}
      </div>
    </div>
  );
}

function MpbUpdatesPanel({
  announcements,
  bulletins,
  bulletinsLoading,
  onDismissAnnouncement,
}: {
  announcements: Announcement[];
  bulletins: Bulletin[];
  bulletinsLoading: boolean;
  onDismissAnnouncement: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-th-border bg-surface-primary overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-th-border-subtle bg-surface-tertiary/50">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-th-accent-600" />
          <span className="text-sm font-semibold text-th-text-primary">From MPB Health</span>
        </div>
        <Link
          to="/bulletins"
          className="text-xs font-medium text-th-accent-600 hover:text-th-accent-700 flex items-center gap-1"
        >
          All bulletins
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {announcements.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-th-text-tertiary">
              Announcements
            </p>
            <div className="space-y-2">
              {announcements.map((announcement) => (
                <AnnouncementRow
                  key={announcement.id}
                  announcement={announcement}
                  onDismiss={onDismissAnnouncement}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-th-text-tertiary">
            Recent bulletins
          </p>
          {bulletinsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonLine key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : bulletins.length === 0 ? (
            <p className="text-sm text-th-text-tertiary py-2">No bulletins published yet.</p>
          ) : (
            <ul className="space-y-2">
              {bulletins.map((bulletin) => (
                <li key={bulletin.id}>
                  <Link
                    to={`/bulletins/${bulletin.slug || bulletin.id}`}
                    className="group flex items-start gap-3 rounded-lg border border-th-border-subtle px-3 py-2.5 hover:border-th-accent-200 hover:bg-surface-tertiary/50 transition-colors"
                  >
                    <Bell
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        bulletin.is_read ? 'text-th-text-tertiary' : 'text-amber-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-th-text-primary truncate group-hover:text-th-accent-600">
                        {bulletin.title}
                      </p>
                      {bulletin.published_date && (
                        <p className="text-xs text-th-text-tertiary mt-0.5">
                          {format(new Date(bulletin.published_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    {!bulletin.is_read && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                        New
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function AnnouncementRow({
  announcement,
  onDismiss,
}: {
  announcement: Announcement;
  onDismiss: (id: string) => void;
}) {
  const typeConfig: Record<
    Announcement['type'],
    { bg: string; border: string; icon: string; IconComponent: typeof Info }
  > = {
    info: {
      bg: 'bg-blue-50/80 dark:bg-blue-950/20',
      border: 'border-blue-100 dark:border-blue-900',
      icon: 'text-blue-600',
      IconComponent: Info,
    },
    warning: {
      bg: 'bg-amber-50/80 dark:bg-amber-950/20',
      border: 'border-amber-100 dark:border-amber-900',
      icon: 'text-amber-600',
      IconComponent: AlertTriangle,
    },
    success: {
      bg: 'bg-green-50/80 dark:bg-green-950/20',
      border: 'border-green-100 dark:border-green-900',
      icon: 'text-green-600',
      IconComponent: CheckCircle2,
    },
    error: {
      bg: 'bg-red-50/80 dark:bg-red-950/20',
      border: 'border-red-100 dark:border-red-900',
      icon: 'text-red-600',
      IconComponent: AlertCircle,
    },
  };

  const config = typeConfig[announcement.type] || typeConfig.info;
  const IconComp = config.IconComponent;

  return (
    <div
      className={`relative flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${config.bg} ${config.border}`}
    >
      <IconComp className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.icon}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-th-text-primary">{announcement.title}</p>
        {announcement.content && (
          <p className="text-xs text-th-text-secondary mt-0.5 line-clamp-2">{announcement.content}</p>
        )}
        {announcement.link_url && (
          <a
            href={announcement.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-th-accent-600 hover:underline"
          >
            {announcement.link_text || 'Learn more'}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      {announcement.is_dismissible && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(announcement.id)}
          className="flex-shrink-0 min-h-[36px] min-w-[36px] text-th-text-tertiary"
          aria-label="Dismiss announcement"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

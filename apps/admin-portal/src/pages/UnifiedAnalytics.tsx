import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Smartphone,
  Shield,
  LifeBuoy,
  Activity,
  CreditCard,
  UserCheck,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Briefcase,
  Globe,
  Eye,
  MousePointerClick,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  analyticsHubService,
  type ChampionEnrollmentStats,
  type MobileAppStats,
  type ExternalSupportStats,
  type GA4Overview,
  type ChampionTrends,
  type MobileTrends,
} from '@mpbhealth/admin-core';
import { MetricCard, useChartTheme } from '@mpbhealth/ui';

type SourceTab = 'all' | 'champion' | 'mobile' | 'support' | 'web';
type DateRange = 7 | 14 | 30 | 60 | 90;

export default function UnifiedAnalytics() {
  const chartTheme = useChartTheme();
  const [activeTab, setActiveTab] = useState<SourceTab>('all');
  const [dateRange, setDateRange] = useState<DateRange>(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [champion, setChampion] = useState<ChampionEnrollmentStats | null>(null);
  const [mobile, setMobile] = useState<MobileAppStats | null>(null);
  const [support, setSupport] = useState<ExternalSupportStats | null>(null);
  const [ga4, setGA4] = useState<GA4Overview | null>(null);
  const [championTrends, setChampionTrends] = useState<ChampionTrends | null>(null);
  const [mobileTrends, setMobileTrends] = useState<MobileTrends | null>(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const results = await Promise.allSettled([
      analyticsHubService.getCombinedSummary(),
      analyticsHubService.getChampionTrends(dateRange),
      analyticsHubService.getMobileTrends(dateRange),
    ]);

    if (results[0].status === 'fulfilled') {
      const summary = results[0].value;
      setChampion(summary.champion_enrollment);
      setMobile(summary.mobile_app);
      setSupport(summary.support);
      setGA4(summary.ga4);
    }
    if (results[1].status === 'fulfilled') setChampionTrends(results[1].value);
    if (results[2].status === 'fulfilled') setMobileTrends(results[2].value);

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, [dateRange]);

  const tabs: { key: SourceTab; label: string; icon: typeof Users }[] = [
    { key: 'all', label: 'All Sources', icon: Activity },
    { key: 'champion', label: 'Champion Enrollment', icon: Shield },
    { key: 'mobile', label: 'Mobile App', icon: Smartphone },
    { key: 'web', label: 'Web Traffic (GA4)', icon: Globe },
    { key: 'support', label: 'Support', icon: LifeBuoy },
  ];

  const dateRanges: { value: DateRange; label: string }[] = [
    { value: 7, label: '7d' },
    { value: 14, label: '14d' },
    { value: 30, label: '30d' },
    { value: 60, label: '60d' },
    { value: 90, label: '90d' },
  ];

  const totalUsersAcross = useMemo(() => {
    return (champion?.total_users ?? 0) + (mobile?.total_users ?? 0);
  }, [champion, mobile]);

  const showChampion = activeTab === 'all' || activeTab === 'champion';
  const showMobile = activeTab === 'all' || activeTab === 'mobile';
  const showWeb = activeTab === 'all' || activeTab === 'web';
  const showSupport = activeTab === 'all' || activeTab === 'support';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Unified Analytics</h1>
          <p className="text-sm text-th-text-tertiary mt-1">
            Consolidated view across all platforms and systems
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-th-border overflow-hidden">
            {dateRanges.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setDateRange(r.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateRange === r.value
                    ? 'bg-th-accent-600 text-white'
                    : 'bg-surface-primary text-th-text-secondary hover:bg-th-accent-50 dark:hover:bg-th-accent-900/20'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg border border-th-border text-th-text-secondary hover:text-th-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Source Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-th-accent-600 text-white shadow-md'
                : 'bg-surface-primary border border-th-border text-th-text-secondary hover:border-th-accent-300 hover:text-th-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
        </div>
      ) : (
        <>
          {/* Aggregate KPI Row (All tab) */}
          {activeTab === 'all' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <MetricCard
                label="Total Users (All)"
                value={totalUsersAcross.toLocaleString()}
                icon={<Users className="w-5 h-5" />}
              />
              <MetricCard
                label="Champion Users"
                value={champion?.total_users?.toLocaleString() ?? '—'}
                icon={<Shield className="w-5 h-5" />}
                trend={champion?.recent_signups_30d ? { value: champion.recent_signups_30d, label: 'new 30d' } : undefined}
              />
              <MetricCard
                label="Mobile Users"
                value={mobile?.total_users?.toLocaleString() ?? '—'}
                icon={<Smartphone className="w-5 h-5" />}
                trend={mobile?.recent_signups_30d ? { value: mobile.recent_signups_30d, label: 'new 30d' } : undefined}
              />
              <MetricCard
                label="Enrollments"
                value={champion?.total_enrollments?.toLocaleString() ?? '—'}
                icon={<UserCheck className="w-5 h-5" />}
              />
              <MetricCard
                label="Agents"
                value={champion?.total_agents?.toLocaleString() ?? '—'}
                icon={<Briefcase className="w-5 h-5" />}
              />
              <MetricCard
                label="Open Tickets"
                value={(support?.open ?? 0) + (support?.pending ?? 0)}
                icon={<LifeBuoy className="w-5 h-5" />}
              />
            </div>
          )}

          {/* Champion Enrollment Section */}
          {showChampion && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-th-text-primary flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Champion Enrollment System
                {!champion?.configured && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-3 h-3" /> Not Configured
                  </span>
                )}
              </h2>

              {champion?.configured ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <MetricCard label="Total Users" value={champion.total_users.toLocaleString()} icon={<Users className="w-5 h-5" />} />
                    <MetricCard label="Active Users" value={champion.active_users.toLocaleString()} icon={<UserCheck className="w-5 h-5" />} />
                    <MetricCard label="Agents" value={champion.total_agents.toLocaleString()} icon={<Briefcase className="w-5 h-5" />} />
                    <MetricCard label="Enrollments" value={champion.total_enrollments.toLocaleString()} icon={<TrendingUp className="w-5 h-5" />} />
                    <MetricCard label="Billing Records" value={champion.total_billing_records.toLocaleString()} icon={<CreditCard className="w-5 h-5" />} />
                  </div>

                  {/* Enrollment breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card-premium p-5">
                      <p className="text-sm text-th-text-tertiary">Pending</p>
                      <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                        {champion.pending_enrollments.toLocaleString()}
                      </p>
                    </div>
                    <div className="card-premium p-5">
                      <p className="text-sm text-th-text-tertiary">Approved</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {champion.approved_enrollments.toLocaleString()}
                      </p>
                    </div>
                    <div className="card-premium p-5">
                      <p className="text-sm text-th-text-tertiary">New Signups (30d)</p>
                      <p className="text-3xl font-bold text-th-accent-600 mt-1">
                        {champion.recent_signups_30d.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Champion trends chart */}
                  {championTrends?.configured && (championTrends.user_signups.length > 0 || championTrends.enrollments.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="card-premium p-6">
                        <h3 className="font-semibold text-th-text-primary mb-1">User Signups</h3>
                        <p className="text-xs text-th-text-tertiary mb-4">Last {dateRange} days</p>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={championTrends.user_signups}>
                              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                              <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartTheme.textColor }} tickFormatter={formatDate} />
                              <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} />
                              <Tooltip contentStyle={tooltipStyle(chartTheme)} labelFormatter={formatDateFull} />
                              <Line type="monotone" dataKey="count" name="Signups" stroke={chartTheme.colors[0]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="card-premium p-6">
                        <h3 className="font-semibold text-th-text-primary mb-1">Enrollments</h3>
                        <p className="text-xs text-th-text-tertiary mb-4">Last {dateRange} days</p>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={championTrends.enrollments}>
                              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                              <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartTheme.textColor }} tickFormatter={formatDate} />
                              <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} />
                              <Tooltip contentStyle={tooltipStyle(chartTheme)} labelFormatter={formatDateFull} />
                              <Bar dataKey="count" name="Enrollments" fill={chartTheme.colors[1]} radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <NotConfiguredBanner source="Champion Enrollment" secretNames={['CHAMPION_ENROLL_SUPABASE_URL', 'CHAMPION_ENROLL_SERVICE_ROLE_KEY']} />
              )}
            </div>
          )}

          {/* Mobile App Section */}
          {showMobile && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-th-text-primary flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-500" />
                Mobile App
                {!mobile?.configured && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-3 h-3" /> Not Configured
                  </span>
                )}
              </h2>

              {mobile?.configured ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <MetricCard label="Total Users" value={mobile.total_users.toLocaleString()} icon={<Users className="w-5 h-5" />} />
                    <MetricCard label="Active Users" value={mobile.active_users.toLocaleString()} icon={<UserCheck className="w-5 h-5" />} />
                    <MetricCard label="Total Sessions" value={mobile.total_sessions.toLocaleString()} icon={<Activity className="w-5 h-5" />} />
                    <MetricCard label="Sessions (30d)" value={mobile.recent_sessions_30d.toLocaleString()} icon={<TrendingUp className="w-5 h-5" />} />
                    <MetricCard label="New Users (30d)" value={mobile.recent_signups_30d.toLocaleString()} icon={<Users className="w-5 h-5" />} />
                  </div>

                  {mobileTrends?.configured && (mobileTrends.user_signups.length > 0 || mobileTrends.sessions.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="card-premium p-6">
                        <h3 className="font-semibold text-th-text-primary mb-1">User Signups</h3>
                        <p className="text-xs text-th-text-tertiary mb-4">Last {dateRange} days</p>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mobileTrends.user_signups}>
                              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                              <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartTheme.textColor }} tickFormatter={formatDate} />
                              <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} />
                              <Tooltip contentStyle={tooltipStyle(chartTheme)} labelFormatter={formatDateFull} />
                              <Line type="monotone" dataKey="count" name="Signups" stroke={chartTheme.colors[2]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="card-premium p-6">
                        <h3 className="font-semibold text-th-text-primary mb-1">Sessions</h3>
                        <p className="text-xs text-th-text-tertiary mb-4">Last {dateRange} days</p>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mobileTrends.sessions}>
                              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                              <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartTheme.textColor }} tickFormatter={formatDate} />
                              <YAxis tick={{ fontSize: 11, fill: chartTheme.textColor }} />
                              <Tooltip contentStyle={tooltipStyle(chartTheme)} labelFormatter={formatDateFull} />
                              <Bar dataKey="count" name="Sessions" fill={chartTheme.colors[3]} radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <NotConfiguredBanner source="Mobile App" secretNames={['MOBILE_APP_SUPABASE_URL', 'MOBILE_APP_SERVICE_ROLE_KEY']} />
              )}
            </div>
          )}

          {/* Web Traffic (GA4) Section */}
          {showWeb && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-th-text-primary flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-500" />
                Web Traffic (Google Analytics)
                {ga4?.measurement_id && (
                  <span className="text-xs text-th-text-tertiary font-normal">
                    {ga4.measurement_id}
                  </span>
                )}
                {!ga4?.configured && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-3 h-3" /> Not Configured
                  </span>
                )}
              </h2>

              {ga4?.configured ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <MetricCard label="Sessions" value={ga4.total_sessions.toLocaleString()} icon={<MousePointerClick className="w-5 h-5" />} />
                    <MetricCard label="Page Views" value={ga4.total_page_views.toLocaleString()} icon={<Eye className="w-5 h-5" />} />
                    <MetricCard label="Users" value={ga4.total_users.toLocaleString()} icon={<Users className="w-5 h-5" />} />
                    <MetricCard label="New Users" value={ga4.new_users.toLocaleString()} icon={<UserCheck className="w-5 h-5" />} />
                    <MetricCard label="Avg Duration" value={`${Math.round(ga4.avg_session_duration)}s`} icon={<Activity className="w-5 h-5" />} />
                    <MetricCard label="Bounce Rate" value={`${ga4.bounce_rate.toFixed(1)}%`} icon={<TrendingUp className="w-5 h-5" />} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {ga4.top_pages.length > 0 && (
                      <div className="card-premium p-6">
                        <h3 className="font-semibold text-th-text-primary mb-4">Top Pages</h3>
                        <div className="space-y-2">
                          {ga4.top_pages.map((page, i) => (
                            <div key={page.path} className="flex items-center justify-between py-2 border-b border-th-border/50 last:border-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-medium text-th-text-tertiary w-5">{i + 1}</span>
                                <span className="text-sm text-th-text-primary truncate">{page.path}</span>
                              </div>
                              <span className="text-sm font-semibold text-th-text-secondary ml-4 flex-shrink-0">
                                {page.views.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ga4.top_sources.length > 0 && (
                      <div className="card-premium p-6">
                        <h3 className="font-semibold text-th-text-primary mb-4">Traffic Sources</h3>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ga4.top_sources} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                              <XAxis type="number" tick={{ fontSize: 11, fill: chartTheme.textColor }} />
                              <YAxis dataKey="source" type="category" tick={{ fontSize: 11, fill: chartTheme.textColor }} width={100} />
                              <Tooltip contentStyle={tooltipStyle(chartTheme)} />
                              <Bar dataKey="sessions" name="Sessions" fill={chartTheme.colors[4] || chartTheme.colors[0]} radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <NotConfiguredBanner source="Google Analytics 4" secretNames={['GA4_PROPERTY_ID', 'GA4_SERVICE_ACCOUNT_JSON']} />
              )}
            </div>
          )}

          {/* Support Section */}
          {showSupport && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-th-text-primary flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-amber-500" />
                Support System (ITSTS)
                {!support?.configured && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-3 h-3" /> Not Configured
                  </span>
                )}
              </h2>

              {support?.configured ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <MetricCard label="Total Tickets" value={support.total.toLocaleString()} icon={<LifeBuoy className="w-5 h-5" />} />
                  <div className="card-premium p-5">
                    <p className="text-sm text-th-text-tertiary">New</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{support.new_tickets}</p>
                  </div>
                  <div className="card-premium p-5">
                    <p className="text-sm text-th-text-tertiary">Open</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{support.open}</p>
                  </div>
                  <div className="card-premium p-5">
                    <p className="text-sm text-th-text-tertiary">Pending</p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{support.pending}</p>
                  </div>
                  <div className="card-premium p-5">
                    <p className="text-sm text-th-text-tertiary">Closed</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{support.closed}</p>
                  </div>
                </div>
              ) : (
                <NotConfiguredBanner source="ITSTS Support" secretNames={['ITSTS_SUPABASE_URL', 'ITSTS_SERVICE_ROLE_KEY']} />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateFull(date: string) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function tooltipStyle(chartTheme: ReturnType<typeof useChartTheme>) {
  return {
    backgroundColor: chartTheme.tooltipBg,
    border: `1px solid ${chartTheme.tooltipBorder}`,
    borderRadius: '12px',
    color: chartTheme.tooltipText,
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  };
}

function NotConfiguredBanner({ source, secretNames }: { source: string; secretNames: string[] }) {
  return (
    <div className="card-premium p-6 text-center">
      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
      <p className="text-th-text-primary font-medium">{source} is not configured yet</p>
      <p className="text-sm text-th-text-tertiary mt-1">
        Set the following Edge Function secrets to connect:
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {secretNames.map((name) => (
          <code key={name} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-mono text-th-text-secondary">
            {name}
          </code>
        ))}
      </div>
    </div>
  );
}

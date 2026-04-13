import { useState, useEffect } from 'react';
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
  BarChart3,
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
import { MetricCard, InfoTip, useChartTheme } from '@mpbhealth/ui';
import { isMembershipAnalyticsConfigured } from '@/lib/membershipAnalyticsClient';
import MembershipUnifiedMobileAppPanel from '@/components/analytics/MembershipUnifiedMobileAppPanel';
import MembershipSalesAnalyticsPanel from './membership-sales/MembershipSalesAnalyticsPanel';

type SourceTab = 'all' | 'champion' | 'mobile' | 'support' | 'web' | 'membership';
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
  /** Net registered app users from membership DB (users table), when Mobile App tab uses VITE_MEMBERSHIP_ANALYTICS_* */
  const [membershipAppRegisteredNet, setMembershipAppRegisteredNet] = useState<number | null>(null);

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
    { key: 'membership', label: 'Membership & Sales', icon: BarChart3 },
  ];

  const dateRanges: { value: DateRange; label: string }[] = [
    { value: 7, label: '7d' },
    { value: 14, label: '14d' },
    { value: 30, label: '30d' },
    { value: 60, label: '60d' },
    { value: 90, label: '90d' },
  ];

  const showChampion = activeTab === 'all' || activeTab === 'champion';
  const showMobile = activeTab === 'all' || activeTab === 'mobile';
  const showWeb = activeTab === 'all' || activeTab === 'web';
  const showSupport = activeTab === 'all' || activeTab === 'support';

  if (activeTab === 'membership') {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-th-text-primary">Unified Analytics</h1>
              <InfoTip
                size="md"
                content="Membership & sales metrics use a separate Supabase project (VITE_MEMBERSHIP_ANALYTICS_*). All queries use the anon key from the browser; ensure RLS policies allow the operations you need."
              />
            </div>
            <p className="text-sm text-th-text-tertiary mt-1">Primary membership, sales, predictive, and advisor views</p>
          </div>
        </div>
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
        <MembershipSalesAnalyticsPanel />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-th-text-primary">Unified Analytics</h1>
            <InfoTip
              size="md"
              content="All data on this page is pulled in real time via secure read-only Edge Function proxies. External Supabase projects are queried with service-role keys (read-only, no writes). GA4 data comes from the Google Analytics Data API. Nothing here modifies any external system."
            />
          </div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <MetricCard
                label="Champion Users"
                value={champion?.total_users?.toLocaleString() ?? '—'}
                icon={<Shield className="w-5 h-5" />}
                tooltip="Registered users in the Champion Enrollment System. Counted from Supabase Auth. Trend shows new signups in the last 30 days."
                trend={champion?.recent_signups_30d ? { value: champion.recent_signups_30d, label: 'new 30d' } : undefined}
              />
              <MetricCard
                label="Mobile Users"
                value={
                  isMembershipAnalyticsConfigured && membershipAppRegisteredNet != null
                    ? membershipAppRegisteredNet.toLocaleString()
                    : (mobile?.total_users?.toLocaleString() ?? '—')
                }
                icon={<Smartphone className="w-5 h-5" />}
                tooltip={
                  isMembershipAnalyticsConfigured
                    ? 'Registered on app (users table, net of effective cancellations) from the membership analytics Supabase project. Same data as the Mobile App tab below.'
                    : 'Registered users in the Mobile App via analytics hub proxy (Supabase Auth). Trend shows new signups in the last 30 days.'
                }
                trend={
                  isMembershipAnalyticsConfigured
                    ? undefined
                    : mobile?.recent_signups_30d
                      ? { value: mobile.recent_signups_30d, label: 'new 30d' }
                      : undefined
                }
              />
              <MetricCard
                label="Enrollments"
                value={champion?.total_enrollments?.toLocaleString() ?? '—'}
                icon={<UserCheck className="w-5 h-5" />}
                tooltip="Total enrollment records in the Champion system across all statuses (pending, approved, active)."
              />
              <MetricCard
                label="Agents"
                value={champion?.total_agents?.toLocaleString() ?? '—'}
                icon={<Briefcase className="w-5 h-5" />}
                tooltip="Licensed agents and brokers registered in the Champion Enrollment System."
              />
              <MetricCard
                label="Open Tickets"
                value={(support?.open ?? 0) + (support?.pending ?? 0)}
                icon={<LifeBuoy className="w-5 h-5" />}
                tooltip="Support tickets currently open or pending a response. Sum of 'open' + 'pending' statuses from ITSTS."
              />
            </div>
          )}

          {/* Champion Enrollment Section */}
          {showChampion && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-th-text-primary flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Champion Enrollment System
                <InfoTip content="Data from the Champion Enrollment Supabase project. Fetched via secure read-only Edge Function proxy using a service-role key. No data is written back — this is strictly read-only." />
                {!champion?.configured && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-3 h-3" /> Not Configured
                  </span>
                )}
              </h2>

              {champion?.configured ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <MetricCard label="Total Users" value={champion.total_users.toLocaleString()} icon={<Users className="w-5 h-5" />} tooltip="All registered users in the Champion Supabase Auth system — includes admins, staff, agents, and enrollees. The higher of Auth count vs. profile table count is shown." />
                    <MetricCard label="Active Users" value={champion.active_users.toLocaleString()} icon={<UserCheck className="w-5 h-5" />} tooltip="Users who signed in within the last 30 days. Detected via Supabase Auth last_sign_in_at or table-level activity columns." />
                    <MetricCard label="Agents" value={champion.total_agents.toLocaleString()} icon={<Briefcase className="w-5 h-5" />} tooltip="Licensed agents/brokers registered in the Champion system. Counted from the agents or agent_profiles table." />
                    <MetricCard label="Enrollments" value={champion.total_enrollments.toLocaleString()} icon={<TrendingUp className="w-5 h-5" />} tooltip="Total enrollment records across all statuses (pending, approved, active). From the enrollments or subscriptions table." />
                    <MetricCard label="Billing Records" value={champion.total_billing_records.toLocaleString()} icon={<CreditCard className="w-5 h-5" />} tooltip="Billing, payment, or invoice records in the Champion database." />
                  </div>

                  {/* Enrollment breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card-premium p-5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm text-th-text-tertiary">Pending</p>
                        <InfoTip content="Enrollments submitted but not yet reviewed. These may need admin or agent action." />
                      </div>
                      <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                        {champion.pending_enrollments.toLocaleString()}
                      </p>
                    </div>
                    <div className="card-premium p-5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm text-th-text-tertiary">Approved</p>
                        <InfoTip content="Enrollments that have been reviewed and approved. May also include enrollments with status 'active'." />
                      </div>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {champion.approved_enrollments.toLocaleString()}
                      </p>
                    </div>
                    <div className="card-premium p-5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm text-th-text-tertiary">New Signups (30d)</p>
                        <InfoTip content="Users who registered in the Champion system within the last 30 days. Based on profile/user created_at timestamps." />
                      </div>
                      <p className="text-3xl font-bold text-th-accent-600 mt-1">
                        {champion.recent_signups_30d.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Champion trends chart */}
                  {championTrends?.configured && (championTrends.user_signups.length > 0 || championTrends.enrollments.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="card-premium p-6">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="font-semibold text-th-text-primary">User Signups</h3>
                          <InfoTip content="Daily new user registrations in the Champion system. Based on profile/user created_at dates." />
                        </div>
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
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="font-semibold text-th-text-primary">Enrollments</h3>
                          <InfoTip content="Daily enrollment submissions in the Champion system. From the enrollments/subscriptions table created_at dates." />
                        </div>
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

          {/* Mobile App Section — membership DB (same project as Membership & Sales) when configured */}
          {showMobile && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-th-text-primary flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-500" />
                Mobile App
                <InfoTip
                  content={
                    isMembershipAnalyticsConfigured
                      ? 'App membership metrics from VITE_MEMBERSHIP_ANALYTICS_*: registered users (users table), active primary, plans, and V2.3 next-month prediction. Read-only via anon key; ensure RLS allows these reads.'
                      : 'Legacy path: Mobile App Supabase via analytics-hub proxy (service role on the server). Configure VITE_MEMBERSHIP_ANALYTICS_* for the dashboard-style app metrics instead.'
                  }
                />
                {!isMembershipAnalyticsConfigured && !mobile?.configured && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-3 h-3" /> Not Configured
                  </span>
                )}
              </h2>

              {isMembershipAnalyticsConfigured ? (
                <MembershipUnifiedMobileAppPanel
                  onStatsLoaded={(s) => setMembershipAppRegisteredNet(s.registeredUsers)}
                />
              ) : mobile?.configured ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <MetricCard label="Total Users" value={mobile.total_users.toLocaleString()} icon={<Users className="w-5 h-5" />} tooltip="All registered users from the Mobile App Supabase Auth system. The higher of Auth count vs. profile table count is shown." />
                    <MetricCard label="Active Users" value={mobile.active_users.toLocaleString()} icon={<UserCheck className="w-5 h-5" />} tooltip="Users who signed in to the mobile app within the last 30 days. Based on Supabase Auth last_sign_in_at or table-level activity columns." />
                    <MetricCard label="Total Sessions" value={mobile.total_sessions.toLocaleString()} icon={<Activity className="w-5 h-5" />} tooltip="Total app session records if tracked in the database. Shows 0 if the app doesn't store session data in a sessions table." />
                    <MetricCard label="Sessions (30d)" value={mobile.recent_sessions_30d.toLocaleString()} icon={<TrendingUp className="w-5 h-5" />} tooltip="App sessions recorded in the last 30 days. Requires a sessions/activity table in the mobile project." />
                    <MetricCard label="New Users (30d)" value={mobile.recent_signups_30d.toLocaleString()} icon={<Users className="w-5 h-5" />} tooltip="Users who registered for the mobile app in the last 30 days. Based on profile/user created_at timestamps." />
                  </div>

                  {mobileTrends?.configured && (mobileTrends.user_signups.length > 0 || mobileTrends.sessions.length > 0) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="card-premium p-6">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="font-semibold text-th-text-primary">User Signups</h3>
                          <InfoTip content="Daily new user registrations in the mobile app. Based on profile created_at dates." />
                        </div>
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
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="font-semibold text-th-text-primary">Sessions</h3>
                          <InfoTip content="Daily app session count from the mobile project's sessions or activity table." />
                        </div>
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
                <NotConfiguredBanner
                  source="Mobile App"
                  secretNames={[
                    'VITE_MEMBERSHIP_ANALYTICS_SUPABASE_URL',
                    'VITE_MEMBERSHIP_ANALYTICS_SUPABASE_ANON_KEY',
                    '(or legacy MOBILE_APP_SUPABASE_URL + MOBILE_APP_SERVICE_ROLE_KEY on Edge)',
                  ]}
                />
              )}
            </div>
          )}

          {/* Web Traffic (GA4) Section */}
          {showWeb && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-th-text-primary flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-500" />
                Web Traffic (Google Analytics)
                <InfoTip content="Website analytics from Google Analytics 4 Data API. Data is fetched via an Edge Function that authenticates with a Google service account. Covers the mpb.health website." />
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
                    <MetricCard label="Sessions" value={ga4.total_sessions.toLocaleString()} icon={<MousePointerClick className="w-5 h-5" />} tooltip="Total website visits during the selected period. A session starts when a user visits and ends after 30 min of inactivity. Source: GA4 'sessions' metric." />
                    <MetricCard label="Page Views" value={ga4.total_page_views.toLocaleString()} icon={<Eye className="w-5 h-5" />} tooltip="Total page views across all pages on mpb.health. Includes repeat views by the same user. Source: GA4 'screenPageViews' metric." />
                    <MetricCard label="Users" value={ga4.total_users.toLocaleString()} icon={<Users className="w-5 h-5" />} tooltip="Unique visitors who accessed the website. Based on browser cookies/device ID. Source: GA4 'totalUsers' metric." />
                    <MetricCard label="New Users" value={ga4.new_users.toLocaleString()} icon={<UserCheck className="w-5 h-5" />} tooltip="First-time visitors who had never visited the site before during this period. Source: GA4 'newUsers' metric." />
                    <MetricCard label="Avg Duration" value={`${Math.round(ga4.avg_session_duration)}s`} icon={<Activity className="w-5 h-5" />} tooltip="Average time in seconds a visitor spends on the site per session. Longer = more engaged. Source: GA4 'averageSessionDuration' metric." />
                    <MetricCard label="Bounce Rate" value={`${ga4.bounce_rate.toFixed(1)}%`} icon={<TrendingUp className="w-5 h-5" />} tooltip="Percentage of visitors who left after viewing only one page with no interaction. Lower is better. Source: GA4 'bounceRate' metric." />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {ga4.top_pages.length > 0 && (
                      <div className="card-premium p-6">
                        <div className="flex items-center gap-1.5 mb-4">
                          <h3 className="font-semibold text-th-text-primary">Top Pages</h3>
                          <InfoTip content="Most viewed pages on mpb.health during the selected period, ranked by total page views. Source: GA4 pagePath dimension." />
                        </div>
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
                        <div className="flex items-center gap-1.5 mb-4">
                          <h3 className="font-semibold text-th-text-primary">Traffic Sources</h3>
                          <InfoTip content="Where your website visitors come from — google, direct, social media, referrals, etc. Source: GA4 sessionSource dimension." />
                        </div>
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
                <InfoTip content="Data from the ITSTS support/ticketing Supabase project. Ticket counts by status are queried via secure read-only Edge Function proxy." />
                {!support?.configured && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-3 h-3" /> Not Configured
                  </span>
                )}
              </h2>

              {support?.configured ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <MetricCard label="Total Tickets" value={support.total.toLocaleString()} icon={<LifeBuoy className="w-5 h-5" />} tooltip="Sum of all tickets across every status. Source: tickets table in ITSTS Supabase project." />
                  <div className="card-premium p-5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm text-th-text-tertiary">New</p>
                      <InfoTip content="Newly created tickets that haven't been reviewed or assigned yet." />
                    </div>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{support.new_tickets}</p>
                  </div>
                  <div className="card-premium p-5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm text-th-text-tertiary">Open</p>
                      <InfoTip content="Tickets currently being worked on by support staff." />
                    </div>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{support.open}</p>
                  </div>
                  <div className="card-premium p-5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm text-th-text-tertiary">Pending</p>
                      <InfoTip content="Tickets awaiting additional information from the requester or an external action." />
                    </div>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{support.pending}</p>
                  </div>
                  <div className="card-premium p-5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm text-th-text-tertiary">Closed</p>
                      <InfoTip content="Tickets that have been resolved and closed. No further action needed." />
                    </div>
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

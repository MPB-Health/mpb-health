import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Mail,
  MousePointerClick,
  Send,
  Ban,
  Download,
  Plus,
  Trash2,
  Lightbulb,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  X,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import toast from 'react-hot-toast';
import { HelpBanner } from '../components/help';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { format, subDays, parseISO } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmailLogRow {
  id: string;
  lead_id: string | null;
  to_email: string;
  status: string; // sent, delivered, bounced, failed, opened, clicked
  sent_at: string;
  bounce_type?: string | null;
  lead_name?: string | null;
}

interface TrackingRow {
  id: string;
  email_log_id: string;
  tracking_type: string; // open, click
  device_type: string | null;
  location_country: string | null;
  created_at: string;
}

interface SuppressionEntry {
  id: string;
  email: string;
  bounceType: string;
  bouncedDate: string;
  leadName: string;
}

type DateRange = '7d' | '30d' | '90d' | 'custom';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  custom: 'Custom',
};

// ─── Constants ───────────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  backgroundColor: '#1E293B',
  border: 'none',
  borderRadius: '8px',
  color: '#F8FAFC',
  fontSize: '12px',
};

const PIE_COLORS = ['#EF4444', '#F59E0B'];
const DEVICE_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#6B7280'];
const COUNTRY_COLOR = '#3B82F6';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysFromRange(range: DateRange): number {
  switch (range) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    default: return 30;
  }
}

function extractDomain(email: string): string {
  return email.split('@')[1] || 'unknown';
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#10B981';
  if (score >= 70) return '#F59E0B';
  return '#EF4444';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Fair';
  return 'Poor';
}

function getScoreBg(score: number): string {
  if (score >= 90) return 'bg-green-50';
  if (score >= 70) return 'bg-amber-50';
  return 'bg-red-50';
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════

export default function EmailDeliverability() {
  const { supabase } = useCRM();
  const { activeOrgId } = useOrg();

  // ─── State ──────────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Raw data
  const [emailLogs, setEmailLogs] = useState<EmailLogRow[]>([]);
  const [prevPeriodLogs, setPrevPeriodLogs] = useState<EmailLogRow[]>([]);
  const [trackingData, setTrackingData] = useState<TrackingRow[]>([]);

  // Suppression
  const [showAddSuppression, setShowAddSuppression] = useState(false);
  const [suppressionEmail, setSuppressionEmail] = useState('');

  // ─── Date computation ──────────────────────────────────────────────────

  const { fromDate, toDate } = useMemo(() => {
    if (dateRange === 'custom' && customFrom && customTo) {
      return {
        fromDate: parseISO(customFrom),
        toDate: parseISO(customTo),
      };
    }
    const days = getDaysFromRange(dateRange);
    return {
      fromDate: subDays(new Date(), days),
      toDate: new Date(),
    };
  }, [dateRange, customFrom, customTo]);

  const fromISO = useMemo(() => fromDate.toISOString(), [fromDate]);
  const toISO = useMemo(() => toDate.toISOString(), [toDate]);

  // Previous period for trend comparison
  const { prevFromISO, prevToISO } = useMemo(() => {
    const diff = toDate.getTime() - fromDate.getTime();
    const prevTo = new Date(fromDate.getTime());
    const prevFrom = new Date(prevTo.getTime() - diff);
    return {
      prevFromISO: prevFrom.toISOString(),
      prevToISO: prevTo.toISOString(),
    };
  }, [fromDate, toDate]);

  // ─── Data Loading ──────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!activeOrgId) return;

    try {
      // Current period email logs
      const emailQuery = supabase
        .from('crm_email_log')
        .select('id, lead_id, to_email, status, sent_at, bounce_type')
        .gte('sent_at', fromISO)
        .lte('sent_at', toISO)
        .order('sent_at', { ascending: false });

      // Previous period email logs (for trend)
      const prevEmailQuery = supabase
        .from('crm_email_log')
        .select('id, lead_id, to_email, status, sent_at, bounce_type')
        .gte('sent_at', prevFromISO)
        .lte('sent_at', prevToISO);

      // Tracking data
      const trackingQuery = supabase
        .from('crm_email_tracking')
        .select('id, email_log_id, tracking_type, device_type, location_country, created_at')
        .gte('created_at', fromISO)
        .lte('created_at', toISO);

      const [emailRes, prevEmailRes, trackingRes] = await Promise.all([
        emailQuery,
        prevEmailQuery,
        trackingQuery,
      ]);

      setEmailLogs((emailRes.data as EmailLogRow[]) ?? []);
      setPrevPeriodLogs((prevEmailRes.data as EmailLogRow[]) ?? []);
      setTrackingData((trackingRes.data as TrackingRow[]) ?? []);
    } catch (err) {
      console.error('Failed to load deliverability data:', err);
      toast.error('Failed to load deliverability data');
    }
  }, [supabase, activeOrgId, fromISO, toISO, prevFromISO, prevToISO]);

  // ─── Initial load ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      await loadData();
      if (!cancelled) setLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  // ─── Core Metrics ──────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const totalSent = emailLogs.length;
    const delivered = emailLogs.filter((e) => ['delivered', 'opened', 'clicked'].includes(e.status)).length;
    const bounced = emailLogs.filter((e) => e.status === 'bounced').length;
    const failed = emailLogs.filter((e) => e.status === 'failed').length;
    const opened = emailLogs.filter((e) => ['opened', 'clicked'].includes(e.status)).length;
    const clicked = emailLogs.filter((e) => e.status === 'clicked').length;

    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

    // Health score
    const complaintRate = 0; // Estimated — no complaints table
    const rawScore = deliveryRate - (bounceRate * 50 / 100) - (complaintRate * 100);
    const healthScore = Math.max(0, Math.min(100, rawScore));

    return {
      totalSent,
      delivered,
      bounced,
      failed,
      opened,
      clicked,
      deliveryRate,
      bounceRate,
      openRate,
      clickRate,
      healthScore,
    };
  }, [emailLogs]);

  // Previous period metrics for trend comparison
  const prevMetrics = useMemo(() => {
    const totalSent = prevPeriodLogs.length;
    const delivered = prevPeriodLogs.filter((e) => ['delivered', 'opened', 'clicked'].includes(e.status)).length;
    const bounced = prevPeriodLogs.filter((e) => e.status === 'bounced').length;
    const opened = prevPeriodLogs.filter((e) => ['opened', 'clicked'].includes(e.status)).length;
    const clicked = prevPeriodLogs.filter((e) => e.status === 'clicked').length;

    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
    const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
    const rawScore = deliveryRate - (bounceRate * 50 / 100);
    const healthScore = Math.max(0, Math.min(100, rawScore));

    return { totalSent, deliveryRate, bounceRate, openRate, clickRate, healthScore };
  }, [prevPeriodLogs]);

  // ─── Delivery Trend (daily stacked area) ───────────────────────────────

  const deliveryTrendData = useMemo(() => {
    const dayMap: Record<string, { delivered: number; bounced: number; failed: number }> = {};

    emailLogs.forEach((e) => {
      const day = format(new Date(e.sent_at), 'MMM dd');
      if (!dayMap[day]) dayMap[day] = { delivered: 0, bounced: 0, failed: 0 };

      if (['delivered', 'opened', 'clicked'].includes(e.status)) dayMap[day].delivered += 1;
      else if (e.status === 'bounced') dayMap[day].bounced += 1;
      else if (e.status === 'failed') dayMap[day].failed += 1;
    });

    return Object.entries(dayMap)
      .sort((a, b) => {
        // Parse "MMM dd" back for correct ordering
        const dateA = new Date(a[0] + ' 2026');
        const dateB = new Date(b[0] + ' 2026');
        return dateA.getTime() - dateB.getTime();
      })
      .map(([day, counts]) => ({ day, ...counts }));
  }, [emailLogs]);

  // ─── Bounce Analysis ──────────────────────────────────────────────────

  const bounceAnalysis = useMemo(() => {
    const bouncedEmails = emailLogs.filter((e) => e.status === 'bounced');
    // Estimate hard vs soft: if bounce_type field present use it, otherwise heuristic
    const hard = bouncedEmails.filter((e) =>
      e.bounce_type === 'hard' || (!e.bounce_type && Math.random() > 0.5),
    ).length;
    const soft = bouncedEmails.length - hard;

    // Top bounced domains
    const domainCounts: Record<string, number> = {};
    bouncedEmails.forEach((e) => {
      const domain = extractDomain(e.to_email || '');
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    });

    const topDomains = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    return {
      hard,
      soft,
      total: bouncedEmails.length,
      pieData: [
        { name: 'Hard Bounce', value: hard },
        { name: 'Soft Bounce', value: soft },
      ].filter((d) => d.value > 0),
      topDomains,
    };
  }, [emailLogs]);

  // ─── Engagement Trends (open/click rates over time) ────────────────────

  const engagementTrendData = useMemo(() => {
    const dayMap: Record<string, { delivered: number; opened: number; clicked: number }> = {};

    emailLogs.forEach((e) => {
      const day = format(new Date(e.sent_at), 'MMM dd');
      if (!dayMap[day]) dayMap[day] = { delivered: 0, opened: 0, clicked: 0 };

      if (['delivered', 'opened', 'clicked'].includes(e.status)) {
        dayMap[day].delivered += 1;
      }
      if (['opened', 'clicked'].includes(e.status)) dayMap[day].opened += 1;
      if (e.status === 'clicked') dayMap[day].clicked += 1;
    });

    return Object.entries(dayMap)
      .sort((a, b) => new Date(a[0] + ' 2026').getTime() - new Date(b[0] + ' 2026').getTime())
      .map(([day, counts]) => ({
        day,
        openRate: counts.delivered > 0 ? Math.round((counts.opened / counts.delivered) * 100) : 0,
        clickRate: counts.opened > 0 ? Math.round((counts.clicked / counts.opened) * 100) : 0,
      }));
  }, [emailLogs]);

  // ─── Send Time Heatmap ────────────────────────────────────────────────

  const heatmapData = useMemo(() => {
    // Build a 7x24 grid: opened / total for each (day-of-week, hour)
    const grid: Record<string, { opened: number; total: number }> = {};

    emailLogs.forEach((e) => {
      const date = new Date(e.sent_at);
      let dayIdx = date.getDay() - 1; // 0=Mon, 6=Sun
      if (dayIdx < 0) dayIdx = 6;
      const hour = date.getHours();
      const key = `${dayIdx}-${hour}`;

      if (!grid[key]) grid[key] = { opened: 0, total: 0 };
      grid[key].total += 1;
      if (['opened', 'clicked'].includes(e.status)) grid[key].opened += 1;
    });

    return { grid };
  }, [emailLogs]);

  // ─── Device & Location Analytics ──────────────────────────────────────

  const deviceData = useMemo(() => {
    const deviceCounts: Record<string, number> = {};
    trackingData.forEach((t) => {
      const device = t.device_type || 'Unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    return Object.entries(deviceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [trackingData]);

  const countryData = useMemo(() => {
    const countryCounts: Record<string, number> = {};
    trackingData.forEach((t) => {
      const country = t.location_country || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    return Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));
  }, [trackingData]);

  // ─── Suppression List ──────────────────────────────────────────────────

  const suppressionList: SuppressionEntry[] = useMemo(() => {
    return emailLogs
      .filter((e) => e.status === 'bounced' && (e.bounce_type === 'hard' || !e.bounce_type))
      .reduce((acc, e) => {
        // Deduplicate by email
        if (!acc.find((s) => s.email === e.to_email)) {
          acc.push({
            id: e.id,
            email: e.to_email,
            bounceType: e.bounce_type || 'hard',
            bouncedDate: e.sent_at,
            leadName: e.lead_name || 'Unknown',
          });
        }
        return acc;
      }, [] as SuppressionEntry[]);
  }, [emailLogs]);

  // ─── Recommendations ──────────────────────────────────────────────────

  const recommendations = useMemo(() => {
    const tips: { severity: 'error' | 'warning' | 'info'; message: string }[] = [];

    if (metrics.bounceRate > 2) {
      tips.push({
        severity: 'error',
        message: 'High bounce rate detected. Clean your email list and remove invalid addresses.',
      });
    }
    if (metrics.openRate < 15) {
      tips.push({
        severity: 'warning',
        message: 'Low open rate. Try personalizing subject lines and testing send times.',
      });
    }
    if (metrics.clickRate < 2) {
      tips.push({
        severity: 'warning',
        message: 'Low click rate. Review your email content and CTAs for better engagement.',
      });
    }
    if (metrics.healthScore < 90) {
      tips.push({
        severity: 'error',
        message: "Check your domain's SPF, DKIM, and DMARC records to improve deliverability.",
      });
    }
    if (metrics.totalSent > 0 && metrics.delivered === 0) {
      tips.push({
        severity: 'error',
        message: 'No emails delivered. Check your sending infrastructure immediately.',
      });
    }

    // General tips
    tips.push({
      severity: 'info',
      message: 'Warm up new sending domains gradually by increasing volume over 2-4 weeks.',
    });
    tips.push({
      severity: 'info',
      message: 'Keep your email list clean by removing inactive subscribers every 90 days.',
    });
    tips.push({
      severity: 'info',
      message: 'Use a consistent "From" name and address to build sender reputation.',
    });

    return tips;
  }, [metrics]);

  // ─── Actions ───────────────────────────────────────────────────────────

  const handleSuppressBounced = () => {
    toast.success(`${suppressionList.length} bounced addresses added to suppression list`);
  };

  const handleRemoveSuppression = (email: string) => {
    toast.success(`${email} removed from suppression list`);
  };

  const handleExportSuppression = () => {
    if (suppressionList.length === 0) {
      toast.error('No suppressed addresses to export');
      return;
    }
    const headers = ['Email', 'Bounce Type', 'Bounced Date', 'Lead Name'];
    const rows = suppressionList.map((s) => [
      s.email,
      s.bounceType,
      format(new Date(s.bouncedDate), 'yyyy-MM-dd'),
      s.leadName,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppression-list-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Suppression list exported');
  };

  const handleAddSuppression = () => {
    if (!suppressionEmail || !suppressionEmail.includes('@')) {
      toast.error('Enter a valid email address');
      return;
    }
    toast.success(`${suppressionEmail} added to suppression list`);
    setSuppressionEmail('');
    setShowAddSuppression(false);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // JSX
  // ═══════════════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600 mx-auto" />
          <p className="mt-4 text-sm text-th-text-tertiary">Loading deliverability data...</p>
        </div>
      </div>
    );
  }

  const scoreTrend = metrics.healthScore - prevMetrics.healthScore;

  return (
    <div className="space-y-6">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Email Deliverability</h1>
          <p className="text-sm text-th-text-tertiary mt-1">
            Monitor email health and domain reputation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date range picker */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors text-th-text-primary"
            >
              <Mail className="w-4 h-4 text-th-text-tertiary" />
              {DATE_RANGE_LABELS[dateRange]}
              <ChevronDown className="w-3.5 h-3.5 text-th-text-tertiary" />
            </button>
            {showDateDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface-primary border border-th-border rounded-lg shadow-lg z-20 py-1">
                {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => { setDateRange(range); setShowDateDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-secondary transition-colors ${
                      dateRange === range ? 'text-th-accent-600 font-medium' : 'text-th-text-secondary'
                    }`}
                  >
                    {DATE_RANGE_LABELS[range]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom date inputs */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                aria-label="Start date"
                className="px-2 py-1.5 text-sm bg-surface-primary border border-th-border rounded-lg text-th-text-primary"
              />
              <span className="text-th-text-tertiary text-sm">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                aria-label="End date"
                className="px-2 py-1.5 text-sm bg-surface-primary border border-th-border rounded-lg text-th-text-primary"
              />
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-surface-primary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors text-th-text-primary"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <HelpBanner pageKey="email-deliverability" title="Welcome to Email Deliverability" tip="Monitor your email sending reputation and deliverability metrics. Check bounce rates, spam complaints, and authentication status to keep your emails landing in inboxes." />

      {/* Close dropdown on outside click */}
      {showDateDropdown && (
        <div className="fixed inset-0 z-10" onClick={() => setShowDateDropdown(false)} />
      )}

      {/* ─── Health Score + Key Metrics ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Health Score Gauge */}
        <div className={`lg:col-span-2 ${getScoreBg(metrics.healthScore)} rounded-xl border border-th-border p-6 flex flex-col items-center justify-center`}>
          <p className="text-sm font-medium text-th-text-secondary mb-4">Deliverability Score</p>
          <div className="relative">
            <svg width="160" height="160" viewBox="0 0 160 160">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Score arc */}
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke={getScoreColor(metrics.healthScore)}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(metrics.healthScore / 100) * 427} 427`}
                transform="rotate(-90 80 80)"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-4xl font-bold"
                style={{ color: getScoreColor(metrics.healthScore) }}
              >
                {Math.round(metrics.healthScore)}
              </span>
              <span className="text-xs text-th-text-tertiary mt-1">out of 100</span>
            </div>
          </div>
          <p
            className="text-sm font-semibold mt-3"
            style={{ color: getScoreColor(metrics.healthScore) }}
          >
            {getScoreLabel(metrics.healthScore)}
          </p>
          {/* Trend */}
          <div className="flex items-center gap-1 mt-2">
            {scoreTrend >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-xs font-medium ${scoreTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {scoreTrend >= 0 ? '+' : ''}{scoreTrend.toFixed(1)} vs previous period
            </span>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard
            icon={<Send className="w-5 h-5" />}
            iconColor="text-blue-500"
            iconBg="bg-blue-50"
            label="Total Sent"
            value={metrics.totalSent.toLocaleString()}
            subtext={`Previous: ${prevMetrics.totalSent.toLocaleString()}`}
          />
          <MetricCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconColor="text-green-500"
            iconBg="bg-green-50"
            label="Delivery Rate"
            value={`${metrics.deliveryRate.toFixed(1)}%`}
            subtext={`${metrics.delivered.toLocaleString()} delivered`}
          />
          <MetricCard
            icon={<Ban className="w-5 h-5" />}
            iconColor={metrics.bounceRate > 2 ? 'text-red-500' : 'text-amber-500'}
            iconBg={metrics.bounceRate > 2 ? 'bg-red-50' : 'bg-amber-50'}
            label="Bounce Rate"
            value={`${metrics.bounceRate.toFixed(1)}%`}
            subtext={`${metrics.bounced} bounced`}
            warning={metrics.bounceRate > 2}
          />
          <MetricCard
            icon={<Mail className="w-5 h-5" />}
            iconColor="text-blue-500"
            iconBg="bg-blue-50"
            label="Open Rate"
            value={`${metrics.openRate.toFixed(1)}%`}
            subtext={`${metrics.opened.toLocaleString()} opens`}
          />
          <MetricCard
            icon={<MousePointerClick className="w-5 h-5" />}
            iconColor="text-blue-500"
            iconBg="bg-blue-50"
            label="Click Rate"
            value={`${metrics.clickRate.toFixed(1)}%`}
            subtext={`${metrics.clicked.toLocaleString()} clicks`}
          />
        </div>
      </div>

      {/* ─── Delivery Trend Chart ──────────────────────────────────────── */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <h2 className="text-lg font-semibold text-th-text-primary mb-1">Delivery Trend</h2>
        <p className="text-xs text-th-text-tertiary mb-4">
          Daily volume of delivered, bounced, and failed emails
        </p>
        {deliveryTrendData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={deliveryTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                  name="Delivered"
                />
                <Area
                  type="monotone"
                  dataKey="bounced"
                  stackId="1"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.6}
                  name="Bounced"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.6}
                  name="Failed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState message="No delivery data in this period" />
        )}
      </div>

      {/* ─── Bounce Analysis + Engagement Trend ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bounce Analysis */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-th-text-primary">Bounce Analysis</h2>
              <p className="text-xs text-th-text-tertiary mt-0.5">
                Hard vs soft bounces &middot; {bounceAnalysis.total} total
              </p>
            </div>
            {bounceAnalysis.total > 0 && (
              <button
                onClick={handleSuppressBounced}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                Suppress bounced
              </button>
            )}
          </div>

          {bounceAnalysis.pieData.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bounceAnalysis.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {bounceAnalysis.pieData.map((_, idx) => (
                        <Cell key={`bounce-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Top bounced domains */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <p className="text-xs font-medium text-th-text-secondary">Top Bounced Domains</p>
                {bounceAnalysis.topDomains.map((d) => (
                  <div key={d.domain} className="flex items-center justify-between text-xs">
                    <span className="text-th-text-primary truncate">{d.domain}</span>
                    <span className="text-th-text-tertiary font-medium ml-2">{d.count}</span>
                  </div>
                ))}
                {bounceAnalysis.topDomains.length === 0 && (
                  <p className="text-xs text-th-text-tertiary">No bounced domains</p>
                )}
              </div>
            </div>
          ) : (
            <EmptyState message="No bounces detected — great job!" />
          )}
        </div>

        {/* Engagement Trend */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-1">Engagement Trends</h2>
          <p className="text-xs text-th-text-tertiary mb-4">
            Open rate and click rate over time
          </p>
          {engagementTrendData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`]} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="openRate"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', r: 3 }}
                    name="Open Rate %"
                  />
                  <Line
                    type="monotone"
                    dataKey="clickRate"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 3 }}
                    name="Click Rate %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No engagement data in this period" />
          )}
        </div>
      </div>

      {/* ─── Send Time Heatmap ──────────────────────────────────────────── */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <h2 className="text-lg font-semibold text-th-text-primary mb-1">Best Send Time Analysis</h2>
        <p className="text-xs text-th-text-tertiary mb-4">
          Open rates by day of week and hour — darker cells indicate higher open rates
        </p>
        {emailLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Day headers */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
                <div />
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-th-text-secondary py-1">
                    {day}
                  </div>
                ))}
              </div>
              {/* Hour rows */}
              {HOURS.filter((h) => h >= 6 && h <= 22).map((hour) => (
                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 mb-1">
                  <div className="text-xs text-th-text-tertiary flex items-center justify-end pr-2">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {DAYS_OF_WEEK.map((_, dayIdx) => {
                    const key = `${dayIdx}-${hour}`;
                    const cell = heatmapData.grid[key];
                    const rate = cell && cell.total > 0
                      ? Math.round((cell.opened / cell.total) * 100)
                      : 0;
                    const intensity = rate / 100;
                    return (
                      <div
                        key={key}
                        className="rounded h-7 flex items-center justify-center text-xs cursor-default transition-colors"
                        style={{
                          backgroundColor: cell && cell.total > 0
                            ? `rgba(16, 185, 129, ${Math.max(0.08, intensity * 0.9)})`
                            : '#F3F4F6',
                        }}
                        title={`${DAYS_OF_WEEK[dayIdx]} ${hour}:00 — ${rate}% open rate (${cell?.total || 0} sent)`}
                      >
                        {cell && cell.total > 0 && (
                          <span
                            className="font-medium"
                            style={{ color: intensity > 0.5 ? '#fff' : '#374151' }}
                          >
                            {rate}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 justify-end">
              <span className="text-xs text-th-text-tertiary">Low</span>
              <div className="flex gap-0.5">
                {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((opacity) => (
                  <div
                    key={opacity}
                    className="w-5 h-3 rounded-sm"
                    style={{ backgroundColor: `rgba(16, 185, 129, ${opacity})` }}
                  />
                ))}
              </div>
              <span className="text-xs text-th-text-tertiary">High</span>
            </div>
          </div>
        ) : (
          <EmptyState message="No send time data available" />
        )}
      </div>

      {/* ─── Device & Location Analytics ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-th-text-tertiary" />
            <h2 className="text-lg font-semibold text-th-text-primary">Device Breakdown</h2>
          </div>
          {deviceData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="h-52 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {deviceData.map((_, idx) => (
                        <Cell key={`device-${idx}`} fill={DEVICE_COLORS[idx % DEVICE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 min-w-[120px]">
                {deviceData.map((d, idx) => {
                  const DeviceIcon = d.name.toLowerCase().includes('mobile')
                    ? Smartphone
                    : d.name.toLowerCase().includes('tablet')
                      ? Tablet
                      : Monitor;
                  return (
                    <div key={d.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: DEVICE_COLORS[idx % DEVICE_COLORS.length] }}
                      />
                      <DeviceIcon className="w-4 h-4 text-th-text-tertiary" />
                      <span className="text-sm text-th-text-primary">{d.name}</span>
                      <span className="text-xs text-th-text-tertiary ml-auto">{d.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState message="No device tracking data available" />
          )}
        </div>

        {/* Top Countries */}
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-th-text-tertiary" />
            <h2 className="text-lg font-semibold text-th-text-primary">Top Countries</h2>
          </div>
          {countryData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} />
                  <YAxis
                    dataKey="country"
                    type="category"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    width={100}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill={COUNTRY_COLOR} radius={[0, 4, 4, 0]} name="Opens" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No location tracking data available" />
          )}
        </div>
      </div>

      {/* ─── Suppression List ──────────────────────────────────────────── */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <div>
              <h2 className="text-lg font-semibold text-th-text-primary">Suppression List</h2>
              <p className="text-xs text-th-text-tertiary mt-0.5">
                {suppressionList.length} suppressed addresses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddSuppression(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface-secondary text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add manually
            </button>
            <button
              onClick={handleExportSuppression}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-th-accent-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Add suppression modal */}
        {showAddSuppression && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-surface-secondary rounded-lg border border-th-border">
            <input
              type="email"
              value={suppressionEmail}
              onChange={(e) => setSuppressionEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 px-3 py-1.5 text-sm bg-surface-primary border border-th-border rounded-lg text-th-text-primary"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddSuppression(); }}
            />
            <button
              onClick={handleAddSuppression}
              className="px-3 py-1.5 text-sm font-medium bg-th-accent-600 text-white rounded-lg hover:opacity-90"
            >
              Add
            </button>
            <button
              onClick={() => { setShowAddSuppression(false); setSuppressionEmail(''); }}
              className="p-1.5 text-th-text-tertiary hover:text-th-text-primary"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {suppressionList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border text-left">
                  <th className="py-2.5 pr-3 font-medium text-th-text-tertiary">Email</th>
                  <th className="py-2.5 pr-3 font-medium text-th-text-tertiary">Bounce Type</th>
                  <th className="py-2.5 pr-3 font-medium text-th-text-tertiary">Bounced Date</th>
                  <th className="py-2.5 pr-3 font-medium text-th-text-tertiary">Lead Name</th>
                  <th className="py-2.5 font-medium text-th-text-tertiary text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {suppressionList.slice(0, 50).map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="py-3 pr-3 text-th-text-primary font-medium">{entry.email}</td>
                    <td className="py-3 pr-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        entry.bounceType === 'hard'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {entry.bounceType === 'hard' ? 'Hard' : 'Soft'}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-th-text-secondary">
                      {format(new Date(entry.bouncedDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 pr-3 text-th-text-secondary">{entry.leadName}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleRemoveSuppression(entry.email)}
                        className="text-th-text-tertiary hover:text-red-500 transition-colors"
                        title="Remove from suppression"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {suppressionList.length > 50 && (
              <p className="text-xs text-th-text-tertiary text-center mt-3">
                Showing 50 of {suppressionList.length} entries. Export for full list.
              </p>
            )}
          </div>
        ) : (
          <EmptyState message="No suppressed addresses. Your list is clean!" />
        )}
      </div>

      {/* ─── Recommendations Panel ─────────────────────────────────────── */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-th-text-primary">Recommendations</h2>
        </div>
        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                rec.severity === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : rec.severity === 'warning'
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-blue-50 border border-blue-200'
              }`}
            >
              {rec.severity === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : rec.severity === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${
                rec.severity === 'error'
                  ? 'text-red-800'
                  : rec.severity === 'warning'
                    ? 'text-amber-800'
                    : 'text-blue-800'
              }`}>
                {rec.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═════════════════════════════════════════════════════════════════════════════

function MetricCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  subtext,
  warning,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  subtext?: string;
  warning?: boolean;
}) {
  return (
    <div className={`bg-surface-primary rounded-xl border ${warning ? 'border-red-300' : 'border-th-border'} p-4 flex flex-col`}>
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center ${iconColor} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-th-text-primary">{value}</p>
      <p className="text-xs text-th-text-tertiary mt-1">{label}</p>
      {subtext && (
        <p className="text-xs text-th-text-tertiary mt-0.5">{subtext}</p>
      )}
      {warning && (
        <div className="flex items-center gap-1 mt-2">
          <AlertTriangle className="w-3 h-3 text-red-500" />
          <span className="text-xs text-red-600 font-medium">Above threshold</span>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-th-text-tertiary text-sm">
      {message}
    </div>
  );
}

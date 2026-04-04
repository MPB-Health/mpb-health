import { useState, useEffect, useCallback } from 'react';
import {
  Users, DollarSign,
  Download, Target, Activity, RefreshCw, AlertCircle,
} from 'lucide-react';
import {
  analyticsService,
  memberService,
  crmBridgeService,
  type MemberStats,
  type CRMSummary,
  type DashboardMetrics,
} from '@mpbhealth/admin-core';

interface ReportData {
  metrics: DashboardMetrics | null;
  memberStats: MemberStats | null;
  crmSummary: CRMSummary | null;
  revenue: { total_invoiced: number; total_paid: number; outstanding: number; this_month: number } | null;
}

export default function Reports() {
  const [data, setData] = useState<ReportData>({
    metrics: null,
    memberStats: null,
    crmSummary: null,
    revenue: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dateRange, setDateRange] = useState('this_month');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [metrics, memberStats, crmSummary, revenue] = await Promise.allSettled([
        analyticsService.getDashboardMetrics(),
        memberService.getStats(),
        crmBridgeService.getCRMSummary(),
        crmBridgeService.getRevenueMetrics(),
      ]);

      const newData = {
        metrics: metrics.status === 'fulfilled' ? metrics.value : null,
        memberStats: memberStats.status === 'fulfilled' ? memberStats.value : null,
        crmSummary: crmSummary.status === 'fulfilled' ? crmSummary.value : null,
        revenue: revenue.status === 'fulfilled' ? revenue.value : null,
      };
      setData(newData);

      const allFailed = !newData.metrics && !newData.memberStats && !newData.crmSummary && !newData.revenue;
      if (allFailed) setError(true);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const exportCSV = () => {
    const rows: string[][] = [['Metric', 'Value']];

    if (data.metrics) {
      rows.push(['Total Users', String(data.metrics.total_users)]);
      rows.push(['Active Users', String(data.metrics.active_users)]);
      rows.push(['Total Advisors', String(data.metrics.total_advisors)]);
      rows.push(['Active Advisors', String(data.metrics.active_advisors)]);
      rows.push(['Pending Enrollments', String(data.metrics.pending_enrollments)]);
    }
    if (data.memberStats) {
      rows.push(['Total Members', String(data.memberStats.total)]);
      rows.push(['Active Members', String(data.memberStats.active)]);
      rows.push(['New Members This Month', String(data.memberStats.new_this_month)]);
    }
    if (data.crmSummary) {
      rows.push(['Total Leads', String(data.crmSummary.total_leads)]);
      rows.push(['New Leads Today', String(data.crmSummary.new_today)]);
      rows.push(['Conversion Rate', `${data.crmSummary.conversion_rate}%`]);
    }
    if (data.revenue) {
      rows.push(['Total Invoiced', `$${data.revenue.total_invoiced}`]);
      rows.push(['Total Paid', `$${data.revenue.total_paid}`]);
      rows.push(['Outstanding', `$${data.revenue.outstanding}`]);
    }

    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mpb-health-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-th-text-primary">Reports & Analytics</h1>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary text-sm"
          >
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
          </select>
          <button
            onClick={loadReports}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-secondary transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">
            Failed to load some report data. Try refreshing the page.
          </p>
          <button
            onClick={loadReports}
            className="ml-auto text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* User & Advisor metrics */}
      {data.metrics && (
        <ReportSection title="Users & Advisors" icon={Users}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Metric label="Total Users" value={data.metrics.total_users} />
            <Metric label="Active Users" value={data.metrics.active_users} />
            <Metric label="Total Advisors" value={data.metrics.total_advisors} />
            <Metric label="Active Advisors" value={data.metrics.active_advisors} />
            <Metric label="Pending Enrollments" value={data.metrics.pending_enrollments} highlight />
          </div>
        </ReportSection>
      )}

      {/* Member metrics */}
      {data.memberStats && (
        <ReportSection title="Members" icon={Activity}>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Metric label="Total" value={data.memberStats.total} />
            <Metric label="Active" value={data.memberStats.active} />
            <Metric label="Pending" value={data.memberStats.pending} />
            <Metric label="Suspended" value={data.memberStats.suspended} />
            <Metric label="Cancelled" value={data.memberStats.cancelled} />
            <Metric label="New This Month" value={data.memberStats.new_this_month} highlight />
          </div>
        </ReportSection>
      )}

      {/* CRM metrics */}
      {data.crmSummary && (
        <ReportSection title="CRM & Leads" icon={Target}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric label="Total Leads" value={data.crmSummary.total_leads} />
            <Metric label="New Today" value={data.crmSummary.new_today} />
            <Metric label="Conversion Rate" value={`${data.crmSummary.conversion_rate}%`} />
            <Metric label="Pending Tasks" value={data.crmSummary.pending_tasks} />
          </div>
          {data.crmSummary.leads_by_stage.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-th-text-secondary">Pipeline Breakdown</h4>
              {data.crmSummary.leads_by_stage.map((stage) => (
                <div key={stage.stage} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm text-th-text-secondary flex-1">{stage.stage}</span>
                  <span className="text-sm font-medium text-th-text-primary">{stage.count}</span>
                </div>
              ))}
            </div>
          )}
        </ReportSection>
      )}

      {/* Revenue metrics */}
      {data.revenue && (
        <ReportSection title="Revenue" icon={DollarSign}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric label="Total Invoiced" value={`$${data.revenue.total_invoiced.toLocaleString()}`} />
            <Metric label="Total Paid" value={`$${data.revenue.total_paid.toLocaleString()}`} />
            <Metric label="Outstanding" value={`$${data.revenue.outstanding.toLocaleString()}`} highlight />
            <Metric label="This Month" value={`$${data.revenue.this_month.toLocaleString()}`} />
          </div>
        </ReportSection>
      )}
    </div>
  );
}

function ReportSection({ title, icon: Icon, children }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-th-text-tertiary" />
        <h2 className="text-lg font-semibold text-th-text-primary">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value, highlight }: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-th-accent-50 dark:bg-th-accent-900/10' : 'bg-surface-tertiary'}`}>
      <p className="text-xs text-th-text-tertiary mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-th-accent-600' : 'text-th-text-primary'}`}>{value}</p>
    </div>
  );
}

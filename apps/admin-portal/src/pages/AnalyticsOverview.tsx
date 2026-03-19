import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsOverviewService, type AnalyticsOverviewStats } from '@mpbhealth/admin-core';

const DAY_RANGES = [7, 14, 30, 90];

export default function AnalyticsOverview() {
  const [data, setData] = useState<AnalyticsOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    analyticsOverviewService
      .getOverview(days)
      .then(setData)
      .catch((err) => {
        console.error('Failed to load analytics:', err);
        toast.error('Failed to load analytics data');
      })
      .finally(() => setLoading(false));
  }, [days]);

  const maxViews = data
    ? Math.max(...data.trafficByDay.map((d) => d.page_views), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Analytics Overview</h1>
          <p className="text-sm text-th-text-tertiary mt-1">Website traffic summary</p>
        </div>
        <div className="flex gap-1 bg-surface-secondary rounded-lg p-1">
          {DAY_RANGES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${
                days === d
                  ? 'bg-surface-primary text-th-text-primary shadow-sm'
                  : 'text-th-text-tertiary hover:text-th-text-secondary'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
        </div>
      ) : data ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Eye, label: 'Page Views', value: data.totalPageViews.toLocaleString() },
              { icon: BarChart3, label: 'Sessions', value: data.totalSessions.toLocaleString() },
              { icon: Users, label: 'Avg Daily Visitors', value: data.avgDailyVisitors.toLocaleString() },
              { icon: TrendingUp, label: 'Leads This Month', value: data.leadStats.this_month.toLocaleString() },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-surface-primary border border-th-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-th-accent-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-th-accent-600" />
                  </div>
                  <p className="text-sm text-th-text-tertiary">{label}</p>
                </div>
                <p className="text-2xl font-bold text-th-text-primary">{value}</p>
              </div>
            ))}
          </div>

          {/* Lead stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Leads', value: data.leadStats.total },
              { label: 'Leads Today', value: data.leadStats.today },
              { label: 'Leads This Month', value: data.leadStats.this_month },
            ].map((s) => (
              <div key={s.label} className="bg-surface-primary border border-th-border rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-th-text-primary">{s.value}</p>
                <p className="text-xs text-th-text-tertiary mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Traffic chart */}
          {data.trafficByDay.length > 0 ? (
            <div className="bg-surface-primary border border-th-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-th-text-primary mb-4">Page Views by Day</h2>
              <div className="flex items-end gap-1 h-40">
                {data.trafficByDay.map((row) => {
                  const height = Math.max((row.page_views / maxViews) * 100, 2);
                  return (
                    <div
                      key={row.date}
                      className="flex-1 flex flex-col items-center gap-1 group"
                      title={`${row.date}: ${row.page_views} views`}
                    >
                      <div
                        className="w-full bg-th-accent-500 rounded-t opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-th-text-tertiary">
                <span>{data.trafficByDay[0]?.date}</span>
                <span>{data.trafficByDay[data.trafficByDay.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <div className="bg-surface-primary border border-th-border rounded-xl p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-th-text-tertiary" />
              <p className="text-th-text-tertiary text-sm">No traffic data for the selected period</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

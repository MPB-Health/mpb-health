import { useCallback, useEffect, useState } from 'react';
import { Activity, Loader2, Radio, RefreshCw, Users } from 'lucide-react';
import {
  quoteResultsAnalyticsService,
  type QuoteFunnelEventRow,
  type QuoteResultsAnalytics,
} from './QuoteResultsAnalyticsService';

const DAY_OPTIONS = [7, 14, 30, 90] as const;

function pct(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

function summarizeMeta(meta: Record<string, unknown> | null | undefined): string {
  if (!meta || typeof meta !== 'object') return '';
  const keys = ['plan_count', 'best_match', 'state', 'household_type', 'source_path'] as const;
  const parts: string[] = [];
  for (const k of keys) {
    const v = meta[k];
    if (v !== undefined && v !== null && String(v).length > 0) parts.push(`${k}: ${String(v)}`);
  }
  return parts.length ? parts.join(' · ') : '';
}

export interface QuoteResultsReturnedPanelProps {
  /** Optional class on root for host app spacing */
  className?: string;
}

/**
 * Shared analytics UI: Quote Results Returned (hero calculator funnel).
 * Used by Admin Portal, CRM, and website admin.
 */
export function QuoteResultsReturnedPanel({ className }: QuoteResultsReturnedPanelProps) {
  const [days, setDays] = useState<number>(30);
  const [stats, setStats] = useState<QuoteResultsAnalytics | null>(null);
  const [recent, setRecent] = useState<QuoteFunnelEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const a = await quoteResultsAnalyticsService.getAnalytics(days);
    if (!a) setError('Could not load analytics. Check permissions or run the latest database migration.');
    setStats(a);
    setLoading(false);
  }, [days]);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const rows = await quoteResultsAnalyticsService.fetchRecentEvents(80);
      setRecent(rows);
    } catch (e) {
      console.error(e);
      setRecent([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  useEffect(() => {
    if (!live) return () => {};
    const unsub = quoteResultsAnalyticsService.subscribeToInserts(() => {
      void load();
      void loadRecent();
    });
    return unsub;
  }, [live, load, loadRecent]);

  return (
    <div className={className ?? 'space-y-6'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                days === d
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={live}
              onChange={(e) => setLive(e.target.checked)}
              className="rounded border-slate-300"
            />
            <Radio className="h-4 w-4" />
            Realtime sync
          </label>
          <button
            type="button"
            onClick={() => {
              void load();
              void loadRecent();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Users className="h-4 w-4" />
                Sessions saw results
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.sessions_with_results.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Activity className="h-4 w-4" />
                Converted (lead submitted)
              </div>
              <p className="text-2xl font-bold text-emerald-700">{stats.sessions_converted.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-slate-500 text-sm mb-1">Abandoned (no lead)</div>
              <p className="text-2xl font-bold text-amber-800">{stats.sessions_abandoned.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-slate-500 text-sm mb-1">Conversion rate</div>
              <p className="text-2xl font-bold text-slate-900">{pct(stats.conversion_rate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-lg border border-slate-100 bg-slate-50 py-2">
              <span className="font-semibold text-slate-900">{stats.events_results_viewed}</span>
              <p className="text-slate-500 text-xs">Results impressions</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 py-2">
              <span className="font-semibold text-slate-900">{stats.events_contact_opened}</span>
              <p className="text-slate-500 text-xs">Get exact rate clicks</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 py-2">
              <span className="font-semibold text-slate-900">{stats.events_lead_submitted}</span>
              <p className="text-slate-500 text-xs">Lead submits</p>
            </div>
          </div>

          {stats.by_day.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Events by day (UTC)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Results</th>
                      <th className="py-2 pr-4">Contact opened</th>
                      <th className="py-2">Lead</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.by_day.map((d) => (
                      <tr key={d.date}>
                        <td className="py-2 text-slate-700">{d.date}</td>
                        <td className="py-2 text-slate-900">{d.results_events}</td>
                        <td className="py-2 text-slate-900">{d.contact_events}</td>
                        <td className="py-2 text-slate-900">{d.lead_events}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Recent events</h3>
          {recentLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 sticky top-0">
              <tr>
                <th className="px-3 py-2 font-medium">Time (UTC)</th>
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">Session</th>
                <th className="px-3 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                    {new Date(row.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-800">{row.event_type}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{row.session_id.slice(0, 8)}…</td>
                  <td className="px-3 py-2 text-xs text-slate-600 max-w-md truncate" title={summarizeMeta(row.metadata ?? undefined)}>
                    {summarizeMeta(row.metadata ?? undefined) || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!recentLoading && recent.length === 0 && (
            <p className="px-4 py-8 text-center text-slate-500 text-sm">No events recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

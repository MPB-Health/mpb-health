import React, { useEffect, useState, useCallback } from 'react';
import {
  MousePointerClick,
  Eye,
  Clock,
  LogIn,
  LogOut,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { ComparisonSelector, BarChart } from './analytics';
import {
  type DatePreset,
  getDateRangeFromPreset,
  getPreviousPeriod,
  analyticsComparisonService,
  formatDuration,
  formatNumber,
} from '../../lib/analyticsComparisonService';
import {
  analyticsDataService,
  type PageMetrics,
  type SessionData,
} from '../../lib/analyticsDataService';

export const UserBehaviorPanel: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('last30days');
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const [topPages, setTopPages] = useState<PageMetrics[]>([]);
  const [entryPages, setEntryPages] = useState<PageMetrics[]>([]);
  const [exitPages, setExitPages] = useState<PageMetrics[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionData[]>([]);
  const [comparison, setComparison] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentRange = getDateRangeFromPreset(selectedPreset);
      const previousRange = getPreviousPeriod(currentRange);

      const [pages, entries, exits, sessions, comp] = await Promise.all([
        analyticsDataService.getTopPages(currentRange, 10),
        analyticsDataService.getEntryPages(currentRange, 5),
        analyticsDataService.getExitPages(currentRange, 5),
        analyticsDataService.getRecentSessions(20),
        compareEnabled
          ? analyticsComparisonService.compareSummary(currentRange, previousRange)
          : null,
      ]);

      setTopPages(pages);
      setEntryPages(entries);
      setExitPages(exits);
      setRecentSessions(sessions);
      setComparison(comp);
    } catch (error) {
      console.error('Error loading behavior data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPreset, compareEnabled]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Format page path for display
  const formatPagePath = (path: string, maxLength: number = 40): string => {
    if (path.length <= maxLength) return path;
    return '...' + path.slice(-maxLength + 3);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <MousePointerClick className="h-7 w-7 text-purple-600" />
            User Behavior
          </h2>
          <p className="text-neutral-600 mt-1">
            Understand how visitors interact with your site
          </p>
        </div>

        <ComparisonSelector
          selectedPreset={selectedPreset}
          onPresetChange={setSelectedPreset}
          compareEnabled={compareEnabled}
          onCompareToggle={setCompareEnabled}
          onRefresh={loadData}
          loading={loading}
        />
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900">Bounce Rate</span>
            <MousePointerClick className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-900">
            {(comparison?.bounceRate?.current || 0).toFixed(1)}%
          </div>
          {compareEnabled && comparison?.bounceRate?.trend && comparison.bounceRate.trend !== 'neutral' && (
            <div
              className={`mt-1 text-sm flex items-center gap-1 ${
                (comparison.bounceRate?.change || 0) < 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {(comparison.bounceRate?.change || 0) < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              {Math.abs(comparison.bounceRate?.changePercent || 0).toFixed(1)}%
            </div>
          )}
        </Card>

        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Avg. Duration</span>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-900">
            {formatDuration(comparison?.avgSessionDuration?.current || 0)}
          </div>
          {compareEnabled && comparison?.avgSessionDuration?.trend && comparison.avgSessionDuration.trend !== 'neutral' && (
            <div
              className={`mt-1 text-sm flex items-center gap-1 ${
                (comparison.avgSessionDuration?.change || 0) > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {(comparison.avgSessionDuration?.change || 0) > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(comparison.avgSessionDuration?.changePercent || 0).toFixed(1)}%
            </div>
          )}
        </Card>

        <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Pages/Session</span>
            <Layers className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-900">
            {(comparison?.pagesPerSession?.current || 0).toFixed(2)}
          </div>
          {compareEnabled && comparison?.pagesPerSession?.trend && comparison.pagesPerSession.trend !== 'neutral' && (
            <div
              className={`mt-1 text-sm flex items-center gap-1 ${
                (comparison.pagesPerSession?.change || 0) > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {(comparison.pagesPerSession?.change || 0) > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(comparison.pagesPerSession?.changePercent || 0).toFixed(1)}%
            </div>
          )}
        </Card>

        <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-900">Total Views</span>
            <Eye className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-900">
            {formatNumber(comparison?.pageViews?.current || 0)}
          </div>
          {compareEnabled && comparison?.pageViews?.trend && comparison.pageViews.trend !== 'neutral' && (
            <div
              className={`mt-1 text-sm flex items-center gap-1 ${
                (comparison.pageViews?.change || 0) > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {(comparison.pageViews?.change || 0) > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(comparison.pageViews?.changePercent || 0).toFixed(1)}%
            </div>
          )}
        </Card>
      </div>

      {/* Top Pages */}
      <BarChart
        title="Most Visited Pages"
        data={topPages.map((page, index) => ({
          label: page.pageTitle || page.pagePath,
          value: page.views,
          color: index < 3 ? '#8b5cf6' : '#c4b5fd',
        }))}
        height={300}
        loading={loading}
      />

      {/* Entry & Exit Pages */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Entry Pages (Landing Pages) */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <LogIn className="h-5 w-5 text-green-600" />
            Top Landing Pages
          </h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-neutral-100 rounded"></div>
              ))}
            </div>
          ) : entryPages.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No entry page data available</p>
          ) : (
            <div className="space-y-3">
              {entryPages.map((page, index) => {
                const maxCount = entryPages[0]?.entryCount || 1;
                const widthPercent = (page.entryCount / maxCount) * 100;

                return (
                  <div key={page.pagePath}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index < 3
                              ? 'bg-green-100 text-green-700'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-neutral-900 truncate max-w-[200px]">
                          {page.pageTitle || formatPagePath(page.pagePath)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatNumber(page.entryCount)}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2 ml-8">
                      <div
                        className="h-2 rounded-full bg-green-500 transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Exit Pages */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <LogOut className="h-5 w-5 text-red-600" />
            Top Exit Pages
          </h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-neutral-100 rounded"></div>
              ))}
            </div>
          ) : exitPages.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No exit page data available</p>
          ) : (
            <div className="space-y-3">
              {exitPages.map((page, index) => {
                const maxCount = exitPages[0]?.exitCount || 1;
                const widthPercent = (page.exitCount / maxCount) * 100;

                return (
                  <div key={page.pagePath}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index < 3
                              ? 'bg-red-100 text-red-700'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-neutral-900 truncate max-w-[200px]">
                          {page.pageTitle || formatPagePath(page.pagePath)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatNumber(page.exitCount)}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-2 ml-8">
                      <div
                        className="h-2 rounded-full bg-red-500 transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Recent Sessions
        </h3>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded"></div>
            ))}
          </div>
        ) : recentSessions.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">No session data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-neutral-500 border-b border-neutral-200">
                  <th className="pb-3 font-medium">Session</th>
                  <th className="pb-3 font-medium">Entry Page</th>
                  <th className="pb-3 font-medium text-center">Pages</th>
                  <th className="pb-3 font-medium text-center">Duration</th>
                  <th className="pb-3 font-medium text-center">Device</th>
                  <th className="pb-3 font-medium text-center">Country</th>
                  <th className="pb-3 font-medium text-center">Type</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.slice(0, 10).map((session) => (
                  <tr
                    key={session.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                  >
                    <td className="py-3">
                      <div className="text-xs text-neutral-500">
                        {new Date(session.startedAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-neutral-900 truncate max-w-[200px] block">
                        {formatPagePath(session.entryPage, 30)}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.pageCount > 3
                            ? 'bg-green-100 text-green-700'
                            : session.pageCount > 1
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {session.pageCount}
                      </span>
                    </td>
                    <td className="py-3 text-center text-sm text-neutral-600">
                      {formatDuration(session.durationSeconds)}
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-xs text-neutral-500 capitalize">
                        {session.deviceType || '-'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-xs text-neutral-500">
                        {session.country || '-'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.isNewVisitor
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {session.isNewVisitor ? 'New' : 'Return'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};


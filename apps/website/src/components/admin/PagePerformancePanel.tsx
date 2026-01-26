import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  BarChart2,
  Target,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { ComparisonSelector } from './analytics';
import {
  type DatePreset,
  getDateRangeFromPreset,
  getPreviousPeriod,
  formatNumber,
  formatDuration,
} from '../../lib/analyticsComparisonService';
import { analyticsDataService, type PageMetrics } from '../../lib/analyticsDataService';

export const PagePerformancePanel: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('last30days');
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'views' | 'uniqueViews' | 'avgTimeOnPage' | 'bounceRate'>(
    'views'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [pages, setPages] = useState<PageMetrics[]>([]);
  const [comparisonPages, setComparisonPages] = useState<PageMetrics[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentRange = getDateRangeFromPreset(selectedPreset);
      const previousRange = getPreviousPeriod(currentRange);

      const [currentPages, prevPages] = await Promise.all([
        analyticsDataService.getTopPages(currentRange, 50),
        compareEnabled ? analyticsDataService.getTopPages(previousRange, 50) : null,
      ]);

      setPages(currentPages);
      setComparisonPages(prevPages || []);
    } catch (error) {
      console.error('Error loading page performance data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPreset, compareEnabled]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sort pages
  const sortedPages = [...pages].sort((a, b) => {
    const multiplier = sortOrder === 'desc' ? -1 : 1;
    switch (sortBy) {
      case 'views':
        return (a.views - b.views) * multiplier;
      case 'uniqueViews':
        return (a.uniqueViews - b.uniqueViews) * multiplier;
      case 'avgTimeOnPage':
        return (a.avgTimeOnPage - b.avgTimeOnPage) * multiplier;
      case 'bounceRate':
        return (a.bounceRate - b.bounceRate) * multiplier;
      default:
        return 0;
    }
  });

  // Get comparison data for a page
  const getPageComparison = (pagePath: string) => {
    const prev = comparisonPages.find((p) => p.pagePath === pagePath);
    return prev;
  };

  // Calculate change
  const getChange = (current: number, previous: number | undefined): number | null => {
    if (!compareEnabled || previous === undefined || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  // Toggle sort
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Calculate totals
  const totalViews = pages.reduce((sum, p) => sum + p.views, 0);
  const totalUniqueViews = pages.reduce((sum, p) => sum + p.uniqueViews, 0);
  const avgTimeOnPage =
    pages.length > 0 ? pages.reduce((sum, p) => sum + p.avgTimeOnPage, 0) / pages.length : 0;

  // Previous totals
  const prevTotalViews = comparisonPages.reduce((sum, p) => sum + p.views, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <FileText className="h-7 w-7 text-amber-600" />
            Page Performance
          </h2>
          <p className="text-neutral-600 mt-1">Analyze how each page is performing</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-amber-900">Total Pages</span>
            <FileText className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-900">{pages.length}</div>
          <p className="text-xs text-amber-700 mt-1">tracked pages</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Total Views</span>
            <Eye className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-900">{formatNumber(totalViews)}</div>
          {compareEnabled && getChange(totalViews, prevTotalViews) !== null && (
            <div
              className={`mt-1 text-xs flex items-center gap-1 ${
                (getChange(totalViews, prevTotalViews) || 0) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {(getChange(totalViews, prevTotalViews) || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(getChange(totalViews, prevTotalViews) || 0).toFixed(1)}%
            </div>
          )}
        </Card>

        <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Unique Views</span>
            <Target className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-900">{formatNumber(totalUniqueViews)}</div>
          <p className="text-xs text-green-700 mt-1">unique page views</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900">Avg. Time</span>
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-900">{formatDuration(avgTimeOnPage)}</div>
          <p className="text-xs text-purple-700 mt-1">per page</p>
        </Card>
      </div>

      {/* Top Performing Pages */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-blue-600" />
            Page Analytics
          </h3>
          <span className="text-sm text-neutral-500">{pages.length} pages tracked</span>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded"></div>
            ))}
          </div>
        ) : pages.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">No page data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-neutral-500 border-b border-neutral-200">
                  <th className="pb-3 font-medium">Page</th>
                  <th
                    className="pb-3 font-medium text-right cursor-pointer hover:text-neutral-700"
                    onClick={() => handleSort('views')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Views
                      {sortBy === 'views' && (
                        <span className="text-blue-600">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="pb-3 font-medium text-right cursor-pointer hover:text-neutral-700"
                    onClick={() => handleSort('uniqueViews')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Unique
                      {sortBy === 'uniqueViews' && (
                        <span className="text-blue-600">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="pb-3 font-medium text-right cursor-pointer hover:text-neutral-700"
                    onClick={() => handleSort('avgTimeOnPage')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Avg. Time
                      {sortBy === 'avgTimeOnPage' && (
                        <span className="text-blue-600">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </div>
                  </th>
                  <th className="pb-3 font-medium text-right">Entries</th>
                  <th className="pb-3 font-medium text-right">Exits</th>
                  {compareEnabled && <th className="pb-3 font-medium text-right">Change</th>}
                </tr>
              </thead>
              <tbody>
                {sortedPages.slice(0, 20).map((page, index) => {
                  const prev = getPageComparison(page.pagePath);
                  const change = getChange(page.views, prev?.views);
                  const maxViews = sortedPages[0]?.views || 1;
                  const widthPercent = (page.views / maxViews) * 100;

                  return (
                    <tr
                      key={page.pagePath}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              index < 3
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-neutral-900 truncate max-w-[300px]">
                              {page.pageTitle || page.pagePath}
                            </div>
                            <div className="text-xs text-neutral-500 truncate max-w-[300px]">
                              {page.pagePath}
                            </div>
                            {/* Mini progress bar */}
                            <div className="w-full bg-neutral-100 rounded-full h-1 mt-1">
                              <div
                                className={`h-1 rounded-full transition-all duration-500 ${
                                  index === 0
                                    ? 'bg-amber-500'
                                    : index === 1
                                    ? 'bg-amber-400'
                                    : index === 2
                                    ? 'bg-amber-300'
                                    : 'bg-neutral-300'
                                }`}
                                style={{ width: `${widthPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <span className="font-semibold text-neutral-900">
                          {formatNumber(page.views)}
                        </span>
                      </td>
                      <td className="py-4 text-right text-neutral-600">
                        {formatNumber(page.uniqueViews)}
                      </td>
                      <td className="py-4 text-right text-neutral-600">
                        {formatDuration(page.avgTimeOnPage)}
                      </td>
                      <td className="py-4 text-right text-neutral-600">
                        {formatNumber(page.entryCount)}
                      </td>
                      <td className="py-4 text-right text-neutral-600">
                        {formatNumber(page.exitCount)}
                      </td>
                      {compareEnabled && (
                        <td className="py-4 text-right">
                          {change !== null ? (
                            <span
                              className={`flex items-center justify-end gap-1 text-sm ${
                                change >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {change >= 0 ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              {Math.abs(change).toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-sm">New</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Page Categories (if available) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* High Performing Pages */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            High Engagement Pages
          </h3>
          <p className="text-sm text-neutral-500 mb-4">Pages with above-average time on page</p>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-neutral-100 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {pages
                .filter((p) => p.avgTimeOnPage > avgTimeOnPage)
                .slice(0, 5)
                .map((page, index) => (
                  <div
                    key={page.pagePath}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-neutral-900 truncate max-w-[200px]">
                        {page.pageTitle || page.pagePath}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-green-700">
                      {formatDuration(page.avgTimeOnPage)}
                    </span>
                  </div>
                ))}
              {pages.filter((p) => p.avgTimeOnPage > avgTimeOnPage).length === 0 && (
                <p className="text-neutral-500 text-center py-4">No high engagement pages</p>
              )}
            </div>
          )}
        </Card>

        {/* Pages Needing Attention */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Pages Needing Attention
          </h3>
          <p className="text-sm text-neutral-500 mb-4">Pages with below-average engagement</p>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-neutral-100 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {pages
                .filter((p) => p.avgTimeOnPage < avgTimeOnPage && p.avgTimeOnPage > 0)
                .sort((a, b) => a.avgTimeOnPage - b.avgTimeOnPage)
                .slice(0, 5)
                .map((page, index) => (
                  <div
                    key={page.pagePath}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-neutral-900 truncate max-w-[200px]">
                        {page.pageTitle || page.pagePath}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-red-700">
                      {formatDuration(page.avgTimeOnPage)}
                    </span>
                  </div>
                ))}
              {pages.filter((p) => p.avgTimeOnPage < avgTimeOnPage && p.avgTimeOnPage > 0)
                .length === 0 && (
                <p className="text-neutral-500 text-center py-4">No pages needing attention</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};


import React, { useState, useMemo } from 'react';
import {
  FileText,
  ExternalLink,
  TrendingUp,
  MousePointerClick,
  Eye,
  Target,
  ArrowUpRight,
  Search,
  Hash,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import type { PageWithMetrics } from '../../../lib/seoDataService';

interface TopPagesPanelProps {
  pages: PageWithMetrics[];
  loading?: boolean;
  siteUrl?: string;
}

type SortField = 'clicks' | 'impressions' | 'ctr' | 'avgPosition';
type SortDirection = 'asc' | 'desc';

export const TopPagesPanel: React.FC<TopPagesPanelProps> = ({
  pages,
  loading = false,
  siteUrl,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('clicks');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showAll, setShowAll] = useState(false);

  // Filter and sort pages
  const filteredPages = useMemo(() => {
    let filtered = [...pages];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (page) =>
          page.pageUrl.toLowerCase().includes(query) ||
          page.pageTitle?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return showAll ? filtered : filtered.slice(0, 10);
  }, [pages, searchQuery, sortField, sortDirection, showAll]);

  // Calculate totals
  const totals = useMemo(() => {
    return pages.reduce(
      (acc, page) => ({
        clicks: acc.clicks + page.clicks,
        impressions: acc.impressions + page.impressions,
        pages: acc.pages + 1,
      }),
      { clicks: 0, impressions: 0, pages: 0 }
    );
  }, [pages]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'avgPosition' ? 'asc' : 'desc');
    }
  };

  const formatUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname || '/';
    } catch {
      return url;
    }
  };

  const getPositionBadgeColor = (position: number): string => {
    if (position <= 3) return 'bg-green-100 text-green-800';
    if (position <= 10) return 'bg-blue-100 text-blue-800';
    if (position <= 20) return 'bg-amber-100 text-amber-800';
    return 'bg-neutral-100 text-neutral-800';
  };

  const getCtrColor = (ctr: number): string => {
    if (ctr >= 0.1) return 'text-green-600';
    if (ctr >= 0.05) return 'text-blue-600';
    if (ctr >= 0.02) return 'text-amber-600';
    return 'text-neutral-600';
  };

  const SortableHeader: React.FC<{
    field: SortField;
    children: React.ReactNode;
  }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className={`inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider hover:text-neutral-900 transition-colors ${
        sortField === field ? 'text-blue-600' : 'text-neutral-500'
      }`}
    >
      {children}
      {sortField === field && (
        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  );

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-neutral-100 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Top Pages by Organic Traffic
          </h3>
          <span className="text-sm text-neutral-500">
            {pages.length} pages indexed
          </span>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-lg px-4 py-3 border border-neutral-200">
            <div className="flex items-center gap-2 mb-1">
              <MousePointerClick className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-neutral-500">Total Clicks</span>
            </div>
            <span className="text-xl font-bold text-neutral-900">
              {totals.clicks.toLocaleString()}
            </span>
          </div>
          <div className="bg-white rounded-lg px-4 py-3 border border-neutral-200">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-neutral-500">Total Impressions</span>
            </div>
            <span className="text-xl font-bold text-neutral-900">
              {totals.impressions.toLocaleString()}
            </span>
          </div>
          <div className="bg-white rounded-lg px-4 py-3 border border-neutral-200">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-neutral-500">Indexed Pages</span>
            </div>
            <span className="text-xl font-bold text-neutral-900">
              {totals.pages.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Page
                </span>
              </th>
              <th className="px-4 py-3 text-right">
                <SortableHeader field="clicks">
                  <MousePointerClick className="h-3.5 w-3.5" />
                  Clicks
                </SortableHeader>
              </th>
              <th className="px-4 py-3 text-right">
                <SortableHeader field="impressions">
                  <Eye className="h-3.5 w-3.5" />
                  Impressions
                </SortableHeader>
              </th>
              <th className="px-4 py-3 text-right">
                <SortableHeader field="ctr">CTR</SortableHeader>
              </th>
              <th className="px-4 py-3 text-right">
                <SortableHeader field="avgPosition">
                  <Target className="h-3.5 w-3.5" />
                  Position
                </SortableHeader>
              </th>
              <th className="px-4 py-3 text-center">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Keywords
                </span>
              </th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredPages.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
                  <p className="text-neutral-500">No pages found</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    {searchQuery
                      ? 'Try adjusting your search'
                      : 'Connect Google Search Console to see page data'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredPages.map((page, index) => {
                const displayUrl = formatUrl(page.pageUrl);
                const clickShare = totals.clicks > 0 ? (page.clicks / totals.clicks) * 100 : 0;

                return (
                  <tr key={index} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Click share bar */}
                        <div className="w-12 h-1.5 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(clickShare * 2, 100)}%` }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-900 truncate max-w-[300px]">
                              {page.pageTitle || displayUrl}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 truncate max-w-[300px]">
                            {displayUrl}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-neutral-900">
                        {page.clicks.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-neutral-600">
                        {page.impressions.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${getCtrColor(page.ctr)}`}>
                        {(page.ctr * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPositionBadgeColor(
                          page.avgPosition
                        )}`}
                      >
                        {page.avgPosition.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-neutral-600">
                        {page.keywordCount || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={page.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                        title="Visit page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {pages.length > 10 && (
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {showAll ? (
              <>Show less</>
            ) : (
              <>
                Show all {pages.length} pages
                <ArrowUpRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Google Search Console Link */}
      {siteUrl && (
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50">
          <a
            href={`https://search.google.com/search-console/performance/search-analytics?resource_id=${encodeURIComponent(
              siteUrl
            )}&pages=*`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-700"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            View detailed page performance in Google Search Console
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </Card>
  );
};


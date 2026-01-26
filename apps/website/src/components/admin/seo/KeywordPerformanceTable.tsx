import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ArrowUp,
  ArrowDown,
  Filter,
  ChevronDown,
  Sparkles,
  MousePointerClick,
  Eye,
  Target,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import type { KeywordWithTrend } from '../../../lib/seoDataService';

interface KeywordPerformanceTableProps {
  keywords: KeywordWithTrend[];
  loading?: boolean;
  onKeywordSelect?: (keyword: string) => void;
  selectedKeywords?: string[];
}

type SortField = 'keyword' | 'clicks' | 'impressions' | 'ctr' | 'position' | 'positionChange';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'up' | 'down' | 'new' | 'top10';

export const KeywordPerformanceTable: React.FC<KeywordPerformanceTableProps> = ({
  keywords,
  loading = false,
  onKeywordSelect,
  selectedKeywords = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('clicks');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort keywords
  const filteredKeywords = useMemo(() => {
    let filtered = [...keywords];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((kw) => kw.keyword.toLowerCase().includes(query));
    }

    // Apply category filter
    switch (filter) {
      case 'up':
        filtered = filtered.filter((kw) => kw.trend === 'up');
        break;
      case 'down':
        filtered = filtered.filter((kw) => kw.trend === 'down');
        break;
      case 'new':
        filtered = filtered.filter((kw) => kw.trend === 'new');
        break;
      case 'top10':
        filtered = filtered.filter((kw) => kw.position <= 10);
        break;
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case 'keyword':
          aVal = a.keyword;
          bVal = b.keyword;
          break;
        case 'clicks':
          aVal = a.clicks;
          bVal = b.clicks;
          break;
        case 'impressions':
          aVal = a.impressions;
          bVal = b.impressions;
          break;
        case 'ctr':
          aVal = a.ctr;
          bVal = b.ctr;
          break;
        case 'position':
          aVal = a.position;
          bVal = b.position;
          break;
        case 'positionChange':
          aVal = a.positionChange ?? 0;
          bVal = b.positionChange ?? 0;
          break;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      return sortDirection === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
    });

    return filtered;
  }, [keywords, searchQuery, filter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'position' ? 'asc' : 'desc');
    }
  };

  const formatCtr = (ctr: number): string => {
    return `${(ctr * 100).toFixed(2)}%`;
  };

  const formatPosition = (position: number): string => {
    return position.toFixed(1);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'new':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return <Minus className="h-4 w-4 text-neutral-400" />;
    }
  };

  const getPositionBadgeColor = (position: number): string => {
    if (position <= 3) return 'bg-green-100 text-green-800 border-green-200';
    if (position <= 10) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (position <= 20) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-neutral-100 text-neutral-800 border-neutral-200';
  };

  const getChangeIndicator = (change: number | null) => {
    if (change === null) return <span className="text-neutral-400">—</span>;

    const absChange = Math.abs(change);
    const isImproved = change < 0; // Lower position = better

    if (absChange < 0.5) {
      return <span className="text-neutral-500">0</span>;
    }

    return (
      <span className={`inline-flex items-center gap-0.5 ${isImproved ? 'text-green-600' : 'text-red-600'}`}>
        {isImproved ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {absChange.toFixed(1)}
      </span>
    );
  };

  const SortableHeader: React.FC<{
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }> = ({ field, children, className = '' }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 transition-colors ${className}`}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-blue-600">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const trending = { up: 0, down: 0, new: 0, stable: 0 };
    const inTop10 = keywords.filter((k) => k.position <= 10).length;
    const inTop3 = keywords.filter((k) => k.position <= 3).length;

    keywords.forEach((kw) => {
      trending[kw.trend as keyof typeof trending]++;
    });

    return { trending, inTop10, inTop3 };
  }, [keywords]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-neutral-100 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Keyword Performance
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">
              {filteredKeywords.length} of {keywords.length} keywords
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg px-3 py-2 border border-neutral-200">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-xs text-neutral-500">Top 3</span>
            </div>
            <span className="text-lg font-bold text-neutral-900">{summaryStats.inTop3}</span>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-neutral-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-neutral-500">Improving</span>
            </div>
            <span className="text-lg font-bold text-green-600">{summaryStats.trending.up}</span>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-neutral-200">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-xs text-neutral-500">Declining</span>
            </div>
            <span className="text-lg font-bold text-red-600">{summaryStats.trending.down}</span>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-neutral-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-neutral-500">New</span>
            </div>
            <span className="text-lg font-bold text-purple-600">{summaryStats.trending.new}</span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keywords..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                filter !== 'all'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="capitalize">{filter === 'all' ? 'Filter' : filter}</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showFilters && (
              <div className="absolute right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                {(['all', 'up', 'down', 'new', 'top10'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      setShowFilters(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 ${
                      filter === f ? 'bg-blue-50 text-blue-700' : 'text-neutral-700'
                    }`}
                  >
                    {f === 'all' && 'All Keywords'}
                    {f === 'up' && '📈 Trending Up'}
                    {f === 'down' && '📉 Trending Down'}
                    {f === 'new' && '✨ New Keywords'}
                    {f === 'top10' && '🎯 Top 10'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <SortableHeader field="keyword" className="w-1/3">
                Keyword
              </SortableHeader>
              <SortableHeader field="clicks">
                <MousePointerClick className="h-3.5 w-3.5 mr-1" />
                Clicks
              </SortableHeader>
              <SortableHeader field="impressions">
                <Eye className="h-3.5 w-3.5 mr-1" />
                Impressions
              </SortableHeader>
              <SortableHeader field="ctr">CTR</SortableHeader>
              <SortableHeader field="position">Position</SortableHeader>
              <SortableHeader field="positionChange">Change</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Trend
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {filteredKeywords.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
                  <p className="text-neutral-500">No keywords found</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    {searchQuery
                      ? 'Try adjusting your search'
                      : 'Connect Google Search Console to see keyword data'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredKeywords.map((kw, index) => {
                const isSelected = selectedKeywords.includes(kw.keyword);

                return (
                  <tr
                    key={`${kw.keyword}-${index}`}
                    onClick={() => onKeywordSelect?.(kw.keyword)}
                    className={`hover:bg-neutral-50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900 truncate max-w-[300px]">
                        {kw.keyword}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900 font-medium">
                      {kw.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {kw.impressions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {formatCtr(kw.ctr)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${getPositionBadgeColor(
                          kw.position
                        )}`}
                      >
                        {formatPosition(kw.position)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getChangeIndicator(kw.positionChange)}
                    </td>
                    <td className="px-4 py-3">{getTrendIcon(kw.trend)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {filteredKeywords.length > 0 && (
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
          Showing {filteredKeywords.length} keywords • Position change is vs. previous period (negative = improvement)
        </div>
      )}
    </Card>
  );
};


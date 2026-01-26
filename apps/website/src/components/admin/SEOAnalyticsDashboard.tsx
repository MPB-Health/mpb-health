import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Eye,
  Target,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  GoogleSearchConsoleConnect,
  KeywordPerformanceTable,
  KeywordRankingsChart,
  TopPagesPanel,
} from './seo';
import {
  type GoogleCredentials,
  getCredentials,
  getLastNDaysRange,
} from '../../lib/googleSearchConsoleService';
import {
  type SEOSummary,
  type KeywordWithTrend,
  type PageWithMetrics,
  type RankingHistoryPoint,
  getSEOSummary,
  getTopKeywordsWithTrend,
  getTrendingKeywords,
  getKeywordsRankingComparison,
  getTopPagesWithMetrics,
} from '../../lib/seoDataService';

type DateRangeOption = '7d' | '28d' | '90d';

export const SEOAnalyticsDashboard: React.FC = () => {
  // State
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [, setCredentials] = useState<GoogleCredentials | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('28d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [summary, setSummary] = useState<SEOSummary | null>(null);
  const [keywords, setKeywords] = useState<KeywordWithTrend[]>([]);
  const [trendingUp, setTrendingUp] = useState<KeywordWithTrend[]>([]);
  const [trendingDown, setTrendingDown] = useState<KeywordWithTrend[]>([]);
  const [pages, setPages] = useState<PageWithMetrics[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [keywordsRankingData, setKeywordsRankingData] = useState<Map<string, RankingHistoryPoint[]>>(
    new Map()
  );

  // Load credentials
  useEffect(() => {
    const loadCredentials = async () => {
      const creds = await getCredentials(selectedSite || undefined);
      setCredentials(creds);
      if (creds && !selectedSite) {
        setSelectedSite(creds.site_url);
      }
    };
    loadCredentials();
  }, [selectedSite]);

  // Load data when site or date range changes
  const loadData = useCallback(async () => {
    if (!selectedSite) return;

    setLoading(true);
    setError(null);

    try {
      const days = parseInt(dateRange);
      const currentRange = getLastNDaysRange(days);
      const previousRange = getLastNDaysRange(days * 2);
      previousRange.endDate = currentRange.startDate;

      // Load all data in parallel
      const [summaryData, keywordsData, trendingUpData, trendingDownData, pagesData] =
        await Promise.all([
          getSEOSummary(selectedSite, currentRange),
          getTopKeywordsWithTrend(selectedSite, currentRange, previousRange, 100),
          getTrendingKeywords(selectedSite, 'up', 10),
          getTrendingKeywords(selectedSite, 'down', 10),
          getTopPagesWithMetrics(selectedSite, currentRange, 50),
        ]);

      setSummary(summaryData);
      setKeywords(keywordsData);
      setTrendingUp(trendingUpData);
      setTrendingDown(trendingDownData);
      setPages(pagesData);
    } catch (err: any) {
      console.error('Error loading SEO data:', err);
      setError(err.message || 'Failed to load SEO data');
    } finally {
      setLoading(false);
    }
  }, [selectedSite, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load ranking data for selected keywords
  useEffect(() => {
    const loadRankingData = async () => {
      if (!selectedSite || selectedKeywords.length === 0) {
        setKeywordsRankingData(new Map());
        return;
      }

      const days = parseInt(dateRange);
      const data = await getKeywordsRankingComparison(selectedSite, selectedKeywords, days);
      setKeywordsRankingData(data);
    };

    loadRankingData();
  }, [selectedSite, selectedKeywords, dateRange]);

  // Handle keyword selection
  const handleKeywordSelect = (keyword: string) => {
    setSelectedKeywords((prev) => {
      if (prev.includes(keyword)) {
        return prev.filter((k) => k !== keyword);
      }
      if (prev.length >= 5) {
        // Limit to 5 keywords for chart clarity
        return [...prev.slice(1), keyword];
      }
      return [...prev, keyword];
    });
  };

  const handleRemoveKeyword = (keyword: string) => {
    setSelectedKeywords((prev) => prev.filter((k) => k !== keyword));
  };

  // Format helpers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Summary card component
  const SummaryCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: { value: number; isGood: boolean };
    color: string;
  }> = ({ title, value, icon, trend, color }) => (
    <Card className={`p-5 border-l-4 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
          {trend && (
            <div
              className={`inline-flex items-center gap-1 mt-2 text-sm ${
                trend.isGood ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isGood ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(trend.value).toFixed(1)}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('border-l-', 'bg-')}`}>
          {icon}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Search className="h-7 w-7 text-blue-600" />
            SEO Analytics
          </h2>
          <p className="text-neutral-500 mt-1">
            Track your organic search performance from Google Search Console
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date range selector */}
          <div className="flex bg-neutral-100 rounded-lg p-1">
            {(['7d', '28d', '90d'] as DateRangeOption[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  dateRange === range
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {range === '7d' && 'Last 7 days'}
                {range === '28d' && 'Last 28 days'}
                {range === '90d' && 'Last 90 days'}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection panel */}
      <GoogleSearchConsoleConnect onSiteSelect={setSelectedSite} selectedSite={selectedSite} />

      {/* Error state */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              <Button onClick={loadData} variant="ghost" size="sm" className="mt-2 text-red-600">
                Try again
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Only show data sections if a site is connected */}
      {selectedSite && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Clicks"
              value={summary ? formatNumber(summary.totalClicks) : '—'}
              icon={<MousePointerClick className="h-6 w-6 text-blue-600" />}
              color="border-l-blue-500"
            />
            <SummaryCard
              title="Total Impressions"
              value={summary ? formatNumber(summary.totalImpressions) : '—'}
              icon={<Eye className="h-6 w-6 text-purple-600" />}
              color="border-l-purple-500"
            />
            <SummaryCard
              title="Avg. CTR"
              value={summary ? formatPercent(summary.avgCtr) : '—'}
              icon={<BarChart3 className="h-6 w-6 text-amber-600" />}
              color="border-l-amber-500"
            />
            <SummaryCard
              title="Avg. Position"
              value={summary ? summary.avgPosition.toFixed(1) : '—'}
              icon={<Target className="h-6 w-6 text-emerald-600" />}
              color="border-l-emerald-500"
            />
          </div>

          {/* Keyword position summary */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Top 3 Positions</span>
              </div>
              <p className="text-3xl font-bold text-green-900">
                {summary?.keywordsInTop3 || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">keywords ranking</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Top 10 Positions</span>
              </div>
              <p className="text-3xl font-bold text-blue-900">
                {summary?.keywordsInTop10 || 0}
              </p>
              <p className="text-xs text-blue-600 mt-1">keywords ranking</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">Improving</span>
              </div>
              <p className="text-3xl font-bold text-emerald-900">
                {summary?.keywordsImproved || trendingUp.length || 0}
              </p>
              <p className="text-xs text-emerald-600 mt-1">keywords moving up</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Declining</span>
              </div>
              <p className="text-3xl font-bold text-red-900">
                {summary?.keywordsDeclined || trendingDown.length || 0}
              </p>
              <p className="text-xs text-red-600 mt-1">keywords dropping</p>
            </Card>
          </div>

          {/* Trending keywords quick view */}
          {(trendingUp.length > 0 || trendingDown.length > 0) && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Trending Up */}
              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-200 bg-gradient-to-r from-green-50 to-emerald-50">
                  <h4 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-600" />
                    Keywords Trending Up
                  </h4>
                </div>
                <div className="divide-y divide-neutral-100">
                  {trendingUp.length === 0 ? (
                    <div className="p-4 text-sm text-neutral-500 text-center">
                      No keywords improving significantly
                    </div>
                  ) : (
                    trendingUp.slice(0, 5).map((kw, i) => (
                      <div
                        key={i}
                        onClick={() => handleKeywordSelect(kw.keyword)}
                        className="px-4 py-2.5 hover:bg-green-50 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <span className="text-sm text-neutral-700 truncate max-w-[200px]">
                          {kw.keyword}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900">
                            #{kw.position.toFixed(1)}
                          </span>
                          {kw.positionChange && (
                            <span className="text-xs text-green-600 flex items-center gap-0.5">
                              <TrendingUp className="h-3 w-3" />
                              {Math.abs(kw.positionChange).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Trending Down */}
              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-neutral-200 bg-gradient-to-r from-red-50 to-rose-50">
                  <h4 className="font-semibold text-neutral-900 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Keywords Trending Down
                  </h4>
                </div>
                <div className="divide-y divide-neutral-100">
                  {trendingDown.length === 0 ? (
                    <div className="p-4 text-sm text-neutral-500 text-center">
                      No keywords declining significantly
                    </div>
                  ) : (
                    trendingDown.slice(0, 5).map((kw, i) => (
                      <div
                        key={i}
                        onClick={() => handleKeywordSelect(kw.keyword)}
                        className="px-4 py-2.5 hover:bg-red-50 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <span className="text-sm text-neutral-700 truncate max-w-[200px]">
                          {kw.keyword}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900">
                            #{kw.position.toFixed(1)}
                          </span>
                          {kw.positionChange && (
                            <span className="text-xs text-red-600 flex items-center gap-0.5">
                              <TrendingDown className="h-3 w-3" />
                              {Math.abs(kw.positionChange).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Rankings Chart */}
          <KeywordRankingsChart
            keywordsData={keywordsRankingData}
            selectedKeywords={selectedKeywords}
            onRemoveKeyword={handleRemoveKeyword}
            loading={loading}
          />

          {/* Keywords Table */}
          <KeywordPerformanceTable
            keywords={keywords}
            loading={loading}
            onKeywordSelect={handleKeywordSelect}
            selectedKeywords={selectedKeywords}
          />

          {/* Top Pages */}
          <TopPagesPanel pages={pages} loading={loading} siteUrl={selectedSite} />
        </>
      )}
    </div>
  );
};


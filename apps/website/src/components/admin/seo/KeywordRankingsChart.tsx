import React, { useState, useMemo } from 'react';
import { TrendingUp, X, Target, Calendar, ChevronDown } from 'lucide-react';
import { Card } from '../../ui/Card';
import type { RankingHistoryPoint } from '../../../lib/seoDataService';

interface KeywordRankingsChartProps {
  keywordsData: Map<string, RankingHistoryPoint[]>;
  selectedKeywords: string[];
  onRemoveKeyword?: (keyword: string) => void;
  loading?: boolean;
}

// Color palette for different keywords
const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

type TimeRange = '7d' | '14d' | '30d' | '90d';

export const KeywordRankingsChart: React.FC<KeywordRankingsChartProps> = ({
  keywordsData,
  selectedKeywords,
  onRemoveKeyword,
  loading = false,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [goalPosition, setGoalPosition] = useState<number | null>(10);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ keyword: string; date: string; position: number; x: number; y: number } | null>(null);

  // Transform data for chart
  const chartData = useMemo(() => {
    if (selectedKeywords.length === 0) return [];

    // Get all dates from all keywords
    const allDates = new Set<string>();
    selectedKeywords.forEach((keyword) => {
      const history = keywordsData.get(keyword) || [];
      history.forEach((point) => allDates.add(point.date));
    });

    // Filter by time range
    const now = new Date();
    const daysBack = parseInt(timeRange);
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const filteredDates = Array.from(allDates)
      .filter((date) => new Date(date) >= cutoffDate)
      .sort();

    // Build chart data
    return filteredDates.map((date) => {
      const dataPoint: Record<string, any> = { date };

      selectedKeywords.forEach((keyword) => {
        const history = keywordsData.get(keyword) || [];
        const point = history.find((p) => p.date === date);
        dataPoint[keyword] = point?.position || null;
      });

      return dataPoint;
    });
  }, [keywordsData, selectedKeywords, timeRange]);

  // Calculate summary for each keyword
  const keywordSummaries = useMemo(() => {
    return selectedKeywords.map((keyword, index) => {
      const history = keywordsData.get(keyword) || [];
      if (history.length === 0) {
        return { keyword, color: COLORS[index % COLORS.length], current: null, change: null };
      }

      const sortedHistory = [...history].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const current = sortedHistory[0]?.position || null;
      const oldest = sortedHistory[sortedHistory.length - 1]?.position || null;
      const change = current !== null && oldest !== null ? oldest - current : null; // Positive = improved

      return { keyword, color: COLORS[index % COLORS.length], current, change };
    });
  }, [keywordsData, selectedKeywords]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // SVG chart dimensions
  const chartWidth = 100;
  const chartHeight = 280;
  const padding = { top: 20, right: 10, bottom: 30, left: 10 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate min/max positions for Y axis (remember: lower position = better)
  const allPositions = chartData.flatMap((d) =>
    selectedKeywords.map((k) => d[k]).filter((v) => v !== null)
  ) as number[];
  const minPosition = allPositions.length > 0 ? Math.min(...allPositions) : 1;
  const maxPosition = allPositions.length > 0 ? Math.max(...allPositions) : 100;
  const yRange = Math.max(maxPosition - minPosition, 10);

  // Generate path for a keyword
  const generatePath = (keyword: string, color: string): React.ReactNode => {
    const points: { x: number; y: number; position: number; date: string }[] = [];

    chartData.forEach((data, index) => {
      const position = data[keyword];
      if (position !== null) {
        const x = (index / Math.max(chartData.length - 1, 1)) * innerWidth + padding.left;
        // Invert Y axis (lower position = higher on chart)
        const y = padding.top + ((position - minPosition) / yRange) * innerHeight;
        points.push({ x, y, position, date: data.date });
      }
    });

    if (points.length < 2) return null;

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

    return (
      <g key={keyword}>
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="white"
            stroke={color}
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredPoint({
                keyword,
                date: p.date,
                position: p.position,
                x: rect.left,
                y: rect.top,
              });
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </g>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-neutral-100 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Keyword Rankings Over Time
          </h3>

          <div className="flex items-center gap-2">
            {/* Time range selector */}
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="14d">Last 14 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Goal position */}
            <div className="relative">
              <button
                onClick={() => setShowGoalInput(!showGoalInput)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  goalPosition
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Target className="h-4 w-4" />
                Goal: #{goalPosition || '—'}
                <ChevronDown className="h-3 w-3" />
              </button>

              {showGoalInput && (
                <div className="absolute right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 p-3 min-w-[140px]">
                  <label className="text-xs text-neutral-500 block mb-1">
                    Target Position
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={goalPosition || ''}
                    onChange={(e) => setGoalPosition(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., 10"
                  />
                  <button
                    onClick={() => {
                      setGoalPosition(null);
                      setShowGoalInput(false);
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-700 mt-2"
                  >
                    Clear goal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected keywords */}
        {selectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywordSummaries.map(({ keyword, color, current, change }) => (
              <div
                key={keyword}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-neutral-200 text-sm"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-neutral-700 truncate max-w-[200px]">{keyword}</span>
                {current !== null && (
                  <span className="font-medium text-neutral-900">#{current.toFixed(1)}</span>
                )}
                {change !== null && change !== 0 && (
                  <span
                    className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {change > 0 ? '↑' : '↓'}
                    {Math.abs(change).toFixed(1)}
                  </span>
                )}
                {onRemoveKeyword && (
                  <button
                    onClick={() => onRemoveKeyword(keyword)}
                    className="p-0.5 hover:bg-neutral-100 rounded"
                  >
                    <X className="h-3 w-3 text-neutral-400 hover:text-neutral-600" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="p-6 relative">
        {selectedKeywords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
            <TrendingUp className="h-12 w-12 text-neutral-300 mb-3" />
            <p className="text-lg font-medium">No keywords selected</p>
            <p className="text-sm text-neutral-400 mt-1">
              Click on keywords in the table to track their rankings
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
            <Calendar className="h-12 w-12 text-neutral-300 mb-3" />
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm text-neutral-400 mt-1">
              Ranking data will appear after syncing with Google Search Console
            </p>
          </div>
        ) : (
          <div style={{ height: `${chartHeight}px` }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padding.top + ratio * innerHeight;
                const position = minPosition + ratio * yRange;
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="0.5"
                    />
                    <text
                      x={padding.left - 2}
                      y={y}
                      fontSize="3"
                      fill="#9ca3af"
                      textAnchor="end"
                      dominantBaseline="middle"
                    >
                      #{Math.round(position)}
                    </text>
                  </g>
                );
              })}

              {/* Top 10 reference line */}
              {minPosition <= 10 && maxPosition >= 10 && (
                <line
                  x1={padding.left}
                  y1={padding.top + ((10 - minPosition) / yRange) * innerHeight}
                  x2={chartWidth - padding.right}
                  y2={padding.top + ((10 - minPosition) / yRange) * innerHeight}
                  stroke="#F59E0B"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.5"
                />
              )}

              {/* Goal position line */}
              {goalPosition && goalPosition >= minPosition && goalPosition <= maxPosition && (
                <line
                  x1={padding.left}
                  y1={padding.top + ((goalPosition - minPosition) / yRange) * innerHeight}
                  x2={chartWidth - padding.right}
                  y2={padding.top + ((goalPosition - minPosition) / yRange) * innerHeight}
                  stroke="#10B981"
                  strokeWidth="1"
                  strokeDasharray="4,2"
                />
              )}

              {/* Keyword lines */}
              {selectedKeywords.map((keyword, index) =>
                generatePath(keyword, COLORS[index % COLORS.length])
              )}

              {/* X-axis labels */}
              {chartData.length > 0 && (
                <>
                  <text
                    x={padding.left}
                    y={chartHeight - 5}
                    fontSize="3"
                    fill="#9ca3af"
                    textAnchor="start"
                  >
                    {formatDate(chartData[0].date)}
                  </text>
                  <text
                    x={chartWidth - padding.right}
                    y={chartHeight - 5}
                    fontSize="3"
                    fill="#9ca3af"
                    textAnchor="end"
                  >
                    {formatDate(chartData[chartData.length - 1].date)}
                  </text>
                </>
              )}
            </svg>

            {/* Tooltip */}
            {hoveredPoint && (
              <div
                className="fixed z-50 bg-white border border-neutral-200 rounded-lg shadow-lg p-2 text-sm pointer-events-none"
                style={{
                  left: hoveredPoint.x + 10,
                  top: hoveredPoint.y - 40,
                }}
              >
                <div className="font-medium text-neutral-900 truncate max-w-[150px]">
                  {hoveredPoint.keyword}
                </div>
                <div className="text-neutral-600">
                  {formatDate(hoveredPoint.date)}: <span className="font-medium">#{hoveredPoint.position.toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {chartData.length > 0 && (
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
          <div className="flex items-center justify-between">
            <span>Lower position = better rankings • Data from Google Search Console</span>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1">
                <div className="w-4 h-0.5 bg-amber-500" style={{ opacity: 0.5 }} />
                Top 10
              </span>
              {goalPosition && (
                <span className="inline-flex items-center gap-1">
                  <div className="w-4 h-0.5 bg-green-500" />
                  Goal
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

import React from 'react';
import { Card } from '../../ui/Card';

interface DataPoint {
  date?: string;
  label?: string;
  value: number;
  comparisonValue?: number;
}

interface TrendChartProps {
  title: string;
  data: DataPoint[];
  comparisonData?: DataPoint[];
  height?: number;
  showComparison?: boolean;
  valueFormatter?: (value: number) => string;
  loading?: boolean;
  type?: 'line' | 'bar' | 'area';
  color?: string;
  comparisonColor?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  comparisonData,
  height = 200,
  showComparison = false,
  valueFormatter = (v) => v.toLocaleString(),
  loading = false,
  type = 'area',
  color = '#3b82f6',
  comparisonColor = '#94a3b8',
}) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-4 bg-neutral-200 rounded w-32 mb-4 animate-pulse"></div>
        <div
          className="bg-neutral-100 rounded animate-pulse"
          style={{ height: `${height}px` }}
        ></div>
      </Card>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => d.value),
    ...(comparisonData || []).map((d) => d.value),
    1
  );

  const minValue = Math.min(
    ...data.map((d) => d.value),
    ...(comparisonData || []).map((d) => d.value),
    0
  );

  const range = maxValue - minValue || 1;
  const padding = 20;
  const chartWidth = 100;
  const chartHeight = height - padding * 2;

  // Generate SVG path for line/area chart
  const generatePath = (points: DataPoint[], fill: boolean = false): string => {
    if (points.length === 0) return '';

    const xStep = chartWidth / Math.max(points.length - 1, 1);

    const pathPoints = points.map((point, index) => {
      const x = index * xStep;
      const y = chartHeight - ((point.value - minValue) / range) * chartHeight;
      return `${x},${y}`;
    });

    if (fill) {
      return `M0,${chartHeight} L${pathPoints.join(' L')} L${chartWidth},${chartHeight} Z`;
    }

    return `M${pathPoints.join(' L')}`;
  };

  // Calculate total and average
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const average = data.length > 0 ? total / data.length : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            ></div>
            <span className="text-neutral-600">Current</span>
          </div>
          {showComparison && comparisonData && (
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: comparisonColor }}
              ></div>
              <span className="text-neutral-600">Previous</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + padding}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <line
              key={percent}
              x1="0"
              y1={chartHeight - (percent / 100) * chartHeight}
              x2={chartWidth}
              y2={chartHeight - (percent / 100) * chartHeight}
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}

          {/* Comparison area/line */}
          {showComparison && comparisonData && comparisonData.length > 0 && (
            <>
              {type === 'area' && (
                <path
                  d={generatePath(comparisonData, true)}
                  fill={comparisonColor}
                  fillOpacity="0.1"
                />
              )}
              <path
                d={generatePath(comparisonData)}
                fill="none"
                stroke={comparisonColor}
                strokeWidth="2"
                strokeDasharray="4,4"
              />
            </>
          )}

          {/* Main area/line */}
          {type === 'area' && (
            <path
              d={generatePath(data, true)}
              fill={color}
              fillOpacity="0.15"
            />
          )}
          <path
            d={generatePath(data)}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, index) => {
            const xStep = chartWidth / Math.max(data.length - 1, 1);
            const x = index * xStep;
            const y = chartHeight - ((point.value - minValue) / range) * chartHeight;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="white"
                stroke={color}
                strokeWidth="2"
              />
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-neutral-400 pointer-events-none">
          <span>{valueFormatter(maxValue)}</span>
          <span>{valueFormatter((maxValue + minValue) / 2)}</span>
          <span>{valueFormatter(minValue)}</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-neutral-500">
        {data.length > 0 && (
          <>
            <span>{data[0].date || data[0].label || ''}</span>
            {data.length > 2 && (
              <span>{data[Math.floor(data.length / 2)].date || ''}</span>
            )}
            <span>{data[data.length - 1].date || data[data.length - 1].label || ''}</span>
          </>
        )}
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-neutral-100">
        <div>
          <div className="text-xs text-neutral-500">Total</div>
          <div className="text-lg font-semibold text-neutral-900">
            {valueFormatter(total)}
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Average</div>
          <div className="text-lg font-semibold text-neutral-900">
            {valueFormatter(average)}
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">Peak</div>
          <div className="text-lg font-semibold text-neutral-900">
            {valueFormatter(maxValue)}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Bar chart variant
interface BarChartProps {
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  loading?: boolean;
  valueFormatter?: (value: number) => string;
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  height = 200,
  loading = false,
  valueFormatter = (v) => v.toLocaleString(),
}) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-4 bg-neutral-200 rounded w-32 mb-4 animate-pulse"></div>
        <div
          className="bg-neutral-100 rounded animate-pulse"
          style={{ height: `${height}px` }}
        ></div>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">{title}</h3>

      <div className="space-y-3" style={{ maxHeight: `${height}px`, overflowY: 'auto' }}>
        {data.map((item, index) => {
          const widthPercent = (item.value / maxValue) * 100;
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-neutral-700 truncate max-w-[60%]">
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-neutral-900">
                  {valueFormatter(item.value)}
                </span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: item.color || '#3b82f6',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// Donut chart for proportions
interface DonutChartProps {
  title: string;
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  loading?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  data,
  size = 160,
  loading = false,
}) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-4 bg-neutral-200 rounded w-32 mb-4 animate-pulse"></div>
        <div
          className="bg-neutral-100 rounded-full animate-pulse mx-auto"
          style={{ width: size, height: size }}
        ></div>
      </Card>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2;
  const strokeWidth = 30;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  let cumulativePercent = 0;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">{title}</h3>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
            {/* Data segments */}
            {data.map((item, index) => {
              const percent = total > 0 ? (item.value / total) * 100 : 0;
              const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += percent;

              return (
                <circle
                  key={index}
                  cx={radius}
                  cy={radius}
                  r={normalizedRadius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-neutral-900">{total}</span>
            <span className="text-xs text-neutral-500">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.map((item, index) => {
            const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-neutral-700 flex-1">{item.label}</span>
                <span className="text-sm font-medium text-neutral-900">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};


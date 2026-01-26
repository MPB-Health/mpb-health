import React from 'react';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import {
  type DatePreset,
  getDateRangeWithComparison,
  formatDateRange,
} from '../../../lib/analyticsComparisonService';

interface ComparisonSelectorProps {
  selectedPreset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  compareEnabled: boolean;
  onCompareToggle: (enabled: boolean) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

const presets: Array<{ value: DatePreset; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
];

export const ComparisonSelector: React.FC<ComparisonSelectorProps> = ({
  selectedPreset,
  onPresetChange,
  compareEnabled,
  onCompareToggle,
  onRefresh,
  loading = false,
}) => {
  const dateRangeInfo = getDateRangeWithComparison(selectedPreset);

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Date Range Selector */}
      <div className="relative">
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-1">
          <Calendar className="h-4 w-4" />
          <span>Date Range</span>
        </div>
        <div className="relative">
          <select
            value={selectedPreset}
            onChange={(e) => onPresetChange(e.target.value as DatePreset)}
            className="appearance-none bg-white border border-neutral-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]"
          >
            {presets.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
        </div>
        <div className="mt-1 text-xs text-neutral-500">
          {formatDateRange(dateRangeInfo.current)}
        </div>
      </div>

      {/* Compare Toggle */}
      <div>
        <div className="text-sm text-neutral-600 mb-1">Compare</div>
        <button
          onClick={() => onCompareToggle(!compareEnabled)}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            compareEnabled
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-neutral-100 text-neutral-600 border border-neutral-300 hover:bg-neutral-200'
          }`}
        >
          {compareEnabled ? dateRangeInfo.comparisonLabel : 'Compare Period'}
        </button>
        {compareEnabled && (
          <div className="mt-1 text-xs text-neutral-500">
            {formatDateRange(dateRangeInfo.previous)}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <div>
          <div className="text-sm text-neutral-600 mb-1 opacity-0">Refresh</div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
};


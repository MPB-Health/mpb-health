import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ForecastEntryWithDeal, ForecastCategory } from '@mpbhealth/crm-core';

interface ForecastTableProps {
  entries: ForecastEntryWithDeal[];
  onCategoryChange: (entryId: string, category: ForecastCategory) => Promise<void>;
  loading?: boolean;
}

const CATEGORY_CONFIG: Record<ForecastCategory, { label: string; color: string; bgColor: string }> = {
  committed: { label: 'Committed', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  best_case: { label: 'Best Case', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
  pipeline: { label: 'Pipeline', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  omitted: { label: 'Omitted', color: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-200' },
};

const CATEGORIES: ForecastCategory[] = ['committed', 'best_case', 'pipeline', 'omitted'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatDate(date: string | null): string {
  if (!date) return '--';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface CategoryGroupProps {
  category: ForecastCategory;
  entries: ForecastEntryWithDeal[];
  onCategoryChange: (entryId: string, category: ForecastCategory) => Promise<void>;
}

function CategoryGroup({ category, entries, onCategoryChange }: CategoryGroupProps) {
  const [expanded, setExpanded] = useState(category !== 'omitted');
  const config = CATEGORY_CONFIG[category];
  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  const weightedTotal = entries.reduce((sum, e) => sum + e.weighted_amount, 0);

  return (
    <div className="border border-th-border rounded-xl overflow-hidden">
      {/* Category Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 ${config.bgColor} border-b`}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className={`font-semibold text-sm ${config.color}`}>
            {config.label}
          </span>
          <span className="text-xs text-th-text-tertiary">
            ({entries.length} deal{entries.length !== 1 ? 's' : ''})
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-th-text-secondary">
            Total: <span className="font-semibold">{formatCurrency(total)}</span>
          </span>
          <span className="text-th-text-tertiary">
            Weighted: <span className="font-medium">{formatCurrency(weightedTotal)}</span>
          </span>
        </div>
      </button>

      {/* Entries Table */}
      {expanded && entries.length > 0 && (
        <table className="w-full">
          <thead>
            <tr className="bg-surface-secondary text-left text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
              <th className="px-4 py-2">Deal</th>
              <th className="px-4 py-2">Account</th>
              <th className="px-4 py-2">Rep</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2 text-center">Prob.</th>
              <th className="px-4 py-2 text-right">Weighted</th>
              <th className="px-4 py-2">Close Date</th>
              <th className="px-4 py-2">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-th-border">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-surface-secondary transition-colors">
                <td className="px-4 py-2.5 text-sm font-medium text-th-text-primary">
                  {entry.deal?.name || 'Unknown Deal'}
                </td>
                <td className="px-4 py-2.5 text-sm text-th-text-secondary">
                  {entry.deal?.account?.name || '--'}
                </td>
                <td className="px-4 py-2.5 text-sm text-th-text-secondary">
                  {entry.user_id ? entry.user_id.substring(0, 8) + '...' : '--'}
                </td>
                <td className="px-4 py-2.5 text-sm text-th-text-primary text-right font-medium">
                  {formatCurrency(entry.amount)}
                </td>
                <td className="px-4 py-2.5 text-sm text-th-text-secondary text-center">
                  {entry.probability}%
                </td>
                <td className="px-4 py-2.5 text-sm text-th-text-secondary text-right">
                  {formatCurrency(entry.weighted_amount)}
                </td>
                <td className="px-4 py-2.5 text-sm text-th-text-secondary">
                  {formatDate(entry.close_date)}
                </td>
                <td className="px-4 py-2.5">
                  <select
                    value={entry.forecast_category}
                    onChange={(e) => onCategoryChange(entry.id, e.target.value as ForecastCategory)}
                    title="Forecast category"
                    className="text-xs px-2 py-1 bg-surface-primary border border-th-border rounded-md text-th-text-secondary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {expanded && entries.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-th-text-tertiary">
          No deals in this category
        </div>
      )}
    </div>
  );
}

export function ForecastTable({ entries, onCategoryChange, loading }: ForecastTableProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-th-border rounded-xl p-4 animate-pulse">
            <div className="h-5 bg-surface-tertiary rounded w-32 mb-3" />
            <div className="space-y-2">
              <div className="h-4 bg-surface-tertiary rounded w-full" />
              <div className="h-4 bg-surface-tertiary rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Group entries by category
  const grouped: Record<ForecastCategory, ForecastEntryWithDeal[]> = {
    committed: [],
    best_case: [],
    pipeline: [],
    omitted: [],
  };

  for (const entry of entries) {
    grouped[entry.forecast_category].push(entry);
  }

  return (
    <div className="space-y-4">
      {CATEGORIES.map((category) => (
        <CategoryGroup
          key={category}
          category={category}
          entries={grouped[category]}
          onCategoryChange={onCategoryChange}
        />
      ))}
    </div>
  );
}

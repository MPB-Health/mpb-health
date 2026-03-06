import { DollarSign, TrendingUp, Target, CheckCircle, BarChart3 } from 'lucide-react';
import type { ForecastSummary } from '@mpbhealth/crm-core';

interface ForecastKpiCardsProps {
  summary: ForecastSummary;
  loading?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

const cards = [
  {
    key: 'total_pipeline',
    label: 'Total Pipeline',
    icon: DollarSign,
    color: 'text-blue-600 bg-blue-50',
    getValue: (s: ForecastSummary) => formatCurrency(s.total_pipeline),
  },
  {
    key: 'committed',
    label: 'Committed',
    icon: Target,
    color: 'text-green-600 bg-green-50',
    getValue: (s: ForecastSummary) => formatCurrency(s.committed),
  },
  {
    key: 'best_case',
    label: 'Best Case',
    icon: TrendingUp,
    color: 'text-purple-600 bg-purple-50',
    getValue: (s: ForecastSummary) => formatCurrency(s.best_case),
  },
  {
    key: 'closed_won',
    label: 'Closed Won',
    icon: CheckCircle,
    color: 'text-emerald-600 bg-emerald-50',
    getValue: (s: ForecastSummary) => formatCurrency(s.closed_won),
  },
  {
    key: 'accuracy',
    label: 'Forecast Accuracy',
    icon: BarChart3,
    color: 'text-amber-600 bg-amber-50',
    getValue: (s: ForecastSummary) =>
      s.forecast_accuracy !== null ? `${s.forecast_accuracy}%` : '--',
  },
];

export function ForecastKpiCards({ summary, loading }: ForecastKpiCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-primary border border-th-border rounded-xl p-4 animate-pulse"
          >
            <div className="h-4 bg-surface-tertiary rounded w-20 mb-3" />
            <div className="h-7 bg-surface-tertiary rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="bg-surface-primary border border-th-border rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-th-text-tertiary uppercase tracking-wide">
                {card.label}
              </span>
            </div>
            <div className="text-xl font-bold text-th-text-primary">
              {card.getValue(summary)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

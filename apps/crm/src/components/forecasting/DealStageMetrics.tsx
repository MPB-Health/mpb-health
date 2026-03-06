import { Clock, Target, DollarSign, TrendingUp } from 'lucide-react';
import type { DealStageMetrics as DealStageMetricsType } from '@mpbhealth/crm-core';

interface DealStageMetricsProps {
  metrics: DealStageMetricsType[];
  loading?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function DealStageMetricsDisplay({ metrics, loading }: DealStageMetricsProps) {
  if (loading) {
    return (
      <div className="bg-surface-primary border border-th-border rounded-xl p-6 animate-pulse">
        <div className="h-5 bg-surface-tertiary rounded w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-surface-tertiary rounded" />
          ))}
        </div>
      </div>
    );
  }

  const activeStages = metrics.filter((m) => !m.is_won_stage && !m.is_lost_stage);
  const wonStage = metrics.find((m) => m.is_won_stage);

  return (
    <div className="bg-surface-primary border border-th-border rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-th-border">
        <h3 className="text-sm font-semibold text-th-text-primary">Stage Performance</h3>
        <p className="text-xs text-th-text-tertiary mt-0.5">Win rate, velocity, and deal size by stage</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-secondary text-left text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
              <th className="px-4 py-2.5">Stage</th>
              <th className="px-4 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Deals
                </div>
              </th>
              <th className="px-4 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Target className="w-3 h-3" />
                  Win Rate
                </div>
              </th>
              <th className="px-4 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Avg Size
                </div>
              </th>
              <th className="px-4 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  Avg Days
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-th-border">
            {activeStages.map((stage) => (
              <tr key={stage.stage_id} className="hover:bg-surface-secondary transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-th-text-primary">
                  {stage.stage_display_name || stage.stage_name}
                </td>
                <td className="px-4 py-3 text-sm text-th-text-secondary text-center">
                  {stage.total_deals}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      stage.win_rate >= 50
                        ? 'bg-green-50 text-green-700'
                        : stage.win_rate >= 25
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {stage.win_rate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-th-text-secondary text-center">
                  {formatCurrency(stage.avg_deal_size)}
                </td>
                <td className="px-4 py-3 text-sm text-th-text-secondary text-center">
                  {stage.avg_days_in_stage > 0 ? `${stage.avg_days_in_stage}d` : '--'}
                </td>
              </tr>
            ))}
            {wonStage && (
              <tr className="bg-green-50/50 hover:bg-green-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-green-700">
                  {wonStage.stage_display_name || wonStage.stage_name}
                </td>
                <td className="px-4 py-3 text-sm text-green-600 text-center">
                  {wonStage.total_deals}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    100%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-green-600 text-center">
                  {formatCurrency(wonStage.avg_deal_size)}
                </td>
                <td className="px-4 py-3 text-sm text-green-600 text-center">--</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {metrics.length === 0 && (
        <div className="px-6 py-8 text-center text-sm text-th-text-tertiary">
          No stage metrics available. Create some deals to see performance data.
        </div>
      )}
    </div>
  );
}

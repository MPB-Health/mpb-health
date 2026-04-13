import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCRMService } from '../contexts/CRMServiceContext';
import { useOrg } from '../contexts/OrgContext';
import { crmQueryKeys } from '../query/crmQueryKeys';
import { GradientHeader } from '@mpbhealth/ui';
import type { ForecastScenario } from '@mpbhealth/crm-core';

const SCENARIO_LABELS: Record<ForecastScenario, string> = {
  conservative: 'Conservative',
  moderate: 'Moderate',
  aggressive: 'Aggressive',
};

export default function Milestones() {
  const { milestoneService } = useCRMService();
  const { activeOrgId } = useOrg();
  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [forecastQuarter, setForecastQuarter] = useState(() => {
    const m = new Date().getMonth();
    return Math.min(4, Math.floor(m / 3) + 1);
  });

  const { data: progress = [], isLoading: loadingProgress } = useQuery({
    queryKey: crmQueryKeys.milestoneProgress(activeOrgId, year),
    queryFn: () => milestoneService.getMilestoneProgress(year),
    enabled: !!activeOrgId,
  });

  const { data: forecast = [], isLoading: loadingForecast } = useQuery({
    queryKey: crmQueryKeys.milestoneForecast(activeOrgId, year, forecastQuarter),
    queryFn: () => milestoneService.getForecastScenarios(year, forecastQuarter),
    enabled: !!activeOrgId,
  });

  const progressByQuarter = useMemo(() => {
    const map = new Map<number, (typeof progress)[0]>();
    for (const p of progress) map.set(p.quarter, p);
    return map;
  }, [progress]);

  const seedMutation = useMutation({
    mutationFn: () => milestoneService.seedDefaultMilestones(year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.milestones(activeOrgId, year) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.milestoneProgress(activeOrgId, year) });
      queryClient.invalidateQueries({
        queryKey: crmQueryKeys.milestoneForecast(activeOrgId, year, forecastQuarter),
      });
      toast.success('Default milestones seeded for this year');
    },
    onError: () => toast.error('Could not seed milestones'),
  });

  const yearOptions = useMemo(() => {
    const ys: number[] = [];
    for (let y = currentYear - 2; y <= currentYear + 3; y++) ys.push(y);
    return ys;
  }, [currentYear]);

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Quarterly milestones"
        subtitle="Targets vs actuals by quarter, plus revenue forecast scenarios."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-th-text-secondary flex items-center gap-2">
              Year
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-sm text-th-text-primary focus:outline-none focus:ring-1 focus:ring-th-accent-500"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="rounded-lg border border-th-border bg-surface-primary px-3 py-1.5 text-sm font-medium text-th-text-primary hover:bg-th-accent-50/50 dark:hover:bg-th-accent-900/20 disabled:opacity-60"
            >
              {seedMutation.isPending ? 'Seeding…' : 'Seed defaults'}
            </button>
          </div>
        }
      />

      {loadingProgress ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((q) => {
            const block = progressByQuarter.get(q);
            return (
              <div
                key={q}
                className="rounded-xl border border-th-border bg-surface-primary p-4 space-y-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold text-th-text-primary">Q{q}</h2>
                  <span className="text-xs text-th-text-tertiary">
                    {block?.phase_name ?? 'No milestone row — seed defaults'}
                  </span>
                </div>
                {!block ? (
                  <p className="text-sm text-th-text-tertiary py-2">
                    No data for this quarter yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {block.metrics.map((m) => {
                      const pct = Math.min(100, m.percentage);
                      const over = m.target > 0 && m.actual > m.target;
                      return (
                        <li key={m.name}>
                          <div className="flex justify-between text-xs text-th-text-secondary mb-1">
                            <span>{m.name}</span>
                            <span className="tabular-nums text-th-text-primary">
                              {m.actual.toLocaleString()} / {m.target.toLocaleString()}
                              {m.target > 0 && (
                                <span className="text-th-text-tertiary ml-1">({m.percentage}%)</span>
                              )}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-th-accent-100 dark:bg-th-accent-900/40 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                over
                                  ? 'bg-emerald-500'
                                  : 'bg-th-accent-600'
                              }`}
                              style={{ width: `${m.target > 0 ? pct : 0}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-th-border bg-surface-primary overflow-hidden">
        <div className="border-b border-th-border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-semibold text-th-text-primary">Forecast scenarios</h2>
          <label className="text-sm text-th-text-secondary flex items-center gap-2">
            Quarter
            <select
              value={forecastQuarter}
              onChange={(e) => setForecastQuarter(Number(e.target.value))}
              className="rounded-lg border border-th-border bg-surface-primary px-2 py-1.5 text-sm text-th-text-primary"
            >
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>
                  Q{q}
                </option>
              ))}
            </select>
          </label>
        </div>
        {loadingForecast ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
          </div>
        ) : forecast.length === 0 ? (
          <p className="py-8 text-center text-sm text-th-text-tertiary">
            No milestone for Q{forecastQuarter} {year}. Seed defaults or add milestone data.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-th-border bg-th-accent-50/40 dark:bg-th-accent-900/10">
                  <th className="text-left px-4 py-2 font-medium text-th-text-secondary">Scenario</th>
                  <th className="text-right px-4 py-2 font-medium text-th-text-secondary">
                    Projected leads
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-th-text-secondary">
                    Projected sales
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-th-text-secondary">
                    Avg revenue / sale
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-th-text-secondary">
                    Projected revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((row) => (
                  <tr key={row.scenario} className="border-b border-th-border last:border-0">
                    <td className="px-4 py-2 font-medium text-th-text-primary">
                      {SCENARIO_LABELS[row.scenario]}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-th-text-secondary">
                      {row.projected_leads.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-th-text-secondary">
                      {row.projected_sales.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-th-text-secondary">
                      ${row.avg_revenue_per_sale.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-th-text-primary font-medium">
                      ${row.projected_revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

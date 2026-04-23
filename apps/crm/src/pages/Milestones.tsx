import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCRMService } from '../contexts/CRMServiceContext';
import { useOrg } from '../contexts/OrgContext';
import { crmQueryKeys } from '../query/crmQueryKeys';
import { GradientHeader } from '@mpbhealth/ui';
import type {
  ForecastScenario,
  MilestoneInput,
  QuarterlyMilestone,
} from '@mpbhealth/crm-core';

const SCENARIO_LABELS: Record<ForecastScenario, string> = {
  conservative: 'Conservative',
  moderate: 'Moderate',
  aggressive: 'Aggressive',
};

// Sales Plan 2026 defaults. Users can override via the Forecast controls;
// state is UI-only (not persisted) so each rep can stress-test scenarios.
const DEFAULT_AVG_REVENUE: Record<ForecastScenario, number> = {
  conservative: 2000,
  moderate: 3500,
  aggressive: 5000,
};

export default function Milestones() {
  const { milestoneService } = useCRMService();
  const { activeOrgId, can } = useOrg();
  const canManageTargets = can('targets.manage');
  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [forecastQuarter, setForecastQuarter] = useState(() => {
    const m = new Date().getMonth();
    return Math.min(4, Math.floor(m / 3) + 1);
  });
  const [avgRevenue, setAvgRevenue] = useState<Record<ForecastScenario, number>>(DEFAULT_AVG_REVENUE);
  const [editingQuarter, setEditingQuarter] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<MilestoneInput | null>(null);

  const { data: progress = [], isLoading: loadingProgress } = useQuery({
    queryKey: crmQueryKeys.milestoneProgress(activeOrgId, year),
    queryFn: () => milestoneService.getMilestoneProgress(year),
    enabled: !!activeOrgId,
  });

  const { data: forecast = [], isLoading: loadingForecast } = useQuery({
    queryKey: [
      ...crmQueryKeys.milestoneForecast(activeOrgId, year, forecastQuarter),
      avgRevenue.conservative,
      avgRevenue.moderate,
      avgRevenue.aggressive,
    ],
    queryFn: () => milestoneService.getForecastScenarios(year, forecastQuarter, avgRevenue),
    enabled: !!activeOrgId,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: crmQueryKeys.milestones(activeOrgId, year),
    queryFn: () => milestoneService.getMilestones(year),
    enabled: !!activeOrgId,
  });

  const milestonesByQuarter = useMemo(() => {
    const map = new Map<number, QuarterlyMilestone>();
    for (const m of milestones) map.set(m.quarter, m);
    return map;
  }, [milestones]);

  const saveMilestoneMutation = useMutation({
    mutationFn: (input: MilestoneInput) => milestoneService.upsertMilestone(input),
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.milestones(activeOrgId, year) });
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.milestoneProgress(activeOrgId, year) });
      queryClient.invalidateQueries({
        queryKey: crmQueryKeys.milestoneForecast(activeOrgId, year, forecastQuarter),
      });
      if (row) {
        toast.success(`Q${row.quarter} milestone saved`);
        setEditingQuarter(null);
        setEditDraft(null);
      } else {
        toast.error('Could not save milestone');
      }
    },
    onError: () => toast.error('Could not save milestone'),
  });

  const beginEdit = (quarter: number) => {
    const existing = milestonesByQuarter.get(quarter);
    setEditingQuarter(quarter);
    setEditDraft({
      year,
      quarter,
      phase_name: existing?.phase_name ?? `Q${quarter} phase`,
      lead_target: existing?.lead_target ?? 0,
      sales_target: existing?.sales_target ?? 0,
      revenue_target: existing?.revenue_target ?? 0,
      linkedin_follower_target: existing?.linkedin_follower_target ?? 0,
      referral_partner_target: existing?.referral_partner_target ?? 0,
      community_event_target: existing?.community_event_target ?? 0,
    });
  };

  const cancelEdit = () => {
    setEditingQuarter(null);
    setEditDraft(null);
  };

  const commitEdit = () => {
    if (!editDraft) return;
    saveMilestoneMutation.mutate(editDraft);
  };

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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-th-text-tertiary">
                      {block?.phase_name ?? 'No milestone row — seed defaults'}
                    </span>
                    {canManageTargets && editingQuarter !== q && (
                      <button
                        type="button"
                        onClick={() => beginEdit(q)}
                        className="rounded-md border border-th-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-th-text-secondary hover:bg-surface-secondary"
                      >
                        {block ? 'Edit' : 'Add'}
                      </button>
                    )}
                  </div>
                </div>
                {editingQuarter === q && editDraft ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="col-span-2 block">
                      <span className="text-th-text-tertiary">Phase</span>
                      <input
                        type="text"
                        value={editDraft.phase_name ?? ''}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, phase_name: e.target.value } : d))}
                        className="mt-0.5 w-full rounded-md border border-th-border bg-surface-primary px-2 py-1"
                      />
                    </label>
                    {[
                      { key: 'lead_target' as const, label: 'Lead target' },
                      { key: 'sales_target' as const, label: 'Sales target' },
                      { key: 'revenue_target' as const, label: 'Revenue target $' },
                      { key: 'linkedin_follower_target' as const, label: 'LinkedIn followers' },
                      { key: 'referral_partner_target' as const, label: 'Referral partners' },
                      { key: 'community_event_target' as const, label: 'Community events' },
                    ].map((f) => (
                      <label key={f.key} className="block">
                        <span className="text-th-text-tertiary">{f.label}</span>
                        <input
                          type="number"
                          min={0}
                          value={Number(editDraft[f.key] ?? 0)}
                          onChange={(e) =>
                            setEditDraft((d) => (d ? { ...d, [f.key]: Number(e.target.value) } : d))
                          }
                          className="mt-0.5 w-full rounded-md border border-th-border bg-surface-primary px-2 py-1 tabular-nums"
                        />
                      </label>
                    ))}
                    <div className="col-span-2 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-md border border-th-border px-3 py-1 text-th-text-secondary hover:bg-surface-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={commitEdit}
                        disabled={saveMilestoneMutation.isPending}
                        className="rounded-md bg-th-accent-600 px-3 py-1 font-medium text-white hover:bg-th-accent-700 disabled:opacity-60"
                      >
                        {saveMilestoneMutation.isPending ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : !block ? (
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

        {/* Sales Plan 2026: average revenue per sale drives the projected
            revenue column. The defaults (Conservative 2,000 / Moderate 3,500
            / Aggressive 5,000) match the deck — reps can stress-test other
            assumptions live without touching the database. */}
        <div className="border-b border-th-border px-4 py-3 grid gap-3 sm:grid-cols-3 bg-surface-secondary/50">
          {(Object.keys(DEFAULT_AVG_REVENUE) as ForecastScenario[]).map((scenario) => (
            <label key={scenario} className="block">
              <span className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                Avg revenue / sale · {SCENARIO_LABELS[scenario]}
              </span>
              <div className="mt-1 flex rounded-lg border border-th-border bg-surface-primary overflow-hidden">
                <span className="px-2 py-1.5 text-sm text-th-text-tertiary bg-surface-secondary">$</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={avgRevenue[scenario]}
                  onChange={(e) =>
                    setAvgRevenue((prev) => ({
                      ...prev,
                      [scenario]: Number(e.target.value) || 0,
                    }))
                  }
                  className="flex-1 min-w-0 px-2 py-1.5 text-sm text-th-text-primary bg-transparent tabular-nums focus:outline-none"
                />
              </div>
            </label>
          ))}
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="button"
              onClick={() => setAvgRevenue(DEFAULT_AVG_REVENUE)}
              className="text-xs text-th-text-tertiary hover:text-th-text-secondary underline"
            >
              Reset to Sales Plan 2026 defaults
            </button>
          </div>
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

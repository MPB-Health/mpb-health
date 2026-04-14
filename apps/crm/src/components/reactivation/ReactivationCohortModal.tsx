import { useState } from 'react';
import { Modal } from '../Modal';
import {
  Users, BarChart3, Target, TrendingUp, Filter, ChevronDown,
  ChevronRight, Sparkles, DollarSign, Clock, ArrowRight,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface Cohort {
  id: string;
  dimension: string;
  value: string;
  totalLeads: number;
  staleLeads: number;
  winBackRate: number;
  avgDaysToReengage: number;
  avgRevenue: number;
  bestChannel: string;
}

interface ReactivationCohortModalProps {
  open: boolean;
  onClose: () => void;
}

type Dimension = 'source' | 'plan_type' | 'age_group' | 'region' | 'agent';

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: 'source', label: 'Lead Source' },
  { value: 'plan_type', label: 'Plan Type' },
  { value: 'age_group', label: 'Age Group' },
  { value: 'region', label: 'Region' },
  { value: 'agent', label: 'Assigned Agent' },
];

const MOCK_COHORTS: Record<Dimension, Cohort[]> = {
  source: [
    { id: '1', dimension: 'source', value: 'Web Form', totalLeads: 320, staleLeads: 85, winBackRate: 12.4, avgDaysToReengage: 9.2, avgRevenue: 1800, bestChannel: 'Email' },
    { id: '2', dimension: 'source', value: 'Referral', totalLeads: 145, staleLeads: 28, winBackRate: 24.1, avgDaysToReengage: 5.8, avgRevenue: 3200, bestChannel: 'Phone' },
    { id: '3', dimension: 'source', value: 'Community Event', totalLeads: 98, staleLeads: 42, winBackRate: 18.6, avgDaysToReengage: 7.1, avgRevenue: 2100, bestChannel: 'Phone' },
    { id: '4', dimension: 'source', value: 'Quick Rate', totalLeads: 527, staleLeads: 156, winBackRate: 8.3, avgDaysToReengage: 12.5, avgRevenue: 1200, bestChannel: 'Email' },
    { id: '5', dimension: 'source', value: 'Social Media', totalLeads: 78, staleLeads: 35, winBackRate: 5.7, avgDaysToReengage: 15.2, avgRevenue: 900, bestChannel: 'SMS' },
  ],
  plan_type: [
    { id: '6', dimension: 'plan_type', value: 'Medicare Advantage', totalLeads: 280, staleLeads: 95, winBackRate: 16.8, avgDaysToReengage: 8.1, avgRevenue: 0, bestChannel: 'Phone' },
    { id: '7', dimension: 'plan_type', value: 'Medicare Supplement', totalLeads: 120, staleLeads: 38, winBackRate: 21.1, avgDaysToReengage: 6.5, avgRevenue: 1740, bestChannel: 'Phone' },
    { id: '8', dimension: 'plan_type', value: 'ACA', totalLeads: 340, staleLeads: 128, winBackRate: 9.4, avgDaysToReengage: 11.3, avgRevenue: 3200, bestChannel: 'Email' },
    { id: '9', dimension: 'plan_type', value: 'Dental/Vision', totalLeads: 85, staleLeads: 24, winBackRate: 33.3, avgDaysToReengage: 3.8, avgRevenue: 420, bestChannel: 'Email' },
  ],
  age_group: [
    { id: '10', dimension: 'age_group', value: 'Under 26', totalLeads: 65, staleLeads: 32, winBackRate: 6.3, avgDaysToReengage: 14.1, avgRevenue: 2400, bestChannel: 'SMS' },
    { id: '11', dimension: 'age_group', value: '26-45', totalLeads: 180, staleLeads: 78, winBackRate: 10.3, avgDaysToReengage: 10.5, avgRevenue: 3600, bestChannel: 'Email' },
    { id: '12', dimension: 'age_group', value: '46-64', totalLeads: 220, staleLeads: 65, winBackRate: 15.4, avgDaysToReengage: 8.2, avgRevenue: 4200, bestChannel: 'Phone' },
    { id: '13', dimension: 'age_group', value: '65+', totalLeads: 410, staleLeads: 120, winBackRate: 19.2, avgDaysToReengage: 6.8, avgRevenue: 1200, bestChannel: 'Phone' },
  ],
  region: [
    { id: '14', dimension: 'region', value: 'Orlando', totalLeads: 340, staleLeads: 98, winBackRate: 15.3, avgDaysToReengage: 7.9, avgRevenue: 2100, bestChannel: 'Phone' },
    { id: '15', dimension: 'region', value: 'Tampa', totalLeads: 220, staleLeads: 72, winBackRate: 12.5, avgDaysToReengage: 9.1, avgRevenue: 1800, bestChannel: 'Email' },
    { id: '16', dimension: 'region', value: 'Miami', totalLeads: 180, staleLeads: 65, winBackRate: 10.8, avgDaysToReengage: 10.2, avgRevenue: 2400, bestChannel: 'Phone' },
    { id: '17', dimension: 'region', value: 'Jacksonville', totalLeads: 95, staleLeads: 28, winBackRate: 17.9, avgDaysToReengage: 6.5, avgRevenue: 1500, bestChannel: 'Phone' },
  ],
  agent: [
    { id: '18', dimension: 'agent', value: 'Sarah K.', totalLeads: 280, staleLeads: 52, winBackRate: 21.2, avgDaysToReengage: 5.5, avgRevenue: 2800, bestChannel: 'Phone' },
    { id: '19', dimension: 'agent', value: 'Mike R.', totalLeads: 245, staleLeads: 78, winBackRate: 11.5, avgDaysToReengage: 9.8, avgRevenue: 1900, bestChannel: 'Email' },
    { id: '20', dimension: 'agent', value: 'Lisa P.', totalLeads: 190, staleLeads: 45, winBackRate: 17.8, avgDaysToReengage: 7.2, avgRevenue: 2200, bestChannel: 'Phone' },
    { id: '21', dimension: 'agent', value: 'John D.', totalLeads: 160, staleLeads: 68, winBackRate: 8.8, avgDaysToReengage: 12.1, avgRevenue: 1400, bestChannel: 'Email' },
  ],
};

export function ReactivationCohortModal({ open, onClose }: ReactivationCohortModalProps) {
  const [dimension, setDimension] = useState<Dimension>('source');
  const [sortBy, setSortBy] = useState<'winBackRate' | 'staleLeads' | 'avgRevenue'>('winBackRate');

  const cohorts = [...(MOCK_COHORTS[dimension] || [])].sort((a, b) => {
    return (b[sortBy] as number) - (a[sortBy] as number);
  });

  const bestCohort = cohorts[0];
  const maxWinBack = Math.max(...cohorts.map((c) => c.winBackRate));

  return (
    <Modal open={open} onClose={onClose} title="Reactivation Cohort Analysis" size="2xl">
      <div className="space-y-4">
        {/* Dimension selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-th-text-tertiary">Analyze by:</span>
          {DIMENSIONS.map((d) => (
            <button key={d.value} onClick={() => setDimension(d.value)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              dimension === d.value ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary hover:text-th-text-secondary'
            )}>{d.label}</button>
          ))}
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-th-text-tertiary">Sort:</span>
          {[
            { key: 'winBackRate' as const, label: 'Win-Back Rate' },
            { key: 'staleLeads' as const, label: 'Lead Count' },
            { key: 'avgRevenue' as const, label: 'Avg Revenue' },
          ].map((s) => (
            <button key={s.key} onClick={() => setSortBy(s.key)} className={cn(
              'px-2 py-1 rounded-lg text-[10px] font-medium',
              sortBy === s.key ? 'bg-th-accent-500/10 text-th-accent-500' : 'text-th-text-tertiary'
            )}>{s.label}</button>
          ))}
        </div>

        {/* Cohort table */}
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {cohorts.map((cohort, idx) => (
            <div key={cohort.id} className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
              idx === 0 ? 'border-green-500/30 bg-green-500/5' : 'border-th-border/50'
            )}>
              <div className="w-8 text-center">
                <span className={cn('text-xs font-bold', idx === 0 ? 'text-green-500' : 'text-th-text-tertiary')}>#{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-th-text-primary">{cohort.value}</p>
                <p className="text-[10px] text-th-text-tertiary">{cohort.staleLeads} stale of {cohort.totalLeads} total · Best: {cohort.bestChannel}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <p className={cn('text-sm font-bold tabular-nums', cohort.winBackRate >= 15 ? 'text-green-500' : cohort.winBackRate >= 10 ? 'text-amber-500' : 'text-red-500')}>
                    {cohort.winBackRate}%
                  </p>
                  <p className="text-[9px] text-th-text-tertiary">win-back</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-th-text-primary tabular-nums">{cohort.avgDaysToReengage}d</p>
                  <p className="text-[9px] text-th-text-tertiary">avg days</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-th-text-primary tabular-nums">${cohort.avgRevenue.toLocaleString()}</p>
                  <p className="text-[9px] text-th-text-tertiary">avg rev</p>
                </div>
                <div className="w-16">
                  <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                    <div className={cn('h-full rounded-full', cohort.winBackRate >= 15 ? 'bg-green-500' : cohort.winBackRate >= 10 ? 'bg-amber-500' : 'bg-red-500')}
                      style={{ width: `${(cohort.winBackRate / maxWinBack) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI insight */}
        {bestCohort && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Cohort Insights</span>
            </div>
            <div className="space-y-1 text-xs text-th-text-secondary">
              <p><strong>{bestCohort.value}</strong> has the highest win-back rate at {bestCohort.winBackRate}%. Prioritize this cohort.</p>
              <p>Best channel for top cohort: <strong>{bestCohort.bestChannel}</strong> with {bestCohort.avgDaysToReengage}d avg re-engagement time.</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}

import { Shield, TrendingUp, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../contexts/OrgContext';
import { supabase } from '../../../lib/supabase';
import { PLAN_TYPE_LABELS } from '@mpbhealth/crm-core';
import type { BaseWidgetProps } from '../types';

interface PlanTypeStat {
  plan_type: string;
  total_count: number;
  new_today: number;
  new_this_week: number;
  new_this_month: number;
}

const PLAN_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  healthshare: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    bar: 'bg-emerald-500',
  },
  traditional: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    bar: 'bg-blue-500',
  },
  unspecified: {
    bg: 'bg-gray-50 dark:bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    bar: 'bg-gray-400',
  },
};

export default function PlanTypeWidget({ size }: BaseWidgetProps) {
  const { activeOrgId } = useOrg();

  const { data: stats = [], isPending } = useQuery({
    queryKey: ['widget', 'planTypeStats', activeOrgId],
    queryFn: async () => {
      const { data } = await supabase.rpc('crm_plan_type_stats', { p_org_id: activeOrgId });
      return (data || []) as PlanTypeStat[];
    },
    enabled: !!activeOrgId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  if (isPending) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-th-text-tertiary" />
      </div>
    );
  }

  const totalAll = stats.reduce((sum, s) => sum + s.total_count, 0);

  if (size === 'sm') {
    return (
      <div className="p-4 space-y-3">
        {stats.slice(0, 3).map((stat) => {
          const label = PLAN_TYPE_LABELS[stat.plan_type as keyof typeof PLAN_TYPE_LABELS] || stat.plan_type;
          const colors = PLAN_COLORS[stat.plan_type] || PLAN_COLORS.unspecified;
          return (
            <div key={stat.plan_type} className="flex items-center justify-between">
              <span className={`text-sm font-medium ${colors.text}`}>{String(label)}</span>
              <span className="text-sm font-bold">{stat.total_count}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {stats.map((stat) => {
        const label = PLAN_TYPE_LABELS[stat.plan_type as keyof typeof PLAN_TYPE_LABELS] || stat.plan_type;
        const colors = PLAN_COLORS[stat.plan_type] || PLAN_COLORS.unspecified;
        const pct = totalAll > 0 ? (stat.total_count / totalAll) * 100 : 0;

        return (
          <div key={stat.plan_type} className={`rounded-xl p-3 ${colors.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className={`w-4 h-4 ${colors.text}`} />
                <span className={`text-sm font-semibold ${colors.text}`}>{String(label)}</span>
              </div>
              <span className="text-lg font-bold text-th-text-primary">{stat.total_count.toLocaleString()}</span>
            </div>
            <div className="h-1.5 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center gap-4 text-xs text-th-text-tertiary">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stat.new_today} today
              </span>
              <span>{stat.new_this_week} this week</span>
              <span>{stat.new_this_month} this month</span>
            </div>
          </div>
        );
      })}
      {stats.length === 0 && (
        <p className="text-sm text-th-text-tertiary text-center py-4">No plan type data available</p>
      )}
    </div>
  );
}

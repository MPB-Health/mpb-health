import { useMemo } from 'react';
import { Users, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../contexts/OrgContext';
import { supabase } from '../../../lib/supabase';
import type { BaseWidgetProps } from '../types';

interface AdvisorStat {
  advisor_id: string;
  advisor_email: string;
  advisor_name: string;
  total_leads: number;
  new_leads_this_month: number;
  converted_leads: number;
  open_tasks: number;
  overdue_tasks: number;
  activities_this_month: number;
}

export default function AdvisorWidget({ config, size }: BaseWidgetProps) {
  const { activeOrgId } = useOrg();
  const maxAdvisors = (config.maxAdvisors as number) || 8;

  const { data: allAdvisors = [], isPending } = useQuery({
    queryKey: ['widget', 'advisorPerformance', activeOrgId],
    queryFn: async () => {
      const { data } = await supabase.rpc('crm_advisor_performance', { p_org_id: activeOrgId });
      return (data || []) as unknown as AdvisorStat[];
    },
    enabled: !!activeOrgId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const advisors = useMemo(
    () => allAdvisors.slice(0, maxAdvisors),
    [allAdvisors, maxAdvisors],
  );

  if (isPending) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-th-text-tertiary" />
      </div>
    );
  }

  if (advisors.length === 0) {
    return (
      <div className="p-4 text-center py-8">
        <Users className="w-8 h-8 text-th-text-tertiary mx-auto mb-2 opacity-40" />
        <p className="text-sm text-th-text-tertiary">No advisor data available</p>
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <div className="p-4 space-y-3">
        {advisors.slice(0, 5).map((a) => (
          <div key={a.advisor_id} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-th-accent-100 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-th-accent-700 font-semibold text-xs">
                  {a.advisor_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-th-text-primary truncate">{a.advisor_name}</span>
            </div>
            <span className="text-sm font-bold text-th-text-primary">{a.total_leads}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-3">
        {advisors.map((a) => {
          const conversionRate = a.total_leads > 0 ? ((a.converted_leads / a.total_leads) * 100).toFixed(0) : '0';
          return (
            <div
              key={a.advisor_id}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary/50 hover:bg-surface-secondary transition-colors"
            >
              <div className="w-9 h-9 bg-th-accent-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-th-accent-700 font-semibold text-sm">
                  {a.advisor_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-th-text-primary truncate">{a.advisor_name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-th-text-tertiary">
                    <Users className="w-3 h-3" />
                    {a.total_leads} leads
                  </span>
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <TrendingUp className="w-3 h-3" />
                    {conversionRate}%
                  </span>
                  {a.overdue_tasks > 0 && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <AlertTriangle className="w-3 h-3" />
                      {a.overdue_tasks} overdue
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-th-text-tertiary">New</p>
                    <p className="text-sm font-bold text-th-text-primary">{a.new_leads_this_month}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-th-text-tertiary">Tasks</p>
                    <p className={`text-sm font-bold ${a.overdue_tasks > 0 ? 'text-red-500' : 'text-th-text-primary'}`}>
                      {a.open_tasks}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-th-text-tertiary">Acts</p>
                    <p className="text-sm font-bold text-th-text-primary">{a.activities_this_month}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

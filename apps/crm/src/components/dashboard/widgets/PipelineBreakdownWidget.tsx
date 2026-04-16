import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useOrg } from '../../../contexts/OrgContext';
import { supabase } from '../../../lib/supabase';
import type { BaseWidgetProps } from '../types';

interface PipelineRow {
  stage_name: string;
  stage_display_name: string;
  stage_color: string;
  total_in_stage: number;
  healthshare_count: number;
  traditional_count: number;
  unspecified_count: number;
}

export default function PipelineBreakdownWidget({ size }: BaseWidgetProps) {
  const { activeOrgId } = useOrg();

  const { data: stages = [], isPending } = useQuery({
    queryKey: ['widget', 'pipelineBreakdown', activeOrgId],
    queryFn: async () => {
      const { data } = await supabase.rpc('crm_pipeline_breakdown', { p_org_id: activeOrgId });
      return (data || []) as unknown as PipelineRow[];
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

  const maxCount = Math.max(...stages.map((s) => s.total_in_stage), 1);

  return (
    <div className="p-4">
      <div className="space-y-3">
        {stages.map((stage) => {
          const barWidth = (stage.total_in_stage / maxCount) * 100;
          const hsWidth = stage.total_in_stage > 0 ? (stage.healthshare_count / stage.total_in_stage) * barWidth : 0;
          const tradWidth = stage.total_in_stage > 0 ? (stage.traditional_count / stage.total_in_stage) * barWidth : 0;
          const unspecWidth = barWidth - hsWidth - tradWidth;

          return (
            <div key={stage.stage_name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.stage_color }} />
                  <span className="text-sm font-medium truncate">{stage.stage_display_name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-th-text-tertiary">
                  <span className="font-semibold text-th-text-primary">{stage.total_in_stage}</span>
                  {size !== 'sm' && stage.total_in_stage > 0 && (
                    <>
                      <span className="text-emerald-600">{stage.healthshare_count} HS</span>
                      <span className="text-blue-600">{stage.traditional_count} TI</span>
                    </>
                  )}
                </div>
              </div>
              <div className="h-2.5 bg-surface-tertiary rounded-full overflow-hidden flex">
                {hsWidth > 0 && (
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${hsWidth}%` }}
                    title={`HealthShare: ${stage.healthshare_count}`}
                  />
                )}
                {tradWidth > 0 && (
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${tradWidth}%` }}
                    title={`Traditional: ${stage.traditional_count}`}
                  />
                )}
                {unspecWidth > 0 && (
                  <div
                    className="h-full bg-gray-300 dark:bg-gray-600 transition-all duration-500"
                    style={{ width: `${unspecWidth}%` }}
                    title={`Unspecified: ${stage.unspecified_count}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {size !== 'sm' && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-th-border">
          <div className="flex items-center gap-4 text-xs text-th-text-tertiary">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> HealthShare</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Traditional</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> Unspecified</span>
          </div>
          <Link to="/pipeline" className="flex items-center gap-1 text-xs text-th-accent-600 hover:text-th-accent-700">
            View pipeline <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

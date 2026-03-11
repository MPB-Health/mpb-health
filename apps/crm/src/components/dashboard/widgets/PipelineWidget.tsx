// ============================================================================
// Pipeline Widget
// Shows lead distribution across pipeline stages
// ============================================================================

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCRM } from '../../../contexts/CRMContext';
import type { BaseWidgetProps } from '../types';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Pipeline Widget Component
// ============================================================================

export default function PipelineWidget({ config, size }: BaseWidgetProps) {
  const { pipelineStages, dashboardStats } = useCRM();

  const maxStages = (config.maxStages as number) || (size === 'sm' ? 3 : 5);
  const showValues = config.showValues !== false;

  const leadsByStage = ((dashboardStats as unknown) as Record<string, unknown>)?.leads_by_stage as Record<string, number> || {};
  const totalLeads = Object.values(leadsByStage).reduce((sum, count) => sum + count, 0);

  const displayStages = pipelineStages
    .filter((stage) => stage.is_active)
    .slice(0, maxStages);

  if (displayStages.length === 0) {
    return (
      <div className="p-4 text-center text-th-text-secondary">
        <p>No pipeline stages configured</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-3">
        {displayStages.map((stage) => {
          const count = leadsByStage[stage.name] || 0;
          const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;

          return (
            <div key={stage.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm font-medium truncate">
                    {stage.display_name}
                  </span>
                </div>
                {showValues && (
                  <span className="text-sm text-th-text-secondary">
                    {count}
                  </span>
                )}
              </div>
              <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: stage.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {pipelineStages.length > maxStages && (
        <Link
          to="/pipeline"
          className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-th-border text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          View all stages
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

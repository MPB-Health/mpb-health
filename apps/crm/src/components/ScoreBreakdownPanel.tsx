import { useState, useEffect } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import type { LeadScoreBreakdown } from '@mpbhealth/crm-core';

interface Props {
  leadId: string;
}

export function ScoreBreakdownPanel({ leadId }: Props) {
  const { scoringService } = useCRM();
  const [breakdown, setBreakdown] = useState<LeadScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await scoringService.getScoreBreakdown(leadId);
      setBreakdown(data);
      setLoading(false);
    };
    load();
  }, [scoringService, leadId]);

  if (loading) {
    return (
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
        </div>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-th-text-tertiary" />
          <h3 className="text-sm font-semibold text-th-text-primary">Lead Score</h3>
        </div>
        <p className="text-sm text-th-text-tertiary">No score data available.</p>
      </div>
    );
  }

  const maxPoints = Math.max(...breakdown.factors.map((f) => Math.abs(f.points)), 1);

  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-th-text-tertiary" />
          <h3 className="text-sm font-semibold text-th-text-primary">Lead Score</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-th-accent-600">{breakdown.total_score}</span>
          <span className="text-xs text-th-text-tertiary">/ 100</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-2 bg-surface-tertiary rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(breakdown.total_score, 100)}%`,
            backgroundColor: breakdown.total_score >= 70 ? '#10B981' : breakdown.total_score >= 40 ? '#F59E0B' : '#EF4444',
          }}
        />
      </div>

      {/* Factor breakdown */}
      {breakdown.factors.length > 0 && (
        <div className="space-y-2">
          {breakdown.factors.map((factor, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-th-text-secondary w-28 truncate">{factor.factor}</span>
              <div className="flex-1 h-4 bg-surface-tertiary rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all ${factor.positive ? 'bg-green-500' : 'bg-red-400'}`}
                  style={{ width: `${(Math.abs(factor.points) / maxPoints) * 100}%` }}
                />
              </div>
              <span className={`text-xs font-medium w-8 text-right ${factor.positive ? 'text-green-600' : 'text-red-500'}`}>
                {factor.positive ? '+' : '-'}{Math.abs(factor.points)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

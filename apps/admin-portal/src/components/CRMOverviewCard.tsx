import { useState, useEffect } from 'react';
import { Users, CheckSquare, TrendingUp, ArrowUpRight } from 'lucide-react';
import { crmBridgeService, type CRMSummary } from '@mpbhealth/admin-core';

export default function CRMOverviewCard() {
  const [summary, setSummary] = useState<CRMSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await crmBridgeService.getCRMSummary();
        setSummary(data);
      } catch (err) {
        console.error('Failed to load CRM summary:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <h2 className="font-semibold text-th-text-primary mb-6">CRM Overview</h2>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const totalInPipeline = summary.leads_by_stage.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="bg-surface-primary rounded-xl border border-th-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-th-text-primary">CRM Overview</h2>
        <a
          href={`${window.location.protocol}//${window.location.hostname}:5174`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-th-accent-600 hover:text-th-accent-700 flex items-center gap-1"
        >
          Open CRM
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto mb-2">
            <Users className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xl font-bold text-th-text-primary">{summary.total_leads}</p>
          <p className="text-xs text-th-text-tertiary">Total Leads</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-lg mx-auto mb-2">
            <TrendingUp className="w-4.5 h-4.5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-xl font-bold text-th-text-primary">{summary.new_today}</p>
          <p className="text-xs text-th-text-tertiary">New Today</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg mx-auto mb-2">
            <TrendingUp className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xl font-bold text-th-text-primary">{summary.conversion_rate}%</p>
          <p className="text-xs text-th-text-tertiary">Conversion</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-lg mx-auto mb-2">
            <CheckSquare className="w-4.5 h-4.5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-xl font-bold text-th-text-primary">{summary.pending_tasks}</p>
          <p className="text-xs text-th-text-tertiary">Pending Tasks</p>
        </div>
      </div>

      {/* Pipeline stacked bar */}
      {summary.leads_by_stage.length > 0 && totalInPipeline > 0 && (
        <div>
          <p className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-2">
            Pipeline Breakdown
          </p>
          <div className="flex h-6 rounded-lg overflow-hidden">
            {summary.leads_by_stage
              .filter((s) => s.count > 0)
              .map((stage) => (
                <div
                  key={stage.stage}
                  className="relative group"
                  style={{
                    width: `${(stage.count / totalInPipeline) * 100}%`,
                    backgroundColor: stage.color,
                    minWidth: '2px',
                  }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                    <div className="bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-800 text-xs rounded px-2 py-1 whitespace-nowrap">
                      {stage.stage}: {stage.count}
                    </div>
                  </div>
                </div>
              ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {summary.leads_by_stage
              .filter((s) => s.count > 0)
              .map((stage) => (
                <div key={stage.stage} className="flex items-center gap-1.5 text-xs text-th-text-secondary">
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  {stage.stage} ({stage.count})
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

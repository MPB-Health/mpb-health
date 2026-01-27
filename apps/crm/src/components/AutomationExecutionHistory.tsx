import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useCRM } from '../contexts/CRMContext';
import type { AutomationExecutionLog } from '@mpbhealth/crm-core';

interface Props {
  ruleId?: string;
}

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  skipped: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export function AutomationExecutionHistory({ ruleId }: Props) {
  const { automationService } = useCRM();
  const [logs, setLogs] = useState<AutomationExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await automationService.getExecutionHistory(ruleId, 50);
      setLogs(data);
      setLoading(false);
    };
    load();
  }, [automationService, ruleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-th-text-tertiary text-center py-6">No executions yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-th-border-subtle text-left text-th-text-tertiary">
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Rule</th>
            <th className="py-2 pr-4 font-medium">Trigger</th>
            <th className="py-2 pr-4 font-medium">Action</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 font-medium">Message</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-th-border-subtle">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="py-2 pr-4 whitespace-nowrap text-th-text-secondary">
                {format(new Date(log.executed_at), 'MMM d, h:mm a')}
              </td>
              <td className="py-2 pr-4 font-medium text-th-text-primary">{log.rule_name}</td>
              <td className="py-2 pr-4 text-th-text-secondary">{log.trigger_type.replace(/_/g, ' ')}</td>
              <td className="py-2 pr-4 text-th-text-secondary">{log.action_type.replace(/_/g, ' ')}</td>
              <td className="py-2 pr-4">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[log.status] || ''}`}>
                  {log.status}
                </span>
              </td>
              <td className="py-2 text-th-text-tertiary truncate max-w-xs">{log.result_message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

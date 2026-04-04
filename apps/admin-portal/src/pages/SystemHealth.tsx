import { useState, useEffect } from 'react';
import {
  RefreshCw, CheckCircle, AlertTriangle, XCircle,
  Server, Database, HardDrive, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { systemHealthService, type SystemHealthSummary, type EdgeFunctionStatus } from '@mpbhealth/admin-core';

const STATUS_CONFIG = {
  healthy: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Healthy' },
  degraded: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Degraded' },
  down: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Down' },
  unknown: { icon: Server, color: 'text-neutral-400', bg: 'bg-neutral-50 dark:bg-neutral-800', label: 'Unknown' },
};

export default function SystemHealth() {
  const [health, setHealth] = useState<SystemHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showToast = false) => {
    try {
      setError(false);
      const data = await systemHealthService.getHealthSummary();
      setHealth(data);
      if (showToast) toast.success('Health check complete');
    } catch {
      setError(true);
      if (showToast) toast.error('Health check failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-th-text-primary">System Health</h1>
        <div className="flex flex-col items-center justify-center py-16 bg-surface-primary rounded-xl border border-th-border">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-th-text-secondary font-medium mb-2">Failed to load system health data</p>
          <p className="text-sm text-th-text-tertiary mb-4">Check your network connection and try again.</p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const healthyCount = health?.edgeFunctions.filter((f) => f.status === 'healthy').length || 0;
  const totalFunctions = health?.edgeFunctions.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">System Health</h1>
          <p className="text-sm text-th-text-tertiary mt-1">
            {healthyCount}/{totalFunctions} edge functions healthy
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <Database className={health.database.connected ? 'w-6 h-6 text-green-500' : 'w-6 h-6 text-red-500'} />
              <h3 className="font-semibold text-th-text-primary">Database</h3>
            </div>
            <p className={`text-sm ${health.database.connected ? 'text-green-600' : 'text-red-600'}`}>
              {health.database.connected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <HardDrive className="w-6 h-6 text-blue-500" />
              <h3 className="font-semibold text-th-text-primary">Storage</h3>
            </div>
            <p className="text-sm text-th-text-secondary">{health.storage.bucketCount} buckets</p>
          </div>
          <div className="bg-surface-primary rounded-xl border border-th-border p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-purple-500" />
              <h3 className="font-semibold text-th-text-primary">Edge Functions</h3>
            </div>
            <p className="text-sm text-th-text-secondary">{healthyCount} healthy / {totalFunctions} monitored</p>
          </div>
        </div>
      )}

      {/* Edge functions grid */}
      {health && (
        <div className="bg-surface-primary rounded-xl border border-th-border p-6">
          <h2 className="text-lg font-semibold text-th-text-primary mb-4">Edge Functions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {health.edgeFunctions.map((fn) => (
              <EdgeFunctionCard key={fn.name} fn={fn} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EdgeFunctionCard({ fn }: { fn: EdgeFunctionStatus }) {
  const config = STATUS_CONFIG[fn.status];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border border-th-border p-4 ${config.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className="text-sm font-medium text-th-text-primary">{fn.name}</span>
        </div>
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
      </div>
      {fn.latencyMs !== null && (
        <p className="text-xs text-th-text-tertiary">
          Latency: {fn.latencyMs}ms
        </p>
      )}
    </div>
  );
}

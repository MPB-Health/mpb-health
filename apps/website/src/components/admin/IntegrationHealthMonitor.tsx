import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { analyticsTrackingService } from '../../lib/analyticsTrackingService';

export const IntegrationHealthMonitor: React.FC = () => {
  const [healthData, setHealthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      const data = await analyticsTrackingService.getIntegrationHealth();
      setHealthData(data);
    } catch (error) {
      console.error('Error loading integration health:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshHealth = () => {
    setRefreshing(true);
    loadHealthData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-neutral-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'down':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-neutral-50 border-neutral-200 text-neutral-900';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Operational';
      case 'degraded':
        return 'Degraded Performance';
      case 'down':
        return 'Service Down';
      default:
        return 'Unknown';
    }
  };

  const calculateUptime = (health: any) => {
    if (!health.uptime_percentage) {
      const total = health.success_count + health.error_count;
      return total > 0 ? (health.success_count / total * 100).toFixed(2) : '100.00';
    }
    return health.uptime_percentage.toFixed(2);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-neutral-600">Loading integration health...</div>
      </div>
    );
  }

  const healthyCount = healthData.filter(h => h.status === 'healthy').length;
  const degradedCount = healthData.filter(h => h.status === 'degraded').length;
  const downCount = healthData.filter(h => h.status === 'down').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Integration Health Monitor</h2>
          <p className="text-neutral-600">Real-time tracking platform status and performance</p>
        </div>
        <Button
          onClick={refreshHealth}
          disabled={refreshing}
          variant="secondary"
          className="inline-flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Status'}
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Healthy Integrations</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-900">{healthyCount}</div>
          <div className="mt-2 text-sm text-green-700">Operating normally</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-900">Degraded Services</span>
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-900">{degradedCount}</div>
          <div className="mt-2 text-sm text-yellow-700">Performance issues</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-900">Service Outages</span>
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-900">{downCount}</div>
          <div className="mt-2 text-sm text-red-700">Requires attention</div>
        </Card>
      </div>

      <div className="grid gap-4">
        {healthData.map((health) => (
          <Card key={health.id} className={`p-6 border-2 ${getStatusColor(health.status)}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(health.status)}
                <div>
                  <h3 className="text-lg font-semibold">
                    {health.tracking_platforms?.display_name || 'Unknown Platform'}
                  </h3>
                  <p className="text-sm opacity-75">{getStatusText(health.status)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{calculateUptime(health)}%</div>
                <div className="text-xs opacity-75">Uptime</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle className="h-4 w-4 opacity-60" />
                  <span className="text-xs opacity-75">Successful Events</span>
                </div>
                <div className="text-xl font-bold">{health.success_count.toLocaleString()}</div>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <XCircle className="h-4 w-4 opacity-60" />
                  <span className="text-xs opacity-75">Failed Events</span>
                </div>
                <div className="text-xl font-bold">{health.error_count.toLocaleString()}</div>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Zap className="h-4 w-4 opacity-60" />
                  <span className="text-xs opacity-75">Avg Response Time</span>
                </div>
                <div className="text-xl font-bold">
                  {health.avg_response_time ? `${health.avg_response_time.toFixed(0)}ms` : 'N/A'}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="h-4 w-4 opacity-60" />
                  <span className="text-xs opacity-75">Last Checked</span>
                </div>
                <div className="text-sm font-medium">
                  {health.last_checked_at
                    ? new Date(health.last_checked_at).toLocaleTimeString()
                    : 'Never'}
                </div>
              </div>
            </div>

            {health.last_error_message && (
              <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Last Error</p>
                    <p className="text-xs opacity-75">{health.last_error_message}</p>
                    {health.last_error_at && (
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(health.last_error_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {health.last_success_at && (
              <div className="mt-3 flex items-center gap-2 text-xs opacity-75">
                <CheckCircle className="h-3 w-3" />
                <span>Last successful event: {new Date(health.last_success_at).toLocaleString()}</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {healthData.length === 0 && (
        <Card className="p-12 text-center">
          <Activity className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No integration health data</h3>
          <p className="text-neutral-600">
            Health monitoring will appear here once tracking integrations are active
          </p>
        </Card>
      )}
    </div>
  );
};

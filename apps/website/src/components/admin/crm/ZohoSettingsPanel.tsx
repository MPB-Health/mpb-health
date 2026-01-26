import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Link2,
  Unlink
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { crmService } from '../../../lib/crmService';
import { cn } from '../../../lib/utils';

interface ZohoSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ZohoSyncStats {
  pending: number;
  failed: number;
  synced: number;
}

export const ZohoSettingsPanel: React.FC<ZohoSettingsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [syncStats, setSyncStats] = useState<ZohoSyncStats | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<{ synced: number; failed: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkConnection();
      loadSyncStats();
    }
  }, [isOpen]);

  useEffect(() => {
    if (retryResult) {
      const timer = setTimeout(() => setRetryResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [retryResult]);

  const checkConnection = async () => {
    setIsChecking(true);
    setConnectionError(null);
    
    try {
      const result = await crmService.checkZohoConnection();
      setIsConnected(result.connected);
      if (!result.connected) {
        setConnectionError(result.error || 'Unable to connect to Zoho CRM');
      }
    } catch (_error) {
      setIsConnected(false);
      setConnectionError('Failed to check connection');
    } finally {
      setIsChecking(false);
    }
  };

  const loadSyncStats = async () => {
    const stats = await crmService.getZohoSyncStats();
    setSyncStats(stats);
  };

  const handleRetryFailed = async () => {
    setIsRetrying(true);
    const result = await crmService.retryFailedZohoSyncs();
    setRetryResult(result);
    await loadSyncStats();
    setIsRetrying(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Zoho CRM Settings</h2>
              <p className="text-sm text-neutral-500">Manage your Zoho CRM integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isChecking ? (
                    <>
                      <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                      <span className="text-neutral-600">Checking connection...</span>
                    </>
                  ) : isConnected ? (
                    <>
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-700">Connected</p>
                        <p className="text-sm text-neutral-500">Zoho CRM integration is active</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-red-700">Not Connected</p>
                        <p className="text-sm text-neutral-500">{connectionError}</p>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkConnection}
                  disabled={isChecking}
                >
                  <RefreshCw className={cn('h-4 w-4 mr-2', isChecking && 'animate-spin')} />
                  Refresh
                </Button>
              </div>

              {!isConnected && !isChecking && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Setup Required:</strong> To connect Zoho CRM, you need to configure the following environment variables in your Supabase Edge Functions:
                  </p>
                  <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
                    <li>ZOHO_CLIENT_ID</li>
                    <li>ZOHO_CLIENT_SECRET</li>
                    <li>ZOHO_REFRESH_TOKEN</li>
                    <li>ZOHO_ACCOUNT_DOMAIN</li>
                  </ul>
                  <a
                    href="https://www.zoho.com/crm/developer/docs/api/v2/oauth-overview.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    View Zoho OAuth Documentation
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sync Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {syncStats ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{syncStats.synced}</p>
                    <p className="text-sm text-green-700">Synced</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{syncStats.pending}</p>
                    <p className="text-sm text-amber-700">Pending</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{syncStats.failed}</p>
                    <p className="text-sm text-red-700">Failed</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-6">
                  <RefreshCw className="h-5 w-5 animate-spin text-neutral-400" />
                </div>
              )}

              {syncStats && syncStats.failed > 0 && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={handleRetryFailed}
                    disabled={isRetrying || !isConnected}
                    className="w-full"
                  >
                    <RefreshCw className={cn('h-4 w-4 mr-2', isRetrying && 'animate-spin')} />
                    {isRetrying ? 'Retrying...' : `Retry ${syncStats.failed} Failed Syncs`}
                  </Button>

                  {retryResult && (
                    <div className={cn(
                      'mt-3 p-3 rounded-lg text-sm',
                      retryResult.failed === 0 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-amber-50 text-amber-700'
                    )}>
                      {retryResult.synced > 0 && (
                        <p>✓ Successfully synced {retryResult.synced} leads</p>
                      )}
                      {retryResult.failed > 0 && (
                        <p>✗ {retryResult.failed} leads still failed to sync</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <a
                  href="https://crm.zoho.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Link2 className="h-5 w-5 text-neutral-600" />
                    <span className="text-neutral-700">Open Zoho CRM</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-neutral-400" />
                </a>
                <a
                  href="https://accounts.zoho.com/developerconsole"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Unlink className="h-5 w-5 text-neutral-600" />
                    <span className="text-neutral-700">Zoho Developer Console</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-neutral-400" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-neutral-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ZohoSettingsPanel;

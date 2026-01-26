import { useState, useEffect } from 'react';
import { RefreshCw, Check, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';

export default function Settings() {
  const { zohoService, pipelineStages } = useCRM();
  const [zohoStatus, setZohoStatus] = useState<{
    configured: boolean;
    error?: string;
  } | null>(null);
  const [syncStats, setSyncStats] = useState<{
    pending: number;
    failed: number;
    synced: number;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const checkZohoConnection = async () => {
    setChecking(true);
    const status = await zohoService.checkConfiguration();
    setZohoStatus(status);
    const stats = await zohoService.getSyncStats();
    setSyncStats(stats);
    setChecking(false);
  };

  const retryFailedSyncs = async () => {
    setSyncing(true);
    const result = await zohoService.retryFailedSyncs();
    if (result.synced > 0) {
      toast.success(`Synced ${result.synced} leads`);
    }
    if (result.failed > 0) {
      toast.error(`${result.failed} leads failed to sync`);
    }
    await checkZohoConnection();
    setSyncing(false);
  };

  useEffect(() => {
    checkZohoConnection();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Configure your CRM settings and integrations
        </p>
      </div>

      {/* Zoho CRM Integration */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Zoho CRM Integration
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Sync leads with your Zoho CRM account
            </p>
          </div>
          <button
            onClick={checkZohoConnection}
            disabled={checking}
            className="flex items-center space-x-2 px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>Check Connection</span>
          </button>
        </div>

        {/* Connection status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {zohoStatus?.configured ? (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-5 h-5 text-red-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-neutral-900">Connection Status</p>
                <p className="text-sm text-neutral-500">
                  {zohoStatus?.configured
                    ? 'Connected to Zoho CRM'
                    : zohoStatus?.error || 'Not connected'}
                </p>
              </div>
            </div>
          </div>

          {/* Sync stats */}
          {syncStats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">Synced</p>
                <p className="text-2xl font-bold text-green-800">
                  {syncStats.synced}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {syncStats.pending}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">Failed</p>
                <p className="text-2xl font-bold text-red-800">
                  {syncStats.failed}
                </p>
              </div>
            </div>
          )}

          {/* Retry failed syncs */}
          {syncStats && syncStats.failed > 0 && (
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-700">
                  {syncStats.failed} leads failed to sync to Zoho
                </p>
              </div>
              <button
                onClick={retryFailedSyncs}
                disabled={syncing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {syncing ? 'Retrying...' : 'Retry Failed'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Pipeline Stages
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Configure your sales pipeline stages
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {pipelineStages.map((stage, index) => (
            <div
              key={stage.id}
              className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <span className="text-sm text-neutral-400 w-6">{index + 1}</span>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="font-medium text-neutral-900">
                  {stage.display_name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {stage.is_won_stage && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Won
                  </span>
                )}
                {stage.is_lost_stage && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                    Lost
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6">
          General Settings
        </h2>

        <div className="space-y-6">
          <div>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">Email Notifications</p>
                <p className="text-sm text-neutral-500">
                  Receive email alerts for new leads
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>

          <div>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">Desktop Notifications</p>
                <p className="text-sm text-neutral-500">
                  Show browser notifications for new leads
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>

          <div>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">Auto-sync to Zoho</p>
                <p className="text-sm text-neutral-500">
                  Automatically sync new leads to Zoho CRM
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

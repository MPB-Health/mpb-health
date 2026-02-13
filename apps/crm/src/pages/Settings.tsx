import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Check, X, AlertCircle, Upload, FileText, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import type { NotificationPreferences, ScoringWeightConfig } from '@mpbhealth/crm-core';
import { importContactsFromCSV, type ImportResult } from '../utils/csvImporter';

export default function Settings() {
  const { zohoService, pipelineStages, preferencesService, leadService, scoringService, refreshLeads, refreshDashboard, zohoConfigured } = useCRM();
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
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  
  // CSV Import state
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lead Scoring state
  const [scoringWeights, setScoringWeights] = useState<ScoringWeightConfig[]>([]);
  const [scoringLoading, setScoringLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const scoringTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load scoring weights
  useEffect(() => {
    scoringService.getWeights().then((w) => {
      setScoringWeights(w);
      setScoringLoading(false);
    });
  }, [scoringService]);

  const handleWeightChange = (factorKey: string, weight: number) => {
    setScoringWeights((prev) =>
      prev.map((w) => (w.factor_key === factorKey ? { ...w, weight } : w)),
    );
    clearTimeout(scoringTimer.current);
    scoringTimer.current = setTimeout(async () => {
      const current = scoringWeights.find((w) => w.factor_key === factorKey);
      if (!current) return;
      const result = await scoringService.updateWeights([
        { factor_key: factorKey, weight, is_enabled: current.is_enabled },
      ]);
      if (result.success) toast.success('Weight saved');
      else toast.error('Failed to save weight');
    }, 600);
  };

  const handleScoringToggle = async (factorKey: string, enabled: boolean) => {
    setScoringWeights((prev) =>
      prev.map((w) => (w.factor_key === factorKey ? { ...w, is_enabled: enabled } : w)),
    );
    const current = scoringWeights.find((w) => w.factor_key === factorKey);
    if (!current) return;
    const result = await scoringService.updateWeights([
      { factor_key: factorKey, weight: current.weight, is_enabled: enabled },
    ]);
    if (result.success) toast.success(enabled ? 'Factor enabled' : 'Factor disabled');
    else toast.error('Failed to update');
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    const result = await scoringService.recalculateAllScores();
    setRecalculating(false);
    if (result.success) toast.success('Scores recalculated');
    else toast.error(result.error || 'Recalculation failed');
  };

  // Load preferences
  useEffect(() => {
    preferencesService.getPreferences().then(setPrefs);
  }, [preferencesService]);

  // Debounced save
  const updatePref = useCallback((key: keyof NotificationPreferences, value: unknown) => {
    setPrefs((prev) => prev ? { ...prev, [key]: value } as NotificationPreferences : prev);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const result = await preferencesService.upsertPreferences({ [key]: value });
      if (result.success) {
        toast.success('Settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    }, 800);
  }, [preferencesService]);

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
    if (zohoConfigured) {
      checkZohoConnection();
    }
  }, [zohoConfigured]);

  // CSV Import handlers
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setImporting(true);
    setImportResult(null);
    setImportProgress(null);

    try {
      const content = await file.text();
      const result = importContactsFromCSV(content);
      setImportResult(result);

      if (result.successful === 0) {
        toast.error('No valid contacts found in the CSV');
      } else {
        toast.success(`Parsed ${result.successful} contacts from CSV`);
      }
    } catch (error) {
      toast.error('Failed to read CSV file');
      console.error('CSV read error:', error);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportToDatabase = async () => {
    if (!importResult || importResult.leads.length === 0) return;

    setImporting(true);
    setImportProgress({ current: 0, total: importResult.leads.length });

    const batchSize = 50;
    let imported = 0;
    let failed = 0;

    try {
      for (let i = 0; i < importResult.leads.length; i += batchSize) {
        const batch = importResult.leads.slice(i, i + batchSize);
        
        for (const lead of batch) {
          try {
            await leadService.createLead(lead);
            imported++;
          } catch (error) {
            console.error('Failed to import lead:', error);
            failed++;
          }
        }
        
        setImportProgress({ current: i + batch.length, total: importResult.leads.length });
      }

      if (imported > 0) {
        toast.success(`Successfully imported ${imported} contacts`);
        await Promise.all([refreshLeads(), refreshDashboard()]);
      }
      if (failed > 0) {
        toast.error(`Failed to import ${failed} contacts`);
      }
    } catch (error) {
      toast.error('Import failed');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
      setImportProgress(null);
      setImportResult(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-th-text-primary">Settings</h1>
        <p className="text-th-text-tertiary text-sm mt-1">
          Configure your CRM settings and integrations
        </p>
      </div>

      {/* Zoho CRM Integration — only show when configured */}
      {zohoConfigured && (
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-th-text-primary">
              Zoho CRM Integration
            </h2>
            <p className="text-sm text-th-text-tertiary mt-1">
              Sync leads with your Zoho CRM account
            </p>
          </div>
          <button
            onClick={checkZohoConnection}
            disabled={checking}
            className="flex items-center space-x-2 px-4 py-2 border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>Check Connection</span>
          </button>
        </div>

        {/* Connection status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-th-text-primary">Connection Status</p>
                <p className="text-sm text-th-text-tertiary">Connected to Zoho CRM</p>
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
      )}

      {/* CSV Import */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-th-text-primary">
              Import Contacts
            </h2>
            <p className="text-sm text-th-text-tertiary mt-1">
              Import contacts from a CSV file (Zoho CRM export format supported)
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* File upload area */}
          <div className="border-2 border-dashed border-th-border rounded-lg p-6 text-center hover:border-th-accent-300 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="w-10 h-10 text-th-text-tertiary mb-3" />
              <p className="text-sm font-medium text-th-text-secondary">
                Click to upload CSV file
              </p>
              <p className="text-xs text-th-text-tertiary mt-1">
                Supports Zoho CRM contact exports
              </p>
            </label>
          </div>

          {/* Import progress */}
          {importing && importProgress && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">
                  Importing contacts...
                </span>
                <span className="text-sm text-blue-600">
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(importProgress.current / importProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Import result preview */}
          {importResult && !importing && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-surface-secondary rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-th-text-tertiary" />
                    <p className="text-sm text-th-text-secondary">Total Rows</p>
                  </div>
                  <p className="text-2xl font-bold text-th-text-primary">
                    {importResult.total}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-700">Valid Contacts</p>
                  </div>
                  <p className="text-2xl font-bold text-green-800">
                    {importResult.successful}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-700">Skipped</p>
                  </div>
                  <p className="text-2xl font-bold text-red-800">
                    {importResult.failed}
                  </p>
                </div>
              </div>

              {/* Error details */}
              {importResult.errors.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    {importResult.errors.length} rows had issues:
                  </p>
                  <ul className="text-xs text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>Row {err.row}: {err.error}</li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li className="text-yellow-600">
                        ... and {importResult.errors.length - 10} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Import actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleImportToDatabase}
                  disabled={importResult.successful === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  Import {importResult.successful} Contacts to CRM
                </button>
                <button
                  onClick={() => setImportResult(null)}
                  className="px-4 py-3 border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-th-text-primary">
              Pipeline Stages
            </h2>
            <p className="text-sm text-th-text-tertiary mt-1">
              Configure your sales pipeline stages
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {pipelineStages.map((stage, index) => (
            <div
              key={stage.id}
              className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <span className="text-sm text-th-text-tertiary w-6">{index + 1}</span>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="font-medium text-th-text-primary">
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

      {/* Lead Scoring */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-th-text-tertiary" />
            <div>
              <h2 className="text-lg font-semibold text-th-text-primary">Lead Scoring</h2>
              <p className="text-sm text-th-text-tertiary mt-0.5">
                Adjust factor weights to tune lead scoring
              </p>
            </div>
          </div>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2 px-4 py-2 border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            Recalculate All
          </button>
        </div>

        {scoringLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {scoringWeights.map((factor) => (
              <div key={factor.factor_key} className="flex items-center gap-4 p-3 bg-surface-secondary rounded-lg">
                <input
                  type="checkbox"
                  checked={factor.is_enabled}
                  onChange={(e) => handleScoringToggle(factor.factor_key, e.target.checked)}
                  className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-medium ${factor.is_enabled ? 'text-th-text-primary' : 'text-th-text-tertiary'}`}>
                      {factor.factor_label}
                    </p>
                    <span className="text-xs font-medium text-th-accent-600 w-8 text-right">
                      {factor.weight}
                    </span>
                  </div>
                  {factor.description && (
                    <p className="text-xs text-th-text-tertiary mb-2">{factor.description}</p>
                  )}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={factor.weight}
                    onChange={(e) => handleWeightChange(factor.factor_key, Number(e.target.value))}
                    disabled={!factor.is_enabled}
                    className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer disabled:opacity-40"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* General Settings */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <h2 className="text-lg font-semibold text-th-text-primary mb-6">
          Notification Preferences
        </h2>

        {prefs ? (
          <div className="space-y-6">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-th-text-primary">Email Notifications</p>
                <p className="text-sm text-th-text-tertiary">
                  Receive email alerts for new leads
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.email_notifications}
                onChange={(e) => updatePref('email_notifications', e.target.checked)}
                className="w-5 h-5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-th-text-primary">Desktop Notifications</p>
                <p className="text-sm text-th-text-tertiary">
                  Show browser notifications for new leads
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.desktop_notifications}
                onChange={(e) => updatePref('desktop_notifications', e.target.checked)}
                className="w-5 h-5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
              />
            </label>

            {zohoConfigured && (
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-th-text-primary">Auto-sync to Zoho</p>
                <p className="text-sm text-th-text-tertiary">
                  Automatically sync new leads to Zoho CRM
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.auto_sync_zoho}
                onChange={(e) => updatePref('auto_sync_zoho', e.target.checked)}
                className="w-5 h-5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
              />
            </label>
            )}

            <hr className="border-th-border" />

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-th-text-primary">Quiet Hours</p>
                <p className="text-sm text-th-text-tertiary">
                  Suppress notifications during these hours
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.quiet_hours_enabled}
                onChange={(e) => updatePref('quiet_hours_enabled', e.target.checked)}
                className="w-5 h-5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
              />
            </label>

            {prefs.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-4 pl-4">
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">Start</label>
                  <input
                    type="time"
                    value={prefs.quiet_hours_start}
                    onChange={(e) => updatePref('quiet_hours_start', e.target.value)}
                    className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-th-text-tertiary mb-1">End</label>
                  <input
                    type="time"
                    value={prefs.quiet_hours_end}
                    onChange={(e) => updatePref('quiet_hours_end', e.target.value)}
                    className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-th-text-tertiary mb-1">Timezone</label>
              <select
                value={prefs.timezone}
                onChange={(e) => updatePref('timezone', e.target.value)}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              >
                {Intl.supportedValuesOf?.('timeZone')?.slice(0, 50).map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                )) || (
                  <option value={prefs.timezone}>{prefs.timezone}</option>
                )}
              </select>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
          </div>
        )}
      </div>
    </div>
  );
}

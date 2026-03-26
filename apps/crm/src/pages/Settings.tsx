import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw, Upload, FileText, CheckCircle2, XCircle, BarChart3,
  GitBranch, Bell, Settings2, Database, Plus, Trash2, GripVertical, Palette,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import type { NotificationPreferences, ScoringWeightConfig, PipelineStage } from '@mpbhealth/crm-core';
import { importContactsFromCSV, type ImportResult } from '../utils/csvImporter';

type SettingsTab = 'general' | 'pipeline' | 'scoring' | 'import';

export default function Settings() {
  const { pipelineStages, pipelineService, preferencesService, leadService, scoringService, refreshLeads, refreshDashboard } = useCRM();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  
  // CSV Import state
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pipeline management state
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [showAddStage, setShowAddStage] = useState(false);
  const [newStage, setNewStage] = useState({ name: '', display_name: '', color: '#6366f1' });
  const [pipelineSaving, setPipelineSaving] = useState(false);

  const handleCreateStage = async () => {
    if (!newStage.display_name.trim()) return;
    setPipelineSaving(true);
    const stageName = newStage.display_name.toLowerCase().replace(/\s+/g, '_');
    const result = await pipelineService.createStage({
      name: newStage.name || stageName,
      display_name: newStage.display_name,
      color: newStage.color,
      sort_order: pipelineStages.length + 1,
      is_active: true,
      is_won_stage: false,
      is_lost_stage: false,
    });
    setPipelineSaving(false);
    if (result.success) {
      toast.success('Stage created');
      setShowAddStage(false);
      setNewStage({ name: '', display_name: '', color: '#6366f1' });
      refreshDashboard();
    } else {
      toast.error(result.error || 'Failed to create stage');
    }
  };

  const handleUpdateStage = async (stage: PipelineStage) => {
    setPipelineSaving(true);
    const result = await pipelineService.updateStage(stage.id, {
      display_name: stage.display_name,
      color: stage.color,
      is_won_stage: stage.is_won_stage,
      is_lost_stage: stage.is_lost_stage,
    });
    setPipelineSaving(false);
    if (result.success) {
      toast.success('Stage updated');
      setEditingStage(null);
      refreshDashboard();
    } else {
      toast.error(result.error || 'Failed to update stage');
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('Deactivate this pipeline stage? Leads in this stage will need to be moved.')) return;
    const result = await pipelineService.deleteStage(stageId);
    if (result.success) {
      toast.success('Stage deactivated');
      refreshDashboard();
    } else {
      toast.error(result.error || 'Failed to deactivate stage');
    }
  };

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

  const tabs: { key: SettingsTab; label: string; icon: typeof Bell }[] = [
    { key: 'general', label: 'General', icon: Settings2 },
    { key: 'pipeline', label: 'Pipeline', icon: GitBranch },
    { key: 'scoring', label: 'Lead Scoring', icon: BarChart3 },
    { key: 'import', label: 'Import', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-th-text-primary">Settings</h1>
        <p className="text-th-text-tertiary text-sm mt-1">
          Configure your CRM platform
        </p>
      </div>

      {/* Tab navigation */}
      <div className="bg-surface-primary rounded-2xl border border-th-border">
        <div className="flex border-b border-th-border overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-th-accent-500 text-th-accent-600'
                    : 'border-transparent text-th-text-tertiary hover:text-th-text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* ─── General Tab ─── */}
          {activeTab === 'general' && (
            <GeneralSettings prefs={prefs} updatePref={updatePref} />
          )}

          {/* ─── Pipeline Tab ─── */}
          {activeTab === 'pipeline' && (
            <PipelineSettings
              stages={pipelineStages}
              editingStage={editingStage}
              showAddStage={showAddStage}
              newStage={newStage}
              saving={pipelineSaving}
              onEditStage={setEditingStage}
              onShowAddStage={setShowAddStage}
              onNewStageChange={setNewStage}
              onCreateStage={handleCreateStage}
              onUpdateStage={handleUpdateStage}
              onDeleteStage={handleDeleteStage}
            />
          )}

          {/* ─── Scoring Tab ─── */}
          {activeTab === 'scoring' && (
            <ScoringSettings
              weights={scoringWeights}
              loading={scoringLoading}
              recalculating={recalculating}
              onWeightChange={handleWeightChange}
              onToggle={handleScoringToggle}
              onRecalculate={handleRecalculate}
            />
          )}

          {/* ─── Import Tab ─── */}
          {activeTab === 'import' && (
            <ImportSettings
              importResult={importResult}
              importing={importing}
              importProgress={importProgress}
              fileInputRef={fileInputRef}
              onFileSelect={handleFileSelect}
              onImport={handleImportToDatabase}
              onCancelImport={() => setImportResult(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// General Settings Tab
// ============================================================================

function GeneralSettings({
  prefs,
  updatePref,
}: {
  prefs: NotificationPreferences | null;
  updatePref: (key: keyof NotificationPreferences, value: unknown) => void;
}) {
  if (!prefs) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-th-text-primary mb-1">Notifications</h2>
        <p className="text-sm text-th-text-tertiary">Control how you receive CRM notifications</p>
      </div>

      <label className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
        <div>
          <p className="font-medium text-th-text-primary">Email Notifications</p>
          <p className="text-sm text-th-text-tertiary">Receive email alerts for new leads</p>
        </div>
        <input
          type="checkbox"
          checked={prefs.email_notifications}
          onChange={(e) => updatePref('email_notifications', e.target.checked)}
          className="w-5 h-5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
        />
      </label>

      <label className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
        <div>
          <p className="font-medium text-th-text-primary">Desktop Notifications</p>
          <p className="text-sm text-th-text-tertiary">Browser push notifications for activity</p>
        </div>
        <input
          type="checkbox"
          checked={prefs.desktop_notifications}
          onChange={(e) => updatePref('desktop_notifications', e.target.checked)}
          className="w-5 h-5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
        />
      </label>

      <hr className="border-th-border" />

      <label className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
        <div>
          <p className="font-medium text-th-text-primary">Quiet Hours</p>
          <p className="text-sm text-th-text-tertiary">Suppress notifications during these hours</p>
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
            <label className="block text-sm text-th-text-tertiary mb-1">
              Start
              <input
                type="time"
                value={prefs.quiet_hours_start}
                onChange={(e) => updatePref('quiet_hours_start', e.target.value)}
                className="mt-1 w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm text-th-text-tertiary mb-1">
              End
              <input
                type="time"
                value={prefs.quiet_hours_end}
                onChange={(e) => updatePref('quiet_hours_end', e.target.value)}
                className="mt-1 w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
              />
            </label>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm text-th-text-tertiary mb-1">Timezone</label>
        <select
          value={prefs.timezone}
          onChange={(e) => updatePref('timezone', e.target.value)}
          aria-label="Timezone"
          className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
        >
          {(() => {
            const allZones = Intl.supportedValuesOf?.('timeZone') ?? [prefs.timezone];
            const groups: Record<string, string[]> = {};
            for (const tz of allZones) {
              const region = tz.split('/')[0];
              if (!groups[region]) groups[region] = [];
              groups[region].push(tz);
            }
            const regionOrder = ['America', 'US', ...Object.keys(groups).filter((r) => r !== 'America' && r !== 'US').sort()];
            return regionOrder
              .filter((r) => groups[r]?.length)
              .map((region) => (
                <optgroup key={region} label={region}>
                  {groups[region].map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(`${region}/`, '').replace(/_/g, ' ')}
                    </option>
                  ))}
                </optgroup>
              ));
          })()}
        </select>
      </div>
    </div>
  );
}

// ============================================================================
// Pipeline Settings Tab
// ============================================================================

function PipelineSettings({
  stages,
  editingStage,
  showAddStage,
  newStage,
  saving,
  onEditStage,
  onShowAddStage,
  onNewStageChange,
  onCreateStage,
  onUpdateStage,
  onDeleteStage,
}: {
  stages: PipelineStage[];
  editingStage: PipelineStage | null;
  showAddStage: boolean;
  newStage: { name: string; display_name: string; color: string };
  saving: boolean;
  onEditStage: (stage: PipelineStage | null) => void;
  onShowAddStage: (show: boolean) => void;
  onNewStageChange: (stage: { name: string; display_name: string; color: string }) => void;
  onCreateStage: () => void;
  onUpdateStage: (stage: PipelineStage) => void;
  onDeleteStage: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-th-text-primary">Pipeline Stages</h2>
          <p className="text-sm text-th-text-tertiary mt-0.5">
            Manage your lead pipeline stages, colors, and ordering
          </p>
        </div>
        <button
          onClick={() => onShowAddStage(true)}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Stage
        </button>
      </div>

      {/* Add stage form */}
      {showAddStage && (
        <div className="p-4 rounded-xl border-2 border-dashed border-th-accent-300 bg-th-accent-50/30 dark:bg-th-accent-500/5 space-y-4">
          <h3 className="text-sm font-semibold text-th-text-primary">New Pipeline Stage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="new-stage-name" className="block text-xs text-th-text-tertiary mb-1">Display Name</label>
              <input
                id="new-stage-name"
                type="text"
                value={newStage.display_name}
                onChange={(e) => onNewStageChange({ ...newStage, display_name: e.target.value })}
                placeholder="e.g. Follow Up"
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
              />
            </div>
            <div>
              <label htmlFor="new-stage-key" className="block text-xs text-th-text-tertiary mb-1">Stage Key</label>
              <input
                id="new-stage-key"
                type="text"
                value={newStage.name || newStage.display_name.toLowerCase().replace(/\s+/g, '_')}
                onChange={(e) => onNewStageChange({ ...newStage, name: e.target.value })}
                placeholder="follow_up"
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary font-mono"
              />
            </div>
            <div>
              <label htmlFor="new-stage-color" className="block text-xs text-th-text-tertiary mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  id="new-stage-color"
                  type="color"
                  value={newStage.color}
                  onChange={(e) => onNewStageChange({ ...newStage, color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-th-border cursor-pointer"
                />
                <span className="text-xs text-th-text-tertiary font-mono">{newStage.color}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCreateStage}
              disabled={!newStage.display_name.trim() || saving}
              className="px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating...' : 'Create Stage'}
            </button>
            <button
              onClick={() => onShowAddStage(false)}
              className="px-4 py-2 border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stage list */}
      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div key={stage.id}>
            {editingStage?.id === stage.id ? (
              <div className="p-4 rounded-xl border border-th-accent-300 bg-surface-secondary space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor={`edit-name-${stage.id}`} className="block text-xs text-th-text-tertiary mb-1">Display Name</label>
                    <input
                      id={`edit-name-${stage.id}`}
                      type="text"
                      value={editingStage.display_name}
                      onChange={(e) => onEditStage({ ...editingStage, display_name: e.target.value })}
                      className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor={`edit-color-${stage.id}`} className="block text-xs text-th-text-tertiary mb-1">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`edit-color-${stage.id}`}
                        type="color"
                        value={editingStage.color}
                        onChange={(e) => onEditStage({ ...editingStage, color: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-th-border cursor-pointer"
                      />
                      <span className="text-xs text-th-text-tertiary font-mono">{editingStage.color}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm text-th-text-primary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingStage.is_won_stage}
                        onChange={(e) => onEditStage({ ...editingStage, is_won_stage: e.target.checked, is_lost_stage: false })}
                        className="w-4 h-4 rounded border-th-border text-emerald-600"
                      />
                      Won Stage
                    </label>
                    <label className="flex items-center gap-2 text-sm text-th-text-primary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingStage.is_lost_stage}
                        onChange={(e) => onEditStage({ ...editingStage, is_lost_stage: e.target.checked, is_won_stage: false })}
                        className="w-4 h-4 rounded border-th-border text-red-600"
                      />
                      Lost Stage
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateStage(editingStage)}
                    disabled={saving}
                    className="px-3 py-1.5 bg-th-accent-600 text-white rounded-lg text-xs font-medium hover:bg-th-accent-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => onEditStage(null)}
                    className="px-3 py-1.5 border border-th-border rounded-lg text-xs text-th-text-secondary hover:bg-surface-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary hover:bg-surface-tertiary/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <GripVertical className="w-4 h-4 text-th-text-tertiary opacity-30 group-hover:opacity-100 cursor-grab" />
                  <span className="text-sm text-th-text-tertiary w-6">{index + 1}</span>
                  <div
                    className="w-4 h-4 rounded-full border border-black/10"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="font-medium text-th-text-primary">{stage.display_name}</span>
                  <span className="text-xs text-th-text-tertiary font-mono">{stage.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {stage.is_won_stage && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Won</span>
                  )}
                  {stage.is_lost_stage && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Lost</span>
                  )}
                  <button
                    onClick={() => onEditStage({ ...stage })}
                    className="px-2.5 py-1 text-xs text-th-text-tertiary hover:text-th-text-primary border border-transparent hover:border-th-border rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteStage(stage.id)}
                    className="p-1.5 text-th-text-tertiary hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Delete ${stage.display_name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Scoring Settings Tab
// ============================================================================

function ScoringSettings({
  weights,
  loading,
  recalculating,
  onWeightChange,
  onToggle,
  onRecalculate,
}: {
  weights: ScoringWeightConfig[];
  loading: boolean;
  recalculating: boolean;
  onWeightChange: (factorKey: string, weight: number) => void;
  onToggle: (factorKey: string, enabled: boolean) => void;
  onRecalculate: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-th-text-primary">Lead Scoring</h2>
          <p className="text-sm text-th-text-tertiary mt-0.5">Adjust factor weights to tune lead scoring</p>
        </div>
        <button
          onClick={onRecalculate}
          disabled={recalculating}
          className="flex items-center gap-2 px-4 py-2 border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
          Recalculate All
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {weights.map((factor) => (
            <div key={factor.factor_key} className="flex items-center gap-4 p-4 bg-surface-secondary rounded-xl">
              <input
                type="checkbox"
                checked={factor.is_enabled}
                onChange={(e) => onToggle(factor.factor_key, e.target.checked)}
                aria-label={`Enable ${factor.factor_label}`}
                className="w-4 h-4 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-medium ${factor.is_enabled ? 'text-th-text-primary' : 'text-th-text-tertiary'}`}>
                    {factor.factor_label}
                  </p>
                  <span className="text-xs font-semibold text-th-accent-600 w-8 text-right">{factor.weight}</span>
                </div>
                {factor.description && (
                  <p className="text-xs text-th-text-tertiary mb-2">{factor.description}</p>
                )}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={factor.weight}
                  onChange={(e) => onWeightChange(factor.factor_key, Number(e.target.value))}
                  disabled={!factor.is_enabled}
                  aria-label={`${factor.factor_label} weight`}
                  className="w-full h-1.5 bg-surface-tertiary rounded-lg appearance-none cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Import Settings Tab
// ============================================================================

function ImportSettings({
  importResult,
  importing,
  importProgress,
  fileInputRef,
  onFileSelect,
  onImport,
  onCancelImport,
}: {
  importResult: ImportResult | null;
  importing: boolean;
  importProgress: { current: number; total: number } | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  onCancelImport: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-th-text-primary">Import Contacts</h2>
        <p className="text-sm text-th-text-tertiary mt-0.5">Import contacts from a CSV file</p>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-th-border rounded-xl p-6 text-center hover:border-th-accent-300 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={onFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
            <Upload className="w-10 h-10 text-th-text-tertiary mb-3" />
            <p className="text-sm font-medium text-th-text-secondary">Click to upload CSV file</p>
            <p className="text-xs text-th-text-tertiary mt-1">Supports standard CRM contact exports</p>
          </label>
        </div>

        {importing && importProgress && (
          <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Importing contacts...</span>
              <span className="text-sm text-blue-600">{importProgress.current} / {importProgress.total}</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-500/20 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {importResult && !importing && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-surface-secondary rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-th-text-tertiary" />
                  <p className="text-sm text-th-text-secondary">Total Rows</p>
                </div>
                <p className="text-2xl font-bold text-th-text-primary">{importResult.total}</p>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">Valid</p>
                </div>
                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{importResult.successful}</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700 dark:text-red-400">Skipped</p>
                </div>
                <p className="text-2xl font-bold text-red-800 dark:text-red-300">{importResult.failed}</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                  {importResult.errors.length} rows had issues:
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 max-h-32 overflow-y-auto">
                  {importResult.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>Row {err.row}: {err.error}</li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li>... and {importResult.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={onImport}
                disabled={importResult.successful === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Import {importResult.successful} Contacts
              </button>
              <button
                onClick={onCancelImport}
                className="px-4 py-3 border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  RefreshCw, Upload, FileText, CheckCircle2, XCircle, BarChart3,
  GitBranch, Bell, Settings2, Database, Plus, Trash2, GripVertical,
  Users, Timer, Workflow, Target, Pause, Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCRM } from '../contexts/CRMContext';
import { useCRMService } from '../contexts/CRMServiceContext';
import { useOrg } from '../contexts/OrgContext';
import { crmQueryKeys } from '../query/crmQueryKeys';
import type {
  NotificationPreferences,
  ScoringWeightConfig,
  PipelineStage,
} from '@mpbhealth/crm-core';
import type { PoolMember, RoundRobinConfigInput } from '@mpbhealth/crm-core/round-robin';
import type { SLAConfigInput } from '@mpbhealth/crm-core/sla';
import type { FollowUpCadence, CadenceStep } from '@mpbhealth/crm-core/cadence';
import type { CRMTemplate } from '@mpbhealth/crm-core/templates';
import { DEFAULT_MONTHLY_TARGETS, QUARTERLY_TEAM_TARGETS } from '@mpbhealth/crm-core/targets';
import { importContactsFromCSV, type ImportResult } from '../utils/csvImporter';
import { GradientHeader } from '@mpbhealth/ui';

type SettingsTab =
  | 'general'
  | 'pipeline'
  | 'scoring'
  | 'import'
  | 'roundRobin'
  | 'sla'
  | 'cadence'
  | 'targets';

export default function Settings() {
  const { pipelineStages, pipelineService, preferencesService, leadService, scoringService, refreshLeads, refreshDashboard } = useCRM();
  const { activeOrgId, orgLoading, can } = useOrg();
  const orgReady = !!activeOrgId && !orgLoading;
  const canRoundRobin = can('round_robin.manage');
  const canSla = can('sla.manage');
  const canCadence = can('settings.manage');
  const canTargets = can('targets.manage');

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

  const tabs: { key: SettingsTab; label: string; icon: typeof Bell }[] = useMemo(
    () => [
      { key: 'general', label: 'General', icon: Settings2 },
      { key: 'pipeline', label: 'Pipeline', icon: GitBranch },
      { key: 'scoring', label: 'Lead Scoring', icon: BarChart3 },
      { key: 'import', label: 'Import', icon: Database },
      ...(canRoundRobin ? [{ key: 'roundRobin' as const, label: 'Round-Robin', icon: Users }] : []),
      ...(canSla ? [{ key: 'sla' as const, label: 'SLA', icon: Timer }] : []),
      ...(canCadence ? [{ key: 'cadence' as const, label: 'Cadence', icon: Workflow }] : []),
      ...(canTargets ? [{ key: 'targets' as const, label: 'Targets', icon: Target }] : []),
    ],
    [canRoundRobin, canSla, canCadence, canTargets],
  );

  const tabKeys = useMemo(() => new Set(tabs.map((t) => t.key)), [tabs]);
  useEffect(() => {
    if (!tabKeys.has(activeTab)) {
      setActiveTab(tabs[0]?.key ?? 'general');
    }
  }, [tabKeys, activeTab, tabs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <GradientHeader
        title="Settings"
        subtitle="Configure your CRM platform"
        icon={<Settings2 className="w-5 h-5" />}
        size="sm"
      />

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

          {activeTab === 'roundRobin' && canRoundRobin && (
            <RoundRobinSettings orgReady={orgReady} activeOrgId={activeOrgId} />
          )}

          {activeTab === 'sla' && canSla && (
            <SLASettings orgReady={orgReady} activeOrgId={activeOrgId} />
          )}

          {activeTab === 'cadence' && canCadence && (
            <CadenceSettings orgReady={orgReady} activeOrgId={activeOrgId} />
          )}

          {activeTab === 'targets' && canTargets && (
            <TargetsSettings orgReady={orgReady} activeOrgId={activeOrgId} />
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

// ============================================================================
// Sales plan settings — org members helper
// ============================================================================

type SettingsOrgMember = { user_id: string; email: string; full_name: string };

async function fetchSettingsOrgMembers(
  supabase: SupabaseClient,
  orgId: string,
): Promise<SettingsOrgMember[]> {
  const { data } = await supabase
    .from('org_members')
    .select('user_id, users:user_id(id, email, raw_user_meta_data)')
    .eq('org_id', orgId);

  if (!data) return [];
  return data.map((row: Record<string, unknown>) => {
    const u = row.users as { email?: string; raw_user_meta_data?: { full_name?: string } } | null;
    return {
      user_id: row.user_id as string,
      email: u?.email ?? 'Unknown',
      full_name:
        u?.raw_user_meta_data?.full_name ??
        u?.email?.split('@')[0] ??
        'Unknown',
    };
  });
}

function getMonthDateRange(ym: string): { start: string; end: string } {
  const [ys, ms] = ym.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const ps = `${y}-${String(m).padStart(2, '0')}-01`;
  const last = new Date(y, m, 0);
  const pe = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
  return { start: ps, end: pe };
}

function getQuarterDateRange(year: number, quarter: 1 | 2 | 3 | 4): { start: string; end: string } {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const ps = `${year}-${String(startMonth).padStart(2, '0')}-01`;
  const last = new Date(year, endMonth, 0);
  const pe = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
  return { start: ps, end: pe };
}

const SLA_FORM_DEFAULTS: SLAConfigInput = {
  sla_hours: 24,
  business_hours_start: '09:00',
  business_hours_end: '17:00',
  business_days: [1, 2, 3, 4, 5],
  timezone: typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'America/New_York',
  escalation_to: [],
  escalation_email: false,
  is_active: false,
};

// ============================================================================
// Round-Robin Settings Tab
// ============================================================================

function RoundRobinSettings({
  orgReady,
  activeOrgId,
}: {
  orgReady: boolean;
  activeOrgId: string | null;
}) {
  const queryClient = useQueryClient();
  const { roundRobinService, supabase } = useCRMService();

  const configQuery = useQuery({
    queryKey: crmQueryKeys.roundRobinConfig(activeOrgId),
    queryFn: () => roundRobinService.getConfig(),
    enabled: orgReady && !!activeOrgId,
  });

  const orgMembersQuery = useQuery({
    queryKey: [...crmQueryKeys.org(activeOrgId), 'settingsOrgMembers'],
    queryFn: () => fetchSettingsOrgMembers(supabase, activeOrgId!),
    enabled: orgReady && !!activeOrgId,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: RoundRobinConfigInput) => {
      const row = await roundRobinService.upsertConfig(input);
      if (!row) throw new Error('save failed');
      return row;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.roundRobinConfig(activeOrgId) });
      toast.success('Round-robin updated');
    },
    onError: () => toast.error('Failed to save round-robin settings'),
  });

  const c = configQuery.data;
  const mergePatch = (patch: RoundRobinConfigInput): RoundRobinConfigInput => ({
    is_active: patch.is_active ?? c?.is_active ?? false,
    pool_members: patch.pool_members ?? c?.pool_members ?? [],
    tie_breaking_rule: patch.tie_breaking_rule ?? c?.tie_breaking_rule ?? 'sequential',
    skip_unavailable: patch.skip_unavailable ?? c?.skip_unavailable ?? false,
  });

  const persist = (patch: RoundRobinConfigInput) => {
    saveMutation.mutate(mergePatch(patch));
  };

  const poolIds = new Set((c?.pool_members ?? []).map((m) => m.user_id));
  const addOptions =
    orgMembersQuery.data?.filter((m) => !poolIds.has(m.user_id)) ?? [];

  const setMemberPaused = (userId: string, paused: boolean) => {
    const pool = [...(c?.pool_members ?? [])];
    const idx = pool.findIndex((m) => m.user_id === userId);
    if (idx < 0) return;
    pool[idx] = { ...pool[idx], is_paused: paused };
    persist({ pool_members: pool });
  };

  const removeMember = (userId: string) => {
    persist({
      pool_members: (c?.pool_members ?? []).filter((m) => m.user_id !== userId),
    });
  };

  const addMember = (userId: string) => {
    const om = orgMembersQuery.data?.find((x) => x.user_id === userId);
    if (!om) return;
    const next: PoolMember = {
      user_id: om.user_id,
      name: om.full_name,
      email: om.email,
      is_active: true,
      is_paused: false,
    };
    persist({ pool_members: [...(c?.pool_members ?? []), next] });
  };

  if (configQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-th-text-primary">Round-Robin Assignment</h2>
        <p className="text-sm text-th-text-tertiary mt-0.5">
          Pool members, tie-breaking, and enablement for lead assignment
        </p>
      </div>

      <label className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
        <div>
          <p className="font-medium text-th-text-primary">Enable round-robin</p>
          <p className="text-sm text-th-text-tertiary">When off, automatic pool assignment is skipped</p>
        </div>
        <input
          type="checkbox"
          checked={c?.is_active ?? false}
          onChange={(e) => persist({ is_active: e.target.checked })}
          disabled={saveMutation.isPending}
          className="w-5 h-5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
        />
      </label>

      <div>
        <label htmlFor="rr-tie-break" className="block text-sm text-th-text-tertiary mb-1">
          Tie-breaking rule
        </label>
        <select
          id="rr-tie-break"
          value={c?.tie_breaking_rule ?? 'sequential'}
          onChange={(e) =>
            persist({
              tie_breaking_rule: e.target.value as 'sequential' | 'least_leads' | 'random',
            })
          }
          disabled={saveMutation.isPending}
          className="w-full max-w-md border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
        >
          <option value="sequential">Sequential</option>
          <option value="least_leads">Least leads</option>
          <option value="random">Random</option>
        </select>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-th-text-primary mb-2">Pool members</h3>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="rr-add-member" className="block text-xs text-th-text-tertiary mb-1">
              Add member
            </label>
            <select
              id="rr-add-member"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                if (v) {
                  addMember(v);
                  e.target.value = '';
                }
              }}
              disabled={saveMutation.isPending || addOptions.length === 0}
              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
            >
              <option value="">Select user…</option>
              {addOptions.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name} ({m.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {(c?.pool_members ?? []).length === 0 ? (
            <p className="text-sm text-th-text-tertiary py-4">No members in the pool yet.</p>
          ) : (
            (c?.pool_members ?? []).map((m: PoolMember) => (
              <div
                key={m.user_id}
                className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary gap-3 flex-wrap"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-th-text-primary truncate">{m.name}</p>
                    {m.is_paused && (
                      <span className="text-xs text-amber-600 font-medium shrink-0">Paused</span>
                    )}
                  </div>
                  <p className="text-xs text-th-text-tertiary truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setMemberPaused(m.user_id, !m.is_paused)}
                    disabled={saveMutation.isPending}
                    className="p-2 rounded-lg border border-th-border text-th-text-secondary hover:bg-surface-tertiary"
                    title={m.is_paused ? 'Resume' : 'Pause'}
                  >
                    {m.is_paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMember(m.user_id)}
                    disabled={saveMutation.isPending}
                    className="p-2 rounded-lg text-th-text-tertiary hover:text-red-600"
                    aria-label={`Remove ${m.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SLA Settings Tab
// ============================================================================

const WEEKDAY_OPTS: { dow: number; label: string }[] = [
  { dow: 1, label: 'Mon' },
  { dow: 2, label: 'Tue' },
  { dow: 3, label: 'Wed' },
  { dow: 4, label: 'Thu' },
  { dow: 5, label: 'Fri' },
  { dow: 6, label: 'Sat' },
  { dow: 0, label: 'Sun' },
];

function SLASettings({
  orgReady,
  activeOrgId,
}: {
  orgReady: boolean;
  activeOrgId: string | null;
}) {
  const queryClient = useQueryClient();
  const { slaService, supabase } = useCRMService();

  const slaQuery = useQuery({
    queryKey: crmQueryKeys.slaConfig(activeOrgId),
    queryFn: () => slaService.getConfig(),
    enabled: orgReady && !!activeOrgId,
  });

  const orgMembersQuery = useQuery({
    queryKey: [...crmQueryKeys.org(activeOrgId), 'settingsOrgMembersSla'],
    queryFn: () => fetchSettingsOrgMembers(supabase, activeOrgId!),
    enabled: orgReady && !!activeOrgId,
  });

  const [form, setForm] = useState<SLAConfigInput>(SLA_FORM_DEFAULTS);

  useEffect(() => {
    if (!slaQuery.isSuccess) return;
    const row = slaQuery.data;
    if (row) {
      setForm({
        sla_hours: row.sla_hours,
        business_hours_start: row.business_hours_start,
        business_hours_end: row.business_hours_end,
        business_days: [...row.business_days].sort((a, b) => a - b),
        timezone: row.timezone,
        escalation_to: [...row.escalation_to],
        escalation_email: row.escalation_email,
        is_active: row.is_active,
      });
    } else {
      setForm({ ...SLA_FORM_DEFAULTS });
    }
  }, [slaQuery.isSuccess, slaQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (input: SLAConfigInput) => {
      const row = await slaService.upsertConfig(input);
      if (!row) throw new Error('save failed');
      return row;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.slaConfig(activeOrgId) });
      toast.success('SLA settings saved');
    },
    onError: () => toast.error('Failed to save SLA settings'),
  });

  const toggleBusinessDay = (dow: number) => {
    setForm((prev) => {
      const days = prev.business_days ?? [];
      const has = days.includes(dow);
      return {
        ...prev,
        business_days: has ? days.filter((d) => d !== dow) : [...days, dow].sort((a, b) => a - b),
      };
    });
  };

  const toggleEscalationUser = (userId: string) => {
    setForm((prev) => {
      const cur = prev.escalation_to ?? [];
      const has = cur.includes(userId);
      return {
        ...prev,
        escalation_to: has ? cur.filter((id) => id !== userId) : [...cur, userId],
      };
    });
  };

  const handleSave = () => saveMutation.mutate(form);

  if (slaQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-th-text-primary">SLA</h2>
          <p className="text-sm text-th-text-tertiary mt-0.5">
            Response-time targets, business hours, and escalation
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      <label className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
        <div>
          <p className="font-medium text-th-text-primary">Enable SLA tracking</p>
          <p className="text-sm text-th-text-tertiary">Tasks and breach checks use these rules when on</p>
        </div>
        <input
          type="checkbox"
          checked={form.is_active ?? false}
          onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
          className="w-5 h-5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
        />
      </label>

      <div>
        <label htmlFor="sla-hours" className="block text-sm text-th-text-tertiary mb-1">
          SLA (business hours)
        </label>
        <input
          id="sla-hours"
          type="number"
          min={1}
          value={form.sla_hours ?? 24}
          onChange={(e) => setForm((p) => ({ ...p, sla_hours: Number(e.target.value) || 1 }))}
          className="w-32 border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div>
          <label htmlFor="sla-bh-start" className="block text-sm text-th-text-tertiary mb-1">
            Business hours start
          </label>
          <input
            id="sla-bh-start"
            type="time"
            value={form.business_hours_start ?? '09:00'}
            onChange={(e) => setForm((p) => ({ ...p, business_hours_start: e.target.value }))}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
          />
        </div>
        <div>
          <label htmlFor="sla-bh-end" className="block text-sm text-th-text-tertiary mb-1">
            Business hours end
          </label>
          <input
            id="sla-bh-end"
            type="time"
            value={form.business_hours_end ?? '17:00'}
            onChange={(e) => setForm((p) => ({ ...p, business_hours_end: e.target.value }))}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
          />
        </div>
      </div>

      <div>
        <p className="text-sm text-th-text-tertiary mb-2">Business days</p>
        <div className="flex flex-wrap gap-3">
          {WEEKDAY_OPTS.map(({ dow, label }) => (
            <label key={dow} className="flex items-center gap-2 text-sm text-th-text-primary cursor-pointer">
              <input
                type="checkbox"
                checked={(form.business_days ?? []).includes(dow)}
                onChange={() => toggleBusinessDay(dow)}
                className="w-4 h-4 rounded border-th-border text-th-accent-600"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="sla-tz" className="block text-sm text-th-text-tertiary mb-1">
          Timezone
        </label>
        <select
          id="sla-tz"
          value={form.timezone ?? SLA_FORM_DEFAULTS.timezone}
          onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
          aria-label="SLA timezone"
          className="w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
        >
          {(Intl.supportedValuesOf?.('timeZone') ?? [form.timezone ?? 'UTC']).map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-sm font-medium text-th-text-primary mb-2">Escalation contacts</p>
        <p className="text-xs text-th-text-tertiary mb-3">Users notified on SLA breach</p>
        <div className="space-y-2 max-h-48 overflow-y-auto rounded-xl border border-th-border p-3 bg-surface-secondary">
          {(orgMembersQuery.data ?? []).map((m) => (
            <label
              key={m.user_id}
              className="flex items-center gap-2 text-sm text-th-text-primary cursor-pointer"
            >
              <input
                type="checkbox"
                checked={(form.escalation_to ?? []).includes(m.user_id)}
                onChange={() => toggleEscalationUser(m.user_id)}
                className="w-4 h-4 rounded border-th-border text-th-accent-600"
              />
              <span className="truncate">{m.full_name}</span>
              <span className="text-th-text-tertiary text-xs truncate">{m.email}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary">
        <div>
          <p className="font-medium text-th-text-primary">Escalation email</p>
          <p className="text-sm text-th-text-tertiary">Send email when escalating breaches</p>
        </div>
        <input
          type="checkbox"
          checked={form.escalation_email ?? false}
          onChange={(e) => setForm((p) => ({ ...p, escalation_email: e.target.checked }))}
          className="w-5 h-5 rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
        />
      </label>
    </div>
  );
}

// ============================================================================
// Cadence Settings Tab
// ============================================================================

const CADENCE_ACTIONS: CadenceStep['action_type'][] = [
  'call',
  'email',
  'sms',
  'linkedin_message',
  'task',
];

function CadenceSettings({
  orgReady,
  activeOrgId,
}: {
  orgReady: boolean;
  activeOrgId: string | null;
}) {
  const queryClient = useQueryClient();
  const { cadenceService, templateService } = useCRMService();

  const cadencesQuery = useQuery({
    queryKey: crmQueryKeys.cadences(activeOrgId),
    queryFn: () => cadenceService.getCadences(),
    enabled: orgReady && !!activeOrgId,
  });

  const templatesQuery = useQuery({
    queryKey: [...crmQueryKeys.org(activeOrgId), 'cadenceTemplates'],
    queryFn: () => templateService.listTemplates({ is_active: true }),
    enabled: orgReady && !!activeOrgId,
  });

  const [editing, setEditing] = useState<FollowUpCadence | 'new' | null>(null);
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<CadenceStep[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setEditing(null);
    setName('');
    setSteps([]);
    setIsDefault(false);
    setIsActive(true);
  };

  const openNew = () => {
    setEditing('new');
    setName('');
    setSteps([{ delay_hours: 24, action_type: 'email' }]);
    setIsDefault(false);
    setIsActive(true);
  };

  const openEdit = (cad: FollowUpCadence) => {
    setEditing(cad);
    setName(cad.name);
    setSteps(cad.steps?.length ? [...cad.steps] : [{ delay_hours: 24, action_type: 'email' }]);
    setIsDefault(cad.is_default);
    setIsActive(cad.is_active);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      cadenceService.createCadence({
        name: name.trim() || 'Untitled cadence',
        steps,
        is_default: isDefault,
        is_active: isActive,
      }),
    onSuccess: (row) => {
      if (!row) {
        toast.error('Failed to create cadence');
        return;
      }
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.cadences(activeOrgId) });
      toast.success('Cadence created');
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      cadenceService.updateCadence(id, {
        name: name.trim() || 'Untitled cadence',
        steps,
        is_default: isDefault,
        is_active: isActive,
      }),
    onSuccess: (row) => {
      if (!row) {
        toast.error('Failed to update cadence');
        return;
      }
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.cadences(activeOrgId) });
      toast.success('Cadence updated');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cadenceService.deleteCadence(id),
    onSuccess: (ok, id) => {
      if (!ok) {
        toast.error('Failed to delete cadence');
        return;
      }
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.cadences(activeOrgId) });
      toast.success('Cadence deleted');
      if (editing !== 'new' && editing && editing.id === id) resetForm();
    },
  });

  const updateStep = (index: number, patch: Partial<CadenceStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addStep = () => {
    setSteps((prev) => [...prev, { delay_hours: 48, action_type: 'call' }]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const templates: CRMTemplate[] = templatesQuery.data ?? [];

  if (cadencesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-th-text-primary">Follow-up cadences</h2>
          <p className="text-sm text-th-text-tertiary mt-0.5">Sequences of timed actions for leads</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700"
        >
          <Plus className="w-4 h-4" />
          New cadence
        </button>
      </div>

      {editing && (
        <div className="p-4 rounded-xl border border-th-border bg-surface-secondary space-y-4">
          <h3 className="text-sm font-semibold text-th-text-primary">
            {editing === 'new' ? 'New cadence' : 'Edit cadence'}
          </h3>
          <div>
            <label htmlFor="cad-name" className="block text-xs text-th-text-tertiary mb-1">
              Name
            </label>
            <input
              id="cad-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-th-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-th-border text-th-accent-600"
            />
            Default cadence
          </label>
          <label className="flex items-center gap-2 text-sm text-th-text-primary cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-th-border text-th-accent-600"
            />
            Active
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-th-text-primary">Steps</p>
              <button
                type="button"
                onClick={addStep}
                className="text-xs text-th-accent-600 font-medium hover:underline"
              >
                Add step
              </button>
            </div>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-lg border border-th-border bg-surface-primary items-end"
                >
                  <div className="md:col-span-2">
                    <label className="block text-xs text-th-text-tertiary mb-1">Delay (hrs)</label>
                    <input
                      type="number"
                      min={0}
                      value={step.delay_hours}
                      onChange={(e) =>
                        updateStep(i, { delay_hours: Number(e.target.value) || 0 })
                      }
                      className="w-full border border-th-border rounded-lg px-2 py-1.5 text-sm bg-surface-secondary text-th-text-primary"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-th-text-tertiary mb-1">Action</label>
                    <select
                      value={step.action_type}
                      onChange={(e) =>
                        updateStep(i, {
                          action_type: e.target.value as CadenceStep['action_type'],
                        })
                      }
                      className="w-full border border-th-border rounded-lg px-2 py-1.5 text-sm bg-surface-secondary text-th-text-primary"
                    >
                      {CADENCE_ACTIONS.map((a) => (
                        <option key={a} value={a}>
                          {a.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-xs text-th-text-tertiary mb-1">
                      Template (optional)
                    </label>
                    <select
                      value={step.template_id ?? ''}
                      onChange={(e) =>
                        updateStep(i, {
                          template_id: e.target.value || undefined,
                        })
                      }
                      className="w-full border border-th-border rounded-lg px-2 py-1.5 text-sm bg-surface-secondary text-th-text-primary"
                    >
                      <option value="">None</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="p-2 text-th-text-tertiary hover:text-red-600"
                      aria-label="Remove step"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                editing === 'new'
                  ? createMutation.mutate()
                  : updateMutation.mutate((editing as FollowUpCadence).id)
              }
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                steps.length === 0
              }
              className="px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {editing === 'new' ? 'Create' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-th-border rounded-lg text-sm text-th-text-secondary"
            >
              Cancel
            </button>
            {editing !== 'new' && (
              <button
                type="button"
                onClick={() => {
                  const id = (editing as FollowUpCadence).id;
                  if (confirm('Delete this cadence?')) deleteMutation.mutate(id);
                }}
                className="px-4 py-2 text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {(cadencesQuery.data ?? []).map((cad) => (
          <div
            key={cad.id}
            className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary hover:bg-surface-tertiary/50 transition-colors"
          >
            <div>
              <p className="font-medium text-th-text-primary">{cad.name}</p>
              <p className="text-xs text-th-text-tertiary">
                {cad.steps?.length ?? 0} steps
                {cad.is_default ? ' · Default' : ''}
                {!cad.is_active ? ' · Inactive' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openEdit(cad)}
              className="px-3 py-1.5 text-sm border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-primary"
            >
              Edit
            </button>
          </div>
        ))}
        {(cadencesQuery.data ?? []).length === 0 && !editing && (
          <p className="text-sm text-th-text-tertiary py-4">No cadences yet.</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Targets Settings Tab
// ============================================================================

function TargetsSettings({
  orgReady,
  activeOrgId,
}: {
  orgReady: boolean;
  activeOrgId: string | null;
}) {
  const queryClient = useQueryClient();
  const { targetsService, supabase } = useCRMService();

  const orgMembersQuery = useQuery({
    queryKey: [...crmQueryKeys.org(activeOrgId), 'settingsOrgMembersTargets'],
    queryFn: () => fetchSettingsOrgMembers(supabase, activeOrgId!),
    enabled: orgReady && !!activeOrgId,
  });

  const defaultYm = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [repId, setRepId] = useState<string>('');
  const [monthYm, setMonthYm] = useState(defaultYm);
  const [quarterYear, setQuarterYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(
    (Math.floor(new Date().getMonth() / 3) + 1) as 1 | 2 | 3 | 4,
  );

  const monthRange = useMemo(() => getMonthDateRange(monthYm), [monthYm]);
  const quarterRange = useMemo(
    () => getQuarterDateRange(quarterYear, quarter),
    [quarterYear, quarter],
  );

  const monthlyQuery = useQuery({
    queryKey: [
      ...crmQueryKeys.activityTargets(activeOrgId),
      'monthly_rep',
      repId,
      monthRange.start,
    ],
    queryFn: () =>
      targetsService.getTargets({
        type: 'monthly_rep',
        repId,
        periodStart: monthRange.start,
      }),
    enabled: orgReady && !!activeOrgId && !!repId,
  });

  const [monthlyDraft, setMonthlyDraft] = useState<Record<string, number>>(DEFAULT_MONTHLY_TARGETS);

  useEffect(() => {
    if (!monthlyQuery.isSuccess || !repId) return;
    const rows = monthlyQuery.data ?? [];
    const row = rows.find(
      (r) =>
        r.period_start === monthRange.start &&
        r.period_end === monthRange.end &&
        r.rep_id === repId,
    );
    const base = { ...DEFAULT_MONTHLY_TARGETS };
    if (row) Object.assign(base, row.targets);
    setMonthlyDraft(base);
  }, [monthlyQuery.isSuccess, monthlyQuery.data, repId, monthRange.start, monthRange.end]);

  const saveMonthlyMutation = useMutation({
    mutationFn: async () => {
      const rows = await targetsService.getTargets({
        type: 'monthly_rep',
        repId,
        periodStart: monthRange.start,
      });
      const existing = rows.find(
        (r) =>
          r.period_start === monthRange.start &&
          r.period_end === monthRange.end &&
          r.rep_id === repId,
      );
      if (existing) {
        const u = await targetsService.updateTarget(existing.id, { targets: monthlyDraft });
        if (!u) throw new Error('update failed');
        return u;
      }
      const c = await targetsService.createTarget({
        target_type: 'monthly_rep',
        rep_id: repId,
        period_start: monthRange.start,
        period_end: monthRange.end,
        targets: monthlyDraft,
      });
      if (!c) throw new Error('create failed');
      return c;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.activityTargets(activeOrgId) });
      toast.success('Monthly targets saved');
    },
    onError: () => toast.error('Failed to save monthly targets'),
  });

  const quarterlyQuery = useQuery({
    queryKey: [
      ...crmQueryKeys.activityTargets(activeOrgId),
      'quarterly_team',
      quarterYear,
      quarter,
    ],
    queryFn: () =>
      targetsService.getTargets({
        type: 'quarterly_team',
        periodStart: quarterRange.start,
      }),
    enabled: orgReady && !!activeOrgId,
  });

  const defaultQuarterly = useMemo(
    () => ({ ...(QUARTERLY_TEAM_TARGETS[quarter] ?? {}) }),
    [quarter],
  );

  const [quarterlyDraft, setQuarterlyDraft] = useState<Record<string, number>>(defaultQuarterly);

  useEffect(() => {
    setQuarterlyDraft({ ...(QUARTERLY_TEAM_TARGETS[quarter] ?? {}) });
  }, [quarter]);

  useEffect(() => {
    if (!quarterlyQuery.isSuccess) return;
    const rows = quarterlyQuery.data ?? [];
    const row = rows.find(
      (r) =>
        r.target_type === 'quarterly_team' &&
        r.period_start === quarterRange.start &&
        r.period_end === quarterRange.end,
    );
    const base = { ...(QUARTERLY_TEAM_TARGETS[quarter] ?? {}) };
    if (row) Object.assign(base, row.targets);
    setQuarterlyDraft(base);
  }, [quarterlyQuery.isSuccess, quarterlyQuery.data, quarter, quarterRange.start, quarterRange.end]);

  const saveQuarterlyMutation = useMutation({
    mutationFn: async () => {
      const rows = await targetsService.getTargets({
        type: 'quarterly_team',
        periodStart: quarterRange.start,
      });
      const existing = rows.find(
        (r) =>
          r.period_start === quarterRange.start &&
          r.period_end === quarterRange.end,
      );
      if (existing) {
        const u = await targetsService.updateTarget(existing.id, { targets: quarterlyDraft });
        if (!u) throw new Error('update failed');
        return u;
      }
      const c = await targetsService.createTarget({
        target_type: 'quarterly_team',
        period_start: quarterRange.start,
        period_end: quarterRange.end,
        targets: quarterlyDraft,
      });
      if (!c) throw new Error('create failed');
      return c;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmQueryKeys.activityTargets(activeOrgId) });
      toast.success('Quarterly team targets saved');
    },
    onError: () => toast.error('Failed to save quarterly targets'),
  });

  const activityTypeKeys = Object.keys(DEFAULT_MONTHLY_TARGETS);
  const quarterlyKeys = Object.keys(quarterlyDraft);

  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-th-text-primary">Activity targets</h2>
        <p className="text-sm text-th-text-tertiary mt-0.5">
          Monthly per-rep goals and quarterly team totals
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-th-text-primary">Monthly rep targets</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="tgt-rep" className="block text-xs text-th-text-tertiary mb-1">
              Rep
            </label>
            <select
              id="tgt-rep"
              value={repId}
              onChange={(e) => setRepId(e.target.value)}
              className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary min-w-[200px]"
            >
              <option value="">Select rep…</option>
              {(orgMembersQuery.data ?? []).map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tgt-month" className="block text-xs text-th-text-tertiary mb-1">
              Month
            </label>
            <input
              id="tgt-month"
              type="month"
              value={monthYm}
              onChange={(e) => setMonthYm(e.target.value)}
              className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => saveMonthlyMutation.mutate()}
            disabled={!repId || saveMonthlyMutation.isPending || monthlyQuery.isLoading}
            className="px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Save monthly
          </button>
        </div>

        {repId && (
          <div className="overflow-x-auto rounded-xl border border-th-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-secondary text-left text-th-text-tertiary">
                  <th className="px-3 py-2 font-medium">Activity type</th>
                  <th className="px-3 py-2 font-medium">Target</th>
                </tr>
              </thead>
              <tbody>
                {activityTypeKeys.map((key) => (
                  <tr key={key} className="border-t border-th-border">
                    <td className="px-3 py-2 text-th-text-primary font-mono text-xs">{key}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={monthlyDraft[key] ?? 0}
                        onChange={(e) =>
                          setMonthlyDraft((d) => ({
                            ...d,
                            [key]: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-24 border border-th-border rounded-lg px-2 py-1 bg-surface-primary text-th-text-primary"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-th-text-primary">Quarterly team targets</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label htmlFor="tgt-q" className="block text-xs text-th-text-tertiary mb-1">
              Quarter
            </label>
            <select
              id="tgt-q"
              value={quarter}
              onChange={(e) => setQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)}
              className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
            >
              <option value={1}>Q1</option>
              <option value={2}>Q2</option>
              <option value={3}>Q3</option>
              <option value={4}>Q4</option>
            </select>
          </div>
          <div>
            <label htmlFor="tgt-y" className="block text-xs text-th-text-tertiary mb-1">
              Year
            </label>
            <input
              id="tgt-y"
              type="number"
              value={quarterYear}
              onChange={(e) => setQuarterYear(Number(e.target.value) || new Date().getFullYear())}
              className="w-28 border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary text-th-text-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => saveQuarterlyMutation.mutate()}
            disabled={saveQuarterlyMutation.isPending || quarterlyQuery.isLoading}
            className="px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Save quarterly
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quarterlyKeys.map((key) => (
            <div key={key} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-surface-secondary">
              <label htmlFor={`qt-${key}`} className="text-sm text-th-text-primary font-mono text-xs">
                {key}
              </label>
              <input
                id={`qt-${key}`}
                type="number"
                min={0}
                value={quarterlyDraft[key] ?? 0}
                onChange={(e) =>
                  setQuarterlyDraft((d) => ({
                    ...d,
                    [key]: Number(e.target.value) || 0,
                  }))
                }
                className="w-24 border border-th-border rounded-lg px-2 py-1 bg-surface-primary text-th-text-primary"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

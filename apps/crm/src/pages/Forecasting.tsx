import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Zap } from 'lucide-react';
import { GradientHeader } from '@mpbhealth/ui';
import toast from 'react-hot-toast';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { ForecastKpiCards } from '../components/forecasting/ForecastKpiCards';
import { ForecastTable } from '../components/forecasting/ForecastTable';
import { ForecastCharts } from '../components/forecasting/ForecastCharts';
import { CreateForecastModal } from '../components/forecasting/CreateForecastModal';
import { DealStageMetricsDisplay } from '../components/forecasting/DealStageMetrics';
import type {
  Forecast,
  ForecastEntryWithDeal,
  ForecastSummary,
  ForecastCreateInput,
  ForecastCategory,
  DealStageMetrics,
} from '@mpbhealth/crm-core';

const EMPTY_SUMMARY: ForecastSummary = {
  total_pipeline: 0,
  committed: 0,
  best_case: 0,
  pipeline: 0,
  omitted: 0,
  closed_won: 0,
  weighted_total: 0,
  deal_count: 0,
  forecast_accuracy: null,
};

export default function Forecasting() {
  const { forecastingService } = useCRM();
  const { activeOrgId } = useOrg();

  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(null);
  const [entries, setEntries] = useState<ForecastEntryWithDeal[]>([]);
  const [summary, setSummary] = useState<ForecastSummary>(EMPTY_SUMMARY);
  const [stageMetrics, setStageMetrics] = useState<DealStageMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load forecasts
  const loadForecasts = useCallback(async () => {
    if (!activeOrgId) return;
    setLoading(true);
    const [fcs, metrics] = await Promise.all([
      forecastingService.getForecasts(activeOrgId),
      forecastingService.getDealStageMetrics(activeOrgId),
    ]);
    setForecasts(fcs);
    setStageMetrics(metrics);

    // Auto-select the most recent active or draft forecast
    const active = fcs.find((f) => f.status === 'active') || fcs[0] || null;
    if (active && (!selectedForecast || !fcs.find((f) => f.id === selectedForecast.id))) {
      setSelectedForecast(active);
    }
    setLoading(false);
  }, [activeOrgId, forecastingService, selectedForecast]);

  // Load forecast entries when selection changes
  const loadForecastEntries = useCallback(async () => {
    if (!selectedForecast) {
      setEntries([]);
      setSummary(EMPTY_SUMMARY);
      return;
    }
    setEntriesLoading(true);
    const [{ entries: e }, s] = await Promise.all([
      forecastingService.getForecast(selectedForecast.id),
      forecastingService.getForecastSummary(selectedForecast.id),
    ]);
    setEntries(e);
    setSummary(s);
    setEntriesLoading(false);
  }, [selectedForecast, forecastingService]);

  useEffect(() => {
    loadForecasts();
  }, [loadForecasts]);

  useEffect(() => {
    loadForecastEntries();
  }, [loadForecastEntries]);

  // Create forecast
  const handleCreate = async (input: ForecastCreateInput) => {
    if (!activeOrgId) return;
    const forecast = await forecastingService.createForecast(activeOrgId, input);
    if (forecast) {
      toast.success('Forecast created');
      setSelectedForecast(forecast);
      await loadForecasts();
    } else {
      toast.error('Failed to create forecast');
    }
  };

  // Auto-populate entries
  const handleAutoPopulate = async () => {
    if (!selectedForecast) return;
    const count = await forecastingService.autoPopulateEntries(selectedForecast.id);
    if (count > 0) {
      toast.success(`Added ${count} deal${count !== 1 ? 's' : ''} to forecast`);
      await loadForecastEntries();
    } else {
      toast.success('No new deals to add for this period');
    }
  };

  // Update entry category
  const handleCategoryChange = async (entryId: string, category: ForecastCategory) => {
    const result = await forecastingService.updateForecastEntry(entryId, { forecast_category: category });
    if (result) {
      // Optimistic update
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, forecast_category: category } : e))
      );
      // Refresh summary
      if (selectedForecast) {
        const s = await forecastingService.getForecastSummary(selectedForecast.id);
        setSummary(s);
      }
    } else {
      toast.error('Failed to update category');
    }
  };

  return (
    <div className="space-y-6">
      <GradientHeader
        title="Sales Forecasting"
        subtitle="Track pipeline, forecast revenue, and analyze deal performance"
      />

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Forecast Selector */}
          {forecasts.length > 0 && (
            <select
              value={selectedForecast?.id || ''}
              onChange={(e) => {
                const fc = forecasts.find((f) => f.id === e.target.value);
                setSelectedForecast(fc || null);
              }}
              className="px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              {forecasts.map((fc) => (
                <option key={fc.id} value={fc.id}>
                  {fc.name} ({fc.status})
                </option>
              ))}
            </select>
          )}

          {selectedForecast && (
            <button
              onClick={handleAutoPopulate}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-th-text-secondary border border-th-border rounded-lg hover:bg-surface-tertiary transition-colors"
            >
              <Zap className="w-4 h-4" />
              Auto-populate Deals
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadForecasts();
              loadForecastEntries();
            }}
            className="p-2 text-th-text-tertiary hover:text-th-text-primary rounded-lg hover:bg-surface-tertiary transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Forecast
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <ForecastKpiCards summary={summary} loading={loading || entriesLoading} />

      {/* Forecast Table */}
      {selectedForecast ? (
        <div>
          <h2 className="text-lg font-semibold text-th-text-primary mb-3">
            {selectedForecast.name}
            <span className="ml-2 text-xs font-normal text-th-text-tertiary">
              {new Date(selectedForecast.period_start).toLocaleDateString()} -{' '}
              {new Date(selectedForecast.period_end).toLocaleDateString()}
            </span>
          </h2>
          <ForecastTable
            entries={entries}
            onCategoryChange={handleCategoryChange}
            loading={entriesLoading}
          />
        </div>
      ) : (
        !loading && (
          <div className="bg-surface-primary border border-th-border rounded-xl p-12 text-center">
            <p className="text-th-text-tertiary mb-3">No forecasts created yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Forecast
            </button>
          </div>
        )
      )}

      {/* Charts */}
      <ForecastCharts
        summary={summary}
        stageMetrics={stageMetrics}
        loading={loading}
      />

      {/* Stage Metrics */}
      <DealStageMetricsDisplay metrics={stageMetrics} loading={loading} />

      {/* Create Modal */}
      <CreateForecastModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

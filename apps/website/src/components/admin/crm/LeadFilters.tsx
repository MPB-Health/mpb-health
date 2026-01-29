import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import type { LeadFilters as LeadFiltersType, PipelineStage } from '../../../lib/crmService';
import { crmService } from '../../../lib/crmService';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

interface LeadFiltersProps {
  filters: LeadFiltersType;
  onFiltersChange: (filters: LeadFiltersType) => void;
  showSearch?: boolean;
  compact?: boolean;
}

export const LeadFilters: React.FC<LeadFiltersProps> = ({
  filters,
  onFiltersChange,
  showSearch = true,
  compact = false,
}) => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    const data = await crmService.getPipelineStages();
    setStages(data);
  };

  const updateFilter = (key: keyof LeadFiltersType, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-600' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-600' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-600' },
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search leads..."
              className="pl-9 pr-3 py-2 w-48 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        )}

        <select
          value={filters.stage || ''}
          onChange={(e) => updateFilter('stage', e.target.value)}
          className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Stages</option>
          {stages.map((stage) => (
            <option key={stage.name} value={stage.name}>
              {stage.display_name}
            </option>
          ))}
        </select>

        <select
          value={filters.priority || ''}
          onChange={(e) => updateFilter('priority', e.target.value)}
          className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Priorities</option>
          {priorities.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      {/* Search Bar */}
      {showSearch && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      )}

      {/* Filter Toggles */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          <Filter className="h-4 w-4" />
          {showAdvanced ? 'Hide Filters' : 'Show Filters'}
        </button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-neutral-200">
          {/* Stage Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Pipeline Stage
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter('stage', undefined)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  !filters.stage
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                All
              </button>
              {stages.map((stage) => (
                <button
                  key={stage.name}
                  onClick={() => updateFilter('stage', stage.name)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    filters.stage === stage.name
                      ? 'text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                  style={filters.stage === stage.name ? { backgroundColor: stage.color } : undefined}
                >
                  {stage.display_name}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter('priority', undefined)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  !filters.priority
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                All
              </button>
              {priorities.map((p) => (
                <button
                  key={p.value}
                  onClick={() => updateFilter('priority', p.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    filters.priority === p.value
                      ? p.color
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">From</label>
                <input
                  type="date"
                  value={filters.dateFrom?.split('T')[0] || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">To</label>
                <input
                  type="date"
                  value={filters.dateTo?.split('T')[0] || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-200">
          {filters.stage && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              Stage: {stages.find(s => s.name === filters.stage)?.display_name || filters.stage}
              <button onClick={() => updateFilter('stage', undefined)} className="hover:text-primary-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.priority && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              Priority: {filters.priority}
              <button onClick={() => updateFilter('priority', undefined)} className="hover:text-primary-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.dateFrom && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              From: {new Date(filters.dateFrom).toLocaleDateString()}
              <button onClick={() => updateFilter('dateFrom', undefined)} className="hover:text-primary-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.dateTo && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              To: {new Date(filters.dateTo).toLocaleDateString()}
              <button onClick={() => updateFilter('dateTo', undefined)} className="hover:text-primary-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              Search: "{filters.search}"
              <button onClick={() => updateFilter('search', undefined)} className="hover:text-primary-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadFilters;

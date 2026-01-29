// ============================================================================
// Saved Views Toolbar
// Unified toolbar for list pages with saved views, filters, segments, and export
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import {
  BookmarkPlus,
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  Download,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  Edit2,
  Check,
  X,
  Plus,
  RefreshCw,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Types
// ============================================================================

export interface SavedView {
  id: string;
  name: string;
  filters: FilterCondition[];
  columns?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isDefault?: boolean;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  value: string | number | string[] | null;
  label?: string;
}

export interface FilterField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  options?: { value: string; label: string }[];
}

interface SavedViewsToolbarProps {
  // Views
  savedViews: SavedView[];
  activeView?: SavedView | null;
  onViewChange: (view: SavedView | null) => void;
  onViewSave: (view: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onViewDelete?: (viewId: string) => void;
  onViewUpdate?: (viewId: string, updates: Partial<SavedView>) => void;

  // Filters
  availableFilters: FilterField[];
  activeFilters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;

  // Search
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;

  // View mode
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  showViewModeToggle?: boolean;

  // Export
  onExport?: () => void;
  showExport?: boolean;

  // Refresh
  onRefresh?: () => void;
  isRefreshing?: boolean;

  // Custom actions
  customActions?: React.ReactNode;
}

// ============================================================================
// Saved Views Toolbar Component
// ============================================================================

export function SavedViewsToolbar({
  savedViews,
  activeView,
  onViewChange,
  onViewSave,
  onViewDelete,
  onViewUpdate,
  availableFilters,
  activeFilters,
  onFiltersChange,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  viewMode = 'list',
  onViewModeChange,
  showViewModeToggle = true,
  onExport,
  showExport = true,
  onRefresh,
  isRefreshing = false,
  customActions,
}: SavedViewsToolbarProps) {
  const [showViewsDropdown, setShowViewsDropdown] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const viewsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (viewsRef.current && !viewsRef.current.contains(e.target as Node)) {
        setShowViewsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSaveView = () => {
    if (!newViewName.trim()) return;
    onViewSave({
      name: newViewName.trim(),
      filters: activeFilters,
    });
    setNewViewName('');
    setShowSaveViewModal(false);
  };

  const handleClearFilters = () => {
    onFiltersChange([]);
    onViewChange(null);
  };

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Main Toolbar Row */}
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
        {/* Saved Views Selector */}
        <div ref={viewsRef} className="relative">
          <button
            onClick={() => setShowViewsDropdown(!showViewsDropdown)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
              activeView
                ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{activeView?.name || 'All Records'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Views Dropdown */}
          {showViewsDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              {/* Default View */}
              <button
                onClick={() => {
                  onViewChange(null);
                  setShowViewsDropdown(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800',
                  !activeView && 'bg-violet-50 dark:bg-violet-900/30'
                )}
              >
                <LayoutGrid className="w-4 h-4 text-gray-400" />
                <span>All Records</span>
                {!activeView && <Check className="w-4 h-4 text-violet-600 ml-auto" />}
              </button>

              {/* Saved Views */}
              {savedViews.length > 0 && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase">
                    Saved Views
                  </div>
                  {savedViews.map((view) => (
                    <div
                      key={view.id}
                      className={cn(
                        'group flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800',
                        activeView?.id === view.id && 'bg-violet-50 dark:bg-violet-900/30'
                      )}
                    >
                      <button
                        onClick={() => {
                          onViewChange(view);
                          setShowViewsDropdown(false);
                        }}
                        className="flex-1 flex items-center gap-2 text-sm text-left"
                      >
                        {view.isPinned && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                        <span className="truncate">{view.name}</span>
                        {activeView?.id === view.id && (
                          <Check className="w-4 h-4 text-violet-600 ml-auto" />
                        )}
                      </button>
                      {onViewDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDelete(view.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Save Current View */}
              <div className="border-t border-gray-200 dark:border-gray-700 mt-1">
                <button
                  onClick={() => {
                    setShowViewsDropdown(false);
                    setShowSaveViewModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  Save Current View
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filters Button */}
        <button
          onClick={() => setShowFiltersPanel(!showFiltersPanel)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
            hasActiveFilters
              ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-violet-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilters.length}
            </span>
          )}
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 px-2 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        {onSearchChange && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
        )}

        {/* View Mode Toggle */}
        {showViewModeToggle && onViewModeChange && (
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              )}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              )}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
          </button>
        )}

        {/* Export */}
        {showExport && onExport && (
          <button
            onClick={onExport}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Custom Actions */}
        {customActions}
      </div>

      {/* Filters Panel */}
      {showFiltersPanel && (
        <FiltersPanel
          availableFilters={availableFilters}
          activeFilters={activeFilters}
          onFiltersChange={onFiltersChange}
          onClose={() => setShowFiltersPanel(false)}
        />
      )}

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 flex-wrap">
          {activeFilters.map((filter, index) => (
            <FilterPill
              key={index}
              filter={filter}
              availableFilters={availableFilters}
              onRemove={() => {
                onFiltersChange(activeFilters.filter((_, i) => i !== index));
              }}
            />
          ))}
        </div>
      )}

      {/* Save View Modal */}
      {showSaveViewModal && (
        <SaveViewModal
          viewName={newViewName}
          onViewNameChange={setNewViewName}
          onSave={handleSaveView}
          onClose={() => {
            setShowSaveViewModal(false);
            setNewViewName('');
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Filters Panel Component
// ============================================================================

interface FiltersPanelProps {
  availableFilters: FilterField[];
  activeFilters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  onClose: () => void;
}

function FiltersPanel({ availableFilters, activeFilters, onFiltersChange, onClose }: FiltersPanelProps) {
  const [pendingFilters, setPendingFilters] = useState<FilterCondition[]>(activeFilters);

  const handleAddFilter = () => {
    if (availableFilters.length === 0) return;
    setPendingFilters([
      ...pendingFilters,
      {
        field: availableFilters[0].id,
        operator: 'contains',
        value: '',
      },
    ]);
  };

  const handleApply = () => {
    onFiltersChange(pendingFilters.filter((f) => f.value !== '' && f.value !== null));
    onClose();
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 bg-gray-50 dark:bg-gray-800/50">
      <div className="space-y-3">
        {pendingFilters.map((filter, index) => (
          <div key={index} className="flex items-center gap-2">
            {/* Field Select */}
            <select
              value={filter.field}
              onChange={(e) => {
                const updated = [...pendingFilters];
                updated[index] = { ...filter, field: e.target.value };
                setPendingFilters(updated);
              }}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              {availableFilters.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Operator Select */}
            <select
              value={filter.operator}
              onChange={(e) => {
                const updated = [...pendingFilters];
                updated[index] = { ...filter, operator: e.target.value as FilterCondition['operator'] };
                setPendingFilters(updated);
              }}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="contains">contains</option>
              <option value="equals">equals</option>
              <option value="starts_with">starts with</option>
              <option value="ends_with">ends with</option>
              <option value="gt">greater than</option>
              <option value="lt">less than</option>
              <option value="is_null">is empty</option>
              <option value="is_not_null">is not empty</option>
            </select>

            {/* Value Input */}
            {!['is_null', 'is_not_null'].includes(filter.operator) && (
              <input
                type="text"
                value={filter.value as string || ''}
                onChange={(e) => {
                  const updated = [...pendingFilters];
                  updated[index] = { ...filter, value: e.target.value };
                  setPendingFilters(updated);
                }}
                placeholder="Value..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
            )}

            {/* Remove */}
            <button
              onClick={() => setPendingFilters(pendingFilters.filter((_, i) => i !== index))}
              className="p-2 text-gray-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Add Filter Button */}
        <button
          onClick={handleAddFilter}
          className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700"
        >
          <Plus className="w-4 h-4" />
          Add Filter
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Filter Pill Component
// ============================================================================

interface FilterPillProps {
  filter: FilterCondition;
  availableFilters: FilterField[];
  onRemove: () => void;
}

function FilterPill({ filter, availableFilters, onRemove }: FilterPillProps) {
  const field = availableFilters.find((f) => f.id === filter.field);
  const operatorLabels: Record<string, string> = {
    equals: '=',
    contains: 'contains',
    starts_with: 'starts with',
    ends_with: 'ends with',
    gt: '>',
    lt: '<',
    gte: '>=',
    lte: '<=',
    is_null: 'is empty',
    is_not_null: 'is not empty',
  };

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs">
      <span className="font-medium">{field?.label || filter.field}</span>
      <span className="text-violet-500">{operatorLabels[filter.operator]}</span>
      {filter.value !== null && <span>"{filter.value}"</span>}
      <button
        onClick={onRemove}
        className="ml-1 hover:text-violet-900 dark:hover:text-violet-100"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ============================================================================
// Save View Modal
// ============================================================================

interface SaveViewModalProps {
  viewName: string;
  onViewNameChange: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
}

function SaveViewModal({ viewName, onViewNameChange, onSave, onClose }: SaveViewModalProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Save Current View
        </h3>
        <input
          type="text"
          value={viewName}
          onChange={(e) => onViewNameChange(e.target.value)}
          placeholder="View name..."
          className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 mb-4"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!viewName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50"
          >
            Save View
          </button>
        </div>
      </div>
    </>
  );
}

export default SavedViewsToolbar;

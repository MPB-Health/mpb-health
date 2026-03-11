// ============================================================================
// Widget Catalog Component
// Browse and add widgets to the dashboard
// ============================================================================

import { useState } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { Modal } from '../Modal';
import { useDashboardStore } from '../../contexts/DashboardContext';
import { getAllWidgets, getWidgetCategories } from './widgets/widgetRegistry';
import type { WidgetConfig, WidgetCategory } from './types';
const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Types
// ============================================================================

interface WidgetCatalogProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Category Labels
// ============================================================================

const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  metrics: 'Metrics & KPIs',
  sales: 'Sales & Leads',
  productivity: 'Productivity',
  collaboration: 'Collaboration',
  insights: 'Analytics & Insights',
};

const CATEGORY_ORDER: WidgetCategory[] = [
  'metrics',
  'sales',
  'productivity',
  'insights',
  'collaboration',
];

// ============================================================================
// Widget Catalog Component
// ============================================================================

export function WidgetCatalog({ isOpen, onClose }: WidgetCatalogProps) {
  const { addWidget } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all');

  const allWidgets = getAllWidgets();
  const categories = getWidgetCategories();

  // Filter widgets
  const filteredWidgets = allWidgets.filter((widget) => {
    const matchesSearch =
      !searchQuery ||
      widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || widget.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group by category
  const widgetsByCategory = CATEGORY_ORDER.reduce((acc, category) => {
    const categoryWidgets = filteredWidgets.filter((w) => w.category === category);
    if (categoryWidgets.length > 0) {
      acc[category] = categoryWidgets;
    }
    return acc;
  }, {} as Record<string, WidgetConfig[]>);

  const handleAddWidget = (widgetId: string) => {
    addWidget(widgetId);
    onClose();
  };

  return (
    <Modal open={isOpen}
        title="Add Widget" onClose={onClose} size="lg">
      <div className="flex flex-col h-[80vh] max-h-[700px]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-th-border">
          <div>
            <h2 className="text-xl font-semibold">Add Widget</h2>
            <p className="text-sm text-th-text-secondary mt-1">
              Choose a widget to add to your dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-th-text-secondary" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b border-th-border">
          <div className="flex gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-th-text-tertiary" />
              <input
                type="text"
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as WidgetCategory | 'all')}
              className="px-4 py-2 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category as WidgetCategory] || category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(widgetsByCategory).length === 0 ? (
            <div className="text-center py-12 text-th-text-secondary">
              <p>No widgets found matching your search.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(widgetsByCategory).map(([category, widgets]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-th-text-secondary uppercase tracking-wider mb-3">
                    {CATEGORY_LABELS[category as WidgetCategory] || category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {widgets.map((widget) => (
                      <WidgetCard
                        key={widget.id}
                        widget={widget}
                        onAdd={() => handleAddWidget(widget.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// Widget Card Component
// ============================================================================

interface WidgetCardProps {
  widget: WidgetConfig;
  onAdd: () => void;
}

function WidgetCard({ widget, onAdd }: WidgetCardProps) {
  const Icon = widget.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-xl border',
        'hover:border-blue-300 dark:hover:border-blue-600',
        'hover:bg-blue-50 dark:hover:bg-blue-900/10',
        'transition-all cursor-pointer group'
      )}
      onClick={onAdd}
    >
      <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-th-text-primary">
            {widget.title}
          </h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-th-text-secondary mt-1 line-clamp-2">
          {widget.description}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-th-text-secondary">
            {widget.defaultSize}
          </span>
          {widget.permissions && widget.permissions.length > 0 && (
            <span className="text-xs text-amber-600">
              Requires permissions
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default WidgetCatalog;

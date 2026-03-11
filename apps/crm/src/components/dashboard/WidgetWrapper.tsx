// ============================================================================
// Widget Wrapper Component
// Common chrome for all dashboard widgets (header, collapse, resize, etc.)
// ============================================================================

import { Suspense, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Settings,
  Trash2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');
import { useDashboardStore } from '../../contexts/DashboardContext';
import { getWidgetConfig } from './widgets/widgetRegistry';
import type { WidgetInstance } from '@mpbhealth/crm-core/dashboard';
import type { BaseWidgetProps } from './types';

// ============================================================================
// Types
// ============================================================================

interface WidgetWrapperProps {
  widget: WidgetInstance;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onOpenSettings: () => void;
}

// ============================================================================
// Size cycling helper
// ============================================================================

const SIZE_ORDER: Array<'sm' | 'md' | 'lg' | 'full'> = ['sm', 'md', 'lg', 'full'];

function getNextSize(current: 'sm' | 'md' | 'lg' | 'full', allowedSizes: Array<'sm' | 'md' | 'lg' | 'full'>): 'sm' | 'md' | 'lg' | 'full' {
  const currentIndex = SIZE_ORDER.indexOf(current);
  for (let i = 1; i <= SIZE_ORDER.length; i++) {
    const nextIndex = (currentIndex + i) % SIZE_ORDER.length;
    const nextSize = SIZE_ORDER[nextIndex];
    if (allowedSizes.includes(nextSize)) {
      return nextSize;
    }
  }
  return current;
}

function getPrevSize(current: 'sm' | 'md' | 'lg' | 'full', allowedSizes: Array<'sm' | 'md' | 'lg' | 'full'>): 'sm' | 'md' | 'lg' | 'full' {
  const currentIndex = SIZE_ORDER.indexOf(current);
  for (let i = 1; i <= SIZE_ORDER.length; i++) {
    const prevIndex = (currentIndex - i + SIZE_ORDER.length) % SIZE_ORDER.length;
    const prevSize = SIZE_ORDER[prevIndex];
    if (allowedSizes.includes(prevSize)) {
      return prevSize;
    }
  }
  return current;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function WidgetSkeleton() {
  return (
    <div className="animate-pulse p-4">
      <div className="h-4 bg-surface-tertiary rounded w-3/4 mb-3" />
      <div className="h-3 bg-surface-tertiary rounded w-1/2 mb-2" />
      <div className="h-3 bg-surface-tertiary rounded w-2/3" />
    </div>
  );
}

// ============================================================================
// Error Boundary Fallback
// ============================================================================

function WidgetError({ error }: { error: Error }) {
  return (
    <div className="p-4 text-center text-red-500">
      <p className="text-sm font-medium">Failed to load widget</p>
      <p className="text-xs text-th-text-secondary mt-1">{error.message}</p>
    </div>
  );
}

// ============================================================================
// Widget Wrapper Component
// ============================================================================

export function WidgetWrapper({
  widget,
  isEditMode,
  isSelected,
  onSelect,
  onOpenSettings,
}: WidgetWrapperProps) {
  const [hasError, setHasError] = useState<Error | null>(null);

  const {
    removeWidget,
    toggleWidgetCollapse,
    updateWidgetSize,
    updateWidgetConfig,
  } = useDashboardStore();

  const widgetConfig = getWidgetConfig(widget.widgetId);

  // DnD setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.instanceId,
    disabled: !isEditMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!widgetConfig) {
    return (
      <div className="p-4 text-center text-th-text-secondary">
        Unknown widget type: {widget.widgetId}
      </div>
    );
  }

  const Icon = widgetConfig.icon;
  const WidgetComponent = widgetConfig.component;

  const handleResize = (direction: 'grow' | 'shrink') => {
    const newSize = direction === 'grow'
      ? getNextSize(widget.size, widgetConfig.allowedSizes)
      : getPrevSize(widget.size, widgetConfig.allowedSizes);
    updateWidgetSize(widget.instanceId, newSize);
  };

  const handleConfigChange = (config: Record<string, unknown>) => {
    updateWidgetConfig(widget.instanceId, config);
  };

  const widgetProps: BaseWidgetProps = {
    instanceId: widget.instanceId,
    size: widget.size,
    config: widget.config,
    isEditMode,
    onConfigChange: handleConfigChange,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-surface-primary rounded-xl border border-th-border shadow-sm overflow-hidden transition-all duration-200',
        isSelected && isEditMode && 'ring-2 ring-blue-500 border-blue-500',
        isDragging && 'shadow-lg',
        !isEditMode && 'hover:shadow-md'
      )}
      onClick={isEditMode ? onSelect : undefined}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 border-b border-th-border',
          isEditMode && 'cursor-grab active:cursor-grabbing'
        )}
        {...(isEditMode ? { ...attributes, ...listeners } : {})}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isEditMode && (
            <GripVertical className="h-4 w-4 text-th-text-tertiary flex-shrink-0" />
          )}
          <Icon className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="font-medium text-sm truncate">{widgetConfig.title}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Size indicator */}
          <span className="text-xs text-th-text-tertiary px-1.5 py-0.5 bg-surface-tertiary rounded">
            {widget.size}
          </span>

          {/* Collapse toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWidgetCollapse(widget.instanceId);
            }}
            className="p-1.5 hover:bg-surface-tertiary rounded-lg transition-colors"
            title={widget.collapsed ? 'Expand' : 'Collapse'}
          >
            {widget.collapsed ? (
              <ChevronDown className="h-4 w-4 text-th-text-secondary" />
            ) : (
              <ChevronUp className="h-4 w-4 text-th-text-secondary" />
            )}
          </button>

          {/* Edit mode actions */}
          {isEditMode && (
            <>
              {/* Resize buttons */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResize('shrink');
                }}
                className="p-1.5 hover:bg-surface-tertiary rounded-lg transition-colors"
                title="Shrink"
                disabled={widget.size === widgetConfig.allowedSizes[0]}
              >
                <Minimize2 className="h-4 w-4 text-th-text-secondary" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResize('grow');
                }}
                className="p-1.5 hover:bg-surface-tertiary rounded-lg transition-colors"
                title="Expand"
                disabled={widget.size === widgetConfig.allowedSizes[widgetConfig.allowedSizes.length - 1]}
              >
                <Maximize2 className="h-4 w-4 text-th-text-secondary" />
              </button>

              {/* Settings */}
              {widgetConfig.configSchema && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSettings();
                  }}
                  className="p-1.5 hover:bg-surface-tertiary rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="h-4 w-4 text-th-text-secondary" />
                </button>
              )}

              {/* Remove */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeWidget(widget.instanceId);
                }}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Remove"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {!widget.collapsed && (
        <div className="min-h-[100px]">
          {hasError ? (
            <WidgetError error={hasError} />
          ) : (
            <Suspense fallback={<WidgetSkeleton />}>
              <ErrorBoundary onError={setHasError}>
                <WidgetComponent {...widgetProps} />
              </ErrorBoundary>
            </Suspense>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Simple Error Boundary
// ============================================================================

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

// Need to import React for the class component
import React from 'react';

export default WidgetWrapper;

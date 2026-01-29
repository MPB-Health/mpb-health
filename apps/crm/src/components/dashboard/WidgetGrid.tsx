// ============================================================================
// Widget Grid Component
// CSS Grid layout with drag-and-drop support using @dnd-kit
// ============================================================================

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDashboardStore } from '../../contexts/DashboardContext';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetSettings } from './WidgetSettings';
import { SIZE_TO_SPAN } from './types';
import type { WidgetInstance } from '@mpbhealth/crm-core/dashboard';
const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Widget Grid Component
// ============================================================================

export function WidgetGrid() {
  const {
    widgets,
    editMode,
    selectedWidgetId,
    selectWidget,
    reorderWidgets,
    setDragging,
  } = useDashboardStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [settingsWidgetId, setSettingsWidgetId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setDragging(true);
  }, [setDragging]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDragging(false);

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.instanceId === active.id);
      const newIndex = widgets.findIndex((w) => w.instanceId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newWidgets = [...widgets];
        const [removed] = newWidgets.splice(oldIndex, 1);
        newWidgets.splice(newIndex, 0, removed);

        // Recalculate positions based on new order
        const repositionedWidgets = recalculatePositions(newWidgets);
        reorderWidgets(repositionedWidgets);
      }
    }
  }, [widgets, reorderWidgets, setDragging]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setDragging(false);
  }, [setDragging]);

  // Get the active widget for drag overlay
  const activeWidget = activeId
    ? widgets.find((w) => w.instanceId === activeId)
    : null;

  // Get widget for settings modal
  const settingsWidget = settingsWidgetId
    ? widgets.find((w) => w.instanceId === settingsWidgetId)
    : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={widgets.map((w) => w.instanceId)}
          strategy={rectSortingStrategy}
        >
          <div
            className={cn(
              'grid gap-4 p-4',
              'grid-cols-12' // 12-column grid
            )}
            style={{
              gridAutoRows: 'minmax(100px, auto)',
            }}
          >
            {widgets.map((widget) => (
              <div
                key={widget.instanceId}
                className={cn(
                  'transition-all duration-200',
                  getGridColSpan(widget.size)
                )}
              >
                <WidgetWrapper
                  widget={widget}
                  isEditMode={editMode}
                  isSelected={selectedWidgetId === widget.instanceId}
                  onSelect={() => selectWidget(widget.instanceId)}
                  onOpenSettings={() => setSettingsWidgetId(widget.instanceId)}
                />
              </div>
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeWidget ? (
            <div
              className={cn(
                'opacity-80 shadow-2xl',
                getGridColSpan(activeWidget.size)
              )}
              style={{ width: getOverlayWidth(activeWidget.size) }}
            >
              <WidgetWrapper
                widget={activeWidget}
                isEditMode={true}
                isSelected={true}
                onSelect={() => {}}
                onOpenSettings={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Widget Settings Modal */}
      {settingsWidget && (
        <WidgetSettings
          widget={settingsWidget}
          isOpen={!!settingsWidgetId}
          onClose={() => setSettingsWidgetId(null)}
        />
      )}
    </>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getGridColSpan(size: 'sm' | 'md' | 'lg' | 'full'): string {
  const span = SIZE_TO_SPAN[size];
  return `col-span-12 md:col-span-${span}`;
}

function getOverlayWidth(size: 'sm' | 'md' | 'lg' | 'full'): string {
  const percentages: Record<string, string> = {
    sm: '25%',
    md: '50%',
    lg: '75%',
    full: '100%',
  };
  return percentages[size] || '50%';
}

function recalculatePositions(widgets: WidgetInstance[]): WidgetInstance[] {
  let currentRow = 0;
  let currentCol = 0;
  const GRID_COLS = 12;

  return widgets.map((widget) => {
    const span = SIZE_TO_SPAN[widget.size];

    // If widget doesn't fit in current row, move to next row
    if (currentCol + span > GRID_COLS) {
      currentRow++;
      currentCol = 0;
    }

    const position = { x: currentCol, y: currentRow };
    currentCol += span;

    // If row is full, move to next row
    if (currentCol >= GRID_COLS) {
      currentRow++;
      currentCol = 0;
    }

    return { ...widget, position };
  });
}

export default WidgetGrid;

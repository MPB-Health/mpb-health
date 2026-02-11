// ============================================================================
// Dashboard Context
// State management for the Championship Command Center
// ============================================================================

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useOrg } from './OrgContext';
import { supabase } from '../lib/supabase';
import {
  createDashboardLayoutService,
  type WidgetInstance,
  type DashboardLayout,
} from '@mpbhealth/crm-core/dashboard';

// Simple UUID generator using crypto API
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ============================================================================
// Types
// ============================================================================

interface DashboardState {
  // Layout state
  widgets: WidgetInstance[];
  layoutId: string | null;
  layoutName: string;

  // UI state
  editMode: boolean;
  selectedWidgetId: string | null;
  isDragging: boolean;

  // Loading state
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: Date | null;
}

interface DashboardActions {
  // Layout management
  loadLayout: (orgId: string) => Promise<void>;
  saveLayout: (orgId: string) => Promise<boolean>;
  resetLayout: (orgId: string) => Promise<void>;

  // Widget management
  addWidget: (widgetId: string, config?: Record<string, unknown>) => void;
  removeWidget: (instanceId: string) => void;
  updateWidgetConfig: (instanceId: string, config: Record<string, unknown>) => void;
  updateWidgetSize: (instanceId: string, size: 'sm' | 'md' | 'lg' | 'full') => void;
  toggleWidgetCollapse: (instanceId: string) => void;
  reorderWidgets: (widgets: WidgetInstance[]) => void;
  moveWidget: (instanceId: string, position: { x: number; y: number }) => void;

  // Edit mode
  toggleEditMode: () => void;
  setEditMode: (editMode: boolean) => void;
  selectWidget: (instanceId: string | null) => void;
  setDragging: (isDragging: boolean) => void;

  // Error handling
  clearError: () => void;
}

type DashboardStore = DashboardState & DashboardActions;

// ============================================================================
// Default State
// ============================================================================

const DEFAULT_STATE: DashboardState = {
  widgets: [],
  layoutId: null,
  layoutName: 'Default',
  editMode: false,
  selectedWidgetId: null,
  isDragging: false,
  isLoading: false,
  isSaving: false,
  error: null,
  lastSaved: null,
};

// ============================================================================
// Zustand Store
// ============================================================================

const layoutService = createDashboardLayoutService(supabase);

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      // -----------------------------------------------------------------------
      // Layout Management
      // -----------------------------------------------------------------------
      loadLayout: async (orgId: string) => {
        set({ isLoading: true, error: null });

        try {
          const layout = await layoutService.getLayout(orgId);

          if (layout && layout.widgets && layout.widgets.length > 0) {
            set({
              widgets: layout.widgets as WidgetInstance[],
              layoutId: layout.id,
              layoutName: layout.name,
              isLoading: false,
              lastSaved: layout.updated_at ? new Date(layout.updated_at) : null,
            });
          } else {
            // Use default widgets if no layout found or layout is empty
            const defaultWidgets = await layoutService.getDefaultWidgets(orgId);
            set({
              widgets: defaultWidgets,
              layoutId: null,
              layoutName: 'Default',
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Failed to load dashboard layout:', error);
          // On error, use hardcoded defaults instead of showing an error
          const defaultWidgets = await layoutService.getDefaultWidgets(orgId);
          set({
            widgets: defaultWidgets,
            layoutId: null,
            layoutName: 'Default',
            isLoading: false,
            error: null, // Clear any previous error - gracefully degrade
          });
        }
      },

      saveLayout: async (orgId: string) => {
        const { widgets, layoutName } = get();
        set({ isSaving: true, error: null });

        try {
          const result = await layoutService.saveLayout(orgId, widgets, layoutName);

          if (result.success && result.data) {
            set({
              layoutId: result.data.id,
              isSaving: false,
              lastSaved: new Date(),
            });
            return true;
          } else {
            set({
              isSaving: false,
              error: result.error || 'Failed to save layout',
            });
            return false;
          }
        } catch (error) {
          console.error('Failed to save dashboard layout:', error);
          set({
            isSaving: false,
            error: 'Failed to save dashboard layout',
          });
          return false;
        }
      },

      resetLayout: async (orgId: string) => {
        set({ isLoading: true, error: null });

        try {
          const result = await layoutService.resetLayout(orgId);

          if (result.success && result.data) {
            set({
              widgets: result.data.widgets as WidgetInstance[],
              layoutId: result.data.id,
              layoutName: result.data.name,
              isLoading: false,
              lastSaved: new Date(),
            });
          } else {
            set({
              isLoading: false,
              error: result.error || 'Failed to reset layout',
            });
          }
        } catch (error) {
          console.error('Failed to reset dashboard layout:', error);
          set({
            isLoading: false,
            error: 'Failed to reset dashboard layout',
          });
        }
      },

      // -----------------------------------------------------------------------
      // Widget Management
      // -----------------------------------------------------------------------
      addWidget: (widgetId: string, config: Record<string, unknown> = {}) => {
        const { widgets } = get();

        // Calculate next available position
        const maxY = widgets.reduce((max, w) => Math.max(max, w.position.y), -1);
        const newPosition = { x: 0, y: maxY + 1 };

        const newWidget: WidgetInstance = {
          instanceId: generateId(),
          widgetId: widgetId as WidgetInstance['widgetId'],
          size: 'md',
          position: newPosition,
          collapsed: false,
          config,
        };

        set({ widgets: [...widgets, newWidget] });
      },

      removeWidget: (instanceId: string) => {
        const { widgets, selectedWidgetId } = get();
        set({
          widgets: widgets.filter((w) => w.instanceId !== instanceId),
          selectedWidgetId: selectedWidgetId === instanceId ? null : selectedWidgetId,
        });
      },

      updateWidgetConfig: (instanceId: string, config: Record<string, unknown>) => {
        const { widgets } = get();
        set({
          widgets: widgets.map((w) =>
            w.instanceId === instanceId ? { ...w, config: { ...w.config, ...config } } : w
          ),
        });
      },

      updateWidgetSize: (instanceId: string, size: 'sm' | 'md' | 'lg' | 'full') => {
        const { widgets } = get();
        set({
          widgets: widgets.map((w) =>
            w.instanceId === instanceId ? { ...w, size } : w
          ),
        });
      },

      toggleWidgetCollapse: (instanceId: string) => {
        const { widgets } = get();
        set({
          widgets: widgets.map((w) =>
            w.instanceId === instanceId ? { ...w, collapsed: !w.collapsed } : w
          ),
        });
      },

      reorderWidgets: (widgets: WidgetInstance[]) => {
        set({ widgets });
      },

      moveWidget: (instanceId: string, position: { x: number; y: number }) => {
        const { widgets } = get();
        set({
          widgets: widgets.map((w) =>
            w.instanceId === instanceId ? { ...w, position } : w
          ),
        });
      },

      // -----------------------------------------------------------------------
      // Edit Mode
      // -----------------------------------------------------------------------
      toggleEditMode: () => {
        const { editMode, selectedWidgetId } = get();
        set({
          editMode: !editMode,
          selectedWidgetId: !editMode ? selectedWidgetId : null,
        });
      },

      setEditMode: (editMode: boolean) => {
        set({
          editMode,
          selectedWidgetId: editMode ? get().selectedWidgetId : null,
        });
      },

      selectWidget: (instanceId: string | null) => {
        set({ selectedWidgetId: instanceId });
      },

      setDragging: (isDragging: boolean) => {
        set({ isDragging });
      },

      // -----------------------------------------------------------------------
      // Error Handling
      // -----------------------------------------------------------------------
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'crm-dashboard-local',
      partialize: (state) => ({
        // Only persist edit mode preference locally
        editMode: state.editMode,
      }),
    }
  )
);

// ============================================================================
// React Context (for additional dashboard services)
// ============================================================================

interface DashboardContextValue {
  // Services
  refreshWidget: (widgetId: string) => void;
  refreshAllWidgets: () => void;

  // Autosave
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const { activeOrgId } = useOrg();
  const { loadLayout, saveLayout, widgets, editMode } = useDashboardStore();

  // Load layout when org changes
  useEffect(() => {
    if (activeOrgId) {
      loadLayout(activeOrgId);
    }
  }, [activeOrgId, loadLayout]);

  // Auto-save when widgets change (debounced)
  useEffect(() => {
    if (!activeOrgId || editMode) return;

    const timer = setTimeout(() => {
      saveLayout(activeOrgId);
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [widgets, activeOrgId, editMode, saveLayout]);

  // Widget refresh tracking
  const refreshWidget = (_widgetId: string) => {
    // Trigger a re-render of specific widget
    // This is handled by individual widgets listening to their data
    console.log('Refresh widget:', _widgetId);
  };

  const refreshAllWidgets = () => {
    // Trigger global refresh
    window.dispatchEvent(new CustomEvent('dashboard:refresh'));
  };

  const value: DashboardContextValue = {
    refreshWidget,
    refreshAllWidgets,
    autoSave: true,
    setAutoSave: () => {},
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

export function useDashboardContext(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}

// Convenience hooks for specific state slices
export function useWidgets(): WidgetInstance[] {
  return useDashboardStore((state) => state.widgets);
}

export function useEditMode(): boolean {
  return useDashboardStore((state) => state.editMode);
}

export function useSelectedWidget(): string | null {
  return useDashboardStore((state) => state.selectedWidgetId);
}

export function useDashboardLoading(): boolean {
  return useDashboardStore((state) => state.isLoading);
}

export function useDashboardError(): string | null {
  return useDashboardStore((state) => state.error);
}

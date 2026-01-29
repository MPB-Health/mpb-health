// ============================================================================
// Dashboard Widget System Types
// Championship Command Center
// ============================================================================

import type { LucideIcon } from 'lucide-react';
import type { ComponentType, LazyExoticComponent } from 'react';

// Re-export core types from crm-core
export type {
  WidgetSize,
  WidgetType,
  WidgetPosition,
  WidgetInstance,
  DashboardLayout,
  DashboardLayoutInput,
} from '@mpbhealth/crm-core/dashboard';

// ============================================================================
// Widget Component Props
// ============================================================================

export interface BaseWidgetProps {
  instanceId: string;
  size: 'sm' | 'md' | 'lg' | 'full';
  config: Record<string, unknown>;
  isEditMode: boolean;
  onConfigChange?: (config: Record<string, unknown>) => void;
}

// ============================================================================
// Widget Configuration Schema (for settings UI)
// ============================================================================

export type ConfigFieldType = 'text' | 'number' | 'select' | 'checkbox' | 'color';

export interface ConfigFieldOption {
  value: string;
  label: string;
}

export interface ConfigField {
  key: string;
  label: string;
  type: ConfigFieldType;
  options?: ConfigFieldOption[];
  defaultValue?: unknown;
  description?: string;
}

export interface ConfigSchema {
  fields: ConfigField[];
}

// ============================================================================
// Widget Registry Entry
// ============================================================================

export interface WidgetConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: WidgetCategory;
  defaultSize: 'sm' | 'md' | 'lg' | 'full';
  allowedSizes: Array<'sm' | 'md' | 'lg' | 'full'>;
  minWidth?: number; // Minimum columns
  component: LazyExoticComponent<ComponentType<BaseWidgetProps>>;
  configSchema?: ConfigSchema;
  dataRefreshInterval?: number; // ms, auto-refresh interval
  permissions?: string[]; // Required permissions to use this widget
}

export type WidgetCategory =
  | 'metrics'
  | 'sales'
  | 'productivity'
  | 'collaboration'
  | 'insights';

// ============================================================================
// Widget Registry Type
// ============================================================================

export type WidgetRegistry = Record<string, WidgetConfig>;

// ============================================================================
// Dashboard State
// ============================================================================

export interface DashboardState {
  widgets: import('@mpbhealth/crm-core/dashboard').WidgetInstance[];
  editMode: boolean;
  selectedWidgetId: string | null;
  isDragging: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface DashboardActions {
  // Layout management
  loadLayout: (orgId: string) => Promise<void>;
  saveLayout: (orgId: string) => Promise<void>;
  resetLayout: (orgId: string) => Promise<void>;

  // Widget management
  addWidget: (widgetId: string, config?: Record<string, unknown>) => void;
  removeWidget: (instanceId: string) => void;
  updateWidgetConfig: (instanceId: string, config: Record<string, unknown>) => void;
  updateWidgetSize: (instanceId: string, size: 'sm' | 'md' | 'lg' | 'full') => void;
  toggleWidgetCollapse: (instanceId: string) => void;
  reorderWidgets: (widgets: import('@mpbhealth/crm-core/dashboard').WidgetInstance[]) => void;

  // Edit mode
  toggleEditMode: () => void;
  selectWidget: (instanceId: string | null) => void;
  setDragging: (isDragging: boolean) => void;
}

export type DashboardStore = DashboardState & DashboardActions;

// ============================================================================
// Grid Configuration
// ============================================================================

export interface GridConfig {
  columns: number;
  rowHeight: number;
  gap: number;
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 12,
  rowHeight: 100,
  gap: 16,
};

// Size to column span mapping
export const SIZE_TO_SPAN: Record<'sm' | 'md' | 'lg' | 'full', number> = {
  sm: 3,   // 25% width (3/12)
  md: 6,   // 50% width (6/12)
  lg: 9,   // 75% width (9/12)
  full: 12, // 100% width (12/12)
};

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  action: () => void;
}

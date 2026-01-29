// ============================================================================
// Dashboard Components - Championship Command Center
// ============================================================================

// Main container
export { DashboardContainer } from './DashboardContainer';

// Core components
export { WidgetGrid } from './WidgetGrid';
export { WidgetWrapper } from './WidgetWrapper';
export { WidgetSettings } from './WidgetSettings';
export { WidgetCatalog } from './WidgetCatalog';
export { DashboardToolbar } from './DashboardToolbar';
export { KeyboardShortcutsHelp, useKeyboardShortcuts } from './KeyboardShortcuts';

// Types
export * from './types';

// Widget registry
export { widgetRegistry, getWidgetConfig, getAllWidgets, getWidgetsByCategory } from './widgets/widgetRegistry';

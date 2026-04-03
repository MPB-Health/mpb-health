// ============================================================================
// Widget Exports
// Barrel file for all dashboard widgets
// ============================================================================

// Re-export the widget registry
export { widgetRegistry, getWidgetConfig } from './widgetRegistry';

// Lazy-loaded widget components are imported via the registry
// Direct imports for type-checking purposes only
export type { default as MetricsWidget } from './MetricsWidget';
export type { default as PipelineWidget } from './PipelineWidget';
export type { default as RecentLeadsWidget } from './RecentLeadsWidget';
export type { default as ActivityWidget } from './ActivityWidget';
export type { default as TasksWidget } from './TasksWidget';
export type { default as NotesWidget } from './NotesWidget';
export type { default as CalendarWidget } from './CalendarWidget';
export type { default as DealsWidget } from './DealsWidget';
export type { default as ChartsWidget } from './ChartsWidget';
export type { default as QuickActionsWidget } from './QuickActionsWidget';
export type { default as AlertsWidget } from './AlertsWidget';
export type { default as GoalsWidget } from './GoalsWidget';
export type { default as TeamWidget } from './TeamWidget';
export type { default as AIInsightsWidget } from './AIInsightsWidget';
export type { default as PlanTypeWidget } from './PlanTypeWidget';
export type { default as AdvisorWidget } from './AdvisorWidget';
export type { default as PipelineBreakdownWidget } from './PipelineBreakdownWidget';
export type { default as RevenueIntelligenceWidget } from './RevenueIntelligenceWidget';
export type { default as RelationshipMapWidget } from './RelationshipMapWidget';
export type { default as ActivityPulseWidget } from './ActivityPulseWidget';

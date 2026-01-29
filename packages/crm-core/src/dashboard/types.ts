// ============================================================================
// Dashboard Widget Types
// Championship Command Center type definitions
// ============================================================================

// Widget size options
export type WidgetSize = 'sm' | 'md' | 'lg' | 'full';

// Widget type identifiers
export type WidgetType =
  | 'metrics'
  | 'pipeline'
  | 'recent-leads'
  | 'activity'
  | 'tasks'
  | 'notes'
  | 'calendar'
  | 'deals'
  | 'charts'
  | 'quick-actions'
  | 'alerts'
  | 'goals'
  | 'team'
  | 'ai-insights';

// Widget position in the grid
export interface WidgetPosition {
  x: number; // Column start (0-11 for 12-column grid)
  y: number; // Row index
}

// Widget instance configuration (stored in database)
export interface WidgetInstance {
  instanceId: string;
  widgetId: WidgetType;
  size: WidgetSize;
  position: WidgetPosition;
  collapsed: boolean;
  config: Record<string, unknown>;
}

// Dashboard layout
export interface DashboardLayout {
  id: string;
  user_id: string;
  org_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  widgets: WidgetInstance[];
  grid_columns: number;
  row_height: number;
  theme?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Dashboard layout create/update input
export interface DashboardLayoutInput {
  name?: string;
  description?: string;
  widgets: WidgetInstance[];
  grid_columns?: number;
  row_height?: number;
  theme?: Record<string, unknown>;
}

// ============================================================================
// Notes Types
// ============================================================================

export type NoteColor = 'default' | 'yellow' | 'green' | 'blue' | 'purple' | 'red' | 'orange';

export interface DashboardNote {
  id: string;
  user_id: string;
  org_id: string;
  title?: string;
  content: string;
  is_pinned: boolean;
  color: NoteColor;
  linked_entity_type?: 'lead' | 'contact' | 'deal' | 'account';
  linked_entity_id?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface NoteCreateInput {
  title?: string;
  content: string;
  is_pinned?: boolean;
  color?: NoteColor;
  linked_entity_type?: 'lead' | 'contact' | 'deal' | 'account';
  linked_entity_id?: string;
  tags?: string[];
}

export interface NoteUpdateInput {
  title?: string;
  content?: string;
  is_pinned?: boolean;
  color?: NoteColor;
  linked_entity_type?: 'lead' | 'contact' | 'deal' | 'account' | null;
  linked_entity_id?: string | null;
  tags?: string[];
}

// ============================================================================
// Goals Types
// ============================================================================

export type GoalMetricType =
  | 'leads_created'
  | 'leads_converted'
  | 'deals_won'
  | 'deals_value'
  | 'calls_made'
  | 'emails_sent'
  | 'meetings_held'
  | 'tasks_completed'
  | 'custom';

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export type GoalStatus = 'active' | 'completed' | 'cancelled' | 'expired';

export interface UserGoal {
  id: string;
  user_id: string;
  org_id: string;
  name: string;
  description?: string;
  target_value: number;
  current_value: number;
  metric_type: GoalMetricType;
  period: GoalPeriod;
  start_date: string;
  end_date: string;
  is_personal: boolean;
  assigned_by?: string;
  status: GoalStatus;
  completed_at?: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface GoalCreateInput {
  name: string;
  description?: string;
  target_value: number;
  metric_type: GoalMetricType;
  period: GoalPeriod;
  start_date: string;
  end_date: string;
  is_personal?: boolean;
  assigned_to?: string; // For admin-assigned goals
  icon?: string;
  color?: string;
}

export interface GoalUpdateInput {
  name?: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  status?: GoalStatus;
  icon?: string;
  color?: string;
}

// ============================================================================
// Default Layout Template
// ============================================================================

export interface DefaultLayoutTemplate {
  id: string;
  org_id?: string;
  name: string;
  description?: string;
  widgets: WidgetInstance[];
  grid_columns: number;
  row_height: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Service Result Types
// ============================================================================

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

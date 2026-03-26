// ============================================================================
// Widget Registry
// All available widgets for the Championship Command Center
// ============================================================================

import { lazy } from 'react';
import {
  TrendingUp,
  GitBranch,
  Users,
  Activity,
  CheckSquare,
  StickyNote,
  Calendar,
  Briefcase,
  BarChart3,
  Zap,
  Bell,
  Target,
  UsersRound,
  Sparkles,
  ListTodo,
  Gauge,
  Shield,
  UserCheck,
  GitPullRequest,
} from 'lucide-react';
import type { WidgetConfig, WidgetRegistry } from '../types';

// Lazy load all widget components
const MetricsWidget = lazy(() => import('./MetricsWidget'));
const PipelineWidget = lazy(() => import('./PipelineWidget'));
const RecentLeadsWidget = lazy(() => import('./RecentLeadsWidget'));
const ActivityWidget = lazy(() => import('./ActivityWidget'));
const TasksWidget = lazy(() => import('./TasksWidget'));
const NotesWidget = lazy(() => import('./NotesWidget'));
const CalendarWidget = lazy(() => import('./CalendarWidget'));
const DealsWidget = lazy(() => import('./DealsWidget'));
const ChartsWidget = lazy(() => import('./ChartsWidget'));
const QuickActionsWidget = lazy(() => import('./QuickActionsWidget'));
const AlertsWidget = lazy(() => import('./AlertsWidget'));
const GoalsWidget = lazy(() => import('./GoalsWidget'));
const TeamWidget = lazy(() => import('./TeamWidget'));
const AIInsightsWidget = lazy(() => import('./AIInsightsWidget'));
const ActionQueueWidget = lazy(() => import('./ActionQueueWidget'));
const KPIStripWidget = lazy(() => import('./KPIStripWidget'));
const PlanTypeWidget = lazy(() => import('./PlanTypeWidget'));
const AdvisorWidget = lazy(() => import('./AdvisorWidget'));
const PipelineBreakdownWidget = lazy(() => import('./PipelineBreakdownWidget'));

// ============================================================================
// Widget Registry
// ============================================================================

export const widgetRegistry: WidgetRegistry = {
  // ---------------------------------------------------------------------------
  // Metrics Category
  // ---------------------------------------------------------------------------
  metrics: {
    id: 'metrics',
    title: 'Metrics',
    description: 'Display key performance indicators and stats',
    icon: TrendingUp,
    category: 'metrics',
    defaultSize: 'sm',
    allowedSizes: ['sm', 'md', 'lg', 'full'],
    component: MetricsWidget,
    dataRefreshInterval: 30000,
    configSchema: {
      fields: [
        {
          key: 'metric',
          label: 'Metric Type',
          type: 'select',
          options: [
            { value: 'total_leads', label: 'Total Leads' },
            { value: 'new_leads', label: 'New Today' },
            { value: 'tasks_due', label: 'Tasks Due Today' },
            { value: 'overdue_tasks', label: 'Overdue Tasks' },
            { value: 'conversion_rate', label: 'Conversion Rate' },
            { value: 'avg_days_to_close', label: 'Avg Days to Close' },
          ],
          defaultValue: 'total_leads',
        },
        {
          key: 'showTrend',
          label: 'Show Trend',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  },

  pipeline: {
    id: 'pipeline',
    title: 'Pipeline Overview',
    description: 'View lead distribution across pipeline stages',
    icon: GitBranch,
    category: 'metrics',
    defaultSize: 'md',
    allowedSizes: ['sm', 'md', 'lg'],
    component: PipelineWidget,
    dataRefreshInterval: 30000,
    configSchema: {
      fields: [
        {
          key: 'maxStages',
          label: 'Max Stages',
          type: 'number',
          defaultValue: 5,
        },
        {
          key: 'showValues',
          label: 'Show Values',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Sales Category
  // ---------------------------------------------------------------------------
  'recent-leads': {
    id: 'recent-leads',
    title: 'Recent Leads',
    description: 'View your most recent leads',
    icon: Users,
    category: 'sales',
    defaultSize: 'md',
    allowedSizes: ['sm', 'md', 'lg'],
    component: RecentLeadsWidget,
    dataRefreshInterval: 30000,
    configSchema: {
      fields: [
        {
          key: 'limit',
          label: 'Number of Leads',
          type: 'number',
          defaultValue: 5,
        },
        {
          key: 'showAvatar',
          label: 'Show Avatars',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  },

  deals: {
    id: 'deals',
    title: 'Deals',
    description: 'View deal statistics and recent deals',
    icon: Briefcase,
    category: 'sales',
    defaultSize: 'md',
    allowedSizes: ['sm', 'md', 'lg'],
    component: DealsWidget,
    permissions: ['deals.read'],
    dataRefreshInterval: 60000,
    configSchema: {
      fields: [
        {
          key: 'showClosedDeals',
          label: 'Show Closed Deals',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'limit',
          label: 'Max Deals',
          type: 'number',
          defaultValue: 5,
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Productivity Category
  // ---------------------------------------------------------------------------
  activity: {
    id: 'activity',
    title: 'Activity Timeline',
    description: 'View recent activities and interactions',
    icon: Activity,
    category: 'productivity',
    defaultSize: 'md',
    allowedSizes: ['sm', 'md', 'lg'],
    component: ActivityWidget,
    dataRefreshInterval: 30000,
    configSchema: {
      fields: [
        {
          key: 'limit',
          label: 'Number of Activities',
          type: 'number',
          defaultValue: 5,
        },
        {
          key: 'showDescription',
          label: 'Show Descriptions',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  },

  tasks: {
    id: 'tasks',
    title: 'Tasks',
    description: 'View and manage your tasks',
    icon: CheckSquare,
    category: 'productivity',
    defaultSize: 'md',
    allowedSizes: ['sm', 'md', 'lg'],
    component: TasksWidget,
    permissions: ['tasks.read'],
    dataRefreshInterval: 30000,
    configSchema: {
      fields: [
        {
          key: 'view',
          label: 'Default View',
          type: 'select',
          options: [
            { value: 'due-today', label: 'Due Today' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'all', label: 'All Tasks' },
          ],
          defaultValue: 'due-today',
        },
        {
          key: 'showCompleted',
          label: 'Show Completed',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  },

  notes: {
    id: 'notes',
    title: 'Notes',
    description: 'Quick notes and pinned reminders',
    icon: StickyNote,
    category: 'productivity',
    defaultSize: 'md',
    allowedSizes: ['sm', 'md', 'lg'],
    component: NotesWidget,
    configSchema: {
      fields: [
        {
          key: 'showPinnedOnly',
          label: 'Pinned Only',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'maxNotes',
          label: 'Max Notes',
          type: 'number',
          defaultValue: 5,
        },
      ],
    },
  },

  calendar: {
    id: 'calendar',
    title: 'Calendar',
    description: 'View upcoming events and meetings',
    icon: Calendar,
    category: 'productivity',
    defaultSize: 'md',
    allowedSizes: ['sm', 'md', 'lg'],
    component: CalendarWidget,
    dataRefreshInterval: 60000,
    configSchema: {
      fields: [
        {
          key: 'view',
          label: 'Default View',
          type: 'select',
          options: [
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'Mini Month' },
          ],
          defaultValue: 'today',
        },
        {
          key: 'showTasks',
          label: 'Show Tasks',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  },

  'quick-actions': {
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'Shortcuts to common actions',
    icon: Zap,
    category: 'productivity',
    defaultSize: 'full',
    allowedSizes: ['sm', 'md', 'lg', 'full'],
    component: QuickActionsWidget,
    configSchema: {
      fields: [
        {
          key: 'actions',
          label: 'Actions',
          type: 'select',
          description: 'Choose which actions to display',
          options: [
            { value: 'add-lead', label: 'Add Lead' },
            { value: 'add-task', label: 'Add Task' },
            { value: 'log-call', label: 'Log Call' },
            { value: 'add-note', label: 'Add Note' },
            { value: 'add-event', label: 'Add Event' },
            { value: 'send-email', label: 'Send Email' },
          ],
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Insights Category
  // ---------------------------------------------------------------------------
  charts: {
    id: 'charts',
    title: 'Charts',
    description: 'Customizable data visualizations',
    icon: BarChart3,
    category: 'insights',
    defaultSize: 'md',
    allowedSizes: ['md', 'lg', 'full'],
    minWidth: 6,
    component: ChartsWidget,
    permissions: ['reports.read'],
    dataRefreshInterval: 300000, // 5 minutes
    configSchema: {
      fields: [
        {
          key: 'chartType',
          label: 'Chart Type',
          type: 'select',
          options: [
            { value: 'bar', label: 'Bar Chart' },
            { value: 'pie', label: 'Pie Chart' },
            { value: 'line', label: 'Line Chart' },
            { value: 'funnel', label: 'Funnel' },
          ],
          defaultValue: 'bar',
        },
        {
          key: 'dataSource',
          label: 'Data Source',
          type: 'select',
          options: [
            { value: 'leads_by_stage', label: 'Leads by Stage' },
            { value: 'leads_by_source', label: 'Leads by Source' },
            { value: 'leads_by_priority', label: 'Leads by Priority' },
            { value: 'conversion_funnel', label: 'Conversion Funnel' },
            { value: 'leads_over_time', label: 'Leads Over Time' },
          ],
          defaultValue: 'leads_by_stage',
        },
      ],
    },
  },

  alerts: {
    id: 'alerts',
    title: 'Alerts',
    description: 'Notifications and important alerts',
    icon: Bell,
    category: 'insights',
    defaultSize: 'md',
    allowedSizes: ['sm', 'md', 'lg'],
    component: AlertsWidget,
    dataRefreshInterval: 30000,
    configSchema: {
      fields: [
        {
          key: 'showRead',
          label: 'Show Read Alerts',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'maxAlerts',
          label: 'Max Alerts',
          type: 'number',
          defaultValue: 5,
        },
      ],
    },
  },

  goals: {
    id: 'goals',
    title: 'Goals',
    description: 'Track your targets and progress',
    icon: Target,
    category: 'insights',
    defaultSize: 'md',
    allowedSizes: ['sm', 'md', 'lg'],
    component: GoalsWidget,
    dataRefreshInterval: 60000,
    configSchema: {
      fields: [
        {
          key: 'showCompleted',
          label: 'Show Completed',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'period',
          label: 'Default Period',
          type: 'select',
          options: [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' },
          ],
          defaultValue: 'monthly',
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Collaboration Category
  // ---------------------------------------------------------------------------
  team: {
    id: 'team',
    title: 'Team Activity',
    description: 'See what your team is working on',
    icon: UsersRound,
    category: 'collaboration',
    defaultSize: 'md',
    allowedSizes: ['sm', 'md', 'lg'],
    component: TeamWidget,
    dataRefreshInterval: 30000,
    configSchema: {
      fields: [
        {
          key: 'showOnlineOnly',
          label: 'Online Only',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'maxMembers',
          label: 'Max Members',
          type: 'number',
          defaultValue: 10,
        },
      ],
    },
  },

  'ai-insights': {
    id: 'ai-insights',
    title: 'AI Insights',
    description: 'AI-powered recommendations and analysis',
    icon: Sparkles,
    category: 'insights',
    defaultSize: 'md',
    allowedSizes: ['md', 'lg'],
    minWidth: 6,
    component: AIInsightsWidget,
    dataRefreshInterval: 300000, // 5 minutes
    configSchema: {
      fields: [
        {
          key: 'showScoreFactors',
          label: 'Show Score Factors',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          key: 'maxRecommendations',
          label: 'Max Recommendations',
          type: 'number',
          defaultValue: 3,
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Command Center Category (New)
  // ---------------------------------------------------------------------------
  'action-queue': {
    id: 'action-queue',
    title: 'Action Queue',
    description: 'What needs attention right now',
    icon: ListTodo,
    category: 'productivity',
    defaultSize: 'md',
    allowedSizes: ['sm', 'md', 'lg'],
    component: ActionQueueWidget,
    dataRefreshInterval: 30000,
    configSchema: {
      fields: [
        {
          key: 'filter',
          label: 'Default Filter',
          type: 'select',
          options: [
            { value: 'all', label: 'All Items' },
            { value: 'urgent', label: 'Urgent Only' },
            { value: 'tasks', label: 'Tasks Only' },
            { value: 'deals', label: 'Deals Only' },
          ],
          defaultValue: 'all',
        },
        {
          key: 'maxItems',
          label: 'Max Items',
          type: 'number',
          defaultValue: 5,
        },
      ],
    },
  },

  'kpi-strip': {
    id: 'kpi-strip',
    title: 'KPI Strip',
    description: 'Key performance indicators at a glance',
    icon: Gauge,
    category: 'metrics',
    defaultSize: 'full',
    allowedSizes: ['md', 'lg', 'full'],
    minWidth: 6,
    component: KPIStripWidget,
    dataRefreshInterval: 60000,
    configSchema: {
      fields: [
        {
          key: 'showTrends',
          label: 'Show Trends',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          key: 'compactMode',
          label: 'Compact Mode',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Operations & Reporting Category
  // ---------------------------------------------------------------------------
  'plan-type': {
    id: 'plan-type',
    title: 'Plan Type Breakdown',
    description: 'HealthShare vs Traditional Insurance distribution',
    icon: Shield,
    category: 'metrics',
    defaultSize: 'md',
    allowedSizes: ['sm', 'md', 'lg'],
    component: PlanTypeWidget,
    dataRefreshInterval: 60000,
    configSchema: {
      fields: [
        {
          key: 'showNewCounts',
          label: 'Show New Counts',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  },

  'advisor-performance': {
    id: 'advisor-performance',
    title: 'Advisor Performance',
    description: 'Per-advisor lead counts, conversion, and activity',
    icon: UserCheck,
    category: 'metrics',
    defaultSize: 'lg',
    allowedSizes: ['sm', 'md', 'lg'],
    component: AdvisorWidget,
    dataRefreshInterval: 120000,
    configSchema: {
      fields: [
        {
          key: 'maxAdvisors',
          label: 'Max Advisors',
          type: 'number',
          defaultValue: 8,
        },
        {
          key: 'sortBy',
          label: 'Sort By',
          type: 'select',
          options: [
            { value: 'total_leads', label: 'Total Leads' },
            { value: 'conversion', label: 'Conversion Rate' },
            { value: 'activity', label: 'Activity Count' },
          ],
          defaultValue: 'total_leads',
        },
      ],
    },
  },

  'pipeline-breakdown': {
    id: 'pipeline-breakdown',
    title: 'Pipeline by Plan Type',
    description: 'Pipeline stages segmented by HealthShare vs Traditional',
    icon: GitPullRequest,
    category: 'metrics',
    defaultSize: 'md',
    allowedSizes: ['sm', 'md', 'lg'],
    component: PipelineBreakdownWidget,
    dataRefreshInterval: 60000,
    configSchema: {
      fields: [
        {
          key: 'showLegend',
          label: 'Show Legend',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getWidgetConfig(widgetId: string): WidgetConfig | undefined {
  return widgetRegistry[widgetId];
}

export function getWidgetsByCategory(category: string): WidgetConfig[] {
  return Object.values(widgetRegistry).filter((w) => w.category === category);
}

export function getAllWidgets(): WidgetConfig[] {
  return Object.values(widgetRegistry);
}

export function getWidgetCategories(): string[] {
  const categories = new Set(Object.values(widgetRegistry).map((w) => w.category));
  return Array.from(categories);
}

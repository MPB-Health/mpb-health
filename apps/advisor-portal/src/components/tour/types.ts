// ============================================================================
// Feature Tour Types — Guided product tours
// ============================================================================

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  id: string;
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  placement?: TourPlacement;
  highlightPadding?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  beforeShow?: () => void | Promise<void>;
  afterHide?: () => void | Promise<void>;
}

export interface TourDefinition {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  version: number; // Increment to show tour again after updates
}

export type TourId =
  | 'power-list-tour'
  | 'inbox-tour'
  | 'automations-tour'
  | 'analytics-tour';

// ============================================================================
// Tour Definitions
// ============================================================================

export const TOURS: Record<TourId, TourDefinition> = {
  'power-list-tour': {
    id: 'power-list-tour',
    name: 'Power List Tour',
    description: 'Learn how to use the Power List to prioritize your leads',
    version: 1,
    steps: [
      {
        id: 'pl-lanes',
        target: '[data-tour="priority-lanes"]',
        title: 'Priority Lanes',
        content:
          'Your leads are organized into Hot, Warm, and Nurture lanes. Hot leads need immediate attention, while Nurture leads can be followed up later.',
        placement: 'bottom',
      },
      {
        id: 'pl-lead-card',
        target: '[data-tour="lead-card"]',
        title: 'Lead Cards',
        content:
          'Each card shows key info at a glance: name, contact info, score, and last activity. Click to expand and see more details.',
        placement: 'right',
      },
      {
        id: 'pl-score',
        target: '[data-tour="lead-score"]',
        title: 'Lead Score',
        content:
          'The score (0-100) is calculated by AI based on engagement, fit, and activity. Higher scores indicate leads more likely to convert.',
        placement: 'left',
      },
      {
        id: 'pl-actions',
        target: '[data-tour="quick-actions"]',
        title: 'Quick Actions',
        content:
          'Take action without leaving the page. Call, email, snooze, or move leads between lanes with one click.',
        placement: 'top',
      },
      {
        id: 'pl-snooze',
        target: '[data-tour="snooze-button"]',
        title: 'Snooze Leads',
        content:
          'Not ready to contact someone? Snooze them and they\'ll reappear at the time you choose. Perfect for timing your follow-ups.',
        placement: 'top',
      },
    ],
  },

  'inbox-tour': {
    id: 'inbox-tour',
    name: 'Inbox Tour',
    description: 'Master your unified inbox for all communications',
    version: 1,
    steps: [
      {
        id: 'inbox-list',
        target: '[data-tour="conversation-list"]',
        title: 'Conversations',
        content:
          'All your conversations are listed here. Email and SMS threads are combined for each lead, so you see the full picture.',
        placement: 'right',
      },
      {
        id: 'inbox-thread',
        target: '[data-tour="message-thread"]',
        title: 'Message Thread',
        content:
          'View the full conversation history here. Messages are displayed in chronological order with clear indicators for email vs SMS.',
        placement: 'left',
      },
      {
        id: 'inbox-compose',
        target: '[data-tour="compose-area"]',
        title: 'Compose Messages',
        content:
          'Write and send messages directly from here. Switch between email and SMS, or use templates to save time.',
        placement: 'top',
      },
      {
        id: 'inbox-templates',
        target: '[data-tour="template-button"]',
        title: 'Templates',
        content:
          'Use pre-written templates for common messages. Templates support variables like {{first_name}} for personalization.',
        placement: 'top',
      },
    ],
  },

  'automations-tour': {
    id: 'automations-tour',
    name: 'Automations Tour',
    description: 'Set up rules to automate your workflow',
    version: 1,
    steps: [
      {
        id: 'auto-list',
        target: '[data-tour="automation-list"]',
        title: 'Your Automations',
        content:
          'View and manage all your automation rules here. Active rules run automatically; paused rules won\'t trigger.',
        placement: 'right',
      },
      {
        id: 'auto-create',
        target: '[data-tour="create-automation"]',
        title: 'Create Automation',
        content:
          'Click here to create a new automation rule. Start from scratch or use a template to get going quickly.',
        placement: 'bottom',
      },
      {
        id: 'auto-trigger',
        target: '[data-tour="trigger-section"]',
        title: 'Triggers',
        content:
          'Triggers define WHEN an automation runs. For example: "When a new lead is created" or "When a lead opens an email".',
        placement: 'right',
      },
      {
        id: 'auto-action',
        target: '[data-tour="action-section"]',
        title: 'Actions',
        content:
          'Actions define WHAT happens when triggered. Send emails, create tasks, update lead data, and more.',
        placement: 'right',
      },
      {
        id: 'auto-stats',
        target: '[data-tour="automation-stats"]',
        title: 'Statistics',
        content:
          'Track how your automations are performing. See how many times they\'ve run and their success rate.',
        placement: 'top',
      },
    ],
  },

  'analytics-tour': {
    id: 'analytics-tour',
    name: 'Analytics Tour',
    description: 'Understand your performance metrics',
    version: 1,
    steps: [
      {
        id: 'analytics-kpis',
        target: '[data-tour="kpi-cards"]',
        title: 'Key Metrics',
        content:
          'Your most important KPIs at a glance. These update in real-time and show trends compared to the previous period.',
        placement: 'bottom',
      },
      {
        id: 'analytics-charts',
        target: '[data-tour="main-chart"]',
        title: 'Performance Charts',
        content:
          'Visualize your metrics over time. Hover over points to see exact values, and use the date picker to change the time range.',
        placement: 'top',
      },
      {
        id: 'analytics-goals',
        target: '[data-tour="goals-section"]',
        title: 'Goals',
        content:
          'Set and track personal performance goals. Progress is updated automatically based on your activity.',
        placement: 'left',
      },
      {
        id: 'analytics-export',
        target: '[data-tour="export-button"]',
        title: 'Export Reports',
        content:
          'Download your data as CSV or PDF. You can also schedule regular reports to be emailed to you.',
        placement: 'bottom',
      },
    ],
  },
};

export function getTourById(tourId: TourId): TourDefinition | undefined {
  return TOURS[tourId];
}

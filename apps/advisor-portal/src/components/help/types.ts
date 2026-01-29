// ============================================================================
// Help System Types — Contextual help and tooltips
// ============================================================================

export type HelpTipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface HelpTipDefinition {
  id: string;
  title: string;
  content: string;
  learnMoreUrl?: string;
  feature?: string; // Related feature for onboarding tracking
}

export interface HelpTipProps {
  tipId: string;
  children: React.ReactNode;
  placement?: HelpTipPlacement;
  showOnce?: boolean; // Only show once per session/user
  delay?: number; // Delay before showing (ms)
  className?: string;
}

// Pre-defined help tips for various features
export const HELP_TIPS: Record<string, HelpTipDefinition> = {
  // Power List
  'power-list-lanes': {
    id: 'power-list-lanes',
    title: 'Priority Lanes',
    content: 'Leads are organized into Hot, Warm, and Nurture lanes based on their engagement and likelihood to convert. Focus on Hot leads first for best results.',
    feature: 'priority-lanes',
  },
  'power-list-scoring': {
    id: 'power-list-scoring',
    title: 'Lead Scoring',
    content: 'Each lead has a score from 0-100 based on their activity, engagement, and fit. Higher scores indicate leads more likely to convert.',
    feature: 'lead-scoring',
  },
  'power-list-snooze': {
    id: 'power-list-snooze',
    title: 'Snooze Leads',
    content: 'Not ready to contact a lead? Snooze them to move to the next lead. They\'ll reappear at the time you choose.',
    feature: 'quick-actions',
  },

  // Inbox
  'inbox-unified': {
    id: 'inbox-unified',
    title: 'Unified Conversations',
    content: 'All your email and SMS conversations with each lead are combined into a single thread. No more switching between apps.',
    feature: 'conversations',
  },
  'inbox-templates': {
    id: 'inbox-templates',
    title: 'Message Templates',
    content: 'Save time with reusable templates. Use variables like {{first_name}} to personalize each message automatically.',
    feature: 'templates',
  },
  'inbox-sequences': {
    id: 'inbox-sequences',
    title: 'Sequences',
    content: 'Enroll leads in multi-step outreach sequences. The system will automatically send follow-ups at the right time.',
    feature: 'sequences',
  },

  // Automations
  'automation-triggers': {
    id: 'automation-triggers',
    title: 'Triggers',
    content: 'Triggers define when an automation runs. For example: "When a lead is created" or "When a lead opens an email".',
    feature: 'triggers',
  },
  'automation-actions': {
    id: 'automation-actions',
    title: 'Actions',
    content: 'Actions define what happens when a trigger fires. Send emails, create tasks, update lead data, and more.',
    feature: 'actions',
  },
  'automation-conditions': {
    id: 'automation-conditions',
    title: 'Conditions',
    content: 'Add conditions to control when actions run. For example: "Only if lead score is above 50".',
  },

  // Analytics
  'analytics-kpis': {
    id: 'analytics-kpis',
    title: 'Key Performance Indicators',
    content: 'Track your most important metrics at a glance. Click any KPI card to see detailed trends and breakdowns.',
  },
  'analytics-goals': {
    id: 'analytics-goals',
    title: 'Performance Goals',
    content: 'Set personal goals to track your progress. Goals help you stay motivated and identify areas for improvement.',
  },

  // Compliance
  'compliance-training': {
    id: 'compliance-training',
    title: 'Required Training',
    content: 'Complete all required training modules to stay compliant. Overdue training may affect your compliance score.',
  },
  'compliance-documents': {
    id: 'compliance-documents',
    title: 'Document Acknowledgment',
    content: 'Review and acknowledge important compliance documents. These ensure you understand company policies and regulations.',
  },

  // Settings
  'settings-notifications': {
    id: 'settings-notifications',
    title: 'Notification Preferences',
    content: 'Control how and when you receive notifications. Set quiet hours, enable digest mode, and choose your channels.',
  },
  'settings-integrations': {
    id: 'settings-integrations',
    title: 'Integrations',
    content: 'Connect your favorite tools to sync data automatically. CRM, calendar, and communication integrations are available.',
  },

  // General
  'keyboard-shortcuts': {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    content: 'Press ? anytime to see all available keyboard shortcuts. Use Cmd+K (or Ctrl+K) to open the command palette.',
  },
  'global-search': {
    id: 'global-search',
    title: 'Global Search',
    content: 'Search across leads, messages, tasks, and more with Cmd+K. You can also run quick actions from the command palette.',
  },
};

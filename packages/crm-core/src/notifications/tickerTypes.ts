// ============================================================================
// Notification Ticker Types
// Real-time ticker for CRM activity feed across all apps
// ============================================================================

export type TickerEventType =
  | 'lead_created'
  | 'lead_updated'
  | 'lead_stage_changed'
  | 'deal_created'
  | 'deal_updated'
  | 'deal_won'
  | 'deal_lost'
  | 'task_created'
  | 'task_completed'
  | 'task_overdue'
  | 'activity_logged'
  | 'contact_created'
  | 'account_created'
  | 'invoice_created'
  | 'invoice_paid'
  | 'quote_created'
  | 'quote_accepted'
  | 'campaign_launched'
  | 'email_sent'
  | 'meeting_scheduled'
  | 'alert'
  | 'system';

export type TickerPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface TickerItem {
  id: string;
  type: TickerEventType;
  priority: TickerPriority;
  title: string;
  message: string;
  icon?: string;
  color?: string;
  entityId?: string;
  entityType?: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  read: boolean;
  metadata?: Record<string, unknown>;
}

export interface TickerFilter {
  types?: TickerEventType[];
  priorities?: TickerPriority[];
  entityTypes?: string[];
  startDate?: string;
  endDate?: string;
  unreadOnly?: boolean;
  limit?: number;
}

export interface TickerStats {
  total: number;
  unread: number;
  byType: Record<TickerEventType, number>;
  byPriority: Record<TickerPriority, number>;
}

export interface TickerSubscriptionCallback {
  (item: TickerItem): void;
}

// Icon and color mappings for different event types
export const TICKER_EVENT_CONFIG: Record<TickerEventType, { icon: string; color: string; label: string }> = {
  lead_created: { icon: 'UserPlus', color: 'green', label: 'New Lead' },
  lead_updated: { icon: 'UserCog', color: 'blue', label: 'Lead Updated' },
  lead_stage_changed: { icon: 'GitBranch', color: 'violet', label: 'Stage Changed' },
  deal_created: { icon: 'Briefcase', color: 'emerald', label: 'New Deal' },
  deal_updated: { icon: 'FileEdit', color: 'blue', label: 'Deal Updated' },
  deal_won: { icon: 'Trophy', color: 'yellow', label: 'Deal Won' },
  deal_lost: { icon: 'XCircle', color: 'red', label: 'Deal Lost' },
  task_created: { icon: 'ListTodo', color: 'indigo', label: 'New Task' },
  task_completed: { icon: 'CheckCircle', color: 'green', label: 'Task Done' },
  task_overdue: { icon: 'AlertTriangle', color: 'orange', label: 'Task Overdue' },
  activity_logged: { icon: 'Activity', color: 'cyan', label: 'Activity' },
  contact_created: { icon: 'UserPlus', color: 'teal', label: 'New Contact' },
  account_created: { icon: 'Building', color: 'purple', label: 'New Account' },
  invoice_created: { icon: 'FileText', color: 'slate', label: 'Invoice Created' },
  invoice_paid: { icon: 'DollarSign', color: 'green', label: 'Invoice Paid' },
  quote_created: { icon: 'FileCheck', color: 'amber', label: 'Quote Created' },
  quote_accepted: { icon: 'ThumbsUp', color: 'green', label: 'Quote Accepted' },
  campaign_launched: { icon: 'Megaphone', color: 'pink', label: 'Campaign Live' },
  email_sent: { icon: 'Mail', color: 'sky', label: 'Email Sent' },
  meeting_scheduled: { icon: 'Calendar', color: 'violet', label: 'Meeting Set' },
  alert: { icon: 'Bell', color: 'red', label: 'Alert' },
  system: { icon: 'Info', color: 'gray', label: 'System' },
};

// Priority colors for styling
export const TICKER_PRIORITY_COLORS: Record<TickerPriority, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  normal: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  urgent: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export type NotificationType = 'lead' | 'task' | 'event' | 'performance_lag';

export interface UnifiedNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  priority: 'normal' | 'high' | 'critical';
  lead_id: string | null;
  created_at: string;
  read: boolean;
  // Optional deep-link target for notifications without a lead context
  // (e.g. the Performance Lag alert routes to the Daily Log).
  action_url?: string | null;
}

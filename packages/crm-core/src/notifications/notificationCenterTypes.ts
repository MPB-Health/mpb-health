export type NotificationType = 'lead' | 'task' | 'event';

export interface UnifiedNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  priority: 'normal' | 'high' | 'critical';
  lead_id: string | null;
  created_at: string;
  read: boolean;
}

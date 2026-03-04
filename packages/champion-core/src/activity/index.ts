// ============================================================================
// Activity Module — Public exports
// ============================================================================

export { ActivityService, activityService, ACTIVITY_CONFIG } from './ActivityService';
export { NotificationService, notificationService } from './NotificationService';
export { NotificationEventsService, notificationEventsService } from './NotificationEventsService';
export type { NotificationEvent, NotificationEventType, NotificationEventsListOptions } from './NotificationEventsService';

export type {
  // Enums
  ActivityType,
  NotificationPriority,
  NotificationChannel,
  NotificationCategory,

  // Activity
  Activity,
  ActivityWithActor,
  LogActivityInput,
  ActivityFeedItem,
  ActivityFeedParams,

  // Notification
  Notification,
  CreateNotificationInput,
  NotificationSummary,

  // Preferences
  NotificationPreferencesOverride,
  UpdatePreferencesOverrideInput,

  // Subscription
  ActivitySubscription,
} from './types';

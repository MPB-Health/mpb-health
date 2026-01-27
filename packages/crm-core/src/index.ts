// Lead Management
export { LeadService, createLeadService } from './leads/leadService';
export { PipelineService, createPipelineService } from './leads/pipelineService';
export type {
  Lead,
  LeadFilters,
  LeadPriority,
  ZohoSyncStatus,
  PipelineStage,
  CRMDashboardStats,
  BulkUpdateResult,
  LeadCreateInput,
  LeadUpdateInput,
} from './leads/leadTypes';
export { DEFAULT_PIPELINE_STAGES } from './leads/leadTypes';

// Activities
export { ActivityService, createActivityService } from './activities/activityService';
export type {
  LeadActivity,
  ActivityType,
  ActivityCreateInput,
  CallMetadata,
  EmailMetadata,
  MeetingMetadata,
} from './activities/types';

// Tasks
export { TaskService, createTaskService } from './tasks/taskService';
export type {
  LeadTask,
  TaskType,
  TaskPriority,
  TaskCreateInput,
  TaskUpdateInput,
} from './tasks/types';

// Zoho Integration
export { ZohoService, createZohoService } from './zoho/zohoService';
export type {
  ZohoLead,
  ZohoSyncResult,
  ZohoBulkSyncResult,
  ZohoSyncStats,
} from './zoho/types';
export { STAGE_TO_ZOHO_STATUS } from './zoho/types';

// Priority Classification
export {
  PriorityService,
  createPriorityService,
  getPriorityColor,
  getPriorityLabel,
  shouldPlaySound,
  getToastDismissTime,
} from './priority/priorityService';
export type {
  LeadPriority as NotificationPriority,
  LeadData,
  PriorityClassification,
  PriorityColors,
} from './priority/types';
export { URGENCY_KEYWORDS } from './priority/types';

// Notifications
export { NotificationService, createNotificationService, formatTimeAgo } from './notifications/notificationService';
export type {
  LeadSubmission,
  EnhancedLeadSubmission,
  NewLeadCallback,
  EnhancedLeadCallback,
  LeadCountsByPriority,
  NotificationStats,
} from './notifications/types';

// Calendar
export { CalendarService, createCalendarService } from './calendar/calendarService';
export type {
  CalendarEvent,
  CalendarEventType,
  CalendarEventStatus,
  CalendarEventCreateInput,
  CalendarEventUpdateInput,
  CalendarFilters,
} from './calendar/types';

// AI Insights
export { InsightsService, createInsightsService } from './insights/insightsService';
export type {
  AILeadInsight,
  ScoreFactor,
  AIGeneratedDraft,
} from './insights/types';

// Templates
export { TemplateService, createTemplateService } from './templates/templateService';
export type {
  CRMTemplate,
  TemplateType,
  TemplateVariable,
  TemplateCreateInput,
  TemplateUpdateInput,
  TemplateFilters,
} from './templates/types';

// Email
export { EmailService, createEmailService } from './email/emailService';
export type {
  EmailSendInput,
  EmailSendResult,
  EmailLogEntry,
} from './email/types';

// Re-export all from submodules for convenience
export * from './leads';
export * from './activities';
export * from './tasks';
export * from './zoho';
export * from './priority';
export * from './notifications';
export * from './calendar';
export * from './insights';
export * from './templates';
export * from './email';

export { EmailService, createEmailService } from './emailService';
export { EmailScheduleService, createEmailScheduleService } from './emailScheduleService';
export { EmailTrackingService, createEmailTrackingService } from './emailTrackingService';
export type {
  EmailSendInput,
  EmailSendResult,
  EmailLogEntry,
  EmailLogFilters,
  // Schedules
  EmailSchedule,
  EmailScheduleCreateInput,
  EmailScheduleUpdateInput,
  ScheduleType,
  ScheduleStatus,
  ScheduleConfig,
  RecipientType,
  // Tracking
  EmailTracking,
  EmailTrackingStats,
  TrackingType,
  DeviceType,
} from './types';

// Basic email service
export { EmailService, createEmailService } from './emailService';
export { EmailScheduleService, createEmailScheduleService } from './emailScheduleService';
export { EmailTrackingService, createEmailTrackingService } from './emailTrackingService';

// Championship Email System
export { SignatureService, createSignatureService } from './signatureService';
export { DraftService, createDraftService } from './draftService';
export { ComposerService, createComposerService } from './composerService';

// Legacy types (from types.ts)
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

// Championship Email Types (from emailTypes.ts)
export type {
  // Signatures
  SocialLink,
  EmailSignature,
  SignatureCreateInput,
  SignatureUpdateInput,
  // Attachments
  EmailAttachment,
  AttachmentUploadInput,
  AttachmentUploadResult,
  // Drafts
  EmailDraft,
  DraftCreateInput,
  DraftUpdateInput,
  // Threads
  EmailThread,
  ThreadFilters,
  // Enhanced Email Log
  EmailDirection,
  EnhancedEmailLog,
  EnhancedEmailFilters,
  // Send types
  EnhancedEmailSendInput,
  EnhancedEmailSendResult,
  // Inbox
  InboxFolder,
  InboxStats,
  // Webhooks
  ResendWebhookType,
  ResendWebhookPayload,
} from './emailTypes';

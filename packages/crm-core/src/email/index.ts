// Basic email service
export { EmailService, createEmailService } from './emailService';
export { EmailScheduleService, createEmailScheduleService } from './emailScheduleService';
export { EmailTrackingService, createEmailTrackingService } from './emailTrackingService';

// Championship Email System
export { SignatureService, createSignatureService } from './signatureService';
export { DraftService, createDraftService } from './draftService';
export { ComposerService, createComposerService } from './composerService';

// Connected Inbox (Outlook-class)
export { MailAccountService, createMailAccountService } from './mailAccountService';
export { MailSyncService, createMailSyncService } from './mailSyncService';
export { MailRulesService, createMailRulesService } from './mailRulesService';
export { DomainService, createDomainService } from './domainService';

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

// Connected Inbox Types
export type {
  MailProvider,
  MailSyncStatus,
  MailAccount,
  MailFolder,
  MailMessage,
  MailMessageAttachment,
  MailSharedAccess,
} from './mailAccountService';

export type {
  MailMessageFilters,
  MailMessageQueryOptions,
  MailThread as ConnectedMailThread,
  MailSearchResult,
  UnifiedInboxStats,
} from './mailSyncService';

export type {
  RuleCondition,
  RuleAction,
  MailRule,
  MailRuleCreateInput,
  MailRuleUpdateInput,
} from './mailRulesService';

export type {
  DomainVerificationStatus,
  MailDomain,
  SenderIdentity,
  DomainHealthResult,
  RequiredDnsRecords,
} from './domainService';

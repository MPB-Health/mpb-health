// Types
export * from './types';

// Services
export {
  UserService,
  userService,
  type CrossPortalUser,
  type AdvisorProfileSummary,
  type PortalRole,
} from './users/UserService';
export { EnrollmentService, enrollmentService } from './enrollments/EnrollmentService';
export { ContentService, contentService } from './content/ContentService';
export {
  BulletinService,
  bulletinService,
  type AdminBulletin,
  type BulletinCategory,
  type BulletinCreateInput,
  type BulletinUpdateInput,
} from './content/BulletinService';
export { SettingsService, settingsService } from './settings/SettingsService';
export { AuditService, auditService } from './audit/AuditService';
export { AnalyticsService, analyticsService } from './analytics/AnalyticsService';
export {
  CRMBridgeService,
  crmBridgeService,
  type CRMSummary,
  type CRMLead,
  type CRMLeadDetail,
  type CRMLeadFilters,
  type CRMActivity,
  type CRMTask,
  type CRMContact,
  type ConvertLeadInput,
} from './analytics/CRMBridgeService';

// Specialized Settings Services
export {
  PaymentProcessorService,
  paymentProcessorService,
  type PaymentProcessor,
  type PaymentProcessorCreateInput,
  type PaymentProcessorUpdateInput,
  type PaymentProvider,
  type PaymentMethod,
} from './settings/PaymentProcessorService';

export {
  SmsAccountService,
  smsAccountService,
  type SmsAccount,
  type SmsAccountCreateInput,
  type SmsAccountUpdateInput,
  type SmsProvider,
  type SmsLogEntry,
  type SmsLogFilters,
  type SmsDirection,
  type SmsStatus,
} from './settings/SmsAccountService';

export {
  PromoCodeService,
  promoCodeService,
  type PromoCode,
  type PromoCodeCreateInput,
  type PromoCodeUpdateInput,
  type PromoCodeUsage,
  type PromoCodeFilters,
  type DiscountType,
} from './settings/PromoCodeService';

export {
  CodeInventoryService,
  codeInventoryService,
  type InventoryCode,
  type CodeBatch,
  type CodeCreateInput,
  type BatchCreateInput,
  type CodeFilters,
  type CodeType,
  type CodeStatus,
} from './settings/CodeInventoryService';

export {
  ResourcesService,
  resourcesService,
  type AdminResource,
  type ResourceCreateInput,
  type ResourceUpdateInput,
  type ResourceFilters,
  type ResourceCategory,
} from './settings/ResourcesService';

export {
  ESignatureService,
  eSignatureService,
  type ESignatureProviderConfig,
  type ESignatureDocument,
  type DocumentSigner,
  type ProviderCreateInput,
  type ProviderUpdateInput,
  type DocumentCreateInput,
  type DocumentFilters,
  type ESignatureProvider,
  type DocumentStatus,
  type DocumentType,
} from './settings/ESignatureService';

// CMS services for advisor portal content management
export {
  TrainingAdminService,
  trainingAdminService,
  type AdminTrainingModule,
  type TrainingModuleCreateInput,
  type TrainingModuleUpdateInput,
  type TrainingAdminStats,
} from './content/TrainingAdminService';

export {
  SOPAdminService,
  sopAdminService,
  type AdminSOPDocument,
  type SOPCategory,
  type SOPCreateInput,
  type SOPUpdateInput,
  type SOPAdminStats,
} from './content/SOPAdminService';

export {
  QuickLinksAdminService,
  quickLinksAdminService,
  type QuickLink,
  type QuickLinkCategory,
  type QuickLinkCreateInput,
  type QuickLinkUpdateInput,
} from './content/QuickLinksAdminService';

export {
  FormsAdminService,
  formsAdminService,
  type AdminForm,
  type FormCreateInput,
  type FormUpdateInput,
} from './content/FormsAdminService';

export {
  ContactDirectoryService,
  contactDirectoryService,
  type ContactEntry,
  type ContactCreateInput,
  type ContactUpdateInput,
} from './content/ContactDirectoryService';

export {
  NavigationAdminService,
  navigationAdminService,
  type NavMenuItem,
  type NavItemCreateInput,
  type NavItemUpdateInput,
} from './content/NavigationAdminService';

// Announcements management
export {
  AnnouncementAdminService,
  announcementAdminService,
  type AdminAnnouncement,
  type AnnouncementCreateInput,
  type AnnouncementUpdateInput,
} from './content/AnnouncementAdminService';

// Dashboard widgets management
export {
  WidgetAdminService,
  widgetAdminService,
  type DashboardWidget,
  type WidgetCreateInput,
  type WidgetUpdateInput,
} from './content/WidgetAdminService';

// Handbooks management
export {
  HandbookAdminService,
  handbookAdminService,
  type AdminHandbook,
  type HandbookCreateInput,
  type HandbookUpdateInput,
} from './content/HandbookAdminService';

// Video library (re-export from advisor-core — already has full CRUD)
export { VideoService, videoService, type AdvisorVideo } from '@mpbhealth/advisor-core';

// Member management
export {
  MemberService,
  memberService,
  type MemberProfile,
  type MemberDependent,
  type MemberClaim,
  type MemberStats,
  type MemberFilters,
} from './members/MemberService';

// System health
export {
  SystemHealthService,
  systemHealthService,
  type EdgeFunctionStatus,
  type SystemHealthSummary,
} from './system/SystemHealthService';

// Messaging admin
export {
  ChatAdminService,
  chatAdminService,
  type ChatConversationAdmin,
  type ChatMessageAdmin,
  type ChatAdminStats,
} from './messaging/ChatAdminService';

export {
  PushAdminService,
  pushAdminService,
  type PushDevice,
  type NotificationEvent,
  type PushAdminStats,
} from './messaging/PushAdminService';

// Events management
export {
  EventsAdminService,
  eventsAdminService,
  type AdminEvent,
  type EventCreateInput,
  type EventUpdateInput,
  type EventFilters,
  type EventLocationType,
  type EventType,
} from './content/EventsAdminService';

// Newsletter management
export {
  NewsletterAdminService,
  newsletterAdminService,
  type NewsletterSubscriber,
  type NewsletterStats,
  type NewsletterStatus,
} from './content/NewsletterAdminService';

// Lead submissions
export {
  LeadSubmissionService,
  leadSubmissionService,
  type LeadSubmission,
  type LeadSubmissionFilters,
  type LeadSubmissionStats,
} from './leads/LeadSubmissionService';

// FAQ management
export {
  FAQAdminService,
  faqAdminService,
  type FAQItem,
  type FAQCreateInput,
  type FAQUpdateInput,
  type FAQStats,
} from './content/FAQAdminService';

// Analytics overview
export {
  AnalyticsOverviewService,
  analyticsOverviewService,
  type TrafficDay,
  type AnalyticsOverviewStats,
} from './analytics/AnalyticsOverviewService';

// Enrollment links (advisor portal enrollment page)
export {
  EnrollmentLinksAdminService,
  enrollmentLinksAdminService,
  type EnrollmentLink,
  type EnrollmentLinkCreateInput,
  type EnrollmentLinkUpdateInput,
} from './content/EnrollmentLinksAdminService';

// Portal settings (key-value store)
export {
  PortalSettingsAdminService,
  portalSettingsAdminService,
  type PortalSetting,
} from './content/PortalSettingsAdminService';

// CRM email templates
export {
  EmailTemplateAdminService,
  emailTemplateAdminService,
  type EmailTemplate,
  type EmailTemplateCreateInput,
  type EmailTemplateUpdateInput,
  type EmailTemplateStats,
} from './crm/EmailTemplateAdminService';

// CRM calendar
export {
  CalendarAdminService,
  calendarAdminService,
  type CalendarEvent,
  type CalendarEventCreateInput,
  type CalendarEventUpdateInput,
} from './crm/CalendarAdminService';

// Lead assignment workflow
export {
  LeadAssignmentService,
  leadAssignmentService,
  type AssignableLead,
  type AdvisorOption,
  type LeadAssignmentStats,
} from './operations/LeadAssignmentService';

// Notification rules
export {
  NotificationRuleService,
  notificationRuleService,
  type NotificationRule,
  type NotificationEventLog,
  type NotificationRuleStats,
  type NotificationRuleUpdateInput,
} from './settings/NotificationRuleService';

// Support / Ticket management (re-exports from advisor-core via thin wrapper)
export {
  TicketService,
  ticketService,
  type AdminTicket,
  type AdminTicketDetail,
  type AdminTicketListResult,
  type AdminListTicketsOptions,
  type TicketStats,
  type TicketStatus,
  type TicketPriority,
  type TicketComment,
  type TicketRequester,
  type UpdateTicketOptions,
  type CreateTicketOptions,
  type CreateTicketResult,
} from './support/AdminTicketService';

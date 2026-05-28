// Lead Management
export { LeadService, createLeadService, LEAD_ROW_SELECT } from './leads/leadService';
export {
  getLeadAssignees,
  type LeadAssignee,
  type LeadAssigneeKind,
} from './leads/leadAssigneeService';
export { PipelineService, createPipelineService } from './leads/pipelineService';
export type {
  Lead,
  LeadFilters,
  LeadPriority,
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
  NotificationPriority,
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
export { EmailScheduleService, createEmailScheduleService } from './email/emailScheduleService';
export { EmailTrackingService, createEmailTrackingService } from './email/emailTrackingService';
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
} from './email/types';

// Scoring
export { ScoringService, createScoringService } from './scoring/scoringService';
export type {
  ScoringWeightConfig,
  ScoringWeightUpdateInput,
  LeadScoreBreakdown,
  ScoreFactorDetail,
} from './scoring/types';

// Reporting
export { ReportingService, createReportingService } from './reporting/reportingService';
export { SavedReportsService, createSavedReportsService } from './reporting/savedReportsService';
export { ExportArchiveService, createExportArchiveService } from './reporting/exportArchiveService';
export { UserPresenceService, createUserPresenceService } from './reporting/userPresenceService';
export { InteractionLogsService, createInteractionLogsService } from './reporting/interactionLogsService';
export type {
  ReportDateRange,
  ConversionFunnelData,
  LeadSourceBreakdown,
  ResponseTimeMetrics,
  TeamPerformanceRow,
  // Saved Reports
  ReportType,
  SavedReport,
  SavedReportCreateInput,
  SavedReportUpdateInput,
  SavedReportSchedule,
  // Export Archive
  ReportExport,
  ReportExportCreateInput,
  ExportFormat,
  ExportStatus,
  // User Presence
  UserPresence,
  UserPresenceStatus,
  UserPresenceUpdateInput,
  // Interaction Logs
  InteractionLog,
  InteractionLogCreateInput,
  InteractionFilters,
  InteractionStats,
  InteractionType,
  InteractionDirection,
  InteractionOutcome,
  InteractionSentiment,
} from './reporting/types';

// Automation
export { AutomationService, createAutomationService } from './automation/automationService';
export type {
  AutomationRule,
  AutomationRuleCreateInput,
  AutomationRuleUpdateInput,
  AutomationExecutionLog,
  AutomationEvent,
  AutomationTriggerType,
  AutomationActionType,
} from './automation/types';

// Re-export all from submodules for convenience
export * from './leads';
export * from './activities';
export * from './tasks';
export * from './priority';
export * from './notifications';
export * from './calendar';
export * from './insights';
export * from './templates';
export * from './email';
export * from './automation';
export * from './reporting';
export * from './scoring';

// Accounts
export { AccountService, createAccountService } from './accounts/accountService';
export type {
  Account,
  AccountWithRelations,
  AccountFilters,
  AccountCreateInput,
  AccountUpdateInput,
} from './accounts/accountTypes';
export * from './accounts';

// Contacts
export { ContactService, createContactService } from './contacts/contactService';
export type {
  Contact,
  ContactWithRelations,
  ContactFilters,
  ContactCreateInput,
  ContactUpdateInput,
  ConvertLeadInput,
} from './contacts/contactTypes';
export * from './contacts';

// Deals
export { DealService, createDealService } from './deals/dealService';
export type {
  Deal,
  DealWithRelations,
  DealStage,
  DealFilters,
  DealCreateInput,
  DealUpdateInput,
  DealStageHistory,
} from './deals/dealTypes';
export * from './deals';

// Products
export { ProductService, createProductService } from './products/productService';
export { PriceBookService, createPriceBookService } from './products/priceBookService';
export type {
  Product,
  ProductWithRelations,
  ProductFilters,
  ProductCreateInput,
  ProductUpdateInput,
  PriceBook,
  PriceBookWithRelations,
  PriceBookItem,
  PriceBookFilters,
  PriceBookCreateInput,
  PriceBookUpdateInput,
  PriceBookItemCreateInput,
} from './products/productTypes';
export * from './products';

// Quotes
export { QuoteService, createQuoteService } from './quotes/quoteService';
export type {
  Quote,
  QuoteWithRelations,
  QuoteLineItem,
  QuoteStatus,
  QuoteFilters,
  QuoteCreateInput,
  QuoteUpdateInput,
  QuoteLineItemCreateInput,
  QuoteLineItemUpdateInput,
} from './quotes/quoteTypes';
export * from './quotes';

// Invoices
export { InvoiceService, createInvoiceService } from './invoices/invoiceService';
export type {
  Invoice,
  InvoiceWithRelations,
  InvoiceLineItem,
  InvoicePayment,
  InvoiceFilters,
  InvoiceCreateInput,
  InvoiceUpdateInput,
  InvoiceLineItemCreateInput,
  InvoiceLineItemUpdateInput,
  PaymentCreateInput,
} from './invoices/invoiceTypes';
export * from './invoices';

// Campaigns
export { CampaignService, createCampaignService } from './campaigns/campaignService';
export type {
  Campaign,
  CampaignWithRelations,
  CampaignMember,
  CampaignFilters,
  CampaignCreateInput,
  CampaignUpdateInput,
  CampaignMemberCreateInput,
  CampaignStats,
  CampaignStatus,
  CampaignType,
  MemberStatus,
} from './campaigns/campaignTypes';
export * from './campaigns';

// Vendors
export { VendorService, createVendorService } from './vendors/vendorService';
export type {
  Vendor,
  VendorWithRelations,
  VendorFilters,
  VendorCreateInput,
  VendorUpdateInput,
  VendorType,
} from './vendors/vendorTypes';
export * from './vendors';

// Purchase Orders
export { PurchaseOrderService, createPurchaseOrderService } from './purchase-orders/purchaseOrderService';
export type {
  PurchaseOrder,
  PurchaseOrderWithRelations,
  POLineItem,
  POStatus,
  ApprovalStatus as POApprovalStatus,
  POFilters,
  POCreateInput,
  POUpdateInput,
  POLineItemCreateInput,
  POLineItemUpdateInput,
} from './purchase-orders/purchaseOrderTypes';

// Sales Orders
export { SalesOrderService, createSalesOrderService } from './sales-orders/salesOrderService';
export type {
  SalesOrder,
  SalesOrderWithRelations,
  SOLineItem,
  SOStatus,
  ApprovalStatus as SOApprovalStatus,
  SOFilters,
  SOCreateInput,
  SOUpdateInput,
  SOLineItemCreateInput,
  SOLineItemUpdateInput,
} from './sales-orders/salesOrderTypes';

// Cases / Support
export { CaseService, createCaseService } from './cases/caseService';
export type {
  Case,
  CaseWithRelations,
  CaseComment,
  CaseStatus,
  CasePriority,
  CaseOrigin,
  CaseFilters,
  CaseCreateInput,
  CaseUpdateInput,
  CaseCommentCreateInput,
} from './cases/caseTypes';

// CRM Studio (Custom Modules, Fields, Layouts, Views, Validation)
export {
  // Services
  ModuleService,
  createModuleService,
  FieldService,
  createFieldService,
  LayoutService,
  createLayoutService,
  ViewService,
  createViewService,
  ValidationService,
  createValidationService,
  DynamicRecordService,
  createDynamicRecordService,
} from './studio';
export type {
  // Field types
  FieldType,
  LayoutType,
  ViewVisibility,
  SortDirection,
  FilterOperator,
  // Module types
  StudioModule,
  StudioModuleWithRelations,
  ModuleCreateInput,
  ModuleUpdateInput,
  ModuleFilters,
  // Field types
  PicklistOption,
  LookupConfig,
  FormulaConfig,
  NumberConfig,
  AutoNumberConfig,
  FieldConfig,
  StudioField,
  FieldCreateInput,
  FieldUpdateInput,
  // Layout types
  LayoutFieldRef,
  LayoutSection,
  StudioLayout,
  LayoutCreateInput,
  LayoutUpdateInput,
  // View types
  ViewColumn,
  ViewFilter,
  StudioView,
  ViewCreateInput,
  ViewUpdateInput,
  // Validation types
  ValidationCondition,
  ValidationRule,
  ValidationRuleCreateInput,
  ValidationRuleUpdateInput,
  // Dynamic record types
  DynamicRecord,
  DynamicFilters,
  ValidationError,
  ValidationResult,
} from './studio';
export * from './studio';

// Import (CSV/Excel import for leads, contacts)
export { ImportService, createImportService } from './import/importService';
export type {
  ImportEntityType,
  ImportStatus,
  ImportFieldMapping,
  ImportJob,
  ImportOptions,
  ImportError,
  ImportPreview,
  ImportResult,
  LeadImportRow,
  ContactImportRow,
  QuoteSubmission,
  QuoteSubmissionFilters,
} from './import/importTypes';
export * from './import';

// Dashboard (Championship Command Center)
export {
  DashboardLayoutService,
  createDashboardLayoutService,
  DashboardNotesService,
  createDashboardNotesService,
  UserGoalsService,
  createUserGoalsService,
} from './dashboard';
export type {
  // Widget types
  WidgetSize,
  WidgetType,
  WidgetPosition,
  WidgetInstance,
  // Layout types
  DashboardLayout,
  DashboardLayoutInput,
  DefaultLayoutTemplate,
  // Note types
  NoteColor,
  DashboardNote,
  NoteCreateInput,
  NoteUpdateInput,
  // Goal types
  GoalMetricType,
  GoalPeriod,
  GoalStatus,
  UserGoal,
  GoalCreateInput,
  GoalUpdateInput,
  // Service result
  ServiceResult,
} from './dashboard';
export * from './dashboard';

// Plan Interests (Health Plan tracking for leads)
export {
  PlanInterestService,
  createPlanInterestService,
  HealthQuoteService,
  createHealthQuoteService,
} from './plan-interests';
export type {
  // Types
  FamilySize,
  InterestLevel,
  InterestSource,
  HouseholdType,
  HealthQuoteStatus,
  HealthQuoteSource,
  WebsiteSyncStatus,
  // Interfaces
  LeadPlanInterest,
  LeadPlanInterestWithPlan,
  QuoteLine,
  LeadHealthQuote,
  LeadHealthQuoteWithLead,
  ExtractedQuoteData,
  WebsiteQuoteSync,
  // Input types
  LeadPlanInterestCreateInput,
  LeadPlanInterestUpdateInput,
  HealthQuoteCreateInput,
  HealthQuoteUpdateInput,
  // Filter types
  PlanInterestFilters,
  HealthQuoteFilters,
  WebsiteSyncFilters,
  // Other
  AvailableHealthPlan,
} from './plan-interests';
export { FAMILY_SIZE_LABELS, INTEREST_LEVEL_LABELS, HOUSEHOLD_TYPE_LABELS } from './plan-interests';
export * from './plan-interests';

// Forecasting
export { ForecastingService, createForecastingService } from './forecasting/forecastingService';
export type {
  Forecast,
  ForecastEntry,
  ForecastEntryWithDeal,
  ForecastSummary,
  ForecastFilters,
  ForecastCreateInput,
  ForecastEntryUpdateInput,
  ForecastType,
  ForecastStatus,
  ForecastCategory,
  DealStageMetrics,
  PipelineHealth,
  RepForecast,
} from './forecasting/types';
export * from './forecasting';

// Web Forms
export { FormService, createFormService } from './forms/formService';
export type {
  WebForm,
  WebFormCreateInput,
  WebFormUpdateInput,
  WebFormSubmission,
  FormField,
  FormFieldType,
  FormSettings,
  FormStyling,
  FormStatus,
  FormEntityType,
  SubmissionStatus,
  SubmissionFilters,
  FormAnalytics,
  DuplicateHandling,
  FieldWidth,
  FormFieldValidation,
} from './forms/types';
export * from './forms';

// Social hub (posts + platform connection metadata; see migrations)
export { SocialService, createSocialService } from './social/socialService';
export type {
  SocialPost,
  SocialPostCreateInput,
  SocialPostUpdateInput,
  SocialPlatformConnection,
  SocialPlatformConnectionUpsertInput,
  SocialPlatformId,
  SocialPostStatus,
  SocialConnectionStatus,
  SocialConnectionMetadata,
} from './social/socialTypes';

// Approvals
export { ApprovalService, createApprovalService } from './approvals/approvalService';
export type {
  ApprovalProcess,
  ApprovalProcessWithSteps,
  ApprovalProcessCreateInput,
  ApprovalProcessUpdateInput,
  ApprovalStep,
  ApprovalStepCreateInput,
  ApprovalRequest,
  ApprovalRequestWithRelations,
  ApprovalAction,
  ApprovalStatus,
  ApprovalEntityType,
  ApproverType,
  RejectAction,
  ApprovalActionType,
  TriggerCondition,
} from './approvals/types';
export * from './approvals';

// Documents
export { DocumentService, createDocumentService } from './documents/documentService';
export type {
  Document,
  DocumentWithRelations,
  DocumentFilters,
  DocumentCreateInput,
  DocumentUpdateInput,
  DocumentCategory,
} from './documents/documentTypes';
export * from './documents';

// Saved Views
export { SavedViewService, createSavedViewService } from './saved-views/savedViewService';
export type {
  SavedView,
  SavedViewCreateInput,
  SavedViewUpdateInput,
} from './saved-views/savedViewTypes';
export * from './saved-views';

// Insurance Carriers
export { CarrierService, createCarrierService } from './carriers/carrierService';
export type {
  InsuranceCarrier,
  CarrierCreateInput,
  CarrierUpdateInput,
  CarrierFilters,
  CarrierType,
  PlanType,
  TobaccoStatus,
  GroupType,
} from './carriers/carrierTypes';
export {
  PLAN_TYPE_LABELS,
  TOBACCO_STATUS_LABELS,
  GROUP_TYPE_LABELS,
  CARRIER_TYPE_LABELS,
} from './carriers/carrierTypes';
export * from './carriers';

// Family Members & Phone Numbers
export { FamilyService, createFamilyService } from './family/familyService';
export type {
  FamilyMember,
  FamilyMemberCreateInput,
  FamilyMemberUpdateInput,
  FamilyRelationship,
  PhoneNumber,
  PhoneNumberCreateInput,
  PhoneNumberUpdateInput,
  PhoneType,
} from './family/familyTypes';
export {
  RELATIONSHIP_LABELS,
  PHONE_TYPE_LABELS,
} from './family/familyTypes';
export * from './family';

// Commissions
export { CommissionService, createCommissionService } from './commissions/commissionService';
export type {
  CommissionSchedule,
  CommissionScheduleCreateInput,
  CommissionScheduleUpdateInput,
  CommissionRecord,
  CommissionRecordCreateInput,
  CommissionRecordUpdateInput,
  CommissionPayout,
  CommissionPayoutCreateInput,
  CommissionFilters,
  CommissionSummary,
  AdvisorTier,
  CommissionRateType,
  CommissionStatus,
} from './commissions/commissionTypes';
export {
  ADVISOR_TIER_LABELS,
  COMMISSION_STATUS_LABELS,
} from './commissions/commissionTypes';
export * from './commissions';

// Attachments
export { AttachmentService, createAttachmentService } from './attachments/attachmentService';
export type {
  Attachment,
  AttachmentWithUploader,
  AttachmentCreateInput,
  AttachmentFilters,
  AttachmentCategory,
  AttachmentEntityType,
} from './attachments/attachmentTypes';
export * from './attachments';

// Audit
export { AuditService, createAuditService } from './audit/auditService';
export type {
  AuditEntry,
  AuditEntryWithUser,
  AuditLogInput,
  AuditFilters,
  AuditAction,
} from './audit/auditTypes';
export * from './audit';

// Gamification
export { GamificationService, createGamificationService } from './gamification/gamificationService';
export type {
  UserXP,
  Achievement,
  UserAchievement,
  XPEvent,
  LeaderboardEntry,
  WinFeedItem,
  Challenge,
  XPAction,
} from './gamification/gamificationService';
export { XP_VALUES, LEVEL_THRESHOLDS } from './gamification/gamificationService';
export * from './gamification';

// Round-Robin Lead Distribution
export { RoundRobinService, createRoundRobinService } from './round-robin';
export type {
  RoundRobinConfig,
  RoundRobinConfigInput,
  RoundRobinAuditEntry,
  AssignmentResult,
  PoolMember,
} from './round-robin';
export * from './round-robin';

// SLA Enforcement
export { SLAService, createSLAService } from './sla';
export type { SLAConfig, SLAConfigInput, SLAOverdueLead } from './sla';
export * from './sla';

// Follow-Up Cadences
export { CadenceService, createCadenceService } from './cadence';
export type {
  CadenceStep,
  FollowUpCadence,
  CadenceCreateInput,
  CadenceUpdateInput,
  LeadCadenceState,
} from './cadence';
export * from './cadence';

// Referral Partners
export { ReferralService, createReferralService } from './referrals';
export type {
  PartnerType,
  ReferralPartner,
  ReferralPartnerInput,
  ReferralDirection,
  ReferralStatus,
  Referral,
  ReferralInput,
  PartnerStats,
  RepReferralStats,
} from './referrals';
export * from './referrals';

// Outside Advisors
export { OutsideAdvisorService, createOutsideAdvisorService } from './outside-advisors';
export type {
  OutsideAdvisor,
  OutsideAdvisorInput,
  AdvisorProduction,
} from './outside-advisors';
export * from './outside-advisors';

// Community Events
export { CommunityEventService, createCommunityEventService } from './community-events';
export type {
  CommunityEventType,
  CommunityEvent,
  CommunityEventInput,
  CommunityEventStats,
} from './community-events';
export * from './community-events';

// Activity Targets
export { TargetsService, createTargetsService } from './targets';
export type {
  TargetType,
  ActivityTarget,
  ActivityTargetInput,
  TargetProgress,
  RepTargetSummary,
} from './targets';
export { DEFAULT_MONTHLY_TARGETS, QUARTERLY_TEAM_TARGETS } from './targets';
export * from './targets';

// Quarterly Milestones
export { MilestoneService, createMilestoneService } from './milestones';
export type {
  QuarterlyMilestone,
  MilestoneActuals,
  MilestoneInput,
  MilestoneProgress,
  ForecastScenario,
  ForecastResult,
} from './milestones';
export { DEFAULT_MILESTONES } from './milestones';
export * from './milestones';

// Profiles
export { ProfileService, createProfileService } from './profiles/profileService';
export type { UserProfile, ProfileUpdateInput } from './profiles/profileService';
export * from './profiles';

// Quote Templates
export { QuoteTemplateService, createQuoteTemplateService } from './quote-templates/quoteTemplateService';
export type {
  QuoteTemplate,
  QuoteTemplateCreateInput,
  QuoteTemplateUpdateInput,
  QuoteTemplateSection,
  QuoteTemplateBranding,
  QuoteTemplateContentBlock,
} from './quote-templates/quoteTemplateTypes';
export * from './quote-templates';

// Product Form Fields
export { ProductFormService, createProductFormService } from './product-forms/productFormService';
export type {
  ProductFormField,
  ProductFormFieldCreateInput,
  ProductFormFieldUpdateInput,
  LineItemAnswer,
} from './product-forms/productFormService';
export * from './product-forms';

// Recruiting
export { RecruitingService, createRecruitingService } from './recruiting/recruitingService';
export type {
  RecruitingRecord,
  RecruitingPipelineStage,
  RecruitingFilters,
  RecruitingCreateInput,
  RecruitingUpdateInput,
  RecruitingBulkResult,
} from './recruiting';

// Utilities
export { sanitizeSearchInput } from './utils/sanitize';

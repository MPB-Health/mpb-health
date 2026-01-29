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
export * from './zoho';
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

// Types
export * from './types';

// Services
export { UserService, userService } from './users/UserService';
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
export { CRMBridgeService, crmBridgeService, type CRMSummary } from './analytics/CRMBridgeService';

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

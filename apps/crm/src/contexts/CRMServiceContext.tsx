/**
 * Stable CRM service layer — org-scoped Supabase service factories + client.
 * High-churn server *data* lives in TanStack Query (see CRMContext); this context
 * should only rerender when org or auth user identity changes.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import {
  createLeadService,
  createPipelineService,
  createActivityService,
  createTaskService,
  createNotificationService,
  createCalendarService,
  createInsightsService,
  createPreferencesService,
  createTemplateService,
  createEmailService,
  createNotificationCenterService,
  createTickerService,
  createAutomationService,
  createReportingService,
  createScoringService,
  createDealService,
  createAccountService,
  createContactService,
  createProductService,
  createQuoteService,
  createInvoiceService,
  createCampaignService,
  createComposerService,
  createSignatureService,
  createDraftService,
  createModuleService,
  createFieldService,
  createLayoutService,
  createViewService,
  createValidationService,
  createDynamicRecordService,
  createImportService,
  createForecastingService,
  createVendorService,
  createPurchaseOrderService,
  createSalesOrderService,
  createPriceBookService,
  createCaseService,
  createDocumentService,
  createSavedViewService,
  createApprovalService,
  createFormService,
  createMailAccountService,
  createMailSyncService,
  createMailRulesService,
  createDomainService,
  createRoundRobinService,
  createSLAService,
  createCadenceService,
  createReferralService,
  createOutsideAdvisorService,
  createCommunityEventService,
  createTargetsService,
  createMilestoneService,
  createSocialService,
  createProfileService,
  createQuoteTemplateService,
  createProductFormService,
  type LeadService,
  type PipelineService,
  type ActivityService,
  type TaskService,
  type NotificationService,
  type CalendarService,
  type InsightsService,
  type PreferencesService,
  type TemplateService,
  type EmailService,
  type NotificationCenterService,
  type TickerService,
  type AutomationService,
  type ReportingService,
  type ScoringService,
  type DealService,
  type AccountService,
  type ContactService,
  type ProductService,
  type QuoteService,
  type InvoiceService,
  type CampaignService,
  type ComposerService,
  type SignatureService,
  type DraftService,
  type ModuleService,
  type FieldService,
  type LayoutService,
  type ViewService,
  type ValidationService,
  type DynamicRecordService,
  type ImportService,
  type ForecastingService,
  type VendorService,
  type PurchaseOrderService,
  type SalesOrderService,
  type PriceBookService,
  type CaseService,
  type DocumentService,
  type SavedViewService,
  type ApprovalService,
  type FormService,
  type MailAccountService,
  type MailSyncService,
  type MailRulesService,
  type DomainService,
  type RoundRobinService,
  type SLAService,
  type CadenceService,
  type ReferralService,
  type OutsideAdvisorService,
  type CommunityEventService,
  type TargetsService,
  type MilestoneService,
  type SocialService,
  type ProfileService,
  type QuoteTemplateService,
  type ProductFormService,
} from '@mpbhealth/crm-core';
import { supabase, supabaseUrl } from '../lib/supabase';
import { useOrg } from './OrgContext';
import { useAuth } from './AuthContext';

export interface CRMServiceContextType {
  supabase: SupabaseClient;
  orgId: string | null;
  user: User | null;
  leadService: LeadService;
  pipelineService: PipelineService;
  activityService: ActivityService;
  taskService: TaskService;
  notificationService: NotificationService;
  calendarService: CalendarService;
  insightsService: InsightsService;
  preferencesService: PreferencesService;
  templateService: TemplateService;
  emailService: EmailService;
  notificationCenterService: NotificationCenterService;
  tickerService: TickerService;
  automationService: AutomationService;
  reportingService: ReportingService;
  scoringService: ScoringService;
  dealService: DealService;
  accountService: AccountService;
  contactService: ContactService;
  productService: ProductService;
  quoteService: QuoteService;
  invoiceService: InvoiceService;
  campaignService: CampaignService;
  composerService: ComposerService;
  signatureService: SignatureService;
  draftService: DraftService;
  moduleService: ModuleService;
  fieldService: FieldService;
  layoutService: LayoutService;
  viewService: ViewService;
  validationService: ValidationService;
  dynamicRecordService: DynamicRecordService;
  importService: ImportService;
  forecastingService: ForecastingService;
  vendorService: VendorService;
  purchaseOrderService: PurchaseOrderService;
  salesOrderService: SalesOrderService;
  priceBookService: PriceBookService;
  caseService: CaseService;
  documentService: DocumentService;
  savedViewService: SavedViewService;
  approvalService: ApprovalService;
  formService: FormService;
  mailAccountService: MailAccountService;
  mailSyncService: MailSyncService;
  mailRulesService: MailRulesService;
  domainService: DomainService;
  roundRobinService: RoundRobinService;
  slaService: SLAService;
  cadenceService: CadenceService;
  referralService: ReferralService;
  outsideAdvisorService: OutsideAdvisorService;
  communityEventService: CommunityEventService;
  targetsService: TargetsService;
  milestoneService: MilestoneService;
  socialService: SocialService;
  profileService: ProfileService;
  quoteTemplateService: QuoteTemplateService;
  productFormService: ProductFormService;
}

const CRMServiceContext = createContext<CRMServiceContextType | null>(null);

export function CRMServiceProvider({ children }: { children: ReactNode }) {
  const { activeOrgId } = useOrg();
  const { user } = useAuth();

  const [services] = useState(() => ({
    leadService: createLeadService(supabase),
    pipelineService: createPipelineService(supabase),
    activityService: createActivityService(supabase),
    taskService: createTaskService(supabase),
    notificationService: createNotificationService(supabase),
    calendarService: createCalendarService(supabase),
    insightsService: createInsightsService(supabase, supabaseUrl),
    preferencesService: createPreferencesService(supabase),
    templateService: createTemplateService(supabase),
    emailService: createEmailService(supabase, supabaseUrl),
    notificationCenterService: createNotificationCenterService(supabase),
    tickerService: createTickerService(supabase),
    automationService: createAutomationService(supabase, supabaseUrl),
    reportingService: createReportingService(supabase),
    scoringService: createScoringService(supabase),
    dealService: createDealService(supabase),
    accountService: createAccountService(supabase),
    contactService: createContactService(supabase),
    productService: createProductService(supabase),
    quoteService: createQuoteService(supabase),
    invoiceService: createInvoiceService(supabase),
    campaignService: createCampaignService(supabase),
    composerService: createComposerService(supabase, supabaseUrl),
    signatureService: createSignatureService(supabase),
    draftService: createDraftService(supabase),
    moduleService: createModuleService(supabase),
    fieldService: createFieldService(supabase),
    layoutService: createLayoutService(supabase),
    viewService: createViewService(supabase),
    validationService: createValidationService(supabase),
    dynamicRecordService: createDynamicRecordService(supabase),
    importService: createImportService(supabase),
    forecastingService: createForecastingService(supabase),
    vendorService: createVendorService(supabase),
    purchaseOrderService: createPurchaseOrderService(supabase),
    salesOrderService: createSalesOrderService(supabase),
    priceBookService: createPriceBookService(supabase),
    caseService: createCaseService(supabase),
    documentService: createDocumentService(supabase),
    savedViewService: createSavedViewService(supabase),
    approvalService: createApprovalService(supabase),
    formService: createFormService(supabase),
    profileService: createProfileService(supabase),
    quoteTemplateService: createQuoteTemplateService(supabase),
    productFormService: createProductFormService(supabase),
    mailAccountService: createMailAccountService(supabase, supabaseUrl),
    mailSyncService: createMailSyncService(supabase, supabaseUrl),
    mailRulesService: createMailRulesService(supabase),
    domainService: createDomainService(supabase, supabaseUrl),
  }));

  const orgScopedServices = useMemo(() => {
    const oid = activeOrgId ?? '';
    return {
      roundRobinService: createRoundRobinService(supabase, oid),
      slaService: createSLAService(supabase, oid),
      cadenceService: createCadenceService(supabase, oid),
      referralService: createReferralService(supabase, oid),
      outsideAdvisorService: createOutsideAdvisorService(supabase, oid),
      communityEventService: createCommunityEventService(supabase, oid),
      targetsService: createTargetsService(supabase, oid),
      milestoneService: createMilestoneService(supabase, oid),
      socialService: createSocialService(supabase, oid),
    };
  }, [activeOrgId]);

  const value = useMemo<CRMServiceContextType>(
    () => ({
      supabase,
      orgId: activeOrgId,
      user,
      ...services,
      ...orgScopedServices,
    }),
    [activeOrgId, user, services, orgScopedServices]
  );

  return <CRMServiceContext.Provider value={value}>{children}</CRMServiceContext.Provider>;
}

export function useCRMService(): CRMServiceContextType {
  const ctx = useContext(CRMServiceContext);
  if (!ctx) {
    throw new Error('useCRMService must be used within CRMServiceProvider');
  }
  return ctx;
}

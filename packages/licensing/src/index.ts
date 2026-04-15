// ============================================================================
// @mpbhealth/licensing — Module Licensing, Feature Gating & White-Label
// ============================================================================

// Services
export { LicensingService, licensingService } from './LicensingService';
export {
  TenantProvisioningService,
  tenantProvisioningService,
  type ProvisionTenantInput,
  type ProvisioningResult,
  type OnboardingStep,
} from './TenantProvisioningService';

// Types
export type {
  ModuleCategory,
  LicenseStatus,
  LicenseSource,
  ModuleSlug,
  ProductModule,
  OrgModuleLicense,
  OrgModuleLicenseWithModule,
  FeatureFlag,
  OrgFeatureOverride,
  ActivateModuleInput,
  SetFeatureOverrideInput,
  OrgLicenseSummary,
  WhiteLabelConfig,
  UpdateWhiteLabelInput,
} from './types';

// Hooks
export { useModuleAccess, type UseModuleAccessReturn } from './hooks/useModuleAccess';
export { useFeatureFlag, type UseFeatureFlagReturn } from './hooks/useFeatureFlag';
export { useOrgLicenses, type UseOrgLicensesReturn } from './hooks/useOrgLicenses';

// Components
export { ModuleGate, FeatureGate, type ModuleGateProps, type FeatureGateProps } from './components/ModuleGate';
export { UpgradePrompt, type UpgradePromptProps } from './components/UpgradePrompt';
export { WhiteLabelProvider, useWhiteLabel } from './components/WhiteLabelProvider';

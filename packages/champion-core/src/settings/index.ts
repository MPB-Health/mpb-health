// ============================================================================
// Settings Module — Public exports
// ============================================================================

export { SettingsService, settingsService } from './SettingsService';
export { IntegrationService, integrationService, AVAILABLE_INTEGRATIONS } from './IntegrationService';

export type {
  // Organization Settings
  OrganizationSettings,
  BusinessHours,
  BusinessAddress,
  UpdateOrgSettingsInput,

  // User Preferences
  UserPreferences,
  UpdateUserPreferencesInput,

  // Notification Settings
  NotificationSettings,
  UpdateNotificationSettingsInput,

  // Integrations
  IntegrationConfig,
  IntegrationType,
  SyncDirection,

  // API Keys
  ApiKey,
  CreateApiKeyInput,

  // Team & Invitations
  OrgMember,
  OrganizationInvitation,
  InvitationStatus,
  CreateInvitationInput,
} from './types';

export type {
  CreateIntegrationInput,
  UpdateIntegrationInput,
} from './IntegrationService';

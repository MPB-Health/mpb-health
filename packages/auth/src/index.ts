// ============================================================================
// @mpbhealth/auth - Authentication & Authorization Package
// ============================================================================

// Services
export {
  secureAuthService,
  type SecureLoginRequest,
  type SecureLoginResponse,
  type SessionInfo,
} from './services/secureAuthService';

export {
  rateLimitService,
  type LoginAttemptResult,
  type RateLimitStatus,
} from './services/rateLimitService';

export {
  mfaService,
  type MFASettings,
  type TrustedDevice,
  type MFAEnrollmentData,
} from './services/mfaService';

export {
  passwordSecurityService,
  type PasswordStrength,
  type PasswordPolicy,
  type PasswordRequirement,
} from './services/passwordSecurityService';

export {
  securityEventService,
  type SecurityEvent,
  type SecurityAlert,
  type SecurityEventType,
  type SecurityEventSeverity,
  type SecurityAlertWebhook,
} from './services/securityEventService';

export {
  sessionTimeoutService,
  SessionTimeoutService,
  type SessionTimeoutConfig,
  type SessionTimeoutState,
} from './services/sessionTimeoutService';

export {
  userRolesService,
  type UserRole,
  type UserRoleRecord,
  type UserWithRoles,
  type ServiceResult,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  ALL_ROLES,
  isRolesTableAvailable,
  getUserRoles,
  hasRole,
  isSuperAdmin,
  isAdmin,
  isAdvisor,
  isCrmUser,
  getAllUsersWithRoles,
  searchUsersByEmail,
  grantRole,
  revokeRole,
  setUserRoles,
  toggleRole,
  canAccessAdminPortal,
  canAccessAdvisorPortal,
  canAccessCrmPortal,
  canAccessMemberPortal,
  getAccessiblePortals,
} from './services/userRolesService';

// Contexts
export {
  AuthProvider,
  useAuth,
  type AuthContextType,
} from './contexts/AuthContext';

// Components
export { ProtectedRoute } from './components/ProtectedRoute';
export { RouteGuard } from './components/RouteGuard';
export {
  SessionTimeoutWarning,
  type SessionTimeoutWarningProps,
} from './components/SessionTimeoutWarning';
export {
  MFAEnrollmentFlow,
  type MFAEnrollmentFlowProps,
  type MFAEnrollmentStep,
} from './components/MFAEnrollmentFlow';
export {
  MFAVerificationDialog,
  type MFAVerificationDialogProps,
} from './components/MFAVerificationDialog';
export {
  MFARequiredGuard,
  type MFARequiredGuardProps,
} from './components/MFARequiredGuard';
export {
  PasswordStrengthIndicator,
  type PasswordStrengthIndicatorProps,
} from './components/PasswordStrengthIndicator';

// Hooks
export { useSession } from './hooks/useSession';
export { useOrg, type UseOrgReturn } from './hooks/useOrg';
export { useOrgRole, useRequireRole } from './hooks/useOrgRole';
export { usePermission, type UsePermissionReturn } from './hooks/usePermission';
export { useSSONavigation, type UseSSONavigationReturn } from './hooks/useSSONavigation';
export {
  useSessionTimeout,
  type UseSessionTimeoutOptions,
  type UseSessionTimeoutReturn,
} from './hooks/useSessionTimeout';
export {
  useClientRateLimit,
  createRateLimitConfig,
  RATE_LIMIT_PRESETS,
  type RateLimitConfig,
  type UseClientRateLimitReturn,
} from './hooks/useClientRateLimit';
export {
  usePortalAccess,
  type PortalAccessState,
} from './hooks/usePortalAccess';

// Org & Permission Services
export {
  orgService,
  getUserOrgs,
  getOrg,
  getUserOrgRole,
  getOrgMembers,
  inviteMember,
  addMember,
  updateMemberRole,
  removeMember,
  suspendMember,
  acceptInvite,
  createOrg,
  hasRoleOrHigher,
  hasPermission,
  invalidateCache,
  DEFAULT_ORG_ID,
  DEFAULT_ORG_ID_ALT,
  ORG_ROLE_LABELS,
  ORG_ROLE_HIERARCHY,
  ORG_ROLE_PERMISSIONS,
  type Org,
  type OrgMembership,
  type OrgWithMembership,
  type OrgRole,
  type OrgMembershipStatus,
} from './services/orgService';

export {
  permissionService,
  loadUserPermissions,
  hasPermission as checkPermission,
  hasAnyPermission,
  hasAllPermissions,
  getAllPermissions,
  invalidatePermissionCache,
  type Permission,
  type UserPermissionSet,
} from './services/permissionService';

export {
  auditService,
  logAuditEvent,
  logAuditEventAsync,
  queryAuditEvents,
  getEntityAuditTrail,
  getUserActivityLog,
  getActivityByCategory,
  AUDIT_ACTIONS,
  type AuditEvent,
  type AuditLogInput,
  type AuditQueryOptions,
  type AuditAction,
} from './services/auditService';

// Portal SSO (client-side cross-portal session transfer)
export { buildPortalSSOUrl } from './services/portalSSO';

// PHI Security Service (HIPAA §164.312 Compliance)
export {
  logPhiAccess,
  logPhiExport,
  isPhiTable,
  getPhiFields,
  maskSSN,
  maskEmail,
  maskPhone,
  maskDOB,
  maskName,
  stripPhiFields,
  maskPhiFields,
  PHI_REGISTRY,
  type PhiAccessType,
  type PhiAccessLogEntry,
} from './services/phiSecurityService';

// Org Switcher Component
export { OrgSwitcher, type OrgSwitcherProps } from './components/OrgSwitcher';

// Types (re-exported for convenience)
export type { AuthUser, AuthState } from './types';

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
} from './services/passwordSecurityService';

export {
  securityEventService,
  type SecurityEvent,
  type SecurityAlert,
  type SecurityEventType,
  type SecurityEventSeverity,
} from './services/securityEventService';

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
  getAllUsersWithRoles,
  searchUsersByEmail,
  grantRole,
  revokeRole,
  setUserRoles,
  toggleRole,
  canAccessAdminPortal,
  canAccessAdvisorPortal,
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

// Hooks
export { useSession } from './hooks/useSession';

// Types (re-exported for convenience)
export type { AuthUser, AuthState } from './types';

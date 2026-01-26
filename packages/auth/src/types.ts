// Re-export types from services for backwards compatibility
export type { UserRole } from './services/userRolesService';
export type { SecurityEvent, SecurityEventType, SecurityEventSeverity, SecurityAlert } from './services/securityEventService';
export type { SecureLoginRequest, SecureLoginResponse, SessionInfo } from './services/secureAuthService';
export type { MFASettings, TrustedDevice, MFAEnrollmentData } from './services/mfaService';
export type { PasswordStrength, PasswordPolicy } from './services/passwordSecurityService';
export type { LoginAttemptResult, RateLimitStatus } from './services/rateLimitService';

// Additional types for auth state
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

import { supabase } from './supabase';
import { rateLimitService } from './rateLimitService';
import { mfaService } from './mfaService';
import { passwordSecurityService } from './passwordSecurityService';
import { securityEventService } from './securityEventService';

export interface SecureLoginRequest {
  email: string;
  password: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  mfaCode?: string;
  captchaToken?: string;
}

export interface SecureLoginResponse {
  success: boolean;
  requiresMFA?: boolean;
  requiresCaptcha?: boolean;
  waitTime?: number;
  error?: string;
  user?: any;
  session?: any;
  mfaRequired?: boolean;
}

export interface SessionInfo {
  id: string;
  user_id: string;
  device_fingerprint?: string;
  ip_address: string;
  user_agent: string;
  last_activity: string;
  expires_at: string;
  created_at: string;
}

class SecureAuthService {
  async secureLogin(request: SecureLoginRequest): Promise<SecureLoginResponse> {
    const { email, password, ipAddress, userAgent, deviceFingerprint, mfaCode, captchaToken } = request;

    try {
      const rateLimitCheck = await rateLimitService.checkLoginAllowed(email, ipAddress);

      if (!rateLimitCheck.allowed) {
        await rateLimitService.recordLoginAttempt(
          email,
          ipAddress,
          userAgent,
          false,
          rateLimitCheck.reason
        );

        return {
          success: false,
          error: rateLimitCheck.reason,
          waitTime: rateLimitCheck.waitTime,
          requiresCaptcha: false,
        };
      }

      if (rateLimitCheck.requiresCaptcha && !captchaToken) {
        return {
          success: false,
          requiresCaptcha: true,
          error: 'CAPTCHA verification required',
        };
      }

      if (rateLimitCheck.requiresCaptcha && captchaToken) {
        const captchaValid = await this.verifyCaptcha(captchaToken);
        if (!captchaValid) {
          return {
            success: false,
            requiresCaptcha: true,
            error: 'Invalid CAPTCHA. Please try again.',
          };
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        await rateLimitService.recordLoginAttempt(
          email,
          ipAddress,
          userAgent,
          false,
          error?.message || 'Authentication failed'
        );

        await securityEventService.logLoginFailure(
          email,
          ipAddress,
          userAgent,
          error?.message || 'Invalid credentials'
        );

        return {
          success: false,
          error: 'Invalid email or password',
          requiresCaptcha: rateLimitCheck.requiresCaptcha,
        };
      }

      const mfaSettings = await mfaService.getMFASettings(data.user.id);

      if (mfaSettings?.mfa_enabled) {
        if (deviceFingerprint) {
          const isTrusted = await mfaService.isTrustedDevice(data.user.id, deviceFingerprint);
          if (isTrusted) {
            await this.completeSuccessfulLogin(data.user.id, email, ipAddress, userAgent, deviceFingerprint);
            return {
              success: true,
              user: data.user,
              session: data.session,
              mfaRequired: false,
            };
          }
        }

        if (!mfaCode) {
          return {
            success: false,
            requiresMFA: true,
            error: 'MFA code required',
          };
        }

        const mfaValid = await mfaService.verifyTOTP(data.user.id, mfaCode);

        if (!mfaValid) {
          const backupValid = await mfaService.verifyBackupCode(data.user.id, mfaCode);

          if (!backupValid) {
            await securityEventService.logMFAEvent(data.user.id, 'mfa_failed');
            return {
              success: false,
              requiresMFA: true,
              error: 'Invalid MFA code',
            };
          }
        }
      }

      const mfaEnforcement = await mfaService.enforceMFAEnrollment(data.user.id);
      if (mfaEnforcement.required && !mfaEnforcement.enrolled) {
        return {
          success: true,
          user: data.user,
          session: data.session,
          mfaRequired: true,
          error: mfaEnforcement.message,
        };
      }

      await this.completeSuccessfulLogin(data.user.id, email, ipAddress, userAgent, deviceFingerprint);

      return {
        success: true,
        user: data.user,
        session: data.session,
        mfaRequired: false,
      };
    } catch (error: unknown) {
      console.error('Secure login error:', error);

      await securityEventService.logLoginFailure(
        email,
        ipAddress,
        userAgent,
        error instanceof Error ? error.message : 'System error'
      );

      return {
        success: false,
        error: 'An error occurred during login. Please try again.',
      };
    }
  }

  private async completeSuccessfulLogin(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent: string,
    deviceFingerprint?: string
  ): Promise<void> {
    await rateLimitService.recordLoginAttempt(email, ipAddress, userAgent, true);

    await securityEventService.logLoginSuccess(userId, ipAddress, userAgent);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await supabase.from('user_sessions').insert({
      user_id: userId,
      session_token: crypto.randomUUID(),
      device_fingerprint: deviceFingerprint,
      ip_address: ipAddress,
      user_agent: userAgent,
      last_activity: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    const passwordExpiry = await passwordSecurityService.isPasswordExpired(userId);
    if (passwordExpiry.expired) {
      await securityEventService.logEvent({
        user_id: userId,
        event_type: 'password_reset_requested',
        event_severity: 'medium',
        event_data: { reason: 'Password expired' },
      });
    }
  }

  async secureLogout(userId: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        await supabase
          .from('user_sessions')
          .update({ revoked: true })
          .eq('user_id', userId)
          .eq('session_token', session.access_token);
      }

      await supabase.auth.signOut();

      await securityEventService.logEvent({
        user_id: userId,
        event_type: 'logout',
        event_severity: 'low',
      });

      return true;
    } catch (error) {
      console.error('Secure logout error:', error);
      return false;
    }
  }

  async revokeAllSessions(userId: string): Promise<boolean> {
    try {
      await supabase
        .from('user_sessions')
        .update({ revoked: true })
        .eq('user_id', userId);

      await supabase.auth.signOut({ scope: 'global' });

      await securityEventService.logEvent({
        user_id: userId,
        event_type: 'session_revoked',
        event_severity: 'medium',
        event_data: { reason: 'All sessions revoked' },
      });

      return true;
    } catch (error) {
      console.error('Failed to revoke all sessions:', error);
      return false;
    }
  }

  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('Error fetching user sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ revoked: true })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (!error) {
        await securityEventService.logEvent({
          user_id: userId,
          event_type: 'session_revoked',
          event_severity: 'low',
          event_data: { session_id: sessionId },
        });
      }

      return !error;
    } catch (error) {
      console.error('Failed to revoke session:', error);
      return false;
    }
  }

  async updateSessionActivity(userId: string): Promise<void> {
    try {
      // Find the most recent active (non-revoked, non-expired) session for this user
      // and update its last_activity timestamp. This matches by user_id rather than
      // session_token because the token is an internal UUID not exposed to callers.
      const { data: activeSession } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('revoked', false)
        .gt('expires_at', new Date().toISOString())
        .order('last_activity', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeSession) {
        await supabase
          .from('user_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', activeSession.id);
      }
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  async checkSessionTimeout(userId: string, role: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return true;
      }

      const { data: userSession } = await supabase
        .from('user_sessions')
        .select('last_activity')
        .eq('user_id', userId)
        .eq('session_token', session.access_token)
        .maybeSingle();

      if (!userSession) {
        return true;
      }

      const lastActivity = new Date(userSession.last_activity);
      const now = new Date();
      const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

      const timeoutMinutes = ['admin', 'staff', 'advisor'].includes(role) ? 30 : 60;

      if (minutesSinceActivity > timeoutMinutes) {
        await this.secureLogout(userId);
        await securityEventService.logEvent({
          user_id: userId,
          event_type: 'session_expired',
          event_severity: 'low',
          event_data: { reason: 'Inactivity timeout' },
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to check session timeout:', error);
      return false;
    }
  }

  async detectSuspiciousActivity(userId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
  }> {
    const alerts = await securityEventService.detectAnomalies(userId);

    if (alerts.length > 0) {
      const reasons = alerts.map(alert => alert.triggerReason);

      await securityEventService.logSuspiciousActivity(
        userId,
        '',
        'Multiple security alerts detected',
        { alert_count: alerts.length, alerts: reasons }
      );

      return {
        suspicious: true,
        reasons,
      };
    }

    return {
      suspicious: false,
      reasons: [],
    };
  }

  async getClientInfo(): Promise<{ ipAddress: string; userAgent: string }> {
    return {
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
    };
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || '0.0.0.0';
    } catch (error) {
      console.warn('Failed to get client IP:', error);
      return '0.0.0.0';
    }
  }

  private async verifyCaptcha(_token: string): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error('CAPTCHA verification failed:', error);
      return false;
    }
  }

  async requireReauthentication(userId: string, operation: string): Promise<boolean> {
    try {
      const highRiskOperations = [
        'view_full_ssn',
        'export_phi',
        'change_role',
        'delete_account',
        'change_password',
      ];

      if (!highRiskOperations.includes(operation)) {
        return false;
      }

      const { data: lastAuth } = await supabase
        .from('auth_security_events')
        .select('timestamp')
        .eq('user_id', userId)
        .eq('event_type', 'login_success')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastAuth) {
        return true;
      }

      const lastAuthTime = new Date(lastAuth.timestamp);
      const minutesSinceAuth = (Date.now() - lastAuthTime.getTime()) / (1000 * 60);

      return minutesSinceAuth > 15;
    } catch (error) {
      console.error('Failed to check reauthentication requirement:', error);
      return true;
    }
  }
}

export const secureAuthService = new SecureAuthService();

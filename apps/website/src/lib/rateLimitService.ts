import { supabase } from './supabase';

export interface LoginAttemptResult {
  allowed: boolean;
  reason?: string;
  waitTime?: number;
  requiresCaptcha: boolean;
}

export interface RateLimitStatus {
  isBlocked: boolean;
  blockType?: 'temporary' | 'permanent' | 'lockout';
  blockedUntil?: Date;
  reason?: string;
  attemptCount: number;
}

class RateLimitService {
  private readonly MAX_ATTEMPTS_PER_EMAIL = 5;
  private readonly MAX_ATTEMPTS_PER_IP = 10;
  private readonly LOCKOUT_WINDOW_MINUTES = 15;
  private readonly CAPTCHA_THRESHOLD = 3;
  private readonly BASE_DELAY_MS = 1000;

  async checkLoginAllowed(email: string, ipAddress: string): Promise<LoginAttemptResult> {
    const emailStatus = await this.checkRateLimit(email, 'email');
    if (emailStatus.isBlocked) {
      return {
        allowed: false,
        reason: emailStatus.reason || 'Account temporarily locked',
        waitTime: emailStatus.blockedUntil ?
          Math.ceil((emailStatus.blockedUntil.getTime() - Date.now()) / 1000) :
          undefined,
        requiresCaptcha: false,
      };
    }

    const ipStatus = await this.checkRateLimit(ipAddress, 'ip');
    if (ipStatus.isBlocked) {
      return {
        allowed: false,
        reason: ipStatus.reason || 'Too many requests from this IP address',
        waitTime: ipStatus.blockedUntil ?
          Math.ceil((ipStatus.blockedUntil.getTime() - Date.now()) / 1000) :
          undefined,
        requiresCaptcha: false,
      };
    }

    const recentFailures = await this.getRecentFailures(email, ipAddress);
    const requiresCaptcha = recentFailures >= this.CAPTCHA_THRESHOLD;

    return {
      allowed: true,
      requiresCaptcha,
    };
  }

  async recordLoginAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    failureReason?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('record_login_attempt', {
        p_email: email,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_success: success,
        p_failure_reason: failureReason,
      });

      if (error) {
        console.error('Error recording login attempt:', error);
      }

      if (success) {
        await this.clearRateLimits(email);
      }
    } catch (error) {
      console.error('Failed to record login attempt:', error);
    }
  }

  async checkRateLimit(identifier: string, type: 'email' | 'ip' | 'device'): Promise<RateLimitStatus> {
    try {
      const { data, error } = await supabase
        .from('auth_rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .eq('identifier_type', type)
        .maybeSingle();

      if (error) {
        console.error('Error checking rate limit:', error);
        return { isBlocked: false, attemptCount: 0 };
      }

      if (!data) {
        return { isBlocked: false, attemptCount: 0 };
      }

      const blockedUntil = new Date(data.blocked_until);
      const isBlocked = blockedUntil > new Date();

      return {
        isBlocked,
        blockType: data.block_type,
        blockedUntil: isBlocked ? blockedUntil : undefined,
        reason: data.reason,
        attemptCount: data.attempt_count || 0,
      };
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      return { isBlocked: false, attemptCount: 0 };
    }
  }

  async getRecentFailures(email: string, _ipAddress: string): Promise<number> {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - this.LOCKOUT_WINDOW_MINUTES * 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from('auth_login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .eq('success', false)
        .gte('timestamp', fifteenMinutesAgo);

      if (error) {
        console.error('Error getting recent failures:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Failed to get recent failures:', error);
      return 0;
    }
  }

  async clearRateLimits(identifier: string): Promise<void> {
    try {
      await supabase
        .from('auth_rate_limits')
        .delete()
        .eq('identifier', identifier);
    } catch (error) {
      console.error('Failed to clear rate limits:', error);
    }
  }

  async manualUnlock(identifier: string, adminUserId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('auth_rate_limits')
        .delete()
        .eq('identifier', identifier);

      if (!error) {
        await supabase.from('auth_security_events').insert({
          user_id: adminUserId,
          event_type: 'manual_unlock',
          event_severity: 'medium',
          event_data: { unlocked_identifier: identifier },
        });
      }

      return !error;
    } catch (error) {
      console.error('Failed to manually unlock:', error);
      return false;
    }
  }

  calculateProgressiveDelay(attemptCount: number): number {
    if (attemptCount <= 1) return 0;

    const delays = [
      0,
      5000,
      15000,
      60000,
      300000,
    ];

    if (attemptCount >= delays.length) {
      return delays[delays.length - 1];
    }

    return delays[attemptCount];
  }

  async getLoginAnalytics(startDate: Date, endDate: Date): Promise<{
    totalAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueUsers: number;
    uniqueIPs: number;
    topFailureReasons: { reason: string; count: number }[];
  }> {
    try {
      const { data, error } = await supabase
        .from('auth_login_attempts')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error || !data) {
        console.error('Error fetching login analytics:', error);
        return {
          totalAttempts: 0,
          successfulLogins: 0,
          failedLogins: 0,
          uniqueUsers: 0,
          uniqueIPs: 0,
          topFailureReasons: [],
        };
      }

      const totalAttempts = data.length;
      const successfulLogins = data.filter(a => a.success).length;
      const failedLogins = data.filter(a => !a.success).length;
      const uniqueUsers = new Set(data.map(a => a.email)).size;
      const uniqueIPs = new Set(data.map(a => a.ip_address)).size;

      const failureReasons = data
        .filter(a => !a.success && a.failure_reason)
        .reduce((acc: { [key: string]: number }, attempt) => {
          const reason = attempt.failure_reason || 'Unknown';
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        }, {});

      const topFailureReasons = Object.entries(failureReasons)
        .map(([reason, count]) => ({ reason, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalAttempts,
        successfulLogins,
        failedLogins,
        uniqueUsers,
        uniqueIPs,
        topFailureReasons,
      };
    } catch (error) {
      console.error('Failed to get login analytics:', error);
      return {
        totalAttempts: 0,
        successfulLogins: 0,
        failedLogins: 0,
        uniqueUsers: 0,
        uniqueIPs: 0,
        topFailureReasons: [],
      };
    }
  }

  async cleanExpiredLimits(): Promise<void> {
    try {
      const { error } = await supabase.rpc('clean_expired_rate_limits');
      if (error) {
        console.error('Error cleaning expired limits:', error);
      }
    } catch (error) {
      console.error('Failed to clean expired limits:', error);
    }
  }
}

export const rateLimitService = new RateLimitService();

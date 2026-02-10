import { securityEventService } from './securityEventService';

export interface SessionTimeoutConfig {
  /** Timeout duration in milliseconds (default: 15 minutes - HIPAA requirement) */
  timeoutMs: number;
  /** Warning period before timeout in milliseconds (default: 2 minutes) */
  warningMs: number;
  /** Activity throttle interval in milliseconds (default: 5 seconds) */
  throttleMs: number;
  /** Events to track for activity detection */
  activityEvents: string[];
}

export interface SessionTimeoutState {
  lastActivity: number;
  isWarning: boolean;
  timeRemaining: number;
  isTimedOut: boolean;
}

type SessionTimeoutCallback = (state: SessionTimeoutState) => void;

const DEFAULT_CONFIG: SessionTimeoutConfig = {
  timeoutMs: 15 * 60 * 1000, // 15 minutes
  warningMs: 2 * 60 * 1000,  // 2 minutes before timeout
  throttleMs: 5 * 1000,       // 5 seconds
  activityEvents: ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'],
};

class SessionTimeoutService {
  private config: SessionTimeoutConfig;
  private lastActivity: number = Date.now();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: Set<SessionTimeoutCallback> = new Set();
  private isInitialized: boolean = false;
  private lastThrottledUpdate: number = 0;
  private userId: string | null = null;

  constructor(config: Partial<SessionTimeoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the session timeout service
   */
  initialize(userId?: string): void {
    if (this.isInitialized) {
      return;
    }

    this.userId = userId || null;
    this.lastActivity = Date.now();
    this.isInitialized = true;

    // Add activity listeners
    this.config.activityEvents.forEach(event => {
      window.addEventListener(event, this.handleActivity, { passive: true });
    });

    // Start the check interval (every second)
    this.checkInterval = setInterval(() => {
      this.checkTimeout();
    }, 1000);

    // Also track visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Destroy the session timeout service
   */
  destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    // Remove activity listeners
    this.config.activityEvents.forEach(event => {
      window.removeEventListener(event, this.handleActivity);
    });

    // Clear the check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Remove visibility listener
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    this.callbacks.clear();
    this.isInitialized = false;
    this.userId = null;
  }

  /**
   * Subscribe to timeout state changes
   */
  subscribe(callback: SessionTimeoutCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Extend the session (reset the timer)
   */
  extendSession(): void {
    this.lastActivity = Date.now();
    this.notifyCallbacks();
  }

  /**
   * Get the current timeout state
   */
  getState(): SessionTimeoutState {
    const now = Date.now();
    const elapsed = now - this.lastActivity;
    const timeRemaining = Math.max(0, this.config.timeoutMs - elapsed);
    const isWarning = timeRemaining <= this.config.warningMs && timeRemaining > 0;
    const isTimedOut = timeRemaining === 0;

    return {
      lastActivity: this.lastActivity,
      isWarning,
      timeRemaining,
      isTimedOut,
    };
  }

  /**
   * Update the configuration
   */
  updateConfig(config: Partial<SessionTimeoutConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get the current configuration
   */
  getConfig(): SessionTimeoutConfig {
    return { ...this.config };
  }

  /**
   * Handle user activity (throttled)
   */
  private handleActivity = (): void => {
    const now = Date.now();

    // Throttle activity updates
    if (now - this.lastThrottledUpdate < this.config.throttleMs) {
      return;
    }

    this.lastThrottledUpdate = now;
    this.lastActivity = now;
    this.notifyCallbacks();
  };

  /**
   * Handle visibility changes
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      // User returned to the page - check if we're timed out
      this.checkTimeout();
    }
  };

  /**
   * Check if the session has timed out
   */
  private checkTimeout(): void {
    const state = this.getState();

    if (state.isTimedOut) {
      // Log the session expiration event
      this.logSessionExpired();
    }

    this.notifyCallbacks();
  }

  /**
   * Notify all callbacks of state change
   */
  private notifyCallbacks(): void {
    const state = this.getState();
    this.callbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Session timeout callback error:', error);
      }
    });
  }

  /**
   * Log session expiration to security events
   */
  private async logSessionExpired(): Promise<void> {
    if (this.userId) {
      await securityEventService.logEvent({
        user_id: this.userId,
        event_type: 'session_expired',
        event_severity: 'low',
        event_data: {
          reason: 'inactivity_timeout',
          timeout_ms: this.config.timeoutMs,
        },
      });
    }
  }
}

// Export a singleton instance with default config
export const sessionTimeoutService = new SessionTimeoutService();

// Export the class for custom instances
export { SessionTimeoutService };

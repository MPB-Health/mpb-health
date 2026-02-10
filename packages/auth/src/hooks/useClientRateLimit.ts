import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of attempts allowed */
  maxAttempts: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Storage key prefix for persistence */
  storageKey: string;
  /** Whether to persist rate limit state across page reloads */
  persist?: boolean;
}

/**
 * Preset rate limit configurations for common use cases
 */
export const RATE_LIMIT_PRESETS = {
  /** Login attempts: 5 per 15 minutes */
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    storageKey: 'mpb_rl_login',
    persist: true,
  },
  /** API calls: 100 per minute */
  api: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    storageKey: 'mpb_rl_api',
    persist: false,
  },
  /** Data export: 5 per hour */
  export: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    storageKey: 'mpb_rl_export',
    persist: true,
  },
  /** Password reset requests: 3 per hour */
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    storageKey: 'mpb_rl_pwd_reset',
    persist: true,
  },
  /** MFA verification: 5 per 5 minutes */
  mfa: {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    storageKey: 'mpb_rl_mfa',
    persist: true,
  },
  /** Search queries: 30 per minute */
  search: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 minute
    storageKey: 'mpb_rl_search',
    persist: false,
  },
} as const;

/**
 * Rate limit state stored in sessionStorage
 */
interface RateLimitState {
  attempts: number[];
  blockedUntil?: number;
}

/**
 * Return type for useClientRateLimit hook
 */
export interface UseClientRateLimitReturn {
  /** Whether the user can make another attempt */
  canAttempt: boolean;
  /** Number of remaining attempts in the current window */
  remainingAttempts: number;
  /** Time remaining until rate limit resets (in milliseconds) */
  cooldownRemaining: number;
  /** Time remaining formatted as MM:SS */
  cooldownFormatted: string;
  /** Record an attempt */
  recordAttempt: () => boolean;
  /** Reset the rate limit (use with caution) */
  reset: () => void;
  /** Whether the user is currently blocked */
  isBlocked: boolean;
}

/**
 * Client-side rate limiting hook using token bucket algorithm.
 * Complements server-side rate limiting for defense in depth.
 *
 * @param config - Rate limit configuration or preset name
 * @returns Rate limit state and methods
 *
 * @example
 * ```tsx
 * const { canAttempt, remainingAttempts, recordAttempt } = useClientRateLimit('login');
 *
 * const handleLogin = async () => {
 *   if (!canAttempt) {
 *     toast.error('Too many attempts. Please try again later.');
 *     return;
 *   }
 *
 *   recordAttempt();
 *   await loginService.login(email, password);
 * };
 * ```
 */
export function useClientRateLimit(
  config: RateLimitConfig | keyof typeof RATE_LIMIT_PRESETS
): UseClientRateLimitReturn {
  // Resolve config from preset if string
  const resolvedConfig: RateLimitConfig =
    typeof config === 'string' ? RATE_LIMIT_PRESETS[config] : config;

  const { maxAttempts, windowMs, storageKey, persist = true } = resolvedConfig;

  // State
  const [state, setState] = useState<RateLimitState>(() => loadState(storageKey, persist));
  const [now, setNow] = useState(Date.now());

  // Ref to track if we need to update
  const updateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load state from storage
  function loadState(key: string, shouldPersist: boolean): RateLimitState {
    if (!shouldPersist) {
      return { attempts: [] };
    }

    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as RateLimitState;
        // Filter out expired attempts
        const validAttempts = parsed.attempts.filter(
          (timestamp) => Date.now() - timestamp < windowMs
        );
        return {
          attempts: validAttempts,
          blockedUntil: parsed.blockedUntil && parsed.blockedUntil > Date.now()
            ? parsed.blockedUntil
            : undefined,
        };
      }
    } catch (error) {
      console.error('Error loading rate limit state:', error);
    }

    return { attempts: [] };
  }

  // Save state to storage
  const saveState = useCallback(
    (newState: RateLimitState) => {
      if (persist) {
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(newState));
        } catch (error) {
          console.error('Error saving rate limit state:', error);
        }
      }
    },
    [storageKey, persist]
  );

  // Clean up expired attempts periodically
  useEffect(() => {
    const cleanup = () => {
      const currentTime = Date.now();
      setNow(currentTime);

      setState((prev) => {
        const validAttempts = prev.attempts.filter(
          (timestamp) => currentTime - timestamp < windowMs
        );

        // Check if blocked period has passed
        const stillBlocked = prev.blockedUntil && prev.blockedUntil > currentTime;

        const newState = {
          attempts: validAttempts,
          blockedUntil: stillBlocked ? prev.blockedUntil : undefined,
        };

        // Only save if state changed
        if (
          validAttempts.length !== prev.attempts.length ||
          newState.blockedUntil !== prev.blockedUntil
        ) {
          saveState(newState);
        }

        return newState;
      });
    };

    // Run cleanup immediately and then every second
    cleanup();
    updateTimerRef.current = setInterval(cleanup, 1000);

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, [windowMs, saveState]);

  // Calculate current rate limit status
  const validAttempts = state.attempts.filter(
    (timestamp) => now - timestamp < windowMs
  );

  const isBlocked = Boolean(state.blockedUntil && state.blockedUntil > now);
  const canAttempt = !isBlocked && validAttempts.length < maxAttempts;
  const remainingAttempts = Math.max(0, maxAttempts - validAttempts.length);

  // Calculate cooldown
  let cooldownRemaining = 0;
  if (isBlocked && state.blockedUntil) {
    cooldownRemaining = Math.max(0, state.blockedUntil - now);
  } else if (validAttempts.length > 0 && !canAttempt) {
    // Time until oldest attempt expires
    const oldestAttempt = Math.min(...validAttempts);
    cooldownRemaining = Math.max(0, oldestAttempt + windowMs - now);
  }

  // Format cooldown as MM:SS
  const formatCooldown = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Record an attempt
  const recordAttempt = useCallback((): boolean => {
    const currentTime = Date.now();

    // Check if blocked
    if (state.blockedUntil && state.blockedUntil > currentTime) {
      return false;
    }

    // Filter valid attempts
    const currentValidAttempts = state.attempts.filter(
      (timestamp) => currentTime - timestamp < windowMs
    );

    // Check if at limit
    if (currentValidAttempts.length >= maxAttempts) {
      // Block for the window duration
      const newState: RateLimitState = {
        attempts: currentValidAttempts,
        blockedUntil: currentTime + windowMs,
      };
      setState(newState);
      saveState(newState);
      return false;
    }

    // Record the attempt
    const newAttempts = [...currentValidAttempts, currentTime];
    const newState: RateLimitState = {
      attempts: newAttempts,
      blockedUntil: state.blockedUntil,
    };

    setState(newState);
    saveState(newState);

    return true;
  }, [state, windowMs, maxAttempts, saveState]);

  // Reset rate limit
  const reset = useCallback(() => {
    const newState: RateLimitState = { attempts: [] };
    setState(newState);
    saveState(newState);
  }, [saveState]);

  return {
    canAttempt,
    remainingAttempts,
    cooldownRemaining,
    cooldownFormatted: formatCooldown(cooldownRemaining),
    recordAttempt,
    reset,
    isBlocked,
  };
}

/**
 * Create a custom rate limit configuration
 */
export function createRateLimitConfig(
  maxAttempts: number,
  windowMs: number,
  storageKey: string,
  persist = true
): RateLimitConfig {
  return { maxAttempts, windowMs, storageKey, persist };
}

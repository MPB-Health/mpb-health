/**
 * Shared structured logger for Supabase Edge Functions.
 *
 * Provides consistent log formatting with function name prefixes and
 * log-level methods. All output goes through the appropriate console
 * method so Supabase's log infrastructure captures it correctly.
 *
 * Usage:
 *   import { createLogger } from '../_shared/logger.ts';
 *   const log = createLogger('my-function');
 *   log.info('Processing request', { id: '123' });
 *   log.error('Something failed', error);
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  /** Debug-level messages (stripped in production-like environments). */
  debug(message: string, data?: unknown): void;
  /** Informational messages for normal operations. */
  info(message: string, data?: unknown): void;
  /** Warnings that don't prevent operation but deserve attention. */
  warn(message: string, data?: unknown): void;
  /** Errors that indicate a failure. */
  error(message: string, data?: unknown): void;
}

/**
 * Create a namespaced logger for an edge function.
 *
 * @param functionName  The edge function name used as a log prefix,
 *                      e.g. 'receive-crm-email'.
 */
export function createLogger(functionName: string): Logger {
  const prefix = `[${functionName}]`;

  function format(message: string, data?: unknown): unknown[] {
    if (data !== undefined) {
      return [prefix, message, data];
    }
    return [prefix, message];
  }

  return {
    debug(message: string, data?: unknown): void {
      console.debug(...format(message, data));
    },
    info(message: string, data?: unknown): void {
      console.info(...format(message, data));
    },
    warn(message: string, data?: unknown): void {
      console.warn(...format(message, data));
    },
    error(message: string, data?: unknown): void {
      console.error(...format(message, data));
    },
  };
}

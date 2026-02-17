/**
 * Client-side conditional logger.
 *
 * Logs are only emitted when running in a development environment
 * (Vite's `import.meta.env.DEV`). In production builds the calls
 * are effectively no-ops, and Vite's terser config (`pure_funcs`)
 * will tree-shake them entirely.
 *
 * Usage:
 *   import { logger } from '@mpbhealth/utils';
 *   logger.info('Component mounted', { id });
 *   logger.error('Fetch failed', error);
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

function isDev(): boolean {
  try {
    // Vite environment — cast to avoid needing vite/client types at build time
    const meta = import.meta as unknown as { env?: Record<string, unknown> };
    if (meta.env?.DEV === true) return true;
  } catch {
    // import.meta.env not available
  }
  try {
    // Fallback for non-Vite / SSR environments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;
    if (g.process?.env?.NODE_ENV === 'development') return true;
  } catch {
    // process not available
  }
  return false;
}

/**
 * Create a namespaced logger that only emits in development.
 *
 * @param namespace  Optional prefix for all log messages, e.g. 'supabase' or 'RateEngine'.
 */
export function createClientLogger(namespace?: string): Logger {
  const prefix = namespace ? `[${namespace}]` : '';

  function noop(): void {
    /* intentionally empty */
  }

  function makeHandler(method: 'debug' | 'info' | 'warn' | 'error') {
    return (message: string, ...args: unknown[]): void => {
      if (!isDev()) return;
      const fn = console[method] || console.log;
      if (prefix) {
        fn(prefix, message, ...args);
      } else {
        fn(message, ...args);
      }
    };
  }

  return {
    debug: makeHandler('debug'),
    info: makeHandler('info'),
    warn: makeHandler('warn'),
    error: makeHandler('error'),
  };
}

/** Default logger instance (no namespace). */
export const logger: Logger = createClientLogger();

/**
 * Timeout and cancellation helpers for portal-critical async work.
 * Timeouts reject with TimeoutError; the underlying promise is not aborted unless you pass AbortSignal.
 */

export class TimeoutError extends Error {
  constructor(message = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export function isTimeoutError(e: unknown): e is TimeoutError {
  return e instanceof TimeoutError;
}

/**
 * Race `promise` against a timer; clears the timer when the promise settles.
 * Note: this does **not** cancel the underlying work — combine with `AbortSignal`
 * for fetch APIs that support it, and ignore late results with a `cancelled` flag in React.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label = 'operation'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new TimeoutError(`${label} timed out after ${ms}ms`));
    }, ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

/**
 * Links an AbortSignal to a timeout. Call abortCleanup() in useEffect cleanup to clear the timer.
 */
export function abortAfterMs(ms: number): { signal: AbortSignal; abortCleanup: () => void } {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    abortCleanup: () => clearTimeout(t),
  };
}

/**
 * Tiny line-prefixed logger so cutover output is grep-friendly.
 *
 * Format: `[provider] level message {json}`
 *
 * No deps; safe to import from any one-shot script.
 */

type Level = 'info' | 'warn' | 'error' | 'success';

const LEVEL_TAG: Record<Level, string> = {
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERROR',
  success: 'OK   ',
};

export interface Logger {
  info(msg: string, data?: unknown): void;
  warn(msg: string, data?: unknown): void;
  error(msg: string, data?: unknown): void;
  ok(msg: string, data?: unknown): void;
  step(n: number, total: number, msg: string): void;
}

function emit(scope: string, level: Level, msg: string, data?: unknown): void {
  const tag = LEVEL_TAG[level];
  const head = `[${scope}] ${tag} ${msg}`;
  if (data === undefined) {
    console.log(head);
  } else {
    let body: string;
    try {
      body = typeof data === 'string' ? data : JSON.stringify(data);
    } catch {
      body = String(data);
    }
    console.log(`${head} ${body}`);
  }
}

export function createLogger(scope: string): Logger {
  return {
    info(msg, data) {
      emit(scope, 'info', msg, data);
    },
    warn(msg, data) {
      emit(scope, 'warn', msg, data);
    },
    error(msg, data) {
      emit(scope, 'error', msg, data);
    },
    ok(msg, data) {
      emit(scope, 'success', msg, data);
    },
    step(n, total, msg) {
      emit(scope, 'info', `(${n}/${total}) ${msg}`);
    },
  };
}

import { useState, useCallback, useRef, useEffect } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseSaveStatusOptions {
  resetAfterMs?: number;
}

/**
 * Tracks the lifecycle of a save operation.
 * Status transitions: idle → saving → saved|error → idle (after timeout).
 */
export function useSaveStatus(options: UseSaveStatusOptions = {}) {
  const { resetAfterMs = 3000 } = options;
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const scheduleReset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStatus('idle');
      setErrorMessage(null);
    }, resetAfterMs);
  }, [resetAfterMs]);

  const markSaving = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('saving');
    setErrorMessage(null);
  }, []);

  const markSaved = useCallback(() => {
    setStatus('saved');
    setErrorMessage(null);
    scheduleReset();
  }, [scheduleReset]);

  const markError = useCallback((message?: string) => {
    setStatus('error');
    setErrorMessage(message || 'Save failed');
    scheduleReset();
  }, [scheduleReset]);

  /**
   * Wraps an async save function with status tracking.
   * Returns the result or re-throws on error.
   */
  const withSaveStatus = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      markSaving();
      try {
        const result = await fn();
        markSaved();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Save failed';
        markError(message);
        throw err;
      }
    },
    [markSaving, markSaved, markError],
  );

  return {
    status,
    errorMessage,
    isSaving: status === 'saving',
    isSaved: status === 'saved',
    isError: status === 'error',
    markSaving,
    markSaved,
    markError,
    withSaveStatus,
  };
}

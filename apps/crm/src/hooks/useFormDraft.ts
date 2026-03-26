import { useEffect, useCallback, useRef } from 'react';

const DRAFT_PREFIX = 'mpb_crm_draft_';

/**
 * Persists form data to localStorage as a draft, protecting against
 * browser crashes, accidental tab closes, and session timeouts.
 *
 * - Saves automatically on a debounced interval after changes
 * - Restores on mount if a draft exists
 * - Clears draft on explicit discard or successful save
 */
export function useFormDraft<T extends Record<string, unknown>>(
  draftKey: string,
  values: T,
  options: {
    enabled?: boolean;
    debounceMs?: number;
    onRestore?: (draft: T) => void;
  } = {},
) {
  const { enabled = true, debounceMs = 1500, onRestore } = options;
  const fullKey = DRAFT_PREFIX + draftKey;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const hasRestoredRef = useRef(false);

  // Restore draft on mount (once)
  useEffect(() => {
    if (!enabled || hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    try {
      const raw = localStorage.getItem(fullKey);
      if (raw) {
        const draft = JSON.parse(raw) as T;
        onRestore?.(draft);
      }
    } catch {
      localStorage.removeItem(fullKey);
    }
  }, [enabled, fullKey, onRestore]);

  // Auto-save draft on change
  useEffect(() => {
    if (!enabled) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(fullKey, JSON.stringify(values));
      } catch {
        // localStorage full or unavailable — silently skip
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, fullKey, values, debounceMs]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(fullKey);
  }, [fullKey]);

  const hasDraft = useCallback(() => {
    return localStorage.getItem(fullKey) !== null;
  }, [fullKey]);

  return { clearDraft, hasDraft };
}

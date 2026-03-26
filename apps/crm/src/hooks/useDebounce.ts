import { useState, useEffect } from 'react';

/**
 * Debounces a value by the specified delay in milliseconds.
 * Returns the debounced value which updates only after the delay has passed
 * since the last change.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

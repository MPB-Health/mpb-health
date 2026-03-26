import { useEffect, useRef, useCallback } from 'react';

/**
 * Tracks dirty state for a form and warns the user before navigating away
 * or closing the browser tab with unsaved changes.
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}

/**
 * Returns a `dirty` flag and helpers to track whether a form has been
 * modified from its initial values.  Lighter than diffing the whole form
 * state — just flips on the first edit.
 */
export function useDirtyFlag(isOpen: boolean) {
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      dirtyRef.current = false;
    }
  }, [isOpen]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  const confirmClose = useCallback((onClose: () => void) => {
    if (dirtyRef.current) {
      const ok = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!ok) return;
    }
    dirtyRef.current = false;
    onClose();
  }, []);

  return { markDirty, confirmClose, dirtyRef };
}

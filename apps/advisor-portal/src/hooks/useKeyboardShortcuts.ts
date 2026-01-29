// ============================================================================
// useKeyboardShortcuts — Global keyboard shortcut handler
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

type ShortcutHandler = () => void;

interface KeyboardShortcutsState {
  showShortcutsModal: boolean;
  setShowShortcutsModal: (show: boolean) => void;
}

// Navigation shortcuts (G then key)
const NAV_SHORTCUTS: Record<string, string> = {
  d: '/', // Dashboard
  l: '/leads', // Leads
  i: '/inbox', // Inbox
  p: '/power-list', // Power List
  s: '/settings', // Settings
  a: '/analytics', // Analytics
  c: '/compliance', // Compliance
  t: '/training', // Training
  m: '/meetings', // Meetings
};

export function useKeyboardShortcuts(): KeyboardShortcutsState {
  const navigate = useNavigate();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [awaitingNavKey, setAwaitingNavKey] = useState(false);

  // Reset nav key timeout
  useEffect(() => {
    if (awaitingNavKey) {
      const timeout = setTimeout(() => setAwaitingNavKey(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [awaitingNavKey]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) return;

      // Check for meta/ctrl key combos first (handled elsewhere)
      if (event.metaKey || event.ctrlKey) return;

      // Handle navigation shortcuts (G then key)
      if (awaitingNavKey) {
        const navPath = NAV_SHORTCUTS[event.key.toLowerCase()];
        if (navPath) {
          event.preventDefault();
          navigate(navPath);
        }
        setAwaitingNavKey(false);
        return;
      }

      // Start navigation sequence
      if (event.key.toLowerCase() === 'g' && !event.shiftKey) {
        setAwaitingNavKey(true);
        return;
      }

      // Show keyboard shortcuts help with ?
      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault();
        setShowShortcutsModal(true);
        return;
      }
    },
    [awaitingNavKey, navigate]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    showShortcutsModal,
    setShowShortcutsModal,
  };
}

export default useKeyboardShortcuts;

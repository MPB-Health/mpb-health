// ============================================================================
// Keyboard Shortcuts Component
// Keyboard navigation and shortcuts help modal
// ============================================================================

import { useEffect, useCallback } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Modal } from '../Modal';
import { useDashboardStore } from '../../contexts/DashboardContext';
import { useOrg } from '../../contexts/OrgContext';

// ============================================================================
// Types
// ============================================================================

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: 'general' | 'edit' | 'navigation';
}

// ============================================================================
// Shortcut Definitions
// ============================================================================

const SHORTCUTS: Shortcut[] = [
  // General
  { keys: ['E'], description: 'Toggle edit mode', category: 'general' },
  { keys: ['A'], description: 'Add widget (in edit mode)', category: 'general' },
  { keys: ['R'], description: 'Refresh all widgets', category: 'general' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'general' },
  { keys: ['Esc'], description: 'Exit edit mode / close modals', category: 'general' },

  // Edit mode
  { keys: ['Ctrl', 'S'], description: 'Save layout', category: 'edit' },
  { keys: ['Ctrl', 'Z'], description: 'Undo last change', category: 'edit' },
  { keys: ['Del'], description: 'Remove selected widget', category: 'edit' },

  // Navigation
  { keys: ['↑', '↓', '←', '→'], description: 'Navigate between widgets', category: 'navigation' },
  { keys: ['Enter'], description: 'Select focused widget', category: 'navigation' },
  { keys: ['Tab'], description: 'Move to next widget', category: 'navigation' },
];

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  edit: 'Edit Mode',
  navigation: 'Navigation',
};

// ============================================================================
// Keyboard Shortcuts Hook
// ============================================================================

export function useKeyboardShortcuts() {
  const { activeOrgId } = useOrg();
  const {
    editMode,
    toggleEditMode,
    saveLayout,
    selectedWidgetId,
    removeWidget,
    selectWidget,
    widgets,
  } = useDashboardStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const isCtrl = event.ctrlKey || event.metaKey;

      // Global shortcuts
      switch (key) {
        case 'e':
          if (!isCtrl) {
            event.preventDefault();
            toggleEditMode();
          }
          break;

        case 'escape':
          if (editMode) {
            event.preventDefault();
            toggleEditMode();
          }
          break;

        case 'r':
          if (!isCtrl) {
            event.preventDefault();
            window.dispatchEvent(new CustomEvent('dashboard:refresh'));
          }
          break;

        case 's':
          if (isCtrl && editMode && activeOrgId) {
            event.preventDefault();
            saveLayout(activeOrgId);
          }
          break;

        case 'delete':
        case 'backspace':
          if (editMode && selectedWidgetId) {
            event.preventDefault();
            removeWidget(selectedWidgetId);
          }
          break;

        // Arrow key navigation
        case 'arrowup':
        case 'arrowdown':
        case 'arrowleft':
        case 'arrowright':
          if (editMode && widgets.length > 0) {
            event.preventDefault();
            navigateWidgets(key, widgets, selectedWidgetId, selectWidget);
          }
          break;
      }
    },
    [
      editMode,
      toggleEditMode,
      saveLayout,
      activeOrgId,
      selectedWidgetId,
      removeWidget,
      widgets,
      selectWidget,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// ============================================================================
// Navigation Helper
// ============================================================================

function navigateWidgets(
  direction: string,
  widgets: { instanceId: string }[],
  selectedId: string | null,
  selectWidget: (id: string | null) => void
) {
  if (widgets.length === 0) return;

  const currentIndex = selectedId
    ? widgets.findIndex((w) => w.instanceId === selectedId)
    : -1;

  let nextIndex: number;

  switch (direction) {
    case 'arrowup':
    case 'arrowleft':
      nextIndex = currentIndex <= 0 ? widgets.length - 1 : currentIndex - 1;
      break;
    case 'arrowdown':
    case 'arrowright':
      nextIndex = currentIndex >= widgets.length - 1 ? 0 : currentIndex + 1;
      break;
    default:
      return;
  }

  selectWidget(widgets[nextIndex].instanceId);
}

// ============================================================================
// Keyboard Shortcuts Help Modal
// ============================================================================

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const groupedShortcuts = SHORTCUTS.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, Shortcut[]>
  );

  return (
    <Modal open={isOpen}
        title="Keyboard Shortcuts" onClose={onClose} size="md">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Keyboard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              <p className="text-sm text-th-text-secondary">Quick actions for power users</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-th-text-secondary" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-th-text-secondary uppercase tracking-wider mb-3">
                {CATEGORY_LABELS[category] || category}
              </h3>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-th-text-primary">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd className="px-2 py-1 text-xs font-mono bg-surface-tertiary border border-th-border rounded">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-th-text-tertiary">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default KeyboardShortcutsHelp;

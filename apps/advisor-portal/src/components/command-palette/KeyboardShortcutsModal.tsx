// ============================================================================
// Keyboard Shortcuts Modal — Shows all available keyboard shortcuts
// ============================================================================

import { X, Keyboard } from 'lucide-react';

interface ShortcutGroup {
  name: string;
  shortcuts: { keys: string; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    name: 'General',
    shortcuts: [
      { keys: '⌘ K', description: 'Open search' },
      { keys: '⌘ ⇧ P', description: 'Open command palette' },
      { keys: 'Esc', description: 'Close modals / cancel' },
      { keys: '?', description: 'Show keyboard shortcuts' },
    ],
  },
  {
    name: 'Navigation',
    shortcuts: [
      { keys: 'G then D', description: 'Go to Dashboard' },
      { keys: 'G then L', description: 'Go to Leads' },
      { keys: 'G then I', description: 'Go to Inbox' },
      { keys: 'G then P', description: 'Go to Power List' },
      { keys: 'G then S', description: 'Go to Settings' },
    ],
  },
  {
    name: 'Actions',
    shortcuts: [
      { keys: 'C', description: 'Create new (context-dependent)' },
      { keys: 'E', description: 'Edit selected item' },
      { keys: 'D', description: 'Delete selected item' },
      { keys: '⌘ Enter', description: 'Submit form / send message' },
    ],
  },
  {
    name: 'List Navigation',
    shortcuts: [
      { keys: 'J / ↓', description: 'Move down' },
      { keys: 'K / ↑', description: 'Move up' },
      { keys: 'Enter', description: 'Open selected' },
      { keys: 'X', description: 'Select / deselect item' },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50">
        <div className="bg-surface-primary rounded-xl shadow-2xl border border-th-border-primary overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-th-border-primary">
            <div className="flex items-center gap-3">
              <Keyboard className="w-5 h-5 text-th-accent-600" />
              <h2 className="text-lg font-semibold text-th-text-primary">
                Keyboard Shortcuts
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-th-text-muted hover:text-th-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.name}>
                  <h3 className="text-sm font-semibold text-th-text-primary mb-3">
                    {group.name}
                  </h3>
                  <div className="space-y-2">
                    {group.shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.description}
                        className="flex items-center justify-between py-1.5"
                      >
                        <span className="text-sm text-th-text-secondary">
                          {shortcut.description}
                        </span>
                        <kbd className="text-xs font-mono bg-surface-secondary text-th-text-primary px-2 py-1 rounded border border-th-border-primary">
                          {shortcut.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-th-border-primary bg-surface-secondary">
            <p className="text-xs text-th-text-muted text-center">
              Press <kbd className="px-1.5 py-0.5 bg-surface-primary rounded border border-th-border-primary font-mono">?</kbd> anywhere to show this dialog
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Quick Actions Widget
// Shortcuts to common CRM actions
// ============================================================================

import { useState } from 'react';
import { UserPlus, CheckSquare, Phone, StickyNote, Calendar, Mail } from 'lucide-react';
import type { BaseWidgetProps } from '../types';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

// ============================================================================
// Action Configuration
// ============================================================================

interface QuickAction {
  id: string;
  label: string;
  icon: typeof UserPlus;
  color: string;
  description: string;
}

const ACTIONS: QuickAction[] = [
  { id: 'add-lead', label: 'Add Lead', icon: UserPlus, color: 'blue', description: 'Create a new lead' },
  { id: 'add-task', label: 'Add Task', icon: CheckSquare, color: 'blue', description: 'Schedule a task' },
  { id: 'log-call', label: 'Log Call', icon: Phone, color: 'green', description: 'Record a call' },
  { id: 'add-note', label: 'Add Note', icon: StickyNote, color: 'yellow', description: 'Quick note' },
  { id: 'add-event', label: 'Add Event', icon: Calendar, color: 'blue', description: 'Schedule event' },
  { id: 'send-email', label: 'Send Email', icon: Mail, color: 'cyan', description: 'Compose email' },
];

const COLOR_CLASSES: Record<string, { bg: string; hover: string; text: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/50', text: 'text-blue-600' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/50', text: 'text-blue-600' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', hover: 'hover:bg-green-200 dark:hover:bg-green-900/50', text: 'text-green-600' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-900/50', text: 'text-yellow-600' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/50', text: 'text-blue-600' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', hover: 'hover:bg-cyan-200 dark:hover:bg-cyan-900/50', text: 'text-cyan-600' },
};

// ============================================================================
// Quick Actions Widget Component
// ============================================================================

export default function QuickActionsWidget({ size }: BaseWidgetProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const displayActions = size === 'sm' ? ACTIONS.slice(0, 4) : size === 'md' ? ACTIONS.slice(0, 6) : ACTIONS;

  const handleAction = (actionId: string) => {
    // Dispatch event to open the appropriate modal
    window.dispatchEvent(new CustomEvent('crm:quick-action', { detail: { action: actionId } }));
    setActiveModal(actionId);
  };

  return (
    <div className="p-4">
      <div
        className={cn(
          'grid gap-3',
          size === 'full' ? 'grid-cols-6' : size === 'lg' ? 'grid-cols-4' : 'grid-cols-3'
        )}
      >
        {displayActions.map((action) => {
          const colors = COLOR_CLASSES[action.color] || COLOR_CLASSES.blue;
          const Icon = action.icon;

          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl transition-all',
                colors.bg,
                colors.hover,
                'hover:shadow-md hover:-translate-y-0.5'
              )}
            >
              <div className={cn('p-2 rounded-lg bg-white/50 dark:bg-black/20', colors.text)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
              {size !== 'sm' && (
                <span className="text-xs text-gray-500">{action.description}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
